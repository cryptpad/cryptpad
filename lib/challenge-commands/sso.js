const Util = require("../common-util");
const Commands = module.exports;
const SSOUtils = require('../sso-utils');
const nThen = require("nthen");
const BlockStore = require("../storage/block");
const Block = require("../commands/block");

const TYPES = SSOUtils.TYPES;
const checkConfig = SSOUtils.checkConfig;
const getProviderConfig = SSOUtils.getProviderConfig;
const isValidConfig = SSOUtils.isValidConfig;


// Create an SSO authentication request
const auth = Commands.SSO_AUTH = function (Env, body, cb) {
    if (!checkConfig(Env)) { return void cb('INVALID_SERVER_CONFIG'); }
    const { provider } = body;
    const cfg = getProviderConfig(Env, provider);
    if (!cfg) { return void cb('UNRECOGNIZED_IDP'); }
    if (!isValidConfig(cfg)) { return void cb('INVALID_IDP_CONFIG'); }

    cb();
};
auth.complete = function (Env, body, cb, req, res) {
    // If we're here it means a valid provider was given. We can start the authentication process
    const { provider, register, publicKey } = body;
    const cfg = getProviderConfig(Env, provider);
    const idp = TYPES[cfg.type.toLowerCase()];
    idp.auth(Env, cfg, (err, obj) => {
        if (err) { return void cb(err); } // TODO log

        let { url, token } = obj;

        if (!token) { token = Util.uid() + Util.uid(); }

        SSOUtils.writeRequest(Env, {
            id: token,
            type: idp.type,
            provider: provider,
            publicKey: publicKey,
            register: Boolean(register)
        }, (err) => {
            if (err) { return void cb("E_REQ_WRITE"); }

            let value = `ssotoken="${token}"; SameSite=Strict; HttpOnly`;
            res.setHeader('Set-Cookie', value);
            cb(void 0, {url: url});
        });
    });
};

// Receive authentication data from the IdP.
// Read the auth request, create a JWT and get a block seed for this SSO user.
const authCb = Commands.SSO_AUTH_CB = function (Env, body, cb, req) {
    if (!checkConfig(Env)) { return void cb('INVALID_SERVER_CONFIG'); }
    const { publicKey } = body;
    const cookies = req.cookies;
    const ssotoken = cookies.ssotoken;
    if (!ssotoken) { return void cb('NO_COOKIE'); }
    SSOUtils.readRequest(Env, ssotoken, (err, value) => {
        if (err) { return void cb('ENOENT'); }
        const data = Util.tryParse(value);
        if (!data || !data.type || !TYPES[data.type]) { return void cb('INVALID_REQUEST_DATA'); }
        if (data.type !== 'saml' && publicKey !== data.publicKey) { return void cb('WRONG_SIGNATURE_KEYS'); }
        cb();
    });
};
authCb.complete = function (Env, body, cb, req) {
    // If we're here it means a valid cookie was given. We can continue the authentication
    const { url } = body;
    const cookies = req.cookies;
    const ssotoken = cookies.ssotoken;
    if (!ssotoken) { return void cb('NO_COOKIE'); }
    SSOUtils.readRequest(Env, ssotoken, (err, value) => {
        SSOUtils.deleteRequest(Env, ssotoken);
        if (err) { return void cb('ENOENT'); }
        const data = Util.tryParse(value);
        const cfg = getProviderConfig(Env, data.provider);
        const idp = TYPES[data.type];
        const register = data.register;
        const provider = data.provider;
        idp.authCb(Env, cfg, ssotoken, url, cookies, (err, obj) => {
            if (err) { return void cb(err); }
            const {id, idpData, name} = obj;

            let next = (user, isRegister) => {
                SSOUtils.createJWT(Env, id, provider, idpData, (err, jwt) => {
                    if (err) { return void cb(err); }
                    cb(void 0, {
                        jwt: jwt,
                        name: name,
                        seed: user.seed,
                        password: Boolean(user.password),
                        register: isRegister
                    });
                });
            };

            if (register) {
                SSOUtils.writeUser(Env, provider, id, (err, userData) => {
                    if (err && err.code === 'EEXIST') {
                        return void SSOUtils.readUser(Env, provider, id, (err, userData) => {
                            if (err) { return void cb(err); }
                            next(userData, !userData.complete);
                        });
                    }
                    if (err) { return void cb(err); }
                    next(userData, true);
                });
            } else {
                SSOUtils.readUser(Env, provider, id, (err, userData) => {
                    if (err) { return void cb(err); }
                    if (!userData || !userData.complete) {
                        return void cb('NO_USER');
                    }
                    next(userData, false);
                });
            }
        });
    });
};

// XXX write block change-password? should be the same as otp but without otp code
const register = Commands.SSO_WRITE_BLOCK = function (Env, body, cb) {
    const { publicKey, content } = body;

    // they must provide a valid block public key
    if (!Block.isValidBlockId(publicKey)) { return void cb("INVALID_KEY"); }
    if (publicKey !== content.publicKey) { return void cb("INVALID_KEY"); }
    const jwt = content.auth;
    if (!jwt) { return void cb('NO_JWT'); }

    BlockStore.isAvailable(Env, publicKey, (err, result) => {
        if (err || result) {
            return void cb(err || 'EEXISTS');
        }
        // No block at this location: continue
        cb();
    });
};
register.complete = function (Env, body, cb) {
    const { publicKey, content } = body;
    const jwt = content.auth;
    const pw = content.hasPassword;
    let payload;
    let ssoUser;
    // XXX UPDATE sso_user add password boolean
    nThen((w) => {
        SSOUtils.checkJWT(Env, jwt, w((err, _payload) => {
            if (err) {
                w.abort();
                return void cb('INVALID_JWT_SIGNATURE');
            }
            payload = _payload;
        }));
    }).nThen((w) => {
        const { sub, provider } = payload;
        SSOUtils.readUser(Env, provider, sub, w((err, user) => {
            if (err) {
                w.abort();
                console.log(err, sub);
                return void cb('SSO_NO_USER');
            }
            ssoUser = user;
        }));
    }).nThen((w) => {
        const { sub, provider } = payload;
        SSOUtils.writeBlock(Env, publicKey, provider, sub, w((err) => {
            if (err) {
                w.abort();
                return void cb('SSO_BLOCK_WRITE');
            }
        }));
    }).nThen((w) => {
        Block.writeLoginBlock(Env, content, w((err) => {
            if (err) { w.abort(); }
        }));
    }).nThen((w) => {
        const { sub, provider } = payload;
        ssoUser.password = Boolean(pw);
        ssoUser.complete = true;
        SSOUtils.updateUser(Env, provider, sub, ssoUser, w());
    }).nThen(() => {
        const { data, sub, provider } = payload;
        let session = Util.clone(data);
        session.id = sub;
        SSOUtils.makeSession(Env, publicKey, provider, session, cb);
    });
};

const login = Commands.SSO_VALIDATE = function (Env, body, cb) {
    const { publicKey, jwt } = body;

    // they must provide a valid block public key
    if (!Block.isValidBlockId(publicKey)) { return void cb("INVALID_KEY"); }
    if (!jwt) { return void cb('NO_JWT'); }

    BlockStore.isAvailable(Env, publicKey, (err, result) => {
        if (err && !result) { return void cb(err); }
        // Block found
        cb();
    });
};
login.complete = function (Env, body, cb) {
    const { publicKey, jwt } = body;

    let payload;
    nThen((w) => {
        SSOUtils.checkJWT(Env, jwt, w((err, _payload) => {
            if (err) {
                w.abort();
                return void cb('INVALID_JWT_SIGNATURE');
            }
            payload = _payload;
        }));
    }).nThen((w) => {
        const { sub, provider } = payload;
        SSOUtils.readUser(Env, provider, sub, w((err) => {
            if (err) {
                w.abort();
                console.log(err, sub);
                return void cb('SSO_NO_USER');
            }
        }));
    }).nThen((w) => {
        SSOUtils.readBlock(Env, publicKey, w((err) => {
            if (err) {
                w.abort();
                return void cb('SSO_BLOCK_WRITE');
            }
        }));
    }).nThen(() => {
        const { data, sub, provider } = payload;
        let session = Util.clone(data);
        session.id = sub;
        SSOUtils.makeSession(Env, publicKey, provider, session, cb);
    });
};

const update = Commands.SSO_UPDATE_BLOCK = function (Env, body, cb) {
    const { publicKey, ancestorProof } = body;

    // they must provide a valid block public key
    if (!Block.isValidBlockId(publicKey)) { return void cb("INVALID_KEY"); }

    let oldKey;
    nThen((w) => {
        BlockStore.isAvailable(Env, publicKey, w((err, result) => {
            if (err && !result) {
                w.abort();
                return void cb(err);
            }
            // Block found: next
        }));
    }).nThen((w) => {
        Block.validateAncestorProof(Env, ancestorProof, w((err, provenKey) => {
            if (err) {
                w.abort();
                return void cb(err);
            }
            // Ancestor found and proven
            oldKey = provenKey;
        }));
    }).nThen(() => {
        SSOUtils.readBlock(Env, oldKey, (err) => {
            if (err) {
                return void cb('INVALID_OLD_BLOCK');
            }
            cb();
        });
    });
};
update.complete = function (Env, body, cb) {
    const { publicKey, ancestorProof } = body;

    // We've already proven that the "proof" is valid so we can extract its key
    const proof = Util.tryParse(ancestorProof);
    const oldKey = proof && proof[0];

    let oldBlock;
    nThen((w) => {
        SSOUtils.readBlock(Env, oldKey, w((err, data) => {
            if (err || !data) {
                w.abort();
                return void cb('INVALID_OLD_BLOCK');
            }
            if (!data.id) {
                w.abort();
                return void cb('INVALID_SSO_BLOCK_CONTENT');
            }
            oldBlock = data;
        }));
    }).nThen((w) => {
        SSOUtils.writeBlock(Env, publicKey, oldBlock.provider, oldBlock.id, w((err) => {
            if (err) {
                w.abort();
                return void cb('SSO_UPDATE_BLOCK_WRITE');
            }
        }));
    }).nThen(() => {
        cb();
    });
};
