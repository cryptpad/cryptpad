// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-language.js',
    'less!/customize/src/less2/pages/page-feedback.less',
], function (Language) {
    Language.applyTranslation();
    var optoutLink = document.querySelector('#optout a');
    if (optoutLink) {
        optoutLink.setAttribute('href', '/settings/');
    }
});
