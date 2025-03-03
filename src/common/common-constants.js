// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = function (AppConfig = {}) {
    return {
        setCustomize: data => {
            AppConfig = data.AppConfig;
        },

        // localStorage
        userHashKey: 'User_hash',
        userNameKey: 'User_name',
        blockHashKey: 'Block_hash',
        fileHashKey: 'FS_hash',
        sessionJWT: 'Session_JWT',
        ssoSeed: 'SSO_seed',

        // Store
        displayNameKey: 'cryptpad.username',
        oldStorageKey: 'CryptPad_RECENTPADS',
        storageKey: 'filesData',
        tokenKey: 'loginToken',
        prefersDriveRedirectKey: 'prefersDriveRedirect',
        isPremiumKey: 'isPremiumUser',
        displayPadCreationScreen: 'displayPadCreationScreen',
        deprecatedKey: 'deprecated',
        MAX_TEAMS_SLOTS: AppConfig.maxTeamsSlots || 5,
        MAX_TEAMS_OWNED: AppConfig.maxOwnedTeams || 5,
        MAX_PREMIUM_TEAMS_SLOTS: Math.max(AppConfig.maxTeamsSlots || 0, AppConfig.maxPremiumTeamsSlots || 0) || 5,
        MAX_PREMIUM_TEAMS_OWNED: Math.max(AppConfig.maxOwnedTeams || 0, AppConfig.maxPremiumTeamsOwned || 0) || 5,
        // Apps
        criticalApps: ['profile', 'settings', 'debug', 'admin', 'support', 'notifications', 'calendar', 'moderation', 'oldadmin'], // XXX oldadmin
        earlyAccessApps: ['doc', 'presentation']
    };
};

if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = factory(undefined);
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define(['/customize/application_config.js'], factory);
} else {
    // unsupported initialization
}
})();

