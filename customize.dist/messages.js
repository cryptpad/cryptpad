define(['/customize/languageSelector.js',
        '/customize/translations/messages.js',
        '/customize/translations/messages.es.js',
        '/customize/translations/messages.fr.js',
        '/bower_components/jquery/dist/jquery.min.js'], function(LS, Default, Spanish, French) {
    var $ = window.jQuery;

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

    messages._applyTranslation = function () {
        $('[data-localization]').each(function (i, e) {
            var $el = $(this);
            var key = $el.data('localization');
            $el.html(messages[key]);
        });
        $('[data-localization-title]').each(function (i, e) {
            var $el = $(this);
            var key = $el.data('localization-title');
            $el.attr('title', messages[key]);
        });
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
