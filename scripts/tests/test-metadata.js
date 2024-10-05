// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Store = require("../../lib/storage/file");
const Meta = require("../../lib/metadata");
const nThen = require('nthen');

let chanOld = '00000000000000000000000000000000';
let chanOldUpdated = '00000000000000000000000000000001';
let chanNew = '00000000000000000000000000000002';
let chanNewUpdated = '00000000000000000000000000000003';
let chanNoMeta = '00000000000000000000000000000004';

Store.create({
    filePath: './test-data/'
}, (err, store) => {
    if (err) { return void console.error(err); }

    const readMetadata = (channel, cb) => {
        const ref = {};
        const h = Meta.createLineHandler(ref, console.error);
        store.readChannelMetadata(channel, h, () => {
            cb(ref && ref.meta);
        });
    };

    nThen(w => {
        readMetadata(chanOld, w(meta => {
            if (!meta || meta.validateKey !== "TestKey") {
                console.log('OldChanNoUpdate', meta);
                throw new Error("Error with old channel without metadata update");
            }
        }));
        readMetadata(chanOldUpdated, w(meta => {
            if (!meta || meta.validateKey !== "TestKey" || !meta.restricted || !meta.allowed.includes('NewAllowedKeyNewAllowedKeyNewAllowedKeyNewAl')) {
                console.log('OldChanUpdate', meta);
                throw new Error("Error with old channel with metadata updates");
            }
        }));
        readMetadata(chanNew, w(meta => {
            if (!meta || meta.validateKey !== "TestKey") {
                console.log('NewChanNoUpdate', meta);
                throw new Error("Error with new channel without metadata update");
            }
        }));
        readMetadata(chanNewUpdated, w(meta => {
            if (!meta || meta.validateKey !== "TestKey" || !meta.restricted || !meta.allowed.includes('NewAllowedKeyNewAllowedKeyNewAllowedKeyNewAl')) {
                console.log('NewChanUpdate', meta);
                throw new Error("Error with new channel with metadata updates");
            }
        }));
        readMetadata(chanNoMeta, w(meta => {
            if (meta && Object.keys(meta).length) {
                console.log('NoMetadataChan', meta);
                throw new Error("Error with channel without metadata");
            }
        }));
    }).nThen(() => {
        console.log('Success');
        process.exit(1);
    });
});

