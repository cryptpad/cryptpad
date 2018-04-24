define([
    '/common/common-util.js',
    '/customize/messages.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/tweetnacl/nacl-fast.min.js'
], function (Util, Messages, Crypto) {
    var Nacl = window.nacl;

    var Hash = window.CryptPad_Hash = {};

    var uint8ArrayToHex = Util.uint8ArrayToHex;
    var hexToBase64 = Util.hexToBase64;
    var base64ToHex = Util.base64ToHex;

    // This implementation must match that on the server
    // it's used for a checksum
    Hash.hashChannelList = function (list) {
        return Nacl.util.encodeBase64(Nacl.hash(Nacl.util
            .decodeUTF8(JSON.stringify(list))));
    };

    var getEditHashFromKeys = Hash.getEditHashFromKeys = function (secret) {
        var version = secret.version;
        var data = secret.keys;
        if (version === 0) {
            return secret.channel + secret.key;
        }
        if (version === 1) {
            if (!data.editKeyStr) { return; }
            return '/1/edit/' + hexToBase64(secret.channel) +
                   '/' + Crypto.b64RemoveSlashes(data.editKeyStr) + '/';
        }
        if (version === 2) {
            if (!data.editKeyStr) { return; }
            var pass = secret.password ? 'p/' : '';
            return '/2/' + secret.type + '/edit/' + Crypto.b64RemoveSlashes(data.editKeyStr) + '/' + pass;
        }
    };
    var getViewHashFromKeys = Hash.getViewHashFromKeys = function (secret) {
        var version = secret.version;
        var data = secret.keys;
        if (version === 0) { return; }
        if (version === 1) {
            if (!data.viewKeyStr) { return; }
            return '/1/view/' + hexToBase64(secret.channel) +
                   '/'+Crypto.b64RemoveSlashes(data.viewKeyStr)+'/';
        }
        if (version === 2) {
            if (!data.viewKeyStr) { return; }
            var pass = secret.password ? 'p/' : '';
            return '/2/' + secret.type + '/view/' + Crypto.b64RemoveSlashes(data.viewKeyStr) + '/' + pass;
        }
    };
    var getFileHashFromKeys = Hash.getFileHashFromKeys = function (secret) {
        var version = secret.version;
        var data = secret.keys;
        if (version === 0) { return; }
        if (version === 1) {
            return '/1/' + hexToBase64(secret.channel) + '/' +
                   Crypto.b64RemoveSlashes(data.fileKeyStr) + '/';
        }
    };

    // V1
    /*var getEditHashFromKeys = Hash.getEditHashFromKeys = function (chanKey, keys) {
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
        return '/1/' + hexToBase64(fileKey) + '/' + Crypto.b64RemoveSlashes(cryptKey) + '/';
    };*/
    Hash.getUserHrefFromKeys = function (origin, username, pubkey) {
        return origin + '/user/#/1/' + username + '/' + pubkey.replace(/\//g, '-');
    };

    var fixDuplicateSlashes = function (s) {
        return s.replace(/\/+/g, '/');
    };

    Hash.createChannelId = function () {
        var id = uint8ArrayToHex(Crypto.Nacl.randomBytes(16));
        if (id.length !== 32 || /[^a-f0-9]/.test(id)) {
            throw new Error('channel ids must consist of 32 hex characters');
        }
        return id;
    };

    Hash.createRandomHash = function (type, password) {
        var cryptor = Crypto.createEditCryptor2(void 0, void 0, password);
        return getEditHashFromKeys({
            password: Boolean(password),
            version: 2,
            type: type,
            keys: { editKeyStr: cryptor.editKeyStr }
        });
    };

/*
Version 0
    /pad/#67b8385b07352be53e40746d2be6ccd7XAYSuJYYqa9NfmInyHci7LNy
Version 1
    /code/#/1/edit/3Ujt4F2Sjnjbis6CoYWpoQ/usn4+9CqVja8Q7RZOGTfRgqI
*/

    var parseTypeHash = Hash.parseTypeHash = function (type, hash, password) {
        if (!hash) { return; }
        var parsed = {};
        var hashArr = fixDuplicateSlashes(hash).split('/');
        if (['media', 'file', 'user', 'invite'].indexOf(type) === -1) {
            parsed.type = 'pad';
            if (hash.slice(0,1) !== '/' && hash.length >= 56) { // Version 0
                // Old hash
                parsed.channel = hash.slice(0, 32);
                parsed.key = hash.slice(32, 56);
                parsed.version = 0;
                return parsed;
            }
            var options;
            if (hashArr[1] && hashArr[1] === '1') { // Version 1
                parsed.version = 1;
                parsed.mode = hashArr[2];
                parsed.channel = hashArr[3];
                parsed.key = Crypto.b64AddSlashes(hashArr[4]);

                options = hashArr.slice(5);
                parsed.present = options.indexOf('present') !== -1;
                parsed.embed = options.indexOf('embed') !== -1;
                return parsed;
            }
            if (hashArr[1] && hashArr[1] === '2') { // Version 2
                parsed.version = 2;
                parsed.app = hashArr[2];
                parsed.mode = hashArr[3];
                parsed.key = hashArr[4];

                var cryptor;
                if (parsed.mode === "edit") {
                    cryptor = Crypto.createEditCryptor2(parsed.key, void 0, password);
                } else if (parsed.mode === "view") {
                    cryptor = Crypto.createViewCryptor2(parsed.key, password);
                }
                parsed.channel = cryptor.chanId;
                parsed.cryptKey = cryptor.cryptKey;
                parsed.validateKey = cryptor.validateKey;

                options = hashArr.slice(5);
                parsed.password = options.indexOf('p') !== -1;
                parsed.present = options.indexOf('present') !== -1;
                parsed.embed = options.indexOf('embed') !== -1;
                return parsed;
            }
            return parsed;
        }
        if (['media', 'file'].indexOf(type) !== -1) {
            parsed.type = 'file';
            if (hashArr[1] && hashArr[1] === '1') {
                parsed.version = 1;
                parsed.channel = hashArr[2].replace(/-/g, '/');
                parsed.key = hashArr[3].replace(/-/g, '/');
                return parsed;
            }
            return parsed;
        }
        if (['user'].indexOf(type) !== -1) {
            parsed.type = 'user';
            if (hashArr[1] && hashArr[1] === '1') {
                parsed.version = 1;
                parsed.user = hashArr[2];
                parsed.pubkey = hashArr[3].replace(/-/g, '/');
                return parsed;
            }
            return parsed;
        }
        if (['invite'].indexOf(type) !== -1) {
            parsed.type = 'invite';
            if (hashArr[1] && hashArr[1] === '1') {
                parsed.version = 1;
                parsed.channel = hashArr[2];
                parsed.pubkey = hashArr[3].replace(/-/g, '/');
                return parsed;
            }
            return parsed;
        }
        return;
    };
    var parsePadUrl = Hash.parsePadUrl = function (href, password) {
        var patt = /^https*:\/\/([^\/]*)\/(.*?)\//i;

        var ret = {};

        if (!href) { return ret; }
        if (href.slice(-1) !== '/') { href += '/'; }
        href = href.replace(/\/\?[^#]+#/, '/#');

        var idx;

        ret.getUrl = function (options) {
            options = options || {};
            var url = '/';
            if (!ret.type) { return url; }
            url += ret.type + '/';
            if (!ret.hashData) { return url; }
            if (ret.hashData.type !== 'pad') { return url + '#' + ret.hash; }
            if (ret.hashData.version === 0) { return url + '#' + ret.hash; }
            var hash;
            if (options.readOnly === true ||
                    (typeof (options.readOnly === "undefined") && ret.hashData.mode === "view")) {
                hash = getViewHashFromKeys({
                    version: ret.hashData.version,
                    type: ret.hashData.app,
                    channel: base64ToHex(ret.hashData.channel || ''),
                    password: ret.hashData.password,
                    keys: {
                        viewKeyStr: ret.hashData.key
                    }
                });
            } else {
                hash = getEditHashFromKeys({
                    version: ret.hashData.version,
                    type: ret.hashData.app,
                    channel: base64ToHex(ret.hashData.channel || ''),
                    password: ret.hashData.password,
                    keys: {
                        editKeyStr: ret.hashData.key
                    }
                });
            }
            url += '#' + hash;
            if (options.embed) { url += 'embed/'; }
            if (options.present) { url += 'present/'; }
            return url;
        };

        if (!/^https*:\/\//.test(href)) {
            idx = href.indexOf('/#');
            ret.type = href.slice(1, idx);
            ret.hash = href.slice(idx + 2);
            ret.hashData = parseTypeHash(ret.type, ret.hash, password);
            return ret;
        }

        href.replace(patt, function (a, domain, type) {
            ret.domain = domain;
            ret.type = type;
            return '';
        });
        idx = href.indexOf('/#');
        ret.hash = href.slice(idx + 2);
        ret.hashData = parseTypeHash(ret.type, ret.hash, password);
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
    Hash.getSecrets = function (type, secretHash, password) {
        var secret = {};
        var generate = function () {
            secret.keys = Crypto.createEditCryptor2(void 0, void 0, password);
            secret.channel = base64ToHex(secret.keys.chanId);
            secret.version = 2;
            secret.type = type;
        };
        if (!secretHash && !window.location.hash) { //!/#/.test(window.location.href)) {
            generate();
            return secret;
        } else {
            var parsed;
            var hash;
            if (secretHash) {
                if (!type) { throw new Error("getSecrets with a hash requires a type parameter"); }
                parsed = parseTypeHash(type, secretHash);
                hash = secretHash;
            } else {
                var pHref = parsePadUrl(window.location.href);
                parsed = pHref.hashData;
                hash = pHref.hash;
            }
            //var parsed = parsePadUrl(window.location.href);
            //var hash = secretHash || window.location.hash.slice(1);
            if (hash.length === 0) {
                generate();
                return secret;
            }
            // old hash system : #{hexChanKey}{cryptKey}
            // new hash system : #/{hashVersion}/{b64ChanKey}/{cryptKey}
            if (parsed.version === 0) {
                // Old hash
                secret.channel = parsed.channel;
                secret.key = parsed.key;
                secret.version = 0;
            } else if (parsed.version === 1) {
                // New hash
                secret.version = 1;
                if (parsed.type === "pad") {
                    secret.channel = base64ToHex(parsed.channel);
                    if (parsed.mode === 'edit') {
                        secret.keys = Crypto.createEditCryptor(parsed.key);
                        secret.key = secret.keys.editKeyStr;
                        if (secret.channel.length !== 32 || secret.key.length !== 24) {
                            throw new Error("The channel key and/or the encryption key is invalid");
                        }
                    }
                    else if (parsed.mode === 'view') {
                        secret.keys = Crypto.createViewCryptor(parsed.key);
                        if (secret.channel.length !== 32) {
                            throw new Error("The channel key is invalid");
                        }
                    }
                } else if (parsed.type === "file") {
                    // version 2 hashes are to be used for encrypted blobs
                    secret.channel = parsed.channel;
                    secret.keys = { fileKeyStr: parsed.key };
                } else if (parsed.type === "user") {
                    // version 2 hashes are to be used for encrypted blobs
                    throw new Error("User hashes can't be opened (yet)");
                }
            } else if (parsed.version === 2) {
                // New hash
                secret.version = 2;
                secret.type = type;
                secret.password = Boolean(password);
                if (parsed.type === "pad") {
                    if (parsed.mode === 'edit') {
                        secret.keys = Crypto.createEditCryptor2(parsed.key);
                        secret.channel = base64ToHex(secret.keys.chanId);
                        secret.key = secret.keys.editKeyStr;
                        if (secret.channel.length !== 32 || secret.key.length !== 24) {
                            throw new Error("The channel key and/or the encryption key is invalid");
                        }
                    }
                    else if (parsed.mode === 'view') {
                        secret.keys = Crypto.createViewCryptor2(parsed.key);
                        secret.channel = base64ToHex(secret.keys.chanId);
                        if (secret.channel.length !== 32) {
                            throw new Error("The channel key is invalid");
                        }
                    }
                } else if (parsed.type === "file") {
                    throw new Error("File hashes should be version 1");
                } else if (parsed.type === "user") {
                    throw new Error("User hashes can't be opened (yet)");
                }
            }
        }
        return secret;
    };

    Hash.getHashes = function (secret) {
        var hashes = {};
        secret = JSON.parse(JSON.stringify(secret));

        if (!secret.keys && !secret.key) {
            console.error('e');
            return hashes;
        } else if (!secret.keys) {
            secret.keys = {};
        }

        if (secret.keys.editKeyStr || (secret.version === 0 && secret.key)) {
            hashes.editHash = getEditHashFromKeys(secret);
        }
        if (secret.keys.viewKeyStr) {
            hashes.viewHash = getViewHashFromKeys(secret);
        }
        if (secret.keys.fileKeyStr) {
            hashes.fileHash = getFileHashFromKeys(secret);
        }
        return hashes;
    };

    // STORAGE
    Hash.findWeaker = function (href, recents) {
        var rHref = href || getRelativeHref(window.location.href);
        var parsed = parsePadUrl(rHref);
        if (!parsed.hash) { return false; }
        var weaker;
        Object.keys(recents).some(function (id) {
            var pad = recents[id];
            var p = parsePadUrl(pad.href);
            if (p.type !== parsed.type) { return; } // Not the same type
            if (p.hash === parsed.hash) { return; } // Same hash, not stronger
            var pHash = p.hashData;
            var parsedHash = parsed.hashData;
            if (!parsedHash || !pHash) { return; }

            // We don't have stronger/weaker versions of files or users
            if (pHash.type !== 'pad' && parsedHash.type !== 'pad') { return; }

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
        // We can't have a stronger hash if we're already in edit mode
        if (parsed.hashData && parsed.hashData.mode === 'edit') { return; }
        var stronger;
        Object.keys(recents).some(function (id) {
            var pad = recents[id];
            var p = parsePadUrl(pad.href);
            if (p.type !== parsed.type) { return; } // Not the same type
            if (p.hash === parsed.hash) { return; } // Same hash, not stronger
            var pHash = p.hashData;
            var parsedHash = parsed.hashData;
            if (!parsedHash || !pHash) { return; }

            // We don't have stronger/weaker versions of files or users
            if (pHash.type !== 'pad' && parsedHash.type !== 'pad') { return; }

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

        parsed = parsed.hashData;
        if (parsed.version === 0) {
            return parsed.channel;
        } else if (!parsed.version) {
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

    Hash.createInviteUrl = function (curvePublic, channel) {
        channel = channel || Hash.createChannelId();
        return window.location.origin + '/invite/#/1/' + channel +
            '/' + curvePublic.replace(/\//g, '-') + '/';
    };

    // Create untitled documents when no name is given
    var getLocaleDate = function () {
        if (window.Intl && window.Intl.DateTimeFormat) {
            var options = {weekday: "short", year: "numeric", month: "long", day: "numeric"};
            return new window.Intl.DateTimeFormat(undefined, options).format(new Date());
        }
        return new Date().toString().split(' ').slice(0,4).join(' ');
    };
    Hash.getDefaultName = function (parsed) {
        var type = parsed.type;
        var name = (Messages.type)[type] + ' - ' + getLocaleDate();
        return name;
    };

    return Hash;
});
