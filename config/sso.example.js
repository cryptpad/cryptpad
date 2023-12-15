// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

module.exports = {
    // Enable SSO login on this instance
    enabled: false,
    // Block registration for non-SSO users on this instance
    enforced: false,
    // Allow users to add an additional CryptPad password to their SSO account
    cpPassword: false,
    // List of SSO providers
    list: [
    /*
    {
        name: 'google',
        type: 'oidc',
        url: 'https://accounts.google.com',
        client_id: "{your_client_id}",
        client_secret: "{your_client_secret}",
        jwt_alg: 'RS256' (optional)
    }
    */
    ]
};

