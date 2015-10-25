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
var WebSocket = require('ws');

var REGISTER     = 0;
var REGISTER_ACK = 1;
var PATCH        = 2;
var DISCONNECT   = 3;
var PING         = 4;
var PONG         = 5;

var parseMessage = function (msg) {
    var orig=msg,
        res ={};
    // two or more? use a for
    ['pass','user','channelId','content'].forEach(function(attr){
        var len=msg.substring(0,msg.indexOf(':'));
        msg=msg.substring(len.length+1);
        var prop=msg.substring(0,Number(len));
        msg = msg.substring(prop.length);
        res[attr]=prop;
    });
    res.content=JSON.parse(res.content);
    return res;
};

// get the password off the message before sending it to other clients.
var popPassword = function (msg) {
    var passLen = msg.substring(0,msg.indexOf(':'));
    return msg.substring(passLen.length+1 + Number(passLen));
};

var sendMsg = function (msg, socket) {
    socket.send(msg);
};

var sendChannelMessage = function (ctx, channel, msg, cb) {
    ctx.store.message(channel.name, msg, function () {
        channel.forEach(function (user) {
            try {
                sendMsg(msg, user.socket);
            } catch (e) {
                console.log(e.stack);
                try { user.socket.close(); } catch (e) { }
            }
        });
        cb && cb();
    });
};

var mkMessage = function (user, channel, content) {
    content = JSON.stringify(content);
    return user.length + ':' + user +
        channel.length + ':' + channel +
        content.length + ':' + content;
};

var dropClient = function (ctx, userpass) {
    var client = ctx.registeredClients[userpass];
    if (client.socket.readyState !== WebSocket.CLOSING
        && client.socket.readyState !== WebSocket.CLOSED)
    {
        try {
            client.socket.close();
        } catch (e) {
            console.log("Failed to disconnect ["+client.userName+"], attempting to terminate");
            try {
                client.socket.terminate();
            } catch (ee) {
                console.log("Failed to terminate ["+client.userName+"]  *shrug*");
            }
        }
    }

    for (var i = 0; i < client.channels.length; i++) {
        var chanName = client.channels[i];
        var chan = ctx.channels[chanName];
        var idx = chan.indexOf(client);
        if (idx < 0) { continue; }
        console.log("Removing ["+client.userName+"] from channel ["+chanName+"]");
        chan.splice(idx, 1);
        if (chan.length === 0) {
            console.log("Removing empty channel ["+chanName+"]");
            delete ctx.channels[chanName];
        } else {
            sendChannelMessage(ctx, chan, mkMessage(client.userName, chanName, [DISCONNECT,0]));
        }
    }
    delete ctx.registeredClients[userpass];
};

var handleMessage = function (ctx, socket, msg) {
    var parsed = parseMessage(msg);
    var userPass = parsed.user + ':' + parsed.pass;
    msg = popPassword(msg);

    if (parsed.content[0] === REGISTER) {
        if (parsed.user.length === 0) { throw new Error(); }
console.log("[" + userPass + "] registered");
        var user = ctx.registeredClients[userPass] = ctx.registeredClients[userPass] || {
            channels: [parsed.channelId],
            userName: parsed.user
        };
        if (user.socket && user.socket !== socket) { user.socket.close(); }
        user.socket = socket;

        var chan = ctx.channels[parsed.channelId] = ctx.channels[parsed.channelId] || [];
        var newChan = (chan.length === 0);
        chan.name = parsed.channelId;

        // we send a register ack right away but then we fallthrough
        // to let other users know that we were registered.
        sendMsg(mkMessage('', parsed.channelId, [1,0]), socket);

        var sendMsgs = function () {
            sendChannelMessage(ctx, chan, msg, function () {
                chan.push(user);
                ctx.store.getMessages(chan.name, function (msg) {
                    try {
                        sendMsg(msg, socket);
                    } catch (e) {
                        console.log(e.stack);
                        try { socket.close(); } catch (e) { }
                    }
                });
            });
        };
        if (newChan) {
            sendChannelMessage(ctx, chan, mkMessage('', chan.name, [DISCONNECT,0]), sendMsgs);
        } else {
            sendMsgs();
        }
        return;
    }

    if (parsed.content[0] === PING) {
        //    31:xwiki:XWiki.Admin-141475016907510:RWJ5xF2+SL17:[5,1414752676547]
        // 1:y31:xwiki:XWiki.Admin-141475016907510:RWJ5xF2+SL17:[4,1414752676547]
        sendMsg(mkMessage(parsed.user, parsed.channelId, [ PONG, parsed.content[1] ]), socket);
        return;
    }

    var client = ctx.registeredClients[userPass];
    if (typeof(client) === 'undefined') { throw new Error('unregistered'); }

    var channel = ctx.channels[parsed.channelId];
    if (typeof(channel) === 'undefined') { throw new Error('no such channel'); }

    if (channel.indexOf(client) === -1) { throw new Error('client not in channel'); }

    sendChannelMessage(ctx, channel, msg);
};

var create = module.exports.create = function (socketServer, store) {
    var ctx = {
        registeredClients: {},
        channels: {},
        store: store
    };

    socketServer.on('connection', function(socket) {
        socket.on('message', function(message) {
            try {
                handleMessage(ctx, socket, message);
            } catch (e) {
                console.log(e.stack);
                try { socket.close(); } catch (e) { }
            }
        });
        socket.on('close', function (evt) {
            for (client in ctx.registeredClients) {
                if (ctx.registeredClients[client].socket === socket) {
                    dropClient(ctx, client);
                }
            }
        });
    });
};
