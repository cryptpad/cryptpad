// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = (nThen, Util, ApiConfig = {}, Nacl) => {

    const getApiOrigin = function () {
        if (!Object.keys(ApiConfig).length) { return; }
        var url;
        var unsafeOriginURL = new URL(ApiConfig.httpUnsafeOrigin);
        try {
            url = new URL(ApiConfig.websocketPath, ApiConfig.httpUnsafeOrigin);
            url.protocol = unsafeOriginURL.protocol;
            return url.origin;
        } catch (err) {
            console.error(err);
            return ApiConfig.httpUnsafeOrigin;
        }
    };
    var API_ORIGIN = getApiOrigin();

    const setCustomize = data => {
        ApiConfig = data.ApiConfig;
        API_ORIGIN = getApiOrigin();
    };

    var clone = o => JSON.parse(JSON.stringify(o));
    var randomToken = () => Util.encodeBase64(Nacl.randomBytes(24));
    var postData = function (url, data, cb) {
        var CB = Util.once(Util.mkAsync(cb));
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then(response => {
            if (response.ok) {

                return void response.text().then(result => { CB(void 0, Util.tryParse(result)); }); // checkup error when using .json()
                //return void response.json().then(result => { CB(void 0, result); });
            }

            response.json().then().then(result => {
                CB(response.status, result);
            });
            //CB(response.status, response);
        }).catch(error => {
            CB(error);
        });
    };

    var serverCommand = function (keypair, my_data, cb) {
        var obj = clone(my_data);
        obj.publicKey = Util.encodeBase64(keypair.publicKey);
        obj.nonce = randomToken();
        var href = new URL('/api/auth/', API_ORIGIN);
        var txid, date;
        nThen(function (w) {
            // Tell the server we want to do some action
            postData(href, obj, w((err, data) => {
                if (err) {
                    w.abort();
                    console.error(err);
                    // there might be more info here
                    if (data) { console.error(data); }
                    return void cb(err);
                }

                // if the requested action is valid, it responds with a txid and a nonce
                // bundle all that up into an object, stringify it, and sign it.
                // respond with an object: {sig, txid}
                if (!data.date || !data.txid) {
                    w.abort();
                    return void cb('REQUEST_REJECTED');
                }
                txid = data.txid;
                date = data.date;
            }));
        }).nThen(function (w) {
            var copy = clone(obj);
            copy.txid = txid;
            copy.date = date;
            var toSign = Util.decodeUTF8(JSON.stringify(copy));
            var sig = Nacl.sign.detached(toSign, keypair.secretKey);
            var encoded = Util.encodeBase64(sig);
            var obj2 = {
                sig: encoded,
                txid: txid,
            };
            postData(href, obj2, w((err, data) => {
                if (err) {
                    w.abort();
                    console.error(err);
                    // there might be more info here
                    if (data) { console.error(data); }
                    return void cb("RESPONSE_REJECTED", data);
                }
                cb(void 0, data);
            }));
        });
    };

    serverCommand.setCustomize = setCustomize;

    return serverCommand;
};

if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = factory(
        require('nthen'),
        require('../common-util'),
        undefined,
        require('tweetnacl/nacl-fast')
    );
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([
        '/components/nthen/index.js',
        '/common/common-util.js',
        '/api/config',
        '/components/tweetnacl/nacl-fast.min.js',
    ], (nThen, Util, ApiConfig) => {
        return factory(nThen, Util, ApiConfig, window.nacl);
    });
} else {
    // unsupported initialization
}

})();
