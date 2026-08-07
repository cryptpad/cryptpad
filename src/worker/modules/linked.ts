// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import nacl from 'tweetnacl/nacl-fast';
import nThen from 'nthen';
import { Module, ModuleObject, Command } from '../types'
import * as Util from '../../common/common-util.js';

export interface LinkedDocModule<T> extends Module<T> {
    setCustomize: (data: any) => void
}

let ApiConfig:any = {};

const getLinkedDocuments = (ctx, channel, cb) => {
    ctx.Store.anonRpcMsg('', {
        msg: 'GET_LINKED_DOCUMENTS',
        data: { channel }
    }, cb);
};
const resetLinkedDocuments = (ctx, data, cb) => {
    ctx.Store.anonRpcMsg('', {
        msg: 'RESET_LINKED_DOCUMENTS',
        data // { channel, user, content, netfluxId, proof }
    }, cb);
};
const addLinkedDocument = (ctx, data, cb) => {
    ctx.Store.anonRpcMsg('', {
        msg: 'ADD_LINKED_DOCUMENT',
        data // { channel, user, content, netfluxId, proof }
    }, cb);
};

const signData = (data, signKey) => {
    try {
        const edPrivate = Util.decodeBase64(signKey); // pad signing key
        const msg = Util.decodeUTF8(JSON.stringify(data));
        data.proof = Util.encodeBase64(nacl.sign.detached(msg, edPrivate));
        return data;
    } catch (e) {
        return false;
    }
};

// TODO
/*
  - one RPC to add or remove multiple elements?
  - add a single element (checkpoint or image?)
  - remove single?


*/

const getLinkedData:Command = (ctx, data, clientId, cb) => {
    const { channel } = data;
    getLinkedDocuments(ctx, channel, obj => {
        if (obj?.error) { return void cb(obj); }
        const json = obj?.[0] || {};
        cb(json);
    });
};


const checkCurrentDoc:Command = (ctx, data, clientId, cb) => {
    const { channel, expectedJSON, signKey64 } = data;

    const missing = {};
    getLinkedDocuments(ctx, channel, (obj) => {
        const json = obj?.[0] || {};

        json?.checkpoints?.forEach(obj => {
            delete obj.time;
            delete obj.user;
        });

        expectedJSON.media ||= [];
        expectedJSON.checkpoints ||= [];
        expectedJSON.channels ||= [];

        if (Util.sortify(json) === Util.sortify(expectedJSON)) { return void cb(); }

        // "user" won't be encrypted so we can't add the username
        const user = ctx.store.proxy.edPublic || 'GUEST';
        // Add netfluxId to guard against replay attacks
        const netfluxId = ctx.store.network?.webChannels?.[0]?.myID;

        const toSend = signData({
            user, channel, netfluxId,
            content: expectedJSON
        }, signKey64);

        if (!toSend) {
            return void cb({error: 'SIGN_ERROR'});
        }

        resetLinkedDocuments(ctx, toSend, cb);
    });
};

const addLinkedData:Command = (ctx, data, clientId, cb) => {
    const { channel, content, signKey64 } = data;

    // content.type, content.data

    // "user" won't be encrypted so we can't add the username
    const user = ctx.store.proxy.edPublic || 'GUEST';
    // Add netfluxId to guard against replay attacks
    const netfluxId = ctx.store.network?.webChannels?.[0]?.myID;

    const toSend = signData({
        user, channel, netfluxId, content
    }, signKey64);

    if (!toSend) {
        return void cb({error: 'SIGN_ERROR'});
    }

    addLinkedDocument(ctx, toSend, cb);
};

const LinkedDoc: LinkedDocModule<ModuleObject> = {

    init: (config, cb, emit) => {

        const ctx:any = {
            store: config.store,
            Store: config.Store
            //updateMetadata: config.updateMetadata
        };

        return {
            removeClient: () => {},
            execCommand: (clientId, obj, cb) => {
                if (!ctx.store?.network?.webChannels.length ||
                    !ctx.store?.ready) {
                    return void cb({error: 'OFFLINE'});
                }
                const cmd = obj.cmd;
                const data = obj.data;
                if (cmd === 'CHECK_CURRENT_DOC') {
                    return void checkCurrentDoc(ctx, data, clientId, cb);
                }
                if (cmd === 'GET_LINKED_DATA') {
                    return void getLinkedData(ctx, data, clientId, cb);
                }
                if (cmd === 'ADD_LINKED_DATA') {
                    return void addLinkedData(ctx, data, clientId, cb);
                }
                cb();
            },
        }
    },
    setCustomize: data => {
        ApiConfig = data?.ApiConfig;
    }

};

export { LinkedDoc }
