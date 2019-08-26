(function () {
// add your module to this map so it gets used
var map = {
    'ca': 'Català',
    'de': 'Deutsch',
    'el': 'Ελληνικά',
    'es': 'Español',
    'fr': 'Français',
    'it': 'Italiano',
    'nb': 'Norwegian Bokmål',
    'pl': 'Polski',
    'pt-br': 'Português do Brasil',
    'ro': 'Română',
    'ru': 'Русский',
    //'te': 'తెలుగు',
    'zh': '繁體中文',
};

var messages = {};
var LS_LANG = "CRYPTPAD_LANG";
var getStoredLanguage = function () { return localStorage && localStorage.getItem(LS_LANG); };
var getBrowserLanguage = function () { return navigator.language || navigator.userLanguage || ''; };
var getLanguage = messages._getLanguage = function () {
    if (window.cryptpadLanguage) { return window.cryptpadLanguage; }
    if (getStoredLanguage()) { return getStoredLanguage(); }
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
    '/common/common-util.js',
    '/customize/application_config.js',
    '/customize/translations/messages.js'
];
if (language && map[language]) { req.push('/customize/translations/messages.' + language + '.js'); }

define(req, function(Util, AppConfig, Default, Language) {
    map.en = 'English';
    var defaultLanguage = 'en';

    if (AppConfig.availableLanguages) {
        if (AppConfig.availableLanguages.indexOf(language) === -1) {
            language = defaultLanguage;
            Language = Default;
            localStorage.setItem(LS_LANG, language);
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
            if (Util.isObject(b[k])) {
                a[k] = Util.isObject(a[k]) ? a[k] : {};
                extend(a[k], b[k]);
                continue;
            }
            if (Array.isArray(b[k])) {
                a[k] = b[k].slice();
                continue;
            }
            a[k] = b[k] || a[k];
        }
    };

    extend(messages, Default);
    if (Language && language !== defaultLanguage) {
        // Add the translated keys to the returned object
        extend(messages, Language);
    }

    messages._languages = map;
    messages._languageUsed = language;

    messages._checkTranslationState = function (cb) {
        if (typeof(cb) !== "function") { return; }
        var allMissing = [];
        var reqs = [];
        Object.keys(map).forEach(function (code) {
            if (code === defaultLanguage) { return; }
            reqs.push('/customize/translations/messages.' + code + '.js');
        });
        require(reqs, function () {
            var langs = arguments;
            Object.keys(map).forEach(function (code, i) {
                if (code === defaultLanguage) { return; }
                var translation = langs[i];
                var missing = [];
                var checkInObject = function (ref, translated, path) {
                    var updated = {};
                    Object.keys(ref).forEach(function (k) {
                        if (/^updated_[0-9]+_/.test(k) && !translated[k]) {
                            var key = k.split('_').slice(2).join('_');
                            // Make sure we don't already have an update for that key. It should not happen
                            // but if it does, keep the latest version
                            if (updated[key]) {
                                var ek = updated[key];
                                if (parseInt(ek.split('_')[1]) > parseInt(k.split('_')[1])) { return; }
                            }
                            updated[key] = k;
                        }
                    });
                    Object.keys(ref).forEach(function (k) {
                        if (/^_/.test(k) || k === 'driveReadme') { return; }
                        var nPath = path.slice();
                        nPath.push(k);
                        if (!translated[k] || updated[k]) {
                            if (updated[k]) {
                                var uPath = path.slice();
                                uPath.unshift('out');
                                missing.push([code, nPath, 2, uPath.join('.') + '.' + updated[k]]);
                                return;
                            }
                            return void missing.push([code, nPath, 1]);
                        }
                        if (typeof ref[k] !== typeof translated[k]) {
                            return void missing.push([code, nPath, 3]);
                        }
                        if (typeof ref[k] === "object" && !Array.isArray(ref[k])) {
                            checkInObject(ref[k], translated[k], nPath);
                        }
                    });
                    Object.keys(translated).forEach(function (k) {
                        if (/^_/.test(k) || k === 'driveReadme') { return; }
                        var nPath = path.slice();
                        nPath.push(k);
                        if (typeof ref[k] === "undefined") {
                            missing.push([code, nPath, 0]);
                        }
                    });
                };
                checkInObject(Default, translation, []);
                // Push the removals at the end
                missing.sort(function (a, b) {
                    if (a[2] === 0 && b[2] !== 0) { return 1; }
                    if (a[2] !== 0 && b[2] === 0) { return -1; }
                    return 0;
                });
                Array.prototype.push.apply(allMissing, missing); // Destructive concat
            });
            cb(allMissing);
        });
    };

    // Get keys with parameters
    messages._getKey = function (key, argArray) {
        if (!messages[key]) { return '?'; }
        var text = messages[key];
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

    messages.driveReadme = '["BODY",{"class":"cke_editable cke_editable_themed cke_contents_ltr cke_show_borders","contenteditable":"true","spellcheck":"false","style":"color: rgb(51, 51, 51);"},' +
        '[["H1",{},["'+messages.readme_welcome+'"]],["P",{},["'+messages.readme_p1+'"]],["P",{},["'+messages.readme_p2+'"]],["HR",{},[]],["H2",{},["'+messages.readme_cat1+'",["BR",{},[]]]],["UL",{},[["LI",{},["'+messages._getKey("readme_cat1_l1", ['",["STRONG",{},["'+messages.newButton+'"]],"', '",["STRONG",{},["'+messages.type.pad+'"]],"'])+'"]],["LI",{},["'+messages.readme_cat1_l2+'"]],["LI",{},["'+messages._getKey("readme_cat1_l3", ['",["STRONG",{},["'+messages.fm_unsortedName+'"]],"'])+'",["UL",{},[["LI",{},["'+messages._getKey("readme_cat1_l3_l1", ['",["STRONG",{},["'+messages.fm_rootName+'"]],"'])+'"]],["LI",{},["'+messages.readme_cat1_l3_l2+'"]]]]]],["LI",{},["'+messages._getKey("readme_cat1_l4", ['",["STRONG",{},["'+messages.fm_trashName+'"]],"'])+'",["BR",{},[]]]]]],["P",{},[["BR",{},[]]]],["H2",{},["'+messages.readme_cat2+'",["BR",{},[]]]],["UL",{},[["LI",{},["'+messages._getKey("readme_cat2_l1", ['",["STRONG",{},["'+messages.shareButton+'"]],"', '",["STRONG",{},["'+messages.edit+'"]],"', '",["STRONG",{},["'+messages.view+'"]],"'])+'"]],["LI",{},["'+messages.readme_cat2_l2+'"]]]],["P",{},[["BR",{},[]]]],["H2",{},["'+messages.readme_cat3+'"]],["UL",{},[["LI",{},["'+messages.readme_cat3_l1+'"]],["LI",{},["'+messages.readme_cat3_l2+'"]],["LI",{},["'+messages.readme_cat3_l3+'",["BR",{},[]]]]]]],' +
        '{"metadata":{"defaultTitle":"' + messages.driveReadmeTitle + '","title":"' + messages.driveReadmeTitle + '"}}]';

    return messages;

});
}());
