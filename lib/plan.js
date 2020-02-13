/*

There are many situations where we want to do lots of little jobs
in parallel and with few constraints as to their ordering.

One example is recursing over a bunch of directories and reading files.
The naive way to do this is to recurse over all the subdirectories
relative to a root while adding files to a list. Then to iterate over
the files in that list. Unfortunately, this means holding the complete
list of file paths in memory, which can't possible scale as our database grows.

A better way to do this is to recurse into one directory and 
iterate over its contents until there are no more, then to backtrack
to the next directory and repeat until no more directories exist.
This kind of thing is easy enough when you perform one task at a time
and use synchronous code, but with multiple asynchronous tasks it's
easy to introduce subtle bugs.

This module is designed for these situations. It allows you to easily
and efficiently schedule a large number of tasks with an associated
degree of priority from 0 (highest priority) to Number.MAX_SAFE_INTEGER.

Initialize your scheduler with a degree of parallelism, and start planning
some initial jobs. Set it to run and it will keep going until all jobs are
complete, at which point it will optionally execute a 'done' callback.

Getting back to the original example:

List the contents of the root directory, then plan subsequent jobs
with a priority of 1 to recurse into subdirectories. The callback
of each of these recursions can then plan higher priority tasks
to actually process the contained files with a priority of 0.

As long as there are more files scheduled it will continue to process
them first. When there are no more files the scheduler will read
the next directory and repopulate the list of files to process.
This will repeat until everything is done.

// load the module
const Plan = require("./plan");

// instantiate a scheduler with a parallelism of 5
var plan = Plan(5)

// plan the first job which schedules more jobs...
.job(1, function (next) {
    listRootDirectory(function (files) {
        files.forEach(function (file) {
            // highest priority, run as soon as there is a free worker
            plan.job(0, function (next) {
                processFile(file, function (result) {
                    console.log(result);
                    // don't forget to call next
                    next();
                });
            });
        });
        next(); // call 'next' to free up one worker
    });
})
// chain commands together if you want
.done(function () {
    console.log("DONE");
})
// it won't run unless you launch it
.start();

*/

module.exports = function (max) {
    var plan = {};
    max = max || 5;

    // finds an id that isn't in use in a particular map
    // accepts an id in case you have one already chosen
    // otherwise generates random new ids if one is not passed
    // or if there is a collision
    var uid = function (map, id) {
        if (typeof(id) === 'undefined') {
            id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        }
        if (id && typeof(map[id]) === 'undefined') {
            return id;
        }
        return uid(map);
    };

    // the queue of jobs is an array, which will be populated
    // with maps for each level of priority
    var jobs = [];

    // the count of currently running jobs
    var count = 0;

    // a list of callbacks to be executed once everything is done
    var completeHandlers = [];

    // the recommended usage is to create a new scheduler for every job
    // use it for internals in a scope, and let the garbage collector
    // clean up when everything stops. This means you shouldn't
    // go passing 'plan' around in a long-lived process!
    var FINISHED = false;
    var done = function () {
        // 'done' gets called when there are no more jobs in the queue
        // but other jobs might still be running...

        // the count of running processes should never be less than zero
        // because we guard against multiple callbacks
        if (count < 0) { throw new Error("should never happen"); }
        // greater than zero is definitely possible, it just means you aren't done yet
        if (count !== 0) { return; }
        // you will finish twice if you call 'start' a second time
        // this behaviour isn't supported yet.
        if (FINISHED) { throw new Error('finished twice'); }
        FINISHED = true;
        // execute all your 'done' callbacks
        completeHandlers.forEach(function (f) { f(); });
    };

    var run;

    // this 'next' is internal only.
    // it iterates over all known jobs, running them until
    // the scheduler achieves the desired amount of parallelism.
    // If there are no more jobs it will call 'done'
    // which will shortcircuit if there are still pending tasks.
    // Whenever any tasks finishes it will return its lock and
    // run as many new jobs as are allowed.
    var next = function () {
        // array.some skips over bare indexes in sparse arrays
        var pending = jobs.some(function (bag /*, priority*/) {
            if (!bag || typeof(bag) !== 'object') { return; }
            // a bag is a map of jobs for any particular degree of priority
            // iterate over jobs in the bag until you're out of 'workers'
            for (var id in bag) {
                // bail out if you hit max parallelism
                if (count >= max) { return true; }
                run(bag, id, next);
            }
        });
        // check whether you're done if you hit the end of the array
        if (!pending) { done(); }
    };

    // and here's the part that actually handles jobs...
    run = function (bag, id) {
        // this is just a sanity check.
        // there should only ever be jobs in each bag.
        if (typeof(bag[id]) !== 'function') {
            throw new Error("expected function");
        }

        // keep a local reference to the function
        var f = bag[id];
        // remove it from the bag.
        delete bag[id];
        // increment the count of running jobs
        count++;

        // guard against it being called twice.
        var called = false;
        f(function () {
            // watch out! it'll bite you.
            // maybe this should just return?
            // support that option for 'production' ?
            if (called) { throw new Error("called twice"); }
            // the code below is safe because we can't call back a second time
            called = true;

            // decrement the count of running jobs...
            count--;

            // and finally call next to replace this worker with more job(s)
            next();
        });
    };

    // this is exposed as API
    plan.job = function (priority, cb) {
        // you have to pass both the priority (a non-negative number) and an actual job
        if (typeof(priority) !== 'number' || priority < 0) { throw new Error('expected a non-negative number'); }
        // a job is an asynchronous function that takes a single parameter:
        // a 'next' callback which will keep the whole thing going.
        // forgetting to call 'next' means you'll never complete.
        if (typeof(cb) !== 'function') { throw new Error('expected function'); }

        // initialize the specified priority level if it doesn't already exist
        var bag = jobs[priority] = jobs[priority] || {};
        // choose a random id that isn't already in use for this priority level
        var id = uid(bag);

        // add the job to this priority level's bag
        // most (all?) javascript engines will append this job to the bottom
        // of the map. Meaning when we iterate it will be run later than
        // other jobs that were scheduled first, effectively making a FIFO queue.
        // However, this is undefined behaviour and you shouldn't ever rely on it.
        bag[id] = function (next) {
            cb(next);
        };
        // returning 'plan' lets us chain methods together.
        return plan;
    };

    var started = false;
    plan.start = function () {
        // don't allow multiple starts
        // even though it should work, it's simpler not to.
        if (started) { return plan; }
        // this seems to imply a 'stop' method
        // but I don't need it, so I'm not implementing it now --ansuz
        started = true;

        // start asynchronously, otherwise jobs will start running
        // before you've had a chance to return 'plan', and weird things
        // happen.
        setTimeout(function () {
            next();
        });
        return plan;
    };

    // you can pass any number of functions to be executed
    // when all pending jobs are complete.
    // We don't pass any arguments, so you need to handle return values
    // yourself if you want them.
    plan.done = function (f) {
        if (typeof(f) !== 'function') { throw new Error('expected function'); }
        completeHandlers.push(f);
        return plan;
    };

    // That's all! I hope you had fun reading this!
    return plan;
};

