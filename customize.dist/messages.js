(function () {
var LS_LANG = "CRYPTPAD_LANG";

// add your module to this map so it gets used
var map = {
    'fr': 'Français',
    'es': 'Español',
    'pl': 'Polski',
    'de': 'Deutsch',
    'pt-br': 'Português do Brasil',
    'ro': 'Română',
};

var getStoredLanguage = function () { return localStorage.getItem(LS_LANG); };
var getBrowserLanguage = function () { return navigator.language || navigator.userLanguage; };
var getLanguage = function () {
    if (getStoredLanguage()) { return getStoredLanguage(); }
    var l = getBrowserLanguage() || '';
    if (Object.keys(map).indexOf(l) !== -1) {
        return l;
    }
    // Edge returns 'fr-FR' --> transform it to 'fr' and check again
    return Object.keys(map).indexOf(l.split('-')[0]) !== -1 ? l.split('-')[0] : 'en';
};
var language = getLanguage();

var req = ['jquery', '/customize/translations/messages.js'];
if (language && map[language]) { req.push('/customize/translations/messages.' + language + '.js'); }

define(req, function($, Default, Language) {

    var externalMap = JSON.parse(JSON.stringify(map));

    map.en = 'English';
    var defaultLanguage = 'en';

    var messages;

    if (!Language || !language || language === defaultLanguage || language === 'default' || !map[language]) {
        messages = Default;
    }
    else {
        // Add the translated keys to the returned object
        messages = $.extend(true, {}, Default, Language);
    }

    messages._languages = map;

    messages._checkTranslationState = function (cb) {
        if (typeof(cb) !== "function") { return; }
        var missing = [];
        var reqs = [];
        Object.keys(externalMap).forEach(function (code) {
            reqs.push('/customize/translations/messages.' + code + '.js');
        });
        require(reqs, function () {
            var langs = arguments;
            Object.keys(externalMap).forEach(function (code, i) {
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

    // Add handler to the language selector
    var storeLanguage = function (l) {
        localStorage.setItem(LS_LANG, l);
    };
    messages._initSelector = function ($select) {
        var selector = $select || $('#language-selector');

        if (!selector.length) { return; }

        // Select the current language in the list
        selector.setValue(language || 'English');

        // Listen for language change
        $(selector).find('a.languageValue').on('click', function () {
            var newLanguage = $(this).attr('data-value');
            storeLanguage(newLanguage);
            if (newLanguage !== language) {
                window.location.reload();
            }
        });
    };

    var translateText = function (i, e) {
        var $el = $(e);
        var key = $el.data('localization');
        $el.html(messages[key]);
    };
    var translateAppend = function (i, e) {
        var $el = $(e);
        var key = $el.data('localization-append');
        $el.append(messages[key]);
    };
    var translateTitle = function () {
        var $el = $(this);
        var key = $el.data('localization-title');
        $el.attr('title', messages[key]);
    };
    var translatePlaceholder = function () {
        var $el = $(this);
        var key = $el.data('localization-placeholder');
        $el.attr('placeholder', messages[key]);
    };
    messages._applyTranslation = function () {
        $('[data-localization]').each(translateText);
        $('[data-localization-append]').each(translateAppend);
        $('#pad-iframe').contents().find('[data-localization]').each(translateText);
        $('[data-localization-title]').each(translateTitle);
        $('[data-localization-placeholder]').each(translatePlaceholder);
        $('#pad-iframe').contents().find('[data-localization-title]').each(translateTitle);
    };

    messages.driveReadme = '["BODY",{"class":"cke_editable cke_editable_themed cke_contents_ltr cke_show_borders","contenteditable":"true","spellcheck":"false","style":"color: rgb(51, 51, 51);"},' +
        '[["H1",{},["'+messages.readme_welcome+'"]],["P",{},["'+messages.readme_p1+'"]],["P",{},["'+messages.readme_p2+'"]],["HR",{},[]],["H2",{},["'+messages.readme_cat1+'",["BR",{},[]]]],["UL",{},[["LI",{},["'+messages._getKey("readme_cat1_l1", ['",["STRONG",{},["'+messages.newButton+'"]],"', '",["STRONG",{},["'+messages.type.pad+'"]],"'])+'"]],["LI",{},["'+messages.readme_cat1_l2+'"]],["LI",{},["'+messages._getKey("readme_cat1_l3", ['",["STRONG",{},["'+messages.fm_unsortedName+'"]],"'])+'",["UL",{},[["LI",{},["'+messages._getKey("readme_cat1_l3_l1", ['",["STRONG",{},["'+messages.fm_rootName+'"]],"'])+'"]],["LI",{},["'+messages.readme_cat1_l3_l2+'"]]]]]],["LI",{},["'+messages._getKey("readme_cat1_l4", ['",["STRONG",{},["'+messages.fm_trashName+'"]],"'])+'",["BR",{},[]]]]]],["P",{},[["BR",{},[]]]],["H2",{},["'+messages.readme_cat2+'",["BR",{},[]]]],["UL",{},[["LI",{},["'+messages._getKey("readme_cat2_l1", ['",["STRONG",{},["'+messages.shareButton+'"]],"', '",["STRONG",{},["'+messages.edit+'"]],"', '",["STRONG",{},["'+messages.view+'"]],"'])+'"]],["LI",{},["'+messages.readme_cat2_l2+'"]]]],["P",{},[["BR",{},[]]]],["H2",{},["'+messages.readme_cat3+'"]],["UL",{},[["LI",{},["'+messages.readme_cat3_l1+'"]],["LI",{},["'+messages.readme_cat3_l2+'"]],["LI",{},["'+messages.readme_cat3_l3+'",["BR",{},[]]]]]]],' +
        '{"metadata":{"defaultTitle":"' + messages.driveReadmeTitle + '","title":"' + messages.driveReadmeTitle + '"}}]';

    return messages;

});
}());
