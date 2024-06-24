// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/*  DISCLAIMER:

    There are two recommended methods of running a CryptPad instance:

    1. Using a standalone nodejs server without HTTPS (suitable for local development)
    2. Using NGINX to serve static assets and to handle HTTPS for API server's websocket traffic

    We do not officially recommend or support Apache, Docker, Kubernetes, Traefik, or any other configuration.
    Support requests for such setups should be directed to their authors.

    If you're having difficulty difficulty configuring your instance
    we suggest that you join the project's Matrix channel.

    If you don't have any difficulty configuring your instance and you'd like to
    support us for the work that went into making it pain-free we are quite happy
    to accept donations via our opencollective page: https://opencollective.com/cryptpad

*/
module.exports = {
/*  CryptPad is designed to serve its content over two domains.
 *  Account passwords and cryptographic content is handled on the 'main' domain,
 *  while the user interface is loaded on a 'sandbox' domain
 *  which can only access information which the main domain willingly shares.
 *
 *  In the event of an XSS vulnerability in the UI (that's bad)
 *  this system prevents attackers from gaining access to your account (that's good).
 *
 *  Most problems with new instances are related to this system blocking access
 *  because of incorrectly configured sandboxes. If you only see a white screen
 *  when you try to load CryptPad, this is probably the cause.
 *
 *  PLEASE READ THE FOLLOWING COMMENTS CAREFULLY.
 *
 */

/*  httpUnsafeOrigin is the URL that clients will enter to load your instance.
 *  Any other URL that somehow points to your instance is supposed to be blocked.
 *  The default provided below assumes you are loading CryptPad from a server
 *  which is running on the same machine, using port 3000.
 *
 *  In a production instance this should be available ONLY over HTTPS
 *  using the default port for HTTPS (443) ie. https://cryptpad.fr
 *  In such a case this should be also handled by NGINX, as documented in
 *  cryptpad/docs/example.nginx.conf (see the $main_domain variable)
 *
 */
    httpUnsafeOrigin: 'http://localhost:3000',

/*  httpSafeOrigin is the URL that is used for the 'sandbox' described above.
 *  If you're testing or developing with CryptPad on your local machine then
 *  it is appropriate to leave this blank. The default behaviour is to serve
 *  the main domain over port 3000 and to serve the sandbox content over port 3001.
 *
 *  This is not appropriate in a production environment where invasive networks
 *  may filter traffic going over abnormal ports.
 *  To correctly configure your production instance you must provide a URL
 *  with a different domain (a subdomain is sufficient).
 *  It will be used to load the UI in our 'sandbox' system.
 *
 *  This value corresponds to the $sandbox_domain variable
 *  in the example nginx file.
 *
 *  Note that in order for the sandboxing system to be effective
 *  httpSafeOrigin must be different from httpUnsafeOrigin.
 *
 *  CUSTOMIZE AND UNCOMMENT THIS FOR PRODUCTION INSTALLATIONS.
 */
    // httpSafeOrigin: "https://some-other-domain.xyz",

/*  httpAddress specifies the address on which the nodejs server
 *  should be accessible. By default it will listen on localhost
 *  (IPv4 & IPv6 if enabled). If you want it to listen on
 *  a specific address, specify it here. e.g '192.168.0.1'
 *
 */
    //httpAddress: 'localhost',

/*  httpPort specifies on which port the nodejs server should listen.
 *  By default it will serve content over port 3000, which is suitable
 *  for both local development and for use with the provided nginx example,
 *  which will proxy websocket traffic to your node server.
 *
 */
    //httpPort: 3000,

/*  httpSafePort purpose is to emulate another origin for the sandbox when
 *  you don't have two domains at hand (i.e. when httpSafeOrigin not defined).
 *  It is meant to be used only in case where you are working on a local 
 *  development instance. The default value is your httpPort + 1.
 *
 */
    //httpSafePort: 3001,

/*  Websockets need to be exposed on a separate port from the rest of
 *  the platform's HTTP traffic. Port 3003 is used by default.
 *  You can change this to a different port if it is in use by a
 *  different service, but under most circumstances you can leave this
 *  commented and it will work.
 *
 *  In production environments, your reverse proxy (usually NGINX)
 *  will need to forward websocket traffic (/cryptpad_websocket)
 *  to this port.
 *
 */
    // websocketPort: 3003,

/*  CryptPad will launch a child process for every core available
 *  in order to perform CPU-intensive tasks in parallel.
 *  Some host environments may have a very large number of cores available
 *  or you may want to limit how much computing power CryptPad can take.
 *  If so, set 'maxWorkers' to a positive integer.
 */
    // maxWorkers: 4,

    /* =====================
     *       Sessions
     * ===================== */

    /*  Accounts can be protected with an OTP (One Time Password) system
     *  to add a second authentication layer. Such accounts use a session
     *  with a given lifetime after which they are logged out and need
     *  to be re-authenticated. You can configure the lifetime of these
     *  sessions here.
     *
     *  defaults to 7 days
     */
    //otpSessionExpiration: 7*24, // hours

    /*  Registered users can be forced to protect their account
     *  with a Multi-factor Authentication (MFA) tool like a TOTP
     *  authenticator application.
     *
     *  defaults to false
     */
    //enforceMFA: false,

    /* =====================
     *       Privacy
     * ===================== */

    /*  Depending on where your instance is hosted, you may be required to log IP
     *  addresses of the users who make a change to a document. This setting allows you
     *  to do so. You can configure the logging system below in this config file.
     *  Setting this value to true will include a log for each websocket connection
     *  including this connection's unique ID, the user public key and the IP.
     *  NOTE: this option requires a log level of "info" or below.
     *
     *  defaults to false
     */
    //logIP: false,

    /* =====================
     *         Admin
     * ===================== */

    /*
     *  CryptPad contains an administration panel. Its access is restricted to specific
     *  users using the following list.
     *  To give access to the admin panel to a user account, just add their public signing
     *  key, which can be found on the settings page for registered users.
     *  Entries should be strings separated by a comma.
     *  adminKeys: [
     *      "[cryptpad-user1@my.awesome.website/YZgXQxKR0Rcb6r6CmxHPdAGLVludrAF2lEnkbx1vVOo=]",
     *      "[cryptpad-user2@my.awesome.website/jA-9c5iNuG7SyxzGCjwJXVnk5NPfAOO8fQuQ0dC83RE=]",
     *  ]
     *
     */
    adminKeys: [

    ],

    /* =====================
     *        STORAGE
     * ===================== */

    /*  Pads that are not 'pinned' by any registered user can be set to expire
     *  after a configurable number of days of inactivity (default 90 days).
     *  The value can be changed or set to false to remove expiration.
     *  Expired pads can then be removed using a cron job calling the
     *  `evict-inactive.js` script with node
     *
     *  defaults to 90 days if nothing is provided
     */
    //inactiveTime: 90, // days

    /*  CryptPad archives some data instead of deleting it outright.
     *  This archived data still takes up space and so you'll probably still want to
     *  remove these files after a brief period.
     *
     *  cryptpad/scripts/evict-archived.js is intended to be run daily
     *  from a crontab or similar scheduling service.
     *
     *  The intent with this feature is to provide a safety net in case of accidental
     *  deletion. Set this value to the number of days you'd like to retain
     *  archived data before it's removed permanently.
     *
     *  defaults to 15 days if nothing is provided
     */
    //archiveRetentionTime: 15,

    /*  It's possible to configure your instance to remove data
     *  stored on behalf of inactive accounts. Set 'accountRetentionTime'
     *  to the number of days an account can remain idle before its
     *  documents and other account data is removed.
     *
     *  Leave this value commented out to preserve all data stored
     *  by user accounts regardless of inactivity.
     */
     //accountRetentionTime: 365,

    /*  Starting with CryptPad 3.23.0, the server automatically runs
     *  the script responsible for removing inactive data according to
     *  your configured definition of inactivity. Set this value to `true`
     *  if you prefer not to remove inactive data, or if you prefer to
     *  do so manually using `scripts/evict-inactive.js`.
     */
    //disableIntegratedEviction: true,


    /*  Max Upload Size (bytes)
     *  this sets the maximum size of any one file uploaded to the server.
     *  anything larger than this size will be rejected
     *  defaults to 20MB if no value is provided
     */
    //maxUploadSize: 20 * 1024 * 1024,

    /*  Users with premium accounts (those with a plan included in their customLimit)
     *  can benefit from an increased upload size limit. By default they are restricted to the same
     *  upload size as any other registered user.
     *
     */
    //premiumUploadSize: 100 * 1024 * 1024,

    /* =====================
     *   DATABASE VOLUMES
     * ===================== */

    /*
     *  CryptPad stores each document in an individual file on your hard drive.
     *  Specify a directory where files should be stored.
     *  It will be created automatically if it does not already exist.
     */
    filePath: './datastore/',

    /*  CryptPad offers the ability to archive data for a configurable period
     *  before deleting it, allowing a means of recovering data in the event
     *  that it was deleted accidentally.
     *
     *  To set the location of this archive directory to a custom value, change
     *  the path below:
     */
    archivePath: './data/archive',

    /*  CryptPad allows logged in users to request that particular documents be
     *  stored by the server indefinitely. This is called 'pinning'.
     *  Pin requests are stored in a pin-store. The location of this store is
     *  defined here.
     */
    pinPath: './data/pins',

    /*  if you would like the list of scheduled tasks to be stored in
        a custom location, change the path below:
    */
    taskPath: './data/tasks',

    /*  if you would like users' authenticated blocks to be stored in
        a custom location, change the path below:
    */
    blockPath: './block',

    /*  CryptPad allows logged in users to upload encrypted files. Files/blobs
     *  are stored in a 'blob-store'. Set its location here.
     */
    blobPath: './blob',

    /*  CryptPad stores incomplete blobs in a 'staging' area until they are
     *  fully uploaded. Set its location here.
     */
    blobStagingPath: './data/blobstage',

    decreePath: './data/decrees',

    /* CryptPad supports logging events directly to the disk in a 'logs' directory
     * Set its location here, or set it to false (or nothing) if you'd rather not log
     */
    logPath: './data/logs',

    /* =====================
     *       Debugging
     * ===================== */

    /*  CryptPad can log activity to stdout
     *  This may be useful for debugging
     */
    logToStdout: false,

    /* CryptPad can be configured to log more or less
     * the various settings are listed below by order of importance
     *
     * silly, verbose, debug, feedback, info, warn, error
     *
     * Choose the least important level of logging you wish to see.
     * For example, a 'silly' logLevel will display everything,
     * while 'info' will display 'info', 'warn', and 'error' logs
     *
     * This will affect both logging to the console and the disk.
     */
    logLevel: 'info',

    /*  clients can use the /settings/ app to opt out of usage feedback
     *  which informs the server of things like how much each app is being
     *  used, and whether certain clientside features are supported by
     *  the client's browser. The intent is to provide feedback to the admin
     *  such that the service can be improved. Enable this with `true`
     *  and ignore feedback with `false` or by commenting the attribute
     *
     *  You will need to set your logLevel to include 'feedback'. Set this
     *  to false if you'd like to exclude feedback from your logs.
     */
    logFeedback: false,

    /*  CryptPad supports verbose logging
     *  (false by default)
     */
    verbose: false,

    /*  Surplus information:
     *
     *  'installMethod' is included in server telemetry to voluntarily
     *  indicate how many instances are using unofficial installation methods
     *  such as Docker.
     *
     */
    installMethod: 'unspecified',
};
