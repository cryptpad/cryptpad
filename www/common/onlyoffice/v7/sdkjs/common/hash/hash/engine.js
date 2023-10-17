/*
 * (c) Copyright Ascensio System SIA 2010-2019
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-12 Ernesta Birznieka-Upisha
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

"use strict";

(function(window, undefined){

    window["AscCommon"] = window.AscCommon = (window["AscCommon"] || {});

    var charA = "A".charCodeAt(0);
    var charZ = "Z".charCodeAt(0);
    var chara = "a".charCodeAt(0);
    var charz = "z".charCodeAt(0);
    var char0 = "0".charCodeAt(0);
    var char9 = "9".charCodeAt(0);
    var charp = "+".charCodeAt(0);
    var chars = "/".charCodeAt(0);
    var char_break = ";".charCodeAt(0);

    function decodeBase64Char(ch)
    {
        if (ch >= charA && ch <= charZ)
            return ch - charA + 0;
        if (ch >= chara && ch <= charz)
            return ch - chara + 26;
        if (ch >= char0 && ch <= char9)
            return ch - char0 + 52;
        if (ch == charp)
            return 62;
        if (ch == chars)
            return 63;
        return -1;
    }

    var stringBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var arrayBase64  = [];
    for (var index64 = 0; index64 < stringBase64.length; index64++)
    {
        arrayBase64.push(stringBase64.charAt(index64));
    }

    window.AscCommon["Base64"] = window.AscCommon.Base64 = {};

    /**
     * Decode input base64 data to output array
     * @memberof AscCommon.Base64
     * @alias decodeData
     * @param {string|Array|TypedArray} input input data
     * @param {number} [input_offset = undefined] offset in input data. 0 by default
     * @param {number} [input_len = undefined] length input data (not length of needed data, this value does not depend on the offset. input.length by default
     * @param {Array|TypedArray} output output data
     * @param {number} [output_offset = undefined] output data offset. 0 by default
     * @return {number} offset in output data (output_offset + count_write_bytes)
     */
    window.AscCommon.Base64.decodeData = window.AscCommon.Base64["decodeData"] = function(input, input_offset, input_len, output, output_offset)
    {
        var isBase64 = typeof input === "string";
        if (undefined === input_len) input_len = input.length;
        var writeIndex = (undefined === output_offset) ? 0 : output_offset;
        var index = (undefined === input_offset) ? 0 : input_offset;

        while (index < input_len)
        {
            var dwCurr = 0;
            var i;
            var nBits = 0;
            for (i=0; i<4; i++)
            {
                if (index >= input_len)
                    break;
                var nCh = decodeBase64Char(isBase64 ? input.charCodeAt(index) : input[index]);
                index++;
                if (nCh == -1)
                {
                    i--;
                    continue;
                }
                dwCurr <<= 6;
                dwCurr |= nCh;
                nBits += 6;
            }

            dwCurr <<= 24-nBits;
            for (i=0; i<(nBits>>3); i++)
            {
                output[writeIndex++] = ((dwCurr & 0x00ff0000) >>> 16);
                dwCurr <<= 8;
            }
        }
        return writeIndex;
    };

    /**
     * Decode input base64 data to returned Uint8Array
     * @memberof AscCommon.Base64
     * @alias decode
     * @param {string|Array|TypedArray} input input data
     * @param {boolean} [isUsePrefix = undefined] is detect destination size by prefix. false by default
     * @param {number} [dstlen = undefined] destination length
     * @param {number} [offset] offset of input data
     * @return {Uint8Array} decoded data
     */
    window.AscCommon.Base64.decode = window.AscCommon.Base64["decode"] = function(input, isUsePrefix, dstlen, offset)
    {
        var srcLen = input.length;
        var index = (undefined === offset) ? 0 : offset;
        var dstLen = (undefined === dstlen) ? srcLen : dstlen;

        var isBase64 = typeof input === "string";

        if (isUsePrefix && isBase64)
        {
            // ищем длину
            dstLen = 0;
            var maxLen = Math.max(11, srcLen); // > 4 Gb
            while (index < maxLen)
            {
                var c = input.charCodeAt(index++);
                if (c == char_break)
                    break;

                dstLen *= 10;
                dstLen += (c - char0);
            }

            if (index == maxLen)
            {
                // длины нет
                index = 0;
                dstLen = srcLen;
            }
        }

        var dst = new Uint8Array(dstLen);
        var writeIndex = window.AscCommon.Base64.decodeData(input, index, srcLen, dst, 0);

        if (writeIndex == dstLen)
            return dst;

        return new Uint8Array(dst.buffer, 0, writeIndex);
    };

    /**
     * Encode input data to base64 string
     * @memberof AscCommon.Base64
     * @alias encode
     * @param {Array|TypedArray} input input data
     * @param {number} [offset = undefined] offset of input data. 0 by default
     * @param {number} [length = undefined] length input data (last index: offset + length). input.length by default
     * @param {boolean} [isUsePrefix = undefined] is add destination size by prefix. false by default
     * @return {string} encoded data
     */
    window.AscCommon.Base64.encode = window.AscCommon.Base64["encode"] = function(input, offset, length, isUsePrefix)
    {
        var srcLen = (undefined === length) ? input.length : length;
        var index = (undefined === offset) ? 0 : offset;

        var len1 = (((srcLen / 3) >> 0) * 4);
        var len2 = (len1 / 76) >> 0;
        var len3 = 19;
        var dstArray = [];

        var sTemp = "";
        var dwCurr = 0;
        for (var i = 0; i <= len2; i++)
        {
            if (i == len2)
                len3 = ((len1 % 76) / 4) >> 0;

            for (var j = 0; j < len3; j++)
            {
                dwCurr = 0;
                for (var n = 0; n < 3; n++)
                {
                    dwCurr |= input[index++];
                    dwCurr <<= 8;
                }

                sTemp = "";
                for (var k = 0; k < 4; k++)
                {
                    var b = (dwCurr >>> 26) & 0xFF;
                    sTemp += arrayBase64[b];
                    dwCurr <<= 6;
                    dwCurr &= 0xFFFFFFFF;
                }
                dstArray.push(sTemp);
            }
        }
        len2 = (srcLen % 3 != 0) ? (srcLen % 3 + 1) : 0;
        if (len2)
        {
            dwCurr = 0;
            for (var n = 0; n < 3; n++)
            {
                if (n < (srcLen % 3))
                    dwCurr |= input[index++];
                dwCurr <<= 8;
            }

            sTemp = "";
            for (var k = 0; k < len2; k++)
            {
                var b = (dwCurr >>> 26) & 0xFF;
                sTemp += arrayBase64[b];
                dwCurr <<= 6;
            }

            len3 = (len2 != 0) ? 4 - len2 : 0;
            for (var j = 0; j < len3; j++)
            {
                sTemp += '=';
            }
            dstArray.push(sTemp);
        }

        return isUsePrefix ? (("" + srcLen + ";") + dstArray.join("")) : dstArray.join("");
    };

    window.AscCommon["Hex"] = window.AscCommon.Hex = {};

    /**
     * Decode input hex data to Uint8Array
     * @memberof AscCommon.Hex
     * @alias decode
     * @param {string} input input data
     * @return {Uint8Array} decoded data
     */
    window.AscCommon.Hex.decode = window.AscCommon.Hex["decode"] = function(input)
    {
        var hexToByte = function(c) {
            if (c >= 48 && c <= 57) return c - 48; // 0..9
            if (c >= 97 && c <= 102) return c - 87;
            if (c >= 65 && c <= 70) return c - 55;
            return 0;
        };

        var len = input.length;
        if (len & 0x01) len -= 1;
        var result = new Uint8Array(len >> 1);
        var resIndex = 0;
        for (var i = 0; i < len; i += 2)
        {
            result[resIndex++] = hexToByte(input.charCodeAt(i)) << 4 | hexToByte(input.charCodeAt(i + 1));
        }
        return result;
    };

    /**
     * Encode Uint8Array to hex string
     * @memberof AscCommon.Hex
     * @alias encode
     * @param {Array|TypedArray} input input data
     * @param {boolean} [isUpperCase = false] is use upper case
     * @return {string} encoded data
     */
    window.AscCommon.Hex.encode = window.AscCommon.Hex["encode"] = function(input, isUpperCase)
    {
        var byteToHex = new Array(256);
        for (var i = 0; i < 16; i++)
            byteToHex[i] = "0" + (isUpperCase ? i.toString(16).toUpperCase() : i.toString(16));
        for (var i = 16; i < 256; i++)
            byteToHex[i] = isUpperCase ? i.toString(16).toUpperCase() : i.toString(16);

        var result = "";
        for (var i = 0, len = input.length; i < len; i++)
            result += byteToHex[input[i]];

        return result;
    };


})(self);


(function(window, undefined) {

	window.messageData = null;
	window.messagePort = null;
	function onMessageEvent(data, port)
	{
	    if (data.type == "hash")
	    {
	        window.messageData = data.value;
	        window.messagePort = port;
	        if (!window.engineInit)
	        	return;
	        checkMessage();
	    }
	}

	window.onconnect = function(e)
	{
	    var port = e.ports[0];
	    port.onmessage = function(e) {
	        onMessageEvent(e.data, port);
	    }    
	};
	window.onmessage = function(e)
	{
	    onMessageEvent(e.data);
	};
	window.engineInit = false;
	window.onEngineInit = function()
	{
		window.engineInit = true;
		if (window.messageData)
			checkMessage();
	};

	function checkMessage()
	{
		var data = window.messageData;
		var res = [];

		for (var i = 0, len = data.length; i < len; i++)
        {
            res.push(AscCommon.Hash.hashOffice(data[i].password, data[i].salt, data[i].spinCount, data[i].alg).base64());
        }

		var sender = window.messagePort || window;
		sender.postMessage({ hashValue : res });
	}

	var printErr = undefined;
    var FS = undefined;
    var print = undefined;

    var getBinaryPromise = null;

    function isLocal()
    {
        if (window.navigator && window.navigator.userAgent.toLowerCase().indexOf("ascdesktopeditor") < 0)
            return false;
        if (window.location && window.location.protocol == "file:")
            return true;
        if (window.document && window.document.currentScript && 0 == window.document.currentScript.src.indexOf("file:///"))
            return true;
        return false;
    }

    if (isLocal())
    {
        // fetch not support file:/// scheme
        window.fetch = undefined;

        getBinaryPromise = function() {

            var wasmPath = "ascdesktop://fonts/" + wasmBinaryFile.substr(8);
            return new Promise(function (resolve, reject) {

                var xhr = new XMLHttpRequest();
                xhr.open('GET', wasmPath, true);
                xhr.responseType = 'arraybuffer';

                if (xhr.overrideMimeType)
                    xhr.overrideMimeType('text/plain; charset=x-user-defined');
                else
                    xhr.setRequestHeader('Accept-Charset', 'x-user-defined');

                xhr.onload = function () {
                    if (this.status == 200) {
                        resolve(new Uint8Array(this.response));
                    }
                };

                xhr.send(null);

            });
        }
    }
    else
    {
        getBinaryPromise = function() {
            return getBinaryPromise2();
        }
    }
    
    var ob;function pb(h){var f=0;return function(){return f<h.length?{done:!1,value:h[f++]}:{done:!0}}}function qb(h){var f="undefined"!=typeof Symbol&&Symbol.iterator&&h[Symbol.iterator];return f?f.call(h):{next:pb(h)}}var dd="undefined"!=typeof window?window:"undefined"!=typeof global&&null!=global?global:this,Fd="function"==typeof Object.defineProperties?Object.defineProperty:function(h,f,Ka){h!=Array.prototype&&h!=Object.prototype&&(h[f]=Ka.value)};
function Gd(h,f){if(f){var Ka=dd;h=h.split(".");for(var Za=0;Za<h.length-1;Za++){var bb=h[Za];bb in Ka||(Ka[bb]={});Ka=Ka[bb]}h=h[h.length-1];Za=Ka[h];f=f(Za);f!=Za&&null!=f&&Fd(Ka,h,{configurable:!0,writable:!0,value:f})}}
Gd("Promise",function(h){function f(f){this.MQf=0;this.Cug=void 0;this.Qie=[];var h=this.slg();try{f(h.resolve,h.reject)}catch(Tb){h.reject(Tb)}}function Ka(){this.FAd=null}function Za(h){return h instanceof f?h:new f(function(f){f(h)})}if(h)return h;Ka.prototype.nJg=function(f){if(null==this.FAd){this.FAd=[];var h=this;this.oJg(function(){h.Ihh()})}this.FAd.push(f)};var bb=dd.setTimeout;Ka.prototype.oJg=function(f){bb(f,0)};Ka.prototype.Ihh=function(){for(;this.FAd&&this.FAd.length;){var f=this.FAd;
this.FAd=[];for(var h=0;h<f.length;++h){var Ka=f[h];f[h]=null;try{Ka()}catch(jb){this.Heh(jb)}}}this.FAd=null};Ka.prototype.Heh=function(f){this.oJg(function(){throw f;})};f.prototype.slg=function(){function f(f){return function(z){Ka||(Ka=!0,f.call(h,z))}}var h=this,Ka=!1;return{resolve:f(this.Cph),reject:f(this.oug)}};f.prototype.Cph=function(h){if(h===this)this.oug(new TypeError("A Promise cannot resolve to itself"));else if(h instanceof f)this.Aqh(h);else{a:switch(typeof h){case "object":var z=
null!=h;break a;case "function":z=!0;break a;default:z=!1}z?this.Bph(h):this.dNg(h)}};f.prototype.Bph=function(f){var h=void 0;try{h=f.then}catch(Tb){this.oug(Tb);return}"function"==typeof h?this.Bqh(h,f):this.dNg(f)};f.prototype.oug=function(f){this.vWg(2,f)};f.prototype.dNg=function(f){this.vWg(1,f)};f.prototype.vWg=function(f,h){if(0!=this.MQf)throw Error("Cannot settle("+f+", "+h+"): Promise already settled in state"+this.MQf);this.MQf=f;this.Cug=h;this.Jhh()};f.prototype.Jhh=function(){if(null!=
this.Qie){for(var f=0;f<this.Qie.length;++f)gb.nJg(this.Qie[f]);this.Qie=null}};var gb=new Ka;f.prototype.Aqh=function(f){var h=this.slg();f.cZf(h.resolve,h.reject)};f.prototype.Bqh=function(f,h){var z=this.slg();try{f.call(h,z.resolve,z.reject)}catch(jb){z.reject(jb)}};f.prototype.then=function(h,Ka){function z(f,h){return"function"==typeof f?function(h){try{gb(f(h))}catch(hc){Ma(hc)}}:h}var gb,Ma,bb=new f(function(f,h){gb=f;Ma=h});this.cZf(z(h,gb),z(Ka,Ma));return bb};f.prototype.catch=function(f){return this.then(void 0,
f)};f.prototype.cZf=function(f,h){function z(){switch(Ka.MQf){case 1:f(Ka.Cug);break;case 2:h(Ka.Cug);break;default:throw Error("Unexpected state: "+Ka.MQf);}}var Ka=this;null==this.Qie?gb.nJg(z):this.Qie.push(z)};f.resolve=Za;f.reject=function(h){return new f(function(f,z){z(h)})};f.race=function(h){return new f(function(f,z){for(var Ka=qb(h),Ma=Ka.next();!Ma.done;Ma=Ka.next())Za(Ma.value).cZf(f,z)})};f.all=function(h){var z=qb(h),Ka=z.next();return Ka.done?Za([]):new f(function(f,h){function Ma(h){return function(z){Ta[h]=
z;gb--;0==gb&&f(Ta)}}var Ta=[],gb=0;do Ta.push(void 0),gb++,Za(Ka.value).cZf(Ma(Ta.length-1),h),Ka=z.next();while(!Ka.done)})};return f});Gd("Array.prototype.fill",function(h){return h?h:function(f,h,Za){var Ka=this.length||0;0>h&&(h=Math.max(0,Ka+h));if(null==Za||Za>Ka)Za=Ka;Za=Number(Za);0>Za&&(Za=Math.max(0,Ka+Za));for(h=Number(h||0);h<Za;h++)this[h]=f;return this}});
function Hd(h,f,Ka){if(null==h)throw new TypeError("The 'this' value for String.prototype."+Ka+" must not be null or undefined");if(f instanceof RegExp)throw new TypeError("First argument to String.prototype."+Ka+" must not be a regular expression");return h+""}Gd("String.prototype.repeat",function(h){return h?h:function(f){var h=Hd(this,null,"repeat");if(0>f||1342177279<f)throw new RangeError("Invalid count value");f|=0;for(var Za="";f;)if(f&1&&(Za+=h),f>>>=1)h+=h;return Za}});
Gd("Number.isFinite",function(h){return h?h:function(f){return"number"!==typeof f?!1:!isNaN(f)&&Infinity!==f&&-Infinity!==f}});Gd("Number.isInteger",function(h){return h?h:function(f){return Number.isFinite(f)?f===Math.floor(f):!1}});Gd("String.prototype.endsWith",function(h){return h?h:function(f,h){var Ka=Hd(this,f,"endsWith");f+="";void 0===h&&(h=Ka.length);h=Math.max(0,Math.min(h|0,Ka.length));for(var bb=f.length;0<bb&&0<h;)if(Ka[--h]!=f[--bb])return!1;return 0>=bb}});
Gd("String.prototype.padStart",function(h){return h?h:function(f,h){var Ka=Hd(this,null,"padStart");f-=Ka.length;h=void 0!==h?String(h):" ";return(0<f&&h?h.repeat(Math.ceil(f/h.length)).substring(0,f):"")+Ka}});function Be(){Be=function(){};dd.Symbol||(dd.Symbol=De)}function Ee(h,f){this.kYg=h;Fd(this,"description",{configurable:!0,writable:!0,value:f})}Ee.prototype.toString=function(){return this.kYg};
var De=function(){function h(Ka){if(this instanceof h)throw new TypeError("Symbol is not a constructor");return new Ee("jscomp_symbol_"+(Ka||"")+"_"+f++,Ka)}var f=0;return h}();function Ng(){Be();var h=dd.Symbol.iterator;h||(h=dd.Symbol.iterator=dd.Symbol("Symbol.iterator"));"function"!=typeof Array.prototype[h]&&Fd(Array.prototype,h,{configurable:!0,writable:!0,value:function(){return Kh(pb(this))}});Ng=function(){}}
function Kh(h){Ng();h={next:h};h[dd.Symbol.iterator]=function(){return this};return h}function qm(h,f){Ng();h instanceof String&&(h+="");var Ka=0,Za={next:function(){if(Ka<h.length){var bb=Ka++;return{value:f(bb,h[bb]),done:!1}}Za.next=function(){return{done:!0,value:void 0}};return Za.next()}};Za[Symbol.iterator]=function(){return Za};return Za}Gd("Array.prototype.values",function(h){return h?h:function(){return qm(this,function(f,h){return h})}});
Gd("Math.sign",function(h){return h?h:function(f){f=Number(f);return 0===f||isNaN(f)?f:0<f?1:-1}});Gd("Array.prototype.keys",function(h){return h?h:function(){return qm(this,function(f){return f})}});function Sm(h,f){return Object.prototype.hasOwnProperty.call(h,f)}
Gd("WeakMap",function(h){function f(f){this.aCf=(z+=Math.random()+1).toString();if(f){f=qb(f);for(var h;!(h=f.next()).done;)h=h.value,this.set(h[0],h[1])}}function Ka(){}function Za(f){Sm(f,gb)||Fd(f,gb,{value:new Ka})}function bb(f){var h=Object[f];h&&(Object[f]=function(f){if(f instanceof Ka)return f;Za(f);return h(f)})}if(function(){if(!h||!Object.seal)return!1;try{var f=Object.seal({}),z=Object.seal({}),Ka=new h([[f,2],[z,3]]);if(2!=Ka.get(f)||3!=Ka.get(z))return!1;Ka.delete(f);Ka.set(z,4);return!Ka.has(f)&&
4==Ka.get(z)}catch(Ma){return!1}}())return h;var gb="$jscomp_hidden_"+Math.random();bb("freeze");bb("preventExtensions");bb("seal");var z=0;f.prototype.set=function(f,h){Za(f);if(!Sm(f,gb))throw Error("WeakMap key fail: "+f);f[gb][this.aCf]=h;return this};f.prototype.get=function(f){return Sm(f,gb)?f[gb][this.aCf]:void 0};f.prototype.has=function(f){return Sm(f,gb)&&Sm(f[gb],this.aCf)};f.prototype.delete=function(f){return Sm(f,gb)&&Sm(f[gb],this.aCf)?delete f[gb][this.aCf]:!1};return f});
Gd("Map",function(h){function f(){var f={};return f.previous=f.next=f.head=f}function Ka(f,h){var z=f.b4c;return Kh(function(){if(z){for(;z.head!=f.b4c;)z=z.previous;for(;z.next!=z.head;)return z=z.next,{done:!1,value:h(z)};z=null}return{done:!0,value:void 0}})}function Za(f,h){var Ka=h&&typeof h;"object"==Ka||"function"==Ka?gb.has(h)?Ka=gb.get(h):(Ka=""+ ++z,gb.set(h,Ka)):Ka="p_"+h;var Ma=f.rsf[Ka];if(Ma&&Sm(f.rsf,Ka))for(f=0;f<Ma.length;f++){var bb=Ma[f];if(h!==h&&bb.key!==bb.key||h===bb.key)return{id:Ka,
list:Ma,index:f,SNb:bb}}return{id:Ka,list:Ma,index:-1,SNb:void 0}}function bb(h){this.rsf={};this.b4c=f();this.size=0;if(h){h=qb(h);for(var z;!(z=h.next()).done;)z=z.value,this.set(z[0],z[1])}}if(function(){if(!h||"function"!=typeof h||!h.prototype.entries||"function"!=typeof Object.seal)return!1;try{var f=Object.seal({x:4}),z=new h(qb([[f,"s"]]));if("s"!=z.get(f)||1!=z.size||z.get({x:4})||z.set({x:4},"t")!=z||2!=z.size)return!1;var Ka=z.entries(),Ma=Ka.next();if(Ma.done||Ma.value[0]!=f||"s"!=Ma.value[1])return!1;
Ma=Ka.next();return Ma.done||4!=Ma.value[0].x||"t"!=Ma.value[1]||!Ka.next().done?!1:!0}catch(Kb){return!1}}())return h;Ng();var gb=new WeakMap;bb.prototype.set=function(f,h){f=0===f?0:f;var z=Za(this,f);z.list||(z.list=this.rsf[z.id]=[]);z.SNb?z.SNb.value=h:(z.SNb={next:this.b4c,previous:this.b4c.previous,head:this.b4c,key:f,value:h},z.list.push(z.SNb),this.b4c.previous.next=z.SNb,this.b4c.previous=z.SNb,this.size++);return this};bb.prototype.delete=function(f){f=Za(this,f);return f.SNb&&f.list?(f.list.splice(f.index,
1),f.list.length||delete this.rsf[f.id],f.SNb.previous.next=f.SNb.next,f.SNb.next.previous=f.SNb.previous,f.SNb.head=null,this.size--,!0):!1};bb.prototype.clear=function(){this.rsf={};this.b4c=this.b4c.previous=f();this.size=0};bb.prototype.has=function(f){return!!Za(this,f).SNb};bb.prototype.get=function(f){return(f=Za(this,f).SNb)&&f.value};bb.prototype.entries=function(){return Ka(this,function(f){return[f.key,f.value]})};bb.prototype.keys=function(){return Ka(this,function(f){return f.key})};
bb.prototype.values=function(){return Ka(this,function(f){return f.value})};bb.prototype.forEach=function(f,h){for(var z=this.entries(),Ma;!(Ma=z.next()).done;)Ma=Ma.value,f.call(h,Ma[1],Ma[0],this)};bb.prototype[Symbol.iterator]=bb.prototype.entries;var z=0;return bb});function Fw(h,f,Ka){h instanceof String&&(h=String(h));for(var Za=h.length,bb=0;bb<Za;bb++){var gb=h[bb];if(f.call(Ka,gb,bb,h))return{dn:bb,Ju:gb}}return{dn:-1,Ju:void 0}}
Gd("Array.prototype.find",function(h){return h?h:function(f,h){return Fw(this,f,h).Ju}});Gd("String.prototype.startsWith",function(h){return h?h:function(f,h){var Ka=Hd(this,f,"startsWith");f+="";var bb=Ka.length,gb=f.length;h=Math.max(0,Math.min(h|0,Ka.length));for(var z=0;z<gb&&h<bb;)if(Ka[h++]!=f[z++])return!1;return z>=gb}});Gd("Object.is",function(h){return h?h:function(f,h){return f===h?0!==f||1/f===1/h:f!==f&&h!==h}});
Gd("Array.prototype.includes",function(h){return h?h:function(f,h){var Ka=this;Ka instanceof String&&(Ka=String(Ka));var bb=Ka.length;h=h||0;for(0>h&&(h=Math.max(h+bb,0));h<bb;h++){var gb=Ka[h];if(gb===f||Object.is(gb,f))return!0}return!1}});Gd("String.prototype.includes",function(h){return h?h:function(f,h){return-1!==Hd(this,f,"includes").indexOf(f,h||0)}});
Gd("Math.tanh",function(h){return h?h:function(f){f=Number(f);if(0===f)return f;var h=Math.exp(-2*Math.abs(f));h=(1-h)/(1+h);return 0>f?-h:h}});Gd("Math.log1p",function(h){return h?h:function(f){f=Number(f);if(.25>f&&-.25<f){for(var h=f,Za=1,bb=f,gb=0,z=1;gb!=bb;)h*=f,z*=-1,bb=(gb=bb)+z*h/++Za;return bb}return Math.log(1+f)}});Gd("Math.expm1",function(h){return h?h:function(f){f=Number(f);if(.25>f&&-.25<f){for(var h=f,Za=1,bb=f,gb=0;gb!=bb;)h*=f/++Za,bb=(gb=bb)+h;return bb}return Math.exp(f)-1}});
Gd("Math.trunc",function(h){return h?h:function(f){f=Number(f);if(isNaN(f)||Infinity===f||-Infinity===f||0===f)return f;var h=Math.floor(Math.abs(f));return 0>f?-h:h}});Gd("Math.log10",function(h){return h?h:function(f){return Math.log(f)/Math.LN10}});Gd("Math.cosh",function(h){if(h)return h;var f=Math.exp;return function(h){h=Number(h);return(f(h)+f(-h))/2}});Gd("Math.sinh",function(h){if(h)return h;var f=Math.exp;return function(h){h=Number(h);return 0===h?h:(f(h)-f(-h))/2}});
Gd("Math.acosh",function(h){return h?h:function(f){f=Number(f);return Math.log(f+Math.sqrt(f*f-1))}});Gd("Math.atanh",function(h){if(h)return h;var f=Math.log1p;return function(h){h=Number(h);return(f(h)-f(-h))/2}});Gd("Math.asinh",function(h){return h?h:function(f){f=Number(f);if(0===f)return f;var h=Math.log(Math.abs(f)+Math.sqrt(f*f+1));return 0>f?-h:h}});Gd("Array.prototype.findIndex",function(h){return h?h:function(f,h){return Fw(this,f,h).dn}});

Math.imul = Math.imul || function(a, b) {
  var ah = (a >>> 16) & 0xffff;
  var al = a & 0xffff;
  var bh = (b >>> 16) & 0xffff;
  var bl = b & 0xffff;
  // сдвиг на 0 бит закрепляет знак в старшей части числа
  // окончательный |0 преобразует беззнаковое значение обратно в знаковое значение
  return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
};

    (function(){

	if (undefined !== String.prototype.fromUtf8 &&
		undefined !== String.prototype.toUtf8)
		return;

	/**
	 * Read string from utf8
	 * @param {Uint8Array} buffer
	 * @param {number} [start=0]
	 * @param {number} [len]
	 * @returns {string}
	 */
	String.prototype.fromUtf8 = function(buffer, start, len) {
		if (undefined === start)
			start = 0;
		if (undefined === len)
			len = buffer.length;

		var result = "";
		var index  = start;
		var end = start + len;
		while (index < end)
		{
			var u0 = buffer[index++];
			if (!(u0 & 128))
			{
				result += String.fromCharCode(u0);
				continue;
			}
			var u1 = buffer[index++] & 63;
			if ((u0 & 224) == 192)
			{
				result += String.fromCharCode((u0 & 31) << 6 | u1);
				continue;
			}
			var u2 = buffer[index++] & 63;
			if ((u0 & 240) == 224)
				u0 = (u0 & 15) << 12 | u1 << 6 | u2;
			else
				u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | buffer[index++] & 63;
			if (u0 < 65536)
				result += String.fromCharCode(u0);
			else
			{
				var ch = u0 - 65536;
				result += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
			}
		}
		return result;
	};

	/**
	 * Convert string to utf8 array
	 * @returns {Uint8Array}
	 */
	String.prototype.toUtf8 = function(isNoEndNull) {
		var inputLen = this.length;
		var testLen  = 6 * inputLen + 1;
		var tmpStrings = new ArrayBuffer(testLen);

		var code  = 0;
		var index = 0;

		var outputIndex = 0;
		var outputDataTmp = new Uint8Array(tmpStrings);
		var outputData = outputDataTmp;

		while (index < inputLen)
		{
			code = this.charCodeAt(index++);
			if (code >= 0xD800 && code <= 0xDFFF && index < inputLen)
				code = 0x10000 + (((code & 0x3FF) << 10) | (0x03FF & this.charCodeAt(index++)));

			if (code < 0x80)
				outputData[outputIndex++] = code;
			else if (code < 0x0800)
			{
				outputData[outputIndex++] = 0xC0 | (code >> 6);
				outputData[outputIndex++] = 0x80 | (code & 0x3F);
			}
			else if (code < 0x10000)
			{
				outputData[outputIndex++] = 0xE0 | (code >> 12);
				outputData[outputIndex++] = 0x80 | ((code >> 6) & 0x3F);
				outputData[outputIndex++] = 0x80 | (code & 0x3F);
			}
			else if (code < 0x1FFFFF)
			{
				outputData[outputIndex++] = 0xF0 | (code >> 18);
				outputData[outputIndex++] = 0x80 | ((code >> 12) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 6) & 0x3F);
				outputData[outputIndex++] = 0x80 | (code & 0x3F);
			}
			else if (code < 0x3FFFFFF)
			{
				outputData[outputIndex++] = 0xF8 | (code >> 24);
				outputData[outputIndex++] = 0x80 | ((code >> 18) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 12) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 6) & 0x3F);
				outputData[outputIndex++] = 0x80 | (code & 0x3F);
			}
			else if (code < 0x7FFFFFFF)
			{
				outputData[outputIndex++] = 0xFC | (code >> 30);
				outputData[outputIndex++] = 0x80 | ((code >> 24) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 18) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 12) & 0x3F);
				outputData[outputIndex++] = 0x80 | ((code >> 6) & 0x3F);
				outputData[outputIndex++] = 0x80 | (code & 0x3F);
			}
		}

		if (isNoEndNull !== true)
			outputData[outputIndex++] = 0;

		return new Uint8Array(tmpStrings, 0, outputIndex);
	};

})();


    var Module=typeof Module!=="undefined"?Module:{};var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var arguments_=[];var thisProgram="./this.program";var quit_=function(status,toThrow){throw toThrow};var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=true;var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readAsync,readBinary,setWindowTitle;if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href}else if(typeof document!=="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src}if(scriptDirectory.indexOf("blob:")!==0){scriptDirectory=scriptDirectory.substr(0,scriptDirectory.replace(/[?#].*/,"").lastIndexOf("/")+1)}else{scriptDirectory=""}{read_=function(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};if(ENVIRONMENT_IS_WORKER){readBinary=function(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=function(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}onerror()};xhr.onerror=onerror;xhr.send(null)}}setWindowTitle=function(title){document.title=title}}else{}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.warn.bind(console);for(key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key]}}moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];var noExitRuntime=Module["noExitRuntime"]||true;if(typeof WebAssembly!=="object"){abort("no native wasm support detected")}var wasmMemory;var ABORT=false;var EXITSTATUS;function alignUp(x,multiple){if(x%multiple>0){x+=multiple-x%multiple}return x}var buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferAndViews(buf){buffer=buf;Module["HEAP8"]=HEAP8=new Int8Array(buf);Module["HEAP16"]=HEAP16=new Int16Array(buf);Module["HEAP32"]=HEAP32=new Int32Array(buf);Module["HEAPU8"]=HEAPU8=new Uint8Array(buf);Module["HEAPU16"]=HEAPU16=new Uint16Array(buf);Module["HEAPU32"]=HEAPU32=new Uint32Array(buf);Module["HEAPF32"]=HEAPF32=new Float32Array(buf);Module["HEAPF64"]=HEAPF64=new Float64Array(buf)}var INITIAL_MEMORY=Module["INITIAL_MEMORY"]||2097152;var wasmTable;var __ATPRERUN__=[];var __ATINIT__=[];var __ATPOSTRUN__=[function(){self.onEngineInit();}];var runtimeInitialized=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}function addOnInit(cb){__ATINIT__.unshift(cb)}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["preloadedImages"]={};Module["preloadedAudios"]={};function abort(what){{if(Module["onAbort"]){Module["onAbort"](what)}}what="Aborted("+what+")";err(what);ABORT=true;EXITSTATUS=1;what+=". Build with -s ASSERTIONS=1 for more info.";var e=new WebAssembly.RuntimeError(what);throw e}var dataURIPrefix="data:application/octet-stream;base64,";function isDataURI(filename){return filename.startsWith(dataURIPrefix)}var wasmBinaryFile;wasmBinaryFile="engine.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile)}function getBinary(file){try{if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}else{throw"both async and sync fetching of the wasm failed"}}catch(err){abort(err)}}function getBinaryPromise2(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)){if(typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw"failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary(wasmBinaryFile)})}}return Promise.resolve().then(function(){return getBinary(wasmBinaryFile)})}function createWasm(){var info={"a":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;Module["asm"]=exports;wasmMemory=Module["asm"]["c"];updateGlobalBufferAndViews(wasmMemory.buffer);wasmTable=Module["asm"]["e"];addOnInit(Module["asm"]["d"]);removeRunDependency("wasm-instantiate")}addRunDependency("wasm-instantiate");function receiveInstantiationResult(result){receiveInstance(result["instance"])}function instantiateArrayBuffer(receiver){return getBinaryPromise().then(function(binary){return WebAssembly.instantiate(binary,info)}).then(function(instance){return instance}).then(receiver,function(reason){err("failed to asynchronously prepare wasm: "+reason);abort(reason)})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming==="function"&&!isDataURI(wasmBinaryFile)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiationResult,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiationResult)})})}else{return instantiateArrayBuffer(receiveInstantiationResult)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);return false}}instantiateAsync();return{}}function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback(Module);continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){getWasmTableEntry(func)()}else{getWasmTableEntry(func)(callback.arg)}}else{func(callback.arg===undefined?null:callback.arg)}}}var wasmTableMirror=[];function getWasmTableEntry(funcPtr){var func=wasmTableMirror[funcPtr];if(!func){if(funcPtr>=wasmTableMirror.length)wasmTableMirror.length=funcPtr+1;wasmTableMirror[funcPtr]=func=wasmTable.get(funcPtr)}return func}function _emscripten_memcpy_big(dest,src,num){HEAPU8.copyWithin(dest,src,src+num)}function emscripten_realloc_buffer(size){try{wasmMemory.grow(size-buffer.byteLength+65535>>>16);updateGlobalBufferAndViews(wasmMemory.buffer);return 1}catch(e){}}function _emscripten_resize_heap(requestedSize){var oldSize=HEAPU8.length;requestedSize=requestedSize>>>0;var maxHeapSize=2147483648;if(requestedSize>maxHeapSize){return false}for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignUp(Math.max(requestedSize,overGrownHeapSize),65536));var replacement=emscripten_realloc_buffer(newSize);if(replacement){return true}}return false}var asmLibraryArg={"a":_emscripten_memcpy_big,"b":_emscripten_resize_heap};var asm=createWasm();var ___wasm_call_ctors=Module["___wasm_call_ctors"]=function(){return(___wasm_call_ctors=Module["___wasm_call_ctors"]=Module["asm"]["d"]).apply(null,arguments)};var _malloc=Module["_malloc"]=function(){return(_malloc=Module["_malloc"]=Module["asm"]["f"]).apply(null,arguments)};var _hash=Module["_hash"]=function(){return(_hash=Module["_hash"]=Module["asm"]["g"]).apply(null,arguments)};var _hash2=Module["_hash2"]=function(){return(_hash2=Module["_hash2"]=Module["asm"]["h"]).apply(null,arguments)};var _free=Module["_free"]=function(){return(_free=Module["_free"]=Module["asm"]["i"]).apply(null,arguments)};var calledRun;dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller};function run(args){args=args||arguments_;if(runDependencies>0){return}preRun();if(runDependencies>0){return}function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("")},1);doRun()},1)}else{doRun()}}Module["run"]=run;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}run();


    var HashAlgs = {
        MD2       : 0,
        MD4       : 1,
        MD5       : 2,
        RMD160    : 3,
        SHA1      : 4,
        SHA256    : 5,
        SHA384    : 6,
        SHA512    : 7,
        WHIRLPOOL : 8
    };

    var HashSizes = [
        16,
        16,
        16,
        20,
        20,
        32,
        48,
        64,
        64
    ];

	window["AscCommon"] = window.AscCommon = (window["AscCommon"] || {});
	window.AscCommon["Hash"] = window.AscCommon.Hash = {};
	window.AscCommon.Hash["HashAlgs"] = window.AscCommon.Hash.HashAlgs = HashAlgs;
	window.AscCommon.Hash["HashSizes"] = window.AscCommon.Hash.HashSizes = HashSizes;
	
	function HashObj() { this.buf; }
	HashObj.prototype["buffer"] = HashObj.prototype.buffer = function()	{ return this.buf; };
	HashObj.prototype["base64"] = HashObj.prototype.base64 = function() { return window.AscCommon.Base64.encode(this.buf); };
	HashObj.prototype["hex"] = HashObj.prototype.hex = function() { return window.AscCommon.Hex.encode(this.buf); };
	
	window.AscCommon.Hash["hash"] = window.AscCommon.Hash.hash = function(data, alg)
	{
		if (typeof alg === "string")
		{
			switch (alg)
			{
				case "md2" : alg = HashAlgs.MD2; break;
				case "md4" : alg = HashAlgs.MD4; break;
				case "md5" : alg = HashAlgs.MD5; break;
				case "rmd160" : alg = HashAlgs.RMD160; break;
				case "sha1" : alg = HashAlgs.SHA1; break;
				case "sha256" : alg = HashAlgs.SHA256; break;
				case "sha384" : alg = HashAlgs.SHA384; break;
				case "sha512" : alg = HashAlgs.SHA512; break;
				case "whirlpool" : alg = HashAlgs.WHIRLPOOL; break;
				default:
					alg = HashAlgs.SHA256;
			}
		}
		
		var arrayData = null;
		if (typeof data === "string")
			arrayData = data.toUtf8(true);
		else
			arrayData = data;
		
        var dataPointer = Module["_malloc"](arrayData.length);
        Module["HEAPU8"].set(arrayData, dataPointer);		
		var resultPointer = Module["_hash"](dataPointer, arrayData.length, alg);
		Module["_free"](dataPointer);
		
		var result = new HashObj();
		if (0 != resultPointer)
		{
			var tmp = new Uint8Array(Module["HEAPU8"].buffer, resultPointer, HashSizes[alg]);
			result.buf = new Uint8Array(tmp.length);
			result.buf.set(tmp, 0);
			Module["_free"](resultPointer);
		}
		else
		{
			result.buf = [];
		}
		
		return result;
	};
	
	window.AscCommon.Hash["hashOffice"] = window.AscCommon.Hash.hash = function(password, salt, spinCount, alg)
	{
		if (typeof alg === "string")
		{
			switch (alg)
			{
				case "md2" : alg = HashAlgs.MD2; break;
				case "md4" : alg = HashAlgs.MD4; break;
				case "md5" : alg = HashAlgs.MD5; break;
				case "rmd160" : alg = HashAlgs.RMD160; break;
				case "sha1" : alg = HashAlgs.SHA1; break;
				case "sha256" : alg = HashAlgs.SHA256; break;
				case "sha384" : alg = HashAlgs.SHA384; break;
				case "sha512" : alg = HashAlgs.SHA512; break;
				case "whirlpool" : alg = HashAlgs.WHIRLPOOL; break;
				default:
					alg = HashAlgs.SHA256;
			}
		}

		var passwordData = password.toUtf8();
		var passwordPointer = Module["_malloc"](passwordData.length);
		Module["HEAPU8"].set(passwordData, passwordPointer);

		var saltData = salt.toUtf8();
		var saltPointer = Module["_malloc"](saltData.length);
		Module["HEAPU8"].set(saltData, saltPointer);

		var resultPointer = Module["_hash2"](passwordPointer, saltPointer, spinCount, alg);

		Module["_free"](passwordPointer);
		Module["_free"](saltPointer);

		var result = new HashObj();
		if (0 != resultPointer)
		{
			var tmp = new Uint8Array(Module["HEAPU8"].buffer, resultPointer, HashSizes[alg]);
			result.buf = new Uint8Array(tmp.length);
			result.buf.set(tmp, 0);
			Module["_free"](resultPointer);
		}
		else
		{
			result.buf = [];
		}

		return result;
	};

})(self, undefined);
