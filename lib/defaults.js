var Default = module.exports;

Default.commonCSP = function (domain) {
    // Content-Security-Policy
    return [
        "default-src 'none'",
        "style-src 'unsafe-inline' 'self' " + domain,
        "font-src 'self' data:" + domain,

        /*  child-src is used to restrict iframes to a set of allowed domains.
         *  connect-src is used to restrict what domains can connect to the websocket.
         *
         *  it is recommended that you configure these fields to match the
         *  domain which will serve your CryptPad instance.
         */
        "child-src blob: *",
        // IE/Edge
        "frame-src blob: *",

        /*  this allows connections over secure or insecure websockets
            if you are deploying to production, you'll probably want to remove
            the ws://* directive, and change '*' to your domain
         */
        "connect-src 'self' ws: wss: blob:" + domain,

        // data: is used by codemirror
        "img-src 'self' data: blob:" + domain,
        "media-src * blob:",

        // for accounts.cryptpad.fr authentication and cross-domain iframe sandbox
        "frame-ancestors *",
        ""
    ];
};

Default.contentSecurity = function (domain) {
    return Default.commonCSP(domain).join('; ') + "script-src 'self'" + domain;
};

Default.padContentSecurity = function (domain) {
    return Default.commonCSP(domain).join('; ') + "script-src 'self' 'unsafe-eval' 'unsafe-inline'" + domain;
};

Default.httpHeaders = function () {
    return {
        "X-XSS-Protection": "1; mode=block",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*"
    };
};

Default.mainPages = function () {
    return [
        'index',
        'privacy',
        'terms',
        'about',
        'contact',
        'what-is-cryptpad',
        'features',
        'faq',
        'maintenance'
    ];
};

