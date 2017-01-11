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

    var main = out.main = function ($select) {
        var selector = $select || $('#language-selector');

        if (!selector.length) { return; }

        var $button = $(selector).find('button .buttonTitle');
        // Select the current language in the list
        var language = getLanguage();
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

    return out;
});
