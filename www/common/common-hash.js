define([
    '/common/common-util.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/tweetnacl/nacl-fast.min.js'
], function (Util, Crypto) {
    var Nacl = window.nacl;

    var Hash = {};

    var uint8ArrayToHex = Util.uint8ArrayToHex;
    var hexToBase64 = Util.hexToBase64;
    var base64ToHex = Util.base64ToHex;

    // This implementation must match that on the server
    // it's used for a checksum
    Hash.hashChannelList = function (list) {
        return Nacl.util.encodeBase64(Nacl.hash(Nacl.util
            .decodeUTF8(JSON.stringify(list))));
    };

    var getEditHashFromKeys = Hash.getEditHashFromKeys = function (chanKey, keys) {
        if (typeof keys === 'string') {
            return chanKey + keys;
        }
        if (!keys.editKeyStr) { return; }
        return '/1/edit/' + hexToBase64(chanKey) + '/'+Crypto.b64RemoveSlashes(keys.editKeyStr)+'/';
    };
    var getViewHashFromKeys = Hash.getViewHashFromKeys = function (chanKey, keys) {
        if (typeof keys === 'string') {
            return;
        }
        return '/1/view/' + hexToBase64(chanKey) + '/'+Crypto.b64RemoveSlashes(keys.viewKeyStr)+'/';
    };
    var getFileHashFromKeys = Hash.getFileHashFromKeys = function (fileKey, cryptKey) {
        return '/2/' + hexToBase64(fileKey) + '/' + Crypto.b64RemoveSlashes(cryptKey) + '/';
    };

    var parsePadUrl = Hash.parsePadUrl = function (href) {
        var patt = /^https*:\/\/([^\/]*)\/(.*?)\//i;

        var ret = {};

        if (!href) { return ret; }

        if (!/^https*:\/\//.test(href)) {
            var idx = href.indexOf('/#');
            ret.type = href.slice(1, idx);
            ret.hash = href.slice(idx + 2);
            return ret;
        }

        var hash = href.replace(patt, function (a, domain, type) {
            ret.domain = domain;
            ret.type = type;
            return '';
        });
        ret.hash = hash.replace(/#/g, '');
        return ret;
    };

    var getRelativeHref = Hash.getRelativeHref = function (href) {
        if (!href) { return; }
        if (href.indexOf('#') === -1) { return; }
        var parsed = parsePadUrl(href);
        return '/' + parsed.type + '/#' + parsed.hash;
    };

    /*
     * Returns all needed keys for a realtime channel
     * - no argument: use the URL hash or create one if it doesn't exist
     * - secretHash provided: use secretHash to find the keys
     */
    Hash.getSecrets = function (secretHash) {
        var secret = {};
        var generate = function () {
            secret.keys = Crypto.createEditCryptor();
            secret.key = Crypto.createEditCryptor().editKeyStr;
        };
        if (!secretHash && !/#/.test(window.location.href)) {
            generate();
            return secret;
        } else {
            var hash = secretHash || window.location.hash.slice(1);
            if (hash.length === 0) {
                generate();
                return secret;
            }
            // old hash system : #{hexChanKey}{cryptKey}
            // new hash system : #/{hashVersion}/{b64ChanKey}/{cryptKey}
            if (hash.slice(0,1) !== '/' && hash.length >= 56) {
                // Old hash
                secret.channel = hash.slice(0, 32);
                secret.key = hash.slice(32);
            }
            else {
                // New hash
                var hashArray = hash.split('/');
                if (hashArray.length < 4) {
                    Hash.alert("Unable to parse the key");
                    throw new Error("Unable to parse the key");
                }
                var version = hashArray[1];
                if (version === "1") {
                    var mode = hashArray[2];
                    if (mode === 'edit') {
                        secret.channel = base64ToHex(hashArray[3]);
                        var keys = Crypto.createEditCryptor(hashArray[4].replace(/-/g, '/'));
                        secret.keys = keys;
                        secret.key = keys.editKeyStr;
                        if (secret.channel.length !== 32 || secret.key.length !== 24) {
                            Hash.alert("The channel key and/or the encryption key is invalid");
                            throw new Error("The channel key and/or the encryption key is invalid");
                        }
                    }
                    else if (mode === 'view') {
                        secret.channel = base64ToHex(hashArray[3]);
                        secret.keys = Crypto.createViewCryptor(hashArray[4].replace(/-/g, '/'));
                        if (secret.channel.length !== 32) {
                            Hash.alert("The channel key is invalid");
                            throw new Error("The channel key is invalid");
                        }
                    }
                } else if (version === "2") {
                    // version 2 hashes are to be used for encrypted blobs
                    secret.channel = hashArray[2].replace(/-/g, '/');
                    secret.keys = { fileKeyStr: hashArray[3].replace(/-/g, '/') };
                }
            }
        }
        return secret;
    };

    Hash.getHashes = function (channel, secret) {
        var hashes = {};
        if (secret.keys.editKeyStr) {
            hashes.editHash = getEditHashFromKeys(channel, secret.keys);
        }
        if (secret.keys.viewKeyStr) {
            hashes.viewHash = getViewHashFromKeys(channel, secret.keys);
        }
        if (secret.keys.fileKeyStr) {
            hashes.fileHash = getFileHashFromKeys(channel, secret.keys.fileKeyStr);
        }
        return hashes;
    };

    var createChannelId = Hash.createChannelId = function () {
        var id = uint8ArrayToHex(Crypto.Nacl.randomBytes(16));
        if (id.length !== 32 || /[^a-f0-9]/.test(id)) {
            throw new Error('channel ids must consist of 32 hex characters');
        }
        return id;
    };

    Hash.createRandomHash = function () {
        // 16 byte channel Id
        var channelId = Util.hexToBase64(createChannelId());
        // 18 byte encryption key
        var key = Crypto.b64RemoveSlashes(Crypto.rand64(18));
        return '/1/edit/' + [channelId, key].join('/') + '/';
    };

/*
Version 0
    /pad/#67b8385b07352be53e40746d2be6ccd7XAYSuJYYqa9NfmInyHci7LNy
Version 1
    /code/#/1/edit/3Ujt4F2Sjnjbis6CoYWpoQ/usn4+9CqVja8Q7RZOGTfRgqI
Version 2
    /file/#/2/<fileId>/<cryptKey>/<contentType>
    /file/#/2/K6xWU-LT9BJHCQcDCT-DcQ/ajExFODrFH4lVBwxxsrOKw/image-png
*/
    var parseHash = Hash.parseHash = function (hash) {
        var parsed = {};
        if (hash.slice(0,1) !== '/' && hash.length >= 56) {
            // Old hash
            parsed.channel = hash.slice(0, 32);
            parsed.key = hash.slice(32);
            parsed.version = 0;
            return parsed;
        }
        var hashArr = hash.split('/');
        if (hashArr[1] && hashArr[1] === '1') {
            parsed.version = 1;
            parsed.mode = hashArr[2];
            parsed.channel = hashArr[3];
            parsed.key = hashArr[4];
            parsed.present = typeof(hashArr[5]) === "string" && hashArr[5] === 'present';
            return parsed;
        }
        if (hashArr[1] && hashArr[1] === '2') {
            parsed.version = 2;
            parsed.channel = hashArr[2].replace(/-/g, '/');
            parsed.key = hashArr[3].replace(/-/g, '/');
            return parsed;
        }
        return;
    };

    // STORAGE
    Hash.findWeaker = function (href, recents) {
        var rHref = href || getRelativeHref(window.location.href);
        var parsed = parsePadUrl(rHref);
        if (!parsed.hash) { return false; }
        var weaker;
        recents.some(function (pad) {
            var p = parsePadUrl(pad.href);
            if (p.type !== parsed.type) { return; } // Not the same type
            if (p.hash === parsed.hash) { return; } // Same hash, not stronger
            var pHash = parseHash(p.hash);
            var parsedHash = parseHash(parsed.hash);
            if (!parsedHash || !pHash) { return; }
            if (pHash.version !== parsedHash.version) { return; }
            if (pHash.channel !== parsedHash.channel) { return; }
            if (pHash.mode === 'view' && parsedHash.mode === 'edit') {
                weaker = pad.href;
                return true;
            }
            return;
        });
        return weaker;
    };
    var findStronger = Hash.findStronger = function (href, recents) {
        var rHref = href || getRelativeHref(window.location.href);
        var parsed = parsePadUrl(rHref);
        if (!parsed.hash) { return false; }
        var stronger;
        recents.some(function (pad) {
            var p = parsePadUrl(pad.href);
            if (p.type !== parsed.type) { return; } // Not the same type
            if (p.hash === parsed.hash) { return; } // Same hash, not stronger
            var pHash = parseHash(p.hash);
            var parsedHash = parseHash(parsed.hash);
            if (!parsedHash || !pHash) { return; }
            if (pHash.version !== parsedHash.version) { return; }
            if (pHash.channel !== parsedHash.channel) { return; }
            if (pHash.mode === 'edit' && parsedHash.mode === 'view') {
                stronger = pad.href;
                return true;
            }
            return;
        });
        return stronger;
    };
    Hash.isNotStrongestStored = function (href, recents) {
        return findStronger(href, recents);
    };

    Hash.hrefToHexChannelId = function (href) {
        var parsed = Hash.parsePadUrl(href);
        if (!parsed || !parsed.hash) { return; }

        parsed = Hash.parseHash(parsed.hash);

        if (parsed.version === 0) {
            return parsed.channel;
        } else if (parsed.version !== 1 && parsed.version !== 2) {
            console.error("parsed href had no version");
            console.error(parsed);
            return;
        }

        var channel = parsed.channel;
        if (!channel) { return; }

        var hex = base64ToHex(channel);
        return hex;
    };

    Hash.getBlobPathFromHex = function (id) {
        return '/blob/' + id.slice(0,2) + '/' + id;
    };

    Hash.serializeHash = function (hash) {
        if (hash && hash.slice(-1) !== "/") { hash += "/"; }
        return hash;
    };

    return Hash;
});
