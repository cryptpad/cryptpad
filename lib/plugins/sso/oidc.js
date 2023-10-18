const OID = require('openid-client');
const SSOUtils = require('../../sso-utils');

const TYPE = 'oidc';

const opts = SSOUtils.getOptions();
const getClient = (cfg, cb) => {
    OID.Issuer.discover(cfg.url).then((issuer) => { // XXX Only once for all users?
        let alg = cfg.jwt_alg || 'PS256';
        if (Array.isArray(issuer.id_token_signing_alg_values_supported) &&
            !issuer.id_token_signing_alg_values_supported.includes(alg)) {
            alg = issuer.id_token_signing_alg_values_supported[0] || 'RS256';
        }
        const client = new issuer.Client({
            client_id: cfg.client_id,
            client_secret: cfg.client_secret,
            redirect_uris: [opts.callbackURL],
            response_types: ['code'],
            id_token_signed_response_alg: alg
        });
        cb(void 0, client);
    }, (err) => {
        cb(err);
    });
};
module.exports = {
    type: TYPE,
    checkConfig: (cfg) => {
        return cfg.url && cfg.client_id && cfg.client_secret;
    },
    auth: (Env, cfg, cb) => {
        getClient(cfg, (err, client) => {
            if (err) { return void cb ('E_OIDC_CONNECT'); }

            const generators = OID.generators;
            const code_verifier = generators.codeVerifier();
            const code_challenge = generators.codeChallenge(code_verifier);
            const url = client.authorizationUrl({
                scope: 'openid email profile',
                resource: opts.callbackURL,
                access_type: 'offline',
                code_challenge,
                code_challenge_method: 'S256',
            });

            cb(void 0, { url: url, token: code_verifier });
        });
    },
    authCb: (Env, cfg, token, url, cb) => {
        getClient(cfg, (err, client) => {
            if (err) { return void cb ('E_OIDC_CONNECT'); }

            const params = client.callbackParams(url);
            delete params.state;
            client.callback('http://localhost:3000/ssoauth', params, { code_verifier: token })
                    .then((tokenSet) => {
                let j = tokenSet;
                let c = tokenSet.claims();
                let name = c.name;
                const end = () => {
                    cb(void 0, {
                        id: c.sub,
                        name: name,
                        idpData: {
                            expires_at: j.expires_at,
                            access_token: j.access_token,
                            refresh_token: j.refresh_token,
                            //id_token: j.id_token // XXX no need to store id_token?
                        }
                    });
                };
                if (name) { return void end(); }
                let t = client.userinfo(j.access_token).then((data) => {
                    name = data.name;
                    end();
                    console.log(t);
                }, (err) => {
                    console.error(err);
                    name = 'Unknown'; // XXX
                    end();
                });
            });
        });
    },
};
