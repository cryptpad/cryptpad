define(function () {
    var compare = {};

    var isArray = compare.isArray = function (obj) {
        return Object.prototype.toString.call(obj)==='[object Array]'
    };

    var type = compare.type = function (dat) {
        return dat === null?
            'null':
            isArray(dat)?'array': typeof(dat);
    };

    /*  compare objects A and B, where A is the _older_ of the two */
    compare.objects = function (A, B, f, path) {
        var Akeys = Object.keys(A);
        var Bkeys = Object.keys(B);

        console.log("inspecting path [%s]", path.join(','));

        /*  iterating over the keys in B will tell you if a new key exists
            it will not tell you if a key has been removed.
            to accomplish that you will need to iterate over A's keys */
        Bkeys.forEach(function (b) {
            console.log(b);
            if (Akeys.indexOf(b) === -1) {
                // there was an insertion
                console.log("Inserting new key: [%s]", b);

                var t_b = type(B[b]);
                switch (t_b) {
                    case 'undefined':
                        // umm. this should never happen?
                        throw new Error("undefined type has key. this shouldn't happen?");
                        break;
                    case 'array':
                        console.log('construct list');
                        A[b] = f(B[b]);
                        break;
                    case 'object':
                        console.log('construct map');
                        A[b] = f(B[b]);
                        break;
                    default:
                        A[b] = B[b];
                        break;
                }
            } else {
                // the key already existed
                var t_a = type(A[b]);
                var t_b = type(B[b]);

                if (t_a !== t_b) {
                    // its type changed!
                    console.log("type changed from [%s] to [%s]", t_a, t_b);
                    switch (t_b) {
                        case 'undefined':
                            delete A[b];
                            break;
                        case 'array':
                            console.log('construct list');
                            A[b] = f(B[b]);
                            // make a new proxy
                            break;
                        case 'object':
                            console.log('construct map');
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
                            console.log("changed values from [%s] to [%s]", A[b], B[b]);
                            A[b] = B[b];
                        }
                    } else {
                        var nextPath = path.slice(0);
                        nextPath.push(b);
                        if (t_a === 'object') {
                            // it's an object
                            compare.objects(A[b], B[b], f, nextPath);
                        } else {
                            // it's an array
                            compare.arrays(A[b], B[b], f, nextPath);
                        }
                    }
                }
            }
        });
        Akeys.forEach(function (a) {
            if (Bkeys.indexOf(a) === -1 || type(B[a]) === 'undefined') {
                console.log("Deleting [%s]", a);
                // the key was deleted!
                delete A[a];
            }
        });
    };

    compare.arrays = function (A, B, f, path) {
        var l_A = A.length;
        var l_B = B.length;

        // TODO do things with the path

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
                            compare.objects(A[i], b, f, nextPath);
                            break;
                        case 'array':
                            compare.arrays(A[i], b, f, nextPath);
                            break;
                        default:
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
                            compare.objects(A[i], B[i], f, nextPath);
                            break;
                        case 'array':
                            compare.arrays(A[i], B[i], f, nextPath);
                            break;
                        default:
                            A[i] = B[i];
                            break;
                    }
                }
            });
        }
    };

    return compare;
});
