define([
    'jquery',
    '/api/config',
    '/bower_components/marked/marked.min.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/hyperscript.js',
    '/common/media-tag.js',
    '/common/highlight/highlight.pack.js',
    '/customize/messages.js',
    '/bower_components/diff-dom/diffDOM.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    'css!/common/highlight/styles/github.css'
],function ($, ApiConfig, Marked, Hash, Util, h, MediaTag, Highlight, Messages) {
    var DiffMd = {};

    var DiffDOM = window.diffDOM;
    var renderer = new Marked.Renderer();
    var restrictedRenderer = new Marked.Renderer();

    var Mermaid = {
        init: function () {}
    };

    require(['/code/mermaid.js', 'css!/code/mermaid.css'], function (_Mermaid) {
        Mermaid = _Mermaid;
    });

    var highlighter = function () {
        return function(code, lang) {
            if (lang) {
                try {
                    return Highlight.highlight(lang, code).value;
                } catch (e) {
                    return code;
                }
            }
            return code;
        };
    };

    Marked.setOptions({
        //sanitize: true, // Disable HTML
        renderer: renderer,
        highlight: highlighter(),
    });

    var toc = [];
    var getTOC = function () {
        var content = [h('h2', Messages.markdown_toc)];
        toc.forEach(function (obj) {
            // Only include level 2 headings
            var level = obj.level - 1;
            if (level < 1) { return; }
            var a = h('a.cp-md-toc-link', {
                href: '#',
                'data-href': obj.id,
                title: obj.title
            });
            a.innerHTML = obj.title;
            content.push(h('p.cp-md-toc-'+level, ['• ',  a]));
        });
        return h('div.cp-md-toc', content).outerHTML;
    };

    DiffMd.render = function (md, sanitize, restrictedMd) {
        Marked.setOptions({
            renderer: restrictedMd ? restrictedRenderer : renderer,
        });
        var r = Marked(md, {
            sanitize: sanitize
        });

        // Add Table of Content
        if (!restrictedMd) {
            r = r.replace(/<div class="cp-md-toc"><\/div>/g, getTOC());
        }
        toc = [];

        return r;
    };

    var mediaMap = {};

    var defaultCode = renderer.code;
    renderer.code = function (code, language) {
        if (language === 'mermaid' && (code.match(/^sequenceDiagram/) || code.match(/^graph/))) {
            return '<pre class="mermaid">'+code+'</pre>';
        } else {
            return defaultCode.apply(renderer, arguments);
        }
    };
    restrictedRenderer.code = renderer.code;

    renderer.heading = function (text, level) {
        var i = 0;
        var safeText = text.toLowerCase().replace(/[^\w]+/g, '-');
        var getId = function () {
            return 'cp-md-' + i + '-' + safeText;
        };
        var id = getId();
        var isAlreadyUsed = function (obj) { return obj.id === id; };
        while (toc.some(isAlreadyUsed)) {
            i++;
            id = getId();
        }
        toc.push({
            level: level,
            id: id,
            title: Util.stripTags(text)
        });
        return "<h" + level + " id=\"" + id + "\"><a href=\"#" + id + "\" class=\"anchor\"></a>" + text + "</h" + level + ">";
    };
    restrictedRenderer.heading = function (text) {
        return text;
    };

    // Tasks list
    var checkedTaskItemPtn = /^\s*(<p>)?\[[xX]\](<\/p>)?\s*/;
    var uncheckedTaskItemPtn = /^\s*(<p>)?\[ ?\](<\/p>)?\s*/;
    var bogusCheckPtn = /<input( checked=""){0,1} disabled="" type="checkbox">/;
    renderer.listitem = function (text) {
        var isCheckedTaskItem = checkedTaskItemPtn.test(text);
        var isUncheckedTaskItem = uncheckedTaskItemPtn.test(text);
        var hasBogusInput = bogusCheckPtn.test(text);
        if (isCheckedTaskItem) {
            text = text.replace(checkedTaskItemPtn,
                '<i class="fa fa-check-square" aria-hidden="true"></i>') + '\n';
        }
        if (isUncheckedTaskItem) {
            text = text.replace(uncheckedTaskItemPtn,
                '<i class="fa fa-square-o" aria-hidden="true"></i>') + '\n';
        }
        if (!isCheckedTaskItem && !isUncheckedTaskItem && hasBogusInput) {
            if (/checked/.test(text)) {
                text = text.replace(bogusCheckPtn,
                '<i class="fa fa-check-square" aria-hidden="true"></i>') + '\n';
            } else if (/disabled/.test(text)) {
                text = text.replace(bogusCheckPtn,
                '<i class="fa fa-square-o" aria-hidden="true"></i>') + '\n';
            }
        }
        var cls = (isCheckedTaskItem || isUncheckedTaskItem || hasBogusInput) ? ' class="todo-list-item"' : '';
        return '<li'+ cls + '>' + text + '</li>\n';
    };
    restrictedRenderer.listitem = function (text) {
        if (bogusCheckPtn.test(text)) {
            text = text.replace(bogusCheckPtn, '');
        }
        return '<li>' + text + '</li>\n';
    };

    renderer.image = function (href, title, text) {
        if (href.slice(0,6) === '/file/') {
            // DEPRECATED
            // Mediatag using markdown syntax should not be used anymore so they don't support
            // password-protected files
            console.log('DEPRECATED: mediatag using markdown syntax!');
            var parsed = Hash.parsePadUrl(href);
            var secret = Hash.getSecrets('file', parsed.hash);
            var src = (ApiConfig.fileHost || '') +Hash.getBlobPathFromHex(secret.channel);
            var key = Hash.encodeBase64(secret.keys.cryptKey);
            var mt = '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + key + '"></media-tag>';
            if (mediaMap[src]) {
                mt += mediaMap[src];
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
    restrictedRenderer.image = renderer.image;

    var renderParagraph = function (p) {
        return /<media\-tag[\s\S]*>/i.test(p)? p + '\n': '<p>' + p + '</p>\n';
    };
    renderer.paragraph = function (p) {
        if (p === '[TOC]') {
            return '<p><div class="cp-md-toc"></div></p>';
        }
        return renderParagraph(p);
    };
    restrictedRenderer.paragraph = function (p) {
        return renderParagraph(p);
    };

    var MutationObserver = window.MutationObserver;
    var forbiddenTags = [
        'SCRIPT',
        'IFRAME',
        'OBJECT',
        'APPLET',
        'VIDEO', // privacy implications of videos are the same as images
        'AUDIO', // same with audio
        'SVG'
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
            if (info.diff.element && forbiddenTags.indexOf(info.diff.element.nodeName.toUpperCase()) !== -1) {
                console.log(msg, info.diff.element.nodeName);
                return true;
            } else if (info.diff.newValue && forbiddenTags.indexOf(info.diff.newValue.nodeName.toUpperCase()) !== -1) {
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
        if (forbiddenTags.indexOf(root.nodeName.toUpperCase()) !== -1) { removeNode(root); }
        slice(root.children).forEach(removeForbiddenTags);
    };

    /*  remove listeners from the DOM */
    var removeListeners = function (root) {
        if (!root) { return; }
        slice(root.attributes).map(function (attr) {
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
        Dom.normalize();
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

    DiffMd.apply = function (newHtml, $content, common) {
        var contextMenu = common.importMediaTagMenu();
        var id = $content.attr('id');
        if (!id) { throw new Error("The element must have a valid id"); }
        var pattern = /(<media-tag src="([^"]*)" data-crypto-key="([^"]*)">)<\/media-tag>/g;

        var unsafe_newHtmlFixed = newHtml.replace(pattern, function (all, tag, src) {
            var mt = tag;
            if (mediaMap[src]) { mt += mediaMap[src]; }
            return mt + '</media-tag>';
        });

        var newDomFixed = domFromHTML(unsafe_newHtmlFixed);
        if (!newDomFixed || !newDomFixed.body) { return; }
        var safe_newHtmlFixed = newDomFixed.body.outerHTML;
        var $div = $('<div>', {id: id}).append(safe_newHtmlFixed);

        var Dom = domFromHTML($('<div>').append($div).html());
        $content[0].normalize();
        $content.find('pre.mermaid[data-processed="true"]').remove();
        var oldDom = domFromHTML($content[0].outerHTML);
        var patch = makeDiff(oldDom, Dom, id);
        if (typeof(patch) === 'string') {
            throw new Error(patch);
        } else {
            DD.apply($content[0], patch);
            var $mts = $content.find('media-tag:not(:has(*))');
            $mts.each(function (i, el) {
                $(el).contextmenu(function (e) {
                    e.preventDefault();
                    $(contextMenu.menu).data('mediatag', $(el));
                    contextMenu.show(e);
                });
                MediaTag(el);
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                            var list_values = [].slice.call(mutation.target.children)
                                                .map(function (el) { return el.outerHTML; })
                                                .join('');
                            mediaMap[mutation.target.getAttribute('src')] = list_values;
                            observer.disconnect();
                        }
                    });
                });
                observer.observe(el, {
                    attributes: false,
                    childList: true,
                    characterData: false
                });
            });
            // Fix Table of contents links
            $content.find('a.cp-md-toc-link').off('click').click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                var $a = $(this);
                if (!$a.attr('data-href')) { return; }
                var target = document.getElementById($a.attr('data-href'));
                if (target) { target.scrollIntoView(); }
            });
            try {
                Mermaid.init();
            } catch (e) { console.error(e); }
        }
    };

    return DiffMd;
});

