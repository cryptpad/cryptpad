define([
    'jquery',
    '/bower_components/marked/marked.min.js',
    '/common/cryptpad-common.js',
    '/common/media-tag.js',
    '/bower_components/diff-dom/diffDOM.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
],function ($, Marked, Cryptpad, MediaTag) {
    var DiffMd = {};

    var DiffDOM = window.diffDOM;
    var renderer = new Marked.Renderer();

    Marked.setOptions({
        renderer: renderer
    });

    DiffMd.render = function (md) {
        return Marked(md);
    };

    var mediaMap = {};

    // Tasks list
    var checkedTaskItemPtn = /^\s*\[x\]\s*/;
    var uncheckedTaskItemPtn = /^\s*\[ \]\s*/;
    renderer.listitem = function (text) {
        var isCheckedTaskItem = checkedTaskItemPtn.test(text);
        var isUncheckedTaskItem = uncheckedTaskItemPtn.test(text);
        if (isCheckedTaskItem) {
            text = text.replace(checkedTaskItemPtn,
                '<i class="fa fa-check-square" aria-hidden="true"></i>&nbsp;') + '\n';
        }
        if (isUncheckedTaskItem) {
            text = text.replace(uncheckedTaskItemPtn,
                '<i class="fa fa-square-o" aria-hidden="true"></i>&nbsp;') + '\n';
        }
        var cls = (isCheckedTaskItem || isUncheckedTaskItem) ? ' class="todo-list-item"' : '';
        return '<li'+ cls + '>' + text + '</li>\n';
    };
    renderer.image = function (href, title, text) {
        if (href.slice(0,6) === '/file/') {
            var parsed = Cryptpad.parsePadUrl(href);
            var hexFileName = Cryptpad.base64ToHex(parsed.hashData.channel);
            var src = '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName;
            var mt = '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + parsed.hashData.key + '">';
            if (mediaMap[src]) {
                mediaMap[src].forEach(function (n) {
                    mt += n.outerHTML;
                });
            }
            mt += '</media-tag>';
            return mt;
        }
        var out = '<img src="' + href + '" alt="' + text + '"';
        if (title) {
            out += ' title="' + title + '"';
        }
        out += this.options.xhtml ? '/>' : '>';
        return out;
    };

    renderer.paragraph = function (p) {
        return /<media\-tag[\s\S]*>/i.test(p)? p + '\n': '<p>' + p + '</p>\n';
    };

    var MutationObserver = window.MutationObserver;
    var forbiddenTags = [
        'SCRIPT',
        'IFRAME',
        'OBJECT',
        'APPLET',
        //'VIDEO', // privacy implications of videos are the same as images
        //'AUDIO', // same with audio
    ];
    var unsafeTag = function (info) {
        /*if (info.node && $(info.node).parents('media-tag').length) {
            // Do not remove elements inside a media-tag
            return true;
        }*/
        if (['addAttribute', 'modifyAttribute'].indexOf(info.diff.action) !== -1) {
            if (/^on/i.test(info.diff.name)) {
                console.log("Rejecting forbidden element attribute with name", info.diff.name);
                return true;
            }
        }
        if (['addElement', 'replaceElement'].indexOf(info.diff.action) !== -1) {
            var msg = "Rejecting forbidden tag of type (%s)";
            if (info.diff.element && forbiddenTags.indexOf(info.diff.element.nodeName) !== -1) {
                console.log(msg, info.diff.element.nodeName);
                return true;
            } else if (info.diff.newValue && forbiddenTags.indexOf(info.diff.newValue.nodeName) !== -1) {
                console.log("Replacing restricted element type (%s) with PRE", info.diff.newValue.nodeName);
                info.diff.newValue.nodeName = 'PRE';
            }
        }
    };


    var slice = function (coll) {
        return Array.prototype.slice.call(coll);
    };

    var removeNode = function (node) {
        if (!(node && node.parentElement)) { return; }
        var parent = node.parentElement;
        if (!parent) { return; }
        console.log('removing %s tag', node.nodeName);
        parent.removeChild(node);
    };

    var removeForbiddenTags = function (root) {
        if (!root) { return; }
        if (forbiddenTags.indexOf(root.nodeName) !== -1) { removeNode(root); }
        slice(root.children).forEach(removeForbiddenTags);
    };

    /*  remove listeners from the DOM */
    var removeListeners = function (root) {
        slice(root.attributes).map(function (attr, i) {
            if (/^on/i.test(attr.name)) {
                console.log('removing attribute', attr.name, root.attributes[attr.name]);
                root.attributes.removeNamedItem(attr.name);
            }
        });
        // all the way down
        slice(root.children).forEach(removeListeners);
    };

    var domFromHTML = function (html) {
        var Dom = new DOMParser().parseFromString(html, "text/html");
        removeForbiddenTags(Dom.body);
        removeListeners(Dom.body);
        return Dom;
    };

    var DD = new DiffDOM({
        preDiffApply: function (info) {
            if (unsafeTag(info)) { return true; }
        },
    });

    var makeDiff = function (A, B, id) {
        var Err;
        var Els = [A, B].map(function (frag) {
            if (typeof(frag) === 'object') {
                if (!frag || (frag && !frag.body)) {
                    Err = "No body";
                    return;
                }
                var els = frag.body.querySelectorAll('#'+id);
                if (els.length) {
                    return els[0];
                }
            }
            Err = 'No candidate found';
        });
        if (Err) { return Err; }
        var patch = DD.diff(Els[0], Els[1]);
        return patch;
    };

    DiffMd.apply = function (newHtml, $content) {
        var id = $content.attr('id');
        if (!id) { throw new Error("The element must have a valid id"); }
        var pattern = /(<media-tag src="([^"]*)" data-crypto-key="([^"]*)">)<\/media-tag>/g;

        var unsafe_newHtmlFixed = newHtml.replace(pattern, function (all, tag, src) {
            var mt = tag;
            if (mediaMap[src]) {
                mediaMap[src].forEach(function (n) {
                    mt += n.outerHTML;
                });
            }
            return mt + '</media-tag>';
        });

        var safe_newHtmlFixed = domFromHTML(unsafe_newHtmlFixed).body.outerHTML;
        var $div = $('<div>', {id: id}).append(safe_newHtmlFixed);

        var Dom = domFromHTML($('<div>').append($div).html());
        var oldDom = domFromHTML($content[0].outerHTML);
        var patch = makeDiff(oldDom, Dom, id);
        if (typeof(patch) === 'string') {
            throw new Error(patch);
        } else {
            DD.apply($content[0], patch);
            var $mts = $content.find('media-tag:not(:has(*))');
            $mts.each(function (i, el) {
                MediaTag(el);
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                            //console.log(el.outerHTML);
                            var list_values = [].slice.call(el.children);
                            mediaMap[el.getAttribute('src')] = list_values;
                        }
                    });
                });
                observer.observe(el, {
                    attributes: false,
                    childList: true,
                    characterData: false
                });
            });
        }
    };

    return DiffMd;
});

