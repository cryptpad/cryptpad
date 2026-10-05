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
    /* =====================
     *       Sessions
     * ===================== */

    /* Session expiration for 2FA */
    otpSessionExpiration: undefined, // default: 7*24, in hours

    /* Enforce multifactor authentication*/
    enforceMFA: undefined, // default: false

    /* =====================
     *       Privacy
     * ===================== */

    /* Log IPs, requires at log level to be "info" or below */
    logIP: undefined, // default: false,

    /* =====================
     *     Administration
     * ===================== */

    /* List of Administrators keys (warning: these cannot be deleted from the
     * administration panel) */
    adminKeys: [

    ],

    /* =====================
     *        STORAGE
     * ===================== */

    /* Delay before a document is considered inactive */
    inactiveTime: undefined, //default: 90. In days


    /* Delay before archive deletion */
    archiveRetentionTime: undefined, // default: 15


    /* Delay before a registered account is considered inactive */
    accountRetentionTime: undefined, // default: 365


    /* Let CryptPad server automatically remove inactive data */
    disableIntegratedEviction: undefined, // default: false

    /* Max upload size in bytes */
    maxUploadSize: undefined, // default: 20 * 1024 * 1024


    /* Max upload size for premium accounts (requires accounts plugin) */
    premiumUploadSize: undefined, // default: same as maxUploadSize, in Bytes

    /* =====================
     *   DATABASE VOLUMES
     * ===================== */
    /* See README.md for detailed explanations */
    filePath: './datastore/',
    archivePath: './data/archive',
    pinPath: './data/pins',
    taskPath: './data/tasks',
    blockPath: './block',
    blobPath: './blob',
    blobStagingPath: './data/blobstage',
    decreePath: './data/decrees',
    logPath: './data/logs',

    /* =====================
     *       Debugging
     * ===================== */

    /*  CryptPad can log activity to stdout
     *  This may be useful for debugging
     */
    logToStdout: false,
    /* Set the level of verbosity of logs.
     * From the less important logs to most important:
     * 'silly', 'verbose', 'debug', 'feedback', 'info', 'warn', 'error'
     */
    logLevel: 'info',
    /* Enable server-side feedbacks. Default: false */
    logFeedback: false,

    /* ====================
     *         Extra
     * ==================== */
    installMethod: 'unspecified',
};
