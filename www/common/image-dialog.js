/* globals nacl */

define([
    '/common/common-util.js',
    '/file/file-crypto.js',
    '/common/common-hash.js',
], function(
    Util,
    FileCrypto,
    Hash
) {

    const getCryptPadUrl = function(src, key, type) {
        const url = new URL(src);
        const params = new URLSearchParams();
        params.set('type', type);
        url.search = params.toString();
        url.protocol = url.protocol === 'https:' ? 'cryptpads:' : 'cryptpad:';
        url.hash = key;
        return url.href;
    };

    const parseCryptPadUrl = function(href) {
        const url = new URL(href);
        url.protocol = url.protocol === 'cryptpads:' ? 'https:' : 'http:';
        const key = url.hash.substring(1);  // remove leading '#'
        const type = url.searchParams.get('type');
        url.search = '';
        url.hash = '';
        return { src: url.href, key, type };
    }

    const setBlobType = (blob, mimeType) => {
        const fixedBlob = new Blob([blob], {type: mimeType});
        return fixedBlob;
    };

    const loadImage = function(common, href) {
        return new Promise((resolve, reject) => {
            const { src, key, type } = parseCryptPadUrl(href);
            Util.fetch(src, function (err, u8) {
                if (err) {
                    console.error(err);
                    return void reject(err);
                }
                try {
                    FileCrypto.decrypt(u8, nacl.util.decodeBase64(key), (err, res) => {
                        if (err || !res.content) {
                            console.error("Decrypting failed");
                            return void reject(err);
                        }

                        resolve(setBlobType(res.content, type));
                    });
                } catch (e) {
                    console.error(e);
                    reject(err);
                }
            }, void 0, common.getCache());
        });
    };

    const getImage = function(common, data, callback) {  // TODO remove
        Util.fetch(data.src, function (err, u8) {
            if (err) {
                console.error(err);
                return void callback("");
            }
            try {
                FileCrypto.decrypt(u8, nacl.util.decodeBase64(data.key), (err, res) => {
                    if (err || !res.content) {
                        console.error("Decrypting failed");
                        return void callback("");
                    }

                    callback(setBlobType(res.content, data.fileType));
                });
            } catch (e) {
                console.error(e);
                callback("");
            }
        }, void 0, common.getCache());
    };

    const openImageDialog = function(common, integrationChannel, data, cb) {
        if (integrationChannel) {
            const ignoreFirstParam = (_, image) => cb(image);
            integrationChannel.query('Q_INTEGRATION_ON_INSERT_IMAGE', data, ignoreFirstParam, {raw: true});
            return;
        }
        common.openFilePicker({
            types: ['file'],
            where: ['root'],
            filter: {
                fileType: ['image/', 'application/x-drawio']
            }
        }, (data) => {
            loadImage(common, getCryptPadUrl(data.src, data.key, data.fileType)).then((blob) => {
                cb({
                    name: data.name,
                    fileType: data.fileType,
                    blob: blob
                });
            });
        });
    };

    return {
        openImageDialog,
    };
});
