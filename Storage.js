/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var MongoClient = require('mongodb').MongoClient;

var MONGO_URI = "mongodb://demo_user:demo_password@ds027769.mongolab.com:27769/demo_database";
var COLLECTION_NAME = 'cryptpad';

var insert = function (coll, channelName, content, cb) {
    var val = {chan: channelName, msg:content, time: (new Date()).getTime()};
    coll.insertOne(val, {}, function (err, r) {
        if (err || (r.insertedCount !== 1)) {
            console.log('failed to insert ' + err);
            return;
        }
        cb();
    });
};

var getMessages = function (coll, channelName, cb) {
    coll.find({chan:channelName}).sort( { _id: 1 } ).forEach(function (doc) {
        cb(doc.msg);
    }, function (err) {
        if (!err) { return; }
        console.log('error ' + err);
    });
};

module.exports.create = function (conf, cb) {
    MongoClient.connect(conf.mongoUri, function(err, db) {
        var coll = db.collection(conf.mongoCollectionName);
        if (err) { throw err; }
        cb({
            message: function (channelName, content, cb) {
                insert(coll, channelName, content, cb);
            },
            getMessages: function (channelName, msgHandler) {
                getMessages(coll, channelName, msgHandler);
            }            
        });
    });
};
