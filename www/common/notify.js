// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/* eslint compat/compat: "off" */

define(['/api/config'], function (ApiConfig) {
    var Module = {};

    var apps = ['code', 'slide', 'pad', 'kanban', 'whiteboard', 'diagram', 'sheet', 'poll', 'teams', 'form', 'doc', 'presentation'];
    var app = window.location.pathname.slice(1, -1); // remove "/" at the beginnin and the end
    var suffix = apps.indexOf(app) !== -1 ? '-'+app : '';

    var DEFAULT_MAIN = '/customize/favicon/main-favicon' + suffix + '.png?' + ApiConfig.requireConf.urlArgs;
    var DEFAULT_ALT = '/customize/favicon/alt-favicon' + suffix + '.png?' + ApiConfig.requireConf.urlArgs;
    var DEFAULT_MAIN_ICO = '/customize/favicon/main-favicon' + suffix + '.ico?' + ApiConfig.requireConf.urlArgs;
    var DEFAULT_ALT_ICO = '/customize/favicon/alt-favicon' + suffix + '.ico?' + ApiConfig.requireConf.urlArgs;

    var document = window.document;

    var isSupported = Module.isSupported = function () {
        return typeof(window.Notification) === 'function' && window.isSecureContext;
    };

    var hasPermission = Module.hasPermission = function () {
        return Notification.permission === 'granted';
    };

    var getPermission = Module.getPermission = function (f) {
        f = f || function () {};
        // "Notification.requestPermission is not a function" on Firefox 68.11.0esr
        if (!Notification || typeof(Notification.requestPermission) !== 'function') { return void f(false); }
        Notification.requestPermission(function (permission) {
            if (permission === "granted") { f(true); }
            else { f(false); }
        });
    };

    var create = Module.create = function (msg, title, icon) {
        if (document && !icon) {
            var favicon = document.getElementById('favicon');
            icon = favicon.getAttribute('data-main-favicon') || DEFAULT_ALT;
        } else if (!icon) {
            icon = DEFAULT_ALT;
        }

        var n = new Notification(title,{
            icon: icon,
            body: msg,
        });
        n.onclick = function () {
            if (!document) { return; }
            try {
                parent.focus();
                window.focus(); //just in case, older browsers
                this.close();
            } catch (e) {}
        };
        return n;
    };

    Module.system = function (msg, title, icon) {
        // Let's check if the browser supports notifications
        if (!isSupported()) { return; /*console.log("Notifications are not supported");*/ }

        // Let's check whether notification permissions have already been granted
        else if (hasPermission()) {
            // If it's okay let's create a notification
            return create(msg, title, icon);
        }

        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== 'denied') {
            getPermission(function (state) {
                if (state) { create(msg, title, icon); }
            });
        }
    };

    var createFavicon = function () {
        if (!document) {
            return void console.error('document is not available in this context');
        }
        console.debug("creating favicon");
        var attrs = {
            id: 'favicon',
            type: 'image/png',
            rel: 'icon',
            'data-main-favicon': DEFAULT_MAIN,
            'data-alt-favicon': DEFAULT_ALT,
            href: DEFAULT_MAIN,
        };
        if(!document.getElementById("favicon")) {
            var fav = document.createElement('link');
            Object.keys(attrs).forEach(function (k) {
                fav.setAttribute(k, attrs[k]);
            });
            document.head.appendChild(fav);
        }

        if(!document.getElementById("favicon-ico")) {
            var faviconLink = document.createElement('link');
            attrs.href = attrs.href.replace(/\.png/g, ".ico");
            attrs.id = 'favicon-ico';
            attrs.type = 'image/x-icon';

            Object.keys(attrs).forEach(function (k) {
                faviconLink.setAttribute(k, attrs[k]);
            });

            document.head.appendChild(faviconLink);
        }
    };

    if (document && !document.getElementById('favicon')) { createFavicon(); }

    Module.tab = function (frequency, count) {
        if (!document) {
            return void console.error('document is not available in this context');
        }
        var key = '_pendingTabNotification';

        var favicon = document.getElementById('favicon');
        var faviconIco = document.getElementById('favicon-ico');

        var main = DEFAULT_MAIN;
        var alt = DEFAULT_ALT;
        var mainIco = DEFAULT_MAIN_ICO;
        var altIco = DEFAULT_ALT_ICO;

        if (favicon) {
            main = favicon.getAttribute('data-main-favicon') || DEFAULT_MAIN;
            alt = favicon.getAttribute('data-alt-favicon') || DEFAULT_ALT;
            favicon.setAttribute('href', main);
        }
        if (faviconIco) {
            mainIco = faviconIco.getAttribute('data-main-favicon') || DEFAULT_MAIN_ICO;
            altIco = faviconIco.getAttribute('data-alt-favicon') || DEFAULT_ALT_ICO;
            faviconIco.setAttribute('href', mainIco);
        }

        var cancel = function (pending) {
            // only run one tab notification at a time
            if (Module[key]) {
                window.clearInterval(Module[key]);
                if (favicon) {
                    favicon.setAttribute('href', pending? alt : main);
                }
                if (faviconIco) {
                    faviconIco.setAttribute('href', pending? altIco : mainIco);
                }

                return true;
            }
            return false;
        };

        cancel();

        var step = function () {
            if (favicon) {
                favicon.setAttribute('href', favicon.getAttribute('href') === main? alt : main);
            }
            if (faviconIco) {
                faviconIco.setAttribute('href', faviconIco.getAttribute('href') === mainIco? altIco : mainIco);
            }
            --count;
        };

        Module[key] = window.setInterval(function () {
            if (count > 0) { return step(); }
            cancel(true);

        }, frequency);
        step();

        return {
            cancel: cancel,
        };
    };

    return Module;
});
