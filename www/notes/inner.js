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
    '/notes/util.js',

    'css!/common/blocknote.css',
    'less!/notes/app-notes.less'
    /* Here you can add your own javascript or css to load */
], function (
    $,
    Framework,
    Messages,
    h,
    BlockNote,
    NotesUtil
) {
    // This is the main initialization loop
    const onFrameworkReady = (framework) => {
        const common = framework._.sfCommon;
        const priv = common.getMetadataMgr().getPrivateData();
        const userData = common.getMetadataMgr().getUserData();
        const container = $('#cp-app-notes-editor');

        const uploadImageFromCryptDrive = (cb) => {
            common.openFilePicker({
                types: ['file'],
                where: ['root'],
                filter: {
                    fileType: ['image/png', 'image/jpeg']
                }
            }, (data) => {
                if (data.type !== 'file') { return; }
                common.setPadAttribute('atime', +new Date(), null, data.href);
                cb({
                    name: data.name,
                    url: NotesUtil.getCryptPadUrl(data.src, data.key, data.fileType),
                });
            });
        };

        const createProvider = (ydoc) => {
            const name = 'cp-notes-' + priv.channel; // replace with context.id?
            return new BlockNote.IndexeddbPersistence(name, ydoc); // To be replaced
        };
        const destroyProvider = (provider) => {
            if (!provider) { return; }
            // only for indexeddb
            if (typeof provider.clearData === 'function') { // to be deleted
                return provider.clearData();
            }
            // not needed for current provider 
            // if (typeof provider.destroy === 'function') {
            //     return provider.destroy();
            // }
        };

        let currentEditor;

        const createEditor = async () => {
            const editorEl = h('div#cp-notes-content');
            container.append(editorEl);
            const ydoc = new BlockNote.YJS.Doc();
            const provider = createProvider(ydoc);
            provider.on('synced', () => {
                console.log('indexeddb synced');
            });
            currentEditor = BlockNote.useBlockNoteEditor(editorEl, {
                trailingBlock: true,
                resolveFileUrl: NotesUtil.resolveImageUrl,
                view: {
                    editable: !priv.readOnly,
                    theme: window.CryptPad_theme === 'dark' ? 'dark' : 'light',
                    uploadImageFromCryptDrive,
                },
                collaboration: {
                    provider,
                    fragment: ydoc.getXmlFragment('document-store'),
                    user: {
                        name: userData.name,
                        color: userData.color,
                    },
                },
            });
        };

        const resetEditor = async () => {
            if (currentEditor) {
                try {
                    currentEditor.unmount();
                    currentEditor.editor._tiptapEditor.destroy();
                    await destroyProvider(current.provider);
                    currentEditor.ydoc.destroy();
                    container.empty();
                } catch (err) {
                    console.error(err);
                }
                currentEditor = null;
            }
            await createEditor();
        };

        createEditor();
        // window.resetEditor = resetEditor; -- expose for testing
        // On checkpoint creation: resetEditor({checkpoint}); -- add a context? argument

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
