const SSO = require("./storage/sso");
const Nacl  = require("tweetnacl/nacl-fast");

const SSOUtils = module.exports;

// XXX const SAML = require('node-saml'); // https://www.npmjs.com/package/node-saml
SSOUtils.TYPES = {
    oidc: require('./plugins/sso/oidc')
};


SSOUtils.deleteRequest = (Env, id) => {
    SSO.request.delete(Env, id, (err) => {
        if (!err) { return; }
        console.log(`Failed to delete SSO request ${id}`);
        // XXX log?
    });
};
SSOUtils.readRequest = (Env, id, cb) => {
    SSO.request.read(Env, id, cb);
};
SSOUtils.writeRequest = (Env, data, cb) => {
    if (!data || !data.id || !data.type) { return void cb ('INVALID_REQUEST'); }
    const id = data.id;
    const value = {
        type: data.type,
        register: data.register,
        provider: data.provider,
        publicKey: data.publicKey,
        time: +new Date()
    };

    SSO.request.write(Env, id, JSON.stringify(value), cb);
};


SSOUtils.makeUser = (Env, id, cb) => {
    const seed = Nacl.util.encodeBase64(Nacl.util.randomBytes(24));
    SSO.User.write(Env, id, JSON.stringify({
        seed: seed,
        password: false // XXX maybe we don't need that flag, we can check if the block exists later
    }), (err) => {
        if (err) { return void cb(err); }
        cb(void 0, { seed });
    });

};

SSOUtils.makeSession = (Env, publicKey, provider, ssoData, cb) => {
    const sessionId = Sessions.randomId();
    // XXX If we already have an OTP session, recover it
    Sessions.write(Env, publicKey, sessionId, JSON.stringify({
        sso: {
            provider: provider,
            data: ssoData
        }
    }), function (err) {
        if (err) {
            Env.Log.error("SSO_SESSION_WRITE", {
                error: Util.serializeError(err),
                publicKey: publicKey,
                sessionId: sessionId,
            });
            return void cb("SESSION_WRITE_ERROR");
        }
        cb(void 0, {
            bearer: sessionId,
        });
    });

};
