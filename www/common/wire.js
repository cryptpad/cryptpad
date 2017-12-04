define([

], function () {
    var Wire = {};

    /*  MISSION: write a generic RPC framework

Requirements

* some transmission methods can be interrupted
  * handle disconnects and reconnects
* handle callbacks
* configurable timeout
* Service should expose 'addClient' method
  * and handle broadcast


* 

    */

    var uid = function () {
        return Number(Math.floor(Math.random () *
            Number.MAX_SAFE_INTEGER)).toString(32);
    };

/*
opt = {
    send: function () {

    },
    receive: function () {

    },
    constructor: function (cb) {
        cb(void 0 , {
            send: function (content, cb) {

            },
            receive: function () {

            }
        });
    },
};
*/

    Wire.create = function (opt, cb) {
        var ctx = {};
        var pending = ctx.pending = {};
        ctx.connected = false;

        var rpc = {};

        opt.constructor(function (e, service) {
            if (e) { return setTimeout(function () { cb(e); }); }

            rpc.send = function (type, data, cb) {
                var txid = uid();
                if (typeof(cb) !== 'function') {
                    throw new Error('expected callback');
                }

                ctx.pending[txid] = function (err, response) {
                    cb(err, response);
                };

                service.send(JSON.stringify({
                    txid: txid,
                    message: {
                        command: type,
                        content: data,
                    },
                }));
            };

            service.receive(function (raw) {
                try {
                    var data = JSON.parse(raw);
                    var txid = data.txid;
                    if (!txid) { throw new Error('NO_TXID'); }
                    var cb = pending[txid];
                    if (data.error) { return void cb(data.error); }
                    cb(void 0, data.content);
                } catch (e) { console.error("UNHANDLED_MESSAGE", data); }
            });

            cb(void 0, rpc);
        });
    };


    return Wire;
});
