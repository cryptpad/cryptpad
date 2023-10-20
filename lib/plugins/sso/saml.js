const { SAML } = require('@node-saml/node-saml');
const SSOUtils = require('../../sso-utils');
const Util = require("../../common-util");

const TYPE = 'saml';

/*
// XXX XXX XXX SAML TEST

* get metadata with "saml.generateServiceProviderMetadata()"
* test site: https://samltest.id/upload.php
  * upload metadata there
* redirected to cryptpad with a POST to /ssoauth handled in http-worker.js





*/

const nameRef = 'urn:oid:2.16.840.1.113730.3.1.241';


const opts = SSOUtils.getOptions();
const getClient = (cfg, cb) => {
    const saml = new SAML({
        callbackUrl: opts.callbackURL,
        entryPoint: cfg.url,
        issuer: cfg.issuer,
        cert: cfg.cert,
    });
    cb(void 0, saml);
};
module.exports = {
    type: TYPE,
    checkConfig: (cfg) => {
        return cfg.url && cfg.issuer && cfg.cert;
    },
    auth: (Env, cfg, cb) => {
        getClient(cfg, (err, client) => {
            if (err) { return void cb ('E_OIDC_CONNECT'); }
            client.getAuthorizeUrlAsync().then((url) => {
                cb(void 0, { url: url });
            });
        });
    },
    authCb: (Env, cfg, token, url, cookies, cb) => {
        const samltoken = cookies.samltoken;
        if (!samltoken) { return void cb('NO_COOKIE'); }
        SSOUtils.readRequest(Env, samltoken, (err, value) => {
            SSOUtils.deleteRequest(Env, samltoken);
            if (err || !value) { return void cb('EINVAL'); }
            const data = Util.tryParse(value);

            getClient(cfg, (err, client) => {
                if (err) { return void cb ('E_OIDC_CONNECT'); }
                client.validatePostResponseAsync({
                    SAMLResponse: data.content
                }).then((data) => {
                    if (!data || data.loggedOut || !data.profile || !data.profile.nameID) {
                        return void cb('EINVAL');
                    }
                    cb(void 0, {
                        id: data.profile.nameID,
                        name: data.profile[nameRef] || data.profile.nameID,
                        idpData: {}
                    });
                });
            });
        });
    },
};
