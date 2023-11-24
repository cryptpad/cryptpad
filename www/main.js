// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
], function ($) {
/*  CryptPad's example NGINX config includes a list of pages
    which should have their URLs rewritten to include a trailing slash.
    Sometimes we create a new page and forget to add it to these list.
    Sometimes people configure their instance without this rewrite rule.

    In either case, they might enter a URL like `/checkup` (without the
    trailing slash) and somehow end up trying to load this script. ¯\_(ツ)_/¯

    This script helps to avoid reports of confusion due to blank pages
    like in some of the comments here: (https://github.com/cryptpad/cryptpad/issues/246)
    by using jquery to check if adding a trailing slash would help,
    and redirecting automatically if so.
*/
    var pathname = window.location.pathname;
    $.ajax({
        url: `${pathname}/?cb=${+new Date()}`,
        data: {},
        complete: function (xhr) {
            if (xhr.status !== 200) {
                return void console.log("failure");
            }
            window.location = (pathname + '/');
        },
    });
});
