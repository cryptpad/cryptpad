// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This is the initialization loading the CryptPad libraries
define([
    'jquery',
    '/common/sframe-app-framework.js',
    '/customize/messages.js', // translation keys
    '/common/hyperscript.js',
    // './assets/polyfills-legacy-Op9eHCRg.js',
    // './assets/index-legacy-CpC3q1r5.js',
    'less!/webxdc/app-webxdc.less'
    /* Here you can add your own javascript or css to load */
], function (
    $,
    Framework,
    Messages,
    h,
    ) {


    // This is the main initialization loop
    let onFrameworkReady = async function (framework) {
        let content = { updates: [] };

        let myName = window.webxdc.selfName = framework._.sfCommon.getMetadataMgr().getUserData().name;
        console.log("Document is ready. My name is:", myName);

        window.webxdc.sendUpdate = (update) => {
            console.log('SendUpdate', update);
            content.updates ||= [];
            const serial = content.updates.length + 1;
            const _update = {
                payload: update.payload,
                summary: update.summary,
                info: update.info,
                notify: update.notify,
                href: update.href,
                document: update.document,
                serial: serial,
            };
            content.updates.push(_update);
            framework.localChange();
        };

        framework.onContentUpdate(function (newContent) {
            if (!newContent.updates) { return; }
            console.log('New content received from others', newContent.content);
            const length = content.updates.length;
            const newUpdates = newContent.updates.slice(length);
            newUpdates.forEach(update => {
                content.updates.push(update);
                if (!window.cp_updateListener) {
                    window.cp_pendingUpdates ||= [];
                    window.cp_pendingUpdates.push(update);
                    return;
                }
                window.cp_updateListener(update);
            });
        });

        framework.setContentGetter(function () {
            return content;
        });

        framework.onReady(function () {
            // Document is ready, you can initialize your app
            console.log('Document is ready:', content);
        });

        // Start the framework
        framework.start();
    try {
      const registration = await navigator.serviceWorker.register("http://localhost:3001/webxdc/sw.js", {
        scope: "http://localhost:3001/webxdc/",
      });
      if (registration.installing) {
        console.log("XXX Service worker installing");
      } else if (registration.waiting) {
        console.log("XXX Service worker installed");
      } else if (registration.active) {
        console.log("XXX Service worker active");
      }
    } catch (error) {
      console.error(`XXX Registration failed with ${error}`);
    }
    };

    // Framework initialization
    Framework.create({
        toolbarContainer: '#cme_toolbox',
        contentContainer: '#cp-app-webxdc-editor'
    }, function (framework) {
        onFrameworkReady(framework);
    });
});
