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

// XXX define default style
// XXX we can't uncomment if nothing has been added yet
// XXX "styles" is useless because not rebuilt on reload
// XXX and one style can remove all the other ones so no need to store all of them?

            // Register the command.
            var removeStyle = new CKEDITOR.style(styleDef, { 'uid': '' });
            editor.addCommand(pluginName, {
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
                        // XXX call cryptpad code here
                        editor.fire('saveSnapshot');
                        editor.removeStyle(removeStyle);
                        /*
                        Object.keys(styles).forEach(function (id) {
                            editor.removeStyle(styles[id]);
                        });
                        */
                        styles[uid] = new CKEDITOR.style(styleDef, { 'uid': uid });
                        editor.applyStyle(styles[uid]);

                        //editor.removeStyle(removeStyle); // XXX to remove comment on the selection
                        //editor.plugins.comments.addComment();
                        // Save the undo snapshot after all changes are affected.
                        setTimeout( function() {
                            editor.fire('saveSnapshot');
                        }, 0 );
                    });

                }
            });

            // XXX Uncomment selection, remove on prod, only used for dev
            editor.addCommand('uncomment', {
                exec: function (editor, data) {
                    if (editor.readOnly) { return; }
                    editor.focus();
                    editor.fire('saveSnapshot');
                    editor.removeStyle(removeStyle);
                    setTimeout( function() {
                        editor.fire('saveSnapshot');
                    }, 0 );
                }
            });

            // Register the toolbar button.
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
