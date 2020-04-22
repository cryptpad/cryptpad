(function () {

    function isUnstylable (el) {
        console.log(el);
        console.log(el.getAttribute('contentEditable'));
        console.log(el.getAttribute('data-nostyle'));
        var b = el.getAttribute( 'contentEditable' ) == 'false' ||
               el.getAttribute( 'data-nostyle' );
        console.log(b);
        return b;
    }

    CKEDITOR.plugins.add('comments', {
        //requires: 'dialog,widget',
        //icons: 'image',
        //hidpi: true,
        onLoad: function () {
            CKEDITOR.addCss('comment { background-color: rgba(252, 165, 3, 0.8); }' +
                'comment * { background-color: transparent !important; }');
        },
        init: function (editor) {
            var pluginName = 'comment';
            var Messages = CKEDITOR._commentsTranslations; // XXX
            var targetWidget;

            var styles = {};

            var styleDef = {
                element: 'comment',
                attributes: {
                    'data-uid': '#(uid)'
                },
                overrides: [ {
                    element: 'comment'
                } ],
                childRule: isUnstylable
            };

            // Register the command.
            var removeStyle = new CKEDITOR.style(styleDef, { 'uid': '' });
            editor.addCommand('comment', {
                exec: function (editor, data) {
                    if (editor.readOnly) { return; }
                    editor.focus();

                    // If we're inside another comment, abort
                    var isComment = removeStyle.checkActive(editor.elementPath(), editor);
                    if (isComment) { return; }

                    // We can't comment on empty text!
                    if (!editor.getSelection().getSelectedText()) { return; }

                    var uid = CKEDITOR.tools.getUniqueId();
                    editor.plugins.comments.addComment(uid, function () {
                        // Make an undo spnashot
                        editor.fire('saveSnapshot');
                        // Make sure comments won't overlap
                        editor.removeStyle(removeStyle);

                        // Add the comment marker
                        var s = new CKEDITOR.style(styleDef, { 'uid': uid });
                        editor.applyStyle(s);

                        // Save the undo snapshot after all changes are affected.
                        setTimeout( function() {
                            editor.fire('saveSnapshot');
                        }, 0 );
                    });

                }
            });

            editor.addCommand('uncomment', {
                exec: function (editor, data) {
                    if (editor.readOnly) { return; }
                    editor.fire('saveSnapshot');
                    if (!data || !data.id) {
                        // XXX Uncomment the selection, remove on prod, only used for dev
                        editor.focus();
                        editor.removeStyle(removeStyle);
                        setTimeout( function() {
                            editor.fire('saveSnapshot');
                        }, 0 );
                        return;
                    }
                    // Uncomment provided element

                    //Create style for this id
                    var style = new CKEDITOR.style({
                        element: 'comment',
                        attributes: {
                            'data-uid': data.id
                        },
                    });
                    // Create range for the entire document
                    var range = editor.createRange();
                    range.selectNodeContents( editor.document.getBody() );
                    // Remove style for the document
                    style.removeFromRange(range, editor);

                    setTimeout( function() {
                        editor.fire('saveSnapshot');
                    }, 0 );
                }
            });

            // Register the toolbar button.
            // XXX Uncomment selection, remove on prod, only used for dev
            editor.ui.addButton && editor.ui.addButton('UnComment', {
                label: 'UNCOMMENT',
                command: 'uncomment',
                toolbar: 'insert,10'
            });
            editor.ui.addButton && editor.ui.addButton('Comment', {
                label: 'COMMENT',
                command: pluginName,
                icon : '/pad/icons/comment.png',
                toolbar: 'insert,10'
            });
        },
        afterInit: function (editor) {
            editor.plugins.comments.removeComment = function () {};
        }
    });

})();
