define([
    '/bower_components/proxy-polyfill/proxy.min.js', // https://github.com/GoogleChrome/proxy-polyfill
], function () {
    // linter complains if this isn't defined
    var Proxy = window.Proxy;

    var deepProxy = {};

    // for passing messages while recursing. use powers of two in case we ever
    // need to pass multiple message types (via bitpacking)
    var Messages = deepProxy.Messages = {
        CHANGE: 1,
        REMOVE: 2
    };

    var isArray = deepProxy.isArray = function (obj) {
        return Object.prototype.toString.call(obj)==='[object Array]';
    };

    /*  Arrays and nulls both register as 'object' when using native typeof
        we need to distinguish them as their own types, so use this instead. */
    var type = deepProxy.type = function (dat) {
        return dat === null?  'null': isArray(dat)?'array': typeof(dat);
    };

    /*  Any time you set a value, check its type.
        If that type is proxyable, make a new proxy. */
    var setter = deepProxy.set = function (cb) {
        return function (obj, prop, value) {
            if (prop === 'on') {
                throw new Error("'on' is a reserved attribute name for realtime lists and maps");
            }

            var t_value = type(value);
            if (['array', 'object'].indexOf(t_value) !== -1) {
                //console.log("Constructing new proxy for value with type [%s]", t_value);
                var proxy = obj[prop] = deepProxy.create(value, cb);
            } else {
                //console.log("Setting [%s] to [%s]", prop, value);
                obj[prop] = value;
            }

            cb();
            return obj[prop] || true; // always return truthey or you have problems
        };
    };

    var pathMatches = deepProxy.pathMatches = function (path, pattern) {
        console.log("Comparing checking if path:[%s] matches pattern:[%s]", path.join(','), pattern.join(','));
        return !pattern.some(function (x, i) {
            return x !== path[i];
        });
    };

    var getter = deepProxy.get = function (cb) {
        var events = {
            disconnect: [],
            change: [],
            ready: [],
            remove: [],
        };

        var on = function (evt, pattern, f) {
            switch (evt) {
                case 'change':
                    // pattern needs to be an array
                    pattern = type(pattern) === 'array'?  pattern: [pattern];

                    console.log("[MOCK] adding change listener at path [%s]", pattern.join(','));
                    events.change.push(function (oldval, newval, path, root) {
                        if (pathMatches(path, pattern)) {
                            f(oldval, newval, path, root);
                        } else {
                            console.log("path did not match pattern!");
                        }
                    });
                    break;
                case 'ready':
                    break;
                case 'disconnect':
                    break;
                case 'delete':
                    break;
                default:
                    break;
            }
            return true;
        };

        return function (obj, prop) {
            if (prop === 'on') {
                return on;
            } else if (prop === '_events') {
                return events;
            }
            return obj[prop];
        };
    };

    var handlers = deepProxy.handlers = function (cb) {
        return {
            set: setter(cb),
            get: getter(cb),
        };
    };

    var create = deepProxy.create = function (obj, opt, root) {
        var methods = type(opt) === 'function'? handlers(opt) : opt;
        return new Proxy(obj, methods);
    };

    // onChange(path, key, root, oldval, newval)
    var onChange = function (path, key, root, oldval, newval) {
        var P = path.slice(0);
        P.push(key);
        console.log('change at path [%s]', P.join(','));

        /*  TODO make this such that we can halt propogation to less specific
            paths? */
        root._events.change.forEach(function (f, i) {
            f(oldval, newval, P, root);
        });
    };

    // newval doesn't really make sense here
    var onRemove = function (path, key, root, oldval, newval) {
        console.log("onRemove is stubbed for now");
        return false;
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

        var hasChanged = false;

        Bkeys.forEach(function (b) {
            //console.log(b);
            var t_b = type(B[b]);
            var old = A[b];

            if (Akeys.indexOf(b) === -1) {
                // there was an insertion
                //console.log("Inserting new key: [%s]", b);

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
                hasChanged = true;

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
                        // deletions are a removal
                        //delete A[b];
                        //onRemove(path, b, root, old, undefined);

                        // this should never happen?
                        throw new Error("first pass should never reveal undefined keys");
                        //break;
                    case 'array':
                        //console.log('construct list');
                        A[b] = f(B[b]);
                        // make a new proxy
                        break;
                    case 'object':
                        //console.log('construct map');
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

                    hasChanged = true;
                    onChange(path, b, root, old, B[b]);
                }
                return;
            }

            // else it's an array or object
            var nextPath = path.slice(0).concat(b);
            if (t_a === 'object') {
                // it's an object

                if (objects.call(root, A[b], B[b], f, nextPath, root)) {
                    hasChanged = true;
                    // TODO do you want to call onChange when an object changes?
                    //onChange(path, b, root, old, B[b]);
                }
            } else {
                // it's an array
                if (deepProxy.arrays.call(root, A[b], B[b], f, nextPath, root)) {
                    hasChanged = true;

                    // TODO do you want to call onChange when an object changes?
                    //onChange(path, b, root, old, B[b]);
                }
            }
        });
        Akeys.forEach(function (a) {
            var old = A[a];

            if (Bkeys.indexOf(a) === -1 || type(B[a]) === 'undefined') {
                //console.log("Deleting [%s]", a);
                // the key was deleted!
                delete A[a];

                onRemove(path, a, root, old, B[a]);
            }
        });

        return hasChanged;
    };

    var arrays = deepProxy.arrays = function (A, B, f, path, root) {
        var l_A = A.length;
        var l_B = B.length;

        var hasChanged = false;

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

                    hasChanged = true;
                    // path, key, root object, oldvalue, newvalue
                    onChange(path, i, root, old, b);
                } else {
                    // same type
                    var nextPath = path.slice(0).concat(i);

                    switch (t_b) {
                        case 'object':
                            if (objects.call(root, A[i], b, f, nextPath, root)) {
                                hasChanged = true;
                                onChange(path, i, root, old, b);
                            }
                            break;
                        case 'array':
                            if (arrays.call(root, A[i], b, f, nextPath, root)) {
                                hasChanged = true;
                                onChange(path, i, root, old, b);
                            }
                            break;
                        default:
                            if (b !== A[i]) {
                                A[i] = b;
                                onChange(path, i, root, old, b);
                                hasChanged = true;
                            }
                            break;
                    }
                }
            });


            if (l_A > l_B) {
                // A was longer than B, so there have been deletions
                var i = l_B;
                var t_a;

                for (; i < l_B; i++) {
                    // it was most definitely a deletion
                    onRemove(path, i, root, A[i], undefined);
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
                // watch out for fallthrough behaviour
                switch (t_b) {
                    case 'object':
                    case 'array':
                        A[i] = f(B[i]);
                        break;
                    default:
                        A[i] = B[i];
                        break;
                }

                hasChanged = true;
                onChange(path, i, root, old, B[i]);
                return;
            }

            // they are the same type, clone the paths array and push to it
            var nextPath = path.slice(0).concat(i);

            // same type
            switch (t_b) {
                case 'object':
                    if (objects.call(root, A[i], B[i], f, nextPath, root)) {
                        hasChanged = true;
                        onChange(path, i, root, old, B[i]);
                    }
                    break;
                case 'array':
                    if (arrays.call(root, A[i], B[i], f, nextPath, root)) {
                        hasChanged = true;
                        onChange(path, i, root, old, B[i]);
                    }
                    break;
                default:
                    if (A[i] !== B[i]) {
                        A[i] = B[i];
                        hasChanged = true;
                        onChange(path, i, root, old, B[i]);
                    }
                    break;
            }
        });
        return hasChanged;
    };

    var update = deepProxy.update = function (A, B, cb) {
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
                throw new Error("unsupported realtime datatype");
        }
    };

    return deepProxy;
});
