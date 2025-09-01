// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(function () {
// add your module to this map so it gets used
var map = {
    'ar': 'اَلْعَرَبِيَّةُ',
    'ca': 'Català',
    'cs': 'Čeština',
    'de': 'Deutsch',
    //'el': 'Ελληνικά',
    'es': 'Español',
    'es_CU': 'Español cubano',
    'eu': 'Euskara',
    'fi': 'Suomi',
    'fr': 'Français',
    //'hi': 'हिन्दी',
    'id': 'Bahasa Indonesia',
    'it': 'Italiano',
    'ja': '日本語',
    'nb': 'Norwegian Bokmål',
    //'nl': 'Nederlands'
    'pl': 'Polski',
    'pt-br': 'Português do Brasil',
    'pt-pt': 'Português do Portugal',
    //'ro': 'Română',
    'ru': 'Русский',
    'sv': 'Svenska',
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
    var l = getBrowserLanguage();
    try {
        l = getStoredLanguage() || getBrowserLanguage();
    } catch (e) { console.log(e); }
    return map[l] ? l :
            (map[l.split('-')[0]] ? l.split('-')[0] :
                (map[l.split('_')[0]] ? l.split('_')[0] : 'en'));
};
var language = getLanguage();
window.cryptpadLanguage = language;

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

    let html = typeof(document) !== "undefined" && document.documentElement;
    if (html) { html.setAttribute('lang', language); }

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

    // XXX
    Messages.register_password_note1 = 'Your password is the secret key that encrypts all of your documents.';
    Messages.register_password_note2 = 'If you lose it there is no way we can recover your data.';
    Messages.register_computer_note1 = 'If you are using a shared computer, ';
    Messages.register_computer_note2 = 'remember to log out';
    Messages.register_computer_note3 = ' when you are done. Only closing the browser window leaves your account exposed.';
    Messages.register_import_note1 = 'To keep the documents you created and/or stored without being logged in, tick "Import documents from your guest session".';
    Messages.install_notes_admin =  "Create your first administrator account on this page. Administrators manage instance settings including storage quotas, and have access to moderation tools.";
    Messages.install_notes_password_note1 = "Your password is the secret key that encrypts all of your documents and administrator privileges on this instance. ";
    Messages.install_notes_password_note2 = "If you lose it there is no way we can recover your data.";

    return Messages;

});
}());
