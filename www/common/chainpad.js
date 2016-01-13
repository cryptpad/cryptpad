(function(){
var r=function(){var e="function"==typeof require&&require,r=function(i,o,u){o||(o=0);var n=r.resolve(i,o),t=r.m[o][n];if(!t&&e){if(t=e(n))return t}else if(t&&t.c&&(o=t.c,n=t.m,t=r.m[o][t.m],!t))throw new Error('failed to require "'+n+'" from '+o);if(!t)throw new Error('failed to require "'+i+'" from '+u);return t.exports||(t.exports={},t.call(t.exports,t,t.exports,r.relative(n,o))),t.exports};return r.resolve=function(e,n){var i=e,t=e+".js",o=e+"/index.js";return r.m[n][t]&&t?t:r.m[n][o]&&o?o:i},r.relative=function(e,t){return function(n){if("."!=n.charAt(0))return r(n,t,e);var o=e.split("/"),f=n.split("/");o.pop();for(var i=0;i<f.length;i++){var u=f[i];".."==u?o.pop():"."!=u&&o.push(u)}return r(o.join("/"),t,e)}},r}();r.m = [];
r.m[0] = {
"Patch.js": function(module, exports, require){
/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var Common = require('./Common');
var Operation = require('./Operation');
var Sha = require('./SHA256');

var Patch = module.exports;

var create = Patch.create = function (parentHash) {
    return {
        type: 'Patch',
        operations: [],
        parentHash: parentHash
    };
};

var check = Patch.check = function (patch, docLength_opt) {
    Common.assert(patch.type === 'Patch');
    Common.assert(Array.isArray(patch.operations));
    Common.assert(/^[0-9a-f]{64}$/.test(patch.parentHash));
    for (var i = patch.operations.length - 1; i >= 0; i--) {
        Operation.check(patch.operations[i], docLength_opt);
        if (i > 0) {
            Common.assert(!Operation.shouldMerge(patch.operations[i], patch.operations[i-1]));
        }
        if (typeof(docLength_opt) === 'number') {
            docLength_opt += Operation.lengthChange(patch.operations[i]);
        }
    }
};

var toObj = Patch.toObj = function (patch) {
    if (Common.PARANOIA) { check(patch); }
    var out = new Array(patch.operations.length+1);
    var i;
    for (i = 0; i < patch.operations.length; i++) {
        out[i] = Operation.toObj(patch.operations[i]);
    }
    out[i] = patch.parentHash;
    return out;
};

var fromObj = Patch.fromObj = function (obj) {
    Common.assert(Array.isArray(obj) && obj.length > 0);
    var patch = create();
    var i;
    for (i = 0; i < obj.length-1; i++) {
        patch.operations[i] = Operation.fromObj(obj[i]);
    }
    patch.parentHash = obj[i];
    if (Common.PARANOIA) { check(patch); }
    return patch;
};

var hash = function (text) {
    return Sha.hex_sha256(text);
};

var addOperation = Patch.addOperation = function (patch, op) {
    if (Common.PARANOIA) {
        check(patch);
        Operation.check(op);
    }
    for (var i = 0; i < patch.operations.length; i++) {
        if (Operation.shouldMerge(patch.operations[i], op)) {
            op = Operation.merge(patch.operations[i], op);
            patch.operations.splice(i,1);
            if (op === null) {
                //console.log("operations cancelled eachother");
                return;
            }
            i--;
        } else {
            var out = Operation.rebase(patch.operations[i], op);
            if (out === op) {
                // op could not be rebased further, insert it here to keep the list ordered.
                patch.operations.splice(i,0,op);
                return;
            } else {
                op = out;
                // op was rebased, try rebasing it against the next operation.
            }
        }
    }
    patch.operations.push(op);
    if (Common.PARANOIA) { check(patch); }
};

var clone = Patch.clone = function (patch) {
    if (Common.PARANOIA) { check(patch); }
    var out = create();
    out.parentHash = patch.parentHash;
    for (var i = 0; i < patch.operations.length; i++) {
        out.operations[i] = Operation.clone(patch.operations[i]);
    }
    return out;
};

var merge = Patch.merge = function (oldPatch, newPatch) {
    if (Common.PARANOIA) {
        check(oldPatch);
        check(newPatch);
    }
    oldPatch = clone(oldPatch);
    for (var i = newPatch.operations.length-1; i >= 0; i--) {
        addOperation(oldPatch, newPatch.operations[i]);
    }
    return oldPatch;
};

var apply = Patch.apply = function (patch, doc)
{
    if (Common.PARANOIA) {
        check(patch);
        Common.assert(typeof(doc) === 'string');
        Common.assert(Sha.hex_sha256(doc) === patch.parentHash);
    }
    var newDoc = doc;
    for (var i = patch.operations.length-1; i >= 0; i--) {
        newDoc = Operation.apply(patch.operations[i], newDoc);
    }
    return newDoc;
};

var lengthChange = Patch.lengthChange = function (patch)
{
    if (Common.PARANOIA) { check(patch); }
    var out = 0;
    for (var i = 0; i < patch.operations.length; i++) {
        out += Operation.lengthChange(patch.operations[i]);
    }
    return out;
};

var invert = Patch.invert = function (patch, doc)
{
    if (Common.PARANOIA) {
        check(patch);
        Common.assert(typeof(doc) === 'string');
        Common.assert(Sha.hex_sha256(doc) === patch.parentHash);
    }
    var rpatch = create();
    var newDoc = doc;
    for (var i = patch.operations.length-1; i >= 0; i--) {
        rpatch.operations[i] = Operation.invert(patch.operations[i], newDoc);
        newDoc = Operation.apply(patch.operations[i], newDoc);
    }
    for (var i = rpatch.operations.length-1; i >= 0; i--) {
        for (var j = i - 1; j >= 0; j--) {
            rpatch.operations[i].offset += rpatch.operations[j].toRemove;
            rpatch.operations[i].offset -= rpatch.operations[j].toInsert.length;
        }
    }
    rpatch.parentHash = Sha.hex_sha256(newDoc);
    if (Common.PARANOIA) { check(rpatch); }
    return rpatch;
};

var simplify = Patch.simplify = function (patch, doc, operationSimplify)
{
    if (Common.PARANOIA) {
        check(patch);
        Common.assert(typeof(doc) === 'string');
        Common.assert(Sha.hex_sha256(doc) === patch.parentHash);
    }
    operationSimplify = operationSimplify || Operation.simplify;
    var spatch = create(patch.parentHash);
    var newDoc = doc;
    var outOps = [];
    var j = 0;
    for (var i = patch.operations.length-1; i >= 0; i--) {
        outOps[j] = operationSimplify(patch.operations[i], newDoc, Operation.simplify);
        if (outOps[j]) {
            newDoc = Operation.apply(outOps[j], newDoc);
            j++;
        }
    }
    spatch.operations = outOps.reverse();
    if (!spatch.operations[0]) {
        spatch.operations.shift();
    }
    if (Common.PARANOIA) {
        check(spatch);
    }
    return spatch;
};

var equals = Patch.equals = function (patchA, patchB) {
    if (patchA.operations.length !== patchB.operations.length) { return false; }
    for (var i = 0; i < patchA.operations.length; i++) {
        if (!Operation.equals(patchA.operations[i], patchB.operations[i])) { return false; }
    }
    return true;
};

var transform = Patch.transform = function (origToTransform, transformBy, doc, transformFunction) {
    if (Common.PARANOIA) {
        check(origToTransform, doc.length);
        check(transformBy, doc.length);
        Common.assert(Sha.hex_sha256(doc) === origToTransform.parentHash);
    }
    Common.assert(origToTransform.parentHash === transformBy.parentHash);
    var resultOfTransformBy = apply(transformBy, doc);

    toTransform = clone(origToTransform);
    var text = doc;
    for (var i = toTransform.operations.length-1; i >= 0; i--) {
        text = Operation.apply(toTransform.operations[i], text);
        for (var j = transformBy.operations.length-1; j >= 0; j--) {
            toTransform.operations[i] = Operation.transform(text,
                                                            toTransform.operations[i],
                                                            transformBy.operations[j],
                                                            transformFunction);
            if (!toTransform.operations[i]) {
                break;
            }
        }
        if (Common.PARANOIA && toTransform.operations[i]) {
            Operation.check(toTransform.operations[i], resultOfTransformBy.length);
        }
    }
    var out = create(transformBy.parentHash);
    for (var i = toTransform.operations.length-1; i >= 0; i--) {
        if (toTransform.operations[i]) {
            addOperation(out, toTransform.operations[i]);
        }
    }

    out.parentHash = Sha.hex_sha256(resultOfTransformBy);

    if (Common.PARANOIA) {
        check(out, resultOfTransformBy.length);
    }
    return out;
};

var random = Patch.random = function (doc, opCount) {
    Common.assert(typeof(doc) === 'string');
    opCount = opCount || (Math.floor(Math.random() * 30) + 1);
    var patch = create(Sha.hex_sha256(doc));
    var docLength = doc.length;
    while (opCount-- > 0) {
        var op = Operation.random(docLength);
        docLength += Operation.lengthChange(op);
        addOperation(patch, op);
    }
    check(patch);
    return patch;
};

},
"SHA256.js": function(module, exports, require){
/* A JavaScript implementation of the Secure Hash Algorithm, SHA-256
 * Version 0.3 Copyright Angel Marin 2003-2004 - http://anmar.eu.org/
 * Distributed under the BSD License
 * Some bits taken from Paul Johnston's SHA-1 implementation
 */
(function () {
    var chrsz = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode  */
    function safe_add (x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }
    function S (X, n) {return ( X >>> n ) | (X << (32 - n));}
    function R (X, n) {return ( X >>> n );}
    function Ch(x, y, z) {return ((x & y) ^ ((~x) & z));}
    function Maj(x, y, z) {return ((x & y) ^ (x & z) ^ (y & z));}
    function Sigma0256(x) {return (S(x, 2) ^ S(x, 13) ^ S(x, 22));}
    function Sigma1256(x) {return (S(x, 6) ^ S(x, 11) ^ S(x, 25));}
    function Gamma0256(x) {return (S(x, 7) ^ S(x, 18) ^ R(x, 3));}
    function Gamma1256(x) {return (S(x, 17) ^ S(x, 19) ^ R(x, 10));}
    function newArray (n) {
        var a = [];
        for (;n>0;n--) {
            a.push(undefined);
        }
        return a;
    }
    function core_sha256 (m, l) {
        var K = [0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x6CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2];
        var HASH = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
        var W = newArray(64);
        var a, b, c, d, e, f, g, h, i, j;
        var T1, T2;
        /* append padding */
        m[l >> 5] |= 0x80 << (24 - l % 32);
        m[((l + 64 >> 9) << 4) + 15] = l;
        for ( var i = 0; i<m.length; i+=16 ) {
            a = HASH[0]; b = HASH[1]; c = HASH[2]; d = HASH[3];
            e = HASH[4]; f = HASH[5]; g = HASH[6]; h = HASH[7];
            for ( var j = 0; j<64; j++) {
                if (j < 16) {
                    W[j] = m[j + i];
                } else {
                    W[j] = safe_add(safe_add(safe_add(Gamma1256(
                        W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
                }
                T1 = safe_add(safe_add(safe_add(
                    safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
                T2 = safe_add(Sigma0256(a), Maj(a, b, c));
                h = g; g = f; f = e; e = safe_add(d, T1);
                d = c; c = b; b = a; a = safe_add(T1, T2);
            }
            HASH[0] = safe_add(a, HASH[0]); HASH[1] = safe_add(b, HASH[1]);
            HASH[2] = safe_add(c, HASH[2]); HASH[3] = safe_add(d, HASH[3]);
            HASH[4] = safe_add(e, HASH[4]); HASH[5] = safe_add(f, HASH[5]);
            HASH[6] = safe_add(g, HASH[6]); HASH[7] = safe_add(h, HASH[7]);
        }
        return HASH;
    }
    function str2binb (str) {
        var bin = Array();
        var mask = (1 << chrsz) - 1;
        for(var i = 0; i < str.length * chrsz; i += chrsz)
            bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
        return bin;
    }
    function binb2hex (binarray) {
        var hexcase = 0; /* hex output format. 0 - lowercase; 1 - uppercase */
        var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var str = "";
        for (var i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
                hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
        }
        return str;
    }
    function hex_sha256(s){
        return binb2hex(core_sha256(str2binb(s),s.length * chrsz));
    }
    module.exports.hex_sha256 = hex_sha256;
}());

},
"Common.js": function(module, exports, require){
/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var PARANOIA = module.exports.PARANOIA = false;

/* throw errors over non-compliant messages which would otherwise be treated as invalid */
var TESTING = module.exports.TESTING = true;

var assert = module.exports.assert = function (expr) {
    if (!expr) { throw new Error("Failed assertion"); }
};

var isUint = module.exports.isUint = function (integer) {
    return (typeof(integer) === 'number') &&
        (Math.floor(integer) === integer) &&
        (integer >= 0);
};

var randomASCII = module.exports.randomASCII = function (length) {
    var content = [];
    for (var i = 0; i < length; i++) {
        content[i] = String.fromCharCode( Math.floor(Math.random()*256) % 57 + 65 );
    }
    return content.join('');
};

var strcmp = module.exports.strcmp = function (a, b) {
    if (PARANOIA && typeof(a) !== 'string') { throw new Error(); }
    if (PARANOIA && typeof(b) !== 'string') { throw new Error(); }
    return ( (a === b) ? 0 : ( (a > b) ? 1 : -1 ) );
}

},
"Message.js": function(module, exports, require){
/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var Common = require('./Common');
var Operation = require('./Operation');
var Patch = require('./Patch');
var Sha = require('./SHA256');

var Message = module.exports;

var REGISTER     = Message.REGISTER     = 0;
var REGISTER_ACK = Message.REGISTER_ACK = 1;
var PATCH        = Message.PATCH        = 2;
var DISCONNECT   = Message.DISCONNECT   = 3;
var PING         = Message.PING         = 4;
var PONG         = Message.PONG         = 5;

var check = Message.check = function(msg) {
    Common.assert(msg.type === 'Message');
    Common.assert(typeof(msg.userName) === 'string');
    Common.assert(typeof(msg.authToken) === 'string');
    Common.assert(typeof(msg.channelId) === 'string');

    if (msg.messageType === PATCH) {
        Patch.check(msg.content);
        Common.assert(typeof(msg.lastMsgHash) === 'string');
    } else if (msg.messageType === PING || msg.messageType === PONG) {
        Common.assert(typeof(msg.lastMsgHash) === 'undefined');
        Common.assert(typeof(msg.content) === 'number');
    } else if (msg.messageType === REGISTER
        || msg.messageType === REGISTER_ACK
        || msg.messageType === DISCONNECT)
    {
        Common.assert(typeof(msg.lastMsgHash) === 'undefined');
        Common.assert(typeof(msg.content) === 'undefined');
    } else {
        throw new Error("invalid message type [" + msg.messageType + "]");
    }
};

var create = Message.create = function (userName, authToken, channelId, type, content, lastMsgHash) {
    var msg = {
        type: 'Message',
        userName: userName,
        authToken: authToken,
        channelId: channelId,
        messageType: type,
        content: content,
        lastMsgHash: lastMsgHash
    };
    if (Common.PARANOIA) { check(msg); }
    return msg;
};

var toString = Message.toString = function (msg) {
    if (Common.PARANOIA) { check(msg); }
    var prefix = msg.messageType + ':';
    var content = '';
    if (msg.messageType === REGISTER) {
        content = JSON.stringify([REGISTER]);
    } else if (msg.messageType === PING || msg.messageType === PONG) {
        content = JSON.stringify([msg.messageType, msg.content]);
    } else if (msg.messageType === PATCH) {
        content = JSON.stringify([PATCH, Patch.toObj(msg.content), msg.lastMsgHash]);
    }
    return msg.authToken.length + ":" + msg.authToken +
        msg.userName.length + ":" + msg.userName +
        msg.channelId.length + ":" + msg.channelId +
        content.length + ':' + content;
};

var fromString = Message.fromString = function (str) {
    var msg = str;

    var unameLen = msg.substring(0,msg.indexOf(':'));
    msg = msg.substring(unameLen.length+1);
    var userName = msg.substring(0,Number(unameLen));
    msg = msg.substring(userName.length);

    var channelIdLen = msg.substring(0,msg.indexOf(':'));
    msg = msg.substring(channelIdLen.length+1);
    var channelId = msg.substring(0,Number(channelIdLen));
    msg = msg.substring(channelId.length);

    var contentStrLen = msg.substring(0,msg.indexOf(':'));
    msg = msg.substring(contentStrLen.length+1);
    var contentStr = msg.substring(0,Number(contentStrLen));

    Common.assert(contentStr.length === Number(contentStrLen));

    var content = JSON.parse(contentStr);
    var message;
    if (content[0] === PATCH) {
        message = create(userName, '', channelId, PATCH, Patch.fromObj(content[1]), content[2]);
    } else if (content[0] === PING || content[0] === PONG) {
        message = create(userName, '', channelId, content[0], content[1]);
    } else {
        message = create(userName, '', channelId, content[0]);
    }

    // This check validates every operation in the patch.
    check(message);

    return message
};

var hashOf = Message.hashOf = function (msg) {
    if (Common.PARANOIA) { check(msg); }
    var authToken = msg.authToken;
    msg.authToken = '';
    var hash = Sha.hex_sha256(toString(msg));
    msg.authToken = authToken;
    return hash;
};

},
"ChainPad.js": function(module, exports, require){
/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var Common = require('./Common');
var Operation = require('./Operation');
var Patch = require('./Patch');
var Message = require('./Message');
var Sha = require('./SHA256');

var ChainPad = {};

// hex_sha256('')
var EMPTY_STR_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
var ZERO =           '0000000000000000000000000000000000000000000000000000000000000000';

var enterChainPad = function (realtime, func) {
    return function () {
        if (realtime.failed) { return; }
        func.apply(null, arguments);
    };
};

var debug = function (realtime, msg) {
    console.log("[" + realtime.userName + "]  " + msg);
};

var schedule = function (realtime, func, timeout) {
    if (!timeout) {
        timeout = Math.floor(Math.random() * 2 * realtime.avgSyncTime);
    }
    var to = setTimeout(enterChainPad(realtime, function () {
        realtime.schedules.splice(realtime.schedules.indexOf(to), 1);
        func();
    }), timeout);
    realtime.schedules.push(to);
    return to;
};

var unschedule = function (realtime, schedule) {
    var index = realtime.schedules.indexOf(schedule);
    if (index > -1) {
        realtime.schedules.splice(index, 1);
    }
    clearTimeout(schedule);
};

var onMessage = function (realtime, message, callback) {
    if (!realtime.messageHandlers.length) {
        callback("no onMessage() handler registered");
    }
    for (var i = 0; i < realtime.messageHandlers.length; i++) {
        realtime.messageHandlers[i](message, function () {
            callback.apply(null, arguments);
            callback = function () { };
        });
    }
};

var sync = function (realtime) {
    if (Common.PARANOIA) { check(realtime); }
    if (realtime.syncSchedule) {
        unschedule(realtime, realtime.syncSchedule);
        realtime.syncSchedule = null;
    } else {
        // we're currently waiting on something from the server.
        return;
    }

    realtime.uncommitted = Patch.simplify(
        realtime.uncommitted, realtime.authDoc, realtime.config.operationSimplify);

    if (realtime.uncommitted.operations.length === 0) {
        //debug(realtime, "No data to sync to the server, sleeping");
        realtime.syncSchedule = schedule(realtime, function () { sync(realtime); });
        return;
    }

    var msg;
    if (realtime.best === realtime.initialMessage) {
        msg = realtime.initialMessage;
    } else {
        msg = Message.create(realtime.userName,
                             realtime.authToken,
                             realtime.channelId,
                             Message.PATCH,
                             realtime.uncommitted,
                             realtime.best.hashOf);
    }

    var strMsg = Message.toString(msg);

    onMessage(realtime, strMsg, function (err) {
        if (err) {
            debug(realtime, "Posting to server failed [" + err + "]");
        }
    });

    var hash = Message.hashOf(msg);

    var timeout = schedule(realtime, function () {
        debug(realtime, "Failed to send message ["+hash+"] to server");
        sync(realtime);
    }, 10000 + (Math.random() * 5000));
    realtime.pending = {
        hash: hash,
        callback: function () {
            if (realtime.initialMessage && realtime.initialMessage.hashOf === hash) {
                debug(realtime, "initial Ack received ["+hash+"]");
                realtime.initialMessage = null;
            }
            unschedule(realtime, timeout);
            realtime.syncSchedule = schedule(realtime, function () { sync(realtime); }, 0);
        }
    };
    if (Common.PARANOIA) { check(realtime); }
};

var getMessages = function (realtime) {
    realtime.registered = true;
    /*var to = schedule(realtime, function () {
        throw new Error("failed to connect to the server");
    }, 5000);*/
    var msg = Message.create(realtime.userName,
                             realtime.authToken,
                             realtime.channelId,
                             Message.REGISTER);
    onMessage(realtime, Message.toString(msg), function (err) {
        if (err) { throw err; }
    });
};

var sendPing = function (realtime) {
    realtime.pingSchedule = undefined;
    realtime.lastPingTime = (new Date()).getTime();
    var msg = Message.create(realtime.userName,
                             realtime.authToken,
                             realtime.channelId,
                             Message.PING,
                             realtime.lastPingTime);
    onMessage(realtime, Message.toString(msg), function (err) {
        if (err) { throw err; }
    });
};

var onPong = function (realtime, msg) {
    if (Common.PARANOIA) {
        Common.assert(realtime.lastPingTime === Number(msg.content));
    }
    realtime.lastPingLag = (new Date()).getTime() - Number(msg.content);
    realtime.lastPingTime = 0;
    realtime.pingSchedule =
        schedule(realtime, function () { sendPing(realtime); }, realtime.pingCycle);
};

var create = ChainPad.create = function (userName, authToken, channelId, initialState, config) {

    var realtime = {
        type: 'ChainPad',

        authDoc: '',

        config: config || {},

        userName: userName,
        authToken: authToken,
        channelId: channelId,

        /** A patch representing all uncommitted work. */
        uncommitted: null,

        uncommittedDocLength: initialState.length,

        patchHandlers: [],
        opHandlers: [],

        messageHandlers: [],

        schedules: [],

        syncSchedule: null,

        registered: false,

        avgSyncTime: 100,

        // this is only used if PARANOIA is enabled.
        userInterfaceContent: undefined,

        failed: false,

        // hash and callback for previously send patch, currently in flight.
        pending: null,

        messages: {},
        messagesByParent: {},

        rootMessage: null,

        /**
         * Set to the message which sets the initialState if applicable.
         * Reset to null after the initial message has been successfully broadcasted.
         */
        initialMessage: null,

        userListChangeHandlers: [],
        userList: [],

        /** The schedule() for sending pings. */
        pingSchedule: undefined,

        lastPingLag: 0,
        lastPingTime: 0,

        /** Average number of milliseconds between pings. */
        pingCycle: 5000
    };

    if (Common.PARANOIA) {
        realtime.userInterfaceContent = initialState;
    }

    var zeroPatch = Patch.create(EMPTY_STR_HASH);
    zeroPatch.inverseOf = Patch.invert(zeroPatch, '');
    zeroPatch.inverseOf.inverseOf = zeroPatch;
    var zeroMsg = Message.create('', '', channelId, Message.PATCH, zeroPatch, ZERO);
    zeroMsg.hashOf = Message.hashOf(zeroMsg);
    zeroMsg.parentCount = 0;
    realtime.messages[zeroMsg.hashOf] = zeroMsg;
    (realtime.messagesByParent[zeroMsg.lastMessageHash] || []).push(zeroMsg);
    realtime.rootMessage = zeroMsg;
    realtime.best = zeroMsg;

    if (initialState === '') {
        realtime.uncommitted = Patch.create(zeroPatch.inverseOf.parentHash);
        return realtime;
    }

    var initialOp = Operation.create(0, 0, initialState);
    var initialStatePatch = Patch.create(zeroPatch.inverseOf.parentHash);
    Patch.addOperation(initialStatePatch, initialOp);
    initialStatePatch.inverseOf = Patch.invert(initialStatePatch, '');
    initialStatePatch.inverseOf.inverseOf = initialStatePatch;

    // flag this patch so it can be handled specially.
    // Specifically, we never treat an initialStatePatch as our own,
    // we let it be reverted to prevent duplication of data.
    initialStatePatch.isInitialStatePatch = true;
    initialStatePatch.inverseOf.isInitialStatePatch = true;

    realtime.authDoc = initialState;
    if (Common.PARANOIA) {
        realtime.userInterfaceContent = initialState;
    }
    initialMessage = Message.create(realtime.userName,
                                    realtime.authToken,
                                    realtime.channelId,
                                    Message.PATCH,
                                    initialStatePatch,
                                    zeroMsg.hashOf);
    initialMessage.hashOf = Message.hashOf(initialMessage);
    initialMessage.parentCount = 1;

    realtime.messages[initialMessage.hashOf] = initialMessage;
    (realtime.messagesByParent[initialMessage.lastMessageHash] || []).push(initialMessage);

    realtime.best = initialMessage;
    realtime.uncommitted = Patch.create(initialStatePatch.inverseOf.parentHash);
    realtime.initialMessage = initialMessage;

    return realtime;
};

var getParent = function (realtime, message) {
    return message.parent = message.parent || realtime.messages[message.lastMsgHash];
};

var check = ChainPad.check = function(realtime) {
    Common.assert(realtime.type === 'ChainPad');
    Common.assert(typeof(realtime.authDoc) === 'string');

    Patch.check(realtime.uncommitted, realtime.authDoc.length);

    var uiDoc = Patch.apply(realtime.uncommitted, realtime.authDoc);
    if (uiDoc.length !== realtime.uncommittedDocLength) {
        Common.assert(0);
    }
    if (realtime.userInterfaceContent !== '') {
        Common.assert(uiDoc === realtime.userInterfaceContent);
    }

    var doc = realtime.authDoc;
    var patchMsg = realtime.best;
    Common.assert(patchMsg.content.inverseOf.parentHash === realtime.uncommitted.parentHash);
    var patches = [];
    do {
        patches.push(patchMsg);
        doc = Patch.apply(patchMsg.content.inverseOf, doc);
    } while ((patchMsg = getParent(realtime, patchMsg)));
    Common.assert(doc === '');
    while ((patchMsg = patches.pop())) {
        doc = Patch.apply(patchMsg.content, doc);
    }
    Common.assert(doc === realtime.authDoc);
};

var doOperation = ChainPad.doOperation = function (realtime, op) {
    if (Common.PARANOIA) {
        check(realtime);
        realtime.userInterfaceContent = Operation.apply(op, realtime.userInterfaceContent);
    }
    Operation.check(op, realtime.uncommittedDocLength);
    Patch.addOperation(realtime.uncommitted, op);
    realtime.uncommittedDocLength += Operation.lengthChange(op);
};

var isAncestorOf = function (realtime, ancestor, decendent) {
    if (!decendent || !ancestor) { return false; }
    if (ancestor === decendent) { return true; }
    return isAncestorOf(realtime, ancestor, getParent(realtime, decendent));
};

var parentCount = function (realtime, message) {
    if (typeof(message.parentCount) !== 'number') {
        message.parentCount = parentCount(realtime, getParent(realtime, message)) + 1;
    }
    return message.parentCount;
};

var applyPatch = function (realtime, author, patch) {
    if (author === realtime.userName && !patch.isInitialStatePatch) {
        var inverseOldUncommitted = Patch.invert(realtime.uncommitted, realtime.authDoc);
        var userInterfaceContent = Patch.apply(realtime.uncommitted, realtime.authDoc);
        if (Common.PARANOIA) {
            Common.assert(userInterfaceContent === realtime.userInterfaceContent);
        }
        realtime.uncommitted = Patch.merge(inverseOldUncommitted, patch);
        realtime.uncommitted = Patch.invert(realtime.uncommitted, userInterfaceContent);

    } else {
        realtime.uncommitted =
            Patch.transform(
                realtime.uncommitted, patch, realtime.authDoc, realtime.config.transformFunction);
    }
    realtime.uncommitted.parentHash = patch.inverseOf.parentHash;

    realtime.authDoc = Patch.apply(patch, realtime.authDoc);

    if (Common.PARANOIA) {
        realtime.userInterfaceContent = Patch.apply(realtime.uncommitted, realtime.authDoc);
    }
};

var revertPatch = function (realtime, author, patch) {
    applyPatch(realtime, author, patch.inverseOf);
};

var getBestChild = function (realtime, msg) {
    var best = msg;
    (realtime.messagesByParent[msg.hashOf] || []).forEach(function (child) {
        Common.assert(child.lastMsgHash === msg.hashOf);
        child = getBestChild(realtime, child);
        if (parentCount(realtime, child) > parentCount(realtime, best)) { best = child; }
    });
    return best;
};

var userListChange = function (realtime) {
    for (var i = 0; i < realtime.userListChangeHandlers.length; i++) {
        var list = [];
        list.push.apply(list, realtime.userList);
        realtime.userListChangeHandlers[i](list);
    }
};

var handleMessage = ChainPad.handleMessage = function (realtime, msgStr) {

    if (Common.PARANOIA) { check(realtime); }
    var msg = Message.fromString(msgStr);
    Common.assert(msg.channelId === realtime.channelId);

    if (msg.messageType === Message.REGISTER_ACK) {
        debug(realtime, "registered");
        realtime.registered = true;
        sendPing(realtime);
        return;
    }

    if (msg.messageType === Message.REGISTER) {
        realtime.userList.push(msg.userName);
        userListChange(realtime);
        return;
    }

    if (msg.messageType === Message.PONG) {
        onPong(realtime, msg);
        return;
    }

    if (msg.messageType === Message.DISCONNECT) {
        if (msg.userName === '') {
            realtime.userList = [];
            userListChange(realtime);
            return;
        }
        var idx = realtime.userList.indexOf(msg.userName);
        if (Common.PARANOIA) { Common.assert(idx > -1); }
        if (idx > -1) {
            realtime.userList.splice(idx, 1);
            userListChange(realtime);
        }
        return;
    }

    // otherwise it's a disconnect.
    if (msg.messageType !== Message.PATCH) { return; }

    msg.hashOf = Message.hashOf(msg);

    if (realtime.pending && realtime.pending.hash === msg.hashOf) {
        realtime.pending.callback();
        realtime.pending = null;
    }

    if (realtime.messages[msg.hashOf]) {
        debug(realtime, "Patch [" + msg.hashOf + "] is already known");
        if (Common.PARANOIA) { check(realtime); }
        return;
    }

    realtime.messages[msg.hashOf] = msg;
    (realtime.messagesByParent[msg.lastMsgHash] =
        realtime.messagesByParent[msg.lastMsgHash] || []).push(msg);

    if (!isAncestorOf(realtime, realtime.rootMessage, msg)) {
        // we'll probably find the missing parent later.
        debug(realtime, "Patch [" + msg.hashOf + "] not connected to root");
        if (Common.PARANOIA) { check(realtime); }
        return;
    }

    // of this message fills in a hole in the chain which makes another patch better, swap to the
    // best child of this patch since longest chain always wins.
    msg = getBestChild(realtime, msg);
    var patch = msg.content;

    // Find the ancestor of this patch which is in the main chain, reverting as necessary
    var toRevert = [];
    var commonAncestor = realtime.best;
    if (!isAncestorOf(realtime, realtime.best, msg)) {
        var pcBest = parentCount(realtime, realtime.best);
        var pcMsg = parentCount(realtime, msg);
        if (pcBest < pcMsg
          || (pcBest === pcMsg
            && Common.strcmp(realtime.best.hashOf, msg.hashOf) > 0))
        {
            // switch chains
            while (commonAncestor && !isAncestorOf(realtime, commonAncestor, msg)) {
                toRevert.push(commonAncestor);
                commonAncestor = getParent(realtime, commonAncestor);
            }
            Common.assert(commonAncestor);
        } else {
            debug(realtime, "Patch [" + msg.hashOf + "] chain is ["+pcMsg+"] best chain is ["+pcBest+"]");
            if (Common.PARANOIA) { check(realtime); }
            return;
        }
    }

    // Find the parents of this patch which are not in the main chain.
    var toApply = [];
    var current = msg;
    do {
        toApply.unshift(current);
        current = getParent(realtime, current);
        Common.assert(current);
    } while (current !== commonAncestor);


    var authDocAtTimeOfPatch = realtime.authDoc;

    for (var i = 0; i < toRevert.length; i++) {
        authDocAtTimeOfPatch = Patch.apply(toRevert[i].content.inverseOf, authDocAtTimeOfPatch);
    }

    // toApply.length-1 because we do not want to apply the new patch.
    for (var i = 0; i < toApply.length-1; i++) {
        if (typeof(toApply[i].content.inverseOf) === 'undefined') {
            toApply[i].content.inverseOf = Patch.invert(toApply[i].content, authDocAtTimeOfPatch);
            toApply[i].content.inverseOf.inverseOf = toApply[i].content;
        }
        authDocAtTimeOfPatch = Patch.apply(toApply[i].content, authDocAtTimeOfPatch);
    }

    if (Sha.hex_sha256(authDocAtTimeOfPatch) !== patch.parentHash) {
        debug(realtime, "patch [" + msg.hashOf + "] parentHash is not valid");
        if (Common.PARANOIA) { check(realtime); }
        if (Common.TESTING) { throw new Error(); }
        delete realtime.messages[msg.hashOf];
        return;
    }

    var simplePatch =
        Patch.simplify(patch, authDocAtTimeOfPatch, realtime.config.operationSimplify);
    if (!Patch.equals(simplePatch, patch)) {
        debug(realtime, "patch [" + msg.hashOf + "] can be simplified");
        if (Common.PARANOIA) { check(realtime); }
        if (Common.TESTING) { throw new Error(); }
        delete realtime.messages[msg.hashOf];
        return;
    }

    patch.inverseOf = Patch.invert(patch, authDocAtTimeOfPatch);
    patch.inverseOf.inverseOf = patch;

    realtime.uncommitted = Patch.simplify(
        realtime.uncommitted, realtime.authDoc, realtime.config.operationSimplify);
    var oldUserInterfaceContent = Patch.apply(realtime.uncommitted, realtime.authDoc);
    if (Common.PARANOIA) {
        Common.assert(oldUserInterfaceContent === realtime.userInterfaceContent);
    }

    // Derive the patch for the user's uncommitted work
    var uncommittedPatch = Patch.invert(realtime.uncommitted, realtime.authDoc);

    for (var i = 0; i < toRevert.length; i++) {
        debug(realtime, "reverting [" + toRevert[i].hashOf + "]");
        uncommittedPatch = Patch.merge(uncommittedPatch, toRevert[i].content.inverseOf);
        revertPatch(realtime, toRevert[i].userName, toRevert[i].content);
    }

    for (var i = 0; i < toApply.length; i++) {
        debug(realtime, "applying [" + toApply[i].hashOf + "]");
        uncommittedPatch = Patch.merge(uncommittedPatch, toApply[i].content);
        applyPatch(realtime, toApply[i].userName, toApply[i].content);
    }

    uncommittedPatch = Patch.merge(uncommittedPatch, realtime.uncommitted);
    uncommittedPatch = Patch.simplify(
        uncommittedPatch, oldUserInterfaceContent, realtime.config.operationSimplify);

    realtime.uncommittedDocLength += Patch.lengthChange(uncommittedPatch);
    realtime.best = msg;

    if (Common.PARANOIA) {
        // apply the uncommittedPatch to the userInterface content.
        var newUserInterfaceContent = Patch.apply(uncommittedPatch, oldUserInterfaceContent);
        Common.assert(realtime.userInterfaceContent.length === realtime.uncommittedDocLength);
        Common.assert(newUserInterfaceContent === realtime.userInterfaceContent);
    }

    if (uncommittedPatch.operations.length) {
        // push the uncommittedPatch out to the user interface.
        for (var i = 0; i < realtime.patchHandlers.length; i++) {
            realtime.patchHandlers[i](uncommittedPatch);
        }
        if (realtime.opHandlers.length) {
            for (var i = uncommittedPatch.operations.length-1; i >= 0; i--) {
                for (var j = 0; j < realtime.opHandlers.length; j++) {
                    realtime.opHandlers[j](uncommittedPatch.operations[i]);
                }
            }
        }
    }
    if (Common.PARANOIA) { check(realtime); }
};

var wasEverState = function (content, realtime) {
    Common.assert(typeof(content) === 'string');
    // without this we would never get true on the ^HEAD
    if (realtime.authDoc === content) {
        return true;
    }

    var hash = Sha.hex_sha256(content);

    var patchMsg = realtime.best;
    do {
        if (patchMsg.content.parentHash === hash) { return true; }
    } while ((patchMsg = getParent(realtime, patchMsg)));
    return false;
};

var getDepthOfState = function (content, minDepth, realtime) {
    Common.assert(typeof(content) === 'string');

    // minimum depth is an optional argument which defaults to zero
    var minDepth = minDepth || 0;

    if (minDepth === 0 && realtime.authDoc === content) {
        return 0;
    }

    var hash = Sha.hex_sha256(content);

    var patchMsg = realtime.best;
    var depth = 0;

    do {
        if (depth < minDepth) {
            // you haven't exceeded the minimum depth
        } else {
            //console.log("Exceeded minimum depth");
            // you *have* exceeded the minimum depth
            if (patchMsg.content.parentHash === hash) {
                // you found it!
                return depth + 1;
            }
        }
        depth++;
    } while ((patchMsg = getParent(realtime, patchMsg)));
    return;
};

module.exports.create = function (userName, authToken, channelId, initialState, conf) {
    Common.assert(typeof(userName) === 'string');
    Common.assert(typeof(authToken) === 'string');
    Common.assert(typeof(channelId) === 'string');
    Common.assert(typeof(initialState) === 'string');
    var realtime = ChainPad.create(userName, authToken, channelId, initialState, conf);
    return {
        onPatch: enterChainPad(realtime, function (handler) {
            Common.assert(typeof(handler) === 'function');
            realtime.patchHandlers.push(handler);
        }),
        onRemove: enterChainPad(realtime, function (handler) {
            Common.assert(typeof(handler) === 'function');
            realtime.opHandlers.unshift(function (op) {
                if (op.toRemove > 0) { handler(op.offset, op.toRemove); }
            });
        }),
        onInsert: enterChainPad(realtime, function (handler) {
            Common.assert(typeof(handler) === 'function');
            realtime.opHandlers.push(function (op) {
                if (op.toInsert.length > 0) { handler(op.offset, op.toInsert); }
            });
        }),
        remove: enterChainPad(realtime, function (offset, numChars) {
            doOperation(realtime, Operation.create(offset, numChars, ''));
        }),
        insert: enterChainPad(realtime, function (offset, str) {
            doOperation(realtime, Operation.create(offset, 0, str));
        }),
        onMessage: enterChainPad(realtime, function (handler) {
            Common.assert(typeof(handler) === 'function');
            realtime.messageHandlers.push(handler);
        }),
        message: enterChainPad(realtime, function (message) {
            handleMessage(realtime, message);
        }),
        start: enterChainPad(realtime, function () {
            getMessages(realtime);
            if (realtime.syncSchedule) { unschedule(realtime, realtime.syncSchedule); }
            realtime.syncSchedule = schedule(realtime, function () { sync(realtime); });
        }),
        abort: enterChainPad(realtime, function () {
            realtime.schedules.forEach(function (s) { clearTimeout(s) });
        }),
        sync: enterChainPad(realtime, function () {
            sync(realtime);
        }),
        getAuthDoc: function () { return realtime.authDoc; },
        getUserDoc: function () { return Patch.apply(realtime.uncommitted, realtime.authDoc); },
        onUserListChange: enterChainPad(realtime, function (handler) {
            Common.assert(typeof(handler) === 'function');
            realtime.userListChangeHandlers.push(handler);
        }),
        getLag: function () {
            if (realtime.lastPingTime) {
                return { waiting:1, lag: (new Date()).getTime() - realtime.lastPingTime };
            }
            return { waiting:0, lag: realtime.lastPingLag };
        },
        wasEverState: function (content) {
            return wasEverState(content, realtime);
        },
        getDepthOfState: function (content, minDepth) {
            return getDepthOfState(content, minDepth, realtime);
        }
    };
};

},
"Operation.js": function(module, exports, require){
/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var Common = require('./Common');

var Operation = module.exports;

var check = Operation.check = function (op, docLength_opt) {
    Common.assert(op.type === 'Operation');
    Common.assert(Common.isUint(op.offset));
    Common.assert(Common.isUint(op.toRemove));
    Common.assert(typeof(op.toInsert) === 'string');
    Common.assert(op.toRemove > 0 || op.toInsert.length > 0);
    Common.assert(typeof(docLength_opt) !== 'number' || op.offset + op.toRemove <= docLength_opt);
};

var create = Operation.create = function (offset, toRemove, toInsert) {
    var out = {
        type: 'Operation',
        offset: offset || 0,
        toRemove: toRemove || 0,
        toInsert: toInsert || '',
    };
    if (Common.PARANOIA) { check(out); }
    return out;
};

var toObj = Operation.toObj = function (op) {
    if (Common.PARANOIA) { check(op); }
    return [op.offset,op.toRemove,op.toInsert];
};

var fromObj = Operation.fromObj = function (obj) {
    Common.assert(Array.isArray(obj) && obj.length === 3);
    return create(obj[0], obj[1], obj[2]);
};

var clone = Operation.clone = function (op) {
    return create(op.offset, op.toRemove, op.toInsert);
};

/**
 * @param op the operation to apply.
 * @param doc the content to apply the operation on 
 */
var apply = Operation.apply = function (op, doc)
{
    if (Common.PARANOIA) {
        check(op);
        Common.assert(typeof(doc) === 'string');
        Common.assert(op.offset + op.toRemove <= doc.length);
    }
    return doc.substring(0,op.offset) + op.toInsert + doc.substring(op.offset + op.toRemove);
};

var invert = Operation.invert = function (op, doc) {
    if (Common.PARANOIA) {
        check(op);
        Common.assert(typeof(doc) === 'string');
        Common.assert(op.offset + op.toRemove <= doc.length);
    }
    var rop = clone(op);
    rop.toInsert = doc.substring(op.offset, op.offset + op.toRemove);
    rop.toRemove = op.toInsert.length;
    return rop;
};

var simplify = Operation.simplify = function (op, doc) {
    if (Common.PARANOIA) {
        check(op);
        Common.assert(typeof(doc) === 'string');
        Common.assert(op.offset + op.toRemove <= doc.length);
    }
    var rop = invert(op, doc);
    op = clone(op);

    var minLen = Math.min(op.toInsert.length, rop.toInsert.length);
    var i;
    for (i = 0; i < minLen && rop.toInsert[i] === op.toInsert[i]; i++) ;
    op.offset += i;
    op.toRemove -= i;
    op.toInsert = op.toInsert.substring(i);
    rop.toInsert = rop.toInsert.substring(i);

    if (rop.toInsert.length === op.toInsert.length) {
        for (i = rop.toInsert.length-1; i >= 0 && rop.toInsert[i] === op.toInsert[i]; i--) ;
        op.toInsert = op.toInsert.substring(0, i+1);
        op.toRemove = i+1;
    }

    if (op.toRemove === 0 && op.toInsert.length === 0) { return null; }
    return op;
};

var equals = Operation.equals = function (opA, opB) {
    return (opA.toRemove === opB.toRemove
        && opA.toInsert === opB.toInsert
        && opA.offset === opB.offset);
};

var lengthChange = Operation.lengthChange = function (op)
{
    if (Common.PARANOIA) { check(op); }
    return op.toInsert.length - op.toRemove;
};

/*
 * @return the merged operation OR null if the result of the merger is a noop.
 */
var merge = Operation.merge = function (oldOpOrig, newOpOrig) {
    if (Common.PARANOIA) {
        check(newOpOrig);
        check(oldOpOrig);
    }

    var newOp = clone(newOpOrig);
    var oldOp = clone(oldOpOrig);
    var offsetDiff = newOp.offset - oldOp.offset;

    if (newOp.toRemove > 0) {
        var origOldInsert = oldOp.toInsert;
        oldOp.toInsert = (
             oldOp.toInsert.substring(0,offsetDiff)
           + oldOp.toInsert.substring(offsetDiff + newOp.toRemove)
        );
        newOp.toRemove -= (origOldInsert.length - oldOp.toInsert.length);
        if (newOp.toRemove < 0) { newOp.toRemove = 0; }

        oldOp.toRemove += newOp.toRemove;
        newOp.toRemove = 0;
    }

    if (offsetDiff < 0) {
        oldOp.offset += offsetDiff;
        oldOp.toInsert = newOp.toInsert + oldOp.toInsert;

    } else if (oldOp.toInsert.length === offsetDiff) {
        oldOp.toInsert = oldOp.toInsert + newOp.toInsert;

    } else if (oldOp.toInsert.length > offsetDiff) {
        oldOp.toInsert = (
            oldOp.toInsert.substring(0,offsetDiff)
          + newOp.toInsert
          + oldOp.toInsert.substring(offsetDiff)
        );
    } else {
        throw new Error("should never happen\n" +
                        JSON.stringify([oldOpOrig,newOpOrig], null, '  '));
    }

    if (oldOp.toInsert === '' && oldOp.toRemove === 0) {
        return null;
    }
    if (Common.PARANOIA) { check(oldOp); }

    return oldOp;
};

/**
 * If the new operation deletes what the old op inserted or inserts content in the middle of
 * the old op's content or if they abbut one another, they should be merged.
 */
var shouldMerge = Operation.shouldMerge = function (oldOp, newOp) {
    if (Common.PARANOIA) {
        check(oldOp);
        check(newOp);
    }
    if (newOp.offset < oldOp.offset) {
        return (oldOp.offset <= (newOp.offset + newOp.toRemove));
    } else {
        return (newOp.offset <= (oldOp.offset + oldOp.toInsert.length));
    }
};

/**
 * Rebase newOp against oldOp.
 *
 * @param oldOp the eariler operation to have happened.
 * @param newOp the later operation to have happened (in time).
 * @return either the untouched newOp if it need not be rebased,
 *                the rebased clone of newOp if it needs rebasing, or
 *                null if newOp and oldOp must be merged.
 */
var rebase = Operation.rebase = function (oldOp, newOp) {
    if (Common.PARANOIA) {
        check(oldOp);
        check(newOp);
    }
    if (newOp.offset < oldOp.offset) { return newOp; }
    newOp = clone(newOp);
    newOp.offset += oldOp.toRemove;
    newOp.offset -= oldOp.toInsert.length;
    return newOp;
};

/**
 * this is a lossy and dirty algorithm, everything else is nice but transformation
 * has to be lossy because both operations have the same base and they diverge.
 * This could be made nicer and/or tailored to a specific data type.
 *
 * @param toTransform the operation which is converted *MUTATED*.
 * @param transformBy an existing operation which also has the same base.
 * @return toTransform *or* null if the result is a no-op.
 */
var transform0 = Operation.transform0 = function (text, toTransform, transformBy) {
    if (toTransform.offset > transformBy.offset) {
        if (toTransform.offset > transformBy.offset + transformBy.toRemove) {
            // simple rebase
            toTransform.offset -= transformBy.toRemove;
            toTransform.offset += transformBy.toInsert.length;
            return toTransform;
        }
        // goto the end, anything you deleted that they also deleted should be skipped.
        var newOffset = transformBy.offset + transformBy.toInsert.length;
        toTransform.toRemove = 0; //-= (newOffset - toTransform.offset);
        if (toTransform.toRemove < 0) { toTransform.toRemove = 0; }
        toTransform.offset = newOffset;
        if (toTransform.toInsert.length === 0 && toTransform.toRemove === 0) {
            return null;
        }
        return toTransform;
    }
    if (toTransform.offset + toTransform.toRemove < transformBy.offset) {
        return toTransform;
    }
    toTransform.toRemove = transformBy.offset - toTransform.offset;
    if (toTransform.toInsert.length === 0 && toTransform.toRemove === 0) {
        return null;
    }
    return toTransform;
};

/**
 * @param toTransform the operation which is converted
 * @param transformBy an existing operation which also has the same base.
 * @return a modified clone of toTransform *or* toTransform itself if no change was made.
 */
var transform = Operation.transform = function (text, toTransform, transformBy, transformFunction) {
    if (Common.PARANOIA) {
        check(toTransform);
        check(transformBy);
    }
    transformFunction = transformFunction || transform0;
    toTransform = clone(toTransform);
    var result = transformFunction(text, toTransform, transformBy);
    if (Common.PARANOIA && result) { check(result); }
    return result;
};

/** Used for testing. */
var random = Operation.random = function (docLength) {
    Common.assert(Common.isUint(docLength));
    var offset = Math.floor(Math.random() * 100000000 % docLength) || 0;
    var toRemove = Math.floor(Math.random() * 100000000 % (docLength - offset)) || 0;
    var toInsert = '';
    do {
        var toInsert = Common.randomASCII(Math.floor(Math.random() * 20));
    } while (toRemove === 0 && toInsert === '');
    return create(offset, toRemove, toInsert);
};

}
};
ChainPad = r("ChainPad.js");}());
