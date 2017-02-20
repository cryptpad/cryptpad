define([
    '/bower_components/jquery/dist/jquery.min.js',
    '/common/cryptpad-common.js',
], function (jQuery, Cryptpad) {
    var $ = window.jQuery;

    var $body = $('body');

    var pre = function (text, opt) {
        return $('<pre>', opt).text(text);
    };

    var todo = function (missing) {
        if (missing.length) {
            $body.append(pre(missing.map(function (msg) {
                return '* ' + msg;
            }).join('\n')));
        } else {
            $body.text('All keys are present in all translations');
        }
    };
    Cryptpad.Messages._checkTranslationState(todo);
});
