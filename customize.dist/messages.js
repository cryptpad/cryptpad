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
    'nl': 'Nederlands',
    'pl': 'Polski',
    'pt-br': 'Português do Brasil',
    'pt-pt': 'Português do Portugal',
    'ro': 'Română',
    'ru': 'Русский',
    'sv': 'Svenska',
    //'te': 'తెలుగు',
    'uk': 'Українська',
    'zh_Hans': '中文(簡體)',
    'zh_Hant': '中文(正體)',
};

var Messages = {};
var LS_LANG = "CRYPTPAD_LANG";
var getStoredLanguage = function () { return localStorage && localStorage.getItem(LS_LANG); };
var getBrowserLanguage = function () { return navigator.language || navigator.userLanguage || ''; };
// Normalize browser/localStorage language labels to CryptPad internal keys.
// We keep this centralized to avoid scattered `if (l === 'zh') ...` logic.
var langAliases = {
    'zh': 'zh_Hans',
    'zh-cn': 'zh_Hans',
    'zh-sg': 'zh_Hans',
    'zh-hans': 'zh_Hans',
    'zh_hans': 'zh_Hans',

    'zh-tw': 'zh_Hant',
    'zh-hk': 'zh_Hant',
    'zh-mo': 'zh_Hant',
    'zh-hant': 'zh_Hant',
    'zh_hant': 'zh_Hant'
};
var normalizeLanguage = function (l) {
    if (!l) { return l; }
    // If it already matches a supported internal key, return as-is.
    if (map[l]) { return l; }
    var lLower = String(l).toLowerCase();
    return langAliases[lLower] || l;
};
var getLanguage = Messages._getLanguage = function () {
    if (window.cryptpadLanguage) {
        var original = window.cryptpadLanguage;
        var normalized = normalizeLanguage(original);
        // Migrate legacy localStorage language key.
        if (original === 'zh' && normalized === 'zh_Hans') {
            try { localStorage.setItem(LS_LANG, 'zh_Hans'); } catch (e) { console.log(e); }
        }
        window.cryptpadLanguage = normalized;
        return normalized;
    }
    var l = getBrowserLanguage();
    try {
        l = getStoredLanguage() || getBrowserLanguage();
    } catch (e) { console.log(e); }

    var originalLang = l;
    l = normalizeLanguage(l);
    // Migrate legacy localStorage language key.
    if (originalLang === 'zh' && l === 'zh_Hans') {
        try { localStorage.setItem(LS_LANG, 'zh_Hans'); } catch (e) { console.log(e); }
    }

    if (map[l]) { return l; }

    var dash = (l || '').split('-')[0];
    var under = (l || '').split('_')[0];
    if (map[dash]) { return dash; }
    if (map[under]) { return under; }
    return 'en';
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
// Legacy locale key for Simplified Chinese (before zh_Hans)
reqPaths["/common/translations/messages.zh.js"] = "json!/common/translations/messages.zh_Hans.json";
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

    return Messages;

});
}());
