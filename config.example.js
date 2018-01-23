/*@flow*/
/*
    globals module
*/
var domain = ' http://localhost:3000/';

// You can `kill -USR2` the node process and it will write out a heap dump.
// If your system doesn't support dumping, comment this out and install with
// `npm install --production`
// See: https://strongloop.github.io/strongloop.com/strongblog/how-to-heap-snapshots/
require('heapdump');

module.exports = {

    // the address you want to bind to, :: means all ipv4 and ipv6 addresses
    // this may not work on all operating systems
    httpAddress: '::',

    // the port on which your httpd will listen

    /*  CryptPad can be configured to send customized HTTP Headers
     *  These settings may vary widely depending on your needs
     *  Examples are provided below
     */

    httpHeaders: {
        "X-XSS-Protection": "1; mode=block",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*"
    },

    contentSecurity: [
        "default-src 'none'",
        "style-src 'unsafe-inline' 'self' " + domain,
        "script-src 'self'" + domain,
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

        "media-src * blob:",

        /*  this allows connections over secure or insecure websockets
            if you are deploying to production, you'll probably want to remove
            the ws://* directive, and change '*' to your domain
         */
        "connect-src 'self' ws: wss: blob:" + domain,

        // data: is used by codemirror
        "img-src 'self' data: blob:" + domain,

        // for accounts.cryptpad.fr authentication and pad2 cross-domain iframe sandbox
        "frame-ancestors *",
    ].join('; '),

    // CKEditor requires significantly more lax content security policy in order to function.
    padContentSecurity: [
        "default-src 'none'",
        "style-src 'unsafe-inline' 'self'" + domain,
        // Unsafe inline, unsafe-eval are needed for ckeditor :(
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'" + domain,
        "font-src 'self'" + domain,

        /*  See above under 'contentSecurity' as to how these values should be
         *  configured for best effect.
         */
        "child-src *",
        // IE/Edge
        "frame-src *",

        // see the comment above in the 'contentSecurity' section
         "connect-src 'self' ws: wss:" + domain,

        // (insecure remote) images are included by users of the wysiwyg who embed photos in their pads
        "img-src * blob:",
    ].join('; '),

    httpPort: 3000,

    // This is for allowing the cross-domain iframe to function when developing
    httpSafePort: 3001,

    // This is for deployment in production, CryptPad uses a separate origin (domain) to host the
    // cross-domain iframe. It can simply host the same content as CryptPad.
    // httpSafeOrigin: "https://some-other-domain.xyz",

    httpUnsafeOrigin: domain,

    /*  your server's websocket url is configurable
     *  (default: '/cryptpad_websocket')
     *
     *  websocketPath can be relative, of the form '/path/to/websocket'
     *  or absolute, specifying a particular URL
     *
     *  'wss://cryptpad.fr:3000/cryptpad_websocket'
     */
    websocketPath: '/cryptpad_websocket',

    /*  CryptPad can log activity to stdout
     *  This may be useful for debugging
     */
    logToStdout: false,

    /*  CryptPad supports verbose logging
     *  (false by default)
     */
     verbose: false,

    /*  Main pages
     *  add exceptions to the router so that we can access /privacy.html
     *  and other odd pages
     */
    mainPages: [
        'index',
        'privacy',
        'terms',
        'about',
        'contact',
        'what-is-cryptpad',
        'features'
    ],

    /*  Limits, Donations, Subscriptions and Contact
     *
     *  By default, CryptPad limits every registered user to 50MB of storage. It also shows a
     *  donate button which allows for making a donation to support CryptPad development.
     *
     *  You can either:
     *    A: Leave it exactly as it is.
     *    B: Hide the donate button.
     *    C: Change the donate button to a subscribe button, people who subscribe will get more
     *       storage on your instance and you get 50% of the revenue earned.
     * 
     *  CryptPad is developed by people who need to live and who deserve an equivilent life to
     *  what they would get at a company which monitizes user data. However, we intend to have
     *  a mutually positive relationship with every one of our users, including you. If you are
     *  getting value from CryptPad, you should be giving equal value back.
     * 
     *  If you are using CryptPad in a business context, please consider taking a support contract
     *  by contacting sales@cryptpad.fr
     *
     *  If you choose A then there's nothing to do.
     *
     *  If you choose B, set this variable to true and it will remove the donate button.
     */
    removeDonateButton: false,
    /*
     *  If you choose C, set allowSubscriptions to true, then set myDomain to the domain which people
     *  use to reach your CryptPad instance. Then contact sales@cryptpad.fr and tell us your domain.
     *  We will tell you what is needed to get paid.
     */
    allowSubscriptions: false,
    myDomain: 'i.did.not.read.my.config.myserver.tld',

    /*
     *  If you are using CryptPad internally and you want to increase the per-user storage limit,
     *  change the following value.
     *
     *  Please note: This limit is what makes people subscribe and what pays for CryptPad
     *    development. Running a public instance that provides a "better deal" than cryptpad.fr
     *    is effectively using the project against itself.
     */
    defaultStorageLimit: 50 * 1024 * 1024,

    /*
     *  CryptPad allows administrators to give custom limits to their friends.
     *  add an entry for each friend, identified by their user id,
     *  which can be found on the settings page. Include a 'limit' (number of bytes),
     *  a 'plan' (string), and a 'note' (string).
     *
     *  hint: 1GB is 1024 * 1024 * 1024 bytes
     */
    customLimits: {
        /*
        "https://my.awesome.website/user/#/1/cryptpad-user1/YZgXQxKR0Rcb6r6CmxHPdAGLVludrAF2lEnkbx1vVOo=": {
            limit: 20 * 1024 * 1024 * 1024,
            plan: 'insider',
            note: 'storage space donated by my.awesome.website'
        },
        "https://my.awesome.website/user/#/1/cryptpad-user2/GdflkgdlkjeworijfkldfsdflkjeEAsdlEnkbx1vVOo=": {
            limit: 10 * 1024 * 1024 * 1024,
            plan: 'insider',
            note: 'storage space donated by my.awesome.website'
        }
        */
    },

    /*
     *  By default, CryptPad also contacts our accounts server once a day to check for changes in
     *  the people who have accounts. This check-in will also send the version of your CryptPad
     *  instance and your email so we can reach you if we are aware of a serious problem. We will
     *  never sell it or send you marketing mail. If you want to block this check-in and remain
     *  completely invisible, set this and allowSubscriptions both to false.
     */
    adminEmail: 'i.did.not.read.my.config@cryptpad.fr',


    /*
        You have the option of specifying an alternative storage adaptor.
        These status of these alternatives are specified in their READMEs,
        which are available at the following URLs:

        mongodb: a noSQL database
            https://github.com/xwiki-labs/cryptpad-mongo-store
        amnesiadb: in memory storage
            https://github.com/xwiki-labs/cryptpad-amnesia-store
        leveldb: a simple, fast, key-value store
            https://github.com/xwiki-labs/cryptpad-level-store
        sql: an adaptor for a variety of sql databases via knexjs
            https://github.com/xwiki-labs/cryptpad-sql-store

        For the most up to date solution, use the default storage adaptor.
    */
    storage: './storage/file',

    /*
        CryptPad stores each document in an individual file on your hard drive.
        Specify a directory where files should be stored.
        It will be created automatically if it does not already exist.
    */
    filePath: './datastore/',

    /*  CryptPad allows logged in users to request that particular documents be
     *  stored by the server indefinitely. This is called 'pinning'.
     *  Pin requests are stored in a pin-store. The location of this store is
     *  defined here.
     */
    pinPath: './pins',

    /*  CryptPad allows logged in users to upload encrypted files. Files/blobs
     *  are stored in a 'blob-store'. Set its location here.
     */
    blobPath: './blob',

    /*  CryptPad stores incomplete blobs in a 'staging' area until they are
     *  fully uploaded. Set its location here.
     */
    blobStagingPath: './blobstage',

    /*  CryptPad's file storage adaptor closes unused files after a configurale
     *  number of milliseconds (default 30000 (30 seconds))
     */
    channelExpirationMs: 30000,

    /*  CryptPad's file storage adaptor is limited by the number of open files.
     *  When the adaptor reaches openFileLimit, it will clean up older files
     */
    openFileLimit: 2048,

    /*  CryptPad's socket server can be extended to respond to RPC calls
     *  you can configure it to respond to custom RPC calls if you like.
     *  provide the path to your RPC module here, or `false` if you would
     *  like to disable the RPC interface completely
     */
    rpc: './rpc.js',

    /*  RPC errors are shown by default, but if you really don't care,
     *  you can suppress them
     */
    suppressRPCErrors: false,

    /*  Setting this value to anything other than true will cause file upload
     *  attempts to be rejected outright.
     */
    enableUploads: true,

    /*  If you have enabled file upload, you have the option of restricting it
     *  to a list of users identified by their public keys. If this value is set
     *  to true, your server will query a file (cryptpad/privileged.conf) when
     *  users connect via RPC. Only users whose public keys can be found within
     *  the file will be allowed to upload.
     *
     *  privileged.conf uses '#' for line comments, and splits keys by newline.
     *  This is a temporary measure until a better quota system is in place.
     *  registered users' public keys can be found on the settings page.
     */
    //restrictUploads: false,

    /*  Max Upload Size (bytes)
     *  this sets the maximum size of any one file uploaded to the server.
     *  anything larger than this size will be rejected
     */
    maxUploadSize: 20 * 1024 * 1024,

    /*  clients can use the /settings/ app to opt out of usage feedback
     *  which informs the server of things like how much each app is being
     *  used, and whether certain clientside features are supported by
     *  the client's browser. The intent is to provide feedback to the admin
     *  such that the service can be improved. Enable this with `true`
     *  and ignore feedback with `false` or by commenting the attribute
     */
    //logFeedback: true,

    /*  If you wish to see which remote procedure calls clients request,
     *  set this to true
     */
    //logRPC: true,

    /* it is recommended that you serve CryptPad over https
     * the filepaths below are used to configure your certificates
     */
    //privKeyAndCertFiles: [
    //  '/etc/apache2/ssl/my_secret.key',
    //  '/etc/apache2/ssl/my_public_cert.crt',
    //  '/etc/apache2/ssl/my_certificate_authorities_cert_chain.ca'
    //],
};
