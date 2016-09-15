define(['/bower_components/jquery/dist/jquery.min.js'], function() {
    var $ = window.jQuery;
    var out = {};

    var LS_LANG = "CRYPTPAD_LANG";

    var getStoredLanguage = function () {
        return localStorage.getItem(LS_LANG);
    };

    var storeLanguage = function (l) {
        localStorage.setItem(LS_LANG, l);
    };

    var getBrowserLanguage = function () {
        return navigator.language || navigator.userLanguage;
    };

    var getLanguage = out.getLanguage = function () {
        return getStoredLanguage() || getBrowserLanguage();
    };

    var main = out.main = function () {
        var selector = $('#language-selector');
        if (!selector.length) { return; }

        // Select the current language in the list
        var language = getLanguage();
        var option = $(selector).find('option[value="' + language + '"]');
        if ($(option).length) {
            $(selector).val(language);
        }
        else {
            $(selector).val('en');
        }

        // Listen for language change
        $(selector).on('change', function () {
            var newLanguage = $(selector).val();
            storeLanguage(newLanguage);
            if (newLanguage !== language) {
                window.location.reload();
            }
        });

    };

    return out;
});
