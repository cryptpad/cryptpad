// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
], function () {
    var S = {};

    S.create = function (sframeChan) {
        var getBlobCache = function (id, cb) {
            sframeChan.query('Q_GET_BLOB_CACHE', {id:id}, function (err, data) {
                var e = err || (data && data.error);
                if (e) { return void cb(e); }
                if (!data || typeof(data) !== "object") { return void cb('EINVAL'); }
                cb(null, data);
            }, { raw: true });
        };
        var setBlobCache = function (id, u8, cb) {
            sframeChan.query('Q_SET_BLOB_CACHE', {
                id: id,
                u8: u8
            }, function (err, data) {
                var e = err || (data && data.error) || undefined;
                cb(e);
            }, { raw: true });
        };


        return {
            getBlobCache: getBlobCache,
            setBlobCache: setBlobCache
        };
    };

    return S;
});

