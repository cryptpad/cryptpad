define([
    'jquery',
    '/common/cryptget.js'
], function ($, Crypt) {
    var $target = $('#target');

    var useDoc = function (err, doc) {
        if (err) { return console.error(err); }
        //console.log(doc);
        $('#putter').val(doc);
    };

    $('#get').click(function () {
        var val = $target.val();
        if (!val.trim()) { return; }
        Crypt.get(val, useDoc);
    });

    $('#put').click(function () {
        var hash = $target.val().trim();
        Crypt.put(hash, $('#putter').val(), function (e) {
            if (e) { console.error(e); }
            $('#get').click();
        });
    });

    $('#open').click(function () {
        window.open('/code/#' + $target.val());
    });

    if (window.location.hash) { Crypt.get(void 0, useDoc); }
});
