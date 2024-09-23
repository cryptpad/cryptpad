// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This is the initialization loading the CryptPad libraries
define([
    'jquery',
    '/common/sframe-app-framework.js',
    '/customize/messages.js', // translation keys
    '/common/hyperscript.js',
    '/tiptap/tiptap.bundle.js',
    '/common/cursor.js',
    'less!/tiptap/app-tiptap.less'
    /* Here you can add your own javascript or css to load */
], function (
    $,
    Framework,
    Messages,
    h,
    TiptapUnused,
    Cursor
    ) {
    const Tiptap = window.Tiptap;


    // This is the main initialization loop
    let onFrameworkReady = function (framework) {
        let $container = $('#cp-app-tiptap-editor');

        let $content = $(h('div#cp-tiptap-content')).appendTo($container);
        let $tiptapElement = $(h('div.cp-tiptap-element')).appendTo($content);
        let element = document.querySelector('.cp-tiptap-element');
        let editor = Tiptap.start(element);
        let inner = document.querySelector('.ProseMirror');
        let cursor = Cursor(inner);
        // let oldVal = '';
        // $tiptapElement.on('change keyup paste', function () {
        //     var currentVal = $tiptapElement.val();
        //     if (currentVal === oldVal) { return; } // Nothing to do
        //     oldVal = currentVal;
        //     framework.localChange();
        // });

        let getContent = () => {
            return editor.getJSON();
        };
        let setContent = (value) => {
            return editor.commands.setContent(value);
        };

        editor.on('update', () => {
            framework.localChange();
        });

        let content = {};

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
            content = newContent.content;

            // Get cursor position
            cursor.offsetUpdate();
            var oldText = inner.outerHTML;

            // Apply the changes
            setContent(content);

            // Restore cursor position
            var newText = inner.outerHTML;
            var ops = ChainPad.Diff.diff(oldText, newText);
            cursor.restoreOffset(ops);
        });

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
            console.error(editor);
        });

        // Start the framework
        framework.start();
    };

    // Framework initialization
    Framework.create({
        toolbarContainer: '#cme_toolbox',
        contentContainer: '#cp-app-tiptap-editor'
    }, function (framework) {
        onFrameworkReady(framework);
    });
});
