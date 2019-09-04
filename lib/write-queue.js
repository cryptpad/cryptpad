/*
var q = Queue();
q(id, function (next) {
    // whatever you need to do....

    // when you're done
    next();
});
*/

var fix1 = function (f, x) {
    return function () { f(x); };
};

module.exports = function () {
    var map = {};

    var next = function (id) {
        if (map[id] && map[id].length === 0) { return void delete map[id]; }
        var task = map[id].shift();
        task(fix1(next, id));
    };

    return function (id, task) {
        // support initialization with just a function
        if (typeof(id) === 'function' && typeof(task) === 'undefined') {
            task = id;
            id = '';
        }
        // ...but you really need to pass a function
        if (typeof(task) !== 'function') { throw new Error("Expected function"); }

        // if the intended queue already has tasks in progress, add this one to the end of the queue
        if (map[id]) { return void map[id].push(task); }

        // otherwise create a queue containing the given task
        map[id] = [task];
        next(id);
    };
};
