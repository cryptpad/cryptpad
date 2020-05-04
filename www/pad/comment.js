(function() {
    var CKEDITOR = window.CKEDITOR;

    function isUnstylable(el) {
        if (el.hasClass('cke_widget_mathjax')) {
            return false;
        }
        if (el.hasClass('cke_widget_mediatag')) {
            return false;
        }
        var b = el.getAttribute('contentEditable') === 'false' ||
            el.getAttribute('data-nostyle');
        return b;
    }

    var color1 = 'rgba(249, 230, 65, 1.0)';
    var color2 = 'rgba(252, 181, 0, 1.0)';

    CKEDITOR.plugins.add('comments', {
        onLoad: function() {
            CKEDITOR.addCss('comment { background-color: ' + color1 + '; }' +
                '@keyframes color { 0% { background-color: ' + color2 + '; } 50% { background-color: ' + color1 + '; } 100% { background-color: ' + color2 + '; } }' +
                'comment.active { animation-name: color; animation-duration: 1s; animation-iteration-count: 2; background-color: ' + color2 + '; outline: none;}' +
                'comment media-tag { border: 2px solid ' + color1 + ' !important; }' +
                'comment.active media-tag { border: 2px solid ' + color2 + ' !important; }' +
                'comment * { background-color: transparent !important; }');
        },
        init: function(editor) {
            var Messages = CKEDITOR._commentsTranslations;

            var styleDef = {
                element: 'comment',
                attributes: {
                    'data-uid': '#(uid)',
                },
                overrides: [{
                    element: 'comment'
                }],
                childRule: isUnstylable
            };
            var removeStyle = new CKEDITOR.style(styleDef, { 'uid': '' });

            var isApplicable = editor.plugins.comments.isApplicable = function(path, sel) {
                path = path || editor.elementPath();
                sel = sel || editor.getSelection();
                var applicable = removeStyle.checkApplicable(path, editor);
                var hasComments = editor.getSelectedHtml().$.querySelectorAll('comment').length;
                var isComment = removeStyle.checkActive(path, editor);
                var empty = !sel.getSelectedText();
                return applicable && !empty && !hasComments && !isComment;
            };

            // Register the command.
            editor.addCommand('comment', {
                exec: function(editor) {
                    if (editor.readOnly) { return; }
                    editor.focus();

                    var uid = CKEDITOR.tools.getUniqueId();
                    editor.plugins.comments.addComment(uid, function() {
                        // Make an undo spnashot
                        editor.fire('saveSnapshot');
                        // Make sure comments won't overlap
                        editor.removeStyle(removeStyle);

                        // Add the comment marker
                        var s = new CKEDITOR.style(styleDef, { 'uid': uid });
                        editor.applyStyle(s);

                        // Save the undo snapshot after all changes are affected.
                        setTimeout(function() {
                            editor.fire('saveSnapshot');
                        }, 0);
                    });

                }
            });

            // Uncomment provided element
            editor.plugins.comments.uncomment = function(id, els) {
                if (editor.readOnly) { return; }
                editor.fire('saveSnapshot');

                //Create style for this id
                var style = new CKEDITOR.style({
                    element: 'comment',
                    attributes: {
                        'data-uid': id,
                    },
                });
                style.alwaysRemoveElement = true;
                els.forEach(function(el) {
                    // Create range for this element
                    el.removeAttribute('class');
                    var node = new CKEDITOR.dom.node(el);
                    var range = editor.createRange();
                    range.setStart(node, 0);
                    range.setEnd(node, Number.MAX_SAFE_INTEGER);
                    // Remove style for the comment
                    try {
                        style.removeFromRange(range, editor);
                    } catch (e) {
                        console.error(e);
                    }
                });

                setTimeout(function() {
                    editor.fire('saveSnapshot');
                }, 0);
            };

            // Uncomment from context menu, disabled for now...
            editor.addCommand('uncomment', {
                exec: function(editor, data) {
                    if (editor.readOnly) { return; }
                    editor.fire('saveSnapshot');
                    if (!data ||  !data.id) {
                        editor.focus();
                        editor.removeStyle(removeStyle);
                        setTimeout(function() {
                            editor.fire('saveSnapshot');
                        }, 0);
                        return;
                    }
                }
            });

            // Register the toolbar button.
            if (editor.ui.addButton) {
                editor.ui.addButton('Comment', {
                    label: Messages.comment,
                    command: 'comment',
                    icon: '/pad/icons/comment.png',
                    toolbar: 'insert,10'
                });
            }

            if (editor.addMenuItems) {
                editor.addMenuGroup('comments');
                editor.addMenuItem('comment', {
                    label: Messages.comment,
                    icon: '/pad/icons/comment.png',
                    command: 'comment',
                    group: 'comments'
                });
                /*
                editor.addMenuItem('uncomment', {
                    label: Messages.uncomment,
                    icon : '/pad/icons/uncomment.png',
                    command: 'uncomment',
                    group: 'comments'
                });
                */
            }
            if (editor.contextMenu) {
                /*
                editor.contextMenu.addListener(function (element, sel, path) {
                    var isComment = removeStyle.checkActive(path, editor);
                    if (!isComment) { return; }
                    return {
                        uncomment: CKEDITOR.TRISTATE_OFF,
                    };
                });
                */
                editor.contextMenu.addListener(function(element, sel, path) {
                    var applicable = isApplicable(path, sel);
                    if (!applicable) { return; }
                    return {
                        comment: CKEDITOR.TRISTATE_OFF,
                    };
                });
            }
        }
    });

})();
