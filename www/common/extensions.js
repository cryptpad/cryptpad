// SPDX-FileCopyrightText: 2024 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'optional!/extensions.js'
], (Extensions) => {
    const ext = {};

    ext.getExtensions = id => {
        let e = ext[id];
        if (!Array.isArray(e)) { e = []; }
        return e.map(_ext => {
            return new Promise((resolve, reject) => {
                // If there's no check function, resolve immediately
                if (typeof _ext.check !== "function") {
                    return resolve(_ext);
                }
                const checkResult = _ext.check();

                checkResult
                    .then((extPassed) => {
                        if (!extPassed) {
                            // Reject if the check didn't pass
                            undefined (resolve());
                        } else {
                            // Extension passed the check
                            resolve(_ext);
                        }
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        });
    };

    ext.getExtensionsSync = id => {
        let e = ext[id];
        if (!Array.isArray(e)) { e = []; }

        return e.map(_ext => {
            if (typeof _ext.check !== "function") {
                return _ext;
            }

            const extPassed = _ext.check();

            if (extPassed) {
                return _ext;
            } else {
                return null;
            }
        }).filter(ext => ext !== null);
    };


    if (!Array.isArray(Extensions) || !Extensions.length) { return ext; }

    let all = Extensions.slice();
    while(all.length) {
        let current = all.splice(0, 3);

        let f = current[0];
        if (typeof(f) !== "function") {
            continue;
        }
        let defaultLang = current[1];
        let lang = current[2];
        if (!Object.keys(lang).length && Object.keys(defaultLang).length) {
            // If our language doesn't exists, use default
            lang = defaultLang;
        } else if (Object.keys(defaultLang).length) {
            // Otherwise fill our language with missing keys
            Object.keys(defaultLang).forEach(key => {
                if (typeof(lang[key]) !== "undefined") { return; }
                lang[key] = defaultLang[key];
            });
        }

        lang._getKey = function (key, argArray) {
            if (!lang[key]) { return '?'; }
            var text = lang[key];
            if (typeof(text) === 'string') {
                return text.replace(/\{(\d+)\}/g, function (str, p1) {
                    if (typeof(argArray[p1]) === 'string' || typeof(argArray[p1]) === "number") {
                        return argArray[p1];
                    }
                    return '';
                });
            } else {
                return text;
            }
        };

        let currentExt = f(lang) || {};

        Object.keys(currentExt).forEach(key => {
            ext[key] = ext[key] || [];
            Array.prototype.push.apply(ext[key], currentExt[key]); // concat in place
        });
    }

    return ext;
});
