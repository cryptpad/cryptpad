(function () {
var LS_LANG = "CRYPTPAD_LANG";

var getStoredLanguage = function () { return localStorage.getItem(LS_LANG); };
var getBrowserLanguage = function () { return navigator.language || navigator.userLanguage; };
var getLanguage = function () { return getStoredLanguage() || getBrowserLanguage(); };
var language = getLanguage();

// add your module to this map so it gets used
var map = {
    'fr': 'Français',
    'es': 'Español',
    'pl': 'Polski',
    'de': 'Deutsch',
    'pt-br': 'Português do Brasil'
};

var req = ['/customize/translations/messages.js'];
if (language && map[language]) { req.push('/customize/translations/messages.' + language + '.js'); }
req.push('/bower_components/jquery/dist/jquery.min.js');

define(req, function(Default, Language) {
    var $ = window.jQuery;

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
                    if (/^_/.test(k)) { return; }
                    if (!translation[k] || updated[k]) {
                        if (updated[k]) {
                            missing.push([code, k, 2, 'out.' + updated[k]]);
                            return;
                        }
                        missing.push([code, k, 1]);
                    }
                });
                Object.keys(translation).forEach(function (k) {
                    if (/^_/.test(k)) { return; }
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

        var $button = $(selector).find('button .buttonTitle');
        // Select the current language in the list
        var option = $(selector).find('[data-value="' + language + '"]');
        if ($(option).length) {
            $button.text($(option).text());
        }
        else {
            $button.text('English');
        }

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

    /*messages.driveReadme = '["BODY",{"class":"cke_editable cke_editable_themed cke_contents_ltr cke_show_borders","contenteditable":"true","spellcheck":"false","style":"color: rgb(51, 51, 51);"},' +
        '[["H1",{},["' + messages.driveReadme_h1 + '",["BR",{},[]]]],["UL",{},[["LI",{},["' + messages.driveReadme_li1 + '",["BR",{},[]],["UL",{},[["LI",{},["' + messages.driveReadme_li1_1 + '",["BR",{},[]]]]]]]]]]],' +
        '{"metadata":{"defaultTitle":"' + messages.driveReadmeTitle + '","title":"' + messages.driveReadmeTitle + '"}}]';
*/
    messages.driveReadme = '[["H1",{},["'+messages.readme_welcome+'"]],["P",{},["'+messages.readme_p1+'"]],["P",{},["'+messages.readme_p2+'"]],["HR",{},[]],["H2",{},["'+messages.readme_cat1+'",["BR",{},[]]]],["UL",{},[["LI",{},["'+messages._getKey("readme_cat1_l1", ['",["STRONG",{},["'+messages.newButton+'"]],"', '",["STRONG",{},["'+messages.type.pad+'"]],"'])+'"]],["LI",{},["'+messages.readme_cat1_l2+'"]],["LI",{},["'+messages._getKey("readme_cat1_l3", ['",["STRONG",{},["'+messages.unsortedName+'"]],"'])+'",["UL",{},[["LI",{},["You can click and drag files into folders in the ",["STRONG",{},["Documents"]]," section of your drive and make new folders."]],["LI",{},["Remember to try right clicking on icons because there are often additional menus."]]]]]],["LI",{},["Put old pads in the trash: You can click and drag your pads into the ",["STRONG",{},["Trash"]]," the same way you drag them into folders.",["BR",{},[]]]]]],["P",{},[["BR",{},[]]]],["H2",{},["Make pads like a pro",["BR",{},[]]]],["UL",{},[["LI",{},["The ",["STRONG",{},["Share"]]," button in your pad allows you to give access to collaborators to either ",["STRONG",{},["edit"]]," or to ",["STRONG",{},["view"]]," the pad."]],["LI",{},["Change the title of the pad by clicking on the pencil"]]]],["P",{},[["BR",{},[]]]],["H2",{},["Discover CryptPad apps"]],["UL",{},[["LI",{},["With CryptPad code editor, you can collaborate on code like Javascript and markdown like HTML and Markdown"]],["LI",{},["With CryptPad slide editor, you can make quick presentations using Markdown"]],["LI",{},["With CryptPoll you can take quick votes, especially for scheduling meetings which fit with everybody\'s calander",["BR",{},[]]]]]]]';

    return messages;

});
}());
