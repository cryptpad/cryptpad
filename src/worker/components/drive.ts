import nacl from 'tweetnacl/nacl-fast';
import { Drive } from '../types'

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

const init = (config) => {
    const { broadcast } = config;
    const store = config.store;

    const drive = store.drive = store.drive || {};
    let data = store.proxy?.drive;

    const hash:string = data.hash || Hash.createRandomHash('drive');

    // Update loading screen status
    const updateProgress = function (data) {
        // XXX
        /*
        data.type = 'drive';
        broadcast([], 'LOADING_DRIVE', data);
        */
    };

    // XXX remove and migrate instead
    if (!data.hash) {
        drive.proxy = data;
        setTimeout(() => {
            onCacheReadyEvt.fire();
            setTimeout(() => {
                onReadyEvt.fire();
            });
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
        broadcast([], "UPDATE_METADATA"); // XXX ?
    }).on('reconnect', function () {
        drive.offline = false;
        onReconnectEvt.fire();
        broadcast([], "UPDATE_METADATA"); // XXX ?
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
    init: init,
};

export { Drive }

