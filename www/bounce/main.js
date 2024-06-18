// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define(['/api/config'], function (ApiConfig) {
/*  The 'bounce app' provides a unified way to do the following things in CryptPad

    1. remove the 'opener' attribute from the tab/window every time you navigate
    2. detect and block malicious URLs after warning the user
    3. inform users when they are navigating away from their cryptpad instance

*/

    // when a URL is rejected we close the window
    var reject = function () {
        window.close();
    };
    // this app is intended to be loaded and used exclusively from the sandbox domain
    // where stricter CSP blocks various attacks. Reject any other usage.
    if (ApiConfig.httpSafeOrigin !== window.location.origin) {
        window.alert('The bounce application must only be used from the sandbox domain, ' +
            'please report this issue on https://github.com/cryptpad/cryptpad');
        return void reject();
    }
    // Old/bad browsers lack the URL API, making it more difficult to validate and compare URLs.
    // Warn and reject.
    if (typeof(URL) !== 'function') {
        window.alert("Your browser does not support functionality this page requires");
        return void reject();
    }

    // remove the 'opener' to prevent 'reverse tabnabbing'.
    window.opener = null;

    // Parse the outer domain's root URL to facilitate comparisons.
    // Reject everything if this fails to parse.
    var host;
    try {
        host = new URL('', ApiConfig.httpUnsafeOrigin);
    } catch (err) {
        window.alert("This server is configured incorrectly. Details for its administrator can be found on its diagnostics page.");
        return void reject();
    }

    // Decode the target URL that should have been provided through the document's hash.
    // Reject if no URL was provided.
    // Absolute URLs are easy to handle, other consider URLs relative to the outer domain.
    var target;
    try {
        var bounceTo = decodeURIComponent(window.location.hash.slice(1));
        target = new URL(bounceTo, ApiConfig.httpUnsafeOrigin);
    } catch (err) {
        console.error(err);
        window.alert('The bounce application must only be used with a valid href to visit');
        return void reject();
    }

    // Valid links should navigate to the normalized href
    var go = function () {
        window.location.href = target.href;
    };

    // Local URLs don't require any warning and can navigate directly without user input.
    if (target.host === host.host) { return void go(); }

    // It's annoying to be prompted that you are leaving the platform to visit its docs
    // but marking the docs domain as trusted undermines third-party admins' autonomy.
    // If we ever abandon the cryptpad.fr domain someone could squat it and abuse this trust.
    // If the docs domain is a subdomain of the current one then redirect automatically.
    // We might make the docs domain configurable at some point in the future.
    if (target.host === 'docs.cryptpad.org' && target.host.endsWith(host.host)) {
        return void go();
    }

    // Everything else requires user input, so we load the platform's translations.
    // FIXME: this seems to infer language preferences from the browser instead of the user's account preferences
    require([
        '/customize/messages.js',
    ], function (Messages) {
        // The provided URL seems to be a malicious or invalid payload.
        // Inform the user that we won't navigate and that the 'bounce tab' will be closed.
        // our linter warns when it sees 'javascript:' because it doesn't distinguish between
        // detecting this pattern and using it, so we ignore this line
        if (['javascript:', 'vbscript:', 'data:', 'blob:'].includes(target.protocol)) {
            window.alert(Messages._getKey('bounce_danger', [target.href]));
            return void reject();
        }

        // The provided URL will navigate the user away from the outer domain.
        var question = Messages._getKey('bounce_confirm', [host.hostname, target.href]);
        // Confirm that they want to leave, then navigate or reject based on their choice.
        var answer = window.confirm(question);
        if (answer) { return void go(); }
        reject();
    });
});
