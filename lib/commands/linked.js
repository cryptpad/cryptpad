// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Linked = module.exports;

const nThen = require("nthen");
//const Core = require("./core");
const CPCrypto = require('../crypto');
const Util = require("../common-util");
const MetaRPC = require("./metadata");

const getMetadata = (Env, channel, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));

    const metadata = Env.metadata_cache[channel];
    if (metadata && typeof(metadata) === 'object') {
        return void cb(undefined, metadata);
    }

    MetaRPC.getMetadataRaw(Env, channel, (err, metadata) => {
        if (err) { return void cb(err); }
        if (metadata?.channel !== channel) {
            return cb();
        }

        // cache it
        Env.metadata_cache[channel] = metadata;
        cb(undefined, metadata);
    });
};

const allowedTypes = ['checkpoints', 'media', 'channels'];

// XXX add logs

Linked.getLinkedDocuments = (Env, data, cb) => {
    Env.store.getLinkedDocuments(data.channel, (err, json) => {
        if (err && err !== 'ENOENT') { return void cb(err?.message); }
        cb(void 0, json || {});
    });
};

Linked.listLinkedDocuments = (Env, channel, cb) => {
    const list = new Set();
    Linked.getLinkedDocuments(Env, { channel }, (err, json) => {
        if (err) { return void cb(err); }
        // For each type, add the channels and/or blobs
        allowedTypes.forEach(type => {
            const data = json[type];
            if (!data) { return; }
            // Media or channel:
            if (type !== 'checkpoint') { return void list.add(data); }
            // Checkpoint:
            if (data?.rtChannel) { list.add(rtChannel); }
            if (data?.blob) { list.add(blob); }
        });
        cb(void 0, Array.from(list));
    });
};


const checkContent = (content, user) => {
    const { type, data } = content;

    if (type === 'checkpoints' && data) {
        const { rtChannel, blob } = data;
        if (rtChannel?.length !== 32 || blob?.length !== 48) {
            return false;
        }
        return {
            rtChannel, blob, user,
            time: Date.now()
        };
    }

    if (type === 'media') {
        return data?.length === 48 ? data : false;
    }

    if (type === 'channels') {
        return data?.length === 32 ? data : false;
    }

    return false;
};

Linked.addLinkedDocument = (Env, data, cb, _S, userId) => {
    // data.user
    // data.channel
    // data.content
    //    type, data (channelId or blobId or checkpoint {blob, rtChannel}})
    // data.proof
    //    (sign "{ user, channel, content }" with pad signing key

    const { user, channel, content, netfluxId, proof } = data;
    if (userId !== netfluxId) { return void cb('EFORBIDDEN'); }

    const msg = Util.clone(data);
    delete msg.proof;
    const signedMsg = JSON.stringify(msg);

    const type = content?.type;

    if (!allowedTypes.includes(type)) {
        return void cb('INVALID_TYPE');
    }

    const value = checkContent(content, user);
    if (!value) { return void cb('INVALID_CONTENT'); }

    let validateKey;

    nThen(waitFor => {
        getMetadata(Env, channel, waitFor((err, metadata) => {
            if (!metadata.validateKey) {
                waitFor.abort();
                return void cb(err || 'METADATA_ERROR');
            }
            validateKey = metadata.validateKey;
        }));
    }).nThen(waitFor => {
        Env.checkSignature(signedMsg, proof, validateKey, waitFor((err)=> {
            if (err) {
                waitFor.abort();
                return void cb('INVALID_PROOF');
            }
        }));
    }).nThen(() => {
        Env.store.addLinkedDocument(channel, type, value, cb);
    });
};

Linked.resetLinkedDocuments = (Env, data, cb, _S, userId) => {
    // data.user
    // data.channel
    // data.content
    // data.proof
    //    (sign "{ user, channel, content }" with pad signing key

    const { user, channel, content, netfluxId, proof } = data;

    if (userId !== netfluxId) { return void cb('EFORBIDDEN'); }

    const msg = Util.clone(data);
    delete msg.proof;
    const signedMsg = JSON.stringify(msg);

    let validateKey;
    const newContent = {};
    allowedTypes.forEach(type => { newContent[type] = []; });

    nThen(waitFor => {
        getMetadata(Env, channel, waitFor((err, metadata) => {
            if (!metadata.validateKey) {
                waitFor.abort();
                return void cb(err || 'METADATA_ERROR');
            }
            validateKey = metadata.validateKey;
        }));
    }).nThen(waitFor => {
        Env.checkSignature(signedMsg, proof, validateKey, waitFor((err)=> {
            if (err) {
                waitFor.abort();
                return void cb('INVALID_PROOF');
            }
        }));
    }).nThen(waitFor => {
        Linked.getLinkedDocuments(Env, { channel }, waitFor((err, json = {}) => {
            // checkpoints
            if (Array.isArray(content?.checkpoints)) {
                const old = json?.checkpoints || [];
                // add last 10 valid checkpoints
                let i = 0;
                content.checkpoints.reverse().some(data => {
                    // If cp already exists, recover user and time
                    // Otherwise, check integrity of new value and add them now
                    const oldValue = old.find(obj => {
                        return obj.blob === data.blob &&
                               obj.rtChannel === data.rtChannel;
                    });
                    const toAdd = oldValue || checkContent({
                        type: 'checkpoints',
                        data
                    }, user);
                    if (!toAdd) { return false; }
                    newContent.checkpoints.unshift(toAdd);

                    // Abort after 10 cps
                    if (++i >= 10) { return true; }
                });
            }

            // channels and media
            ['channels', 'media'].forEach(type => {
                if (!Array.isArray(content?.[type])) { return; }
                const old = json?.[type] || [];
                content[type].forEach(data => {
                    const toAdd = checkContent({type, data}, user);
                    if (!toAdd) { return false; }
                    newContent[type].push(toAdd);
                });
            });
        }));
    }).nThen(() => {
        Env.store.resetLinkedDocuments(channel, newContent, (err, data) => {
            const { oldContent } = data;
            Env.Log.info('RESET_LINKED_DOCUMENTS', {user, channel, oldContent, content});
        });
    });
};

Linked.removeLinkedDocument = (Env, allData, cb, _S, userId) => {
    // data.user
    // data.channel
    // data.content
    //    type, channelId or blobId
    // data.proof
    //    (sign "{ user, channel, content }" with pad signing key

    const { user, channel, content, netfluxId, proof } = allData;

    if (userId !== netfluxId) { return void cb('EFORBIDDEN'); }

    const msg = Util.clone(data);
    delete msg.proof;
    const signedMsg = JSON.stringify(msg);

    const { type, data } = content;

    if (!allowedTypes.includes(type)) {
        return void cb('INVALID_TYPE');
    }

    if (typeof(data) !== "string" || ![32,48].includes(data.length)) {
        return void cb('INVALID_CONTENT');
    }

    let validateKey;
    nThen(waitFor => {
        getMetadata(Env, channel, waitFor((err, metadata) => {
            if (!metadata.validateKey) {
                waitFor.abort();
                return void cb(err || 'METADATA_ERROR');
            }
            validateKey = metadata.validateKey;
        }));
    }).nThen(waitFor => {
        Env.checkSignature(signedMsg, proof, validateKey, waitFor((err)=> {
            if (err) {
                waitFor.abort();
                return void cb('INVALID_PROOF');
            }
        }));
    }).nThen(() => {
        Env.store.removeLinkedDocument(channel, type, data, cb);
    });

};
