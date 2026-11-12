// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This is the initialization loading the CryptPad libraries
define([
    'jquery',
    '/common/sframe-app-framework.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/customize/messages.js', // translation keys
    '/common/hyperscript.js',
    '/common/blocknote-bundle.js',
    '/notes/util.js',
    '/common/yjs-provider.js',

    'css!/common/blocknote.css',
    'less!/notes/app-notes.less'
    /* Here you can add your own javascript or css to load */
], function (
    $,
    Framework,
    Hash,
    Util,
    Messages,
    h,
    BlockNote,
    NotesUtil,
    YProvider
) {
    const Y = BlockNote.YJS;
    const APP = window.APP = {
        currentVersion: 1,
        locked: true,
    };

    // This is the main initialization loop
    const onFrameworkReady = (framework) => {
        const common = framework._.sfCommon;
        const priv = common.getMetadataMgr().getPrivateData();
        const userData = common.getMetadataMgr().getUserData();
        const $container = $('#cp-app-notes-editor');

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

        const yOpts = {};
        const myId = Util.uid();

        let ydoc = new Y.Doc(yOpts);
        const provider = YProvider.create({
            APP, framework, common, ydoc, myId, yOpts, Y
        });

        let content = {
            hashes: {},
            ids: {},
            version: 1
        };
        provider.setContent(content);

        let currentEditor;

        const createEditor = async () => {
            const editorEl = h('div#cp-notes-content');
            $container.append(editorEl);
            provider.provider.on('synced', () => {
                console.error('provider synced');
            });
            APP.editor = currentEditor = BlockNote.useBlockNoteEditor(editorEl, {
                trailingBlock: true,
                resolveFileUrl: NotesUtil.resolveImageUrl,
                view: {
                    editable: !priv.readOnly,
                    theme: window.CryptPad_theme === 'dark' ? 'dark' : 'light',
                    uploadImageFromCryptDrive,
                },
                collaboration: {
                    provider: provider.provider,
                    fragment: ydoc.getXmlFragment('document-store'),
                    user: {
                        name: userData.name,
                        color: userData.color,
                    },
                },
            });
        };
        createEditor();

        const resetEditor = async () => {
            if (currentEditor) {
                try {
                    currentEditor.unmount();
                    currentEditor.editor._tiptapEditor.destroy();
                    //await destroyProvider(current.provider);
                    currentEditor.ydoc.destroy();
                    $container.empty();
                } catch (err) {
                    console.error(err);
                }
                currentEditor = null;
            }
            await createEditor();
        };
        provider.onResetUI(async (cpData, data) => {
            ydoc = new Y.Doc(yOpts);
            await resetEditor();
            setEditable();

            provider.updateUI(cpData, data, ydoc);
        });

        const setEditable = () => {
            let editable = APP.online && !APP.readOnly && !APP.locked;
            console.error('EDITABLE?', editable);
            // XXX
        };

        framework.onEditableChange(function () {
            APP.online = !framework.isLocked(); // connection state
            APP.readonly = framework.isReadOnly(); // access-rights
            if (APP.online) { provider.setIds(); }
            setEditable();
        });
        provider.onLockChange(locked => {
            APP.locked = locked; // rtchannel ready/locked
            setEditable();
        });

        framework.onContentUpdate(function (newContent) {
            console.log('New content received from others', newContent.content);
            // Update local content
            content = newContent.content;
            // Update Yjs & rtChannel object
            provider.chainpadContentUpdate(newContent.content);
        });

        framework.setContentGetter(function () {
            console.log('Sync my content with others', content);
            return {
                content: content
            };
        });


        framework.onReady(function () {
            // Document is ready, you can initialize your app
            console.log('Document is ready:', content);

            if (!content.channel && !Object.keys(content.hashes).length) {
                content.channel = Hash.createChannelId();
                content.ctime ||= +new Date();
                framework.localChange();
                //checkLinkedDocs(); XXX
            }

            provider.setIds();
            provider.initDoc();
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
