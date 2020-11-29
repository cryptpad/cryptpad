(function () {
var LS_LANG = "CRYPTPAD_LANG";

// add your module to this map so it gets used
var map = {
    'de': 'Deutsch',
    'es': 'Español',
    'fr': 'Français',
    //'it': 'Italiano',
};

var getStoredLanguage = function () { return localStorage.getItem(LS_LANG); };
var getBrowserLanguage = function () { return navigator.language || navigator.userLanguage; };
var getLanguage = function () {
    if (window.cryptpadLanguage) { return window.cryptpadLanguage; }
    if (getStoredLanguage()) { return getStoredLanguage(); }
    var l = getBrowserLanguage() || '';
    if (Object.keys(map).indexOf(l) !== -1) {
        return l;
    }
    // Edge returns 'fr-FR' --> transform it to 'fr' and check again
    return Object.keys(map).indexOf(l.split('-')[0]) !== -1 ? l.split('-')[0] : 'en';
};
var language = getLanguage();

var req = ['jquery', 'json!/accounts/resources/translations/messages.json'];
if (language && map[language]) { req.push('json!/accounts/resources/translations/messages.' + language + '.json'); }

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

    // TODO
    messages._checkTranslationState = function (cb) {
        if (typeof(cb) !== "function") { return; }
        var allMissing = [];
        var reqs = [];
        Object.keys(externalMap).forEach(function (code) {
            reqs.push('/resources/translations/messages.' + code + '.js');
        });
        require(reqs, function () {
            var langs = arguments;
            Object.keys(externalMap).forEach(function (code, i) {
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

    // Add handler to the language selector
    var storeLanguage = function (l) {
        localStorage.setItem(LS_LANG, l);
    };
    messages._initSelector = function ($select) {
        var selector = $select || $('#language-selector');

        if (!selector.length) { return; }

        var $button = $(selector).find('button .buttonTitle');
        // Select the current language in the list
        var option = $(selector).find('[data-value="' + language + '"]');
        selector.setValue(language || 'English');

        // Listen for language change
        $(selector).find('a.languageValue').on('click', function () {
            var newLanguage = $(this).attr('data-value');
            storeLanguage(newLanguage);
            if (newLanguage !== language) {
                setTimeout(function () { window.location.reload(); });
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
    var translateTitle = function (i, e) {
        var $el = $(this);
        var key = $el.data('localization-title');
        $el.attr('title', messages[key]);
    };
    var translatePlaceholder = function (i, e) {
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

    messages._getLanguage = function () { return language; };

    return messages;

});
}());
