// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = (AppConfig = {}, ApiConfig = {},
                    OOCurrentVersion) => {

    let availablePadTypes = [];
    const OO_APPS = ["sheet", "doc", "presentation"];

    const setCustomize = data => {
        AppConfig = data.AppConfig;
        ApiConfig = data.ApiConfig;

        const ooEnabled = ApiConfig.onlyOffice &&
                ApiConfig.onlyOffice.availableVersions.includes(
            OOCurrentVersion.currentVersion
        );
        availablePadTypes = AppConfig.availablePadTypes.filter(
            (t) => ooEnabled || !OO_APPS.includes(t)
        );
    };

    // Initialize values when using in browser directly
    if (Object.keys(AppConfig).length) {
        setCustomize({AppConfig,ApiConfig});
    }

    const Types = { OO_APPS, setCustomize };

    Types.__defineGetter__("availableTypes", function () {
        if (ApiConfig.appsToDisable) {
            return availablePadTypes.filter(value => {
                return !ApiConfig.appsToDisable.includes(value);
            });
        }
        return availablePadTypes;
    });
    Types.__defineGetter__("appsToSelect", function () {
        return availablePadTypes.filter(value => !['drive', 'teams', 'file', 'contacts', 'convert'].includes(value));
    });
    Types.isAvailable = type => {
        return Array.isArray(Types.availableTypes) &&
                Types.availableTypes.includes(type);
    };

    return Types;
};

if (typeof(module) !== 'undefined' && module.exports) {
    // Code from customize can't be laoded directly in the build
    module.exports = factory(
        undefined,
        undefined,
        require('./onlyoffice/current-version')
    );
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([
        '/customize/application_config.js',
        "/api/config",
        "/common/onlyoffice/current-version.js",
    ], factory);
} else {
    // unsupported initialization
}

})();
