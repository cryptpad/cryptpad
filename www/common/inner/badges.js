// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
], function ($, UI, h, Messages, nThen) {
    var Badges = {};

    const badges = {
        admin: 'fa-star-o',
        moderator: 'fa-life-ring',
        premium: 'fa-check-circle'
    }

    Badges.render = id => {
        let icon = badges[id];
        if (!icon) { return; }
        let cls = icon.indexOf('cptools') === 0 ? 'cptools '+icon : 'fa '+icon;
        return h('i', { 'class': `cp-badge ${cls}` });
    };

    return Badges;
});


