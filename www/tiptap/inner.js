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
    'less!/tiptap/app-tiptap.less'
    /* Here you can add your own javascript or css to load */
], function (
    $,
    Framework,
    Messages,
    h,
    TiptapUnused,
    ) {
    const Tiptap = window.Tiptap;

    const createToolbar = function ($toolbar, editor) {
        const actions = [
            {
                icon: 'fa-bold',
                run: () => editor.chain().focus().toggleBold().run(),
            },
            {
                icon: 'fa-italic',
                run: () => editor.chain().focus().toggleItalic().run(),
            },
            {
                icon: 'fa-strikethrough',
                run: () => editor.chain().focus().toggleStrike().run(),
            },
            {
                icon: 'fa-code',
                run: () => editor.chain().focus().toggleCode().run(),
            },
            //         <button
            //           onClick={() => editor.chain().focus().toggleCode().run()}
            //           disabled={
            //             !editor.can()
            //               .chain()
            //               .focus()
            //               .toggleCode()
            //               .run()
            //           }
            //           className={editor.isActive('code') ? 'is-active' : ''}
            //         >
            //           Code
            //         </button>
            //         <button onClick={() => editor.chain().focus().unsetAllMarks().run()}>
            //           Clear marks
            //         </button>
            //         <button onClick={() => editor.chain().focus().clearNodes().run()}>
            //           Clear nodes
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().setParagraph().run()}
            //           className={editor.isActive('paragraph') ? 'is-active' : ''}
            //         >
            //           Paragraph
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            //           className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            //         >
            //           H1
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            //           className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            //         >
            //           H2
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            //           className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            //         >
            //           H3
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            //           className={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}
            //         >
            //           H4
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
            //           className={editor.isActive('heading', { level: 5 }) ? 'is-active' : ''}
            //         >
            //           H5
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
            //           className={editor.isActive('heading', { level: 6 }) ? 'is-active' : ''}
            //         >
            //           H6
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().toggleBulletList().run()}
            //           className={editor.isActive('bulletList') ? 'is-active' : ''}
            //         >
            //           Bullet list
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().toggleOrderedList().run()}
            //           className={editor.isActive('orderedList') ? 'is-active' : ''}
            //         >
            //           Ordered list
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            //           className={editor.isActive('codeBlock') ? 'is-active' : ''}
            //         >
            //           Code block
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().toggleBlockquote().run()}
            //           className={editor.isActive('blockquote') ? 'is-active' : ''}
            //         >
            //           Blockquote
            //         </button>
            //         <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            //           Horizontal rule
            //         </button>
            //         <button onClick={() => editor.chain().focus().setHardBreak().run()}>
            //           Hard break
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().undo().run()}
            //           disabled={
            //             !editor.can()
            //               .chain()
            //               .focus()
            //               .undo()
            //               .run()
            //           }
            //         >
            //           Undo
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().redo().run()}
            //           disabled={
            //             !editor.can()
            //               .chain()
            //               .focus()
            //               .redo()
            //               .run()
            //           }
            //         >
            //           Redo
            //         </button>
            //         <button
            //           onClick={() => editor.chain().focus().setColor('#958DF1').run()}
            //           className={editor.isActive('textStyle', { color: '#958DF1' }) ? 'is-active' : ''}
            //         >
            //           Purple
            //         </button>
            //       </div>
            //     </div>
            //   )
            // }

            // const extensions = [
            //   Color.configure({ types: [TextStyle.name, ListItem.name] }),
            //   TextStyle.configure({ types: [ListItem.name] }),
            //   StarterKit.configure({
            //     bulletList: {
            //       keepMarks: true,
            //       keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
            //     },
            //     orderedList: {
            //       keepMarks: true,
            //       keepAttributes: false,
        ];

        // var onClick = function () {
        //     var type = $(this).attr('data-type');
        //     var texts = editor.getSelections();
        //     if (actions[type].action) {
        //         return actions[type].action();
        //     }
        //     var newTexts = texts.map(function (str) {
        //         str = str || Messages.mdToolbar_defaultText;
        //         if (actions[type].apply) {
        //             return actions[type].apply(str);
        //         }
        //         return actions[type].expr.replace('{0}', str);
        //     });
        //     editor.replaceSelections(newTexts, 'around');
        //     editor.focus();
        // };

        const createOnClick = (action) => {
            return () => {
                action.run();
            };
        }

        for (var action of actions) {
            let $b = $('<button>', {
                'class': 'pure-button fa ' + action.icon,
            }).click(createOnClick(action));
            $toolbar.append($b);
        }

        return $toolbar;
    };

    // This is the main initialization loop
    let onFrameworkReady = function (framework) {
        let $container = $('#cp-app-tiptap-editor');

        let $content = $(h('div#cp-tiptap-content')).appendTo($container);
        let $tiptapElement = $(h('div.cp-tiptap-element'));
        $content.append($tiptapElement);
        let oldVal = '';
        $tiptapElement.on('change keyup paste', function () {
            var currentVal = $tiptapElement.val();
            if (currentVal === oldVal) { return; } // Nothing to do
            oldVal = currentVal;
            framework.localChange();
        });
        let getContent = () => {
            return $tiptapElement.val();
        };
        let setContent = (value) => {
            return $tiptapElement.val(value);
        };

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
            setContent(content);
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
            const element = document.querySelector('.cp-tiptap-element');
            const editor = Tiptap.start(element);

            createToolbar($('#cp-tiptap-toolbar'), editor);
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
