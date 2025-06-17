// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import nacl from 'tweetnacl/nacl-fast';
import { Account } from '../types'

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

let ApiConfig:any = {};
const init = (config) => {
    const { broadcast, userHash, anonHash } = config;
    const hash:string = userHash || anonHash || Hash.createRandomHash('drive');
    const store = config.store;

    // Update loading screen status
    const updateProgress = function (data) {
        data.type = 'drive';
        broadcast([], 'LOADING_DRIVE', data);
    };

    // Create account secret from hash
    const secret = Hash.getSecrets('drive', hash);

    const network = config.store?.network ||
                    config.store?.networkPromise;
    const listmapConfig = {
        data: {},
        websocketURL: NetConfig.getWebsocketURL(),
        network: network,
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
    const rt = globalThis.CP_account_rt = Listmap.create(listmapConfig);

    store.driveSecret = secret;
    store.proxy = rt.proxy;
    store.onRpcReadyEvt = Util.mkEvent(true);
    store.loggedIn = typeof(config.userHash) !== "undefined";

    const returned:any = {
        loggedIn: store.loggedIn
    };

    rt.proxy.on('create', function (info) {
        store.realtime = info.realtime;
        store.network = info.network; // init if not exists
        if (!store.loggedIn) {
            returned.anonHash = Hash.getEditHashFromKeys(secret);
        }
    }).on('cacheready', function (info) {
        store.realtime = info.realtime;
        store.offline = true;
        const hadPromise = !!store.networkPromise;
        store.networkPromise ||= info.networkPromise;
        store.cacheReturned = returned;

        // Show error if we can't connect, but only if the accounts
        // was required first
        if (store.networkPromise && store.networkPromise.then
                && !hadPromise) {
            // Check if we can connect
            const to = setTimeout(function () {
                store.networkTimeout = true;
                broadcast([], "LOADING_DRIVE", {
                    type: "offline"
                });
            }, 5000);

            store.networkPromise.then(function (network) {
                store.network ||= network;
                clearTimeout(to);
            }, function (err) {
                console.error(err);
                clearTimeout(to);
            });
        }

        if (!config.cache) { return; }

        returned.edPublic = rt.proxy.edPublic;

        onCacheReadyEvt.fire(returned);
    }).on('ready', function (info) {
        delete store.networkTimeout;
        if (store.ready) { return; } // the store is already ready, it is a reconnection

        store.driveMetadata = info.metadata;

        // New drive? create empty object
        if (!rt.proxy.drive) { rt.proxy.drive = {}; }

        // New drive: recover data from noDrive session
        if (!rt.proxy[Constants.displayNameKey] && store.noDriveName) {
            rt.proxy[Constants.displayNameKey] = store.noDriveName;
        }
        if (!rt.proxy.uid && store.noDriveUid) {
            rt.proxy.uid = store.noDriveUid;
        }
        if (!rt.proxy.form_seed && config.form_seed) {
            rt.proxy.form_seed = config.form_seed;
        }

        // Are we an admin?
        if (rt.proxy.edPublic && Array.isArray(ApiConfig.adminKeys) &&
            ApiConfig.adminKeys.indexOf(rt.proxy.edPublic) !== -1) {
            store.isAdmin = true;
        }

        returned.edPublic = rt.proxy.edPublic;

        onReadyEvt.fire(returned);
    }).on('error', function (info) {
        if (info.error !== 'EDELETED') { return; }
        if (store.ownDeletion) { return; }
        store.isDeleted = true;
        broadcast([], "DRIVE_DELETED", info.message);
    }).on('disconnect', function () {
        store.offline = true;
        onDisconnectEvt.fire();
        broadcast([], "UPDATE_METADATA");
    }).on('reconnect', function () {
        store.offline = false;
        onReconnectEvt.fire();
        broadcast([], "UPDATE_METADATA");
    });

    return {
        channel: secret.channel,
        onAccountCacheReady: onCacheReadyEvt.reg,
        onAccountReady: onReadyEvt.reg,
        onDisconnect: onDisconnectEvt.reg,
        onReconnect: onReconnectEvt.reg
    };
};

const Account: Account = {

    setCustomize: (data) => {
        ApiConfig = data.ApiConfig;
    },
    init: init
};

export { Account }


