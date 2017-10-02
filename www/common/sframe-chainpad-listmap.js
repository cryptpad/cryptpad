require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-json-validator/json-ot.js',
    'json.sortify',
    '/bower_components/textpatcher/TextPatcher.js',
], function (Realtime, JsonOT, Sortify, TextPatcher) {
    var api = {};
    // "Proxy" is undefined in Safari : we need to use an normal object and check if there are local
    // changes regurlarly.
    var isFakeProxy = typeof window.Proxy === "undefined";

    var DeepProxy = api.DeepProxy = (function () {
        var deepProxy = {};

        var isArray = deepProxy.isArray = Array.isArray || function (obj) {
            return Object.toString(obj) === '[object Array]';
        };

        /*  Arrays and nulls both register as 'object' when using native typeof
            we need to distinguish them as their own types, so use this instead. */
        var type = deepProxy.type = function (dat) {
            return dat === null?  'null': isArray(dat)?'array': typeof(dat);
        };

        /*  Check if an (sub-)element in an object or an array and should be a proxy.
            If the browser doesn't support Proxy, return false */
        var isProxyable = deepProxy.isProxyable = function (obj, forceCheck) {
            if (typeof forceCheck === "undefined" && isFakeProxy) { return false; }
            return ['object', 'array'].indexOf(type(obj)) !== -1;
        };

        /*  Any time you set a value, check its type.
            If that type is proxyable, make a new proxy. */
        var setter = deepProxy.set = function (cb) {
            return function (obj, prop, value) {
                if (prop === 'on') {
                    throw new Error("'on' is a reserved attribute name for realtime lists and maps");
                }
                if (isProxyable(value)) {
                    obj[prop] = deepProxy.create(value, cb);
                } else {
                    obj[prop] = value;
                }

                cb();
                return obj[prop] || true; // always return truthey or you have problems
            };
        };

        var pathMatches = deepProxy.pathMatches = function (path, pattern) {
            return !pattern.some(function (x, i) {
                return x !== path[i];
            });
        };

        var lengthDescending = function (a, b) { return b.pattern.length - a.pattern.length; };

        /*  TODO implement 'off' as well.
            change 'setter' to warn users when they attempt to set 'off'
        */
        var on = function(events) {
            return function (evt, pattern, f) {
                switch (evt) {
                    case 'change':
                        // pattern needs to be an array
                        pattern = type(pattern) === 'array'? pattern: [pattern];

                        events.change.push({
                            cb: function (oldval, newval, path, root) {
                                if (pathMatches(path, pattern)) {
                                    return f(oldval, newval, path, root);
                                }
                            },
                            pattern: pattern,
                        });
                        // sort into descending order so we evaluate in order of specificity
                        events.change.sort(lengthDescending);

                        break;
                    case 'remove':
                        pattern = type(pattern) === 'array'? pattern: [pattern];

                        events.remove.push({
                            cb: function (oldval, path, root) {
                                if (pathMatches(path, pattern)) { return f(oldval, path, root); }
                            },
                            pattern: pattern,
                        });

                        events.remove.sort(lengthDescending);

                        break;
                    case 'ready':
                        events.ready.push({
                            // on('ready' has a different signature than 
                            // change and delete, so use 'pattern', not 'f'

                            cb: function (info) {
                                pattern(info);
                            }
                        });
                        break;
                    case 'disconnect':
                        events.disconnect.push({
                            cb: function (info) {
                                // as above
                                pattern(info);
                            }
                        });
                        break;
                    case 'reconnect':
                        events.reconnect.push({
                            cb: function (info) {
                                // as above
                                pattern(info);
                            }
                        });
                        break;
                    case 'create':
                        events.create.push({
                            cb: function (info) {
                                pattern(info);
                            }
                        });
                        break;
                    default:
                        break;
                }
                return this;
            };
        };

        var getter = deepProxy.get = function (/* cb */) {
            var events = {
                disconnect: [],
                reconnect: [],
                change: [],
                ready: [],
                remove: [],
                create: [],
            };

            return function (obj, prop) {
                if (prop === 'on') {
                    return on(events);
                } else if (prop === '_isProxy') {
                    return true;
                } else if (prop === '_events') {
                    return events;
                }
                return obj[prop];
            };
        };

        var deleter = deepProxy.delete = function (cb) {
            return function (obj, prop) {
                if (typeof(obj[prop]) === 'undefined') { return true; }
                delete obj[prop];
                cb();
                return true;
            };
        };

        var handlers = deepProxy.handlers = function (cb, isRoot) {
            if (!isRoot) {
                return {
                    set: setter(cb),
                    get: function (obj, prop) {
                        if (prop === '_isProxy') {
                            return true;
                        }
                        return obj[prop];
                    },
                    deleteProperty: deleter(cb),
                };
            }
            return {
                set: setter(cb),
                get: getter(cb),
                deleteProperty: deleter(cb),
            };
        };

        var remoteChangeFlag = deepProxy.remoteChangeFlag = false;

        var stringifyFakeProxy = deepProxy.stringifyFakeProxy = function (proxy) {
            var copy = JSON.parse(Sortify(proxy));
            delete copy._events;
            delete copy._isProxy;
            return Sortify(copy);
        };

        deepProxy.checkLocalChange = function (obj, cb) {
            if (!isFakeProxy) { return; }
            var oldObj = stringifyFakeProxy(obj);
            window.setInterval(function() {
                var newObj = stringifyFakeProxy(obj);
                if (newObj !== oldObj) {
                    oldObj = newObj;
                    if (remoteChangeFlag) {
                        remoteChangeFlag = false;
                    } else {
                        cb();
                    }
                }
            },300);
        };

        var create = deepProxy.create = function (obj, opt, isRoot) {
            /*  recursively create proxies in case users do:
                `x.a = {b: {c: 5}};

                otherwise the inner object is not a proxy, which leads to incorrect
                behaviour on the client that initiated the object (but not for
                clients that receive the objects) */

            // if the user supplied a callback, use it to create handlers
            // this saves a bit of work in recursion
            var methods = type(opt) === 'function'? handlers(opt, isRoot) : opt;
            switch (type(obj)) {
                case 'object':
                    var keys = Object.keys(obj);
                    keys.forEach(function (k) {
                        if (isProxyable(obj[k]) && !obj[k]._isProxy) {
                            obj[k] = create(obj[k], opt);
                        }
                    });
                    break;
                case 'array':
                    obj.forEach(function (o, i) {
                        if (isProxyable(o) && !o._isProxy) {
                            obj[i] = create(obj[i], opt);
                        }
                    });
                    break;
                default:
                    // if it's not an array or object, you don't need to proxy it
                    throw new Error('attempted to make a proxy of an unproxyable object');
            }
            if (!isFakeProxy) {
                if (obj._isProxy) {
                    return obj;
                }
                return new window.Proxy(obj, methods);
            }

            var proxy = JSON.parse(JSON.stringify(obj));

            if (isRoot) {
                var events = {
                    disconnect: [],
                    reconnect: [],
                    change: [],
                    ready: [],
                    remove: [],
                    create: [],
                };
                proxy.on = on(events);
                proxy._events = events;
            }
            return proxy;
        };

        // onChange(path, key, root, oldval, newval)
        var onChange = function (path, key, root, oldval, newval) {
            var P = path.slice(0);
            P.push(key);

            /*  returning false in your callback terminates 'bubbling up'
                we can accomplish this with Array.some because we've presorted
                listeners by the specificity of their path
            */
            root._events.change.some(function (handler) {
                return handler.cb(oldval, newval, P, root) === false;
            });
        };

        var find = deepProxy.find = function (map, path) {
            /* safely search for nested values in an object via a path */
            return (map && path.reduce(function (p, n) {
                return typeof p[n] !== 'undefined' && p[n];
            }, map)) || undefined;
        };

        var onRemove = function (path, key, root, old, top) {
            var newpath = path.concat(key);
            var X = find(root, newpath);

            var t_X = type(X);

            /*  TODO 'find' is correct but unnecessarily expensive.
                optimize it. */

            switch (t_X) {
                case 'array':

                    if (top) {
                        // the top of an onremove should emit an onchange instead
                        onChange(path, key, root, old, undefined);// no newval since it's a deletion
                    } else {
                        root._events.remove.forEach(function (handler) {
                            return handler.cb(X, newpath, root);
                        });
                    }
                    // remove all of the array's children
                    X.forEach(function (x, i) {
                        onRemove(newpath, i, root);
                    });

                    break;
                case 'object':
                    if (top) {
                        onChange(path, key, root, old, undefined);// no newval since it's a deletion
                    } else {
                        root._events.remove.forEach(function (handler) {
                            return handler.cb(X, newpath, root, old, false);
                        });
                    }
                    // remove all of the object's children
                    Object.keys(X).forEach(function (key) {
                        onRemove(newpath, key, root, X[key], false);
                    });

                    break;
                default:
                    root._events.remove.forEach(function (handler) {
                        return handler.cb(X, newpath, root);
                    });
                    break;
            }
        };

        /*  compare a new object 'B' against an existing proxy object 'A'
            provide a unary function 'f' for the purpose of constructing new
            deep proxies from regular objects and arrays.

            Supply the path as you recurse, for the purpose of emitting events
            attached to particular paths within the complete structure.

            Operates entirely via side effects on 'A'
        */
        var objects = deepProxy.objects = function (A, B, f, path, root) {
            var Akeys = Object.keys(A);
            var Bkeys = Object.keys(B);

            /*  iterating over the keys in B will tell you if a new key exists
                it will not tell you if a key has been removed.
                to accomplish that you will need to iterate over A's keys
            */

            /*  TODO return a truthy or falsey value (in 'objects' and 'arrays')
                so that we have some measure of whether an object or array changed
                (from the higher level in the tree, rather than doing everything
                at the leaf level).

                bonus points if you can defer events until the complete diff has
                finished (collect them into an array or something, and simplify
                the event if possible)
            */

            Bkeys.forEach(function (b) {
                var t_b = type(B[b]);
                var old = A[b];

                if (Akeys.indexOf(b) === -1) {
                    // there was an insertion

                    // mind the fallthrough behaviour
                    switch (t_b) {
                        case 'undefined':
                            // umm. this should never happen?
                            throw new Error("undefined type has key. this shouldn't happen?");
                        case 'array':
                        case 'object':
                            A[b] = f(B[b]);
                            break;
                        default:
                            A[b] = B[b];
                    }

                    // insertions are a change

                    // onChange(path, key, root, oldval, newval)
                    onChange(path, b, root, old, B[b]);
                    return;
                }

                // else the key already existed
                var t_a = type(A[b]);
                if (t_a !== t_b) {
                    // its type changed!
                    console.log("type changed from [%s] to [%s]", t_a, t_b);
                    switch (t_b) {
                        case 'undefined':
                            throw new Error("first pass should never reveal undefined keys");
                        case 'array':
                            A[b] = f(B[b]);
                            // make a new proxy
                            break;
                        case 'object':
                            A[b] = f(B[b]);
                            // make a new proxy
                            break;
                        default:
                            // all other datatypes just require assignment.
                            A[b] = B[b];
                            break;
                    }

                    // type changes always mean a change happened
                    onChange(path, b, root, old, B[b]);
                    return;
                }

                // values might have changed, if not types
                if (['array', 'object'].indexOf(t_a) === -1) {
                    // it's not an array or object, so we can do deep equality
                    if (A[b] !== B[b]) {
                        // not equal, so assign
                        A[b] = B[b];

                        onChange(path, b, root, old, B[b]);
                    }
                    return;
                }

                // else it's an array or object
                var nextPath = path.slice(0).concat(b);
                if (t_a === 'object') {
                    // it's an object
                    objects.call(root, A[b], B[b], f, nextPath, root);
                } else {
                    // it's an array
                    deepProxy.arrays.call(root, A[b], B[b], f, nextPath, root);
                }
            });
            Akeys.forEach(function (a) {
                var old = A[a];

                if (a === "on" || a === "_events") { return; }

                // the key was deleted
                if (Bkeys.indexOf(a) === -1 || type(B[a]) === 'undefined') {
                    onRemove(path, a, root, old, true);
                    delete A[a];
                }
            });

            return;
        };

        var arrays = deepProxy.arrays = function (A, B, f, path, root) {
            var l_A = A.length;
            var l_B = B.length;

            if (l_A !== l_B) {
                // B is longer than Aj
                // there has been an insertion

                // OR

                // A is longer than B
                // there has been a deletion

                B.forEach(function (b, i) {
                    var t_a = type(A[i]);
                    var t_b = type(b);

                    var old = A[i];

                    if (t_a !== t_b) {
                        // type changes are always destructive
                        // that's good news because destructive is easy
                        switch (t_b) {
                            case 'undefined':
                                throw new Error('this should never happen');
                            case 'object':
                                A[i] = f(b);
                                break;
                            case 'array':
                                A[i] = f(b);
                                break;
                            default:
                                A[i] = b;
                                break;
                        }

                        // path, key, root object, oldvalue, newvalue
                        onChange(path, i, root, old, b);
                    } else {
                        // same type
                        var nextPath = path.slice(0).concat(i);

                        switch (t_b) {
                            case 'object':
                                objects.call(root, A[i], b, f, nextPath, root);
                                break;
                            case 'array':
                                if (arrays.call(root, A[i], b, f, nextPath, root)) {
                                    onChange(path, i, root, old, b);
                                }
                                break;
                            default:
                                if (b !== A[i]) {
                                    A[i] = b;
                                    onChange(path, i, root, old, b);
                                }
                                break;
                        }
                    }
                });

                if (l_A > l_B) {
                    // A was longer than B, so there have been deletions
                    var i = l_B;
                    //var t_a;
                    var old;

                    for (; i <= l_B; i++) {
                        // recursively delete
                        old = A[i];

                        onRemove(path, i, root, old, true);
                    }
                    // cool
                }

                A.length = l_B;
                return;
            }

            // else they are the same length, iterate over their values
            A.forEach(function (a, i) {
                var t_a = type(a);
                var t_b = type(B[i]);

                var old = a;

                // they have different types
                if (t_a !== t_b) {
                    switch (t_b) {
                        case 'undefined':
                            onRemove(path, i, root, old, true);
                            break;

                    // watch out for fallthrough behaviour
                        // if it's an object or array, create a proxy
                        case 'object':
                        case 'array':
                            A[i] = f(B[i]);
                            break;
                        default:
                            A[i] = B[i];
                            break;
                    }

                    onChange(path, i, root, old, B[i]);
                    return;
                }

                // they are the same type, clone the paths array and push to it
                var nextPath = path.slice(0).concat(i);

                // same type
                switch (t_b) {
                    case 'undefined':
                        throw new Error('existing key had type `undefined`. this should never happen');
                    case 'object':
                        if (objects.call(root, A[i], B[i], f, nextPath, root)) {
                            onChange(path, i, root, old, B[i]);
                        }
                        break;
                    case 'array':
                        if (arrays.call(root, A[i], B[i], f, nextPath, root)) {
                            onChange(path, i, root, old, B[i]);
                        }
                        break;
                    default:
                        if (A[i] !== B[i]) {
                            A[i] = B[i];
                            onChange(path, i, root, old, B[i]);
                        }
                        break;
                }
            });
            return;
        };

        deepProxy.update = function (A, B, cb) {
            var t_A = type(A);
            var t_B = type(B);

            if (t_A !== t_B) {
                throw new Error("Proxy updates can't result in type changes");
            }

            switch (t_B) {
                /* use .call so you can supply a different `this` value */
                case 'array':
                    arrays.call(A, A, B, function (obj) {
                        return create(obj, cb);
                    }, [], A);
                    break;
                case 'object':
                //   arrays.call(this, A   , B   , f, path    , root)
                    objects.call(A, A, B, function (obj) {
                        return create(obj, cb);
                    }, [], A);
                    break;
                default:
                    throw new Error("unsupported realtime datatype:" + t_B);
            }
        };

        return deepProxy;
    }());

    api.create = function (cfg) {
        /* validate your inputs before proceeding */

        if (!DeepProxy.isProxyable(cfg.data, true)) {
            throw new Error('unsupported datatype: '+ DeepProxy.type(cfg.data));
        }

        var realtimeOptions = {
            userName: cfg.userName,
            initialState: Sortify(cfg.data),
            readOnly: cfg.readOnly,
            transformFunction: JsonOT.transform || JsonOT.validate,
            logLevel: typeof(cfg.logLevel) === 'undefined'? 0: cfg.logLevel,
            validateContent: function (content) {
                try {
                    JSON.parse(content);
                    return true;
                } catch (e) {
                    console.error("Failed to parse, rejecting patch");
                    return false;
                }
            },
        };

        var initializing = true;

        var setterCb = function () {
            if (!DeepProxy.remoteChangeFlag) { realtimeOptions.onLocal(); }
        };

        var rt = {};
        var realtime;

        var proxy;
        var patchText;

        realtimeOptions.onRemote = function () {
            if (initializing) { return; }
            // TODO maybe implement history support here

            var userDoc = realtime.getUserDoc();
            var parsed = JSON.parse(userDoc);

            DeepProxy.remoteChangeFlag = true;
            DeepProxy.update(proxy, parsed, setterCb);
            DeepProxy.remoteChangeFlag = false;
        };

        var onLocal = realtimeOptions.onLocal = function () {
            if (initializing) { return; }
            var strung = isFakeProxy? DeepProxy.stringifyFakeProxy(proxy): Sortify(proxy);
            patchText(strung);

            // try harder
            if (realtime.getUserDoc() !== strung) { patchText(strung); }

            // onLocal
            if (cfg.onLocal) { cfg.onLocal(); }
        };

        proxy = DeepProxy.create(cfg.data, setterCb, true);
        console.log(proxy);

        realtimeOptions.onInit = function (info) {
            proxy._events.create.forEach(function (handler) {
                handler.cb(info);
            });
        };

        realtimeOptions.onReady = function (info) {
            // create your patcher
            if (realtime !== info.realtime) {
                realtime = rt.realtime = info.realtime;
                patchText = TextPatcher.create({
                    realtime: realtime,
                    logging: cfg.logging || false,
                });
            } else {
                console.error(realtime);
            }

            var userDoc = realtime.getUserDoc();
            var parsed = JSON.parse(userDoc);

            DeepProxy.update(proxy, parsed, setterCb);

            proxy._events.ready.forEach(function (handler) {
                handler.cb(info);
            });

            DeepProxy.checkLocalChange(proxy, onLocal);

            initializing = false;
        };

        realtimeOptions.onAbort = function (info) {
            proxy._events.disconnect.forEach(function (handler) {
                handler.cb(info);
            });
        };

        realtimeOptions.onConnectionChange = function (info) {
            if (info.state) { // reconnect
                initializing = true;
                proxy._events.reconnect.forEach(function (handler) {
                    handler.cb(info);
                });
                return;
            }
            // disconnected
            proxy._events.disconnect.forEach(function (handler) {
                handler.cb(info);
            });
        };

        realtimeOptions.onError = function (info) {
            proxy._events.disconnect.forEach(function (handler) {
                handler.cb(info);
            });
        };

        realtime = rt.cpCnInner = cfg.common.startRealtime(realtimeOptions);
        rt.proxy = proxy;
        rt.realtime = realtime;

        return rt;
    };

    return api;
});
