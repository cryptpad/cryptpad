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

            /*
            CKEDITOR.addCss(
            'media-tag *{' +
                'width:100%; height:100%;' +
            '}');
            */
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
            editor.addCommand(pluginName, {
                exec: function (editor, data) {
                    if (editor.readOnly) { return; }
                    editor.focus();
                    editor.fire('saveSnapshot');
                    // XXX call cryptpad code here
                    Object.keys(styles).forEach(function (id) {
                        editor.removeStyle(styles[id]);
                    });
                    var uid = CKEDITOR.tools.getUniqueId();
                    styles[uid] = new CKEDITOR.style(styleDef, { 'uid': uid });
                    editor.applyStyle(styles[uid]);

                    //editor.removeStyle(removeStyle); // XXX to remove comment on the selection
                    //editor.plugins.comments.addComment();
                    // Save the undo snapshot after all changes are affected.
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
