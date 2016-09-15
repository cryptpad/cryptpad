define(['/customize/languageSelector.js',
        '/customize/translations/messages.js',
        '/customize/translations/messages.fr.js',
        '/bower_components/jquery/dist/jquery.min.js'], function(LS, Default, French) {
    var $ = window.jQuery;

    var map = {
        'fr': French
    };

    var defaultLanguage = 'en';

    var language = LS.getLanguage();

    if (!language || language === defaultLanguage || language === 'default' || !map[language]) { return Default; }

    var messages;

    // Add the missing translated keys to the returned object
    messages = $.extend(true, {}, Default, map[language]);

    messages._getKey = function (key, argArray) {
        if (!messages[key]) { return '?'; }
        var text = messages[key];
        return text.replace(/\{(\d+)\}/g, function (str, p1) {
            return argArray[p1] || null;
        });
    };

    return messages;
});
