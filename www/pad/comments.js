define([
    'jquery',
    'json.sortify',
    '/common/common-util.js',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js'
], function ($, Sortify, Util, h, UI, Messages) {
    var Comments = {};

/*
{
    authors: {
        "id": {
            name: "",
            curvePublic: "",
            avatar: "",
            profile: ""
        }
    },
    data: {
        "uid": {
            m: [{
                u: id,
                m: "str", // comment
                t: +new Date,
                v: "str" // value of the commented content
            }],
            (deleted: undefined/true,)
        }
    }
}
*/

    var COMMENTS = {
        authors: {},
        data: {}
    };

    var canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };

    // XXX function duplicated from www/code/markers.js
    var authorUid = function (existing) {
        if (!Array.isArray(existing)) { existing = []; }
        var n;
        var i = 0;
        while (!n || existing.indexOf(n) !== -1 && i++ < 1000) {
            n = Math.floor(Math.random() * 1000000);
        }
        // If we can't find a valid number in 1000 iterations, use 0...
        if (existing.indexOf(n) !== -1) { n = 0; }
        return n;
    };
    var getAuthorId = function (Env, curve) {
        var existing = Object.keys(Env.comments.authors || {}).map(Number);
        if (!Env.common.isLoggedIn()) { return authorUid(existing); }

        var uid;
        existing.some(function (id) {
            var author = Env.comments.authors[id] || {};
            if (author.curvePublic !== curve) { return; }
            uid = Number(id);
            return true;
        });
        return uid || authorUid(existing);
    };

    var updateAuthorData = function (Env) {
        var userData = Env.metadataMgr.getUserData();
        var myAuthorId = getAuthorId(Env, userData.curvePublic);
        var data = Env.comments.authors[myAuthorId] = Env.comments.authors[myAuthorId] || {};
        data.name = userData.name;
        data.avatar = userData.avatar;
        data.profile = userData.profile;
        data.curvePublic = userData.curvePublic;
        console.log(data);
        return myAuthorId;
    };

    var updateMetadata = function (Env) {
        var md = Util.clone(Env.metadataMgr.getMetadata());
        md.comments = Util.clone(Env.comments);
        Env.metadataMgr.updateMetadata(md);
    };

    Messages.comments_submit = "Submit"; // XXX
    Messages.comments_reply = "Reply"; // XXX
    Messages.comments_resolve = "Resolve"; // XXX

    var getCommentForm = function (Env, reply, _cb) {
        var cb = Util.once(_cb);
        var userData = Env.metadataMgr.getUserData();
        var name = Util.fixHTML(userData.name || Messages.anonymous);
        var avatar = h('span.cp-avatar');
        var textarea = h('textarea');
        Env.common.displayAvatar($(avatar), userData.avatar, name);

        var cancel = h('button.btn.btn-cancel', [
            h('i.fa.fa-times'),
            Messages.cancel
        ]);
        var submit = h('button.btn.btn-primary', [
            h('i.fa.fa-paper-plane-o'),
            Messages.comments_submit
        ]);

        var done = false;

        $(submit).click(function (e) {
            e.stopPropagation();
            cb(textarea.value);
        });
        $(cancel).click(function (e) {
            e.stopPropagation();
            cb();
        });

        $(textarea).keydown(function (e) {
            if (e.which === 27) {
                $(cancel).click();
            }
            if (e.which === 13 && !e.shiftKey) {
                $(submit).click();
                e.preventDefault();
            }
        });

        setTimeout(function () {
            $(textarea).focus();
        });

        return h('div.cp-comment-form' + (reply ? '.cp-comment-reply' : ''), {
            'data-uid': reply || undefined
        }, [
            h('div.cp-comment-form-input', [
                avatar,
                textarea
            ]),
            h('div.cp-comment-form-actions', [
                cancel,
                submit
            ])
        ]);
    };

    var redrawComments = function (Env) {
        // Don't redraw if there were no change
        var str = Sortify(Env.comments || {});
        if (str === Env.oldComments) { return; }
        Env.oldComments = str;

        var $oldInput = Env.$container.find('.cp-comment-form').detach();
        if ($oldInput.length !== 1) { $oldInput = undefined; }

        Env.$container.html('');

        var show = false;

        if ($oldInput && !$oldInput.attr('data-uid')) {
            show = true;
            Env.$container.append($oldInput);
        }

        var order = Env.$inner.find('comment').map(function (i, el) {
            return el.getAttribute('data-uid');
        }).toArray();
        var done = [];


        order.forEach(function (key) {
            // Avoir duplicates
            if (done.indexOf(key) !== -1) { return; }
            done.push(key);

            var obj = Env.comments.data[key];
            if (!obj || obj.deleted || !Array.isArray(obj.m) || !obj.m.length) {
                return;
            }
            show = true;

            var content = [];
            obj.m.forEach(function (msg, i) {
                var author = (Env.comments.authors || {})[msg.u] || {};
                var name = Util.fixHTML(author.name || Messages.anonymous);
                var date = new Date(msg.t);
                var avatar = h('span.cp-avatar');
                Env.common.displayAvatar($(avatar), author.avatar, name);

                content.push(h('div.cp-comment'+(i === 0 ? '' : '.cp-comment-reply'), [
                    h('div.cp-comment-header', [
                        avatar,
                        h('span.cp-comment-metadata', [
                            h('span.cp-comment-author', name),
                            h('span.cp-comment-time', date.toLocaleString())
                        ])
                    ]),
                    h('div.cp-comment-content', [
                        msg.m
                    ])
                ]));

            });

            var reply = h('button.btn.btn-secondary', [
                h('i.fa.fa-reply'),
                Messages.comments_reply
            ]);
            var resolve = h('button.btn.btn-primary', [
                h('i.fa.fa-check'),
                Messages.comments_resolve
            ]);

            var actions;
            content.push(actions = h('div.cp-comment-actions', [
                reply,
                resolve
            ]));
            var $actions = $(actions);

            var div;
            Env.$container.append(div = h('div.cp-comment-container', {
                'data-uid': key,
                tabindex: 1
            }, content));
            var $div = $(div);

            $(reply).click(function (e) {
                e.stopPropagation();
                $actions.hide();
                var form = getCommentForm(Env, key, function (val) {
                    $(form).remove();
                    $(form).closest('.cp-comment-container')
                        .find('.cp-comment-actions').css('display', '');

                    if (!val) { return; }
                    var obj = Env.comments.data[key];
                    if (!obj || !Array.isArray(obj.m)) { return; }

                    // Get the value of the commented text
                    var res = Env.$inner.find('comment[data-uid="'+key+'"]').toArray();
                    var value = res.map(function (el) {
                        return el.innerText;
                    }).join('\n');

                    // Push the reply
                    var myId = updateAuthorData(Env);
                    obj.m.push({
                        u: myId,
                        t: +new Date(),
                        m: val,
                        v: value
                    });

                    // Send to chainpad
                    updateMetadata(Env);
                    Env.framework.localChange();
                });
                $div.append(form);
            });

            UI.confirmButton(resolve, {
                classes: 'btn-danger-alt'
            }, function () {
                // Delete the comment
                delete Env.comments.data[key];
                var els = Env.$inner.find('comment[data-uid="'+key+'"]').toArray();
                Env.editor.plugins.comments.uncomment(key, els);

                // Send to chainpad
                updateMetadata(Env);
                Env.framework.localChange();
            });

            var focusContent = function () {
                Env.$inner.find('comment[data-uid="'+key+'"]').focus();
            };

            $div.click(function () {
                if ($div.hasClass('cp-comment-active')) { return; }
                Env.$container.find('.cp-comment-active').removeClass('cp-comment-active');
                $div.addClass('cp-comment-active');
                div.scrollIntoView();
                $actions.css('display', '');
                Env.$container.find('.cp-comment-form').remove();

                focusContent();
            });

            if ($oldInput && $oldInput.attr('data-uid') === key) {
                $div.addClass('cp-comment-active');
                $actions.hide();
                $div.append($oldInput);
                $oldInput.find('textarea').focus();
                focusContent();
            }
        });

        if (show) {
            Env.$container.show();
        } else {
            Env.$container.hide();
        }
    };

    var onChange = function (Env) {
        var md = Util.clone(Env.metadataMgr.getMetadata());
        Env.comments = md.comments;
        var changed = false;
        if (!Env.comments || !Env.comments.data) {
            changed = true;
            Env.comments = Util.clone(COMMENTS);
        }
        if (Env.ready === 0) {
            Env.ready = true;
            if (changed) {
                updateMetadata(Env);
                Env.framework.localChange();
            }
        }
        redrawComments(Env);
    };

    // Check if comments have been deleted from the document but not from metadata
    var checkDeleted = function (Env) {
        if (!Env.comments || !Env.comments.data) { return; }

        // Don't recheck if there were no change
        var str = Env.$inner[0].innerHTML;
        if (str === Env.oldCheck) { return; }
        Env.oldCheck = str;

        // If there is no comment stored in the metadata, abort
        var comments = Object.keys(Env.comments.data || {}).filter(function (id) {
            return !Env.comments.data[id].deleted;
        });

        var changed = false;

        // Get the comments from the document
        var uids = Env.$inner.find('comment').map(function (i, el) {
            var id = el.getAttribute('data-uid');
            // Empty comment: remove from dom
            if (!el.innerText && el.parentElement) {
                el.parentElement.removeChild(el);
                changed = true;
                return;
            }
            // Comment not in the metadata: uncomment (probably an undo)
            if (comments.indexOf(id) === -1) {
                Env.editor.plugins.comments.uncomment(id, [el]);
                changed = true;
                return;
            }
            return id;
        }).toArray();

        // Check if a comment has been deleted
        comments.forEach(function (uid) {
            if (uids.indexOf(uid) !== -1) { return; }
            // comment has been deleted
            var data = Env.comments.data[uid];
            if (!data) { return; }
            //data.deleted = true;
            delete Env.comments.data[uid];
            changed = true;
        });

        if (changed) {
            updateMetadata(Env);
        }
    };

    var addAddCommentHandler = function (Env) {
        Env.editor.plugins.comments.addComment = function (uid, addMark) {
            if (!Env.comments) { Env.comments = Util.clone(COMMENTS); }

            // Get all comments ID contained within the selection
            var sel = Env.editor.getSelectedHtml().$.querySelectorAll('comment');
            if (sel.length) {
                // Abort if our selection contains a comment
                console.error("Your selection contains a comment");
                UI.warn(Messages.error);
                // XXX show error
                return;
            }

/*
sel.forEach(function (el) {
    // For each comment ID, check if the comment will be deleted
    // if we add a comment on our selection
    var id = el.getAttribute('data-uid');

    // Get all nodes for this comment
    var all = Env.$inner.find('comment[data-uid="'+id+'"]');
    // Get our selection
    var sel = Env.ifrWindow.getSelection();
    if (!sel.containsNode) {
        // IE doesn't support this method, always allow comments for them...
        sel.containsNode = function () { return false; };
    }

    var notDeleted = all.some(function (i, el) {
        // If this node is completely outside of the selection, continue
        if (!sel.containsNode(el, true)) { return true; }
    });

    // only continue if notDeleted is true (at least one node for
    // this comment won't be deleted)
});
*/
            Env.$container.find('.cp-comment-form').remove();
            var form = getCommentForm(Env, false, function (val) {
                $(form).remove();
                Env.$inner.focus();

                if (!val) { return; }
                if (!editor.getSelection().getSelectedText()) {
                    // text has been deleted by another user while we were typing our comment?
                    return void UI.warn(Messages.error);
                }
                // Don't override existing data
                if (Env.comments.data[uid]) { return; }

                var myId = updateAuthorData(Env);
                Env.comments.data[uid] = {
                    m: [{
                        u: myId,
                        t: +new Date(),
                        m: val,
                        v: canonicalize(editor.getSelection().getSelectedText())
                    }]
                };
                updateMetadata(Env);

                addMark();

                Env.framework.localChange();
            });
            Env.$container.prepend(form).show();;
        };
    };

    var onContentUpdate = function (Env) {
        if (!Env.ready) { return; }
        // Check deleted
        onChange(Env);
        checkDeleted(Env);
    };
    var localChange = function (Env) {
        if (!Env.ready) { return; }
        // Check deleted
        checkDeleted(Env);
    };

    var ready = function (Env) {
        Env.ready = 0;
    };

    Comments.create = function (cfg) {
        var Env = cfg;
        Env.comments = Util.clone(COMMENTS);

        addAddCommentHandler(Env);

        $(window).click(function (e) {
            if ($(e.target).closest('.cp-comment-container').length) {
                return;
            }
            Env.$container.find('.cp-comment-active').removeClass('cp-comment-active');
        });
        Env.$inner.on('click', 'comment', function (e) {
            var $comment = $(e.target);
            var uid = $comment.attr('data-uid');
            if (!uid) { return; }
            Env.$container.find('.cp-comment-container[data-uid="'+uid+'"]').click();
        });

        var call = function (f) {
            return function () {
                try {
                    [].unshift.call(arguments, Env);
                    return f.apply(null, arguments);
                } catch (e) {
                    console.error(e);
                }
            };
        };

        Env.metadataMgr.onChange(call(onChange));

        return {
            onContentUpdate: call(onContentUpdate),
            localChange: call(localChange),
            ready: call(ready)
        };
    };

    return Comments;
});
