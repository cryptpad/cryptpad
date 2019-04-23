var nThen = require("nthen");
var Tasks = require("../../storage/tasks");
var Logger = require("../../lib/log");

var config = require("../../lib/load-config");

// this isn't strictly necessary for what we want to do
// but the API requires it, and I don't feel like changing that
// --ansuz
var FileStorage = require("../../" + (config.storage || "./storage/file"));

var tasks;
nThen(function (w) {
    Logger.create(config, w(function (_log) {
        config.log = _log;
    }));
}).nThen(function (w) {
    FileStorage.create(config, w(function (_store) {
        config.store = _store;
    }));
}).nThen(function (w) {
    Tasks.create(config, w(function (err, _tasks) {
        if (err) { throw err; }
        tasks = config.tasks = _tasks;
    }));
}).nThen(function (w) {
    tasks.migrate(w(function (err) {
        if (err) {
            throw err;
        }
    }));
}).nThen(function () {
    config.store.shutdown();
    config.log.shutdown();
});
