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
 
var printErr = undefined;
var FS = undefined;
var print = undefined;

var fetch = self.fetch;
var getBinaryPromise = null;
if (self.AscDesktopEditor && document.currentScript && 0 == document.currentScript.src.indexOf("file:///"))
{
    fetch = undefined; // fetch not support file:/// scheme
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

var Module=typeof Module!=="undefined"?Module:{};var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var arguments_=[];var thisProgram="./this.program";var quit_=function(status,toThrow){throw toThrow};var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=false;var ENVIRONMENT_IS_NODE=false;var ENVIRONMENT_IS_SHELL=false;ENVIRONMENT_IS_WEB=typeof window==="object";ENVIRONMENT_IS_WORKER=typeof importScripts==="function";ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof process.versions==="object"&&typeof process.versions.node==="string";ENVIRONMENT_IS_SHELL=!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER;var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readAsync,readBinary,setWindowTitle;if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href}else if(typeof document!=="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src}if(scriptDirectory.indexOf("blob:")!==0){scriptDirectory=scriptDirectory.substr(0,scriptDirectory.lastIndexOf("/")+1)}else{scriptDirectory=""}{read_=function(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};if(ENVIRONMENT_IS_WORKER){readBinary=function(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=function(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}onerror()};xhr.onerror=onerror;xhr.send(null)}}setWindowTitle=function(title){document.title=title}}else{}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.warn.bind(console);for(key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key]}}moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];var noExitRuntime=Module["noExitRuntime"]||true;if(typeof WebAssembly!=="object"){abort("no native wasm support detected")}var wasmMemory;var ABORT=false;var EXITSTATUS;var UTF8Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(heap,idx,maxBytesToRead){var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heap[endPtr]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heap.subarray&&UTF8Decoder){return UTF8Decoder.decode(heap.subarray(idx,endPtr))}else{var str="";while(idx<endPtr){var u0=heap[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heap[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heap[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heap[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}}return str}function UTF8ToString(ptr,maxBytesToRead){return ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):""}function stringToUTF8Array(str,heap,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}else{if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}}heap[outIdx]=0;return outIdx-startIdx}function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127)++len;else if(u<=2047)len+=2;else if(u<=65535)len+=3;else len+=4}return len}function writeArrayToMemory(array,buffer){HEAP8.set(array,buffer)}function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i)}if(!dontAddNull)HEAP8[buffer>>0]=0}function alignUp(x,multiple){if(x%multiple>0){x+=multiple-x%multiple}return x}var buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferAndViews(buf){buffer=buf;Module["HEAP8"]=HEAP8=new Int8Array(buf);Module["HEAP16"]=HEAP16=new Int16Array(buf);Module["HEAP32"]=HEAP32=new Int32Array(buf);Module["HEAPU8"]=HEAPU8=new Uint8Array(buf);Module["HEAPU16"]=HEAPU16=new Uint16Array(buf);Module["HEAPU32"]=HEAPU32=new Uint32Array(buf);Module["HEAPF32"]=HEAPF32=new Float32Array(buf);Module["HEAPF64"]=HEAPF64=new Float64Array(buf)}var INITIAL_MEMORY=Module["INITIAL_MEMORY"]||16777216;var wasmTable;var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATPOSTRUN__=[function(){self.onEngineInit();}];var runtimeInitialized=false;__ATINIT__.push({func:function(){___wasm_call_ctors()}});function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function preMain(){callRuntimeCallbacks(__ATMAIN__)}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["preloadedImages"]={};Module["preloadedAudios"]={};function abort(what){if(Module["onAbort"]){Module["onAbort"](what)}what+="";err(what);ABORT=true;EXITSTATUS=1;what="abort("+what+"). Build with -s ASSERTIONS=1 for more info.";var e=new WebAssembly.RuntimeError(what);throw e}function hasPrefix(str,prefix){return String.prototype.startsWith?str.startsWith(prefix):str.indexOf(prefix)===0}var dataURIPrefix="data:application/octet-stream;base64,";function isDataURI(filename){return hasPrefix(filename,dataURIPrefix)}var wasmBinaryFile="spell.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile)}function getBinary(file){try{if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}else{throw"both async and sync fetching of the wasm failed"}}catch(err){abort(err)}}function getBinaryPromise2(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)){if(typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw"failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary(wasmBinaryFile)})}}return Promise.resolve().then(function(){return getBinary(wasmBinaryFile)})}function createWasm(){var info={"a":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;Module["asm"]=exports;wasmMemory=Module["asm"]["k"];updateGlobalBufferAndViews(wasmMemory.buffer);wasmTable=Module["asm"]["n"];removeRunDependency("wasm-instantiate")}addRunDependency("wasm-instantiate");function receiveInstantiatedSource(output){receiveInstance(output["instance"])}function instantiateArrayBuffer(receiver){return getBinaryPromise().then(function(binary){return WebAssembly.instantiate(binary,info)}).then(receiver,function(reason){err("failed to asynchronously prepare wasm: "+reason);abort(reason)})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming==="function"&&!isDataURI(wasmBinaryFile)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiatedSource,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiatedSource)})})}else{return instantiateArrayBuffer(receiveInstantiatedSource)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);return false}}instantiateAsync();return{}}function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback(Module);continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){wasmTable.get(func)()}else{wasmTable.get(func)(callback.arg)}}else{func(callback.arg===undefined?null:callback.arg)}}}function _abort(){abort()}function _clock(){if(_clock.start===undefined)_clock.start=Date.now();return(Date.now()-_clock.start)*(1e6/1e3)|0}function _emscripten_memcpy_big(dest,src,num){HEAPU8.copyWithin(dest,src,src+num)}function _emscripten_get_heap_size(){return HEAPU8.length}function emscripten_realloc_buffer(size){try{wasmMemory.grow(size-buffer.byteLength+65535>>>16);updateGlobalBufferAndViews(wasmMemory.buffer);return 1}catch(e){}}function _emscripten_resize_heap(requestedSize){var oldSize=_emscripten_get_heap_size();var maxHeapSize=2147483648;if(requestedSize>maxHeapSize){return false}for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignUp(Math.max(requestedSize,overGrownHeapSize),65536));var replacement=emscripten_realloc_buffer(newSize);if(replacement){return true}}return false}var ENV={};function getExecutableName(){return thisProgram||"./this.program"}function getEnvStrings(){if(!getEnvStrings.strings){var lang=(typeof navigator==="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8";var env={"USER":"web_user","LOGNAME":"web_user","PATH":"/","PWD":"/","HOME":"/home/web_user","LANG":lang,"_":getExecutableName()};for(var x in ENV){env[x]=ENV[x]}var strings=[];for(var x in env){strings.push(x+"="+env[x])}getEnvStrings.strings=strings}return getEnvStrings.strings}var SYSCALLS={mappings:{},buffers:[null,[],[]],printChar:function(stream,curr){var buffer=SYSCALLS.buffers[stream];if(curr===0||curr===10){(stream===1?out:err)(UTF8ArrayToString(buffer,0));buffer.length=0}else{buffer.push(curr)}},varargs:undefined,get:function(){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret},getStr:function(ptr){var ret=UTF8ToString(ptr);return ret},get64:function(low,high){return low}};function _environ_get(__environ,environ_buf){var bufSize=0;getEnvStrings().forEach(function(string,i){var ptr=environ_buf+bufSize;HEAP32[__environ+i*4>>2]=ptr;writeAsciiToMemory(string,ptr);bufSize+=string.length+1});return 0}function _environ_sizes_get(penviron_count,penviron_buf_size){var strings=getEnvStrings();HEAP32[penviron_count>>2]=strings.length;var bufSize=0;strings.forEach(function(string){bufSize+=string.length+1});HEAP32[penviron_buf_size>>2]=bufSize;return 0}function _fd_close(fd){return 0}function _fd_seek(fd,offset_low,offset_high,whence,newOffset){}function _fd_write(fd,iov,iovcnt,pnum){var num=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];for(var j=0;j<len;j++){SYSCALLS.printChar(fd,HEAPU8[ptr+j])}num+=len}HEAP32[pnum>>2]=num;return 0}function __isLeapYear(year){return year%4===0&&(year%100!==0||year%400===0)}function __arraySum(array,index){var sum=0;for(var i=0;i<=index;sum+=array[i++]){}return sum}var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date,days){var newDate=new Date(date.getTime());while(days>0){var leap=__isLeapYear(newDate.getFullYear());var currentMonth=newDate.getMonth();var daysInCurrentMonth=(leap?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR)[currentMonth];if(days>daysInCurrentMonth-newDate.getDate()){days-=daysInCurrentMonth-newDate.getDate()+1;newDate.setDate(1);if(currentMonth<11){newDate.setMonth(currentMonth+1)}else{newDate.setMonth(0);newDate.setFullYear(newDate.getFullYear()+1)}}else{newDate.setDate(newDate.getDate()+days);return newDate}}return newDate}function _strftime(s,maxsize,format,tm){var tm_zone=HEAP32[tm+40>>2];var date={tm_sec:HEAP32[tm>>2],tm_min:HEAP32[tm+4>>2],tm_hour:HEAP32[tm+8>>2],tm_mday:HEAP32[tm+12>>2],tm_mon:HEAP32[tm+16>>2],tm_year:HEAP32[tm+20>>2],tm_wday:HEAP32[tm+24>>2],tm_yday:HEAP32[tm+28>>2],tm_isdst:HEAP32[tm+32>>2],tm_gmtoff:HEAP32[tm+36>>2],tm_zone:tm_zone?UTF8ToString(tm_zone):""};var pattern=UTF8ToString(format);var EXPANSION_RULES_1={"%c":"%a %b %d %H:%M:%S %Y","%D":"%m/%d/%y","%F":"%Y-%m-%d","%h":"%b","%r":"%I:%M:%S %p","%R":"%H:%M","%T":"%H:%M:%S","%x":"%m/%d/%y","%X":"%H:%M:%S","%Ec":"%c","%EC":"%C","%Ex":"%m/%d/%y","%EX":"%H:%M:%S","%Ey":"%y","%EY":"%Y","%Od":"%d","%Oe":"%e","%OH":"%H","%OI":"%I","%Om":"%m","%OM":"%M","%OS":"%S","%Ou":"%u","%OU":"%U","%OV":"%V","%Ow":"%w","%OW":"%W","%Oy":"%y"};for(var rule in EXPANSION_RULES_1){pattern=pattern.replace(new RegExp(rule,"g"),EXPANSION_RULES_1[rule])}var WEEKDAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];var MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];function leadingSomething(value,digits,character){var str=typeof value==="number"?value.toString():value||"";while(str.length<digits){str=character[0]+str}return str}function leadingNulls(value,digits){return leadingSomething(value,digits,"0")}function compareByDay(date1,date2){function sgn(value){return value<0?-1:value>0?1:0}var compare;if((compare=sgn(date1.getFullYear()-date2.getFullYear()))===0){if((compare=sgn(date1.getMonth()-date2.getMonth()))===0){compare=sgn(date1.getDate()-date2.getDate())}}return compare}function getFirstWeekStartDate(janFourth){switch(janFourth.getDay()){case 0:return new Date(janFourth.getFullYear()-1,11,29);case 1:return janFourth;case 2:return new Date(janFourth.getFullYear(),0,3);case 3:return new Date(janFourth.getFullYear(),0,2);case 4:return new Date(janFourth.getFullYear(),0,1);case 5:return new Date(janFourth.getFullYear()-1,11,31);case 6:return new Date(janFourth.getFullYear()-1,11,30)}}function getWeekBasedYear(date){var thisDate=__addDays(new Date(date.tm_year+1900,0,1),date.tm_yday);var janFourthThisYear=new Date(thisDate.getFullYear(),0,4);var janFourthNextYear=new Date(thisDate.getFullYear()+1,0,4);var firstWeekStartThisYear=getFirstWeekStartDate(janFourthThisYear);var firstWeekStartNextYear=getFirstWeekStartDate(janFourthNextYear);if(compareByDay(firstWeekStartThisYear,thisDate)<=0){if(compareByDay(firstWeekStartNextYear,thisDate)<=0){return thisDate.getFullYear()+1}else{return thisDate.getFullYear()}}else{return thisDate.getFullYear()-1}}var EXPANSION_RULES_2={"%a":function(date){return WEEKDAYS[date.tm_wday].substring(0,3)},"%A":function(date){return WEEKDAYS[date.tm_wday]},"%b":function(date){return MONTHS[date.tm_mon].substring(0,3)},"%B":function(date){return MONTHS[date.tm_mon]},"%C":function(date){var year=date.tm_year+1900;return leadingNulls(year/100|0,2)},"%d":function(date){return leadingNulls(date.tm_mday,2)},"%e":function(date){return leadingSomething(date.tm_mday,2," ")},"%g":function(date){return getWeekBasedYear(date).toString().substring(2)},"%G":function(date){return getWeekBasedYear(date)},"%H":function(date){return leadingNulls(date.tm_hour,2)},"%I":function(date){var twelveHour=date.tm_hour;if(twelveHour==0)twelveHour=12;else if(twelveHour>12)twelveHour-=12;return leadingNulls(twelveHour,2)},"%j":function(date){return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900)?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,date.tm_mon-1),3)},"%m":function(date){return leadingNulls(date.tm_mon+1,2)},"%M":function(date){return leadingNulls(date.tm_min,2)},"%n":function(){return"\n"},"%p":function(date){if(date.tm_hour>=0&&date.tm_hour<12){return"AM"}else{return"PM"}},"%S":function(date){return leadingNulls(date.tm_sec,2)},"%t":function(){return"\t"},"%u":function(date){return date.tm_wday||7},"%U":function(date){var janFirst=new Date(date.tm_year+1900,0,1);var firstSunday=janFirst.getDay()===0?janFirst:__addDays(janFirst,7-janFirst.getDay());var endDate=new Date(date.tm_year+1900,date.tm_mon,date.tm_mday);if(compareByDay(firstSunday,endDate)<0){var februaryFirstUntilEndMonth=__arraySum(__isLeapYear(endDate.getFullYear())?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,endDate.getMonth()-1)-31;var firstSundayUntilEndJanuary=31-firstSunday.getDate();var days=firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();return leadingNulls(Math.ceil(days/7),2)}return compareByDay(firstSunday,janFirst)===0?"01":"00"},"%V":function(date){var janFourthThisYear=new Date(date.tm_year+1900,0,4);var janFourthNextYear=new Date(date.tm_year+1901,0,4);var firstWeekStartThisYear=getFirstWeekStartDate(janFourthThisYear);var firstWeekStartNextYear=getFirstWeekStartDate(janFourthNextYear);var endDate=__addDays(new Date(date.tm_year+1900,0,1),date.tm_yday);if(compareByDay(endDate,firstWeekStartThisYear)<0){return"53"}if(compareByDay(firstWeekStartNextYear,endDate)<=0){return"01"}var daysDifference;if(firstWeekStartThisYear.getFullYear()<date.tm_year+1900){daysDifference=date.tm_yday+32-firstWeekStartThisYear.getDate()}else{daysDifference=date.tm_yday+1-firstWeekStartThisYear.getDate()}return leadingNulls(Math.ceil(daysDifference/7),2)},"%w":function(date){return date.tm_wday},"%W":function(date){var janFirst=new Date(date.tm_year,0,1);var firstMonday=janFirst.getDay()===1?janFirst:__addDays(janFirst,janFirst.getDay()===0?1:7-janFirst.getDay()+1);var endDate=new Date(date.tm_year+1900,date.tm_mon,date.tm_mday);if(compareByDay(firstMonday,endDate)<0){var februaryFirstUntilEndMonth=__arraySum(__isLeapYear(endDate.getFullYear())?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,endDate.getMonth()-1)-31;var firstMondayUntilEndJanuary=31-firstMonday.getDate();var days=firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();return leadingNulls(Math.ceil(days/7),2)}return compareByDay(firstMonday,janFirst)===0?"01":"00"},"%y":function(date){return(date.tm_year+1900).toString().substring(2)},"%Y":function(date){return date.tm_year+1900},"%z":function(date){var off=date.tm_gmtoff;var ahead=off>=0;off=Math.abs(off)/60;off=off/60*100+off%60;return(ahead?"+":"-")+String("0000"+off).slice(-4)},"%Z":function(date){return date.tm_zone},"%%":function(){return"%"}};for(var rule in EXPANSION_RULES_2){if(pattern.indexOf(rule)>=0){pattern=pattern.replace(new RegExp(rule,"g"),EXPANSION_RULES_2[rule](date))}}var bytes=intArrayFromString(pattern,false);if(bytes.length>maxsize){return 0}writeArrayToMemory(bytes,s);return bytes.length-1}function _strftime_l(s,maxsize,format,tm){return _strftime(s,maxsize,format,tm)}function intArrayFromString(stringy,dontAddNull,length){var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array}var asmLibraryArg={"b":_abort,"a":_clock,"d":_emscripten_memcpy_big,"e":_emscripten_resize_heap,"g":_environ_get,"h":_environ_sizes_get,"i":_fd_close,"j":_fd_seek,"c":_fd_write,"f":_strftime_l};var asm=createWasm();var ___wasm_call_ctors=Module["___wasm_call_ctors"]=function(){return(___wasm_call_ctors=Module["___wasm_call_ctors"]=Module["asm"]["l"]).apply(null,arguments)};var _free=Module["_free"]=function(){return(_free=Module["_free"]=Module["asm"]["m"]).apply(null,arguments)};var _malloc=Module["_malloc"]=function(){return(_malloc=Module["_malloc"]=Module["asm"]["o"]).apply(null,arguments)};var _Spellchecker_Malloc=Module["_Spellchecker_Malloc"]=function(){return(_Spellchecker_Malloc=Module["_Spellchecker_Malloc"]=Module["asm"]["p"]).apply(null,arguments)};var _Spellchecker_Free=Module["_Spellchecker_Free"]=function(){return(_Spellchecker_Free=Module["_Spellchecker_Free"]=Module["asm"]["q"]).apply(null,arguments)};var _Spellchecker_Create=Module["_Spellchecker_Create"]=function(){return(_Spellchecker_Create=Module["_Spellchecker_Create"]=Module["asm"]["r"]).apply(null,arguments)};var _Spellchecker_Destroy=Module["_Spellchecker_Destroy"]=function(){return(_Spellchecker_Destroy=Module["_Spellchecker_Destroy"]=Module["asm"]["s"]).apply(null,arguments)};var _Spellchecker_AddDictionary=Module["_Spellchecker_AddDictionary"]=function(){return(_Spellchecker_AddDictionary=Module["_Spellchecker_AddDictionary"]=Module["asm"]["t"]).apply(null,arguments)};var _Spellchecker_RemoveDicrionary=Module["_Spellchecker_RemoveDicrionary"]=function(){return(_Spellchecker_RemoveDicrionary=Module["_Spellchecker_RemoveDicrionary"]=Module["asm"]["u"]).apply(null,arguments)};var _Spellchecker_Load=Module["_Spellchecker_Load"]=function(){return(_Spellchecker_Load=Module["_Spellchecker_Load"]=Module["asm"]["v"]).apply(null,arguments)};var _Spellchecker_Spell=Module["_Spellchecker_Spell"]=function(){return(_Spellchecker_Spell=Module["_Spellchecker_Spell"]=Module["asm"]["w"]).apply(null,arguments)};var _Spellchecker_Suggest=Module["_Spellchecker_Suggest"]=function(){return(_Spellchecker_Suggest=Module["_Spellchecker_Suggest"]=Module["asm"]["x"]).apply(null,arguments)};var _Spellchecker_RemoveEngine=Module["_Spellchecker_RemoveEngine"]=function(){return(_Spellchecker_RemoveEngine=Module["_Spellchecker_RemoveEngine"]=Module["asm"]["y"]).apply(null,arguments)};var _Spellchecker_TotalAllocatedMemory=Module["_Spellchecker_TotalAllocatedMemory"]=function(){return(_Spellchecker_TotalAllocatedMemory=Module["_Spellchecker_TotalAllocatedMemory"]=Module["asm"]["z"]).apply(null,arguments)};var calledRun;dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller};function run(args){args=args||arguments_;if(runDependencies>0){return}preRun();if(runDependencies>0){return}function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();preMain();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("")},1);doRun()},1)}else{doRun()}}Module["run"]=run;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}run();


self.spellchecker = null;
function onMessageEvent(data, port)
{
    if (data.type == "init")
    {
        if (self.spellchecker)
            return;
        self.spellchecker = new Spellchecker();
        self.spellchecker.languagesPath = data.dictionaries_path;
        var languages = data.languages;
        for (var i in languages)
        	self.spellchecker.addDefaultLanguage(i, languages[i]);
        self.spellchecker.init();
        return;
    }

    if (!self.spellchecker)
        return;

    self.spellchecker.messages.push(data);
    if (port)
        self.spellchecker.ports.push(port);

    if (1 < self.spellchecker.messages.length)
    {
        // значит еще грузим что-то
        return;
    }

    self.spellchecker.checkMessage();
}

self.onconnect = function(e)
{
    var port = e.ports[0];
    port.onmessage = function(e) {
        onMessageEvent(e.data, port);
    }    
};
self.onmessage = function(e)
{
    onMessageEvent(e.data);
};
self.engineInit = false;
self.onEngineInit = function()
{
	self.engineInit = true;
	if (self.spellchecker)
	{
		self.spellchecker.init();
		self.spellchecker.checkMessage();
	}
};

function Dictionary()
{
	this.dataAff = null;
	this.dataDic = null;
	this.status = 0;
	this.id = 0;
	this.language = null;

	this.load_file = function(src, params)
	{
		var xhr = new XMLHttpRequest();
		xhr.sender = this;
		xhr.params = params;
        xhr.open('GET', src, true);
        xhr.responseType = 'arraybuffer';
        if (xhr.overrideMimeType)
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
        else
            xhr.setRequestHeader('Accept-Charset', 'x-user-defined');

        xhr.onload = function()
        {
        	if (xhr.sender.status >= 2)
        		return;

        	if (this.response && this.status == 200)
            {
                var uintData = new Uint8Array(this.response);
                switch (this.params)
                {
                	case "aff":
            		{
            			this.sender.dataAff = uintData;
            			break;
            		}
            		case "dic":
            		{
            			this.sender.dataDic = uintData;
            			break;
            		}
            		default:
            			break;
                }
                xhr.sender.status++;
            }

            if (xhr.sender.status == 2)
            {
            	self.spellchecker.onLoadDictionary(this.sender);
            }
        };
        xhr.onerror = function()
        {
        	xhr.sender.status = 2;
        	self.spellchecker.onLoadDictionary(this.sender);
        };

        xhr.send(null);
	};

	this.load = function()
	{
		if (!this.language)
		{
			this.status = 2;
			self.spellchecker.onLoadDictionary(this);
			return;
		}
		this.load_file(self.spellchecker.languagesPath + "/" + this.language.aff, "aff");
		this.load_file(self.spellchecker.languagesPath + "/" + this.language.dic, "dic");
	};

	this.freeUnusedData = function()
	{
		this.dataAff = null;
		this.dataDic = null;
	};
}


function Spellchecker()
{
	this.languagesPath = "";
	this.languages = {};
	this.readyLanguages = {};
	this.messages = [];
	this.ports = [];
	this.tmpStrings = new ArrayBuffer(1000);
	this.engine = 0;

	this.maxEngines = 3; 
	this.maxDictionaries = 5;
	this.languageQueue = [];

	this.maxDictionariesHandler = function() 
	{
		if (this.languageQueue.length > this.maxDictionaries) 
		{
			var toDelete = this.languageQueue.length - this.maxDictionaries;
			for (let i = 0; i < toDelete; i++) 
			{
				var lk = this.languageQueue[0];
				this.deleteDictionaty(lk);
				delete this.readyLanguages[lk];
				this.languageQueue.shift();
			}
		}
	};

	this.deleteDictionaty = function(lk) 
	{
		if (!lk) 
			return;

		var affID = lk + ".aff";
		var dicID = lk + ".dic"
		var engineID = affID + dicID;
		var engineIDptr = this.allocString(engineID);
		var langAffptr = this.allocString(affID);
		var langDicptr = this.allocString(dicID);
		Module._Spellchecker_RemoveDicrionary(this.engine, langAffptr);
		Module._Spellchecker_RemoveDicrionary(this.engine, langDicptr);
		Module._Spellchecker_RemoveEngine(this.engine, engineIDptr);
		this.freeString(engineIDptr);
		this.freeString(langAffptr);
		this.freeString(langDicptr);
	};

	this.init = function()
	{
		if (0 == this.engine && self.engineInit)
			this.engine = this.createEngine();
	};

	this.addDefaultLanguage = function(id, path)
	{
		this.languages["" + id] = { 
			aff : path + "/" + path + ".aff", 
			dic : path + "/" + path + ".dic" 
		};
	};

	this.onLoadDictionary = function(dictionary)
	{
		if (!dictionary.dataAff || !dictionary.dataDic)
		{
			this.checkMessage();
			return;
		}

		var aff_path = this.allocString(dictionary.id + ".aff");
		var dic_path = this.allocString(dictionary.id + ".dic");

		var pointerAff = Module._Spellchecker_Malloc(dictionary.dataAff.length);
    	Module.HEAP8.set(dictionary.dataAff, pointerAff);
    	var pointerDic = Module._Spellchecker_Malloc(dictionary.dataDic.length);
    	Module.HEAP8.set(dictionary.dataDic, pointerDic);

    	Module._Spellchecker_AddDictionary(this.engine, aff_path, pointerAff, dictionary.dataAff.length);
    	Module._Spellchecker_AddDictionary(this.engine, dic_path, pointerDic, dictionary.dataDic.length);

		this.freeString(aff_path);
		this.freeString(dic_path);

		dictionary.freeUnusedData();

		this.checkMessage();
	};

	this.checkMessage = function()
	{
		if (0 == this.messages.length || !self.engineInit)
			return;

		var m = this.messages[0];
		var isReady = true;
		for (var indexLang = 0, lenLangs = m.usrLang.length; indexLang < lenLangs; indexLang++)
		{
			var lang_key = "" + m.usrLang[indexLang];
			var readyLang = this.readyLanguages[lang_key];
			if (!readyLang)
			{
				// начнем грузить
				var langToReady = new Dictionary();
				langToReady.id = lang_key;
				langToReady.language = this.languages[lang_key];
				this.readyLanguages[lang_key] = langToReady;
				this.languageQueue.push(lang_key); // push lang info into the queue
				langToReady.load();

				isReady = false;
				break;
			}
			else if (readyLang.status != 2)
			{
				// ждем
				isReady = false;
				break;
			}
			else
			{				
				// все готово.
				continue;	
			}
		}

		if (!isReady)
		{
			// ждем
			return;
		}

		switch (m.type)
		{
			case "spell":
			{
				this.Spell(m);
				break;
			}
			case "suggest":
			{
				this.Suggest(m);
				break;
			}
			default:
				break;
		}
		this.maxDictionariesHandler();
		this.messages.shift();
	};

	this.allocString = function(string)
	{
		var inputLen = string.length;
		var testLen = 6 * inputLen + 1;
		if (testLen > this.tmpStrings.byteLength)
			this.tmpStrings = new ArrayBuffer(testLen);

		var code = 0;
		var index = 0;

		var outputIndex = 0;
		var outputDataTmp = new Uint8Array(this.tmpStrings);
		var outputData = outputDataTmp;

        while (index < inputLen)
        {
        	code = string.charCodeAt(index++);
        	if (code >= 0xD800 && code <= 0xDFFF && index < inputLen)
            {
                code = 0x10000 + (((code & 0x3FF) << 10) | (0x03FF & string.charCodeAt(index++)));
            }

            if (code < 0x80)
            {
                outputData[outputIndex++] = code;
            }
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

        outputData[outputIndex++] = 0;

        var tmpBuffer = new Uint8Array(this.tmpStrings, 0, outputIndex);
        var pointer = Module._Spellchecker_Malloc(outputIndex);
    	Module.HEAP8.set(tmpBuffer, pointer);
    	return pointer;
	};
	this.freeString = function(stringPointer)
	{
		Module._Spellchecker_Free(stringPointer);
	};

	this.readFromUtf8 = function(buffer, start, len)
	{
		var result = "";
		var index = start;
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
	        {
	          	u0 = (u0 & 15) << 12 | u1 << 6 | u2;
	        } 
	        else 
	        {
	          	u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | buffer[index++] & 63;
	        }
	        if (u0 < 65536) 
	        {
	          	result += String.fromCharCode(u0);
	        } 
	        else 
	        {
	          	var ch = u0 - 65536;
	          	result += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
	        }
      	}
      	return result;
	};

	this.readSuggests = function(pointer)
	{
		if (0 == pointer)
			return [];

		var lenArray = new Int32Array(Module["HEAP8"].buffer, pointer, 4);
		var len = lenArray[0];
		len -= 4;

		var buffer = new Uint8Array(Module["HEAP8"].buffer, pointer + 4, len);
		var index = 0;
		var ret = [];
		while (index < len)
		{
			var lenRec = buffer[index] | buffer[index + 1] << 8 | buffer[index + 2] << 16 | buffer[index + 3] << 24;
			index += 4;
			ret.push(this.readFromUtf8(buffer, index, lenRec));
			index += lenRec;
		}
		return ret;
	};

	this.createEngine = function()
	{
		return Module._Spellchecker_Create(this.maxEngines);
	};
	this.destroyEngine = function()
	{
		Module._Spellchecker_Destroy();
	};

	this.Spell = function(data)
	{
		var len = Math.min(data.usrLang.length, data.usrWords.length);
		if (0 == len)
			return;
		data.usrCorrect = new Array(len);
		var curLang = "";		
		for (var i = 0; i < len; i++)
		{
			if (curLang != ("" + data.usrLang[i]))
			{
				curLang = "" + data.usrLang[i];
				var aff = this.allocString(curLang + ".aff");
				var dic = this.allocString(curLang + ".dic");
				ret = Module._Spellchecker_Load(this.engine, aff, dic);
				this.freeString(aff);
				this.freeString(dic);
			}
			var word = this.allocString(data.usrWords[i]);
			data.usrCorrect[i] = (1 == Module._Spellchecker_Spell(this.engine, word)) ? true : false;
			this.freeString(word);
		}

		this.sendAnswer(data);
	};

	this.Suggest = function(data)
	{
		var len = Math.min(data.usrLang.length, data.usrWords.length);
		if (0 == len)
			return;
		data.usrSuggest = new Array(len);
		var curLang = "";		
		for (var i = 0; i < len; i++)
		{
			if (curLang != ("" + data.usrLang[i]))
			{
				curLang = "" + data.usrLang[i];
				var aff = this.allocString(curLang + ".aff");
				var dic = this.allocString(curLang + ".dic");

				ret = Module._Spellchecker_Load(this.engine, aff, dic);

				this.freeString(aff);
				this.freeString(dic);
			}
			var word = this.allocString(data.usrWords[i]);
			var pointerSuggests = Module._Spellchecker_Suggest(this.engine, word);
			data.usrSuggest[i] = this.readSuggests(pointerSuggests);
			this.freeString(word);
		}

		this.sendAnswer(data);
	};

	this.sendAnswer = function(data)
	{
		if (self.spellchecker.ports.length == 0)
		{
            self.postMessage(data);
        }
        else
        {
            var port = self.spellchecker.ports.shift();
            port.postMessage(data);
        }

		setTimeout(function(){
			self.spellchecker.checkMessage();
		}, 1);
	};
}
