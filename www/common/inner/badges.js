// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/common-icons.js'
], function (h, Messages, Icons) {
    var Badges = {};

    const badges = {
        admin: 'badge-admin',
        moderator: 'badge-moderator',
        premium: 'badge-premium',
        error: 'badge-error'
    };

    // safeBadges won't show an error when they aren't active anymore
    //   --> we just hide them
    Badges.safeBadges = ["premium"];

    Badges.render = id => {
        let icon = badges[id];
        if (!icon) { return; }
        let cls = 'cp-badge';
        if (id === 'error') { cls += ' cp-badge-error'; }
        return Icons.get(icon,{'class': cls, 'title': Messages[`badges_${id}`] || id, 'data-badge': id})
    };

    return Badges;
});


