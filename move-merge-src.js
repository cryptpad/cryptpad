// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Move file from "src" to "www"
// This script can be used to copy src files into their old location in order to
// merge code more easily.
// Set REVERSE to true to copy from "www" to "src" once the changes have been merged.

const REVERSE = false;
const Fs = require('node:fs');
const map = {
    './src/worker/components/roster.js': './www/common/outer/roster.js',
    './src/worker/components/sharedfolder.js': './www/common/outer/sharedfolder.js',



    './src/common/cache-store.js': './www/common/outer/cache-store.js',
    './src/common/common-constants.js': './www/common/common-constants.js',
    './src/common/common-credential.js': './www/common/common-credential.js',
    './src/common/common-feedback.js': './www/common/common-feedback.js',
    './src/common/common-hash.js': './www/common/common-hash.js',
    './src/common/common-realtime.js': './www/common/common-realtime.js',
    './src/common/common-signing-keys.js': './www/common/common-signing-keys.js',
    './src/common/common-util.js': './www/common/common-util.js',
    './src/common/cryptget.js': './www/common/cryptget.js',
    './src/common/http-command.js': './www/common/outer/http-command.js',
    './src/common/login-block.js': './www/common/outer/login-block.js',
    './src/common/network-config.js': './www/common/outer/network-config.js',
    './src/common/notify.js': './www/common/notify.js',
    './src/common/onlyoffice/current-version.js': './www/common/onlyoffice/current-version.js',
    './src/common/pad-types.js': './www/common/pad-types.js',
    './src/common/pinpad.js': './www/common/pinpad.js',
    './src/common/proxy-manager.js': './www/common/proxy-manager.js',
    './src/common/recurrence.js': './www/calendar/recurrence.js',
    './src/common/rpc.js': './www/common/rpc.js',
    './src/common/user-object.js': './www/common/user-object.js',
    './src/common/user-object-setter.js': './www/common/user-object-setter.js',
    './src/common/worker-channel.js': './www/common/outer/worker-channel.js'
};

Object.keys(map).forEach(newPath => {
    let oldPath = map[newPath];
    if (!Fs.existsSync(newPath)) {
        throw new Error("File path mismatch: " + newPath);
    }
    if (!Fs.existsSync(oldPath)) {
        throw new Error("File path mismatch: " + oldPath);
    }
    const from = REVERSE ? oldPath : newPath;
    const to = REVERSE ? newPath : oldPath;
    Fs.cpSync(from, to);
});
