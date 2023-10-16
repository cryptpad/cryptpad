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

(function(window, undefined){

	// correct fetch for desktop application

var printErr = undefined;
var print    = undefined;

var fetch = ("undefined" !== typeof window) ? window.fetch : (("undefined" !== typeof self) ? self.fetch : null);
var getBinaryPromise = null;

function internal_isLocal()
{
	if (window.navigator && window.navigator.userAgent.toLowerCase().indexOf("ascdesktopeditor") < 0)
		return false;
	if (window.location && window.location.protocol == "file:")
		return true;
	if (window.document && window.document.currentScript && 0 == window.document.currentScript.src.indexOf("file:///"))
		return true;
	return false;
}

if (internal_isLocal())
{
	fetch = undefined; // fetch not support file:/// scheme
	getBinaryPromise = function()
	{
		var wasmPath = "ascdesktop://fonts/" + wasmBinaryFile.substr(8);
		return new Promise(function (resolve, reject)
		{
			var xhr = new XMLHttpRequest();
			xhr.open('GET', wasmPath, true);
			xhr.responseType = 'arraybuffer';

			if (xhr.overrideMimeType)
				xhr.overrideMimeType('text/plain; charset=x-user-defined');
			else
				xhr.setRequestHeader('Accept-Charset', 'x-user-defined');

			xhr.onload = function ()
			{
				if (this.status == 200)
					resolve(new Uint8Array(this.response));
			};
			xhr.send(null);
		});
	}
}
else
{
	getBinaryPromise = function() { return getBinaryPromise2(); }
}


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


	var Module=typeof Module!="undefined"?Module:{};var moduleOverrides=Object.assign({},Module);var arguments_=[];var thisProgram="./this.program";var quit_=(status,toThrow)=>{throw toThrow};var ENVIRONMENT_IS_WEB=typeof window=="object";var ENVIRONMENT_IS_WORKER=typeof importScripts=="function";var ENVIRONMENT_IS_NODE=typeof process=="object"&&typeof process.versions=="object"&&typeof process.versions.node=="string";var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readAsync,readBinary,setWindowTitle;if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href}else if(typeof document!="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src}if(scriptDirectory.indexOf("blob:")!==0){scriptDirectory=scriptDirectory.substr(0,scriptDirectory.replace(/[?#].*/,"").lastIndexOf("/")+1)}else{scriptDirectory=""}{read_=(url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText});if(ENVIRONMENT_IS_WORKER){readBinary=(url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)})}readAsync=((url,onload,onerror)=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=(()=>{if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}onerror()});xhr.onerror=onerror;xhr.send(null)})}setWindowTitle=(title=>document.title=title)}else{}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.warn.bind(console);Object.assign(Module,moduleOverrides);moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var tempRet0=0;var setTempRet0=value=>{tempRet0=value};var getTempRet0=()=>tempRet0;var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];var noExitRuntime=Module["noExitRuntime"]||true;if(typeof WebAssembly!="object"){abort("no native wasm support detected")}var wasmMemory;var ABORT=false;var EXITSTATUS;var UTF8Decoder=typeof TextDecoder!="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(heapOrArray,idx,maxBytesToRead){var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heapOrArray[endPtr]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heapOrArray.buffer&&UTF8Decoder){return UTF8Decoder.decode(heapOrArray.subarray(idx,endPtr))}else{var str="";while(idx<endPtr){var u0=heapOrArray[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}}return str}function UTF8ToString(ptr,maxBytesToRead){return ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):""}function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i)}if(!dontAddNull)HEAP8[buffer>>0]=0}var buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferAndViews(buf){buffer=buf;Module["HEAP8"]=HEAP8=new Int8Array(buf);Module["HEAP16"]=HEAP16=new Int16Array(buf);Module["HEAP32"]=HEAP32=new Int32Array(buf);Module["HEAPU8"]=HEAPU8=new Uint8Array(buf);Module["HEAPU16"]=HEAPU16=new Uint16Array(buf);Module["HEAPU32"]=HEAPU32=new Uint32Array(buf);Module["HEAPF32"]=HEAPF32=new Float32Array(buf);Module["HEAPF64"]=HEAPF64=new Float64Array(buf)}var INITIAL_MEMORY=Module["INITIAL_MEMORY"]||16777216;var wasmTable;var __ATPRERUN__=[];var __ATINIT__=[];var __ATPOSTRUN__=[function(){self.onZlibEngineInit();}];var runtimeInitialized=false;function keepRuntimeAlive(){return noExitRuntime}function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}function addOnInit(cb){__ATINIT__.unshift(cb)}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["preloadedImages"]={};Module["preloadedAudios"]={};function abort(what){{if(Module["onAbort"]){Module["onAbort"](what)}}what="Aborted("+what+")";err(what);ABORT=true;EXITSTATUS=1;what+=". Build with -s ASSERTIONS=1 for more info.";var e=new WebAssembly.RuntimeError(what);throw e}var dataURIPrefix="data:application/octet-stream;base64,";function isDataURI(filename){return filename.startsWith(dataURIPrefix)}var wasmBinaryFile;wasmBinaryFile="zlib.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile)}function getBinary(file){try{if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}else{throw"both async and sync fetching of the wasm failed"}}catch(err){abort(err)}}function getBinaryPromise2(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)){if(typeof fetch=="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw"failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary(wasmBinaryFile)})}}return Promise.resolve().then(function(){return getBinary(wasmBinaryFile)})}function createWasm(){var info={"a":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;Module["asm"]=exports;wasmMemory=Module["asm"]["I"];updateGlobalBufferAndViews(wasmMemory.buffer);wasmTable=Module["asm"]["M"];addOnInit(Module["asm"]["J"]);removeRunDependency("wasm-instantiate")}addRunDependency("wasm-instantiate");function receiveInstantiationResult(result){receiveInstance(result["instance"])}function instantiateArrayBuffer(receiver){return getBinaryPromise().then(function(binary){return WebAssembly.instantiate(binary,info)}).then(function(instance){return instance}).then(receiver,function(reason){err("failed to asynchronously prepare wasm: "+reason);abort(reason)})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming=="function"&&!isDataURI(wasmBinaryFile)&&typeof fetch=="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiationResult,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiationResult)})})}else{return instantiateArrayBuffer(receiveInstantiationResult)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);return false}}instantiateAsync();return{}}function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback(Module);continue}var func=callback.func;if(typeof func=="number"){if(callback.arg===undefined){getWasmTableEntry(func)()}else{getWasmTableEntry(func)(callback.arg)}}else{func(callback.arg===undefined?null:callback.arg)}}}var wasmTableMirror=[];function getWasmTableEntry(funcPtr){var func=wasmTableMirror[funcPtr];if(!func){if(funcPtr>=wasmTableMirror.length)wasmTableMirror.length=funcPtr+1;wasmTableMirror[funcPtr]=func=wasmTable.get(funcPtr)}return func}function ___assert_fail(condition,filename,line,func){abort("Assertion failed: "+UTF8ToString(condition)+", at: "+[filename?UTF8ToString(filename):"unknown filename",line,func?UTF8ToString(func):"unknown function"])}function ___cxa_allocate_exception(size){return _malloc(size+16)+16}function ExceptionInfo(excPtr){this.excPtr=excPtr;this.ptr=excPtr-16;this.set_type=function(type){HEAP32[this.ptr+4>>2]=type};this.get_type=function(){return HEAP32[this.ptr+4>>2]};this.set_destructor=function(destructor){HEAP32[this.ptr+8>>2]=destructor};this.get_destructor=function(){return HEAP32[this.ptr+8>>2]};this.set_refcount=function(refcount){HEAP32[this.ptr>>2]=refcount};this.set_caught=function(caught){caught=caught?1:0;HEAP8[this.ptr+12>>0]=caught};this.get_caught=function(){return HEAP8[this.ptr+12>>0]!=0};this.set_rethrown=function(rethrown){rethrown=rethrown?1:0;HEAP8[this.ptr+13>>0]=rethrown};this.get_rethrown=function(){return HEAP8[this.ptr+13>>0]!=0};this.init=function(type,destructor){this.set_type(type);this.set_destructor(destructor);this.set_refcount(0);this.set_caught(false);this.set_rethrown(false)};this.add_ref=function(){var value=HEAP32[this.ptr>>2];HEAP32[this.ptr>>2]=value+1};this.release_ref=function(){var prev=HEAP32[this.ptr>>2];HEAP32[this.ptr>>2]=prev-1;return prev===1}}var exceptionLast=0;var uncaughtExceptionCount=0;function ___cxa_throw(ptr,type,destructor){var info=new ExceptionInfo(ptr);info.init(type,destructor);exceptionLast=ptr;uncaughtExceptionCount++;throw ptr}var SYSCALLS={buffers:[null,[],[]],printChar:function(stream,curr){var buffer=SYSCALLS.buffers[stream];if(curr===0||curr===10){(stream===1?out:err)(UTF8ArrayToString(buffer,0));buffer.length=0}else{buffer.push(curr)}},varargs:undefined,get:function(){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret},getStr:function(ptr){var ret=UTF8ToString(ptr);return ret},get64:function(low,high){return low}};function ___syscall_fcntl64(fd,cmd,varargs){SYSCALLS.varargs=varargs;return 0}function ___syscall_ioctl(fd,op,varargs){SYSCALLS.varargs=varargs;return 0}function ___syscall_openat(dirfd,path,flags,varargs){SYSCALLS.varargs=varargs}function ___syscall_rmdir(path){}function ___syscall_stat64(path,buf){}function ___syscall_unlinkat(dirfd,path,flags){}function __emscripten_date_now(){return Date.now()}function __emscripten_throw_longjmp(){throw Infinity}function _abort(){abort("")}function _emscripten_memcpy_big(dest,src,num){HEAPU8.copyWithin(dest,src,src+num)}function _emscripten_get_heap_max(){return 2147483648}function emscripten_realloc_buffer(size){try{wasmMemory.grow(size-buffer.byteLength+65535>>>16);updateGlobalBufferAndViews(wasmMemory.buffer);return 1}catch(e){}}function _emscripten_resize_heap(requestedSize){var oldSize=HEAPU8.length;requestedSize=requestedSize>>>0;var maxHeapSize=_emscripten_get_heap_max();if(requestedSize>maxHeapSize){return false}let alignUp=(x,multiple)=>x+(multiple-x%multiple)%multiple;for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignUp(Math.max(requestedSize,overGrownHeapSize),65536));var replacement=emscripten_realloc_buffer(newSize);if(replacement){return true}}return false}var ENV={};function getExecutableName(){return thisProgram||"./this.program"}function getEnvStrings(){if(!getEnvStrings.strings){var lang=(typeof navigator=="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8";var env={"USER":"web_user","LOGNAME":"web_user","PATH":"/","PWD":"/","HOME":"/home/web_user","LANG":lang,"_":getExecutableName()};for(var x in ENV){if(ENV[x]===undefined)delete env[x];else env[x]=ENV[x]}var strings=[];for(var x in env){strings.push(x+"="+env[x])}getEnvStrings.strings=strings}return getEnvStrings.strings}function _environ_get(__environ,environ_buf){var bufSize=0;getEnvStrings().forEach(function(string,i){var ptr=environ_buf+bufSize;HEAP32[__environ+i*4>>2]=ptr;writeAsciiToMemory(string,ptr);bufSize+=string.length+1});return 0}function _environ_sizes_get(penviron_count,penviron_buf_size){var strings=getEnvStrings();HEAP32[penviron_count>>2]=strings.length;var bufSize=0;strings.forEach(function(string){bufSize+=string.length+1});HEAP32[penviron_buf_size>>2]=bufSize;return 0}function _exit(status){exit(status)}function _fd_close(fd){return 0}function _fd_read(fd,iov,iovcnt,pnum){var stream=SYSCALLS.getStreamFromFD(fd);var num=SYSCALLS.doReadv(stream,iov,iovcnt);HEAP32[pnum>>2]=num;return 0}function _fd_seek(fd,offset_low,offset_high,whence,newOffset){}function _fd_write(fd,iov,iovcnt,pnum){var num=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov>>2];var len=HEAP32[iov+4>>2];iov+=8;for(var j=0;j<len;j++){SYSCALLS.printChar(fd,HEAPU8[ptr+j])}num+=len}HEAP32[pnum>>2]=num;return 0}function _getTempRet0(){return getTempRet0()}function _setTempRet0(val){setTempRet0(val)}var asmLibraryArg={"c":___assert_fail,"d":___cxa_allocate_exception,"m":___cxa_throw,"p":___syscall_fcntl64,"C":___syscall_ioctl,"D":___syscall_openat,"x":___syscall_rmdir,"w":___syscall_stat64,"y":___syscall_unlinkat,"E":__emscripten_date_now,"u":__emscripten_throw_longjmp,"k":_abort,"F":_emscripten_memcpy_big,"v":_emscripten_resize_heap,"z":_environ_get,"A":_environ_sizes_get,"G":_exit,"q":_fd_close,"B":_fd_read,"t":_fd_seek,"o":_fd_write,"a":_getTempRet0,"h":invoke_ii,"j":invoke_iii,"f":invoke_iiii,"l":invoke_iiiii,"n":invoke_iiiiii,"r":invoke_v,"i":invoke_vi,"e":invoke_vii,"g":invoke_viii,"s":invoke_viiii,"H":invoke_viiiiiiiii,"b":_setTempRet0};var asm=createWasm();var ___wasm_call_ctors=Module["___wasm_call_ctors"]=function(){return(___wasm_call_ctors=Module["___wasm_call_ctors"]=Module["asm"]["J"]).apply(null,arguments)};var _malloc=Module["_malloc"]=function(){return(_malloc=Module["_malloc"]=Module["asm"]["K"]).apply(null,arguments)};var _free=Module["_free"]=function(){return(_free=Module["_free"]=Module["asm"]["L"]).apply(null,arguments)};var _Zlib_Malloc=Module["_Zlib_Malloc"]=function(){return(_Zlib_Malloc=Module["_Zlib_Malloc"]=Module["asm"]["N"]).apply(null,arguments)};var _Zlib_Free=Module["_Zlib_Free"]=function(){return(_Zlib_Free=Module["_Zlib_Free"]=Module["asm"]["O"]).apply(null,arguments)};var _Zlib_Create=Module["_Zlib_Create"]=function(){return(_Zlib_Create=Module["_Zlib_Create"]=Module["asm"]["P"]).apply(null,arguments)};var _Zlib_Open=Module["_Zlib_Open"]=function(){return(_Zlib_Open=Module["_Zlib_Open"]=Module["asm"]["Q"]).apply(null,arguments)};var _Zlib_Close=Module["_Zlib_Close"]=function(){return(_Zlib_Close=Module["_Zlib_Close"]=Module["asm"]["R"]).apply(null,arguments)};var _Zlib_AddFile=Module["_Zlib_AddFile"]=function(){return(_Zlib_AddFile=Module["_Zlib_AddFile"]=Module["asm"]["S"]).apply(null,arguments)};var _Zlib_RemoveFile=Module["_Zlib_RemoveFile"]=function(){return(_Zlib_RemoveFile=Module["_Zlib_RemoveFile"]=Module["asm"]["T"]).apply(null,arguments)};var _Zlib_GetPaths=Module["_Zlib_GetPaths"]=function(){return(_Zlib_GetPaths=Module["_Zlib_GetPaths"]=Module["asm"]["U"]).apply(null,arguments)};var _Zlib_GetFile=Module["_Zlib_GetFile"]=function(){return(_Zlib_GetFile=Module["_Zlib_GetFile"]=Module["asm"]["V"]).apply(null,arguments)};var _Zlib_Save=Module["_Zlib_Save"]=function(){return(_Zlib_Save=Module["_Zlib_Save"]=Module["asm"]["W"]).apply(null,arguments)};var _Raster_DecodeFile=Module["_Raster_DecodeFile"]=function(){return(_Raster_DecodeFile=Module["_Raster_DecodeFile"]=Module["asm"]["X"]).apply(null,arguments)};var _Raster_GetDecodedBuffer=Module["_Raster_GetDecodedBuffer"]=function(){return(_Raster_GetDecodedBuffer=Module["_Raster_GetDecodedBuffer"]=Module["asm"]["Y"]).apply(null,arguments)};var _Raster_GetWidth=Module["_Raster_GetWidth"]=function(){return(_Raster_GetWidth=Module["_Raster_GetWidth"]=Module["asm"]["Z"]).apply(null,arguments)};var _Raster_GetHeight=Module["_Raster_GetHeight"]=function(){return(_Raster_GetHeight=Module["_Raster_GetHeight"]=Module["asm"]["_"]).apply(null,arguments)};var _Raster_GetStride=Module["_Raster_GetStride"]=function(){return(_Raster_GetStride=Module["_Raster_GetStride"]=Module["asm"]["$"]).apply(null,arguments)};var _Raster_Destroy=Module["_Raster_Destroy"]=function(){return(_Raster_Destroy=Module["_Raster_Destroy"]=Module["asm"]["aa"]).apply(null,arguments)};var _Raster_EncodeImageData=Module["_Raster_EncodeImageData"]=function(){return(_Raster_EncodeImageData=Module["_Raster_EncodeImageData"]=Module["asm"]["ba"]).apply(null,arguments)};var _Raster_Encode=Module["_Raster_Encode"]=function(){return(_Raster_Encode=Module["_Raster_Encode"]=Module["asm"]["ca"]).apply(null,arguments)};var _Raster_GetEncodedSize=Module["_Raster_GetEncodedSize"]=function(){return(_Raster_GetEncodedSize=Module["_Raster_GetEncodedSize"]=Module["asm"]["da"]).apply(null,arguments)};var _Raster_GetEncodedBuffer=Module["_Raster_GetEncodedBuffer"]=function(){return(_Raster_GetEncodedBuffer=Module["_Raster_GetEncodedBuffer"]=Module["asm"]["ea"]).apply(null,arguments)};var _Raster_DestroyEncodedData=Module["_Raster_DestroyEncodedData"]=function(){return(_Raster_DestroyEncodedData=Module["_Raster_DestroyEncodedData"]=Module["asm"]["fa"]).apply(null,arguments)};var _Image_GetFormat=Module["_Image_GetFormat"]=function(){return(_Image_GetFormat=Module["_Image_GetFormat"]=Module["asm"]["ga"]).apply(null,arguments)};var _setThrew=Module["_setThrew"]=function(){return(_setThrew=Module["_setThrew"]=Module["asm"]["ha"]).apply(null,arguments)};var stackSave=Module["stackSave"]=function(){return(stackSave=Module["stackSave"]=Module["asm"]["ia"]).apply(null,arguments)};var stackRestore=Module["stackRestore"]=function(){return(stackRestore=Module["stackRestore"]=Module["asm"]["ja"]).apply(null,arguments)};function invoke_ii(index,a1){var sp=stackSave();try{return getWasmTableEntry(index)(a1)}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}function invoke_iii(index,a1,a2){var sp=stackSave();try{return getWasmTableEntry(index)(a1,a2)}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}function invoke_iiii(index,a1,a2,a3){var sp=stackSave();try{return getWasmTableEntry(index)(a1,a2,a3)}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}function invoke_viii(index,a1,a2,a3){var sp=stackSave();try{getWasmTableEntry(index)(a1,a2,a3)}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}function invoke_vi(index,a1){var sp=stackSave();try{getWasmTableEntry(index)(a1)}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}function invoke_iiiiii(index,a1,a2,a3,a4,a5){var sp=stackSave();try{return getWasmTableEntry(index)(a1,a2,a3,a4,a5)}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}function invoke_vii(index,a1,a2){var sp=stackSave();try{getWasmTableEntry(index)(a1,a2)}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}function invoke_iiiii(index,a1,a2,a3,a4){var sp=stackSave();try{return getWasmTableEntry(index)(a1,a2,a3,a4)}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}function invoke_viiii(index,a1,a2,a3,a4){var sp=stackSave();try{getWasmTableEntry(index)(a1,a2,a3,a4)}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9){var sp=stackSave();try{getWasmTableEntry(index)(a1,a2,a3,a4,a5,a6,a7,a8,a9)}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}function invoke_v(index){var sp=stackSave();try{getWasmTableEntry(index)()}catch(e){stackRestore(sp);if(e!==e+0)throw e;_setThrew(1,0)}}var calledRun;function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status}dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller};function run(args){args=args||arguments_;if(runDependencies>0){return}preRun();if(runDependencies>0){return}function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("")},1);doRun()},1)}else{doRun()}}Module["run"]=run;function exit(status,implicit){EXITSTATUS=status;procExit(status)}function procExit(code){EXITSTATUS=code;if(!keepRuntimeAlive()){if(Module["onExit"])Module["onExit"](code);ABORT=true}quit_(code,new ExitStatus(code))}if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}run();


	/**
	 * Class representing a zip archive creator/reader.
	 * @constructor
	 */
	function ZLib()
	{
		this.engine = 0; // указатель на нативный класс Zlib
		this.files = {};
	}

	/**
	 * Check loaded wasm/asmjs module
	 */
	ZLib.prototype.isModuleInit = false;

	/**
	 * Open archive from bytes
	 * @param {Uint8Array | ArrayBuffer} buf
	 * @returns {boolean} success or not
	 */
	ZLib.prototype.open = function(buf)
	{
		if (!this.isModuleInit)
			return false;

		if (this.engine)
			this.close();

		if (!buf)
			return false;

		var arrayBuffer = (undefined !== buf.byteLength) ? new Uint8Array(buf) : buf;

		// TODO: открыли архив, и заполнили this.files
		// объектами { path : null }

		// копируем память в память webasm
		var FileRawDataSize = arrayBuffer.length;
		var FileRawData = Module["_Zlib_Malloc"](FileRawDataSize);
		if (0 == FileRawData)
			return false;
		Module["HEAP8"].set(arrayBuffer, FileRawData);

		// грузим данные
		this.engine = Module["_Zlib_Open"](FileRawData, FileRawDataSize);
		if (0 == this.engine)
		{
			Module["_Zlib_Free"](FileRawData);
			return false;
		}

		// получаем пути в архиве
		var pointer = Module["_Zlib_GetPaths"](this.engine);
		if (0 == pointer)
		{
			Module["_Zlib_Close"](this.engine);
			Module["_Zlib_Free"](FileRawData);
			return false;
		}
		var lenArray = new Int32Array(Module["HEAP8"].buffer, pointer, 4);
		var len = lenArray[0];
		len -= 4;

		var buffer = new Uint8Array(Module["HEAP8"].buffer, pointer + 4, len);
		var index = 0;
		while (index < len)
		{
			var lenRec = buffer[index] | buffer[index + 1] << 8 | buffer[index + 2] << 16 | buffer[index + 3] << 24;
			index += 4;
			var _path = "".fromUtf8(buffer, index, lenRec);
			this.files[_path] = null;
			index += lenRec;
		}
		Module["_Zlib_Free"](FileRawData);
		Module["_Zlib_Free"](pointer);
		return true;
	};

	/**
	 * Create new archive
	 * @returns {boolean} success or not
	 */
	ZLib.prototype.create = function()
	{
		if (!this.isModuleInit)
			return false;

		if (this.engine)
			this.close();

		this.engine = Module["_Zlib_Create"]();
		return !!this.engine;
	};

	/**
	 * Save archive from current files
	 * @returns {Uint8Array | null} zip-archive bytes, or null if error
	 */
	ZLib.prototype.save = function()
	{
		if (!this.isModuleInit || !this.engine)
			return null;

		var pointerZip = Module["_Zlib_Save"](this.engine);
		if (0 == pointerZip)
			return null;

		var _lenFile = new Int32Array(Module["HEAP8"].buffer, pointerZip, 4);
		var len = _lenFile[0];
		var zip = new Uint8Array(Module["HEAP8"].buffer, pointerZip + 4, len);
		return zip;
	};

	/**
	 * Get all file paths in archive
	 * @returns {Array}
	 */
	ZLib.prototype.getPaths = function()
	{
		var retFiles = [];
		if (!this.files)
			return retFiles;

		for (var path in this.files) 
		{
			if (this.files.hasOwnProperty(path))
				retFiles.push(path);
		}
		return retFiles;
	};

	/**
	 * Get uncomressed file from archive
	 * @param {string} path
	 * @returns {Uint8Array | null} bytes of uncompressed data, or null if error
	 */
	ZLib.prototype.getFile = function(path)
	{
		if (!this.isModuleInit || !this.engine)
			return null;

		// проверяем - есть ли файл вообще?
		if (undefined === this.files[path])
			return null;

		// проверяем - может мы уже его разжимали?
		if (null !== this.files[path])
		{
			if (this.files[path].l > 0)
			{
				return new Uint8Array(Module["HEAP8"].buffer, this.files[path].p, this.files[path].l);
			}
			else
			{
				var _lenFile = new Int32Array(Module["HEAP8"].buffer, this.files[path].p, 4);
				var len = _lenFile[0];
				return new Uint8Array(Module["HEAP8"].buffer, this.files[path].p + 4, len);
			}
		}

		var tmp = path.toUtf8();
		var pointer = Module["_Zlib_Malloc"](tmp.length);
		if (0 == pointer)
			return null;
		Module["HEAP8"].set(tmp, pointer);

		var pointerFile = Module["_Zlib_GetFile"](this.engine, pointer);
		if (0 == pointerFile) 
		{
			Module["_Zlib_Free"](pointer);
			return null;
		}

		var _lenFile = new Int32Array(Module["HEAP8"].buffer, pointerFile, 4);
		var len = _lenFile[0];

		Module["_Zlib_Free"](pointer);
		this.files[path] = { p : pointerFile, l : 0};
		return new Uint8Array(Module["HEAP8"].buffer, pointerFile + 4, len);
	};

	/**
	 * Add uncomressed file to archive
	 * @param {string} path
	 * @param {Uint8Array} new file in archive
	 * @returns {boolean} success or not
	 */
	ZLib.prototype.addFile = function(path, data)
	{
		if (!this.isModuleInit || !this.engine)
			return false;

		if (!data)
			return false;

		// проверяем - может такой файл уже есть? тогда его надо сначала удалить?
		if (undefined !== this.files[path])
			this.removeFile(path);

		var tmp = path.toUtf8();
		var pointer = Module["_Zlib_Malloc"](tmp.length);
		if (0 == pointer)
			return false;
		Module["HEAP8"].set(tmp, pointer);

		var arrayBuffer = (undefined !== data.byteLength) ? new Uint8Array(data) : data;

		var FileRawDataSize = arrayBuffer.length;
		var FileRawData = Module["_Zlib_Malloc"](FileRawDataSize);
		if (0 == FileRawData)
		{
			Module["_Zlib_Free"](pointer);
			return false;
		}
		Module["HEAP8"].set(arrayBuffer, FileRawData);
		
		Module["_Zlib_AddFile"](this.engine, pointer, FileRawData, FileRawDataSize);

		this.files[path] = { p : FileRawData, l : FileRawDataSize};
		Module["_Zlib_Free"](pointer);
		return true;
	};

	/**
	 * Remove file from archive
	 * @param {string} path
	 * @returns {boolean} success or not
	 */
	ZLib.prototype.removeFile = function(path)
	{
		if (!this.isModuleInit || !this.engine)
			return false;

		// проверяем - может такого файла и нет?
		if (undefined === this.files[path])
			return false;
			
		var tmp = path.toUtf8();
		var pointer = Module["_Zlib_Malloc"](tmp.length);
		if (0 == pointer)
			return false;
		Module["HEAP8"].set(tmp, pointer);
		
		Module["_Zlib_RemoveFile"](this.engine, pointer);

		if (this.files[path] && this.files[path].p)
		{
			Module["_Zlib_Free"](this.files[path].p);
			delete this.files[path];
		}
		Module["_Zlib_Free"](pointer);
		return true;
	};

	/**
	 * Close & remove all used memory in archive
	 * @returns {undefined}
	 */
	ZLib.prototype.close = function()
	{
		if (!this.isModuleInit || !this.engine)
			return;

		for (var i in this.files)
		{
			if (this.files[i] && this.files[i].p)
				Module["_Zlib_Free"](this.files[i].p);
		}

		this.files = {};
		if (this.engine)
			Module["_Zlib_Free"](this.engine);
		this.engine = 0;
	};

	/**
	 * Get image type
	 * @returns {Number}
	 */
	ZLib.prototype.getImageType = function(path)
	{
		let fileData = this.getFile(path);
		return Module["_Image_GetFormat"](this.files[path].p + 4, fileData.length);
	};

	/**
	 * Get image in needed format
	 * @returns {Uint8Array}
	 */
	ZLib.prototype.getImageAsFormat = function(path, format)
	{
		let fileData = this.getFile(path);
		let encodedData = Module["_Raster_Encode"](this.files[path].p + 4, fileData.length, format);
		let encodedSize = Module["_Raster_GetEncodedSize"](encodedData);
		let encodedBuffer = Module["_Raster_GetEncodedBuffer"](encodedData);

		let copyData = new Uint8Array(encodedSize);
		copyData.set(new Uint8Array(Module["HEAP8"].buffer, encodedBuffer, encodedSize));

		Module["_Raster_DestroyEncodedData"](encodedData);

		return copyData;
	};
	/**
	 * Get image as svg (for simple test)
	 * @returns {string}
	 */
	ZLib.prototype.getImageAsSvg = function(path)
	{
		let fileData = this.getFile(path);
		let encodedData = Module["_Raster_Encode"](this.files[path].p + 4, fileData.length, 24);
		let encodedSize = Module["_Raster_GetEncodedSize"](encodedData);
		let encodedBuffer = Module["_Raster_GetEncodedBuffer"](encodedData);

		let string = String.prototype.fromUtf8(new Uint8Array(Module["HEAP8"].buffer, encodedBuffer, encodedSize));

		Module["_Raster_DestroyEncodedData"](encodedData);

		return string;
	};
	/**
	 * Get image blob for browser
	 * @returns {Blob}
	 */
	ZLib.prototype.getImageBlob = function(path)
	{
		let imageType = this.getImageType(path);
		if (imageType != 10 && imageType != 21)
		{
			return new Blob([this.getFile(path)], {type:AscCommon.openXml.GetMimeType(AscCommon.GetFileExtension(path))});
		}

		let fileData = this.getFile(path);
		let encodedData = Module["_Raster_Encode"](this.files[path].p + 4, fileData.length, 24);
		let encodedSize = Module["_Raster_GetEncodedSize"](encodedData);
		let encodedBuffer = Module["_Raster_GetEncodedBuffer"](encodedData);

		let blob = new Blob([new Uint8Array(Module["HEAP8"].buffer, encodedBuffer, encodedSize)], {type : AscCommon.openXml.GetMimeType("svg")});

		Module["_Raster_DestroyEncodedData"](encodedData);

		return blob;
	};

	window.AscCommon = window.AscCommon || {};
	window.AscCommon.CZLibEngineJS = ZLib;
	window.onZlibEngineInit = function()
	{
		ZLib.prototype.isModuleInit = true;
		window["ZLibModule_onLoad"] && window["ZLibModule_onLoad"]();
	};

})(window, undefined);

