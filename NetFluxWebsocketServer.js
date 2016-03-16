;(function () { 'use strict';
let Crypto = require('crypto');
let WebSocket = require('ws');

let LAG_MAX_BEFORE_DISCONNECT = 30000;
let LAG_MAX_BEFORE_PING = 15000;
let HISTORY_KEEPER_ID = "_HISTORY_KEEPER_";

let dropUser;

let now = function () { return (new Date()).getTime(); };

let sendMsg = function (ctx, user, msg) {
    try {
        console.log('<' + JSON.stringify(msg));
        user.socket.send(JSON.stringify(msg));
    } catch (e) {
        console.log(e.stack);
        dropUser(ctx, user);
    }
};

let sendChannelMessage = function (ctx, channel, msgStruct) {
    msgStruct.unshift(0);
    channel.forEach(function (user) { sendMsg(ctx, user, msgStruct); });
    if (msgStruct[2] === 'MSG') {
        ctx.store.message(channel.id, JSON.stringify(msgStruct), function () { });
    }
};

dropUser = function (ctx, user) {
    if (user.socket.readyState !== WebSocket.CLOSING
        && user.socket.readyState !== WebSocket.CLOSED)
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
        } else {
            sendChannelMessage(ctx, chan, [user.id, 'LEAVE', chanName, 'Quit: [ dropUser() ]']);
        }
    });
};

let getHistory = function (ctx, channelName, handler) {
    ctx.store.getMessages(channelName, function (msgStr) { handler(JSON.parse(msgStr)); });
};

let randName = function () { return Crypto.randomBytes(16).toString('hex'); };

let handleMessage = function (ctx, user, msg) {
    let json = JSON.parse(msg);
    let seq = json.shift();
    let cmd = json[0];
    let obj = json[1];

    user.timeOfLastMessage = now();
    user.pingOutstanding = false;

    if (cmd === 'JOIN') {
        /*if (obj && obj.length !== 32) {
            sendMsg(ctx, user, [seq, 'ERROR', 'ENOENT', obj]);
            return;
        }*/
        let chanName = obj || randName();
        let chan = ctx.channels[chanName] = ctx.channels[chanName] || [];
        chan.id = chanName;
        sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'JOIN', chanName]);
        chan.forEach(function (u) { sendMsg(ctx, user, [0, u.id, 'JOIN', chanName]); });
        chan.push(user);
        sendChannelMessage(ctx, chan, [user.id, 'JOIN', chanName]);
        return;
    }
    if (cmd === 'MSG') {
        if (obj === HISTORY_KEEPER_ID) {
            let parsed;
            try { parsed = JSON.parse(json[2]); } catch (err) { return; }
            if (parsed[0] === 'GET_HISTORY') {
                console.log('getHistory ' + parsed[1]);
                getHistory(ctx, parsed[1], function (msg) {
                    sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, JSON.stringify(msg)]);
                });
                sendMsg(ctx, user, [0, HISTORY_KEEPER_ID, 'MSG', user.id, 0]);
            }
            return;
        }
        if (obj && !ctx.channels[obj] && !ctx.users[obj]) {
            sendMsg(ctx, user, [seq, 'ERROR', 'ENOENT', obj]);
            return;
        }
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
        if (!obj) { err = 'EINVAL'; }
        if (!err && !(chan = ctx.channels[obj])) { err = 'ENOENT'; }
        if (!err && (idx = chan.indexOf(user)) === -1) { err = 'NOT_IN_CHAN'; }
        if (err) {
            sendMsg(ctx, user, [seq, 'ERROR', err]);
            return;
        }
        json.unshift(user.id);
        sendChannelMessage(ctx, chan, [user.id, 'LEAVE', chan.id]);
        chan.splice(idx, 1);
    }
    if (cmd === 'PING') {
        sendMsg(ctx, user, [seq, 'PONG', obj]);
        return;
    }
};

let run = module.exports.run = function (storage, socketServer) {
    let ctx = {
        users: {},
        channels: {},
        store: storage
    };
    setInterval(function () {
        Object.keys(ctx.users).forEach(function (userId) {
            let u = ctx.users[userId];
            if (now() - u.timeOfLastMessage > LAG_MAX_BEFORE_DISCONNECT) {
                dropUser(ctx, u);
            } else if (!u.pingOutstanding && now() - u.timeOfLastMessage > LAG_MAX_BEFORE_PING) {
                sendMsg(ctx, u, [0, 'PING', now()]);
                u.pingOutstanding = true;
            }
        });
    }, 5000);
    socketServer.on('connection', function(socket) {
        let conn = socket.upgradeReq.connection;
        let user = {
            addr: conn.remoteAddress + '|' + conn.remotePort,
            socket: socket,
            id: randName(),
            timeOfLastMessage: now(),
            pingOutstanding: false
        };
        ctx.users[user.id] = user;
        sendMsg(ctx, user, [0, 'IDENT', user.id]);
        socket.on('message', function(message) {
            console.log('>'+message);
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
