// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import nacl from 'tweetnacl/nacl-fast';
import { Pad, RpcCall, Callback } from '../types'

// node modules
import * as ChainPad from 'chainpad';
import * as Crypto from 'chainpad-crypto';
import * as CpNetflux from 'chainpad-netflux';
import nThen from 'nthen';
import Sortify from 'json.sortify';
// custom modules
import * as NetConfig from '../../common/network-config.js';
import * as Hash from '../../common/common-hash.js';
import * as Util from '../../common/common-util.js';
import * as Cache from '../../common/cache-store.js';
import * as UserObject from '../../common/user-object.js';

import * as SF from './sharedfolder.js';

const onJoinedEvt: any = Util.mkEvent(true);
const onCacheReadyEvt: any = Util.mkEvent(true);

const _getMetadata: Callback = (ctx, clientId, data, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));
    const { store, Store } = ctx;

    if (store.offline || !store.anon_rpc) {
        return void cb({ error: 'OFFLINE' });
    }
    if (!data.channel) {
        return void cb({ error: 'ENOTFOUND'});
    }
    if (data.channel.length !== 32) {
        return void cb({ error: 'EINVAL'});
    }
    if (!Hash.isValidChannel(data.channel)) {
        return void cb({ error: 'EINVAL' });
    }

    store.anon_rpc.send('GET_METADATA', data.channel, (err, obj) => {
        if (err) { return void cb({error: err}); }
        const metadata = (obj && obj[0]) || {};
        cb(metadata);

        // If you don't have access to the metadata, stop here
        // (we can't update the local data)
        if (metadata.rejected) { return; }

        // Update owners and expire time in the drive
        Store.getAllStores().forEach(s => {
            const allData = s.manager.findChannel(data.channel, true);
            let changed = false;
            allData.forEach(obj => {
                if (Sortify(obj.data.owners) !== Sortify(metadata.owners)) {
                    changed = true;
                }
                obj.data.owners = metadata.owners;
                obj.data.atime = +new Date();
                if (metadata.expire) {
                    obj.data.expire = +metadata.expire;
                }
            });

            // If we had to change the "owners" field,
            // redraw the drive UI
            if (!changed) { return; }
            var send = s.sendEvent || store.sendDriveEvent;
            send('DRIVE_CHANGE', {
                path: ['drive', UserObject.FILES_DATA]
            });
        });
    });
};
const _setMetadata: Callback = (ctx, clientId, data, cb) => {
    if (!data.channel) { return void cb({ error: 'ENOTFOUND'}); }
    if (!data.command) { return void cb({ error: 'EINVAL' }); }
    const { Store } = ctx;
    const s = Store.getStore(data.teamId);
    if (!s) { return void cb({ error: 'ENOTFOUND' }); }

    const otherChannels = data.channels;
    delete data.channels;
    s.rpc.setMetadata(data, (err, res) => {
        if (err) { return void cb({ error: err }); }
        if (!Array.isArray(res) || !res.length) { return void cb({}); }
        cb(res[0]);
    });
    // If we have other related channels, send the command for them too
    if (Array.isArray(otherChannels)) {
        otherChannels.forEach(chan => {
            var _d = Util.clone(data);
            _d.channel = chan;
            Store.setPadMetadata(clientId, _d, () => {});
        });
    }
};

const _getVersionHash: Callback = (ctx, clientId, data) => {
    let validateKey;
    const { Store, store, postMessage } = ctx;

    const channel = data.channel;
    const toFind = data.versionHash;

    // create fake history keeper to avoid validate
    const fakeNetflux = Hash.createChannelId();

    nThen(waitFor => {
        _getMetadata(ctx, clientId, { channel }, waitFor(md => {
            if (md && md.rejected) {
                postMessage(clientId, "PAD_ERROR", {
                    type: "ERESTRICTED"
                });
                waitFor.abort();
                return;
            }
            validateKey = md.validateKey;
        }));
    }).nThen(() => {
        Store.getHistoryRange(clientId, {
            cpCount: 1,
            channel,
            lastKnownHash: toFind
        }, obj => {
            if (obj && obj.error) {
                return postMessage(clientId, "PAD_ERROR", obj.error);
            }
            const msgs = obj.messages || [];
            if (msgs[msgs.length - 1]?.serverHash !== toFind) {
                return postMessage(clientId, "PAD_ERROR", {
                    type: "HASH_NOT_FOUND"
                });
            }
            postMessage(clientId, "PAD_CONNECT", {
                myID: fakeNetflux,
                id: channel,
                members: [fakeNetflux]
            });
            (obj.messages || []).forEach(data => {
                postMessage(clientId, "PAD_MESSAGE", {
                    msg: data.msg,
                    time: data.time,
                    user: fakeNetflux.slice(0,16)
                });
            });
            if (validateKey) {
                store?.messenger?.storeValidateKey(channel, validateKey);
            }
            postMessage(clientId, "PAD_READY");
        });
    });
};

const _join: Callback = (ctx, clientId, data) => {
    if (data.versionHash) {
        return _getVersionHash(ctx, clientId, data);
    }

    const { channels, store, Store, myDeletions, postMessage } = ctx;
    const channelId = data.channel;

    if (!Hash.isValidChannel(channelId)) {
        return postMessage(clientId, "PAD_ERROR", 'INVALID_CHAN');
    }

    const isNew = typeof channels[channelId] === "undefined";

    // Create or get existing channel object
    const channel = channels[channelId] ||= {
        queue: [],
        data: {},
        clients: [],
        bcast: (cmd, data, notMe) => {
            channel.clients.forEach(function (cId) {
                if (cId === notMe) { return; }
                postMessage(cId, cmd, data);
            });
        },
        history: [],
        pushHistory: (msg, isCp) => {
            if (isCp) {
                // Checkpoint, re-add "cp|" and clear older history
                channel.history.push('cp|' + msg);
                let i;
                for (i = channel.history.length - 101; i > 0; i--) {
                    if (/^cp\|/.test(channel.history[i])) { break; }
                }
                channel.history = channel.history.slice(i);
                return;
            }
            channel.history.push(msg);
        }
    };

    // Add new client
    if (channel.clients.indexOf(clientId) === -1) {
        channel.clients.push(clientId);
    }

    // Existing pad already loaded: send userlist and history
    if (!isNew && channel.wc) {
        postMessage(clientId, "PAD_CONNECT", { // Initialize
            myID: channel.wc.myID,
            id: channel.wc.id,
            members: channel.wc.members
        });
        channel.wc.members.forEach(m => { // Userlist
            postMessage(clientId, "PAD_JOIN", m);
        });
        channel.history.forEach(msg => { // History
            postMessage(clientId, "PAD_MESSAGE", {
                msg: CpNetflux.removeCp(msg),
                user: channel.wc.myID,
                validateKey: channel.data.validateKey
            });
        });
        postMessage(clientId, "PAD_READY"); // Ready
        return;
    }

    // chainpad-netflux config
    const onError = err => {
        const type = err?.type;
        // Deletion started from this worker => different UI message
        if (type === "EDELETED" && myDeletions[channelId]) {
            delete myDeletions[channelId];
            err.ownDeletion = true;
        }
        channel.bcast("PAD_ERROR", err);

        if (type === "EDELETED" && Cache?.clearChannel) {
            Cache.clearChannel(channelId);
        }

        // DELETED, EXPIRED or RESTRICTED pad => leave the channel
        if (!["EDELETED","EEXPIRED","ERESTRICTED"].includes(type)) {
            return;
        }
        ctx.leavePad(null, data, function () {});
    };
    const conf = {
        Cache: store.neverCache ? undefined : Cache,
        priority: 1,
        onCacheStart: () => {
            postMessage(clientId, "PAD_CACHE");
        },
        onCacheReady: () => {
            postMessage(clientId, "PAD_CACHE_READY");
            onCacheReadyEvt.fire();
        },
        onReady: pad => {
            const padData = pad.metadata || {};
            channel.data = padData;
            if (padData?.validateKey && store.messenger) {
                store.messenger.storeValidateKey(channelId, padData.validateKey);
            }
            postMessage(clientId, "PAD_READY", pad.noCache);
        },
        onMessage: function (m, user, validateKey, isCp, hash) {
            channel.lastHash = hash;
            channel.pushHistory(m, isCp);
            channel.bcast("PAD_MESSAGE", {
                user: user,
                msg: m,
                validateKey: validateKey
            });
        },
        onJoin: function (m) {
            channel.bcast("PAD_JOIN", m);
        },
        onLeave: function (m) {
            channel.bcast("PAD_LEAVE", m);
        },
        onError: onError,
        onChannelError: onError,
        onRejected: Store.onRejected,
        onConnectionChange: info => {
            if (!info.state) {
                channel.bcast("PAD_DISCONNECT");
            }
        },
        onMetadataUpdate: metadata => {
            channel.data = metadata || {};
            Store.getAllStores().forEach(s => {
                let allData = s.manager.findChannel(channelId, true);
                allData.forEach(obj => {
                    obj.data.owners = metadata.owners;
                    obj.data.atime = +new Date();
                    if (metadata.expire) {
                        obj.data.expire = +metadata.expire;
                    }
                });
                const send = s.sendEvent || store.sendDriveEvent;
                send('DRIVE_CHANGE', {
                    path: ['drive', UserObject.FILES_DATA]
                });
            });
            channel.bcast("PAD_METADATA", metadata);
        },
        crypto: {
            // Encryption and decryption is done in the outer window
            // Async-store only deals with encrypted messages
            encrypt: function (m) { return m; },
            decrypt: function (m) { return m; }
        },
        noChainPad: true,
        channel: channelId,
        metadata: data.metadata,
        network: store.network || store.networkPromise,
        websocketURL: NetConfig.getWebsocketURL(),
        onInit: function () {
            onJoinedEvt.fire();
        },
        //readOnly: data.readOnly,
        onConnect: (wc, sendMessage) => {
            channel.sendMessage = (msg, cId, cb) => {
                // Send to server
                sendMessage(msg, err => {
                    if (err) { return void cb({ error: err }); }
                    // Broadcast to other tabs
                    channel.lastHash = msg.slice(0,64);
                    channel.pushHistory(CpNetflux.removeCp(msg), /^cp\|/.test(msg));
                    channel.bcast("PAD_MESSAGE", {
                        user: wc.myID,
                        msg: CpNetflux.removeCp(msg),
                        validateKey: channel.data.validateKey
                    }, cId);
                    cb();
                });
            };
            channel.wc = wc;
            channel.queue.forEach(function (data) {
                channel.sendMessage(data.message, clientId);
            });
            channel.queue = [];
            channel.bcast("PAD_CONNECT", {
                myID: wc.myID,
                id: wc.id,
                members: wc.members
            });
        }
    };
    channel.cpNf = CpNetflux.start(conf);
};

// Send a message to a pad we already joined
const _sendMessage: Callback = (ctx, clientId, data, cb) => {
    var msg = data.msg;
    var channel = ctx.channels[data.channel];
    if (!channel) { return; }
    if (!channel.wc) {
        channel.queue.push(msg);
        return void cb();
    }
    channel.sendMessage(msg, clientId, cb);
};

const _onCorruptedCache: Callback = (ctx, clientId, channel) => {
    var chan = ctx.channels[channel];
    if (!chan || !chan.cpNf) { return; }
    Cache.clearChannel(channel);
    if (!chan.cpNf.resetCache) { return; }
    chan.cpNf.resetCache();
};

const _getLastHash: Callback = (ctx, clientId, data, cb) => {
    var chan = ctx.channels[data.channel];
    if (!chan) { return void cb({error: 'ENOCHAN'}); }
    if (!chan.lastHash) { return void cb({error: 'EINVAL'}); }
    cb({
        hash: chan.lastHash
    });
};

// clearOwnedChannel is only used for private chat and forms
const _clear: Callback = (ctx, clientId, data, cb) => {
    const { Store } = ctx;
    const s = Store.getStore(data && data.teamId);
    if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
    s.rpc.clearOwnedChannel(data.channel, err => {
        cb({error:err});
    });
};

const _destroy: Callback = (ctx, clientId, data, cb) => {
    const { store, Store, channels, myDeletions } = ctx;

    // "data" used to be a channelId, now it can also be an object
    // data.force tells us we can safely remove the drive ID
    let channel = data;
    let force = false;
    let teamId, reason;
    if (data && typeof(data) === "object") {
        ({ channel, force, teamId, reason } = data);
    }

    if (channel === store.driveChannel && !force) {
        return void cb({error: 'User drive removal blocked!'});
    }

    const s = Store.getStore(teamId);
    if (!s) { return void cb({ error: 'ENOTFOUND' }); }
    if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

    // If this channel is loaded, store that we deleted it ourselves
    if (channels[channel]) { myDeletions[channel] = true; }

    s.rpc.removeOwnedChannel(channel, err => {
        if (err) { delete myDeletions[channel]; }
        cb({error:err});
    }, reason);
};

const alwaysOnline = (ctx, chanId) => {
    const { store } = ctx;
    if (!store) { return false; }
    // Drive
    if (store.driveChannel === chanId) { return true; }
    // Shared folders
    if (SF.isSharedFolderChannel(chanId)) { return true; }
    // Teams
    if (Util.find(store, ['proxy', 'teams'])) {
        var t = Util.find(store, ['proxy', 'teams']) || {};
        return Object.keys(t).some(id => {
            return t[id].channel === chanId;
        });
    }
    // Profile
    if (Util.find(store, ['proxy', 'profile', 'href'])) {
        let href = Util.find(store, ['proxy', 'profile', 'href']);
        return Hash.hrefToHexChannelId(href) === chanId;
    }
};
const dropChannel = (ctx, chanId) => {
    const store = ctx.store;
    store.messenger?.leavePad?.(chanId);
    store.onlyoffice?.leavePad?.(chanId);
    Object.keys(store.modules).forEach(key => {
        store.modules[key]?.leavePad?.(chanId);
    });

    if (!alwaysOnline(ctx, chanId)) {
        try {
            Cache.leaveChannel(chanId);
        } catch (e) { console.error(e); }
        ctx.channels[chanId]?.cpNf?.stop();
    }
    delete ctx.channels[chanId];
};

const init = (config) => {
    const { broadcast, postMessage, store, Store } = config;

    /** XXX
     * Variables
     *  Store.channels, store.channels
     *  
     * Methods
     *  sendPadMsg, corruptedCache, getLastHash
     **/

    const ctx = {
        channels: [],
        postMessage,
        store,
        Store,
        myDeletions: [],
        leavePad: (clientId, data, cb) => {}
    };

    const join: RpcCall = (clientId, data, cb) => {
        _join(ctx, clientId, data, cb);
    };
    const destroy: RpcCall = (clientId, data, cb) => {
        _destroy(ctx, clientId, data, cb);
    };
    const clear: RpcCall = (clientId, data, cb) => {
        _clear(ctx, clientId, data, cb);
    };
    const setMetadata: RpcCall = (clientId, data, cb) => {
        _setMetadata(ctx, clientId, data, cb);
    };
    const getMetadata: RpcCall = (clientId, data, cb) => {
        _getMetadata(ctx, clientId, data, cb);
    };
    const sendMessage: RpcCall = (clientId, data, cb) => {
        _sendMessage(ctx, clientId, data, cb);
    };
    const onCorruptedCache: RpcCall = (clientId, data, cb) => {
        _onCorruptedCache(ctx, clientId, data, cb);
    };
    const getLastHash: RpcCall = (clientId, data, cb) => {
        _getLastHash(ctx, clientId, data, cb);
    };

    const removeClient = clientId => {
        Object.keys(ctx.channels).forEach(chanId => {
            let idx = ctx.channels[chanId].clients.indexOf(clientId);
            if (idx !== -1) {
                ctx.channels[chanId].clients.splice(idx, 1);
            }
            if (ctx.channels[chanId].clients.length === 0) {
                dropChannel(ctx, chanId);
            }
        });
    };
    const leave: RpcCall = (clientId, data, cb) => {
        const channel = ctx.channels[data.channel];
        if (!channel?.cpNf) { return void cb ({error: 'EINVAL'}); }
        dropChannel(ctx, data.channel);
        cb();
    };
    ctx.leavePad = leave;

    const getChannels = () => {
        return ctx.channels;
    };

    return {
        join,
        destroy,
        clear,
        setMetadata,
        getMetadata,
        sendMessage,
        onCorruptedCache,
        getLastHash,
        leave,
        removeClient,
        onJoined: onJoinedEvt.reg,
        onCacheReady: onCacheReadyEvt.reg,
        getChannels
    };
};

const Pad: Pad = {
    init: init
};

export { Pad }


