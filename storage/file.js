var Fs = require("fs");

var insert = function (env, channel, content, cb) {

};

var getMessages = function (env, channelName, msgHandler, cb) {

};

module.exports.create = function (conf, cb) {
    var env = {};

    cb({
        message: function (channelName, content, cb) {
            insert(env, channelName, content, cb);
        },
        getMessages: function (channelName, msgHandler, cb) {
            getMessages(env, channelName, msgHandler, cb);
        },
    });
};
