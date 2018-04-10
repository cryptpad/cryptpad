define([
    'jquery',
    '/common/cryptpad-common.js',
    'css!/user/main.css',
], function ($, Cryptpad) {

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        _onRefresh: []
    };

    var Messages = Cryptpad.Messages;

    var comingSoon = function () {
        var $div = $('<div>', { 'class': 'coming-soon' })
            .text(Messages.comingSoon)
            .append('<br>');
            console.log($div);
        return $div;
    };

    var andThen = function () {
        console.log(APP.$container);
        APP.$container.append(comingSoon());
    };

    $(function () {
        var $main = $('#mainBlock');

        // main block is hidden in case javascript is disabled
        $main.removeClass('hidden');

        APP.$container = $('#container');

        andThen();
    });

});
