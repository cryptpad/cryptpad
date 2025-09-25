// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This is the initialization loading the CryptPad libraries
define([
    'jquery',
    '/common/sframe-app-framework.js',
    '/customize/messages.js', // translation keys
    '/common/hyperscript.js',
    '/lib/webxdc.js',
    'less!/webxdc/app-webxdc.less'
    /* Here you can add your own javascript or css to load */
], function (
    $,
    Framework,
    Messages,
    h,
    WebXDC,
    ) {


    // This is the main initialization loop
    let onFrameworkReady = function (framework) {
        let $container = $('#cp-app-webxdc-editor');

        let $content = $(h('div#cp-webxdc-content')).appendTo($container);
        let myName = window.webxdc.selfName;
        console.log("Document is ready. My name is:", myName);
        // let $textarea = $(h('textarea'));
        // $content.append($textarea);
        let oldVal = '';
        // $textarea.on('change keyup paste', function () {
        //     var currentVal = $textarea.val();
        //     if (currentVal === oldVal) { return; } // Nothing to do
        //     oldVal = currentVal;
        //     framework.localChange();
        // });
        let content = { text: "" };
        let getContent = () => {
            return content.text || '';
        };
        let setContent = (value) => {
            // return $textarea.val(value);
            // return window.webxdc.sendUpdate(value);
            if (!content) content = {};
            content.text = value;
            window.webxdc.sendUpdate(
                {
                    payload: { text: value }
                },
                "User update"
            );
        };

        // OPTIONAL: cursor management
        framework.setCursorGetter(() => {
            let myCursor = {};
            // Get your cursor position here
            return myCursor;
        });
        framework.onCursorUpdate(data => {
            console.log("Other user cursor", data);
        });

        framework.onContentUpdate(function (newContent) {
            console.log('New content received from others', newContent.content);
            if (newContent && newContent.content) {
                content = newContent.content;
            } else {
                content = { text: "" };
            }
            setContent(content.text);
        });

        window.webxdc.setUpdateListener(function (update) {
            console.log("Received update:", update);
            if (update.payload && update.payload.text) {
                setContent(update.payload.text);
            }
        }, 0);

        framework.setContentGetter(function () {
            let content = getContent();
            console.log('Sync my content with others', content);
            return {
                content: content
            };
        });

        framework.onReady(function () {
            // Document is ready, you can initialize your app
            console.log('Document is ready:', content);
        });

        // Start the framework
        framework.start();
    };

    // Framework initialization
    Framework.create({
        toolbarContainer: '#cme_toolbox',
        contentContainer: '#cp-app-webxdc-editor'
    }, function (framework) {
        onFrameworkReady(framework);
    });
});
