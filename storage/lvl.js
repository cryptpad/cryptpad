var Level = require("level");
var nThen = require('nthen');

var getIndex = function(db, cName, cb) {
    db.get(cName+'=>index', function(e, out){
        if (e) {
            if (e.notFound) {
                cb(-1);
            } else {
                throw e;
            }
            return;
        }
        cb(parseInt(out));
    });
};

var insert = function (db, channelName, content, cb) {
    var index;
    nThen(function (waitFor) {
        getIndex(db, channelName, waitFor(function (i) { index = i+1; }));
    }).nThen(function (waitFor) {
        db.put(channelName+'=>'+index, content, waitFor(function (e) { if (e) { throw e; } }));
    }).nThen(function (waitFor) {
        db.put(channelName+'=>index', ''+index, waitFor(function (e) { if (e) { throw e; } }));
    }).nThen(cb);
};

var getMessages = function (db, channelName, msgHandler) {
    var index;
    nThen(function (waitFor) {
        getIndex(db, channelName, waitFor(function (i) { index = i; }));
    }).nThen(function (waitFor) {
        var again = function (i) {
            db.get(channelName + '=>' + i, waitFor(function (e, out) {
                if (e) { throw e; }
                msgHandler(out);
                if (i < index) { again(i+1); }
            }));
        };
        if (index > -1) { again(0); }
    });
};

module.exports.create = function (conf, cb) {
    var db = Level(conf.levelPath || './test.level.db');
    cb({
        message: function (channelName, content, cb) {
            insert(db, channelName, content, cb);
        },
        getMessages: function (channelName, msgHandler) {
            getMessages(db, channelName, msgHandler);
        }
    });
};
