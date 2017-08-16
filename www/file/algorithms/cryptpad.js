/* global window, XMLHttpRequest, Blob, Event, document */

(function () {
	const event = new Event('Algorithm');

	const MediaTag = {};
	const PARANOIA = true;
	const plainChunkLength = 128 * 1024;
	const cypherChunkLength = 131088;

	/**
	 * Class for crypto.
	 *
	 * @class      Crypto (name)
	 */
	class Cryptopad {
	    /**
	     * Create a nonce
	     */
	    static createNonce () {
	        return new Uint8Array(new Array(24).fill(0));
	    }

	   /**
	     * Increment a nonce
	     * @param      {Uint8Array}  u8      The nonce
	     */
	    static increment (N) {
	        var l = N.length;
	        while (l-- > 1) {
	            if (PARANOIA) {
	                if (typeof(N[l]) !== 'number') {
	                    throw new Error('E_UNSAFE_TYPE');
	                }
	                if (N[l] > 255) {
	                    throw new Error('E_OUT_OF_BOUNDS');
	                }
	            }
	        /*  jshint probably suspects this is unsafe because we lack types
	            but as long as this is only used on nonces, it should be safe  */
	            if (N[l] !== 255) { return void N[l]++; } // jshint ignore:line
	            N[l] = 0;

	            // you don't need to worry about this running out.
	            // you'd need a REAAAALLY big file
	            if (l === 0) {
	                throw new Error('E_NONCE_TOO_LARGE');
	            }
	        }
	    }

	    static encodePrefix (p) {
	        return [
	            65280, // 255 << 8
	            255,
	        ].map(function (n, i) {
	            return (p & n) >> ((1 - i) * 8);
	        });
	    }

	    static decodePrefix (A) {
	        return (A[0] << 8) | A[1];
	    }

	    static joinChunks (chunks) {
	        return new Blob(chunks);
	    }

	    /**
	     * Convert a Uint8Array into Array.
	     *
	     * @param      {Uint8Array}  u8      The u 8
	     * @return     {Array}  Array = require(Uint8Array.
	     */
	    static slice(u8) {
	        return Array.prototype.slice.call(u8);
	    }

	    /**
	     * Gets the random key string.
	     *
	     * @return     {String}  The random key string.
	     */
	    static getRandomKeyStr() {
	        const Nacl = window.nacl;
	        const rdm = Nacl.randomBytes(18);
	        return Nacl.util.encodeBase64(rdm);
	    }

	    /**
	     * Gets the key = require(string.
	     *
	     * @param      {String}  str     The string
	     * @return     {Uint8Array}  The key = require(string.
	     */
	    static getKeyFromStr(str) {
	        return window.nacl.util.decodeBase64(str);
	    }

	    /**
	     * Encrypts a Uint8Array with the given key.
	     *
	     * @param      {<type>}      u8      The u 8
	     * @param      {<type>}      key     The key
	     * @return     {Uint8Array}  The encrypted content.
	     */
	    static encrypt(u8, key) {
	        const array = u8;
	        const nonce = window.nacl.randomBytes(24);
	        const packed = window.nacl.secretbox(array, nonce, key);
	        if (packed) {
	            return new Uint8Array(Cryptopad.slice(nonce).concat(Cryptopad.slice(packed)));
	        }
	        throw new Error();
	    }

	    /**
	     * Decrypts a Uint8Array with the given key.
	     *
	     * @param      {Uint8Array}  u8      The u 8
	     * @param      {String}  key     The key
	     * @return     object YOLO
	     */
	    static decrypt (u8, key, done) {
	        const Nacl = window.nacl;

	        const progress = function (offset) {
	            const ev = new Event('decryptionProgress');
	            ev.percent = (offset / u8.length) * 100;

	            window.document.dispatchEvent(ev);
	        };

	        var nonce = Cryptopad.createNonce();
	        var i = 0;

	        var prefix = u8.subarray(0, 2);
	        var metadataLength = Cryptopad.decodePrefix(prefix);

	        var res = {
	            metadata: undefined
	        };

	        var metaBox = new Uint8Array(u8.subarray(2, 2 + metadataLength));

	        var metaChunk = Nacl.secretbox.open(metaBox, nonce, key);
	        Cryptopad.increment(nonce);

	        try { res.metadata = JSON.parse(Nacl.util.encodeUTF8(metaChunk)); }
	        catch (e) { return done('E_METADATA_DECRYPTION'); }

	        if (!res.metadata) { return done('NO_METADATA'); }

	        var takeChunk = function (cb) {
	            setTimeout(function () {
	                const start = i * cypherChunkLength + 2 + metadataLength;
	                const end = start + cypherChunkLength;
	                i++;
	                const box = new Uint8Array(u8.subarray(start, end));

	                // decrypt the chunk
	                const plaintext = Nacl.secretbox.open(box, nonce, key);
	                Cryptopad.increment(nonce);

	                if (!plaintext) { return void cb('DECRYPTION_FAILURE'); }

	                progress(Math.min(end, u8.length));

	                cb(void 0, plaintext);
	            });
	        };

	        var chunks = [];

	        // decrypt file contents
	        var again = function () {
	            takeChunk(function (e, plaintext) {
	                if (e) { return setTimeout(function () { done(e); }); }

	                if (plaintext) {
	                    if (i * cypherChunkLength < u8.length) { // not done
	                        chunks.push(plaintext);
	                        return again();
	                    }

	                    chunks.push(plaintext);
	                    res.content = Cryptopad.joinChunks(chunks);
	                    return done(void 0, res);
	                }
	                done('UNEXPECTED_ENDING');
	            });
	        }
	        again();
	    };
	}

	/**
	 * Class for data manager.
	 *
	 * @class      DataManager (name)
	 */
	class DataManager {
	    /**
	     * Gets the array buffer = require(a source url.
	     *
	     * @param      {<type>}  url     The url
	     * @return     {<type>}  The array buffer.
	     */
	    static getArrayBuffer(url) {
	        return fetch(url)
	        .then(response => {
	            if (response.ok) {
	                return response.arrayBuffer();
	            }
	            throw new Errors.FetchFails();
	        })
	        .then(arrayBuffer => arrayBuffer);
	    }

	    /**
	     * Creates an url.
	     *
	     * @param      {ArrayBuffer}  arrayBuffer  The array buffer
	     * @return     {String}  The url.
	     */
	    static createUrl(arrayBuffer) {
	        return window.URL.createObjectURL(arrayBuffer);
	    }

	    /**
	     * Gets the blob url.
	     *
	     * @param      {ArrayBuffer}  data    The data
	     * @param      {String}  mtype   The mtype
	     * @return     {String}  The blob url.
	     */
	    static getBlobUrl(data, mtype) {
	        return window.URL.createObjectURL(new Blob([data], {
	            type: mtype
	        }));
	    }

	    /**
	     * Gets the data url.
	     *
	     * @param      {ArrayBuffer}  data    The data
	     * @param      {string}  mtype   The mtype
	     * @return     {string}  The data url.
	     */
	    static getDataUrl(data, mtype) {
	        return 'data:' + mtype + ';base64,' + window.nacl.util.encodeBase64(data);
	    }
	}

	/**
	 *
	 * @example
	 *
	 * //mediaObject.setAttribute('type', decrypted.metadata.type);
	 * //mediaObject.type = decrypted.metadata.type;
	 * ///console.log(mediaObject);
	 *
	 * original model :
	 *      <media-tag src="something" data-type="image/png" data-crypto-key="cryptpad:something">
	 *
	 * hypothetical model : (mime is hidden inside src data)
	 *      <media-tag src="something" data-crypto-key="cryptpad:something">
	 *
	 * Crypto extracts metadata from the decrypted source and applies it on the media object.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 * @param      {Object}  metadata     The metadata
	 */
	function applyMetadata(plugin, mediaObject, metadata) {
		const info = metadata.type.split('/');
		/**
		 * Normailse metadata to MediaTag model.
		 */
		const mime = metadata.type;
		const type = info[0];
		const extension = info[1];

		if (plugin.isAllowedMediaType(plugin, mime)) {
			/**
			 * @example
			 * Inside 'src/plugins/renderers/image.js'
			 *
			 * ...
			 * mediaObject.utilsSetAllDataAttributes(element); // Takes all [data-] from attributes and it's done inside plugin job parts.
			 * ...
			 */
			mediaObject.setAttribute('data-type', metadata.type);

			/**
			 * Theses data are used in identification phasis and have to be set.
			 */
			mediaObject.type = type;
			mediaObject.extension = extension;
			mediaObject.mime = mime;
		} else {
			console.log('Not allowed metadata, allowed ones are : ', plugin.types, plugin.subtypes);
		}

		/**
		 * Data to improve file format recognition at downloading.
		 */
		mediaObject.name = metadata.name;
		mediaObject.setAttribute('data-attr-type', metadata.type);
	}

	event.scheme = 'cryptpad:';
	event.algorithm = (plugin, mediaObject) => {
	    const src = mediaObject.getAttribute('src');
	    const strKey = mediaObject.getAttribute('data-crypto-key');
	    const cryptoKey = Cryptopad.getKeyFromStr(strKey);
	    const xhr = new XMLHttpRequest();

	    var uid = [src, strKey].join('');

	    var followUp = function (decrypted) {
	        // Metadata must be set before the blob construction.
	        const decryptionEvent = new Event('decryption');
	        decryptionEvent.metadata = decrypted.metadata;
	        applyMetadata(plugin, mediaObject, decrypted.metadata);

	        const binStr = decrypted.content;
	        const url = DataManager.getBlobUrl(binStr, mediaObject.getMimeType());

	        decryptionEvent.blob = new Blob([binStr], {
	            type: mediaObject.getMimeType()
	        });

	        decryptionEvent.metadata = decrypted.metadata;

	        /**
	         * Modifications applied on mediaObject.
	         * After these modifications the typeCheck
	         * method must return false otherwise the
	         * filter may infinite loop.
	         */
	        mediaObject.setAttribute('src', url);
	        mediaObject.removeAttribute('data-crypto-key');

	        //console.log(decrypted.metadata);
	        if (/audio\/(mp3|ogg|wav|webm|mpeg)/.test(decrypted.metadata.type)) {
	            // audio types should do the right thing.
	        } else if (/application\/pdf/.test(decrypted.metadata.type)) {
	            // let it be
	        } else if (/video\//.test(decrypted.metadata.type)) {
	            // let it be
	        } else if (!/image\/(png|jpeg|jpg|gif)/.test(decrypted.metadata.type)) {
	            // if it's not an image, present a download link
	            decrypted.metadata.type = 'download';
	        }

	        //console.log(decrypted.metadata);
	        applyMetadata(plugin, mediaObject, decrypted.metadata);

	        decryptionEvent.callback = function (f) {
	            /**
	             * Filters must call chain to try if the
	             * current mediaObject matches other filters.
	             */
	            mediaObject.return();
	            if (typeof(f) === 'function') { f(mediaObject); }
	        };

	        window.document.dispatchEvent(decryptionEvent);
	    };

	    var Cache = MediaTag.__Cryptpad_Cache = MediaTag.__Cryptpad_Cache || {};
	    if (Cache[uid]) {
	        return followUp(Cache[uid]);
	    }

	    xhr.open('GET', src, true);
	    xhr.responseType = 'arraybuffer';

	    var fail = function (err) {
	        const decryptionErrorEvent = new Event('decryptionError');
	        decryptionErrorEvent.message = typeof(err) === 'string'? err: err.message;
	        window.document.dispatchEvent(decryptionErrorEvent);
	    };

	    xhr.onload = function () {
	        if (/^4/.test('' + this.status)) {
	            return fail("XHR_ERROR", '' + this.status);
	        }

	        const arrayBuffer = xhr.response;
	        if (arrayBuffer) {
	            const u8 = new Uint8Array(arrayBuffer);

	            Cryptopad.decrypt(u8, cryptoKey, function (err, decrypted) {
	                if (err) { return fail(err); }
	                Cache[uid] = decrypted;
	                followUp(decrypted);
	            });
	        }
	    };
	    xhr.send(null);
	};
	
	document.dispatchEvent(event);
})();
