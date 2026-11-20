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
    '/common/yjs-bundle.js',
    '/common/yjs-provider.js',
    'less!/yjs/app-yjs.less'
    /* Here you can add your own javascript or css to load */
], function (
    $,
    Framework,
    Hash,
    Util,
    Messages,
    h,
    YBundle,
    YProvider
    ) {

    const { YJS:Y, Diff } = YBundle;
    const APP = window.APP = {
        currentVersion: 1,
        locked: true,
    };

    // This is the main initialization loop
    let onFrameworkReady = function (framework) {
        const common = framework._.sfCommon;

        let $container = $('#cp-app-yjs-editor');

        let $content = $(h('div#cp-yjs-content')).appendTo($container);
        let textarea = h('textarea');
        let $textarea = $(textarea);
        $content.append($textarea);

        const yOpts = {};
        const myId = Util.uid();

        let ydoc = new Y.Doc(yOpts);
        let ytext = ydoc.getText('cp-textarea');

        const provider = YProvider.create({
            APP, framework, common, ydoc, myId, yOpts, Y
        });


        const applyDiff = diffs => {
            let pos = 0;
            ydoc.transact((_) => {
                diffs.forEach(d => {
                    if (d[0] === Diff.EQUAL) {
                        // EQUAL
                        pos += d[1].length;
                    } else if (d[0] === Diff.DELETE) {

                        // DELETE
                        ytext.delete(pos, d[1].length);
                    } else {
                        // INSERT
                        ytext.insert(pos, d[1]);
                        pos += d[1].length;
                    }
                });
            }, myId);
        };

        let oldVal = '';
        const onInput = () => {
            var currentVal = $textarea.val();
            const oldVal = ytext.toString();
            if (currentVal === oldVal) { return; } // Nothing to do
            let diff = Diff.default(oldVal, currentVal, textarea.selectionStart);
            applyDiff(diff);
        };
        $textarea.on('change keyup paste', onInput);
        provider.onRemote(() => {
            $textarea.val(ytext.toString());
        });


        let content = {
            hashes: {},
            ids: {},
            version: 1
        };
        provider.setContent(content);
        let getContent = () => {
            return content;
        };
        let setContent = (value) => {
            content = value;
            provider.setContent(content);
        };

        // OPTIONAL: cursor management
        /*
        framework.setCursorGetter(() => {
            let myCursor = {};
            // Get your cursor position here
            return myCursor;
        });
        framework.onCursorUpdate(data => {
            console.log("Other user cursor", data);
        });
        */
        const setEditable = () => {
            let editable = APP.online && !APP.readOnly && !APP.locked;
            $textarea.prop('readonly', editable ? false : 'readonly');
        };

        APP.setEdit = setEditable;
        setEditable();

        framework.onContentUpdate(function (newContent) {
            console.log('New content received from others', newContent.content);
            // Update local content
            content = newContent.content;
            // Update Yjs & rtChannel object
            provider.chainpadContentUpdate(newContent.content);
        });

        framework.setContentGetter(function () {
            let content = getContent();
            console.log('Sync my content with others', content);
            return {
                content: content
            };
        });

        framework.onEditableChange(function () {
            APP.online = !framework.isLocked(); // connection state
            APP.readonly = framework.isReadOnly(); // access-rights
            if (APP.online) { provider.setIds(); }
            setEditable();
        });

        provider.onResetUI((cpData, data) => {
            // new checkpoint
            $textarea.off('change keyup paste', onInput);
            ydoc = new Y.Doc(yOpts);
            ytext = ydoc.getText('cp-textarea');

            let newText = h('textarea', {id: Util.uid()});
            textarea.replaceWith(newText);
            textarea = newText;
            $textarea = $(textarea);
            $textarea.on('change keyup paste', onInput);
            setEditable();

            provider.updateUI(cpData, data, ydoc);
        });

        provider.onLockChange(locked => {
            APP.locked = locked;
            setEditable();
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
        contentContainer: '#cp-app-yjs-editor'
    }, (framework) => {
        onFrameworkReady(framework);
    });
});
