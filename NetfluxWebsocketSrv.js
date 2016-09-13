;(function () { 'use strict';
const Crypto = require('crypto');
const LogStore = require('./storage/LogStore');


const LAG_MAX_BEFORE_DISCONNECT = 30000;
const LAG_MAX_BEFORE_PING = 15000;
const HISTORY_KEEPER_ID = Crypto.randomBytes(8).toString('hex');

const USE_HISTORY_KEEPER = true;
const USE_FILE_BACKUP_STORAGE = true;


let dropUser;

const now = function () { return (new Date()).getTime(); };

const sendMsg = function (ctx, user, msg) {
    try {
        if (ctx.config.logToStdout) { console.log('<' + JSON.stringify(msg)); }
        user.socket.send(JSON.stringify(msg));
    } catch (e) {
        console.log(e.stack);
        dropUser(ctx, user);
    }
};

const sendChannelMessage = function (ctx, channel, msgStruct) {
    msgStruct.unshift(0);
    channel.forEach(function (user) {
      if(msgStruct[2] !== 'MSG' || user.id !== msgStruct[1]) { // We don't want to send back a message to its sender, in order to save bandwidth
        sendMsg(ctx, user, msgStruct);
      }
    });
    if (USE_HISTORY_KEEPER && msgStruct[2] === 'MSG') {
        ctx.store.message(channel.id, JSON.stringify(msgStruct), function (err) {
            if (err) {
                console.log("Error writing message: " + err);
            }
        });
    }
};

dropUser = function (ctx, user) {
    if (user.socket.readyState !== 2 /* WebSocket.CLOSING */
        && user.socket.readyState !== 3 /* WebSocket.CLOSED */)
    {
        try {
            user.socket.close();
        } catch (e) {
            console.log("Failed to disconnect ["+user.id+"], attempting to terminate");
            try {
                user.socket.terminate();
            } catch (ee) {
                console.log("Failed to terminate ["+user.id+"]  *shrug*");
            }
        }
    }
    delete ctx.users[user.id];
    Object.keys(ctx.channels).forEach(function (chanName) {
        let chan = ctx.channels[chanName];
        let idx = chan.indexOf(user);
        if (idx < 0) { return; }
        console.log("Removing ["+user.id+"] from channel ["+chanName+"]");
        chan.splice(idx, 1);
        if (chan.length === 0) {
            console.log("Removing empty channel ["+chanName+"]");
            delete ctx.channels[chanName];

            /*  Call removeChannel if it is a function and channel removal is
                set to true in the config file */
            if (ctx.config.removeChannels) {
                if (typeof(ctx.store.removeChannel) === 'function') {
                    ctx.timeouts[chanName] = setTimeout(function () {
                        ctx.store.removeChannel(chanName, function (err) {
                            if (err) { console.error("[removeChannelErr]: %s", err); }
                            else {
                                console.log("Deleted channel [%s] history from database...", chanName);
                            }
                        });
                    }, ctx.config.channelRemovalTimeout);
                } else {
                    console.error("You have configured your server to remove empty channels, " +
                        "however, the database adaptor you are using has not implemented this behaviour.");
                }
            }
        } else {
            sendChannelMessage(ctx, chan, [user.id, 'LEAVE', chanName, 'Quit: [ dropUser() ]']);
        }
    });
};

const getHistory = function (ctx, channelName, handler, cb) {
    var messageBuf = [];
    ctx.store.getMessages(channelName, function (msgStr) {
        messageBuf.push(JSON.parse(msgStr));
    }, function (err) {
        if (err) {
            console.log("Error getting messages " + err.stack);
            // TODO: handle this better
        }
        var startPoint;
        var cpCount = 0;
        var msgBuff2 = [];
        for (startPoint = messageBuf.length - 1; startPoint >= 0; startPoint--) {
            var msg = messageBuf[startPoint];
            msgBuff2.push(msg);
            if (msg[2] === 'MSG' && msg[4].indexOf('cp|') === 0) {
                cpCount++;
                if (cpCount >= 2) {
                    for (var x = msgBuff2.pop(); x; x = msgBuff2.pop()) { handler(x); }
                    break;
                }
            }
            //console.log(messageBuf[startPoint]);
        }
        if (cpCount < 2) {
            // no checkpoints.
            for (var x = msgBuff2.pop(); x; x = msgBuff2.pop()) { handler(x); }
        }
        cb();
    });
};

const randName = function () { return Crypto.randomBytes(16).toString('hex'); };

const handleMessage = function (ctx, user, msg) {
    let json = JSON.parse(msg);
    let seq = json.shift();
    let cmd = json[0];
    let obj = json[1];

    user.timeOfLastMessage = now();
    user.pingOutstanding = false;

    if (cmd === 'JOIN') {
        if (obj && obj.length !== 32) {
            sendMsg(ctx, user, [seq, 'ERROR', 'ENOENT', obj]);
            return;
        }
        let chanName = obj || randName();
        sendMsg(ctx, user, [seq, 'JACK', chanName]);
        let chan = ctx.channels[chanName] = ctx.channels[chanName] || [];

        // prevent removal of the channel if there is a pending timeout
        if (ctx.config.removeChannels && ctx.timeouts[chanName]) {
            clearTimeout(ctx.timeouts[chanName]);
        }

        chan.id = chanName;
        if (USE_HISTORY_KEEPER) {
            sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'JOIN', chanName]);
        }
        chan.forEach(function (u) { sendMsg(ctx, user, [0, u.id, 'JOIN', chanName]); });
        chan.push(user);
        sendChannelMessage(ctx, chan, [user.id, 'JOIN', chanName]);
        return;
    }
    if (cmd === 'MSG') {
        if (obj === HISTORY_KEEPER_ID) {
            let parsed;
            try { parsed = JSON.parse(json[2]); } catch (err) { console.error(err); return; }
            if (parsed[0] === 'GET_HISTORY') {
                sendMsg(ctx, user, [seq, 'ACK']);
                getHistory(ctx, parsed[1], function (msg) {
                    sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(msg)]);
                }, function () {
                    sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, 0]);
                });
            }
            return;
        }
        if (obj && !ctx.channels[obj] && !ctx.users[obj]) {
            sendMsg(ctx, user, [seq, 'ERROR', 'ENOENT', obj]);
            return;
        }
        sendMsg(ctx, user, [seq, 'ACK']);
        let target;
        json.unshift(user.id);
        if ((target = ctx.channels[obj])) {
            sendChannelMessage(ctx, target, json);
            return;
        }
        if ((target = ctx.users[obj])) {
            json.unshift(0);
            sendMsg(ctx, target, json);
            return;
        }
    }
    if (cmd === 'LEAVE') {
        let err;
        let chan;
        let idx;
        if (!obj) { err = 'EINVAL'; obj = 'undefined';}
        if (!err && !(chan = ctx.channels[obj])) { err = 'ENOENT'; }
        if (!err && (idx = chan.indexOf(user)) === -1) { err = 'NOT_IN_CHAN'; }
        if (err) {
            sendMsg(ctx, user, [seq, 'ERROR', err, obj]);
            return;
        }
        sendMsg(ctx, user, [seq, 'ACK']);
        json.unshift(user.id);
        sendChannelMessage(ctx, chan, [user.id, 'LEAVE', chan.id]);
        chan.splice(idx, 1);
    }
    if (cmd === 'PING') {
        sendMsg(ctx, user, [seq, 'ACK']);
        return;
    }
};

let run = module.exports.run = function (storage, socketServer, config) {
    /*  Channel removal timeout defaults to 60000ms (one minute) */
    config.channelRemovalTimeout =
        typeof(config.channelRemovalTimeout) === 'number'?
            config.channelRemovalTimeout:
            60000;

    let ctx = {
        users: {},
        channels: {},
        timeouts: {},
        store: (USE_FILE_BACKUP_STORAGE) ? LogStore.create('messages.log', storage) : storage,
        config: config
    };
    setInterval(function () {
        Object.keys(ctx.users).forEach(function (userId) {
            let u = ctx.users[userId];
            if (now() - u.timeOfLastMessage > LAG_MAX_BEFORE_DISCONNECT) {
                dropUser(ctx, u);
            } else if (!u.pingOutstanding && now() - u.timeOfLastMessage > LAG_MAX_BEFORE_PING) {
                sendMsg(ctx, u, [0, '', 'PING', now()]);
                u.pingOutstanding = true;
            }
        });
    }, 5000);
    socketServer.on('connection', function(socket) {
        if(socket.upgradeReq.url !== '/cryptpad_websocket') { return; }
        let conn = socket.upgradeReq.connection;
        let user = {
            addr: conn.remoteAddress + '|' + conn.remotePort,
            socket: socket,
            id: randName(),
            timeOfLastMessage: now(),
            pingOutstanding: false
        };
        ctx.users[user.id] = user;
        sendMsg(ctx, user, [0, '', 'IDENT', user.id]);
        socket.on('message', function(message) {
            if (ctx.config.logToStdout) { console.log('>'+message); }
            try {
                handleMessage(ctx, user, message);
            } catch (e) {
                console.log(e.stack);
                dropUser(ctx, user);
            }
        });
        socket.on('close', function (evt) {
            for (let userId in ctx.users) {
                if (ctx.users[userId].socket === socket) {
                    dropUser(ctx, ctx.users[userId]);
                }
            }
        });
    });
};
}());
