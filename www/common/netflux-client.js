/*global: WebSocket */
define(function () {
    'use strict';

    var MAX_LAG_BEFORE_PING = 15000;
    var MAX_LAG_BEFORE_DISCONNECT = 30000;
    var PING_CYCLE = 5000;
    var REQUEST_TIMEOUT = 30000;

    var now = function now() {
        return new Date().getTime();
    };

    var networkSendTo = function networkSendTo(ctx, peerId, content) {
        var seq = ctx.seq++;
        ctx.ws.send(JSON.stringify([seq, 'MSG', peerId, content]));
        return new Promise(function (res, rej) {
            ctx.requests[seq] = { reject: rej, resolve: res, time: now() };
        });
    };

    var channelBcast = function channelBcast(ctx, chanId, content) {
        var chan = ctx.channels[chanId];
        if (!chan) {
            throw new Error("no such channel " + chanId);
        }
        var seq = ctx.seq++;
        ctx.ws.send(JSON.stringify([seq, 'MSG', chanId, content]));
        return new Promise(function (res, rej) {
            ctx.requests[seq] = { reject: rej, resolve: res, time: now() };
        });
    };

    var channelLeave = function channelLeave(ctx, chanId, reason) {
        var chan = ctx.channels[chanId];
        if (!chan) {
            throw new Error("no such channel " + chanId);
        }
        delete ctx.channels[chanId];
        ctx.ws.send(JSON.stringify([ctx.seq++, 'LEAVE', chanId, reason]));
    };

    var makeEventHandlers = function makeEventHandlers(ctx, mappings) {
        return function (name, handler) {
            var handlers = mappings[name];
            if (!handlers) {
                throw new Error("no such event " + name);
            }
            handlers.push(handler);
        };
    };

    var mkChannel = function mkChannel(ctx, id) {
        var internal = {
            onMessage: [],
            onJoin: [],
            onLeave: [],
            members: [],
            jSeq: ctx.seq++
        };
        var chan = {
            _: internal,
            time: now(),
            id: id,
            members: internal.members,
            bcast: function bcast(msg) {
                return channelBcast(ctx, chan.id, msg);
            },
            leave: function leave(reason) {
                return channelLeave(ctx, chan.id, reason);
            },
            on: makeEventHandlers(ctx, { message: internal.onMessage, join: internal.onJoin, leave: internal.onLeave })
        };
        ctx.requests[internal.jSeq] = chan;
        ctx.ws.send(JSON.stringify([internal.jSeq, 'JOIN', id]));

        return new Promise(function (res, rej) {
            chan._.resolve = res;
            chan._.reject = rej;
        });
    };

    var mkNetwork = function mkNetwork(ctx) {
        var network = {
            webChannels: ctx.channels,
            getLag: function getLag() {
                return ctx.lag;
            },
            sendto: function sendto(peerId, content) {
                return networkSendTo(ctx, peerId, content);
            },
            join: function join(chanId) {
                return mkChannel(ctx, chanId);
            },
            on: makeEventHandlers(ctx, { message: ctx.onMessage, disconnect: ctx.onDisconnect })
        };
        network.__defineGetter__("webChannels", function () {
            return Object.keys(ctx.channels).map(function (k) {
                return ctx.channels[k];
            });
        });
        return network;
    };

    var onMessage = function onMessage(ctx, evt) {
        var msg = void 0;
        try {
            msg = JSON.parse(evt.data);
        } catch (e) {
            console.log(e.stack);return;
        }
        if (msg[0] !== 0) {
            var req = ctx.requests[msg[0]];
            if (!req) {
                console.log("error: " + JSON.stringify(msg));
                return;
            }
            delete ctx.requests[msg[0]];
            if (msg[1] === 'ACK') {
                if (req.ping) {
                    // ACK of a PING
                    ctx.lag = now() - Number(req.ping);
                    return;
                }
                req.resolve();
            } else if (msg[1] === 'JACK') {
                if (req._) {
                    // Channel join request...
                    if (!msg[2]) {
                        throw new Error("wrong type of ACK for channel join");
                    }
                    req.id = msg[2];
                    ctx.channels[req.id] = req;
                    return;
                }
                req.resolve();
            } else if (msg[1] === 'ERROR') {
                req.reject({ type: msg[2], message: msg[3] });
            } else {
                req.reject({ type: 'UNKNOWN', message: JSON.stringify(msg) });
            }
            return;
        }
        
        if (msg[2] === 'IDENT') {
            ctx.uid = msg[3];

            setInterval(function () {
                if (now() - ctx.timeOfLastMessage < MAX_LAG_BEFORE_PING) {
                    return;
                }
                var seq = ctx.seq++;
                var currentDate = now();
                ctx.requests[seq] = { time: now(), ping: currentDate };
                ctx.ws.send(JSON.stringify([seq, 'PING', currentDate]));
                if (now() - ctx.timeOfLastMessage > MAX_LAG_BEFORE_DISCONNECT) {
                    ctx.ws.close();
                }
            }, PING_CYCLE);

            return;
        } else if (!ctx.uid) {
            // extranious message, waiting for an ident.
            return;
        }
        if (msg[2] === 'PING') {
            msg[2] = 'PONG';
            ctx.ws.send(JSON.stringify(msg));
            return;
        }

        if (msg[2] === 'MSG') {
            var handlers = void 0;
            if (msg[3] === ctx.uid) {
                handlers = ctx.onMessage;
            } else {
                var chan = ctx.channels[msg[3]];
                if (!chan) {
                    console.log("message to non-existant chan " + JSON.stringify(msg));
                    return;
                }
                handlers = chan._.onMessage;
            }
            handlers.forEach(function (h) {
                try {
                    h(msg[4], msg[1]);
                } catch (e) {
                    console.error(e);
                }
            });
        }

        if (msg[2] === 'LEAVE') {
            var _chan = ctx.channels[msg[3]];
            if (!_chan) {
                console.log("leaving non-existant chan " + JSON.stringify(msg));
                return;
            }
            _chan._.onLeave.forEach(function (h) {
                try {
                    h(msg[1], msg[4]);
                } catch (e) {
                    console.log(e.stack);
                }
            });
        }

        if (msg[2] === 'JOIN') {
            var _chan2 = ctx.channels[msg[3]];
            if (!_chan2) {
                console.log("ERROR: join to non-existant chan " + JSON.stringify(msg));
                return;
            }
            // have we yet fully joined the chan?
            var synced = _chan2._.members.indexOf(ctx.uid) !== -1;
            _chan2._.members.push(msg[1]);
            if (!synced && msg[1] === ctx.uid) {
                // sync the channel join event
                _chan2.myID = ctx.uid;
                _chan2._.resolve(_chan2);
            }
            if (synced) {
                _chan2._.onJoin.forEach(function (h) {
                    try {
                        h(msg[1]);
                    } catch (e) {
                        console.log(e.stack);
                    }
                });
            }
        }
    };

    var connect = function connect(websocketURL) {
        var ctx = {
            ws: new WebSocket(websocketURL),
            seq: 1,
            lag: 0,
            uid: null,
            network: null,
            channels: {},
            onMessage: [],
            onDisconnect: [],
            requests: {}
        };
        setInterval(function () {
            for (var id in ctx.requests) {
                var req = ctx.requests[id];
                if (now() - req.time > REQUEST_TIMEOUT) {
                    delete ctx.requests[id];
                    if (typeof req.reject === "function") {
                        req.reject({ type: 'TIMEOUT', message: 'waited ' + (now() - req.time) + 'ms' });
                    }
                }
            }
        }, 5000);
        ctx.network = mkNetwork(ctx);
        ctx.ws.onmessage = function (msg) {
            return onMessage(ctx, msg);
        };
        ctx.ws.onclose = function (evt) {
            ctx.onDisconnect.forEach(function (h) {
                try {
                    h(evt.reason);
                } catch (e) {
                    console.log(e.stack);
                }
            });
        };
        return new Promise(function (resolve, reject) {
            ctx.ws.onopen = function () {
                var count = 0;
                var interval = 100;
                var checkIdent = function() {
                  if(ctx.uid !== null) {
                    return resolve(ctx.network);
                  }
                  else {
                    if(count * interval > REQUEST_TIMEOUT) {
                      return reject({ type: 'TIMEOUT', message: 'waited ' + (count * interval) + 'ms' });
                    }
                    setTimeout(checkIdent, 100);
                  }
                }
                checkIdent();
            };
        });
    };

    return { connect: connect };
});