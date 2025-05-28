// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/hyperscript.js',
    '/customize/messages.js',
], function (h, Messages) {
    var Badges = {};

    const badges = {
        admin: 'fa-star',
        moderator: 'fa-life-ring',
        premium: 'fa-check-circle',
        error: 'fa-exclamation-circle'
    };

    Badges.render = id => {
        let icon = badges[id];
        if (!icon) { return; }
        let cls = icon.indexOf('cptools') === 0 ? 'cptools '+icon : 'fa '+icon;
        if (id === 'error') { cls += ' cp-badge-error'; }
        return h('i', {
            'class': `cp-badge ${cls}`,
            'title': Messages[`badges_${id}`] || id
        });
    };

    return Badges;
});


