// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([], function() {

    const openImageDialog = function(common, integrationChannel, data, cb) {
        if (integrationChannel) {
            const handleImage = (_, image) => {
                cb(image);
            };
            integrationChannel.query('Q_INTEGRATION_ON_INSERT_IMAGE', data, handleImage, {raw: true});
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
