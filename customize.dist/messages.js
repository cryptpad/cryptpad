define(['/customize/languageSelector.js',
        '/customize/translations/messages.js',
        '/customize/translations/messages.es.js',
        '/customize/translations/messages.fr.js',

    // 1) additional translation files can be added here...

        '/bower_components/jquery/dist/jquery.min.js'],

    // 2) name your language module here...
        function(LS, Default, Spanish, French) {
    var $ = window.jQuery;

    // 3) add your module to this map so it gets used
    var map = {
        'fr': French,
        'es': Spanish,
    };

    var defaultLanguage = 'en';

    var language = LS.getLanguage();

    var messages;

    if (!language || language === defaultLanguage || language === 'default' || !map[language]) {
        messages = Default;
    }
    else {
        // Add the translated keys to the returned object
        messages = $.extend(true, {}, Default, map[language]);
    }

    // messages_languages return the available translations and their name in an object :
    // { "en": "English", "fr": "French", ... }
    messages._languages = {
        'en': Default._languageName
    };
    for (var l in map) {
        messages._languages[l] = map[l]._languageName || l;
    }

    messages._initSelector = LS.main;
    messages._checkTranslationState = function () {
        var missing = [];
        Object.keys(map).forEach(function (code) {
            var translation = map[code];
            Object.keys(Default).forEach(function (k) {
                if (/^_/.test(k) || /nitialState$/.test(k)) { return; }
                if (!translation[k]) {
                    var warning = "key [" + k + "] is missing from translation [" + code + "]";
                    missing.push(warning);
                }
            });
            if (typeof(translation._languageName) !== 'string') {
                var warning = 'key [_languageName] is missing from translation [' + code + ']';
                missing.push(warning);
            }
        });
        return missing;
    };

    // Get keys with parameters
    messages._getKey = function (key, argArray) {
        if (!messages[key]) { return '?'; }
        var text = messages[key];
        return text.replace(/\{(\d+)\}/g, function (str, p1) {
            return argArray[p1] || null;
        });
    };

    var translateText = function (i, e) {
        var $el = $(e);
        var key = $el.data('localization');
        $el.html(messages[key]);
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
        $('#pad-iframe').contents().find('[data-localization]').each(translateText);
        $('[data-localization-title]').each(translateTitle);
        $('[data-localization-placeholder').each(translatePlaceholder);
        $('#pad-iframe').contents().find('[data-localization-title]').each(translateTitle);
    };

    // Non translatable keys
    messages.initialState = [
        '<p>',
        'This is <strong>CryptPad</strong>, the zero knowledge realtime collaborative editor.',
        '<br>',
        'What you type here is encrypted so only people who have the link can access it.',
        '<br>',
        'Even the server cannot see what you type.',
        '</p>',
        '<p>',
        '<small>',
        '<i>What you see here, what you hear here, when you leave here, let it stay here</i>',
        '</small>',
        '</p>',
    ].join('');

    messages.codeInitialState = [
        '/*\n',
        '   This is CryptPad, the zero knowledge realtime collaborative editor.\n',
        '   What you type here is encrypted so only people who have the link can access it.\n',
        '   Even the server cannot see what you type.\n',
        '   What you see here, what you hear here, when you leave here, let it stay here.\n',
        '*/'
    ].join('');

    messages.slideInitialState = [
        '# CryptSlide\n',
        '* This is a zero knowledge realtime collaborative editor.\n',
        '* What you type here is encrypted so only people who have the link can access it.\n',
        '* Even the server cannot see what you type.\n',
        '* What you see here, what you hear here, when you leave here, let it stay here.\n',
        '\n',
        '---',
        '\n',
        '# How to use\n',
        '1. Write your slides content using markdown syntax\n',
        '2. Separate your slides with ---\n',
        '3. Click on the "Play" button to see the result'
    ].join('');

    return messages;
});
