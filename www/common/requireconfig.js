// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config'
], function (ApiConfig) {
    var out = {
        // fix up locations so that relative urls work.
        baseUrl: window.location.pathname,
        paths: {
            // json plugin
            text: '/components/requirejs-plugins/lib/text',
            json: '/components/requirejs-plugins/src/json',
            optional: '/lib/optional/optional',
            // jquery declares itself as literally "jquery" so it cannot be pulled by path :(
            "jquery": "/components/jquery/dist/jquery.min",
            "mermaid": "/lib/mermaid/mermaid.min",
            // json.sortify same
            "json.sortify": "/components/json.sortify/dist/JSON.sortify",
            cm: '/components/codemirror',
            'tui-code-snippet': '/lib/calendar/tui-code-snippet.min',
            'tui-date-picker': '/lib/calendar/date-picker',
            'netflux-client': '/components/netflux-websocket/netflux-client',
            'chainpad-netflux': '/components/chainpad-netflux/chainpad-netflux',
            'chainpad-listmap': '/components/chainpad-listmap/chainpad-listmap',
            'cm-extra': '/lib/codemirror-extra-modes',
            // asciidoctor same
            'asciidoctor': '/lib/asciidoctor/asciidoctor.min'
        },
        map: {
            '*': {
                'css': '/components/require-css/css.js',
                'less': '/common/RequireLess.js',
                '/bower_components/tweetnacl/nacl-fast.min.js': '/components/tweetnacl/nacl-fast.min.js'
            }
        }
    };
    Object.keys(ApiConfig.requireConf).forEach(function (k) { out[k] = ApiConfig.requireConf[k]; });
    return function () {
        return JSON.parse(JSON.stringify(out));
    };
});
