/*
 * You can override the configurable values from this file.
 * The recommended method is to make a copy of this file (/customize.dist/application_config.js)
   in a 'customize' directory (/customize/application_config.js).
 * If you want to check all the configurable values, you can open the internal configuration file
   but you should not change it directly (/common/application_config_internal.js)
*/
define(['/common/application_config_internal.js'], function (AppConfig) {
    // Example: If you want to remove the survey link in the menu:
    // AppConfig.surveyURL = "";
    /* Select the buttons displayed on the main page to create new collaborative sessions.
     * Removing apps from the list will prevent users from accessing them. They will instead be
     * redirected to the drive.
     * You should never remove the drive from this list.
     */
    AppConfig.availablePadTypes = ['drive', 'teams', 'pad', 'sheet', 'code', 'slide', 'poll', 'kanban', 'whiteboard',
                                'meet', 'oodoc', 'ooslide', 'file', 'todo', 'contacts'];
    /* The registered only types are apps restricted to registered users.
     * You should never remove apps from this list unless you know what you're doing. The apps
     * listed here by default can't work without a user account.
     * You can however add apps to this list. The new apps won't be visible for unregistered
     * users and these users will be redirected to the login page if they still try to access
     * the app
     */
    AppConfig.registeredOnlyTypes = ['file', 'contacts', 'oodoc', 'ooslide', 'notifications'];

    /* CryptPad is available is multiple languages, but only English and French are maintained
     * by the developers. The other languages may be outdated, and any missing string for a langauge
     * will use the english version instead. You can customize the langauges you want to be available
     * on your instance by removing them from the following list.
     * An empty list will load all available languages for CryptPad. The list of available languages
     * can be found at the top of the file `/customize.dist/messages.js`. The list should only
     * contain languages code ('en', 'fr', 'de', 'pt-br', etc.), not their full name.
     */
    AppConfig.availableLanguages = ['en'];
    return AppConfig;
});
