// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(function (window) {
var factory = function (Util, Crypto, Keys, Nacl) {
    var Hash = window.CryptPad_Hash = {};

    var uint8ArrayToHex = Util.uint8ArrayToHex;
    var hexToBase64 = Util.hexToBase64;
    var base64ToHex = Util.base64ToHex;
    Hash.encodeBase64 = Util.encodeBase64;
    Hash.decodeBase64 = Util.decodeBase64;

    // This implementation must match that on the server
    // it's used for a checksum
    Hash.hashChannelList = function (list) {
        return Util.encodeBase64(Nacl.hash(Util
            .decodeUTF8(JSON.stringify(list))));
    };

    Hash.generateSignPair = function () {
        var ed = Nacl.sign.keyPair();
        var makeSafe = function (key) {
            return Crypto.b64RemoveSlashes(key).replace(/=+$/g, '');
        };
        return {
            validateKey: Hash.encodeBase64(ed.publicKey),
            signKey: Hash.encodeBase64(ed.secretKey),
            safeValidateKey: makeSafe(Hash.encodeBase64(ed.publicKey)),
            safeSignKey: makeSafe(Hash.encodeBase64(ed.secretKey)),
        };
    };

    Hash.getSignPublicFromPrivate = function (edPrivateSafeStr) {
        var edPrivateStr = Crypto.b64AddSlashes(edPrivateSafeStr);
        var privateKey = Util.decodeBase64(edPrivateStr);
        var keyPair = Nacl.sign.keyPair.fromSecretKey(privateKey);
        return Util.encodeBase64(keyPair.publicKey);
    };
    Hash.getCurvePublicFromPrivate = function (curvePrivateSafeStr) {
        var curvePrivateStr = Crypto.b64AddSlashes(curvePrivateSafeStr);
        var privateKey = Util.decodeBase64(curvePrivateStr);
        var keyPair = Nacl.box.keyPair.fromSecretKey(privateKey);
        return Util.encodeBase64(keyPair.publicKey);
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

    Hash.getHiddenHashFromKeys = function (type, secret, opts) {
        opts = opts || {};
        var canEdit = (secret.keys && secret.keys.editKeyStr) || secret.key;
        var mode = (!opts.view && canEdit) ? 'edit/' : 'view/';
        var pass = secret.password ? 'p/' : '';

        if (secret.keys && secret.keys.fileKeyStr) { mode = ''; }

        var hash =  '/3/' + type + '/' + mode + secret.channel + '/' + pass;
        var hashData = Hash.parseTypeHash(type, hash);
        if (hashData && hashData.getHash) {
            return hashData.getHash(opts || {});
        }
        return hash;
    };

    var getFileHashFromKeys = Hash.getFileHashFromKeys = function (secret) {
        var version = secret.version;
        var data = secret.keys;
        if (version === 0) { return; }
        if (version === 1) {
            return '/1/' + hexToBase64(secret.channel) + '/' +
                   Crypto.b64RemoveSlashes(data.fileKeyStr) + '/';
        }
        if (version === 2) {
            if (!data.fileKeyStr) { return; }
            var pass = secret.password ? 'p/' : '';
            return '/2/' + secret.type + '/' + Crypto.b64RemoveSlashes(data.fileKeyStr) + '/' + pass;
        }
    };

    Hash.getPublicSigningKeyString = Keys.serialize;

    var fixDuplicateSlashes = function (s) {
        return s.replace(/\/+/g, '/');
    };

    Hash.ephemeralChannelLength = 34;
    Hash.createChannelId = function (ephemeral) {
        var id = uint8ArrayToHex(Crypto.Nacl.randomBytes(ephemeral? 17: 16));
        if ([32, 34].indexOf(id.length) === -1 || /[^a-f0-9]/.test(id)) {
            throw new Error('channel ids must consist of 32 hex characters');
        }
        return id;
    };

    /*  Given a base64-encoded public key, deterministically derive a channel id
        Used for support mailboxes
    */
    Hash.getChannelIdFromKey = function (publicKey) {
        if (!publicKey) { return; }
        return uint8ArrayToHex(Hash.decodeBase64(publicKey).subarray(0,16));
    };

    /*  Given a base64-encoded asymmetric private key
        derive the corresponding public key
    */
    Hash.getBoxPublicFromSecret = function (priv) {
        if (!priv) { return; }
        var u8_priv = Hash.decodeBase64(priv);
        var pair = Nacl.box.keyPair.fromSecretKey(u8_priv);
        return Hash.encodeBase64(pair.publicKey);
    };

    /*  Given a base64-encoded private key and public key
        check that the keys are part of a valid keypair
    */
    Hash.checkBoxKeyPair = function (priv, pub) {
        if (!pub || !priv) { return false; }
        var u8_priv = Hash.decodeBase64(priv);
        var pair = Nacl.box.keyPair.fromSecretKey(u8_priv);
        return pub === Hash.encodeBase64(pair.publicKey);
    };

    Hash.createRandomHash = function (type, password) {
        var cryptor;
        if (type === 'file') {
            cryptor = Crypto.createFileCryptor2(void 0, password);
            return getFileHashFromKeys({
                password: Boolean(password),
                version: 2,
                type: type,
                keys: cryptor
            });
        }
        cryptor = Crypto.createEditCryptor2(void 0, void 0, password);
        return getEditHashFromKeys({
            password: Boolean(password),
            version: 2,
            type: type,
            keys: cryptor
        });
    };

/*
Version 0
    /pad/#67b8385b07352be53e40746d2be6ccd7XAYSuJYYqa9NfmInyHci7LNy
Version 1: Add support for read-only access
    /code/#/1/edit/3Ujt4F2Sjnjbis6CoYWpoQ/usn4+9CqVja8Q7RZOGTfRgqI
Version 2: Add support for password-protection
    /code/#/2/code/edit/u5ACvxAYmhvG0FtrNn9FJQcf/p/
Version 3: Safe links
    /code/#/3/code/edit/f0d8055aa640a97e7fd25020ca4e93b3/
Version 4: Data URL when not a realtime link yet (new pad or "static" app)
    /login/#/4/login/newpad=eyJocmVmIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL2NvZGUvIy8yL2NvZGUvZWRpdC91NUFDdnhBWW1odkcwRnRyTm45RklRY2YvIn0%3D/
    /drive/#/4/drive/login=e30%3D/
*/

    var getLoginOpts = function (hashArr) {
        var k;
        // Check if we have a ownerKey for this pad
        hashArr.some(function (data) {
            if (/^login=/.test(data)) {
                k = data.slice(6);
                return true;
            }
        });
        return k || '';
    };
    var getNewPadOpts = function (hashArr) {
        var k;
        // Check if we have a ownerKey for this pad
        hashArr.some(function (data) {
            if (/^newpad=/.test(data)) {
                k = data.slice(7);
                return true;
            }
        });
        return k || '';
    };
    var getVersionHash = function (hashArr) {
        var k;
        // Check if we have a ownerKey for this pad
        hashArr.some(function (data) {
            if (/^hash=/.test(data)) {
                k = data.slice(5);
                return true;
            }
        });
        return k ? Crypto.b64AddSlashes(k) : '';
    };
    var getAuditorKey = function (hashArr) {
        var k;
        // Check if we have a ownerKey for this pad
        hashArr.some(function (data) {
            if (/^auditor=/.test(data)) {
                k = data.slice(8);
                return true;
            }
        });
        return k ? Crypto.b64AddSlashes(k) : '';
    };
    var getOwnerKey = function (hashArr) {
        var k;
        // Check if we have a ownerKey for this pad
        hashArr.some(function (data) {
            if (data.length === 86) {
                k = data;
                return true;
            }
        });
        return k;
    };
    var parseTypeHash = Hash.parseTypeHash = function (type, hash) {
        if (!hash) { return; }
        var options = [];
        var parsed = {};
        var hashArr = fixDuplicateSlashes(hash).split('/');

        var addOptions = function () {
            parsed.password = options.indexOf('p') !== -1;
            parsed.present = options.indexOf('present') !== -1;
            parsed.embed = options.indexOf('embed') !== -1;
            parsed.versionHash = getVersionHash(options);
            parsed.auditorKey = getAuditorKey(options);
            parsed.newPadOpts = getNewPadOpts(options);
            parsed.loginOpts = getLoginOpts(options);
            parsed.ownerKey = getOwnerKey(options);
        };

        // Version 4: only login or newpad options, same for all the apps
        if (hashArr[1] && hashArr[1] === '4') {
            parsed.getHash = function (opts) {
                if (!opts || !Object.keys(opts).length) { return ''; }
                var hash = '/4/' + type + '/';
                if (opts.newPadOpts) { hash += 'newpad=' + opts.newPadOpts + '/'; }
                if (opts.loginOpts) { hash += 'login=' + opts.loginOpts + '/'; }
                return hash;
            };
            parsed.getOptions = function () {
                var options = {};
                if (parsed.newPadOpts) { options.newPadOpts = parsed.newPadOpts; }
                if (parsed.loginOpts) { options.loginOpts = parsed.loginOpts; }
                return options;
            };

            parsed.version = 4;
            parsed.app = hashArr[2];
            options = hashArr.slice(3);
            addOptions();

            return parsed;
        }

        // The other versions depends on the type
        if (['media', 'file', 'user', 'invite'].indexOf(type) === -1) {
            parsed.type = 'pad';
            parsed.getHash = function () {
                return hash;
            };
            parsed.getOptions = function () {
                return {
                    embed: parsed.embed,
                    present: parsed.present,
                    ownerKey: parsed.ownerKey,
                    versionHash: parsed.versionHash,
                    auditorKey: parsed.auditorKey,
                    newPadOpts: parsed.newPadOpts,
                    loginOpts: parsed.loginOpts,
                    password: parsed.password
                };
            };

            if (hash.slice(0,1) !== '/' && hash.length >= 56) { // Version 0
                // Old hash
                parsed.channel = hash.slice(0, 32);
                parsed.key = hash.slice(32, 56);
                parsed.version = 0;
                return parsed;
            }

            // Version >= 1: more hash options
            parsed.getHash = function (opts) {
                var hash = hashArr.slice(0, 5).join('/') + '/';
                var owner = typeof(opts.ownerKey) !== "undefined" ? opts.ownerKey : parsed.ownerKey;
                if (owner) { hash += owner + '/'; }
                if (parsed.password || opts.password) { hash += 'p/'; }
                if (opts.embed) { hash += 'embed/'; }
                if (opts.present) { hash += 'present/'; }
                var versionHash = typeof(opts.versionHash) !== "undefined" ? opts.versionHash : parsed.versionHash;
                if (versionHash) {
                    hash += 'hash=' + Crypto.b64RemoveSlashes(versionHash) + '/';
                }
                var auditorKey = typeof(opts.auditorKey) !== "undefined" ? opts.auditorKey : parsed.auditorKey;
                if (auditorKey) {
                    hash += 'auditor=' + Crypto.b64RemoveSlashes(auditorKey) + '/';
                }
                if (opts.newPadOpts) { hash += 'newpad=' + opts.newPadOpts + '/'; }
                if (opts.loginOpts) { hash += 'login=' + opts.loginOpts + '/'; }
                return hash;
            };

            if (hashArr[1] && hashArr[1] === '1') { // Version 1
                parsed.version = 1;
                parsed.mode = hashArr[2];
                parsed.channel = hashArr[3];
                parsed.key = Crypto.b64AddSlashes(hashArr[4]);

                options = hashArr.slice(5);
                addOptions();

                return parsed;
            }
            if (hashArr[1] && hashArr[1] === '2') { // Version 2
                parsed.version = 2;
                parsed.app = hashArr[2];
                parsed.mode = hashArr[3];
                parsed.key = hashArr[4];

                options = hashArr.slice(5);
                addOptions();

                return parsed;
            }
            if (hashArr[1] && hashArr[1] === '3') { // Version 3: hidden hash
                parsed.version = 3;
                parsed.app = hashArr[2];
                parsed.mode = hashArr[3];
                parsed.channel = hashArr[4];

                options = hashArr.slice(5);
                addOptions();

                return parsed;
            }
            return parsed;
        }
        parsed.getHash = function () { return hashArr.join('/'); };
        if (['media', 'file'].indexOf(type) !== -1) {
            parsed.type = 'file';

            parsed.getOptions = function () {
                return {
                    embed: parsed.embed,
                    present: parsed.present,
                    ownerKey: parsed.ownerKey,
                    newPadOpts: parsed.newPadOpts,
                    loginOpts: parsed.loginOpts,
                    password: parsed.password
                };
            };

            parsed.getHash = function (opts) {
                var hash = hashArr.slice(0, 4).join('/') + '/';
                var owner = typeof(opts.ownerKey) !== "undefined" ? opts.ownerKey : parsed.ownerKey;
                if (owner) { hash += owner + '/'; }
                if (parsed.password || opts.password) { hash += 'p/'; }
                if (opts.embed) { hash += 'embed/'; }
                if (opts.present) { hash += 'present/'; }
                if (opts.newPadOpts) { hash += 'newpad=' + opts.newPadOpts + '/'; }
                if (opts.loginOpts) { hash += 'login=' + opts.loginOpts + '/'; }
                return hash;
            };

            if (hashArr[1] && hashArr[1] === '1') {
                parsed.version = 1;
                parsed.channel = hashArr[2].replace(/-/g, '/');
                parsed.key = hashArr[3].replace(/-/g, '/');
                options = hashArr.slice(4);
                addOptions();
                return parsed;
            }

            if (hashArr[1] && hashArr[1] === '2') { // Version 2
                parsed.version = 2;
                parsed.app = hashArr[2];
                parsed.key = hashArr[3];

                options = hashArr.slice(4);
                addOptions();

                return parsed;
            }

            if (hashArr[1] && hashArr[1] === '3') { // Version 3: hidden hash
                parsed.version = 3;
                parsed.app = hashArr[2];
                parsed.channel = hashArr[3];

                options = hashArr.slice(4);
                addOptions();

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
            if (hashArr[1] && hashArr[1] === '2') {
                parsed.version = 2;
                parsed.app = hashArr[2];
                parsed.mode = hashArr[3];
                parsed.key = hashArr[4];

                options = hashArr.slice(5);
                parsed.password = options.indexOf('p') !== -1;
                return parsed;
            }
            return parsed;
        }
        return;
    };
    var parsePadUrl = Hash.parsePadUrl = function (href) {
        var patt = /^https*:\/\/([^\/]*)\/(.*?)\//i;

        var ret = {};

        if (!href) { return ret; }
        if (href.slice(-1) !== '/' && href.slice(-1) !== '#') { href += '/'; }
        href = href.replace(/\/\?[^#]+#/, '/#');

        var idx;

        // When we start without a hash, use version 4 links to add login or newpad options
        var getHash = function (opts) {
            if (!opts || !Object.keys(opts).length) { return ''; }
            var hash = '/4/' + ret.type + '/';
            if (opts.newPadOpts) { hash += 'newpad=' + opts.newPadOpts + '/'; }
            if (opts.loginOpts) { hash += 'login=' + opts.loginOpts + '/'; }
            return hash;
        };
        ret.getUrl = function (options) {
            options = options || {};
            var url = '/';
            if (!ret.type) { return url; }
            url += ret.type + '/';
            // New pad with options: append the options to the hash
            if (!ret.hashData && options && Object.keys(options).length) {
                return url + '#' + getHash(options);
            }
            if (!ret.hashData) { return url; }
            //if (ret.hashData.version === 0) { return url + '#' + ret.hash; }
            //if (ret.hashData.type !== 'pad') { return url + '#' + ret.hash; }
            var hash = ret.hashData.getHash(options);
            url += '#' + hash;
            return url;
        };
        ret.getOptions = function () {
            if (!ret.hashData || !ret.hashData.getOptions) { return {}; }
            return ret.hashData.getOptions();
        };

        if (!/^https*:\/\//.test(href)) {
            // If it doesn't start with http(s), it should be a relative href
            if (!/^\/($|[^\/])/.test(href)) { return ret; }
            idx = href.indexOf('/#');
            ret.type = href.slice(1, idx);
            if (idx === -1) { return ret; }
            ret.hash = href.slice(idx + 2);
            ret.hashData = parseTypeHash(ret.type, ret.hash);
            return ret;
        }

        href.replace(patt, function (a, domain, type) {
            ret.domain = domain;
            ret.type = type;
            return '';
        });
        idx = href.indexOf('/#');
        if (idx === -1) { return ret; }
        ret.hash = href.slice(idx + 2);
        ret.hashData = parseTypeHash(ret.type, ret.hash);
        return ret;
    };

    Hash.hashToHref = function (hash, type) {
        return '/' + type + '/#' + hash;
    };
    Hash.hrefToHash = function (href) {
        var parsed = Hash.parsePadUrl(href);
        return parsed.hash;
    };

    Hash.getRelativeHref = function (href) {
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
        if (!secretHash) {
            generate();
            return secret;
        } else {
            var parsed;
            var hash;
            if (secretHash) {
                if (!type) { throw new Error("getSecrets with a hash requires a type parameter"); }
                parsed = parseTypeHash(type, secretHash);
                hash = secretHash;
            }
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
                    secret.channel = base64ToHex(parsed.channel);
                    secret.keys = {
                        fileKeyStr: parsed.key,
                        cryptKey: Util.decodeBase64(parsed.key)
                    };
                } else if (parsed.type === "user") {
                    throw new Error("User hashes can't be opened (yet)");
                }
            } else if (parsed.version === 2) {
                // New hash
                secret.version = 2;
                secret.type = type;
                secret.password = password;
                if (parsed.type === "pad") {
                    if (parsed.mode === 'edit') {
                        secret.keys = Crypto.createEditCryptor2(parsed.key, void 0, password);
                        secret.channel = base64ToHex(secret.keys.chanId);
                        secret.key = secret.keys.editKeyStr;
                        if (secret.channel.length !== 32 || secret.key.length !== 24) {
                            throw new Error("The channel key and/or the encryption key is invalid");
                        }
                    }
                    else if (parsed.mode === 'view') {
                        secret.keys = Crypto.createViewCryptor2(parsed.key, password);
                        secret.channel = base64ToHex(secret.keys.chanId);
                        if (secret.channel.length !== 32) {
                            throw new Error("The channel key is invalid");
                        }
                    }
                } else if (parsed.type === "file") {
                    secret.keys = Crypto.createFileCryptor2(parsed.key, password);
                    secret.channel = base64ToHex(secret.keys.chanId);
                    secret.key = secret.keys.fileKeyStr;
                    if (secret.channel.length !== 48 || secret.key.length !== 24) {
                        throw new Error("The channel key and/or the encryption key is invalid");
                    }
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

    Hash.getFormData = function (secret, hash, password) {
        secret = secret || Hash.getSecrets('form', hash, password);
        var keys = secret && secret.keys;
        var secondary = keys && keys.secondaryKey;
        if (!secondary) { return; }
        var curvePair = Nacl.box.keyPair.fromSecretKey(Util.decodeUTF8(secondary).slice(0,32));
        var ret = {};
        ret.form_public = Util.encodeBase64(curvePair.publicKey);
        var privateKey = ret.form_private = Util.encodeBase64(curvePair.secretKey);

        var auditorHash = Hash.getViewHashFromKeys({
            version: 1,
            channel: secret.channel,
            keys: { viewKeyStr: Util.encodeBase64(keys.cryptKey) }
        });
        var _parsed = Hash.parseTypeHash('pad', auditorHash);
        ret.form_auditorHash = _parsed.getHash({auditorKey: privateKey});

        return ret;
    };

    // STORAGE
    Hash.hrefToHexChannelId = function (href, password) {
        var parsed = Hash.parsePadUrl(href);
        if (!parsed || !parsed.hash) { return; }
        var secret = Hash.getSecrets(parsed.type, parsed.hash, password);
        return secret.channel;
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

    Hash.isValidChannel = function (channelId) {
        return /^[a-zA-Z0-9]{32,48}$/.test(channelId);
    };

    Hash.isValidHref = function (href) {
        // Non-empty href?
        if (!href) { return; }
        var parsed = Hash.parsePadUrl(href);
        // Can be parsed?
        if (!parsed) { return; }
        // Link to a CryptPad app?
        if (!parsed.type) { return; }
        // Valid hash?
        if (parsed.hash) {
            if (!parsed.hashData) { return; }
            // Version should be a number
            if (typeof(parsed.hashData.version) === "undefined") { return; }
            // pads and files should have a base64 (or hex) key
            if (parsed.hashData.type === 'pad' || parsed.hashData.type === 'file') {
                if (!parsed.hashData.key && !parsed.hashData.channel) { return; }
                if (parsed.hashData.key && !/^[a-zA-Z0-9+-/=]+$/.test(parsed.hashData.key)) { return; }
            }
        }
        return parsed;
    };

    Hash.decodeDataOptions = function (opts) {
        var b64 = decodeURIComponent(opts);
        var str = Util.encodeUTF8(Util.decodeBase64(b64));
        return Util.tryParse(str) || {};
    };
    Hash.encodeDataOptions = function (opts) {
        var str = JSON.stringify(opts);
        var b64 = Util.encodeBase64(Util.decodeUTF8(str));
        return encodeURIComponent(b64);
    };
    Hash.getNewPadURL = function (href, opts) {
        var parsed = Hash.parsePadUrl(href);
        var options = parsed.getOptions();
        options.newPadOpts = Hash.encodeDataOptions(opts);
        return parsed.getUrl(options);
    };
    Hash.getLoginURL = function (href, opts) {
        var parsed = Hash.parsePadUrl(href);
        var options = parsed.getOptions();
        options.loginOpts = Hash.encodeDataOptions(opts);
        return parsed.getUrl(options);
    };

    return Hash;
};

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(
            require("./common-util"),
            require("chainpad-crypto"),
            require("./common-signing-keys"),
            require("tweetnacl/nacl-fast")
        );
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/common/common-util.js',
            '/components/chainpad-crypto/crypto.js',
            '/common/common-signing-keys.js',
            '/components/tweetnacl/nacl-fast.min.js'
        ], function (Util, Crypto, Keys) {
            return factory(Util, Crypto, Keys, window.nacl);
        });
    } else {
        // unsupported initialization
    }
}(typeof(window) !== 'undefined'? window : {}));
