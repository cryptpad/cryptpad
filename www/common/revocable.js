(function (window) {
var factory = function (Hash, Nacl) {
    var Revocable = window.CryptPad_Revocable = {};

    // Access metadata
    Revocable.isModerator = function (access) {
        if (typeof(access) === "string") {
            return access.includes('m');
        }
        if (!access || !access.rights) { return false; }
        return access.rights.includes('m');
    };
    Revocable.isEditor = function (access) {
        if (typeof(access) === "string") {
            return access.includes('w');
        }
        if (!access || !access.rights) { return false; }
        return access.rights.includes('w');
    };
    Revocable.isViewer = function (access) {
        if (typeof(access) === "string") {
            return access.includes('r');
        }
        if (!access || !access.rights) { return false; }
        return access.rights.includes('r');
    };
    Revocable.isValidRights = function (rights) {
        if (typeof(rights) !== "string") { return false; }
        return /^rw?m?d?$/.test(rights);
    };
    Revocable.isValidAccessUpdate = function (oldValue, newValue) {
        if (oldValue && !newValue) { return true; } // Deletion
        if (oldValue) { // Update: I can only change "rights"
            return Object.keys(newValue).every(function (key) {
                if (key !== "rights") { return false; }
                if (!/^rw?m?d?$/.test(newValue.rights)) { return false; }
                return true;
            });
        }
        // This is a new entry
        return newValue.rights && /^rw?m?d?$/.test(newValue.rights)
            && newValue.notes && newValue.curvePublic && newValue.mailbox;
    };
    Revocable.isAllowedAccessUpdate = function (all, myKey, oldValue, newValue) {
        const myAccess = all[myKey];

        // Check integrity
        if (!Revocable.isValidAccessUpdate(oldValue, newValue)) { return true; }

        // Moderator? always allowed
        if (Revocable.isModerator(myAccess)) { return false; }

        // Editor: revoke access only for your subtree
        if (newValue === false) {
            return !Revocable.isInMyAccessTree(oldValue, all, myKey);
        }

        // Add or update access: delegated access never greater than your access
        if (newValue.rights.includes('m') || newValue.rights.includes('d')) { return true; }
        if (newValue.rights.includes('w') && !myAccess.rights.includes('w')) { return true; }

        // Add access
        if (!oldValue) { return false; }

        // Update access: forbidden if not in my tree
        return !Revocable.isInMyAccessTree(oldValue, all, myKey);

    };
    Revocable.isInMyAccessTree = function (value, tree, myKey) {
        if (value.from === myKey) { return true; }
        if (!value.from) { return false; }
        if (!tree[value.from]) { return false; }
        return Revocable.isInMyAccessTree(tree[value.from], tree, myKey);
    };
    Revocable.reencryptNotes = function (oldCrypto, newCrypto, md) {
        if (!md) { return; }
        var result = {};
        var reencrypt = function (str) {
            // XXX NO NEED TO SIGN HERE
            return newCrypto.encrypt(oldCrypto.decrypt(str, true, true));
        };
        var abort = Object.keys(md.access || {}).some(function (ed) {
            var access = md.access[ed];
            try {
                result[ed] = {
                    mailbox: reencrypt(access.mailbox),
                    notes: reencrypt(access.notes),
                };
            } catch (e) {
                return true;
            }
        });
        if (abort) { return; }
        return result;
    };


    // Log

    Revocable.firstLog = function (modEdPublic) {
        return ['ADD', undefined, modEdPublic];
    };
    Revocable.addLog = function (modEdPublic, prevHash) {
        return ['ADD', prevHash, modEdPublic];
    };
    Revocable.removeLog = function (modEdPublic, prevHash) {
        return ['REMOVE', prevHash, modEdPublic];
    };
    Revocable.rotateLog = function (keyHash, validateKey, uid, prevHash) {
        return ['ROTATE', prevHash, keyHash, validateKey, uid];
    };
    Revocable.signLog = function (msg, edPrivate) {
        try {
            var msgBytes = Nacl.util.decodeUTF8(JSON.stringify(msg));
            var key = Nacl.util.decodeBase64(edPrivate);
            var sig = Nacl.sign.detached(msgBytes, key);
            return Nacl.util.encodeBase64(Nacl.sign.detached(msgBytes, key));
        } catch(e) {
            console.error(e);
            return;
        }
    };
    Revocable.addSignatureLog = function (msg, authorEd, signature) {
        msg.push(signature);
        msg.push(authorEd);
        return msg;
    };
    Revocable.checkLog = function (msg, edPublic, signature) {
        try {
            var sig = Nacl.util.decodeBase64(signature);
            var msgBytes = Nacl.util.decodeUTF8(JSON.stringify(msg));
            var key = Nacl.util.decodeBase64(addSlashes(edPublic));
            var check = Nacl.sign.detached.verify(msgBytes, sig, key);
            return check;
        } catch (e) {
            console.error(e);
            return;
        }
    };


    Revocable.getSanitizedLog = function (md) {
        var log = md.moderatorsLog;
        var result = [];
        if (!Array.isArray(log) || !log.length) { return result; }
        var prevHash;

        // Read the log and preserve all messages where the "prevHash"
        // value matches the hash of the previous valid message
        // Also reject messages coming from non-moderators
        var moderators = [];
        log.forEach(function (msg, i) {
            var hash = Revocable.hashMsg(msg);
            if (!i) {
                prevHash = hash;
                result.push(msg);
                if (msg[0] === 'ADD') { moderators.push(msg[2]); } // Add moderator key
                return;
            }
            if (msg[1] !== prevHash) { return; } // Invalid: ignore

            // Check moderator key and signature
            var _msg = msg.slice(0,-2);
            var edPublic = msg[msg.length-1];
            var signature = msg[msg.length-2];
            if (!moderators.includes(edPublic)) { return; }
            var check = Revocable.checkLog(_msg, edPublic, signature);
            if (!check) { return; }

            // Update moderators keys from "ADD" and "REMOVE" log
            if (msg[0] === 'ADD' && !moderators.includes(msg[2])) { moderators.push(msg[2]); }
            if (msg[0] === 'REMOVE' && moderators.includes(msg[2])) {
                moderators.splice(moderators.indexOf(msg[2]), 1);
            }

            prevHash = hash;
            result.push(msg);
        });


        // XXX make sure "moderators" matches the md.access data

        return result;
    };

    // Mailbox
    var RIGHTS = {
        r: 'viewer',
        w: 'editor',
        m: 'moderator'
    };
    // Send missing keys to the user
    Revocable.getUpgradeMessage = function (docKeys, newAccess, oldAccess) {
        if (!newAccess) { return; } // Revoke
        if (!oldAccess) { return; } // Create
        var oldR = oldAccess.rights || 'r';
        var newR = newAccess.rights || 'r';
        var toSend = {};
        newR.split('').forEach(function (key) {
            if (oldR.includes(key)) { return; } // they already have this seed
            if (!RIGHTS[key]) { return; } // no destroy seed
            var type = RIGHTS[key];
            if (!docKeys[type]) { return; } // make sure I know this key
            toSend[type] = docKeys[type];
        });
        if (!Object.keys(toSend).length) { return; }
        return toSend;
    };

    Revocable.rotateMailboxes = function (md, crypto, from, docKeys) {

        var error = false;
        var all = Object.keys(md.access || {}).map(function (ed) {
            var access = md.access[ed];
            var clone = JSON.parse(JSON.stringify(docKeys));
            var rights = access.rights;
            if (!Revocable.isModerator(rights)) { delete clone.moderator; }
            if (!Revocable.isEditor(rights)) { delete clone.editor; }
            try {
                var chan = crypto.decrypt(access.mailbox, true, true);
                var curve = access.curvePublic;
                return {
                    type: "ROTATE",
                    msg: clone,
                    user: {
                        channel: chan,
                        curvePublic: curve
                    }, // send to
                    keys: from // send from
                };
            } catch (e) {
                error = true;
                console.error(e);
                return true;
            }


        });
        if (error) { return; }
        return all;
    };


    Revocable.createMailbox = function (type, fromKeys, docKeys, rights) {
        if (!Revocable.isValidRights(rights)) { return; }
        var mailbox = Hash.getRevocable(type);
        var clone = JSON.parse(JSON.stringify(docKeys));
        if (!Revocable.isModerator(rights)) { delete clone.moderator; }
        if (!Revocable.isEditor(rights)) { delete clone.editor; }
        var initMsg = {
            type: "INIT",
            msg: {
                doc: clone,
                edPublic: mailbox.keys.edPublic,
                edPrivate: mailbox.keys.edPrivate,
            },
            user: mailbox, // send to
            keys: fromKeys // send from
        };
        return {
            rights: rights,
            initMsg: initMsg,
            mailbox: mailbox,
            edPublic: mailbox.keys.edPublic
        };
    };
    Revocable.createAccess = function (type, user, notes, encryptSym, encryptAsym, contact) {
        if (!Revocable.isValidRights(user.rights)) { return; }
        notes.hash = Hash.getRevocableHashFromKeys(type, user.mailbox);
        var access = {
            rights: user.rights,
            mailbox: encryptSym(user.mailbox.channel),
            curvePublic: user.mailbox.curvePublic,
            notes: encryptAsym(JSON.stringify(notes))
        };
        if (contact) { access.contact = encryptSym(contact); }
        return access;
    };


    // Authentication

    var addSlashes = function (str) {
        return str.replace(/\-/g, '/');
    };
    var u8_concat = function (A) {
        // expect a list of uint8Arrays
        var length = 0;
        A.forEach(function (a) { length += a.length; });
        var total = new Uint8Array(length);

        var offset = 0;
        A.forEach(function (a) {
            total.set(a, offset);
            offset += a.length;
        });
        return total;
    };

    var checkAccess = function (channel, userId, signature, md, type) {
        if (!md.access) { return true; }
        var edPublic = signature.key;
        var access = md.access[edPublic];
        // Reject if key is not allowed
        if (!access || !access.rights.includes(type)) {
            return false;
        }
        // If allowed, check signature
        return Revocable.checkLog([channel, userId], signature.key, signature.sig);
    };
    Revocable.checkRead = function (channel, userId, signature, md) {
        return checkAccess(channel, userId, signature, md, 'r');
    };
    Revocable.checkWrite = function (channel, userId, signature, md) {
        return checkAccess(channel, userId, signature, md, 'w');
    };

    Revocable.creatorAuth = function (channel, userId, edPrivate) { // XXX DEPRECATED
        var msg = channel + userId;

        // Get encrypted content
        var msgBytes = Nacl.util.decodeUTF8(msg);
        var myKey = Nacl.util.decodeBase64(edPrivate);

        var cipher = Nacl.box(msgBytes, nonce, theirKey, myKey);

        // Bundle with nonce
        var bundle = u8_concat([nonce, cipher]);

        // Return results as base64
        return Nacl.util.encodeBase64(bundle);
    };
    Revocable.creatorCheck = function (channel, userId, bundle, myPrivate, theirPublic) { // XXX DEPRECATED
        var expected = channel + userId;

        // Get encrypted content
        var bundleBytes = Nacl.util.decodeBase64(bundle);
        var nonce = bundleBytes.subarray(0, 24);
        var cipher = bundleBytes.subarray(24, bundle.length);
        var myKey = myPrivate;
        var theirKey = Nacl.util.decodeBase64(addSlashes(theirPublic)); // theirPublic = chanId
        var content = Nacl.box.open(cipher, nonce, theirKey, myKey);

        // Compare with expected result
        console.error(channel, Nacl.util.encodeUTF8(content) === expected);
        return Nacl.util.encodeUTF8(content) === expected;
    };

    // Util

    Revocable.hashBytes = function (bytes) {
        try {
            var hash = Nacl.hash(bytes);
            return Nacl.util.encodeBase64(hash);
        } catch (e) {
            return;
        }
    };
    Revocable.hashMsg = function (msg) {
        try {
            return Revocable.hashBytes(Nacl.util.decodeUTF8(JSON.stringify(msg)));
        } catch (e) {
            return;
        }
    };
    Revocable.getCpId = function (msg) {
        try {
            return Nacl.util.encodeBase64(Nacl.hash(Nacl.util.decodeUTF8(msg)).slice(0, 8));
        } catch (e) {
            return;
        }
    };


    return Revocable;
};

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(
            require("../../www/common/common-hash"),
            require("tweetnacl/nacl-fast")
        );
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/common/common-hash.js',
            '/bower_components/tweetnacl/nacl-fast.min.js'
        ], function (Hash) {
            return factory(Hash, window.nacl);
        });
    } else {
        // unsupported initialization
    }
}(typeof(window) !== 'undefined'? window : {}));
