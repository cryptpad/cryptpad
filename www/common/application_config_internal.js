/*
 * This is an internal configuration file.
 * If you want to change some configurable values, use the '/customize/application_config.js'
 * file (make a copy from /customize.dist/application_config.js)
 */
define(function() {
    var AppConfig = {};

    /* Select the buttons displayed on the main page to create new collaborative sessions.
     * Removing apps from the list will prevent users from accessing them. They will instead be
     * redirected to the drive.
     * You should never remove the drive from this list.
     */
    AppConfig.availablePadTypes = ['drive', 'teams', 'pad', 'sheet', 'code', 'slide', 'poll', 'kanban', 'whiteboard',
                                /*'doc', 'presentation',*/ 'file', /*'todo',*/ 'contacts', 'form'];
    /* The registered only types are apps restricted to registered users.
     * You should never remove apps from this list unless you know what you're doing. The apps
     * listed here by default can't work without a user account.
     * You can however add apps to this list. The new apps won't be visible for unregistered
     * users and these users will be redirected to the login page if they still try to access
     * the app
     */
    AppConfig.registeredOnlyTypes = ['file', 'contacts', 'notifications', 'support'];

    /* CryptPad is available is multiple languages, but only English and French are maintained
     * by the developers. The other languages may be outdated, and any missing string for a langauge
     * will use the english version instead. You can customize the langauges you want to be available
     * on your instance by removing them from the following list.
     * An empty list will load all available languages for CryptPad. The list of available languages
     * can be found at the top of the file `/customize.dist/messages.js`. The list should only
     * contain languages code ('en', 'fr', 'de', 'pt-br', etc.), not their full name.
     */
    //AppConfig.availableLanguages = ['en', 'fr', 'de'];

    /* You can display a link to the imprint (legal notice) of your website in the static pages
     * footer. To do so, you can either set the following value to `true` and create an imprint.html page
     * in the `customize` directory. You can also set it to an absolute URL if your imprint page already exists.
     */
    AppConfig.imprint = false;
    // AppConfig.imprint = true;
    // AppConfig.imprint = 'https://xwiki.com/en/company/legal-notice';

    /* You can display a link to your own privacy policy in the static pages footer.
     * To do so, set the following value to the absolute URL of your privacy policy.
     */
    // AppConfig.privacy = 'https://xwiki.com/en/company/PrivacyPolicy';

    /* We (the project's developers) include the ability to display a 'Roadmap' in static pages footer.
     * This is disabled by default.
     * We use this to publish the project's development roadmap, but you can use it however you like.
     * To do so, set the following value to an absolute URL.
     */
    //AppConfig.roadmap = 'https://cryptpad.fr/kanban/#/2/kanban/view/PLM0C3tFWvYhd+EPzXrbT+NxB76Z5DtZhAA5W5hG9wo/';

    /*  Cryptpad apps use a common API to display notifications to users
     *  by default, notifications are hidden after 5 seconds
     *  You can change their duration here (measured in milliseconds)
     */
    AppConfig.notificationTimeout = 5000;
    AppConfig.disableUserlistNotifications = false;

    // Update the default colors available in the whiteboard application
    AppConfig.whiteboardPalette = [
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
    AppConfig.appBackgroundColor = '#666';

    // Set enableTemplates to false to remove the button allowing users to save a pad as a template
    // and remove the template category in CryptDrive
    AppConfig.enableTemplates = true;

    // Set enableHistory to false to remove the "History" button in all the apps.
    AppConfig.enableHistory = true;

    /*  user passwords are hashed with scrypt, and salted with their username.
        this value will be appended to the username, causing the resulting hash
        to differ from other CryptPad instances if customized. This makes it
        such that anyone who wants to bruteforce common credentials must do so
        again on each CryptPad instance that they wish to attack.

        WARNING: this should only be set when your CryptPad instance is first
        created. Changing it at a later time will break logins for all existing
        users.
    */
    AppConfig.loginSalt = '';
    AppConfig.minimumPasswordLength = 8;

    // Amount of time (ms) before aborting the session when the algorithm cannot synchronize the pad
    AppConfig.badStateTimeout = 30000;

    // Customize the icon used for each application.
    // You can update the colors by making a copy of /customize.dist/src/less2/include/colortheme.less
    AppConfig.applicationsIcon = {
        file: 'cptools-file',
        fileupload: 'cptools-file-upload',
        folderupload: 'cptools-folder-upload',
        pad: 'cptools-richtext',
        code: 'cptools-code',
        slide: 'cptools-slide',
        poll: 'cptools-poll',
        form: 'cptools-poll',
        whiteboard: 'cptools-whiteboard',
        todo: 'cptools-todo',
        contacts: 'fa-address-book',
        kanban: 'cptools-kanban',
        doc: 'fa-file-word-o',
        presentation: 'fa-file-powerpoint-o',
        sheet: 'cptools-sheet',
        drive: 'fa-hdd-o',
        teams: 'fa-users',
    };

    // Ability to create owned pads and expiring pads through a new pad creation screen.
    // The new screen can be disabled by the users in their settings page
    AppConfig.displayCreationScreen = true;

    // Prevent anonymous users from storing pads in their drive
    // NOTE: this is only enforced client-side as the server does not distinguish between users drives and pads
    AppConfig.disableAnonymousStore = false;
    // Prevent anonymous users from creating new pads (they can still access and edit existing ones)
    // NOTE: this is only enforced client-side and will not prevent malicious clients from storing data
    AppConfig.disableAnonymousPadCreation = false;

    // Hide the usage bar in settings and drive
    //AppConfig.hideUsageBar = true;

    // Disable feedback for all the users and hide the settings part about feedback
    //AppConfig.disableFeedback = true;

    // Add code to be executed on every page before loading the user object. `isLoggedIn` (bool) is
    // indicating if the user is registered or anonymous. Here you can change the way anonymous users
    // work in CryptPad, use an external SSO or even force registration
    // *NOTE*: You have to call the `callback` function to continue the loading process
    //AppConfig.beforeLogin = function(isLoggedIn, callback) {};

    // Add code to be executed on every page after the user object is loaded (also work for
    // unregistered users). This allows you to interact with your users' drive
    // *NOTE*: You have to call the `callback` function to continue the loading process
    //AppConfig.afterLogin = function(api, callback) {};

    // Disabling the profile app allows you to import the profile informations (display name, avatar)
    // from an external source and make sure the users can't change them from CryptPad.
    // You can use AppConfig.afterLogin to import these values in the users' drive.
    //AppConfig.disableProfile = true;

    // Disable the use of webworkers and sharedworkers in CryptPad.
    // Workers allow us to run the websockets connection and open the user drive in a separate thread.
    // SharedWorkers allow us to load only one websocket and one user drive for all the browser tabs,
    // making it much faster to open new tabs.
    AppConfig.disableWorkers = false;

    // Teams are always loaded during the initial loading screen (for the first tab only if
    // SharedWorkers are available). Allowing users to be members of multiple teams can
    // make them have a very slow loading time. To avoid impacting the user experience
    // significantly, we're limiting the number of teams per user to 3 by default.
    // You can change this value here.
    //AppConfig.maxTeamsSlots = 5;

    // Each team is considered as a registered user by the server. Users and teams are indistinguishable
    // in the database so teams will offer the same storage limits as users by default.
    // It means that each team created by a user can increase their storage limit by +100%.
    // We're limiting the number of teams each user is able to own to 1 in order to make sure
    // users don't use "fake" teams (1 member) just to increase their storage limit.
    // You can change the value here.
    // AppConfig.maxOwnedTeams = 5;

    // The userlist displayed in collaborative documents is stored alongside the document data.
    // Everytime someone with edit rights joins a document or modify their user data (display
    // name, avatar, color, etc.), they update the "userlist" part of the document. When too many
    // editors are in the same document, all these changes increase the risks of conflicts which
    // require CPU time to solve. A "degraded" mode can now be set when a certain number of editors
    // are in a document at the same time. This mode disables the userlist, the chat and the
    // position of other users' cursor. You can configure the number of user from which the session
    // will enter into degraded mode. A big number may result in collaborative edition being broken,
    // but this number depends on the network and CPU performances of each user's device.
    AppConfig.degradedLimit = 8;

    // In "legacy" mode, one-time users were always creating an "anonymous" drive when visiting CryptPad
    // in which they could store their pads. The new "driveless" mode allow users to open an existing
    // pad without creating a drive in the background. The drive will only be created if they visit
    // a different page (Drive, Settings, etc.) or try to create a new pad themselves. You can disable
    // the driveless mode by changing the following value to "false"
    AppConfig.allowDrivelessMode = true;

    return AppConfig;
});
