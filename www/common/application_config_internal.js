/*
 * This is an internal configuration file.
 * If you want to change some configurable values, use the '/customize/application_config.js'
 * file (make a copy from /customize.dist/application_config.js)
 */
define(function() {
    var config = {};

    /* Select the buttons displayed on the main page to create new collaborative sessions.
     * Removing apps from the list will prevent users from accessing them. They will instead be
     * redirected to the drive.
     * You should never remove the drive from this list.
     */
    config.availablePadTypes = ['drive', 'teams', 'pad', 'sheet', 'code', 'slide', 'poll', 'kanban', 'whiteboard',
                                /*'oodoc', 'ooslide',*/ 'file', /*'todo',*/ 'contacts'];
    /* The registered only types are apps restricted to registered users.
     * You should never remove apps from this list unless you know what you're doing. The apps
     * listed here by default can't work without a user account.
     * You can however add apps to this list. The new apps won't be visible for unregistered
     * users and these users will be redirected to the login page if they still try to access
     * the app
     */
    config.registeredOnlyTypes = ['file', 'contacts', 'oodoc', 'ooslide', 'notifications', 'support'];

    /* CryptPad is available is multiple languages, but only English and French are maintained
     * by the developers. The other languages may be outdated, and any missing string for a langauge
     * will use the english version instead. You can customize the langauges you want to be available
     * on your instance by removing them from the following list.
     * An empty list will load all available languages for CryptPad. The list of available languages
     * can be found at the top of the file `/customize.dist/messages.js`. The list should only
     * contain languages code ('en', 'fr', 'de', 'pt-br', etc.), not their full name.
     */
    //config.availableLanguages = ['en', 'fr', 'de'];

    /* You can display a link to the imprint (legal notice) of your website in the static pages
     * footer. To do so, you can either set the following value to `true` and create an imprint.html page
     * in the `customize` directory. You can also set it to an absolute URL if your imprint page already exists.
     */
    config.imprint = false;
    // config.imprint = true;
    // config.imprint = 'https://xwiki.com/en/company/legal-notice';

    /* You can display a link to your own privacy policy in the static pages footer.
     * To do so, set the following value to the absolute URL of your privacy policy.
     */
    config.privacy = '/privacy.html';
    // config.privacy = 'https://xwiki.com/en/company/PrivacyPolicy';

    /*  Cryptpad apps use a common API to display notifications to users
     *  by default, notifications are hidden after 5 seconds
     *  You can change their duration here (measured in milliseconds)
     */
    config.notificationTimeout = 5000;
    config.disableUserlistNotifications = false;

    // Update the default colors available in the whiteboard application
    config.whiteboardPalette = [
        '#000000', // black
        '#FFFFFF', // white
        '#848484', // grey
        '#8B4513', // saddlebrown
        '#FF0000', // red
        '#FF8080', // peach?
        '#FF8000', // orange
        '#FFFF00', // yellow
        '#80FF80', // light green
        '#00FF00', // green
        '#00FFFF', // cyan
        '#008B8B', // dark cyan
        '#0000FF', // blue
        '#FF00FF', // fuschia
        '#FF00C0', // hot pink
        '#800080', // purple
    ];

    // Background color in the apps with centered content:
    // - file app in view mode
    // - rich text app when editor's width reduced in settings
    config.appBackgroundColor = '#666';

    // Set enableTemplates to false to remove the button allowing users to save a pad as a template
    // and remove the template category in CryptDrive
    config.enableTemplates = true;

    // Set enableHistory to false to remove the "History" button in all the apps.
    config.enableHistory = true;

    /*  user passwords are hashed with scrypt, and salted with their username.
        this value will be appended to the username, causing the resulting hash
        to differ from other CryptPad instances if customized. This makes it
        such that anyone who wants to bruteforce common credentials must do so
        again on each CryptPad instance that they wish to attack.

        WARNING: this should only be set when your CryptPad instance is first
        created. Changing it at a later time will break logins for all existing
        users.
    */
    config.loginSalt = '';
    config.minimumPasswordLength = 8;

    // Amount of time (ms) before aborting the session when the algorithm cannot synchronize the pad
    config.badStateTimeout = 30000;

    // Customize the icon used for each application.
    // You can update the colors by making a copy of /customize.dist/src/less2/include/colortheme.less
    config.applicationsIcon = {
        file: 'cptools-file',
        fileupload: 'cptools-file-upload',
        folderupload: 'cptools-folder-upload',
        pad: 'cptools-pad',
        code: 'cptools-code',
        slide: 'cptools-slide',
        poll: 'cptools-poll',
        whiteboard: 'cptools-whiteboard',
        todo: 'cptools-todo',
        contacts: 'fa-address-book',
        kanban: 'cptools-kanban',
        oodoc: 'fa-file-word-o',
        ooslide: 'fa-file-powerpoint-o',
        sheet: 'fa-file-excel-o',
        drive: 'fa-hdd-o',
        teams: 'fa-users',
    };

    // Ability to create owned pads and expiring pads through a new pad creation screen.
    // The new screen can be disabled by the users in their settings page
    config.displayCreationScreen = true;

    // Prevent anonymous users from storing pads in their drive
    config.disableAnonymousStore = false;

    // Hide the usage bar in settings and drive
    //config.hideUsageBar = true;

    // Disable feedback for all the users and hide the settings part about feedback
    //config.disableFeedback = true;

    // Add new options in the share modal (extend an existing tab or add a new tab).
    // More info about how to use it on the wiki:
    // https://github.com/xwiki-labs/cryptpad/wiki/Application-config#configcustomizeshareoptions
    //config.customizeShareOptions = function (hashes, tabs, config) {};

    // Add code to be executed on every page before loading the user object. `isLoggedIn` (bool) is
    // indicating if the user is registered or anonymous. Here you can change the way anonymous users
    // work in CryptPad, use an external SSO or even force registration
    // *NOTE*: You have to call the `callback` function to continue the loading process
    //config.beforeLogin = function(isLoggedIn, callback) {};

    // Add code to be executed on every page after the user object is loaded (also work for
    // unregistered users). This allows you to interact with your users' drive
    // *NOTE*: You have to call the `callback` function to continue the loading process
    //config.afterLogin = function(api, callback) {};

    // Disabling the profile app allows you to import the profile informations (display name, avatar)
    // from an external source and make sure the users can't change them from CryptPad.
    // You can use config.afterLogin to import these values in the users' drive.
    //config.disableProfile = true;

    // Disable the use of webworkers and sharedworkers in CryptPad.
    // Workers allow us to run the websockets connection and open the user drive in a separate thread.
    // SharedWorkers allow us to load only one websocket and one user drive for all the browser tabs,
    // making it much faster to open new tabs.
    config.disableWorkers = false;

    config.surveyURL = "https://survey.cryptpad.fr/index.php/672782";

    // Teams are always loaded during the initial loading screen (for the first tab only if
    // SharedWorkers are available). Allowing users to be members of multiple teams can
    // make them have a very slow loading time. To avoid impacting the user experience
    // significantly, we're limiting the number of teams per user to 3 by default.
    // You can change this value here.
    //config.maxTeamsSlots = 3;

    // Each team is considered as a registered user by the server. Users and teams are indistinguishable
    // in the database so teams will offer the same storage limits as users by default.
    // It means that each team created by a user can increase their storage limit by +100%.
    // We're limiting the number of teams each user is able to own to 1 in order to make sure
    // users don't use "fake" teams (1 member) just to increase their storage limit.
    // You can change the value here.
    // config.maxOwnedTeams = 1;

    return config;
});
