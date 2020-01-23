var WriteQueue = require("./write-queue");
var Util = require("./common-util");

/*  This module provides implements a FIFO scheduler
    which assumes the existence of three types of async tasks:

    1. ordered tasks which must be executed sequentially
    2. unordered tasks which can be executed in parallel
    3. blocking tasks which must block the execution of all other tasks

    The scheduler assumes there will be many resources identified by strings,
    and that the constraints described above will only apply in the context
    of identical string ids.

    Many blocking tasks may be executed in parallel so long as they
    concern resources identified by different ids.

USAGE:

    const schedule = require("./schedule")();

    // schedule two sequential tasks using the resource 'pewpew'
    schedule.ordered('pewpew', function (next) {
        appendToFile('beep\n', next);
    });
    schedule.ordered('pewpew', function (next) {
        appendToFile('boop\n', next);
    });

    // schedule a task that can happen whenever
    schedule.unordered('pewpew', function (next) {
        displayFileSize(next);
    });

    // schedule a blocking task which will wait
    // until the all unordered tasks have completed before commencing
    schedule.blocking('pewpew', function (next) {
        deleteFile(next);
    });

    // this will be queued for after the blocking task
    schedule.ordered('pewpew', function (next) {
        appendFile('boom', next);
    });

*/

// return a uid which is not already in a map
var unusedUid = function (set) {
    var uid = Util.uid();
    if (set[uid]) { return unusedUid(); }
    return uid;
};

// return an existing session, creating one if it does not already exist
var lookup = function (map, id) {
    return (map[id] = map[id] || {
        //blocking: [],
        active: {},
        blocked: {},
    });
};

var isEmpty = function (map) {
    for (var key in map) {
        if (map.hasOwnProperty(key)) { return false; }
    }
    return true;
};

module.exports = function () {
    // every scheduler instance has its own queue
    var queue = WriteQueue();

    // ordered tasks don't require any extra logic
    var Ordered = function (id, task) {
        queue(id, task);
    };

    // unordered and blocking tasks need a little extra state
    var map = {};

    // regular garbage collection keeps memory consumption low
    var collectGarbage = function (id) {
        // avoid using 'lookup' since it creates a session implicitly
        var local = map[id];
        // bail out if no session
        if (!local) { return; }
        // bail out if there are blocking or active tasks
        if (local.lock) { return; }
        if (!isEmpty(local.active)) { return; }
        // if there are no pending actions then delete the session
        delete map[id];
    };

    // unordered tasks run immediately if there are no blocking tasks scheduled
    // or immediately after blocking tasks finish
    var runImmediately = function (local, task) {
        // set a flag in the map of active unordered tasks
        // to prevent blocking tasks from running until you finish
        var uid = unusedUid(local.active);
        local.active[uid] = true;

        task(function () {
            // remove the flag you set to indicate that your task completed
            delete local.active[uid];
            // don't do anything if other unordered tasks are still running
            if (!isEmpty(local.active)) { return; }
            // bail out if there are no blocking tasks scheduled or ready
            if (typeof(local.waiting) !== 'function') {
                return void collectGarbage();
            }
            setTimeout(local.waiting);
        });
    };

    var runOnceUnblocked = function (local, task) {
        var uid = unusedUid(local.blocked);
        local.blocked[uid] = function () {
            runImmediately(local, task);
        };
    };

    // 'unordered' tasks are scheduled to run in after the most recently received blocking task
    // or immediately and in parallel if there are no blocking tasks scheduled.
    var Unordered = function (id, task) {
        var local = lookup(map, id);
        if (local.lock) { return runOnceUnblocked(local, task); }
        runImmediately(local, task);
    };

    var runBlocked = function (local) {
        for (var task in local.blocked) {
            runImmediately(local, local.blocked[task]);
        }
    };

    // 'blocking' tasks must be run alone.
    // They are queued alongside ordered tasks,
    // and wait until any running 'unordered' tasks complete before commencing.
    var Blocking = function (id, task) {
        var local = lookup(map, id);

        queue(id, function (next) {
            // start right away if there are no running unordered tasks
            if (isEmpty(local.active)) {
                local.lock = true;
                return void task(function () {
                    delete local.lock;
                    runBlocked(local);
                    next();
                });
            }
            // otherwise wait until the running tasks have completed
            local.waiting = function () {
                local.lock = true;
                task(function () {
                    delete local.lock;
                    delete local.waiting;
                    runBlocked(local);
                    next();
                });
            };
        });
    };

    return {
        ordered: Ordered,
        unordered: Unordered,
        blocking: Blocking,
    };
};
