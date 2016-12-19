define([
    '/common/cryptget.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Crypt) {
    var $ = window.jQuery;

    var $target = $('#target');
    var $dest = $('#dest');

    var useDoc = function (err, doc) {
        if (err) { return console.error(err); }
        console.log(doc);
        $dest.text(doc);
    };

    $('#get').click(function () {
        var val = $target.val();
        if (!val.trim()) { return; }
        Crypt.get(val, useDoc);
    });

    if (window.location.hash) { Crypt.get(void 0, useDoc); }
});
