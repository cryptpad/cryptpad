// Docker overrides

let infra = {};
try {
    infra = require('./infra');
}
catch (e) {
    infra = require('./infra.example');
}

infra.public.origin = process.env.CPAD_MAIN_DOMAIN;
infra.public.sandboxOrigin = process.env.CPAD_SANDBOX_DOMAIN;
infra.public.httpHost = '0.0.0.0';
["front", "core", "storage"].forEach(nodeType => {
    for (const nodeIdx in infra[nodeType]) {
        infra[nodeType][nodeIdx].host = '0.0.0.0';
    }
});
module.exports = infra;
