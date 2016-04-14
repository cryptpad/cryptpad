var Fs = require("fs");

var message = function(file, msg) {
    file.write(msg+"\n");
};

var create = module.exports.create = function(filePath, backingStore) {

    var file = Fs.createWriteStream(filePath, {flags: 'a+'});

    return {
        message: function(channel, msg, callback) {
            message(file, msg);
            backingStore.message(channel, msg, callback);
        },
        getMessages: backingStore.getMessages
    };
};
