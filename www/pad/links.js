define(['/customize/messages.js'], function (Messages) {
    // Adds a context menu entry to open the selected link in a new tab.
    // See https://github.com/xwiki-contrib/application-ckeditor/commit/755d193497bf23ed874d874b4ae92fbee887fc10
    return {
        addSupportForOpeningLinksInNewTab : function (Ckeditor) {
                // Returns the DOM element of the active (currently focused) link. It has also support for linked image widgets.
            // @return {CKEDITOR.dom.element}
            var getActiveLink = function(editor) {
                var anchor = Ckeditor.plugins.link.getSelectedLink(editor),
                    // We need to do some special checking against widgets availability.
                    activeWidget = editor.widgets && editor.widgets.focused;
                // If default way of getting links didn't return anything useful..
                if (!anchor && activeWidget && activeWidget.name === 'image' && activeWidget.parts.link) {
                    // Since CKEditor 4.4.0 image widgets may be linked.
                    anchor = activeWidget.parts.link;
                }
                return anchor;
            };

            return function(event) {
                var editor = event.editor;
                if (!Ckeditor.plugins.link) {
                    return;
                }
                editor.addCommand( 'openLink', {
                    exec: function(editor) {
                        var anchor = getActiveLink(editor);
                        if (anchor) {
                            var href = anchor.getAttribute('href');
                            if (href) {
                                var bounceHref = window.location.origin + '/bounce/#' + encodeURIComponent(href);
                                window.open(bounceHref);
                            }
                        }
                    }
                });
                if (typeof editor.addMenuItem === 'function') {
                    editor.addMenuItem('openLink', {
                        label: Messages.openLinkInNewTab,
                        command: 'openLink',
                        group: 'link',
                        order: -1
                    });
                }
                if (editor.contextMenu) {
                    editor.contextMenu.addListener(function(startElement) {
                        if (startElement) {
                            var anchor = getActiveLink(editor);
                            if (anchor && anchor.getAttribute('href')) {
                                return {openLink: Ckeditor.TRISTATE_OFF};
                            }
                        }
                    });
                    editor.contextMenu._.panelDefinition.css.push('.cke_button__openLink_icon {' +
                        Ckeditor.skin.getIconStyle('link') + '}');
                }
            };
        }
    };
});
