// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Some .activity file were created for deleted blob due to a bug.
 * This script can be run once to remove these invalid activity file.
**/
var config = require("../lib/load-config");
var BlobStore = require("../lib/storage/blob");

config.getSession = function () {};
BlobStore.create(config, function (err, store) {
    if (err) { return console.error('ERROR', err); }
    console.log('Cleaning lone .activity files...');
    store.remove.loneActivity(function (err) {
        if (err) { return console.error('ERROR', err); }
        console.log('Done');
    });
});
