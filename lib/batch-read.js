/*

## Purpose

To avoid running expensive IO or computation concurrently.

If the result of IO or computation is requested while an identical request
is already in progress, wait until the first one completes and provide its
result to every routine that requested it.

## Usage

Provide:

1. a named key for the computation or resource,
2. a callback to handle the result
3. an implementation which calls back with the result

```
var batch = Batch();

var read = function (path, cb) {
    batch(path, cb, function (done) {
        console.log("reading %s", path);
        fs.readFile(path, 'utf8', done);
    });
};

read('./pewpew.txt', function (err, data) {
    if (err) { return void console.error(err); }
    console.log(data);
});

read('./pewpew.txt', function (err, data) {
    if (err) { return void console.error(err); }
    console.log(data);
});
```

*/

module.exports = function (/* task */) {
    var map = {};
    return function (id, cb, impl) {
        if (typeof(cb) !== 'function' || typeof(impl) !== 'function') {
            throw new Error("expected callback and implementation");
        }
        if (map[id]) { return void map[id].push(cb); }
        map[id] = [cb];
        impl(function () {
            var args = Array.prototype.slice.call(arguments);

            //if (map[id] && map[id].length > 1) { console.log("BATCH-READ DID ITS JOB for [%s][%s]", task, id); }

            map[id].forEach(function (h) {
                h.apply(null, args);
            });
            delete map[id];
        });
    };
};
