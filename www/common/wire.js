define([

], function () {
    var Wire = {};

    /*  MISSION: write a generic RPC framework

Requirements

* [x] some transmission methods can be interrupted
  * [x] handle disconnects and reconnects
* [x] handle callbacks
* [x] configurable timeout
* [x] be able to answer only queries with a particular id
* be able to implement arbitrary listeners on the service-side
  * and not call 'ready' until those listeners are ready
* identical API for:
  * iframe postMessage
  * server calls over netflux
  * postMessage to webworker
  * postMessage to sharedWorker
* on-wire protocol should actually be the same for rewriting purposes
  * q
  * guid (globally unique id)
  * txid (message id)
  * content
* be able to compose different RPCs as streams
  * intercept and rewrite capacity
  * multiplex multiple streams over one stream
  * blind redirect
  * intelligent router
    * broadcast (with ACK?)
    * message


    */

    var uid = Wire.uid = function () {
        return Number(Math.floor(Math.random () *
            Number.MAX_SAFE_INTEGER)).toString(32);
    };


/*  tracker(options)
    maintains a registry of asynchronous function calls

allows you to:
    hook each call to actually send to a remote service...
    abort any call
    trigger the pending callback with arguments
    set the state of the tracker (active/inactive)


*/
    Wire.tracker = function (opt) {
        opt = opt || {};
        var hook = opt.hook || function () {};
        var timeout = opt.timeout || 5000;
        var pending = {};
        var timeouts = {};

        var call = function (method, data, cb) {
            var id = uid();

            // if the callback is not invoked in time, time out
            timeouts[id] = setTimeout(function () {
                if (typeof(pending[id]) === 'function') {
                    cb("TIMEOUT");
                    delete pending[id];
                    return;
                }
                throw new Error('timed out without function to call');
            }, timeout);

            pending[id] = function () {
                // invoke the function with arguments...
                cb.apply(null, Array.prototype.slice.call(arguments));
                // clear its timeout
                clearTimeout(timeouts[id]);
                // remove the function from pending
                delete pending[id];
            };

            hook(id, method, data);

            return id;
        };

        var respond = function (id, err, response) {
            if (typeof(pending[id]) !== 'function') {
                throw new Error('invoked non-existent callback');
            }
            pending[id](err, response);
        };

        var abort = function (id) {
            if (pending[id]) {
                clearTimeout(timeouts[id]);
                delete pending[id];
                return true;
            }
            return false;
        };

        var t = {
            call: call,
            respond: respond,
            abort: abort,
            state: true,
        };

        t.setState = function (active) {
            t.state = Boolean(active);
        };

        return t;
    };

/*
opt = {
    timeout: 30000,
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

    var parseMessage = function (raw) {
        try { return JSON.parse(raw); } catch (e) { return; }
    };

    Wire.create = function (opt, cb) {
        opt.constructor(function (e, service) {
            if (e) { return setTimeout(function () { cb(e); }); }
            var rpc = {};

            var guid = Wire.uid();
            var t = Wire.tracker({
                timeout: opt.timeout,
                hook: function (txid, q, content) {
                    service.send(JSON.stringify({
                        guid: guid,
                        q: q,
                        txid: txid,
                        content: content,
                    }));
                },
            });

            rpc.send = function (type, data, cb) {
                t.call(type, data, cb);
            };

            service.receive(function (raw) {
                var data = parseMessage(raw);
                if (typeof(data) === 'undefined') {
                    return console.error("UNHANDLED_MESSAGE", raw);
                }
                if (!data.txid) { throw new Error('NO_TXID'); }
                t.respond(data.txid, data.error, data.content);
            });

            cb(void 0, rpc);
        });
    };

    return Wire;
});
