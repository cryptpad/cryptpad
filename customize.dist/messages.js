(function () {
// add your module to this map so it gets used
var map = {
    'fr': 'Français',
    'es': 'Español',
    'pl': 'Polski',
    'de': 'Deutsch',
    'pt-br': 'Português do Brasil',
    'ro': 'Română',
    'zh': '繁體中文',
	'el': 'Ελληνικά',
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
            (map[l.split('-')[0]] ? l.split('-')[0] : 'en');
};
var language = getLanguage();

var req = ['/common/common-util.js', '/customize/translations/messages.js'];
if (language && map[language]) { req.push('/customize/translations/messages.' + language + '.js'); }

define(req, function(Util, Default, Language) {
    map.en = 'English';
    var defaultLanguage = 'en';

    Util.extend(messages, Default);
    if (Language && language !== defaultLanguage) {
        // Add the translated keys to the returned object
        Util.extend(messages, Language);
    }

    messages._languages = map;
    messages._languageUsed = language;

    messages._checkTranslationState = function (cb) {
        if (typeof(cb) !== "function") { return; }
        var missing = [];
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
                var updated = {};
                Object.keys(Default).forEach(function (k) {
                    if (/^updated_[0-9]+_/.test(k) && !translation[k]) {
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
                Object.keys(Default).forEach(function (k) {
                    if (/^_/.test(k) || k === 'driveReadme') { return; }
                    if (!translation[k] || updated[k]) {
                        if (updated[k]) {
                            missing.push([code, k, 2, 'out.' + updated[k]]);
                            return;
                        }
                        missing.push([code, k, 1]);
                    }
                });
                Object.keys(translation).forEach(function (k) {
                    if (/^_/.test(k) || k === 'driveReadme') { return; }
                    if (!Default[k]) {
                        missing.push([code, k, 0]);
                    }
                });
            });
            cb(missing);
        });
    };

    // Get keys with parameters
    messages._getKey = function (key, argArray) {
        if (!messages[key]) { return '?'; }
        var text = messages[key];
        if (typeof(text) === 'string') {
            return text.replace(/\{(\d+)\}/g, function (str, p1) {
                return argArray[p1] || null;
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
