/* globals module */
module.exports = {
    httpUnsafeOrigin: 'http://localhost:3000/', // XXX

    // This is for deployment in production, CryptPad uses a separate origin (domain) to host the
    // cross-domain iframe. It can simply host the same content as CryptPad.
    // httpSafeOrigin: "https://some-other-domain.xyz",



    // the address you want to bind to, :: means all ipv4 and ipv6 addresses
    // this may not work on all operating systems
    //httpAddress: '::',

    // the port on which your httpd will listen
    //httpPort: 3000,

    // This is for allowing the cross-domain iframe to function when developing
    httpSafePort: 3001,


    /* =====================
     *         Admin
     * ===================== */

    /*
     *  CryptPad now contains an administration panel. Its access is restricted to specific
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
    supportMailboxPublicKey: 'oxuMPm3xXHFALYaeFdAepVZyCpEPNTAPBO8MlpjdQw8=',

    /* =====================
     *      Infra setup
     * ===================== */

    /*  Your CryptPad server will share this value with clients
     *  via its /api/config endpoint.
     *
     *  If you want to host your API and asset servers on different hosts
     *  specify a URL for your API server websocket endpoint, like so:
     *  wss://api.yourdomain.com/cryptpad_websocket
     *
     *  Otherwise, leave this commented and your clients will use the default
     *  websocket (wss://yourdomain.com/cryptpad_websocket)
     */
    //externalWebsocketURL: 'wss://api.yourdomain.com/cryptpad_websocket

    /* =====================
     *     Subscriptions
     * ===================== */

    /*  Limits, Donations, Subscriptions and Contact
     *
     *  By default, CryptPad limits every registered user to 50MB of storage. It also shows a
     *  subscribe button which allows them to upgrade to a paid account. We handle payment,
     *  and keep 50% of the proceeds to fund ongoing development.
     *
     *  You can:
     *  A: leave things as they are
     *  B: disable accounts but display a donate button
     *  C: hide any reference to paid accounts or donation
     *
     *  If you chose A then there's nothing to do.
     *  If you chose B, set 'allowSubscriptions' to false.
     *  If you chose C, set 'removeDonateButton' to true
     */
    //allowSubscriptions: true,
    removeDonateButton: false,

    /*
     *  By default, CryptPad also contacts our accounts server once a day to check for changes in
     *  the people who have accounts. This check-in will also send the version of your CryptPad
     *  instance and your email so we can reach you if we are aware of a serious problem. We will
     *  never sell it or send you marketing mail. If you want to block this check-in and remain
     *  completely invisible, set this and allowSubscriptions both to false.
     */
    adminEmail: 'i.did.not.read.my.config@cryptpad.fr',

    /*
     *  If you are using CryptPad internally and you want to increase the per-user storage limit,
     *  change the following value.
     *
     *  Please note: This limit is what makes people subscribe and what pays for CryptPad
     *    development. Running a public instance that provides a "better deal" than cryptpad.fr
     *    is effectively using the project against itself.
     */
    //defaultStorageLimit: 50 * 1024 * 1024,

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

    /*  Max Upload Size (bytes)
     *  this sets the maximum size of any one file uploaded to the server.
     *  anything larger than this size will be rejected
     *  defaults to 20MB if no value is provided
     */
    //maxUploadSize: 20 * 1024 * 1024,

    // XXX
    premiumUploadSize: 100 * 1024 * 1024,

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
