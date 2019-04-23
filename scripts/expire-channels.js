var nThen = require("nthen");
var Tasks = require("../storage/tasks");
var Logger = require("../lib/log");

var config = require("../lib/load-config");
var FileStorage = require('../' + config.storage || './storage/file');

nThen(function (w) {
    Logger.create(config, w(function (_log) {
        config.log = _log;
    }));
}).nThen(function (w) {
    FileStorage.create(config, w(function (_store) {
        config.store = _store;

        // config.taskPath
        // config.store
        // config.filePath
        // config.blobPath
        // config.coldPath

        // config.enableTaskScheduling

    }));
}).nThen(function (w) {
    Tasks.create(config, w(function (err, _tasks) {
        if (err) {
            throw err;
        }
        config.tasks = _tasks;
    }));
}).nThen(function (w) {
     config.tasks.runAll(w(function (err) {
        if (err) {
            // either TASK_CONCURRENCY
            // or an error from tasks.list
        }
    }));
}).nThen(function () {
    config.store.shutdown();
    config.log.shutdown();
});

