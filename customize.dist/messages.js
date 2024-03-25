// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(function () {
// add your module to this map so it gets used
var map = {
    'ca': 'Català',
    'cs': 'Čeština',
    'de': 'Deutsch',
    'el': 'Ελληνικά',
    'es': 'Español',
    'eu': 'Euskara',
    'fi': 'Suomi',
    'fr': 'Français',
    //'hi': 'हिन्दी',
    'it': 'Italiano',
    'ja': '日本語',
    'nb': 'Norwegian Bokmål',
    //'nl': 'Nederlands'
    'pl': 'Polski',
    'pt-br': 'Português do Brasil',
    'pt-pt': 'Português do Portugal',
    'ro': 'Română',
    'ru': 'Русский',
    //'sv': 'Svenska',
    //'te': 'తెలుగు',
    'uk': 'Українська',
    'zh': '中文(簡體)',
};

var Messages = {};
var LS_LANG = "CRYPTPAD_LANG";
var getStoredLanguage = function () { return localStorage && localStorage.getItem(LS_LANG); };
var getBrowserLanguage = function () { return navigator.language || navigator.userLanguage || ''; };
var getLanguage = Messages._getLanguage = function () {
    if (window.cryptpadLanguage) { return window.cryptpadLanguage; }
    try {
        if (getStoredLanguage()) { return getStoredLanguage(); }
    } catch (e) { console.log(e); }
    var l = getBrowserLanguage();
    // Edge returns 'fr-FR' --> transform it to 'fr' and check again
    return map[l] ? l :
            (map[l.split('-')[0]] ? l.split('-')[0] :
                (map[l.split('_')[0]] ? l.split('_')[0] : 'en'));
};
var language = getLanguage();

// Translations files were migrated from requirejs modules to json.
// To avoid asking every administrator to update their customized translation files,
// we use a requirejs map to redirect the old path to the new one and to use the
// requirejs json plugin
var reqPaths = {
    "/common/translations/messages.js":"json!/common/translations/messages.json"
};
Object.keys(map).forEach(function (k) {
    reqPaths["/common/translations/messages."+k+".js"] = "json!/common/translations/messages."+k+".json";
});
require.config({
    map: {
        "*": reqPaths
    }
});

var req = [
    '/customize/application_config.js',
    '/customize/translations/messages.js'
];
if (language && map[language]) { req.push('/customize/translations/messages.' + language + '.js'); }

define(req, function(AppConfig, Default, Language) {
    map.en = 'English';
    var defaultLanguage = 'en';

    if (AppConfig.availableLanguages) {
        if (AppConfig.availableLanguages.indexOf(language) === -1) {
            language = defaultLanguage;
            Language = Default;
            try {
                localStorage.setItem(LS_LANG, language);
            } catch (e) { console.log(e); }
        }
        Object.keys(map).forEach(function (l) {
            if (l === defaultLanguage) { return; }
            if (AppConfig.availableLanguages.indexOf(l) === -1) {
                delete map[l];
            }
        });
    }

    var extend = function (a, b) {
        for (var k in b) {
            if (Array.isArray(b[k])) {
                a[k] = b[k].slice();
                continue;
            }
            if (b[k] && typeof(b[k]) === "object") {
                a[k] = (a[k] && typeof(a[k]) === "object" && !Array.isArray(a[k])) ? a[k] : {};
                extend(a[k], b[k]);
                continue;
            }
            a[k] = b[k] || a[k];
        }
    };

    extend(Messages, Default);
    if (Language && language !== defaultLanguage) {
        // Add the translated keys to the returned object
        extend(Messages, Language);
    }

    Messages._languages = map;
    Messages._languageUsed = language;

    // Get keys with parameters
    Messages._getKey = function (key, argArray) {
        if (!Messages[key]) { return '?'; }
        var text = Messages[key];
        if (typeof(text) === 'string') {
            return text.replace(/\{(\d+)\}/g, function (str, p1) {
                if (typeof(argArray[p1]) === 'string' || typeof(argArray[p1]) === "number") {
                    return argArray[p1];
                }
                console.error("Only strings and numbers can be used in _getKey params!");
                return '';
            });
        } else {
            return text;
        }
    };

    // XXX Temporary keys
        Messages.admin_cat_customize = "Customize";
        Messages.admin_cat_security = "Security";
        Messages.admin_logoTitle = "Custom Logo";
        Messages.admin_logoHint = "SVG, PNG or JPG, maximum size 200KB";
        Messages.admin_logoButton = "Upload new";
        Messages.admin_logoRemoveButton = "Restore default";
        Messages.admin_colorTitle = "Accent color";
        Messages.admin_colorHint = "Change the accent color of your CryptPad instance. Please ensure text and buttons are readable with sufficient contrast in both light and dark themes.";
        Messages.admin_colorCurrent = "Current accent color";
        Messages.admin_colorChange = "Change color";
        Messages.admin_colorPick = "Pick a color";
        Messages.admin_colorPreview = "Preview color";
    Messages.admin_supportSetupHint = "Create or update the support keys.";
    Messages.admin_supportSetupTitle = "Initialize support";
    Messages.admin_supportEnabled = "Modern support system is enabled.";
    Messages.admin_supportDisabled = "Modern support system is disabled.";
    Messages.admin_supportInit = "Initialize support page on this instance";
    Messages.admin_supportDelete = "Disable support";
    Messages.admin_supportConfirm = "Are you sure? This will delete all existing tickets and block access for all moderators.";
    Messages.admin_supportMembers = "Support team";
    Messages.admin_supportAdd = "Add a contact to the support team";
    Messages.admin_supportRotateNotify = "Warning: new keys have been generated but an unenexpected error prevented the system to send them to the moderators. Please remove and re-add all members of the support team";

    Messages.admin_supportTeamTitle = "admin_supportTeamTitle";
    Messages.admin_supportTeamHint = "admin_supportTeamHint";
    Messages.admin_supportOpen = "Open helpdesk";

    Messages.support_userNotification = "New support ticket or response: {0}";
    Messages.support_moderatorNotification = "You have been added to the moderators list";

    Messages.moderationPage = "Support mailbox"; // XXX

    Messages.support_cat_open = "Inbox";
    Messages.support_cat_closed = "Closed";
    Messages.support_cat_search = "Search";
    Messages.support_cat_settings = "Settings";
    Messages.support_cat_legacy = "Legacy";

    Messages.support_pending = "Archived tickets:";
    Messages.support_pending_tag = "Archived";
    Messages.support_active_tag = "Inbox";
    Messages.support_closed_tag = "Closed";

    Messages.support_privacyTitle = "Answer anonymously";
    Messages.support_privacyHint = "Check this option to reply as 'The Support Team' instead of your own username";

    Messages.support_notificationsTitle = "Disable notifications";
    Messages.support_notificationsHint = "Check this option to disable notifications for new tickets and replies";
    Messages.support_openTicketTitle = "Open a ticket with a user";
    Messages.support_openTicketHint = "Copy the recipient user's data from their profile page or an existing support ticket. They will receive a CryptPad notification about this message.";
    Messages.support_userChannel = "User's notifications channel ID";
    Messages.support_userKey = "User's public key";
    Messages.support_invalChan = "Invalid notifications channel";

    Messages.support_pasteUserData = "Paste user data here";

    Messages.support_recordedTitle = "Snippets";
    Messages.support_recordedHint = "Store common text as one-click shortcuts to insert in support messages.";
    Messages.support_recordedEmpty = "No snippets";
    Messages.support_recordedId = "Snippet ID (unique)";
    Messages.support_recordedContent = "Content";

    Messages.support_legacyTitle = "View old support data";
    Messages.support_legacyHint = "View tickets from the legacy support system and recreate them in the new one.";
    Messages.support_legacyButton = "Get active";
    Messages.support_legacyDump = "Export all";
    Messages.support_legacyClear = "Delete from my account";

    Messages.support_searchLabel = "Search (title or ticketId)";

    Messages.support_team = "The Support Team"; // XXX
    Messages.support_answerAs = "Answering as <b>{0}</b>"; // XXX
    Messages.support_movePending = "Move to archive";
    Messages.support_moveActive = "Move to active";
    Messages.support_copyUserData = "Copy user data";
    Messages.support_insertRecorded = "Insert snippet";


    return Messages;

});
}());
