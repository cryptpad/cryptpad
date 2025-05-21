// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later
const factory = (SRpc, Channel, Util) => {
    const Interface = {};
    let store;
    let Rpc;
    let clients = {};
    let closeStore = () => {};

    Interface.init = (_closeStore) => {
        if (Rpc) { return; }
        const query = (cId, cmd, data, cb) => {
            cb = cb || function () {};
            clients[cId].chan.query(cmd, data, function (err, res) {
                if (err) { return void cb({error: err}); }
                cb(res);
            });
        };
        const broadcast = (excludes, cmd, data, cb) => {
            cb = cb || function () {};
            Object.keys(clients).forEach(cId => {
                if (excludes.indexOf(+cId) !== -1) { return; }
                clients[cId].chan.query(cmd, data, (err, res) => {
                    if (err) { return void cb({error: err}); }
                    cb(res);
                });
            });
        };
        Rpc = SRpc.create({
            query, broadcast
        });
        closeStore = _closeStore;
    };
    Interface.initClient = (cfg, cb) => {
        if (!Rpc) {
            console.error('Not initialized');
            return void cb('NOT_INIT');
        }
        const { postMsg } = cfg;
        const onMsg = Util.mkEvent();
        // onMsg: mkEvent
        // postMsg: data {} arg

        const clientId = Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
        const onClose = () => {
            Rpc._removeClient(clientId);
        };

        Channel.create(onMsg, postMsg, function (chan) {
            let client = clients[clientId] = { chan };
            console.debug('SharedW Channel created');

            Object.keys(Rpc.queries).forEach(function (q) {
                if (q === 'CONNECT') { return; }
                if (q === 'JOIN_PAD') { return; }
                if (q === 'SEND_PAD_MSG') { return; }
                if (q === 'STOPWORKER') { return; }
                chan.on(q, function (data, cb) {
                    try {
                        Rpc.queries[q](clientId, data, cb);
                    } catch (e) {
                        console.error('Error in webworker when executing query ' + q);
                        console.error(e);
                        console.log(data);
                    }
                    if (q === "DISCONNECT") {
                        onClose();
                        if (globalThis.accountDeletion && globalThis.accountDeletion === client.id) {
                            Rpc = undefined;
                            store = undefined;
                        }

                    }
                });
            });
            chan.on('STOPWORKER', function (data, cb) {
                closeStore();
                Rpc.queries['DISCONNECT'](clientId, data, cb);
            });
            chan.on('CONNECT', function (cfg, cb) {
                console.debug('Connecting to store...');

                Rpc.queries['CONNECT'](clientId, cfg, function (data) {
                    if (data && data.state === "ALREADY_INIT") {
                        console.debug('Store already exists!');
                        store = store || data.returned;
                        return void cb(data);
                    }
                    store = data;
                    cb(data);
                });
            });
            // XXX allow multiple pads in same tab
            chan.on('JOIN_PAD', function (data, cb) {
                client.channelId = data.channel;
                try {
                    Rpc.queries['JOIN_PAD'](clientId, data, cb);
                } catch (e) {
                    console.error('Error in webworker when executing query JOIN_PAD');
                    console.error(e);
                    console.log(data);
                }
            });
            chan.on('SEND_PAD_MSG', function (msg, cb) {
                var data = {
                    msg: msg,
                    channel: client.channelId
                };
                try {
                    Rpc.queries['SEND_PAD_MSG'](clientId, data, cb);
                } catch (e) {
                    console.error('Error in webworker when executing query SEND_PAD_MSG');
                    console.error(e);
                    console.log(data);
                }
            });

            cb(onMsg, onClose);
        }, true);
    };
    return Interface;
};

module.exports = factory(
    require('./store-rpc'),
    require('../../common/events-channel'),
    require('../../common/common-util')
);
