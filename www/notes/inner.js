// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This is the initialization loading the CryptPad libraries
define([
    'jquery',
    '/common/sframe-app-framework.js',
    '/customize/messages.js', // translation keys
    '/common/hyperscript.js',
    '/common/blocknote-bundle.js',

    'css!/common/blocknote.css',
    'less!/notes/app-notes.less'
    /* Here you can add your own javascript or css to load */
], function (
    $,
    Framework,
    Messages,
    h,
    BlockNote
) {
    // This is the main initialization loop
    const onFrameworkReady = (framework) => {
        const priv = framework._.sfCommon.getMetadataMgr().getPrivateData();
        const editorEl = h('div#cp-notes-content');
        $('#cp-app-notes-editor').append(editorEl);

        // This is the BlockNote editor initialization
        // offline provider can only "store" the Y.Doc in the browser's indexeddb (no network sync)
        const userData = framework._.sfCommon.getMetadataMgr().getUserData();
        const ydoc = new BlockNote.YJS.Doc();
        BlockNote.useBlockNoteEditor(editorEl, {
            trailingBlock: true,
            view: {
                editable: !priv.readOnly,
                theme: window.CryptPad_theme === 'dark' ? 'dark' : 'light',
            },
            collaboration: {
                provider: new BlockNote.IndexeddbPersistence(
                    'cp-notes-' + priv.channel,
                    ydoc
                ),
                fragment: ydoc.getXmlFragment('document-store'),
                user: {
                    name: userData.name,
                    color: userData.color,
                },
            },
        });

        // no patches: the content getter keeps the initial document structure but never reads the editor
        const content = [];
        framework.setContentGetter(() => ({ content }));

        // OPTIONAL: cursor management
        framework.setCursorGetter(() => {
            let myCursor = {};
            // Get your cursor position here
            return myCursor;
        });
        framework.onCursorUpdate(data => {
            console.log("Other user cursor", data);
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
        toolbarContainer: '#cp-toolbar',
        contentContainer: '#cp-app-notes-editor'
    }, onFrameworkReady);
});
