define([
    '/common/common-util.js',
    '/file/file-crypto.js',
], function(
    Util,
    FileCrypto,
) {

    const setBlobType = (blob, mimeType) => {
        const fixedBlob = new Blob([blob], {type: mimeType});
        return fixedBlob;
    };

    const getImage = function(common, data, callback) {
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

    return {
        openImageDialog: function(common, integrationChannel, data, cb) {
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
                getImage(common, data, function(blob) {
                    common.setPadAttribute('atime', +new Date(), null, data.href);
                    cb({
                        name: data.name,
                        fileType: data.fileType,
                        blob: blob
                    });
                });
            });
        }
    };
});
