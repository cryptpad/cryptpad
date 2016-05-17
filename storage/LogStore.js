var Fs = require("fs");

var message = function(file, msg) {
    file.write(msg+"\n");
};

var create = module.exports.create = function(filePath, backingStore) {

    var file = Fs.createWriteStream(filePath, {flags: 'a+'});

    var originalMessageFunction = backingStore.message;

    backingStore.message = function(channel, msg, callback) {
        message(file, msg);
        originalMessageFunction(channel, msg, callback);
    };

    return backingStore;
};
