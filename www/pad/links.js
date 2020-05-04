define([
    'jquery',
    '/common/hyperscript.js',
    '/customize/messages.js'
], function ($, h, Messages) {

    var onLinkClicked = function (e, inner) {
        var $target = $(e.target);
        if (!$target.is('a')) { return; }
        var href = $target.attr('href');
        if (!href || href[0] === '#') { return; }
        e.preventDefault();
        e.stopPropagation();

        var $iframe = $('html').find('iframe').contents();
        var $inner = $(inner);

        var rect = e.target.getBoundingClientRect();
        var rect0 = inner.getBoundingClientRect();
        var l = (rect.left - rect0.left)+'px';
        var t = rect.bottom + $iframe.scrollTop() +'px';

        var a = h('a', { href: href}, href);
        var link = h('div.cp-link-clicked.non-realtime', {
            contenteditable: false,
            style: 'top:'+t+';left:'+l
        }, [ a ]);
        var $link = $(link);
        $inner.append(link);

        if (rect.left + $link.outerWidth() - rect0.left > $inner.width()) {
            $link.css('left', 'unset');
            $link.css('right', 0);
        }

        $(a).click(function (ee) {
            ee.preventDefault();
            ee.stopPropagation();
            var bounceHref = window.location.origin + '/bounce/#' + encodeURIComponent(href);
            window.open(bounceHref);
            $link.remove();
        });
        $link.on('mouseleave', function () {
            $link.remove();
        });
    };
    var removeClickedLink = function ($inner) {
        $inner.find('.cp-link-clicked').remove();
    };

    return {
        init : function (Ckeditor, editor) {
            if (!Ckeditor.plugins.link) { return; }

            var inner = editor.document.$.body;
            var $inner = $(inner);
            // Bubble to open the link in a new tab
            $inner.click(function (e) {
                removeClickedLink($inner);
                if (e.target.nodeName.toUpperCase() === 'A') {
                    return void onLinkClicked(e, inner);
                }
            });



            // Adds a context menu entry to open the selected link in a new tab.
            var getActiveLink = function() {
                var anchor = Ckeditor.plugins.link.getSelectedLink(editor);
                // We need to do some special checking against widgets availability.
                var activeWidget = editor.widgets && editor.widgets.focused;
                // If default way of getting links didn't return anything useful..
                if (!anchor && activeWidget && activeWidget.name === 'image' && activeWidget.parts.link) {
                    // Since CKEditor 4.4.0 image widgets may be linked.
                    anchor = activeWidget.parts.link;
                }
                return anchor;
            };

            editor.addCommand( 'openLink', {
                exec: function() {
                    var anchor = getActiveLink();
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
                        var anchor = getActiveLink();
                        if (anchor && anchor.getAttribute('href')) {
                            return {openLink: Ckeditor.TRISTATE_OFF};
                        }
                    }
                });
                editor.contextMenu._.panelDefinition.css.push('.cke_button__openLink_icon {' +
                    Ckeditor.skin.getIconStyle('link') + '}');
            }
        }
    };
});
