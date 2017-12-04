define([
    'jquery',
    '/customize/messages.js'
], function($, Messages) {
    var LS_LANG = "CRYPTPAD_LANG";

    var Msg = {};

    Msg.getLanguage = Messages._getLanguage;

    // Add handler to the language selector
    Msg.setLanguage = function (l, sframeChan, cb) {
        if (sframeChan) {
            // We're in the sandbox
            sframeChan.query("Q_LANGUAGE_SET", l, cb);
            return;
        }
        localStorage.setItem(LS_LANG, l);
        cb();
    };

    Msg.initSelector = function ($select, sfcommon) {
        var selector = $select || $('#cp-language-selector');

        if (!selector.length) { return; }

        var language = Messages._getLanguage();

        // Select the current language in the list
        selector.setValue(language || 'en');

        // Listen for language change
        $(selector).find('a.cp-language-value').on('click', function () {
            var newLanguage = $(this).attr('data-value');
            Msg.setLanguage(newLanguage, sfcommon && sfcommon.getSframeChannel(), function () {
                if (newLanguage !== language) {
                    if (sfcommon) {
                        sfcommon.gotoURL();
                        return;
                    }
                    window.location.reload();
                }
            });
        });
    };

    Msg.applyTranslation = function () {
        var translateText = function (i, e) {
            var $el = $(e);
            var key = $el.data('localization');
            $el.html(Messages[key]);
        };
        var translateAppend = function (i, e) {
            var $el = $(e);
            var key = $el.data('localization-append');
            $el.append(Messages[key]);
        };
        var translateTitle = function () {
            var $el = $(this);
            var key = $el.data('localization-title');
            $el.attr('title', Messages[key]);
        };
        var translatePlaceholder = function () {
            var $el = $(this);
            var key = $el.data('localization-placeholder');
            $el.attr('placeholder', Messages[key]);
        };
        $('[data-localization]').each(translateText);
        $('[data-localization-append]').each(translateAppend);
        $('[data-localization-title]').each(translateTitle);
        $('[data-localization-placeholder]').each(translatePlaceholder);
        $('#pad-iframe').contents().find('[data-localization]').each(translateText);
        $('#pad-iframe').contents().find('[data-localization-append]').each(translateAppend);
        $('#pad-iframe').contents().find('[data-localization-title]').each(translateTitle);
        $('#pad-iframe').contents().find('[data-localization-placeholder]').each(translatePlaceholder);
    };

    return Msg;

});
