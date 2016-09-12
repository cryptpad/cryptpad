var Knex = require("knex");

var getMessages = function (knex, channel, msgHandler, cb) {
    return knex('messages')
        .where({
            channel: channel,
        })
        .select('*')
        .then(function (rows) {
            rows.forEach(function (row) {
                msgHandler(row.content);
            });
            cb();
        })
        .catch(function (e) {
            console.error(e);
            cb();
        });
};

var insert = function (knex, channel, content, cb) {
    knex.table('messages').insert({
        channel: channel,
        content: content,
    })
    .then(function () {
        cb();
    });
};

module.exports.create = function (conf, cb) {
    var knex = Knex({
        dialect: 'sqlite3',
        connection: conf.dbConnection,
        useNullAsDefault: true,
    });

    knex.schema.hasTable('messages').then(function (exists) {
        if (exists) { return; }

        return knex.schema.createTable('messages', function (table) {
            table.increments('id');
            table.string('content');
            table.string('channel');
            table.timestamps();
        });
    })
    .then(function () {
        cb({
            message: function (channelName, content, cb) {
                insert(knex, channelName, content, cb);
            },
            getMessages: function (channelName, msgHandler, cb) {
                getMessages(knex, channelName, msgHandler, cb);
            },
        });
    });
};
