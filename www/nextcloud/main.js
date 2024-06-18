// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var url = 'http://localhost:3000';
define([
    'jquery',
    url + '/cryptpad-api.js'
], function ($, Api) {
    if (window.top !== window) { return; }
    $(function () {

        // TODO
        // This is a test application
        // It can be used to embed another cryptpad instance using the new API

        console.log(Api);
        var permaKey = localStorage.CP_test_API_key || '/2/integration/edit/X3RlrgR2JhA0rI+PJ3rXufsQ/';
        var key = window.location.hash ? window.location.hash.slice(1)
                                       : permaKey;
        window.location.hash = key;

// Test doc
var mystring = "Hello World!";
var blob = new Blob([mystring], {
    type: 'text/markdown'
});
var docUrl = URL.createObjectURL(blob);
console.warn(docUrl);

localStorage.CP_test_API_key = key;


        var onSave = function (_blob, cb) {
            console.log('APP ONSAVE', _blob);
            docUrl = URL.createObjectURL(_blob);
            console.log('New doc URL', docUrl);
            if (typeof (cb) === "function") { cb(); }
        };
        var onNewKey = function (data, cb) {
            // setTimeout hack because Firefox doesn't have locks for localStorage
            setTimeout(function () {

            var newKey = data.new;
            var oldKey = data.old;
            var stored = localStorage.CP_test_API_key;
            if (stored !== oldKey) {
                console.error(`Deprecated old key "${oldKey}", can't store the new one "${newKey}"`);
                window.location.hash = stored;
                return void cb(stored);
            }
            localStorage.CP_test_API_key = newKey;
            window.location.hash = newKey;
            cb(newKey);

            }, Math.floor(Math.random()*300));
        };


        Api(url, null, {
            document: {
                url: docUrl,
                key: key,
                fileType: 'md'
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
