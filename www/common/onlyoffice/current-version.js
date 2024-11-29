// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = () => {
    return {
        currentVersion: 'v7'
    };
};

if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = factory();
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([], factory);
}
})();
