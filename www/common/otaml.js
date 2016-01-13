(function(){
var r=function(){var e="function"==typeof require&&require,r=function(i,o,u){o||(o=0);var n=r.resolve(i,o),t=r.m[o][n];if(!t&&e){if(t=e(n))return t}else if(t&&t.c&&(o=t.c,n=t.m,t=r.m[o][t.m],!t))throw new Error('failed to require "'+n+'" from '+o);if(!t)throw new Error('failed to require "'+i+'" from '+u);return t.exports||(t.exports={},t.call(t.exports,t,t.exports,r.relative(n,o))),t.exports};return r.resolve=function(e,n){var i=e,t=e+".js",o=e+"/index.js";return r.m[n][t]&&t?t:r.m[n][o]&&o?o:i},r.relative=function(e,t){return function(n){if("."!=n.charAt(0))return r(n,t,e);var o=e.split("/"),f=n.split("/");o.pop();for(var i=0;i<f.length;i++){var u=f[i];".."==u?o.pop():"."!=u&&o.push(u)}return r(o.join("/"),t,e)}},r}();r.m = [];
r.m[0] = {
"Otaml.js": function(module, exports, require){
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
var HtmlParse = require('./HtmlParse');
var Operation = require('./Operation');
var Sha = require('./SHA256');

var makeTextOperation = module.exports.makeTextOperation = function(oldval, newval)
{
    if (oldval === newval) { return; }

    var begin = 0;
    for (; oldval[begin] === newval[begin]; begin++) ;

    var end = 0;
    for (var oldI = oldval.length, newI = newval.length;
         oldval[--oldI] === newval[--newI];
         end++) ;

    if (end >= oldval.length - begin) { end = oldval.length - begin; }
    if (end >= newval.length - begin) { end = newval.length - begin; }

    return {
        offset: begin,
        toRemove: oldval.length - begin - end,
        toInsert: newval.slice(begin, newval.length - end),
    };
};

var VOID_TAG_REGEX = new RegExp('^(' + [
    'area',
    'base',
    'br',
    'col',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'command',
    'keygen',
    'source',
].join('|') + ')$');

// Get the offset of the previous open/close/void tag.
// returns the offset of the opening angle bracket.
var getPreviousTagIdx = function (data, idx)
{
    if (idx === 0) { return -1; }
    idx = data.lastIndexOf('>', idx);
    // The html tag from hell:
    // < abc def="g<hi'j >" k='lm"nopw>"qrstu"<vw'   >
    for (;;) {
        var mch = data.substring(0,idx).match(/[<"'][^<'"]*$/);
        if (!mch) { return -1; }
        if (mch[0][0] === '<') { return mch.index; }
        idx = data.lastIndexOf(mch[0][0], mch.index-1);
    }
};

/**
 * Get the name of an HTML tag with leading / if the tag is an end tag.
 *
 * @param data the html text
 * @param offset the index of the < bracket.
 * @return the tag name with possible leading slash.
 */
var getTagName = function (data, offset)
{
    if (data[offset] !== '<') { throw new Error(); }
    // Match ugly tags like <   /   xxx>
    // or <   xxx  y="z" >
    var m = data.substring(offset).match(/^(<[\s\/]*)([a-zA-Z0-9_-]+)/);
    if (!m) { throw new Error("could not get tag name"); }
    if (m[1].indexOf('/') !== -1) { return '/'+m[2]; }
    return m[2];
};

/**
 * Get the previous non-void opening tag.
 *
 * @param data the document html
 * @param ctx an empty map for the first call, the same element thereafter.
 * @return an array containing the offset of the open bracket for the begin tag and the
 *         the offset of the open bracket for the matching end tag.
 */
var getPreviousNonVoidTag = function (data, ctx)
{
    for (;;) {
        if (typeof(ctx.offsets) === 'undefined') {
            // ' ' is an invalid html element name so it will never match anything.
            ctx.offsets = [ { idx: data.length, name: ' ' } ];
            ctx.idx = data.length;
        }

        var prev = ctx.idx = getPreviousTagIdx(data, ctx.idx);
        if (prev === -1) {
            if (ctx.offsets.length > 1) { throw new Error(); }
            return [ 0, data.length ];
        }
        var prevTagName = getTagName(data, prev);

        if (prevTagName[0] === '/') {
            ctx.offsets.push({ idx: prev, name: prevTagName.substring(1) });
        } else if (prevTagName === ctx.offsets[ctx.offsets.length-1].name) {
            var os = ctx.offsets.pop();
            return [ prev, os.idx ];
        } else if (!VOID_TAG_REGEX.test(prevTagName)) {
            throw new Error();
        }
    }
};

var indexOfSkipQuoted = function (haystack, needle)
{
    var os = 0;
    for (;;) {
        var dqi = haystack.indexOf('"');
        var sqi = haystack.indexOf("'");
        var needlei = haystack.indexOf(needle);
        if (needlei === -1) { return -1; }
        if (dqi > -1 && dqi < sqi && dqi < needlei) {
            dqi = haystack.indexOf('"', dqi+1);
            if (dqi === -1) { throw new Error(); }
            haystack = haystack.substring(dqi+1);
            os += dqi+1;
        } else if (sqi > -1 && sqi < needlei) {
            sqi = haystack.indexOf('"', sqi+1);
            if (sqi === -1) { throw new Error(); }
            haystack = haystack.substring(sqi+1);
            os += sqi+1;
        } else {
            return needlei + os;
        }
    }
};

var tagWidth = module.exports.tagWidth = function (nodeOuterHTML)
{
    if (nodeOuterHTML.length < 2 || nodeOuterHTML[1] === '!' || nodeOuterHTML[0] !== '<') {
        return 0;
    }
    return indexOfSkipQuoted(nodeOuterHTML, '>') + 1;
};

var makeHTMLOperation = module.exports.makeHTMLOperation = function (oldval, newval)
{
    var op = makeTextOperation(oldval, newval);
    if (!op) { return; }

    var end = op.offset + op.toRemove;
    var lastTag;
    var tag;
    var ctx = {};
    do {
        lastTag = tag;
        tag = getPreviousNonVoidTag(oldval, ctx);
    } while (tag[0] > op.offset || tag[1] < end);

    if (lastTag
        && end < lastTag[0]
        && op.offset > tag[0] + tagWidth(oldval.substring(tag[0])))
    {
        // plain old text operation.
        if (op.toRemove && oldval.substr(op.offset, op.toRemove).indexOf('<') !== -1) {
            throw new Error();
        }
        return op;
    }

    op.offset = tag[0];
    op.toRemove = tag[1] - tag[0];
    op.toInsert = newval.slice(tag[0], newval.length - (oldval.length - tag[1]));

    return op;
};

/**
 * Expand an operation to cover enough HTML that any naive transformation
 * will result in correct HTML.
 */
var expandOp = module.exports.expandOp = function (html, op) {
return op;
    if (Common.PARANOIA && typeof(html) !== 'string') { throw new Error(); }
    var ctx = {};
    for (;;) {
        var elem = HtmlParse.getPreviousElement(html, ctx);
        // reached the end, this should not happen...
        if (!elem) { throw new Error(JSON.stringify(op)); }
        if (elem.openTagIndex <= op.offset) {
            var endIndex = html.indexOf('>', elem.closeTagIndex) + 1;
            if (!endIndex) { throw new Error(); }
            if (endIndex >= op.offset + op.toRemove) {
                var newHtml = Operation.apply(op, html);
                var newEndIndex = endIndex - op.toRemove + op.toInsert.length;
                var out = Operation.create(elem.openTagIndex,
                                           endIndex - elem.openTagIndex,
                                           newHtml.substring(elem.openTagIndex, newEndIndex));
                if (Common.PARANOIA) {
                    var test = Operation.apply(out, html);
                    if (test !== newHtml) {
                        throw new Error(test + '\n\n\n' + newHtml + '\n\n' + elem.openTagIndex + '\n\n' + newEndIndex);
                    }
                    if (out.toInsert[0] !== '<') { throw new Error(); }
                    if (out.toInsert[out.toInsert.length - 1] !== '>') { throw new Error(); }
                }
                return out;
            }
        }
        //console.log(elem);
    }
};

var transformB = function (html, toTransform, transformBy) {

    var transformByEndOffset = transformBy.offset + transformBy.toRemove;
    if (toTransform.offset > transformByEndOffset) {
        // simple rebase
        toTransform.offset -= transformBy.toRemove;
        toTransform.offset += transformBy.toInsert.length;
        return toTransform;
    }

    var toTransformEndOffset = toTransform.offset + toTransform.toRemove;

    if (transformBy.offset > toTransformEndOffset) {
        // we're before them, no transformation needed.
        return toTransform;
    }

    // so we overlap, we're just going to revert one and apply the other.
    // The one which affects more content should probably be applied.
    var toRevert = toTransform;
    var toApply = transformBy;
    var swap = function () { 
        var x = toRevert;
        toRevert = toApply;
        toApply = x;
    };

    if (toTransform.toInsert.length > transformBy.toInsert.length) {
        swap();
    } else if (toTransform.toInsert.length < transformBy.toInsert.length) {
        // fall through
    } else if (toTransform.toRemove > transformBy.toRemove) {
        swap();
    } else if (toTransform.toRemove < transformBy.toRemove) {
        // fall through
    } else {
        if (Operation.equals(toTransform, transformBy)) { return null; }
        // tie-breaker: we just strcmp the JSON.
        if (Common.strcmp(JSON.stringify(toTransform), JSON.stringify(transformBy)) < 0) { swap(); }
    }

    var inverse = Operation.invert(toRevert, html);
    if (Common.PARANOIA) {
        var afterToRevert = Operation.apply(toRevert, html);

    }
    if (Common.PARANOIA && !Operation.shouldMerge(inverse, toApply)) { throw new Error(); }
    var out = Operation.merge(inverse, toApply);
};

// FIXME looks like the old transform is deprecated? figure out why
var transform = module.exports.transform = function (html, toTransform, transformBy) {

    return transformB(html, toTransform, transformBy);
/*
    toTransform = Operation.clone(toTransform);
    toTransform = expandOp(html, toTransform);

    transformBy = Operation.clone(transformBy);
    transformBy = expandOp(html, transformBy);

    if (toTransform.offset >= transformBy.offset) {
        if (toTransform.offset >= transformBy.offset + transformBy.toRemove) {
            // simple rebase
            toTransform.offset -= transformBy.toRemove;
            toTransform.offset += transformBy.toInsert.length;
            return toTransform;
        }

        // They deleted our begin offset...

        var toTransformEndOffset = toTransform.offset + toTransform.toRemove;
        var transformByEndOffset = transformBy.offset + transformBy.toRemove;
        if (transformByEndOffset >= toTransformEndOffset) {
            // They also deleted our end offset, lets forget we wrote anything because
            // whatever it was, they deleted it's context.
            return null;
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
*/
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

},
"HtmlParse.js": function(module, exports, require){
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
var VOID_TAG_REGEX = module.exports.VOID_TAG_REGEX = new RegExp('^(' + [
    'area',
    'base',
    'br',
    'col',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'command',
    'keygen',
    'source',
].join('|') + ')$');

/**
 * Get the offset of the previous open/close/void tag.
 * returns the offset of the opening angle bracket.
 */
var getPreviousTagIdx = module.exports.getPreviousTagIdx = function (data, idx) {
    if (idx === 0) { return -1; }
    idx = data.lastIndexOf('>', idx);
    // The html tag from hell:
    // < abc def="g<hi'j >" k='lm"nopw>"qrstu"<vw'   >
    for (;;) {
        var mch = data.substring(0,idx).match(/[<"'][^<'"]*$/);
        if (!mch) { return -1; }
        if (mch[0][0] === '<') { return mch.index; }
        idx = data.lastIndexOf(mch[0][0], mch.index-1);
    }
};

/**
 * Get the name of an HTML tag with leading / if the tag is an end tag.
 *
 * @param data the html text
 * @param offset the index of the < bracket.
 * @return the tag name with possible leading slash.
 */
var getTagName = module.exports.getTagName = function (data, offset) {
    if (data[offset] !== '<') { throw new Error(); }
    // Match ugly tags like <   /   xxx>
    // or <   xxx  y="z" >
    var m = data.substring(offset).match(/^(<[\s\/]*)([a-zA-Z0-9_-]+)/);
    if (!m) { throw new Error("could not get tag name"); }
    if (m[1].indexOf('/') !== -1) { return '/'+m[2]; }
    return m[2];
};

/**
 * Get the previous void or opening tag.
 *
 * @param data the document html
 * @param ctx an empty map for the first call, the same element thereafter.
 * @return an object containing openTagIndex: the offset of the < bracket for the begin tag,
 *         closeTagIndex: the the offset of the < bracket for the matching end tag, and
 *         nodeName: the element name.
 *         If the element is a void element, the second value in the array will be -1.
 */
var getPreviousElement = module.exports.getPreviousElement = function (data, ctx) {
    for (;;) {
        if (typeof(ctx.offsets) === 'undefined') {
            // ' ' is an invalid html element name so it will never match anything.
            ctx.offsets = [ { idx: data.length, name: ' ' } ];
            ctx.idx = data.length;
        }

        var prev = ctx.idx = getPreviousTagIdx(data, ctx.idx);
        if (prev === -1) {
            if (ctx.offsets.length > 1) { throw new Error(); }
            return null;
        }
        var prevTagName = getTagName(data, prev);

        if (prevTagName[0] === '/') {
            ctx.offsets.push({ idx: prev, name: prevTagName.substring(1) });
        } else if (prevTagName === ctx.offsets[ctx.offsets.length-1].name) {
            var os = ctx.offsets.pop();
            return { openTagIndex: prev, closeTagIndex: os.idx, nodeName: prevTagName };
        } else if (!VOID_TAG_REGEX.test(prevTagName)) {
            throw new Error("unmatched tag [" + prevTagName + "] which is not a void tag");
        } else {
            return { openTagIndex: prev, closeTagIndex: -1, nodeName: prevTagName };
        }
    }
};

/**
 * Given a piece of HTML text which begins at the < of a non-close tag,
 * give the index within that content which contains the matching >
 * character skipping > characters contained within attributes.
 */
var getEndOfTag = module.exports.getEndOfTag = function (html) {
    var arr = html.match(/['">][^"'>]*/g);
    var q = null;
    var idx = html.indexOf(arr[0]);
    for (var i = 0; i < arr.length; i++) {
        if (!q) {
            q = arr[i][0];
            if (q === '>') { return idx; }
        } else if (q === arr[i][0]) {
            q = null;
        }
        idx += arr[i].length;
    }
    throw new Error("Could not find end of tag");
};


var ParseTagState = {
    OUTSIDE: 0,
    NAME: 1,
    VALUE: 2,
    SQUOTE: 3,
    DQUOTE: 4,
};

var parseTag = module.exports.parseTag = function (html) {
    if (html[0] !== '<') { throw new Error("Must be the beginning of a tag"); }

    var out = {
        nodeName: null,
        attributes: [],
        endIndex: -1,
        trailingSlash: false
    };

    if (html.indexOf('>') < html.indexOf(' ') || html.indexOf(' ') === -1) {
        out.endIndex = html.indexOf('>');
        out.nodeName = html.substring(1, out.endIndex);
        return out;
    }

    out.nodeName = html.substring(1, html.indexOf(' '));

    if (html.indexOf('<' + out.nodeName + ' ') !== 0) {
        throw new Error("Nonstandard beginning of tag [" +
            html.substring(0, 30) + '] for nodeName [' + out.nodeName + ']');
    }
    var i = 1 + out.nodeName.length + 1;

    var state = ParseTagState.OUTSIDE;
    var name = [];
    var value = [];
    var pushAttribute = function () {
        out.attributes.push([name.join(''), value.join('')]);
        name = [];
        value = [];
    };
    for (; i < html.length; i++) {
        var chr = html[i];
        switch (state) {
            case ParseTagState.OUTSIDE: {
                if (chr === '/') {
                    out.trailingSlash = true;
                } else if (chr.match(/[a-zA-Z0-9_-]/)) {
                    state = ParseTagState.NAME;
                    if (name.length > 0) { throw new Error(); }
                    name.push(chr);
                } else if (chr === '>') {
                    out.endIndex = i;
                    return out;
                } else if (chr === ' ') {
                    // fall through
                } else {
                    throw new Error();
                }
                continue;
            }
            case ParseTagState.NAME: {
                if (chr.match(/[a-zA-Z0-9_-]/)) {
                    name.push(chr);
                } else if (chr === '=') {
                    state = ParseTagState.VALUE;
                } else if (chr === '/' || chr === ' ') {
                    if (chr === '/') {
                        out.trailingSlash = true;
                    }
                    out.attributes.push([name.join(''), null]);
                    name = [];
                    state = ParseTagState.OUTSIDE;
                } else if (chr === '>') {
                    out.attributes.push([name.join(''), null]);
                    name = [];
                    out.endIndex = i;
                    return out;
                } else {
                    throw new Error("bad character [" + chr + "] in name [" + name.join('') + "]");
                }
                continue;
            }
            case ParseTagState.VALUE: {
                value.push(chr);
                if (chr === '"') {
                    state = ParseTagState.DQUOTE;
                } else if (chr === "'") {
                    state = ParseTagState.SQUOTE;
                } else {
                    throw new Error();
                }
                continue;
            }
            case ParseTagState.SQUOTE: {
                value.push(chr);
                if (chr === "'") {
                    pushAttribute();
                    state = ParseTagState.OUTSIDE;
                }
                continue;
            }
            case ParseTagState.DQUOTE: {
                value.push(chr);
                if (chr === '"') {
                    pushAttribute();
                    state = ParseTagState.OUTSIDE;
                }
                continue;
            }
        }
    }

    throw new Error("reached end of file while parsing");
};

var serializeTag = module.exports.serializeTag = function (tag) {
    var out = ['<', tag.nodeName];
    for (var i = 0; i < tag.attributes.length; i++) {
        var att = tag.attributes[i];
        if (att[1] === null) {
            out.push(' ', att[0]);
        } else {
            out.push(' ', att[0], '=', att[1]);
        }
    }
    if (tag.trailingSlash) {
        out.push(' /');
    }
    out.push('>');
    return out.join('');
};

}
};
Otaml = r("Otaml.js");}());
