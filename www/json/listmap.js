define([
    '/bower_components/proxy-polyfill/proxy.min.js', // https://github.com/GoogleChrome/proxy-polyfill
],function () {
    var Proxy = window.Proxy;

    var ListMap = {};

    var isArray = ListMap.isArray = function (obj) {
        return Object.prototype.toString.call(obj)==='[object Array]';
    };

    /*  Arrays and nulls both register as 'object' when using native typeof
        we need to distinguish them as their own types, so use this instead. */
    var type = ListMap.type = function (dat) {
        return dat === null?  'null': isArray(dat)?'array': typeof(dat);
    };

    var makeHandlers = function (cb) {
        return {
            get: function (obj, prop) {
                // FIXME magic?
                if (prop === 'length' && typeof(obj.length) === 'number') { return obj.length; }

                return obj[prop];
            },
            set: function (obj, prop, value) {
                if (prop === 'on') {
                    throw new Error("'on' is a reserved attribute name for realtime lists and maps");
                }
                if (obj[prop] === value) { return value; }

                var t_value = ListMap.type(value);
                if (['array', 'object'].indexOf(t_value) !== -1) {
                    console.log("Constructing new proxy for value with type [%s]", t_value);
                    var proxy = obj[prop] = ListMap.makeProxy(value);
                } else {
                    console.log("Setting [%s] to [%s]", prop, value);
                    obj[prop] = value;
                }

                cb();
                return obj[prop];
            },
        };
    };

    var handlers = ListMap.handlers = {
        get: function (obj, prop) {
            // FIXME magic?
            if (prop === 'length' && typeof(obj.length) === 'number') { return obj.length; }

            return obj[prop];
        },
        set: function (obj, prop, value) {
            if (prop === 'on') {
                throw new Error("'on' is a reserved attribute name for realtime lists and maps");
            }
            if (obj[prop] === value) { return value; }

            var t_value = ListMap.type(value);
            if (['array', 'object'].indexOf(t_value) !== -1) {
                console.log("Constructing new proxy for value with type [%s]", t_value);
                var proxy = obj[prop] = ListMap.makeProxy(value);
            } else {
                console.log("Setting [%s] to [%s]", prop, value);
                obj[prop] = value;
            }

            // FIXME this is NO GOOD
            ListMap.onLocal();
            return obj[prop];
        }
    };

    var makeProxy = ListMap.makeProxy = function (obj, local) {
        local = local || ListMap.onLocal;

        return new Proxy(obj, handlers); //makeHandlers(ListMap.onLocal));
    };

    var recursiveProxies = ListMap.recursiveProxies = function (obj) {
        var t_obj = type(obj);

        var proxy;

        switch (t_obj) {
            case 'object':
                proxy = makeProxy({});
                ListMap.objects(proxy, obj, makeProxy, []);
                return proxy;
            case 'array':
                proxy = makeProxy([]);
                ListMap.arrays(proxy, obj, makeProxy, []);
                return proxy;
            default:
                return obj;
        }
    };

    var onChange = function (path, key) {
        var P = path.slice(0);
        P.push(key);
        console.log('change at path [%s]', P.join(','));
    };

    /*  ListMap objects A and B, where A is the _older_ of the two */
    ListMap.objects = function (A, B, f, path) {
        var Akeys = Object.keys(A);
        var Bkeys = Object.keys(B);

        //console.log("inspecting path [%s]", path.join(','));

        /*  iterating over the keys in B will tell you if a new key exists
            it will not tell you if a key has been removed.
            to accomplish that you will need to iterate over A's keys */
        Bkeys.forEach(function (b) {
            //console.log(b);
            var t_b = type(B[b]);

            if (Akeys.indexOf(b) === -1) {
                // there was an insertion
                console.log("Inserting new key: [%s]", b);
                onChange(path, b);

                switch (t_b) {
                    case 'undefined':
                        // umm. this should never happen?
                        throw new Error("undefined type has key. this shouldn't happen?");
                        //break;
                    case 'array':
                        //console.log('construct list');
                        A[b] = f(B[b]);
                        break;
                    case 'object':
                        //console.log('construct map');
                        A[b] = f(B[b]);
                        break;
                    default:
                        A[b] = B[b];
                        break;
                }
            } else {
                // the key already existed
                var t_a = type(A[b]);

                if (t_a !== t_b) {
                    // its type changed!
                    console.log("type changed from [%s] to [%s]", t_a, t_b);
                    switch (t_b) {
                        case 'undefined':
                            delete A[b];
                            break;
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
                } else {
                    // did values change?

                    if (['array', 'object'].indexOf(t_a) === -1) {
                        // we can do deep equality...
                        if (A[b] !== B[b]) {
                            onChange(path, b);
                            console.log("changed values from [%s] to [%s]", A[b], B[b]);
                            A[b] = B[b];
                        }
                    } else {
                        var nextPath = path.slice(0);
                        nextPath.push(b);
                        if (t_a === 'object') {
                            // it's an object
                            ListMap.objects(A[b], B[b], f, nextPath);
                        } else {
                            // it's an array
                            ListMap.arrays(A[b], B[b], f, nextPath);
                        }
                    }
                }
            }
        });
        Akeys.forEach(function (a) {
            if (Bkeys.indexOf(a) === -1 || type(B[a]) === 'undefined') {
                onChange(path, a);
                console.log("Deleting [%s]", a);
                // the key was deleted!
                delete A[a];
            }
        });
    };

    ListMap.arrays = function (A, B, f, path) {
        var l_A = A.length;
        var l_B = B.length;

        // TODO do things with the path (callbacks)

        if (l_A !== l_B) {
            // B is longer than Aj
            // there has been an insertion

            // OR

            // A is longer than B
            // there has been a deletion

            B.forEach(function (b, i) {
                var t_a = type(A[i]);
                var t_b = type(b);

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
                } else {
                    // same type
                    var nextPath = path.slice(0);
                    nextPath.push(i);

                    switch (t_b) {
                        case 'object':
                            ListMap.objects(A[i], b, f, nextPath);
                            break;
                        case 'array':
                            ListMap.arrays(A[i], b, f, nextPath);
                            break;
                        default:
                            onChange(path, i);
                            A[i] = b;
                            break;
                    }
                }
            });
            return;
        } else {
            // they are the same length...
            A.forEach(function (a, i) {
                var t_a = type(a);
                var t_b = type(B[i]);

                if (t_a !== t_b) {
                    switch (t_b) {
                        case 'object':
                            A[i] = f(B[i]);
                            break;
                        case 'array':
                            A[i] = f(B[i]);
                            break;
                        default:
                            A[i] = B[i];
                            break;
                    }
                    return;
                } else {
                    var nextPath = path.slice(0);
                    nextPath.push(i);

                    // same type
                    switch (t_b) {
                        case 'object':
                            ListMap.objects(A[i], B[i], f, nextPath);
                            break;
                        case 'array':
                            ListMap.arrays(A[i], B[i], f, nextPath);
                            break;
                        default:
                            A[i] = B[i];
                            break;
                    }
                }
            });
        }
    };

    var update = ListMap.update = function (A, B) {

        var t_A = type(A);
        var t_B = type(B);

        if (t_A !== t_B) {
            throw new Error("Proxy updates can't result in type changes");
        }

        switch (t_B) {
            case 'array':
                ListMap.arrays(A, B, function (obj) {
                    return makeProxy(obj);
                });
                // idk
                break;
            case 'object':
                ListMap.objects(A, B, function (obj) {
                    //console.log("constructing new proxy for type [%s]", type(obj));
                    return makeProxy(obj);
                }, []);
                break;
            default:
                throw new Error("unsupported realtime datatype");
        }
    };

    return ListMap;
});
