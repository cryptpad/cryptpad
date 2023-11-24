// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/api/config',
    '/components/marked/marked.min.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/hyperscript.js',
    '/common/inner/common-mediatag.js',
    '/common/media-tag.js',
    '/customize/messages.js',
    '/lib/less.min.js',
    '/customize/pages.js',

    '/lib/highlight/highlight.pack.js',
    '/lib/diff-dom/diffDOM.js',
    '/components/tweetnacl/nacl-fast.min.js',
    'css!/lib/highlight/styles/'+ (window.CryptPad_theme === 'dark' ? 'dark.css' : 'github.css')
],function ($, ApiConfig, Marked, Hash, Util, h, MT, MediaTag, Messages, Less, Pages) {
    var DiffMd = {};

    var Highlight = window.hljs;
    var DiffDOM = window.diffDOM;
    var renderer = new Marked.Renderer();
    var restrictedRenderer = new Marked.Renderer();

    var pluginLoaded = Util.mkEvent();
    DiffMd.onPluginLoaded = pluginLoaded.reg;

    var mermaidThemeCSS = //".node rect { fill: #DDD; stroke: #AAA; } " +
        "rect.task, rect.task0, rect.task2 { stroke-width: 1 !important; rx: 0 !important; } " +
        "g.grid g.tick line { opacity: 0.25; }" +
        "g.today line { stroke: red; stroke-width: 1; stroke-dasharray: 3; opacity: 0.5; }";

    var onMermaidRunEvt = Util.mkEvent(true);
    var onMermaidRun = () => {
        onMermaidRunEvt.fire();
        onMermaidRunEvt = Util.mkEvent(true);
    };
    var Mermaid = {
        __stubbed: true,
        run: function (cb) {
            onMermaidRunEvt.reg(cb);
            require([
                'mermaid',
                '/lib/mermaid/mermaid-zenuml.esm.min.js',
            ], function (_Mermaid, zenuml) {
                console.debug("loaded mermaid");
                if (Mermaid.__stubbed) {
                    Mermaid = _Mermaid;
                    Mermaid.initialize({
                        gantt: { axisFormat: '%m-%d', },
                        flowchart: { htmlLabels: false, },
                        theme: (window.CryptPad_theme === 'dark') ? 'dark' : 'default',
                        "themeCSS": mermaidThemeCSS,
                    });
                    onMermaidRun();

                    var run = Mermaid.run;
                    var to;
                    Mermaid.run = (cb) => {
                        clearTimeout(to);
                        onMermaidRunEvt.reg(cb);
                        to = setTimeout(() => {
                            onMermaidRun();
                            run();
                        });
                    };
                }

                Mermaid.registerExternalDiagrams([zenuml]).then(() => pluginLoaded.fire());
            });
        }
    };

    var Mathjax = {
        __stubbed: true,
        tex2svg: function (a, b) {
            require([
                '/components/mathjax/es5/tex-svg.js',
            ], function () {
                console.debug("Loaded mathjax");
                if (Mathjax.__stubbed) {
                    Mathjax = window.MathJax;
                }
                Mathjax.tex2svg(a, b);
                pluginLoaded.fire();
            });
        }
    };

    var drawMarkmap;
    var MarkMapTransform;
    var Markmap;

    var markmapLoaded = false;
    var loadMarkmap = function ($el) {
        require([
            '/lib/markmap/transform.min.js',
            '/lib/markmap/view.min.js',
        ], function (_Transform, _View) {
            if (!markmapLoaded) {
                console.debug("Loaded markmap");
                MarkMapTransform = _Transform;
                Markmap = _View;
                markmapLoaded = true;
            }
            drawMarkmap($el);
            pluginLoaded.fire();
        });
    };

    var sfCommon;
    var fixMarkmapClickables = function ($svg) {
        // find all links in the tree and do the following for each one
        var onClick = function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            var $el = $(e.target);
            // Open links only from the preview modal
            if (!sfCommon) { return void console.error('No sfCommon'); }

            var href = $el.attr('href');
            if (!href || !/^(https?:\/\/|\/)/.test(href)) { return; }

            if (/^http/.test(href)) {
                sfCommon.openUnsafeURL(href);
                return;
            }
            sfCommon.openURL(href);
        };
        $svg.find('a').click(onClick);
        // make sure the links added later by collapsing/expading the map are also safe
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    var n;
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        n = mutation.addedNodes[i];
                        if (n.nodeName === "A") { return void n.addEventListener('click', onClick); }
                        $(n).find('a').click(onClick);
                    }
                }
            });
        });
        observer.observe($svg[0], {
            childList: true,
            subtree: true
        });
    };

    drawMarkmap = function ($el) {
        if (!markmapLoaded) { return void loadMarkmap($el); }
        if (!$el) { return console.error("no element provided"); }
        var data = MarkMapTransform.transform($el[0].getAttribute("markmap-source"));
        $el[0].innerHTML = "<svg width='100%' height='600'/>";
        Markmap.markmap($el[0].firstChild, data);
        fixMarkmapClickables($el);
    };

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

    var noHeadingId = false;
    DiffMd.render = function (md, sanitize, restrictedMd, noId) {
        Marked.setOptions({
            renderer: restrictedMd ? restrictedRenderer : renderer,
        });
        noHeadingId = noId;
        var r = Marked.parse(md, {
            sanitize: sanitize,
            headerIds: !noId,
            gfm: true,
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
        if (!code || typeof(code) !== 'string' || !code.trim()) { return defaultCode.apply(renderer, arguments); }
        if (language === 'mermaid' && code.match(/^(flowchart|graph|pie|gantt|sequenceDiagram|classDiagram|gitGraph|stateDiagram|erDiagram|journey|requirementDiagram|GitGraph|mindmap|timeline|zenuml|quadrantChart|C4Context)/)) {
            return '<pre class="mermaid" data-plugin="mermaid">'+Util.fixHTML(code)+'</pre>';
        } else if (language === 'markmap') {
            return '<pre class="markmap" data-plugin="markmap">'+Util.fixHTML(code)+'</pre>';
        } else if (language === 'mathjax') {
            return '<pre class="mathjax" data-plugin="mathjax">'+Util.fixHTML(code)+'</pre>';
        } else {
            return defaultCode.apply(renderer, arguments);
        }
    };
    restrictedRenderer.code = renderer.code;

    var _heading = renderer.heading;
    renderer.heading = function (text, level) {
        if (noHeadingId) {
            return _heading.apply(this, arguments);
        }
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


    var qualifiedHref = function (href) {
        if (typeof(window.URL) === 'undefined') { return href; }
        try {
            var url = new URL(href, ApiConfig.httpUnsafeOrigin);
            return url.href;
        } catch (err) {
            console.error(err);
            return href;
        }
    };

    var isLocalURL = function (href) {
        // treat all URLs as remote if you are using an ancient browser
        if (typeof(window.URL) === 'undefined') { return false; }
        try {
            var url = new URL(href, ApiConfig.httpUnsafeOrigin);
            // FIXME data URLs can be quite large, but that should be addressed
            // in the source markdown's, not the renderer
            if (url.protocol === 'data:') { return true; }
            var localURL = new URL(ApiConfig.httpUnsafeOrigin);
            return url.host === localURL.host;
        } catch (err) {
            return true;
        }
    };

    renderer.image = function (href, title, text) {
        if (isLocalURL(href) && href.slice(0, 6) !== '/file/') {
            return h('img', {
                src: href,
                title: title || '',
                alt: text,
            }).outerHTML;
        }

        if (href.slice(0,6) === '/file/') {
            // Mediatag using markdown syntax should not be used anymore so they don't support
            // password-protected files
            console.log('DEPRECATED: mediatag using markdown syntax!');
            var parsed = Hash.parsePadUrl(href);
            var secret = Hash.getSecrets('file', parsed.hash);
            var src = (ApiConfig.fileHost || '') +Hash.getBlobPathFromHex(secret.channel);
            var key = Hash.encodeBase64(secret.keys.cryptKey);
            var mt = h('media-tag', {
                src: src,
                'data-crypto-key': 'cryptpad:' + key,
            });
            return mt.outerHTML;
        }

        var warning = h('div.cp-inline-img-warning', [
            h('div.cp-inline-img', [
                h('img.cp-inline-img', {
                    src: '/images/broken.png',
                    //title: title || '', // FIXME sort out tippy issues (double-title)
                }),
                h('p.cp-alt-txt', text),
            ]),
            h('span.cp-img-block-notice', {
            }, Messages.resources_imageBlocked),
            h('br'),
            h('a.cp-remote-img', {
                href: qualifiedHref(href),
            }, [
                Messages.resources_openInNewTab
            ]),
            h('br'),
            h('a.cp-learn-more', {
                href: Pages.localizeDocsLink('https://docs.cryptpad.org/en/user_guide/security.html#remote-content'),
            }, [
                Messages.resources_learnWhy
            ]),
        ]);

        return warning.outerHTML;
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

    // Note: iframe, video and audio are used in mediatags and are allowed in rich text pads.
    var forbiddenTags = [
        'SCRIPT',
        //'IFRAME',
        'OBJECT',
        'APPLET',
        //'VIDEO', // privacy implications of videos are the same as images
        //'AUDIO', // same with audio
        'SOURCE'
    ];
    var restrictedTags = [
        'IFRAME',
        'VIDEO',
        'AUDIO'
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
        console.debug('removing %s tag', node.nodeName);
        parent.removeChild(node);
    };

    // Only allow iframe, video and audio with local source
    var checkSrc = function (root) {
        if (restrictedTags.indexOf(root.nodeName.toUpperCase()) === -1) { return true; }
        return root.getAttribute && /^(blob\:|\/lib\/pdfjs)/.test(root.getAttribute('src'));
    };

    var removeForbiddenTags = function (root) {
        if (!root) { return; }
        if (forbiddenTags.indexOf(root.nodeName.toUpperCase()) !== -1) { removeNode(root); }
        if (!checkSrc(root)) { removeNode(root); }
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

    var plugins = {};

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

    plugins.mermaid = {
        name: 'mermaid',
        attr: 'mermaid-source',
        render: function ($el) {
            Mermaid.run(() => {
                // clickable elements in mermaid don't work well with our sandboxing setup
                // the function below strips clickable elements but still leaves behind some artifacts
                // tippy tooltips might still be useful, so they're not removed. It would be
                // preferable to just support links, but this covers up a rough edge in the meantime
                removeMermaidClickables($el);
            });
        }
    };

    plugins.markmap = {
        name: 'markmap',
        attr: 'markmap-source',
        render:  function ($el) {
            drawMarkmap($el);
        }
    };

    plugins.mathjax = {
        name: 'mathjax',
        attr: 'mathjax-source',
        render: function renderMathjax ($el) {
            var el = $el[0];
            if (!el) { return; }
            var code = el.getAttribute("mathjax-source");
            var svg = Mathjax.tex2svg(code, {display: true});
            if (!svg) { return; }
            svg.innerHTML = svg.innerHTML.replace(/xlink:href/g, "href");
            var wrapper = document.createElement('span');
            wrapper.innerHTML = svg.innerHTML;
            el.innerHTML = wrapper.outerHTML;
        }
    };

    var applyCSS = function (el, css) {
        var style = h('style');
        style.appendChild(document.createTextNode(css));
        el.innerText = '';
        el.appendChild(style);
    };

    // trim non-functional text from less input so that
    // the compiler is only triggered when there has been a functional change
    var canonicalizeLess = function (source) {
        return (source || '')
        // leading and trailing spaces are irrelevant
            .trim()
        // line comments are easy to disregard
            .replace(/\/\/[^\n]*/g, '')
        // lines with nothing but spaces and tabs can be ignored
            .replace(/^[ \t]*$/g, '')
        // consecutive newlines make no difference
            .replace(/\n+/g, '');
    };

    var rendered_less = {};
    var getRenderedLess = (function () {
        var timeouts = {};
        return function (src) {
            if (!rendered_less[src]) { return; }
            if (timeouts[src]) {
                clearTimeout(timeouts[src]);
            }
            // avoid memory leaks by deleting cached content
            // 15s after it was last accessed
            timeouts[src] = setTimeout(function () {
                delete rendered_less[src];
                delete timeouts[src];
            }, 15000);
            return rendered_less[src];
        };
    }());

    plugins.less = {
        name: 'less',
        attr: 'less-src',
        render: function renderLess ($el, opt) {
            var src = canonicalizeLess($el.text());
            if (!src) { return; }
            var el = $el[0];
            var rendered = getRenderedLess(src);
            if (rendered) { return void applyCSS(el, rendered); }

            var scope = opt.scope.attr('id') || 'cp-app-code-preview-content';
            var scoped_src = '#' + scope + ' { ' + src + '}';
            //console.error("RENDERING LESS");
            Less.render(scoped_src, {}, function (err, result) {
        // the console is the only feedback for users to know that they did something wrong
        // but less rendering isn't intended so much as a feature but a useful tool to avoid
        // leaking styles from the preview into the rest of the DOM. This is an improvement.
                if (err) {
        // we assume the compiler is deterministic. Something that returns an error once
        // will do it again, so avoid successive calls by caching a truthy
        // but non-functional string to block them.
                    rendered_less[src] = ' ';
                    return void console.error(err);
                }
                var css = rendered_less[src] = result.css;
                applyCSS(el, css);
            });
        },
    };

    var getAvailableCachedElement = function ($content, cache, src) {
        var cached = cache[src];
        if (!Array.isArray(cached)) { return; }
        var root = $content[0];
        var l = cached.length;
        for (var i = 0; i < l; i++) {
            if (!root.contains(cached[i])) {
                return cached[i];
            }
        }
    };

    var cacheRenderedElement = function (cache, src, el) {
        if (Array.isArray(cache[src])) {
            cache[src].push(el);
        } else {
            cache[src] = [ el ];
        }
    };

    // remove elements from the cache that are not embedded in the dom
    var clearUnusedCacheEntries = function ($content, plugins) {
        var root = $content[0];
        Object.keys(plugins).forEach(function (name) {
            var plugin = plugins[name];
            var cache = plugin.cache;
            Object.keys(cache).forEach(function (key) {
                var list = cache[key];
                if (!Array.isArray(list)) { return; }
                cache[key] = list.filter(function (el) {
                    return root.contains(el);
                });
            });
        });
    };

    DiffMd.apply = function (newHtml, $content, common) {
        if (!sfCommon) { sfCommon = common; }

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

        Object.keys(plugins).forEach(function (id) {
            plugins[id].source = [];
            plugins[id].cache = {};
        });

        var canonicalizeMermaidSource = function (src) {
            // ignore changes to empty lines, since that won't affect
            // since it will have no effect on the rendered charts
            return src.replace(/\n[ \t]*\n*[ \t]*\n/g, '\n');
        };

        // iterate over the unrendered mermaid and markmap inputs,
        // caching their source as you go
        $(newDomFixed).find('pre[data-plugin]').each(function (index, el) {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                var type = el.getAttribute('data-plugin');
                var plugin = plugins[type];
                if (!plugin) { return; }
                var src = canonicalizeMermaidSource(el.childNodes[0].wholeText);
                el.setAttribute(plugin.attr, src);
                plugin.source[index] = src;
            }
        });

        // remember the previous scroll position
        var $parent = $content.parent();
        var scrollTop = $parent.scrollTop();
        // iterate over rendered mermaid charts
        $content.find('pre[data-plugin]:not([processed="true"])').each(function (index, el) {
            var type = el.getAttribute('data-plugin');
            var plugin = plugins[type];
            if (!plugin) { return; }

            // retrieve the attached source code which it was drawn
            var src = el.getAttribute(plugin.attr);

/*  The new source might have syntax errors that will prevent rendering.
    It might be preferable to keep the existing state instead of removing it
    if you don't have something better to display. Ideally we should display
    the cause of the syntax error so that the user knows what to correct.  */
            //if (plugin.name === "mermaid" && !Mermaid.parse(src)) { } // TODO

            // check if that source exists in the set of charts which are about to be rendered
            if (plugin.source.indexOf(src) === -1) {
                // if it's not, then you can remove it
                if (el.parentNode && el.parentNode.children.length) {
                    el.parentNode.removeChild(el);
                }
            } else if (el.childNodes.length === 1 && el.childNodes[0].nodeType !== 3) {
                // otherwise, confirm that the content of the rendered chart is not a text node
                // and keep a copy of it
                cacheRenderedElement(plugin.cache, src, el.childNodes[0]);
            }
        });

        var oldDom = domFromHTML($content[0].outerHTML);

        var MutationObserver = window.MutationObserver;
        var onPreview = function ($mt) {
            return function () {
                if (window.event.ctrlKey) { return; }
                var mts = [];
                // Get all previewable elements from the doc
                $content.find('media-tag, pre[data-plugin]').each(function (i, el) {
                    if (el.nodeName.toLowerCase() === "pre") {
                        var clone = el.cloneNode();
                        var plugin = plugins[el.getAttribute('data-plugin')];
                        if (!plugin) { return; }

                        return void mts.push({
                            svg: clone,
                            render: function () {
                                var $el = $(clone);
                                $el.text(clone.getAttribute(plugin.attr));
                                $el.attr('data-processed', '');
                                plugin.render($el);
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

                // If the element is supported by one of our plugin types
                // (mermaid, mathjax, or markmap) get the corresponding attribute
                var isSvg = $mt.is('pre[data-plugin]');
                var plugin = isSvg && plugins[$mt.attr('data-plugin')];

                // Get initial idx
                var idx = -1;
                mts.some(function (obj, i) {
                    if (isSvg && $mt.attr(plugin.attr) === $(obj.svg).attr(plugin.attr)) {
                        idx = i;
                        return true;
                    }
                    if (!isSvg && obj.src === $mt.attr('src')) {
                        idx = i;
                        return true;
                    }
                });
                // Not found, re-render
                if (idx === -1) {
                    if (isSvg && $mt.attr(plugin.attr)) {
                        var clone = $mt[0].cloneNode();
                        mts.unshift({
                            svg: clone,
                            render: function () {
                                var $el = $(clone);
                                $el.text(clone.getAttribute(plugin.attr));
                                $el.attr('data-processed', '');
                                plugin.render($el);
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
            try {
                DD.apply($content[0], patch);
            } catch (err) {
                console.error(err);
            }
            var $mts = $content.find('media-tag');
            $mts.each(function (i, el) {
                var $mt = $(el).contextmenu(function (e) {
                    e.preventDefault();
                    $(contextMenu.menu).data('mediatag', $(el));
                    $(contextMenu.menu).find('li').show();
                    contextMenu.show(e);
                });
                if ($mt.children().length && $mt[0]._mediaObject) {
                    $mt.off('click dblclick preview');
                    $mt.on('preview', onPreview($mt));
                    if ($mt.find('img').length) {
                        $mt.on('click dblclick', function () {
                            $mt.trigger('preview');
                        });
                    }
                    return;
                }
                var mediaObject = MediaTag(el);
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                            var list_values = slice(el.children)
                                                .map(function (el) { return el.outerHTML; })
                                                .join('');
                            mediaMap[el.getAttribute('src')] = list_values;
                            if (mediaObject.complete) { observer.disconnect(); }
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
                    subtree: true,
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

            // replace remote images with links to those images
            $content.find('div.cp-inline-img-warning').each(function (index, el) {
                if (!el) { return; }
                var link = el.querySelector('a.cp-remote-img');
                if (!link) { return; }
                link.onclick = function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    common.openURL(link.href);
                };
            });

            // transform style tags into pre tags with the same content
            // to be handled by the less rendering plugin
            $content.find('style').each(function (index, el) {
                var parent = el.parentElement;
                var pre = h('pre', {
                    'data-plugin': 'less',
                    'less-src': canonicalizeLess(el.innerText),
                    style: 'display: none',
                }, el.innerText);
                parent.replaceChild(pre, el);
            });

            // loop over plugin elements in the rendered content
            $content.find('pre[data-plugin]').each(function (index, el) {
                var type = el.getAttribute('data-plugin');
                var plugin = plugins[type];

                if (!plugin) { return; }
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
                var src = plugin.source[index];
                if (src) {
                    el.setAttribute(plugin.attr, src);
                }
                var cached = getAvailableCachedElement($content, plugin.cache, src);

                // check if you had cached a pre-rendered instance of the supplied source
                if (typeof(cached) !== 'object') {
                    try {
                        plugin.render($el, {
                            scope: $content,
                        });
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
        clearUnusedCacheEntries($content, plugins);

        // recover the previous scroll position to avoid jank
        $parent.scrollTop(scrollTop);
    };

    return DiffMd;
});

