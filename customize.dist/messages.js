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
    'zh': '中文(簡體)', // simplified
    'zh_Hant': '中文(正體)', // traditional
};

var Messages = {};
var LS_LANG = "CRYPTPAD_LANG";
var getStoredLanguage = function () { return localStorage && localStorage.getItem(LS_LANG); };
var getBrowserLanguage = function () { return navigator.language || navigator.userLanguage || ''; };
// Normalize browser/localStorage language labels to CryptPad internal keys.
// We keep this centralized to avoid scattered `if (l === 'zh') ...` logic.
var langAliases = {
    'zh-cn': 'zh',
    'zh-sg': 'zh',
    'zh-hans': 'zh',

    'zh-tw': 'zh_Hant',
    'zh-hk': 'zh_Hant',
    'zh-mo': 'zh_Hant',
    'zh-hant': 'zh_Hant',
};
var normalizeLanguage = function (l) {
    if (!l) { return l; }
    // If it already matches a supported internal key, return as-is.
    if (map[l]) { return l; }
    var lLower = String(l).toLowerCase().replace('_', '-');
    return langAliases[lLower] || l;
};
var getLanguage = Messages._getLanguage = function () {
    if (window.cryptpadLanguage) { return window.cryptpadLanguage; }

    var l = getBrowserLanguage();
    try {
        l = getStoredLanguage() || getBrowserLanguage();
    } catch (e) { console.log(e); }
    l = normalizeLanguage(l);

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

    // WIP
    Messages.features_page_title = "CryptPad features";
    Messages.features_page_subtitle = "One private workspace. Everything connected.";
    Messages.features_teamwork_title = "Everything you need to stay organized";
    Messages.features_learn_more = "Learn more";
    Messages.features_code_subtitle = "An encrypted markdown code editor";
    Messages.features_code_content = "In addition to the basic lightweight syntax, CryptPad supports diagrams with Mermaid.js, mindmaps with Markmap, and mathematical equations with Mathjax.";
    Messages.features_diagram_subtitle = "Versatile diagramming options";
    Messages.features_diagram_content = "CryptPad Diagram is the collaboration diagram tool for secure mind-mapping, flowcharts, whiteboard, and more.";
    Messages.features_forms_subtitle = "Customizable and responsive design";
    Messages.features_forms_content = "The privacy-first Google Forms alternative to create and share surveys, without sharing your data with unwanted third-parties.";
    Messages.features_kanban_subtitle = "Drag-and-drop interface";
    Messages.features_kanban_content = "A secure and customizable kanban board app for organizing tasks, ideas, and workflows, all end-to-end encrypted and hosted in EU.";
    Messages.features_presentation_subtitle = "Presentations made with familiar tools";
    Messages.features_presentation_content = "Format slides with text, images, shapes, and transitions. This presentation editor gives you the functionality you'd expect, without the surveillance.";
    Messages.features_sheet_subtitle = "Flexible file support";
    Messages.features_sheet_content = "Import .xlsx, .ods, or .csv. Export .xlsx, .pdf, or .html. Sheets delivers the same experience as popular spreadsheets. If you've used Excel or Google Sheets, CryptPad's interface will feel instantly natural.";
    Messages.features_word_subtitle = "Comprehensive editing tools";
    Messages.features_word_content = "CryptPad Document is a privacy-first Microsoft Word and Google Docs alternative that allows you to create and collaborate in real time.";
    Messages.features_slides_subtitle = "Code-driven presentations";
    Messages.features_slides_content = "Create sleek, fast presentations using simple Markdown syntax with instant side-by-side preview.";
    Messages.features_richtext_subtitle = "Quick and collaborative text editing";
    Messages.features_richtext_content = "A lightweight and straightforward rich-text pad for quick notes, documentation, and real-time collaborative writing.";
    Messages.features_doc_subtitle = "Comprehensive editing tools";
    Messages.features_doc_content = "CryptPad Document is a privacy-first Microsoft Word and Google Docs alternative that allows you to create and collaborate in real time.";
    Messages.features_slide_subtitle = "Code-driven presentations";
    Messages.features_slide_content = "Create sleek, fast presentations using simple Markdown syntax with instant side-by-side preview.";
    Messages.features_pad_subtitle = "Quick and collaborative text editing";
    Messages.features_pad_content = "A lightweight and straightforward rich-text pad for quick notes, documentation, and real-time collaborative writing.";
    Messages.features_info_private_title = "Private by design";
    Messages.features_info_private_content = "Work in a suite designed for privacy-first collaboration.";
    Messages.features_info_collab_title = "Real-time collaboration";
    Messages.features_info_collab_content = "Keep the team in the same document, board or plan.";
    Messages.features_info_workspace_title = "One connected workspace";
    Messages.features_info_workspace_content = "Move naturally between creation, planning and storage.";
    Messages.features_info_control_title = "Fine-grained control";
    Messages.features_info_control_content = "Choose who can access, view and contribute to your work.";
    Messages.features_info_drive_content = "Store, organize, and share all your encrypted files and folders in one central workspace.";
    Messages.features_info_teams_content = "Create dedicated shared spaces with role-based permissions to collaborate smoothly across your organization.";
    Messages.features_info_calendar_content = "Plan schedules, manage events, and share private calendars with teammates without exposing your agenda.";
    Messages.features_info_contacts_content = "Connect securely with collaborators, verify identities, and share documents directly with trusted people.";
    Messages.features_try_title = "Ready when you are";
    Messages.features_try_subtitle = "Bring your next project into one private workspace.";
    Messages.features_try_content= "Explore the apps, organise the work in Drive and collaborate with clear control.";
    Messages.features_try_button = "Try it now";
    Messages.help_generic = "Learn more";
    return Messages;

});
}());
