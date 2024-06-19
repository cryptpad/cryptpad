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

    let availablePadTypes = AppConfig.availablePadTypes.filter(
        (t) => ooEnabled || !OO_APPS.includes(t) 
    );

    let availableTypes;
    if (ApiConfig.appsToDisable) {
        availableTypes = availablePadTypes.filter(value => !ApiConfig.appsToDisable.includes(value))
    } else {
        availableTypes = availablePadTypes
    }
    
    var appsToSelect = availablePadTypes.filter(value => !['drive', 'teams', 'file', 'contacts', 'convert'].includes(value))

    return {
        availableTypes,
        appsToSelect,

        isAvailable: function (type) {
            return availableTypes.includes(type);
        },
    };
});
