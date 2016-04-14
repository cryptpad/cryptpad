/*global: WebSocket */
define(() => {
'use strict';
const MAX_LAG_BEFORE_PING = 15000;
const MAX_LAG_BEFORE_DISCONNECT = 30000;
const PING_CYCLE = 5000;
const REQUEST_TIMEOUT = 30000;

const now = () => new Date().getTime();

const networkSendTo = (ctx, peerId, content) => {
    const seq = ctx.seq++;
    ctx.ws.send(JSON.stringify([seq, 'MSG', peerId, content]));
    return new Promise((res, rej) => {
        ctx.requests[seq] = { reject: rej, resolve: res, time: now() };
    });
};

const channelBcast = (ctx, chanId, content) => {
    const chan = ctx.channels[chanId];
    if (!chan) { throw new Error("no such channel " + chanId); }
    const seq = ctx.seq++;
    ctx.ws.send(JSON.stringify([seq, 'MSG', chanId, content]));
    return new Promise((res, rej) => {
        ctx.requests[seq] = { reject: rej, resolve: res, time: now() };
    });
};

const channelLeave = (ctx, chanId, reason) => {
    const chan = ctx.channels[chanId];
    if (!chan) { throw new Error("no such channel " + chanId); }
    delete ctx.channels[chanId];
    ctx.ws.send(JSON.stringify([ctx.seq++, 'LEAVE', chanId, reason]));
};

const makeEventHandlers = (ctx, mappings) => {
    return (name, handler) => {
        const handlers = mappings[name];
        if (!handlers) { throw new Error("no such event " + name); }
        handlers.push(handler);
    };
};

const mkChannel = (ctx, id) => {
    const internal = {
        onMessage: [],
        onJoin: [],
        onLeave: [],
        members: [],
        jSeq: ctx.seq++
    };
    const chan = {
        _: internal,
        id: id,
        members: internal.members,
        bcast: (msg) => channelBcast(ctx, chan.id, msg),
        leave: (reason) => channelLeave(ctx, chan.id, reason),
        on: makeEventHandlers(ctx, { message:
            internal.onMessage, join: internal.onJoin, leave: internal.onLeave })
    };
    ctx.requests[internal.jSeq] = chan;
    ctx.ws.send(JSON.stringify([internal.jSeq, 'JOIN', id]));

    return new Promise((res, rej) => {
        chan._.resolve = res;
        chan._.reject = rej;
    })
};

const mkNetwork = (ctx) => {
    const network = {
        webChannels: ctx.channels,
        getLag: () => (ctx.lag),
        sendto: (peerId, content) => (networkSendTo(ctx, peerId, content)),
        join: (chanId) => (mkChannel(ctx, chanId)),
        on: makeEventHandlers(ctx, { message: ctx.onMessage, disconnect: ctx.onDisconnect })
    };
    network.__defineGetter__("webChannels", () => {
        return Object.keys(ctx.channels).map((k) => (ctx.channels[k]));
    });
    return network;
};

const onMessage = (ctx, evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch (e) { console.log(e.stack); return; }
    if (msg[0] !== 0) {
        const req = ctx.requests[msg[0]];
        if (!req) {
            console.log("error: " + JSON.stringify(msg));
            return;
        }
        delete ctx.requests[msg[0]];
        if (msg[1] === 'ACK') {
            if (req.ping) { // ACK of a PING
                ctx.lag = now() - Number(req.ping);
                return;
            }
            req.resolve();
        } else if (msg[1] === 'JACK') {
            if (req._) {
                // Channel join request...
                if (!msg[2]) { throw new Error("wrong type of ACK for channel join"); }
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

        setInterval(() => {
            if (now() - ctx.timeOfLastMessage < MAX_LAG_BEFORE_PING) { return; }
            let seq = ctx.seq++;
            let currentDate = now();
            ctx.requests[seq] = {time: now(), ping: currentDate};
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
        let handlers;
        if (msg[3] === ctx.uid) {
            handlers = ctx.onMessage;
        } else {
            const chan = ctx.channels[msg[3]];
            if (!chan) {
                console.log("message to non-existant chan " + JSON.stringify(msg));
                return;
            }
            handlers = chan._.onMessage;
        }
        handlers.forEach((h) => {
            try { h(msg[4], msg[1]); } catch (e) { console.error(e); }
        });
    }

    if (msg[2] === 'LEAVE') {
        const chan = ctx.channels[msg[3]];
        if (!chan) {
            console.log("leaving non-existant chan " + JSON.stringify(msg));
            return;
        }
        chan._.onLeave.forEach((h) => {
            try { h(msg[1], msg[4]); } catch (e) { console.log(e.stack); }
        });
    }

    if (msg[2] === 'JOIN') {
        const chan = ctx.channels[msg[3]];
        if (!chan) {
            console.log("ERROR: join to non-existant chan " + JSON.stringify(msg));
            return;
        }
        // have we yet fully joined the chan?
        const synced = (chan._.members.indexOf(ctx.uid) !== -1);
        chan._.members.push(msg[1]);
        if (!synced && msg[1] === ctx.uid) {
            // sync the channel join event
            chan.myID = ctx.uid;
            chan._.resolve(chan);
        }
        if (synced) {
            chan._.onJoin.forEach((h) => {
                try { h(msg[1]); } catch (e) { console.log(e.stack); }
            });
        }
    }
};

const connect = (websocketURL) => {
    let ctx = {
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
    setInterval(() => {
        for (let id in ctx.requests) {
            const req = ctx.requests[id];
            if (now() - req.time > REQUEST_TIMEOUT) {
                delete ctx.requests[id];
                if(typeof req.reject === "function") { req.reject({ type: 'TIMEOUT', message: 'waited ' + now() - req.time + 'ms' }); }
            }
        }
    }, 5000);
    ctx.network = mkNetwork(ctx);
    ctx.ws.onmessage = (msg) => (onMessage(ctx, msg));
    ctx.ws.onclose = (evt) => {
        ctx.onDisconnect.forEach((h) => {
            try { h(evt.reason); } catch (e) { console.log(e.stack); }
        });
    };
    return new Promise((resolve, reject) => {
        ctx.ws.onopen = () => resolve(ctx.network);
    });
};

return { connect: connect };
});
