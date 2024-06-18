// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
    AppConfig.availablePadTypes = ['drive', 'teams', 'sheet', 'doc', 'presentation', 'pad', 'kanban', 'code', 'form', 'poll', 'whiteboard',
                                'file', 'contacts', 'slide', 'convert', 'diagram'];

    /* The registered only types are apps restricted to registered users.
     * You should never remove apps from this list unless you know what you're doing. The apps
     * listed here by default can't work without a user account.
     * You can however add apps to this list. The new apps won't be visible for unregistered
     * users and these users will be redirected to the login page if they still try to access
     * the app
     */
    AppConfig.registeredOnlyTypes = ['file', 'contacts', 'notifications', 'support'];

    /* New applications may be introduced in an "early access" state which can contain
     * bugs and can cause loss of user content. You can enable these applications on your
     * CryptPad instance to test them and report bugs to the developers or keep them
     * disabled until they are officially considered safe.
     */
    AppConfig.enableEarlyAccess = false;

    // to prevent apps that aren't officially supported from showing up
    // in the document creation modal
    AppConfig.hiddenTypes = ['drive', 'teams', 'contacts', 'todo', 'file', 'accounts', 'calendar', 'poll', 'convert',
    //'doc', 'presentation'
    ];

    /* 'doc' and 'presentation' are considered experimental and are hidden from users
     * unless they have a custom quota applied via the admin panel. You can customize
     * which apps are treated this way via the parameter below. This behaviour is not
     * officially supported and the development team won't help you with any problems
     * that you experience if you change this value.
     */
    // AppConfig.premiumTypes = ['doc', 'presentation'];

    /* CryptPad is available is multiple languages, but only English and French are maintained
     * by the developers. The other languages may be outdated, and any missing string for a langauge
     * will use the english version instead. You can customize the langauges you want to be available
     * on your instance by removing them from the following list.
     * An empty list will load all available languages for CryptPad. The list of available languages
     * can be found at the top of the file `/customize.dist/messages.js`. The list should only
     * contain languages code ('en', 'fr', 'de', 'pt-br', etc.), not their full name.
     */
    //AppConfig.availableLanguages = ['en', 'fr', 'de'];

    /*
     * AppConfig.imprint, AppConfig.privacy, AppConfig.terms, AppConfig.source, and AppConfig.roadmap
     * define values used in at least one of the static pages' footer or the 'About CryptPad' menu.
     *
     * They can each be configured in one of three manners:
     *
     * 1. set their value to `false` to cause them not to be displayed, even if a default value exists
     *      example:
     *      AppConfig.privacy = false;
     * 2. set their value to `true` to use the default value if it exists.
     *      example:
     *      AppConfig.privacy = true;
     * 3. set their value to an object which maps language codes or a default setting to the relevant URL (as a string)
     *      example:
     *      AppConfig.privacy = {
     *          "default": 'https://example.com/privacy.html',
     *          "en": 'https://example.com/privacy.en.html', // in case English is not your default language
     *          "fr": 'https://example.com/privacy.fr.html', // another language
     *          "de": 'https://example.com/privacy.de.html', // you get the idea?
     *      };
     *
     */

    /* You can display a link to the imprint (legal notice) of your website in the static pages
     * footer. Since this is different for each individual or organization there is
     * no default value.
     *
     * See the comments above for a description of possible configurations.
     */
    AppConfig.imprint = false;

    /* You can display a link to your own privacy policy in the static pages footer.
     * Since this is different for each individual or organization there is no default value.
     * See the comments above for a description of possible configurations.
     */
    AppConfig.privacy = false;

    /* You can display a link to your instances's terms of service in the static pages footer.
     * A default is included for backwards compatibility, but we recommend replacing this
     * with your own terms.
     *
     * See the comments above for a description of possible configurations.
     */
    AppConfig.terms = false;

    /* The terms of CryptPad's license require that its source code be made available
     * to anyone who uses the software. If you have not made any modifications to the platform
     * then it is sufficient to leave this as-is. If you have made changes, customize
     * this value to a software repository which includes the source code including your modifications.
     *
     * See the comments above for a description of possible configurations.
     */
    AppConfig.source = true;

    /* If you wish to communicate your organization's roadmap to your users you may use the setting below.
     * Since this is different for each individual or organization there is no default value.
     */
    AppConfig.roadmap = false;

    /* If you have a status page for your instance, you may use the setting belox
     *
     * See the comments above for a description of possible configurations.
     */
    AppConfig.status = false;

    /* By default CryptPad instances display some text on the home page indicating that
     * they are an independent community instance of the software. You can provide customized messages
     * by filling in the following data structure with strings for each language you intend to support.
     */
    AppConfig.hostDescription = {
        // default: "Hello world",
        // en: "Hello world",
        // fr: "Bonjour le monde",
        // de: "Hallo Welt",
        // "pt-br": "Olá Mundo"<
    };

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
        link: 'fa-link',
        pad: 'cptools-richtext',
        code: 'cptools-code',
        slide: 'cptools-slide',
        poll: 'cptools-poll',
        form: 'cptools-poll',
        whiteboard: 'cptools-whiteboard',
        diagram: 'cptools-diagram',
        todo: 'cptools-todo',
        contacts: 'fa-address-book',
        calendar: 'fa-calendar',
        kanban: 'cptools-kanban',
        doc: 'fa-file-word-o',
        presentation: 'fa-file-powerpoint-o',
        sheet: 'fa-file-excel-o',
        drive: 'fa-hdd-o',
        teams: 'fa-users',
        admin: 'fa-gears',
        settings: 'fa-gear',
        moderation: 'fa-ambulance',
        profile: 'fa-user-circle',
        support: 'fa-life-ring',
        accounts: 'fa-ticket'
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

    // Same settings but for premium users (users with a custom limit included)
    // AppConfig.maxPremiumTeamsSlots = 10;
    // AppConfig.maxPremiumTeamsOwned = 10;

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

    AppConfig.emojiAvatars = '🐵 🐒 🐶 🐩 🐺 🐱 🐯 🐴 🐎 🐮 🐷 🐗 🐑 🐫 🐘 🐭 🐹 🐰 🐻 🐨 🐼 🐔 🐣 🐥 🐢 🐍 🐲 🐳 🐬 🐟 🐠 🐡 🐙 🐚 🐌 🐛 🐝 🐞 💐 🌸 💮 🌹 🌺 🌻 🌼 🌷 🌱 🌴 🌵 🌾 🌿 🍀 🍁 🍂 🍃 🍄 💫 🌛 ⛄ 🔥 💧 🌊 🎃 👹 👺 👻 👽 👾'.split(/\s+/);

    return AppConfig;
});
