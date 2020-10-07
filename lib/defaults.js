var Default = module.exports;

Default.commonCSP = function (domain) {
    domain = ' ' + domain;
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
    return (Default.commonCSP(domain).join('; ') + "script-src 'self' resource: " + domain).replace(/\s+/g, ' ');
};

Default.padContentSecurity = function (domain) {
    return (Default.commonCSP(domain).join('; ') + "script-src 'self' 'unsafe-eval' 'unsafe-inline' resource: " + domain).replace(/\s+/g, ' ');
};

Default.httpHeaders = function () {
    return {
        "X-XSS-Protection": "1; mode=block",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": 'cross-origin',
        "Cross-Origin-Opener-Policy": 'same-origin',
        "Cross-Origin-Embedder-Policy": 'require-corp',
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

/*  By default the CryptPad server will run scheduled tasks every five minutes
 *  If you want to run scheduled tasks in a separate process (like a crontab)
 *  you can disable this behaviour by setting the following value to true
 */
     //disableIntegratedTasks: false,

    /*  CryptPad's file storage adaptor closes unused files after a configurable
     *  number of milliseconds (default 30000 (30 seconds))
     */
//    channelExpirationMs: 30000,

    /*  CryptPad's file storage adaptor is limited by the number of open files.
     *  When the adaptor reaches openFileLimit, it will clean up older files
     */
    //openFileLimit: 2048,




