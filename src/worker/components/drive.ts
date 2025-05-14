// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import nacl from 'tweetnacl/nacl-fast';
import { Drive } from '../types';
import * as Merge from './merge-drive';

// node modules
import * as Listmap from 'chainpad-listmap';
import * as ChainPad from 'chainpad';
import * as Crypto from 'chainpad-crypto';
// custom modules
import * as NetConfig from '../../common/network-config.js';
import * as Constants from '../../common/common-constants.js';
import * as Hash from '../../common/common-hash.js';
import * as Util from '../../common/common-util.js';
import * as Cache from '../../common/cache-store.js';

const onCacheReadyEvt: any = Util.mkEvent(true);
const onReadyEvt: any = Util.mkEvent(true);
const onDisconnectEvt: any = Util.mkEvent();
const onReconnectEvt: any = Util.mkEvent();

const copyObject = (src, target) => {
    Object.keys(src).forEach(k => {
        delete src[k];
    });
    Object.keys(target).forEach(k => {
        src[k] = Util.clone(target[k]);
    });
};
const getProxy = (ctx, teamId) => {
    const store = ctx.store;
    const Store = ctx.Store;
    let proxy;
    if (!teamId) {
        proxy = store.drive?.proxy;
    } else {
        const s = Store.getStore(teamId);
        proxy = s?.proxy?.drive;
    }
    return proxy;
};

const initAPI = (config) => {
    const { broadcast, store, Store, account } = config;
    const ctx = {
        store,
        Store
    };

    return {
        exists: (clientId, data, cb) => {
            cb({ state: Boolean(store.proxy) });
        },
        get: (clientId, data, cb) => {
            let proxy = getProxy(ctx, data.teamId);
            if (!proxy) { return void cb({error: 'ENOTFOUND'}); }
            cb({drive: proxy});
        },
        set: (clientId, data, cb) => {
            let proxy = getProxy(ctx, data.teamId);
            if (!proxy) { return void cb({error: 'ENOTFOUND'}); }
            copyObject(proxy, data.value);
            Store.onSync(data.teamId, cb);
        },
        migrateAnon: (clientId, data, cb) => {
            Merge.anonDriveIntoUser(store, data.anonHash, cb);
        }
    };

};
const init = (config) => {
    const { broadcast, store, Store, account } = config;

    const drive = store.drive ||= {};
    let data = store.proxy?.drive;

    const hash:string = data?.hash || Hash.createRandomHash('drive');

    // Update loading screen status
    const updateProgress = function (data) {
        /*
        data.type = 'drive';
        broadcast([], 'LOADING_DRIVE', data);
        */
    };

    // XXX remove and migrate instead
    if (!data.hash) {
        drive.proxy = data;
        account.onAccountCacheReady(() => {
            onCacheReadyEvt.fire();
        });
        account.onAccountReady(() => {
            onReadyEvt.fire();
        });
        return {
            channel: '',
            onDriveCacheReady: onCacheReadyEvt.reg,
            onDriveReady: onReadyEvt.reg,
            onDisconnect: onDisconnectEvt.reg,
            onReconnect: onReconnectEvt.reg
        };
    }

    throw new Error('NOT IMPLEMENTED');

    // Create account secret from hash
    const secret = Hash.getSecrets('drive', hash);

    // Load proxy
    const listmapConfig = {
        data: {},
        websocketURL: NetConfig.getWebsocketURL(),
        network: config.store?.network,
        channel: secret.channel,
        readOnly: false,
        validateKey: secret.keys?.validateKey || undefined,
        crypto: Crypto.createEncryptor(secret.keys),
        Cache: Cache,
        userName: 'fs',
        logLevel: 1,
        ChainPad: ChainPad,
        updateProgress: updateProgress,
        classic: true,
    };
    const rt = globalThis.CP_drive_rt = Listmap.create(listmapConfig);

    drive.secret = secret;
    drive.proxy = rt.proxy;

    rt.proxy.on('create', function (info) {
        drive.realtime = info.realtime;
    }).on('cacheready', function (info) {
        if (!config.cache) { return; }
        onCacheReadyEvt.fire();
    }).on('ready', function (info) {
        onReadyEvt.fire();
    }).on('error', function (info) {
        if (info.error !== 'EDELETED') { return; }
        drive.isDeleted = true;
        broadcast([], "DRIVE_DELETED", info.message);
    }).on('disconnect', function () {
        drive.offline = true;
        onDisconnectEvt.fire();
        broadcast([], "UPDATE_METADATA");
    }).on('reconnect', function () {
        drive.offline = false;
        onReconnectEvt.fire();
        broadcast([], "UPDATE_METADATA");
    });

    return {
        channel: secret.channel,
        onDriveCacheReady: onCacheReadyEvt.reg,
        onDriveReady: onReadyEvt.reg,
        onDisconnect: onDisconnectEvt.reg,
        onReconnect: onReconnectEvt.reg
    };
};

const Drive: Drive = {
    init,
    initAPI
};

export { Drive }

