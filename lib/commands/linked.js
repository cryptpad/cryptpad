// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Linked = module.exports;

const nThen = require("nthen");
//const Core = require("./core");
//const CPCrypto = require('../crypto');
const Util = require("../common-util");
const MetaRPC = require("./metadata");
const HK = require("../hk-util");

const getMetadata = (Env, channel, _cb) => {
    const cb = Util.once(Util.mkAsync(_cb));

    const metadata = Env.metadata_cache[channel];
    if (metadata && typeof(metadata) === 'object') {
        return void cb(undefined, metadata);
    }

    MetaRPC.getMetadataRaw(Env, channel, (err, metadata) => {
        if (err) { return void cb(err); }
        if (metadata?.channel !== channel && channel.length !== HK.BLOB_ID_LENGTH) {
            return cb();
        }

        // cache it
        if (channel.length !== HK.BLOB_ID_LENGTH) {
            Env.metadata_cache[channel] = metadata;
        }
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

Linked.listLinkedDocuments = (Env, channel, _cb) => {
    const cb = Util.mkAsync(_cb);
    if (channel.length !== HK.STANDARD_CHANNEL_LENGTH) {
        return void cb(void 0, []);
    }

    const list = new Set();
    Linked.getLinkedDocuments(Env, { channel }, (err, json) => {
        if (err) { return void cb(err); }
        // For each type, add the channels and/or blobs
        allowedTypes.forEach(type => {
            const data = json[type];
            if (!Array.isArray(data)) { return; }
            // Media or channel:
            if (type !== 'checkpoints') {
                data.forEach(id => { list.add(id); });
                return;
            }
            // Checkpoint:
            data.forEach(obj => {
                if (obj?.rtChannel) { list.add(obj.rtChannel); }
                if (obj?.blob) { list.add(obj.blob); }
            });
        });
        cb(void 0, Array.from(list));
    });
};

Linked.listOldCheckpoints = (Env, channel, cb) => {
    const list = new Set();
    Linked.getLinkedDocuments(Env, { channel }, (err, json) => {
        if (err) { return void cb(err); }

        const cps = json.checkpoints || [];
        cps.pop(); // preserve last cp

        cps.forEach(obj => {
            if (obj?.rtChannel) { list.add(obj.rtChannel); }
            if (obj?.blob) { list.add(obj.blob); }
        });

        cb(void 0, Array.from(list));
    });
};


const checkContent = (content, user) => {
    const { type, data } = content;

    if (type === 'checkpoints' && data) {
        const { rtChannel, blob } = data;
        if (rtChannel?.length !== 32 || (blob && blob?.length !== 48)) {
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
            cb();
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

    const { channel, content, netfluxId, proof } = allData;

    if (userId !== netfluxId) { return void cb('EFORBIDDEN'); }

    const { type, data } = content;

    const msg = Util.clone(data);
    delete msg.proof;
    const signedMsg = JSON.stringify(msg);

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

Linked.getFileSize = (Env, data, _cb) => {
    const cb = Util.once(_cb);
    const channel = data.channel;
    let linked;
    nThen(waitFor => {
        Linked.listLinkedDocuments(Env, channel, waitFor((err, channels) => {
            if (err) {
                waitFor.abort();
                return void cb(err);
            }
            linked = channels || [];
        }));
    }).nThen(() => {
        linked.push(channel);
        Env.getTotalSize(linked, cb);
    });
};

Linked.getHistorySize = (Env, data, _cb) => {
    const cb = Util.once(_cb);
    const channel = data.channel;
    let linked;
    let channelTotalSize = 0;
    let size = 0;
    let start = 0;
    let hash;

    nThen(waitFor => {
        Linked.getLinkedDocuments(Env, data, waitFor((err, json) => {
            if (err) {
                waitFor.abort();
                return void cb(err);
            }
            linked = Util.clone(json);
        }));
    }).nThen(waitFor => {
        // Get main channel size (chainpad)
        Env.getFileSize(channel, waitFor((err, _size) => {
            if (err) {
                waitFor.abort();
                return void cb(err);
            }
            channelTotalSize = _size;
        }), true);
    }).nThen(waitFor => {
        // Get history offset to compute non-history size
        HK.getHistoryOffset(Env, channel, null, waitFor((err, offset) => {
            if (err) {
                waitFor.abort();
                return void cb(err);
            }
            start = offset;
            const chanSize = channelTotalSize - offset;
            size += chanSize;
        }));
    }).nThen(waitFor => {
        // Get oldest hash of non-history data
        Env.store.readMessagesBin(channel, start, (msgObj, readMore, abort) => {
            const parsed = Util.tryParse(msgObj.buff.toString('utf8'));
            if (!parsed) { return void readMore(); }
            hash = HK.getHash(parsed[4]);
            abort();
        }, waitFor());

    }).nThen(waitFor => {
        // Get last checkpoint size (blob + rtChannel)
        // Note: blob may be falsy if no checkpoint

        const lastCp = (linked?.checkpoints || []).pop();
        if (!lastCp) { return; }
        const { blob, rtChannel } = lastCp;

        if (blob) {
            Env.getFileSize(blob, waitFor((err, _size) => {
                if (err) {
                    waitFor.abort();
                    return void cb(err);
                }
                size += _size;
            }), true);
        }

        Env.getFileSize(rtChannel, waitFor((err, _size) => {
            if (err) {
                waitFor.abort();
                return void cb(err);
            }
            size += _size;
        }), true);
    }).nThen(() => {
        cb(void 0, {
            size, hash
        });
    });
};

Linked.trimHistory = (Env, data, cb) => {
    const channel = data.channel;
    let linked;
    // if we reach this step, it means this user is an owner of "channel"
    // so we can also delete any document linked to "channel" (from metadata)
    nThen(waitFor => {
        // List all but the current checkpoints
        Linked.listOldCheckpoints(Env, channel, waitFor((err, channels) => {
            if (err) {
                waitFor.abort();
                return void cb(err);
            }
            linked = channels || [];
        }));
    }).nThen(() => {
        let n = nThen;
        linked.forEach(chan => {
            n = n(w => {
                // If channel is "linked", we can archive all but last cp
                getMetadata(Env, chan, w((err, md) => {
                    if (md?.linked !== channel) { return; }
                    // This is an old checkpoint linked to our document,
                    // we can archive it
                    const reason = "TRIM_HISTORY";
                    if (chan.length === HK.BLOB_ID_LENGTH) {
                        return Env.blobStore.archive.blob(chan, reason, w());
                    }
                    Env.store.archiveChannel(chan, reason, w());
                }));
            }).nThen;
        });
        n(() => {
            cb();
        });
    });
};

// Archive all linked documents that inherit metadata from their
// parent. We consider ownership has already been checked when
// this function is called.
Linked.archiveLinkedData = (Env, channel, reason, channels, _cb) => {
    const cb = Util.once(_cb);
    let n = nThen;
    channels.forEach(chan => {
        n = n(w => {
            // For each linked document, check if they inherit properties
            getMetadata(Env, chan, w((err, md) => {
                if (md?.linked !== channel) { return; }
                // If they do, archive the document
                if (chan.length === HK.BLOB_ID_LENGTH) {
                    return Env.blobStore.archive.blob(chan, reason, w());
                }
                Env.store.archiveChannel(chan, reason, w());
            }));
        }).nThen;
    });
    n(() => {
        cb();
    });
};
