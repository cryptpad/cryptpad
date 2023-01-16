var url = 'http://localhost:3000';
define([
    'jquery',
    url + '/cryptpad-api.js'
], function ($, Api) {
    if (window.top !== window) { return; }
    $(function () {

        console.log(Api);
        var permaKey = '/2/integration/edit/X3RlrgR2JhA0rI+PJ3rXufsQ/'; // XXX
        var key = window.location.hash ? window.location.hash.slice(1)
                                       : permaKey;

// Test doc
var mystring = "Hello World!";
var blob = new Blob([mystring], {
    type: 'text/markdown'
});
var docUrl = URL.createObjectURL(blob);


        var onSave = function (data) {
            console.log('APP ONSAVE', data);
        };
        var onNewKey = function (newKey) {
            window.location.hash = newKey;
        };


        Api(url, null, {
            document: {
                url: docUrl,
                key: key
            },
            documentType: 'code', // appname
            events: {
                onSave: onSave,
                onNewKey: onNewKey
            }
        }).then(function () {
            console.log('SUCCESS');
        }).catch(function (e) {
            console.error('ERROR', e);
        });


    });
});
