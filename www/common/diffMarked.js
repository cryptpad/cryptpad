define([
    'jquery',
    '/api/config',
    '/bower_components/marked/marked.min.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/hyperscript.js',
    '/common/inner/common-mediatag.js',
    '/common/media-tag.js',
    '/common/highlight/highlight.pack.js',
    '/customize/messages.js',
    '/bower_components/diff-dom/diffDOM.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    'css!/common/highlight/styles/github.css'
],function ($, ApiConfig, Marked, Hash, Util, h, MT, MediaTag, Highlight, Messages) {
    var DiffMd = {};

    var DiffDOM = window.diffDOM;
    var renderer = new Marked.Renderer();
    var restrictedRenderer = new Marked.Renderer();

    var Mermaid = {
        init: function () {}
    };

    var mermaidThemeCSS = //".node rect { fill: #DDD; stroke: #AAA; } " +
        "rect.task, rect.task0, rect.task2 { stroke-width: 1 !important; rx: 0 !important; } " +
        "g.grid g.tick line { opacity: 0.25; }" +
        "g.today line { stroke: red; stroke-width: 1; stroke-dasharray: 3; opacity: 0.5; }";

    require(['mermaid', 'css!/code/mermaid-new.css'], function (_Mermaid) {
        Mermaid = _Mermaid;
        Mermaid.initialize({
            gantt: { axisFormat: '%m-%d', },
            "themeCSS": mermaidThemeCSS,
        });
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
        if (language === 'mermaid' && code.match(/^(graph|pie|gantt|sequenceDiagram|classDiagram|gitGraph)/)) {
            return '<pre class="mermaid">'+Util.fixHTML(code)+'</pre>';
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
    var bogusCheckPtn = /<input checked="" disabled="" type="checkbox">/;
    var bogusUncheckPtn = /<input disabled="" type="checkbox">/;
    renderer.listitem = function (text) {
        var isCheckedTaskItem = checkedTaskItemPtn.test(text);
        var isUncheckedTaskItem = uncheckedTaskItemPtn.test(text);
        var hasBogusCheckedInput = bogusCheckPtn.test(text);
        var hasBogusUncheckedInput = bogusUncheckPtn.test(text);
        var isCheckbox = true;
        if (isCheckedTaskItem) {
            text = text.replace(checkedTaskItemPtn,
                '<i class="fa fa-check-square" aria-hidden="true"></i>') + '\n';
        } else if (isUncheckedTaskItem) {
            text = text.replace(uncheckedTaskItemPtn,
                '<i class="fa fa-square-o" aria-hidden="true"></i>') + '\n';
        } else if (hasBogusCheckedInput) {
            text = text.replace(bogusCheckPtn,
                '<i class="fa fa-check-square" aria-hidden="true"></i>') + '\n';
        } else if (hasBogusUncheckedInput) {
            text = text.replace(bogusUncheckPtn,
                '<i class="fa fa-square-o" aria-hidden="true"></i>') + '\n';
        } else {
            isCheckbox = false;
        }
        var cls = (isCheckbox) ? ' class="todo-list-item"' : '';
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

    var removeMermaidClickables = function ($el) {
        // find all links in the tree and do the following for each one
        $el.find('a').each(function (index, a) {
            var parent = a.parentElement;
            if (!parent) { return; }
            // iterate over the links' children and transform them into preceding children
            // to preserve their visible ordering
            slice(a.children).forEach(function (child) {
                parent.insertBefore(child, a);
            });
            // remove the link once it has been emptied
            $(a).remove();
        });
        // finally, find all 'clickable' items and remove the class
        $el.find('.clickable').removeClass('clickable');
    };
    var renderMermaid = function ($el) {
        Mermaid.init(undefined, $el);
        // clickable elements in mermaid don't work well with our sandboxing setup
        // the function below strips clickable elements but still leaves behind some artifacts
        // tippy tooltips might still be useful, so they're not removed. It would be
        // preferable to just support links, but this covers up a rough edge in the meantime
        removeMermaidClickables($el);
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

        var mermaid_source = [];
        var mermaid_cache = {};

        var canonicalizeMermaidSource = function (src) {
            // ignore changes to empty lines, since that won't affect
            // since it will have no effect on the rendered charts
            return src.replace(/\n[ \t]*\n*[ \t]*\n/g, '\n');
        };

        // iterate over the unrendered mermaid inputs, caching their source as you go
        $(newDomFixed).find('pre.mermaid').each(function (index, el) {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                var src = canonicalizeMermaidSource(el.childNodes[0].wholeText);
                el.setAttribute('mermaid-source', src);
                mermaid_source[index] = src;
            }
        });

        // remember the previous scroll position
        var $parent = $content.parent();
        var scrollTop = $parent.scrollTop();
        // iterate over rendered mermaid charts
        $content.find('pre.mermaid:not([processed="true"])').each(function (index, el) {
            // retrieve the attached source code which it was drawn
            var src = el.getAttribute('mermaid-source');

/*  The new source might have syntax errors that will prevent rendering.
    It might be preferable to keep the existing state instead of removing it
    if you don't have something better to display. Ideally we should display
    the cause of the syntax error so that the user knows what to correct.  */
            //if (!Mermaid.parse(src)) { } // TODO

            // check if that source exists in the set of charts which are about to be rendered
            if (mermaid_source.indexOf(src) === -1) {
                // if it's not, then you can remove it
                if (el.parentNode && el.parentNode.children.length) {
                    el.parentNode.removeChild(el);
                }
            } else if (el.childNodes.length === 1 && el.childNodes[0].nodeType !== 3) {
                // otherwise, confirm that the content of the rendered chart is not a text node
                // and keep a copy of it
                mermaid_cache[src] = el.childNodes[0];
            }
        });

        var oldDom = domFromHTML($content[0].outerHTML);

        var onPreview = function ($mt) {
            return function () {
                var isSvg = $mt.is('pre.mermaid');
                var mts = [];
                $content.find('media-tag, pre.mermaid').each(function (i, el) {
                    if (el.nodeName.toLowerCase() === "pre") {
                        var clone = el.cloneNode();
                        return void mts.push({
                            svg: clone,
                            render: function () {
                                var $el = $(clone);
                                $el.text(clone.getAttribute('mermaid-source'));
                                $el.attr('data-processed', '');
                                renderMermaid($el);
                            }
                        });
                    }
                    var $el = $(el);
                    mts.push({
                        src: $el.attr('src'),
                        key: $el.attr('data-crypto-key')
                    });
                });

                // Find initial position
                var idx = -1;
                mts.some(function (obj, i) {
                    if (isSvg && $mt.attr('mermaid-source') === $(obj.svg).attr('mermaid-source')) {
                        idx = i;
                        return true;
                    }
                    if (!isSvg && obj.src === $mt.attr('src')) {
                        idx = i;
                        return true;
                    }
                });
                if (idx === -1) {
                    if (isSvg) {
                        var clone = $mt[0].cloneNode();
                        mts.unshift({
                            svg: clone,
                            render: function () {
                                var $el = $(clone);
                                $el.text(clone.getAttribute('mermaid-source'));
                                $el.attr('data-processed', '');
                                renderMermaid($el);
                            }
                        });
                    } else {
                        mts.unshift({
                            src: $mt.attr('src'),
                            key: $mt.attr('data-crypto-key')
                        });
                    }
                    idx = 0;
                }

                setTimeout(function () {
                    common.getMediaTagPreview(mts, idx);
                });
            };
        };

        var patch = makeDiff(oldDom, Dom, id);
        if (typeof(patch) === 'string') {
            throw new Error(patch);
        } else {
            DD.apply($content[0], patch);
            var $mts = $content.find('media-tag');
            $mts.each(function (i, el) {
                var $mt = $(el).contextmenu(function (e) {
                    e.preventDefault();
                    $(contextMenu.menu).data('mediatag', $(el));
                    $(contextMenu.menu).find('li').show();
                    contextMenu.show(e);
                });
                if ($mt.children().length) {
                    $mt.off('click dblclick preview');
                    $mt.on('preview', onPreview($mt));
                    if ($mt.find('img').length) {
                        $mt.on('click dblclick', function () {
                            $mt.trigger('preview');
                        });
                    }
                    return;
                }
                MediaTag(el);
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                            var list_values = slice(mutation.target.children)
                                                .map(function (el) { return el.outerHTML; })
                                                .join('');
                            mediaMap[mutation.target.getAttribute('src')] = list_values;
                            observer.disconnect();
                        }
                    });
                    $mt.off('click dblclick preview');
                    $mt.on('preview', onPreview($mt));
                    if ($mt.find('img').length) {
                        $mt.on('click dblclick', function () {
                            $mt.trigger('preview');
                        });
                    }
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

            // loop over mermaid elements in the rendered content
            $content.find('pre.mermaid').each(function (index, el) {
                var $el = $(el);
                $el.off('contextmenu').on('contextmenu', function (e) {
                    e.preventDefault();
                    $(contextMenu.menu).data('mediatag', $el);
                    $(contextMenu.menu).find('li:not(.cp-svg)').hide();
                    contextMenu.show(e);
                });
                $el.off('dblclick click preview');
                $el.on('preview', onPreview($el));
                $el.on('dblclick click', function () {
                    $el.trigger('preview');
                });

                // since you've simply drawn the content that was supplied via markdown
                // you can assume that the index of your rendered charts matches that
                // of those in the markdown source. 
                var src = mermaid_source[index];
                el.setAttribute('mermaid-source', src);
                var cached = mermaid_cache[src];

                // check if you had cached a pre-rendered instance of the supplied source
                if (typeof(cached) !== 'object') {
                    try {
                        renderMermaid($el);
                    } catch (e) { console.error(e); }
                    return;
                }

                // if there's a cached rendering, empty out the contained source code
                // which would otherwise be drawn again.
                // apparently this is the fastest way to empty out an element
                while (el.firstChild) { el.removeChild(el.firstChild); } //el.innerHTML = '';
                // insert the cached graph
                el.appendChild(cached);
                // and set a flag indicating that this graph need not be reprocessed
                el.setAttribute('data-processed', true);
            });
        }
        // recover the previous scroll position to avoid jank
        $parent.scrollTop(scrollTop);
    };

    return DiffMd;
});

