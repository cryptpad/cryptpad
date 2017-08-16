/* global window, XMLHttpRequest, Blob, Event, document */

(function () {
	const event = new Event('Algorithm');

	/**
	 * Class for crypto.
	 *
	 * @class      Crypto (name)
	 */
	class Crypto {
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
			const Nacl = Crypto.Nacl;
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
			const Nacl = Crypto.Nacl;
			const hash = Nacl.hash(Nacl.util.decodeBase64(str));
			return hash.subarray(32, 64);
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
			const nonce = Crypto.Nacl.randomBytes(24);
			const packed = Crypto.Nacl.secretbox(array, nonce, key);
			if (packed) {
				return new Uint8Array(Crypto.slice(nonce).concat(Crypto.slice(packed)));
			}
			throw new Error();
		}

		/**
		 * Decrypts a Uint8Array with the given key.
		 *
		 * @param      {Uint8Array}  u8      The u 8
		 * @param      {String}  key     The key
		 * @return     {String}  The decrypted content.
		 */
		static decrypt(u8, key) {
			if (u8.length < 24) {
				throw new Error();
			}
			const slice = Crypto.slice;
			const Nacl = Crypto.Nacl;
			const nonce = new Uint8Array(slice(u8).slice(0, 24));
			const packed = new Uint8Array(slice(u8).slice(24));
			const unpacked = Nacl.secretbox.open(packed, nonce, key);
			if (unpacked) {
				return unpacked;
			}
			throw new Error('Decrypted file in undefined');
		}
	}

	/**
	 * Binds the extern nacl lib to Crypto.
	 */
	Crypto.Nacl = window.nacl;

	/**
	 * Class for data manager.
	 *
	 * @class      DataManager (name)
	 */
	class DataManager {
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
			return 'data:' + mtype + ';base64,' + Crypto.Nacl.util.encodeBase64(data);
		}
	}

	event.scheme = 'salsa20poly1305';
	event.algorithm = (plugin, mediaObject) => {
		const src = mediaObject.getAttribute('src');
		const strKey = mediaObject.getAttribute('data-crypto-key');
		const cryptoKey = Crypto.getKeyFromStr(strKey);

		const xhr = new XMLHttpRequest();
		xhr.open('GET', src, true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = () => {
			const arrayBuffer = xhr.response;
			if (arrayBuffer) {
				const u8 = new Uint8Array(arrayBuffer);
				const binStr = Crypto.decrypt(u8, cryptoKey);
				const url = DataManager.getBlobUrl(binStr, mediaObject.getMimeType());

				const decryptionEvent = new Event('decryption');
				decryptionEvent.blob = new Blob([binStr], {
					type: mediaObject.getMimeType()
				});
				window.document.dispatchEvent(decryptionEvent);
				mediaObject.setAttribute('src', url);
				mediaObject.removeAttribute('data-crypto-key');
				mediaObject.return();
			}
		};
		xhr.send(null);
	};

	document.dispatchEvent(event);
})();
