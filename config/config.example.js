/* globals module */

/*  DISCLAIMER:

    There are two recommended methods of running a CryptPad instance:

    1. Using a standalone nodejs server without HTTPS (suitable for local development)
    2. Using NGINX to serve static assets and to handle HTTPS for API server's websocket traffic

    We do not officially recommend or support Apache, Docker, Kubernetes, Traefik, or any other configuration.
    Support requests for such setups should be directed to their authors.

    If you're having difficulty difficulty configuring your instance
    we suggest that you join the project's IRC/Matrix channel.

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
 *  In such a case this should be handled by NGINX, as documented in
 *  cryptpad/docs/example.nginx.conf (see the $main_domain variable)
 *
 */
    httpUnsafeOrigin: 'http://localhost:3000/',

/*  httpSafeOrigin is the URL that is used for the 'sandbox' described above.
 *  If you're testing or developing with CryptPad on your local machine then
 *  it is appropriate to leave this blank. The default behaviour is to serve
 *  the main domain over port 3000 and to serve the content over port 3001.
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
 *  CUSTOMIZE AND UNCOMMENT THIS FOR PRODUCTION INSTALLATIONS.
 */
    // httpSafeOrigin: "https://some-other-domain.xyz",

/*  httpAddress specifies the address on which the nodejs server
 *  should be accessible. By default it will listen on 127.0.0.1
 *  (IPv4 localhost on most systems). If you want it to listen on
 *  all addresses, including IPv6, set this to '::'.
 *
 */
    //httpAddress: '::',

/*  httpPort specifies on which port the nodejs server should listen.
 *  By default it will serve content over port 3000, which is suitable
 *  for both local development and for use with the provided nginx example,
 *  which will proxy websocket traffic to your node server.
 *
 */
    //httpPort: 3000,

/*  httpSafePort allows you to specify an alternative port from which
 *  the node process should serve sandboxed assets. The default value is
 *  that of your httpPort + 1. You probably don't need to change this.
 *
 */
    //httpSafePort: 3001,

/*  CryptPad will launch a child process for every core available
 *  in order to perform CPU-intensive tasks in parallel.
 *  Some host environments may have a very large number of cores available
 *  or you may want to limit how much computing power CryptPad can take.
 *  If so, set 'maxWorkers' to a positive integer.
 */
    // maxWorkers: 4,

    /* =====================
     *         Admin
     * ===================== */

    /*
     *  CryptPad contains an administration panel. Its access is restricted to specific
     *  users using the following list.
     *  To give access to the admin panel to a user account, just add their user id,
     *  which can be found on the settings page for registered users.
     *  Entries should be strings separated by a comma.
     */
/*
    adminKeys: [
        //"https://my.awesome.website/user/#/1/cryptpad-user1/YZgXQxKR0Rcb6r6CmxHPdAGLVludrAF2lEnkbx1vVOo=",
    ],
*/

    /*  CryptPad's administration panel includes a "support" tab
     *  wherein administrators with a secret key can view messages
     *  sent from users via the encrypted forms on the /support/ page
     *
     *  To enable this functionality:
     *    run `node ./scripts/generate-admin-keys.js`
     *    save the public key in your config in the value below
     *    add the private key via the admin panel
     *    and back it up in a secure manner
     *
     */
    // supportMailboxPublicKey: "",

    /*  We're very proud that CryptPad is available to the public as free software!
     *  We do, however, still need to pay our bills as we develop the platform.
     *
     *  By default CryptPad will prompt users to consider donating to
     *  our OpenCollective campaign. We publish the state of our finances periodically
     *  so you can decide for yourself whether our expenses are reasonable.
     *
     *  You can disable any solicitations for donations by setting 'removeDonateButton' to true,
     *  but we'd appreciate it if you didn't!
     */
    //removeDonateButton: false,

    /*  CryptPad will display a point of contact for your instance on its contact page
     *  (/contact.html) if you provide it below.
     */
    adminEmail: 'i.did.not.read.my.config@cryptpad.fr',

    /*
     *  By default, CryptPad contacts one of our servers once a day.
     *  This check-in will also send some very basic information about your instance including its
     *  version and the adminEmail so we can reach you if we are aware of a serious problem.
     *  We will never sell it or send you marketing mail.
     *
     *  If you want to block this check-in and remain set 'blockDailyCheck' to true.
     */
    //blockDailyCheck: false,

    /*
     *  By default users get 50MB of storage by registering on an instance.
     *  You can set this value to whatever you want.
     *
     *  hint: 50MB is 50 * 1024 * 1024
     */
    //defaultStorageLimit: 50 * 1024 * 1024,


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
     *  cryptpad/scripts/evict-inactive.js is intended to be run daily
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

    /*
     *  CryptPad allows administrators to give custom limits to their friends.
     *  add an entry for each friend, identified by their user id,
     *  which can be found on the settings page. Include a 'limit' (number of bytes),
     *  a 'plan' (string), and a 'note' (string).
     *
     *  hint: 1GB is 1024 * 1024 * 1024 bytes
     */
/*
    customLimits: {
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
    },
*/

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
};
