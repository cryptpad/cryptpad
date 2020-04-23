(function () {
    var CKEDITOR = window.CKEDITOR;

    function isUnstylable (el) {
        var b = el.getAttribute( 'contentEditable' ) === 'false' ||
               el.getAttribute( 'data-nostyle' );
        return b;
    }

    var color1 = 'rgba(252, 165, 3, 0.8);';
    var color2 = 'rgba(252, 231, 3, 0.8);';

    CKEDITOR.plugins.add('comments', {
        //requires: 'dialog,widget',
        //icons: 'image',
        //hidpi: true,
        onLoad: function () {
            CKEDITOR.addCss('comment { background-color: '+color1+' }' +
                '@keyframes color { 0% { background-color: '+color2+' } 50% { background-color: '+color1+' } 100% { background-color: '+color2+' } }' +
                'comment:focus { animation-name: color; animation-duration: 1s; animation-iteration-count: 2; background-color: '+color2+' outline: none;}' +
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
                    'data-uid': '#(uid)',
                    'tabindex': '1'
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

            // Uncomment provided element
            editor.plugins.comments.uncomment = function (id, els) {
                if (editor.readOnly) { return; }
                editor.fire('saveSnapshot');

                //Create style for this id
                var style = new CKEDITOR.style({
                    element: 'comment',
                    attributes: {
                        'data-uid': id,
                        'tabindex': '1'
                    },
                });
                style.alwaysRemoveElement = true;
                els.forEach(function (el) {
                    // Create range for the entire document
                    var node = new CKEDITOR.dom.node(el);
                    var range = editor.createRange();
                    range.setStart(node, 0);
                    range.setEnd(node, Number.MAX_SAFE_INTEGER);
                    // Remove style for the document
                    style.removeFromRange(range, editor);
                });

                setTimeout( function() {
                    editor.fire('saveSnapshot');
                }, 0 );
            };

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
