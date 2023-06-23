const Util = require("../common-util");
const Commands = module.exports;
const SSOUtils = require('../sso-utils');

const checkConfig = (Env) => {
    return Env && Env.sso && Env.sso.enabled && Array.isArray(Env.sso.list) && Env.sso.list.length;
};
const getProviderConfig = (Env, provider) => {
    if (!checkConfig) { return; }
    if (!provider) { return; }
    const data = Env.sso.list.find((cfg) => { return cfg.name === provider; });
    return data;
};

const TYPES = SSOUtils.TYPES;

const isValidConfig = (cfg) => {
    if (!cfg) { return; }
    if (!cfg.type) { return; }
    const type = cfg.type.toLowerCase();
    const idp = TYPES[type];
    if (!idp) { return; }
    return idp.checkConfig(cfg);
};

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

        const { url, token } = obj;

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
        console.log('stored', data.publicKey);
        console.log('used', publicKey);
        if (publicKey !== data.publicKey) { return void cb('WRONG_SIGNATURE_KEYS'); }
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
        idp.authCb(Env, cfg, ssotoken, url, (err, obj) => {
            if (err) { return void cb(err); }
            const {id, idpData} = obj;
            console.log(id, idpData);
            SSOUtils.makeUser(Env, id, (err, userData) => {
                if (err) { return void cb(err); }

                // TODO
                // makeTempSession()

                cb(void 0, { state: true });
            });

        });
    });
};

