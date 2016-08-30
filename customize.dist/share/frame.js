(function () {

    var Frame = {};

    var uid = function () {
        return Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
            .toString(32).replace(/\./g, '');
    };

    // create an invisible iframe with a given source
    // append it to a parent element
    // execute a callback when it has loaded
    var create = Frame.create = function (parent, src, onload, timeout) {
        var iframe = document.createElement('iframe');

        timeout = timeout || 10000;
        var to = window.setTimeout(function () {
            onload('[timeoutError] could not load iframe at ' + src);
        }, timeout);

        iframe.onload = function (e) {
            onload(void 0, iframe, e);
            window.clearTimeout(to);
        };
        iframe.setAttribute('src', src);
        iframe.style.display = 'none';

        parent.appendChild(iframe);
    };

    /*  given an iframe with an rpc script loaded, create a frame object
        with an asynchronous 'send' method */
    var open = Frame.open = function (e, A, timeout) {
        var win = e.contentWindow;

        var frame = {};

        var listeners = {};
        var timeouts = {};

        timeout = timeout || 5000;

        var accepts = frame.accepts = function (o) {
            return A.some(function (e) {
                 switch (typeof(e)) {
                    case 'string': return e === o;
                    case 'object': return e.test(o);
                }
            });
        };

        var changeHandlers = frame.changeHandlers = [];

        var change = frame.change = function (f) {
            if (typeof(f) !== 'function') {
                throw new Error('[Frame.change] expected callback');
            }
            changeHandlers.push(f);
        };

        var _listener = function (e) {
            if (!frame.accepts(e.origin)) {
                console.log("message from %s rejected!", e.origin);
                return;
            }
            var message = JSON.parse(e.data);
            var uid = message._uid;
            var error = message.error;
            var data = message.data;

            if (!uid) {
                console.log("No uid!");
                return;
            }

            if (uid === 'change' && changeHandlers.length) {
                changeHandlers.forEach(function (f) {
                    f(data);
                });
                return;
            }

            if (timeouts[uid]) {
                window.clearTimeout(timeouts[uid]);
            }
            if (listeners[uid]) {
                listeners[uid](error, data, e);
                delete listeners[uid];
            }
        };
        window.addEventListener('message', _listener);

        var close = frame.close = function () {
            window.removeEventListener('message', _listener);
        };

        /*  method (string): (set|get|remove)
            key (string)
            data (string)
            cb (function) */
        var send = frame.send = function (method, key, data, cb) {
            var req = {
                method: method,
                key: key,
                data: data,
            };

            var id = req._uid = uid();
            // uid must not equal 'change'
            while(id === 'change') {
                id = req._uid = uid();
            }

            if (typeof(cb) === 'function') {
                //console.log("setting callback!");
                listeners[id] = cb;
                //console.log("setting timeout of %sms", timeout);
                timeouts[id] = window.setTimeout(function () {
                    // when the callback is executed it will clear this timeout
                    cb('[TimeoutError] request timed out after ' + timeout + 'ms');
                }, timeout);
            } else {
                console.log(typeof(cb));
            }

            win.postMessage(JSON.stringify(req), '*');
        };

        var set = frame.set = function (key, val, cb) {
            send('set', key, val, cb);
        };

        var batchset = frame.setBatch = function (map, cb) {
            send('batchset', void 0, map, cb);
        };

        var get = frame.get = function (key, cb) {
            send('get', key, void 0, cb);
        };

        var batchget = frame.getBatch = function (keys, cb) {
            send('batchget', void 0, keys, cb);
        };

        var remove = frame.remove = function (key, cb) {
            send('remove', key, void 0, cb);
        };

        var batchremove = frame.removeBatch = function (keys, cb) {
            send('batchremove', void 0, keys, cb);
        };

        var keys = frame.keys = function (cb) {
            send('keys', void 0, void 0, cb);
        };

        return frame;
    };

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = Frame;
    }
    else if ((typeof(define) !== 'undefined' && define !== null) &&
            (define.amd !== null)) {
        define([
            '/bower_components/jquery/dist/jquery.min.js',
        ], function () {
            return Frame;
        });
    } else {
        window.Frame = Frame;
    }
}());
