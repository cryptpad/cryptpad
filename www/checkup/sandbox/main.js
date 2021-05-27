define([
    'jquery',

    '/bower_components/tweetnacl/nacl-fast.min.js',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/checkup/app-checkup.less',
], function ($) {
    var postMessage = function (content) {
        window.parent.postMessage(JSON.stringify(content), '*');
    };
    postMessage({ command: "READY", });
    var getHeaders = function (url, cb) {
        $.ajax(url + "?test=" + (+new Date()), {
            dataType: 'text',
            complete: function (xhr) {
                var allHeaders = xhr.getAllResponseHeaders();
                return void cb(void 0, allHeaders, xhr);
            },
        });
    };
    var COMMANDS = {};
    COMMANDS.GET_HEADER = function (content, cb) {
        var url = content.url;
        getHeaders(url, function (err, headers, xhr) {
            cb(xhr.getResponseHeader(content.header));
        });
    };

    window.addEventListener("message", function (event) {
        if (event && event.data) {
            try {
                //console.log(JSON.parse(event.data));
                var msg = JSON.parse(event.data);
                var command = msg.command;
                var txid = msg.txid;
                COMMANDS[command](msg.content, function (response) {
                    // postMessage with same txid
                    postMessage({
                        txid: txid,
                        content: response,
                    });
                });
            } catch (err) {
                console.error(err);
            }
        } else {
            console.error(event);
        }
    });
});
