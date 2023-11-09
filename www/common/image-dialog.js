define([], function() {

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
                fileType: ['image/']
            }
        }, cb);
    };

    return {
        openImageDialog,
    };
});
