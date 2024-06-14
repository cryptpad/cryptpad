// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    "/customize/application_config.js",
    "/api/config",
    "/common/onlyoffice/current-version.js",
], function (AppConfig, ApiConfig, OOCurrentVersion) {
    const OO_APPS = ["sheet", "doc", "presentation"];
    const ooEnabled = ApiConfig.onlyOffice && ApiConfig.onlyOffice.availableVersions.includes(
        OOCurrentVersion.currentVersion,
    );

    let availableTypes = AppConfig.availablePadTypes.filter(
        (t) => ooEnabled || !OO_APPS.includes(t),
    );

    return {
        availableTypes,

        isAvailable: function (type) {
            return availableTypes.includes(type);
        },
    };
});
