const OID = require('openid-client');

const TYPE = 'oidc';

const getClient = (cfg, cb) => {
    OID.Issuer.discover(cfg.url).then((issuer) => { // XXX Only once for all users?
        const client = new issuer.Client({
            client_id: cfg.client_id,
            client_secret: cfg.client_secret,
            redirect_uris: ['http://localhost:3000/ssoauth'], // XXX Use httpUnsafeOrigin or...
            response_types: ['code'],
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
                scope: 'openid email profile',// https://www.googleapis.com/auth/contacts.readonly', // https://www.google.com/m8/feeds
                resource: 'http://localhost:3000/ssoauth/',
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
            client.callback('http://localhost:3000/ssoauth', params, { code_verifier: token })
                    .then((tokenSet) => {
                let j = tokenSet;
                let c = tokenSet.claims();
                cb(void 0, {
                    id: c.sub,
                    name: c.name,
                    idpData: {
                        expires_at: j.expires_at,
                        access_token: j.access_token,
                        refresh_token: j.refresh_token,
                        //id_token: j.id_token // XXX no need to store id_token?
                    }
                });
            });
        });
    },
    /*
    getData: (Env, cfg, data, cb) => {
        // data = { refresh_token, access_token, expires_at }
        let t = new OID.TokenSet(data);
        // TODO get userinfo using access_token
        // use refresh_token if access expired
    }
    */
};
