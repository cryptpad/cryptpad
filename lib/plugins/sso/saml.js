const { SAML } = require('@node-saml/node-saml');
const SSOUtils = require('../../sso-utils');

const TYPE = 'saml';

/*
// XXX XXX XXX SAML TEST

* get metadata with "saml.generateServiceProviderMetadata()"
* test site: https://samltest.id/upload.php
  * upload metadata there
* redirected to cryptpad with a POST to /ssoauth handled in http-worker.js





*/



const opts = SSOUtils.getOptions();
const getClient = (cfg, cb) => {
    console.log(SAML);
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
                console.log(url); // XXX XXX XXX write_request not useful here?
                cb(void 0, { url: url/*, token: code_verifier*/ });
            });
        });
    },
    authCb: (Env, cfg, token, url, cb) => {
    },
};
