define([
    'jquery',
    'json.sortify',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js'
], function ($, Sortify, Util, Hash, h, UI, Messages) {
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

    // Return the author ID  and add/update the data for registered users
    // Return the username for unregistered users
    var updateAuthorData = function (Env, onChange) {
        var userData = Env.metadataMgr.getUserData();
        if (!Env.common.isLoggedIn()) {
            return userData.name;
        }
        var myAuthorId = getAuthorId(Env, userData.curvePublic);
        var data = Env.comments.authors[myAuthorId] = Env.comments.authors[myAuthorId] || {};
        var old = Sortify(data);
        data.name = userData.name;
        data.avatar = userData.avatar;
        data.profile = userData.profile;
        data.curvePublic = userData.curvePublic;
        data.notifications = userData.notifications;
        if (typeof(onChange) === "function" && Sortify(data) !== old) {
            onChange();
        }
        return myAuthorId;
    };

    var updateMetadata = function (Env) {
        var md = Util.clone(Env.metadataMgr.getMetadata());
        md.comments = Util.clone(Env.comments);
        Env.metadataMgr.updateMetadata(md);
    };

    var sendReplyNotification = function (Env, uid) {
        if (!Env.comments || !Env.comments.data || !Env.comments.authors) { return; }
        if (!Env.common.isLoggedIn()) { return; }
        var thread = Env.comments.data[uid];
        if (!thread || !Array.isArray(thread.m)) { return; }
        var userData = Env.metadataMgr.getUserData();
        var privateData = Env.metadataMgr.getPrivateData();
        var others = {};
        // Get all the other registered users with a mailbox
        thread.m.forEach(function (obj) {
            var u = obj.u;
            if (typeof(u) !== "number") { return; }
            var author = Env.comments.authors[u];
            if (!author || others[u] || !author.notifications || !author.curvePublic) { return; }
            if (author.curvePublic === userData.curvePublic) { return; } // don't send to yourself
            others[u] = {
                curvePublic: author.curvePublic,
                comment: obj.m,
                content: obj.v,
                notifications: author.notifications
            };
        });
        // Send the notification
        Object.keys(others).forEach(function (id) {
            var data = others[id];
            Env.common.mailbox.sendTo("COMMENT_REPLY", {
                channel: privateData.channel,
                comment: data.comment,
                content: data.content
            }, {
                channel: data.notifications,
                curvePublic: data.curvePublic
            });
        });

    };

    Messages.comments_submit = "Submit"; // XXX
    Messages.comments_reply = "Reply"; // XXX
    Messages.comments_resolve = "Resolve"; // XXX

    var getCommentForm = function (Env, reply, _cb) {
        var cb = Util.once(_cb);
        var userData = Env.metadataMgr.getUserData();
        var name = Util.fixHTML(userData.name || Messages.anonymous);
        var avatar = h('span.cp-avatar');
        var textarea = h('textarea', {
            tabindex: 1
        });
        Env.common.displayAvatar($(avatar), userData.avatar, name);

        var cancel = h('button.btn.btn-cancel', {
            tabindex: 1
        }, [
            h('i.fa.fa-times'),
            Messages.cancel
        ]);
        var submit = h('button.btn.btn-primary', {
            tabindex: 1
        }, [
            h('i.fa.fa-paper-plane-o'),
            Messages.comments_submit
        ]);

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
                var author = typeof(msg.u) === "number" ?
                                ((Env.comments.authors || {})[msg.u] || {}) :
                                { name: msg.u };
                var name = Util.fixHTML(author.name || Messages.anonymous);
                var date = new Date(msg.t);
                var avatar = h('span.cp-avatar');
                Env.common.displayAvatar($(avatar), author.avatar, name);
                if (author.profile) {
                    $(avatar).click(function (e) {
                        Env.common.openURL(Hash.hashToHref(author.profile, 'profile'));
                        e.stopPropagation();
                    });
                }

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

            var reply = h('button.btn.btn-secondary', {
                tabindex: 1
            }, [
                h('i.fa.fa-reply'),
                Messages.comments_reply
            ]);
            var resolve = h('button.btn.btn-primary', {
                tabindex: 1
            }, [
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
                    var user = updateAuthorData(Env);
                    obj.m.push({
                        u: user, // id (number) or name (string)
                        t: +new Date(),
                        m: val,
                        v: value
                    });

                    // Notify other users
                    sendReplyNotification(Env, key);

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

                // Send to chainpad
                updateMetadata(Env);
                Env.framework.localChange();
            });

            var focusContent = function () {
                // Add class "active"
                Env.$inner.find('comment.active').removeClass('active');
                Env.$inner.find('comment[data-uid="'+key+'"]').addClass('active');
                var $last = Env.$inner.find('comment[data-uid="'+key+'"]').last();

                // Scroll into view
                if (!$last.length) { return; }
                var size = Env.$inner.outerHeight();
                var pos = $last[0].getBoundingClientRect();
                var visible = (pos.y + pos.height) < size;
                if (!visible) { $last[0].scrollIntoView(); }
            };

            $div.on('click focus', function () {
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
            updateAuthorData(Env, function () {
                changed = true;
            });
            // On ready, if our user data have changed or if we've added the initial structure
            // of the comments, push the changes
            if (changed) {
                updateMetadata(Env);
                Env.framework.localChange();
            }
        } else if (Env.ready) {
            // Everytime there is a metadata change, check if our user data have changed
            // and puhs the update sif necessary
            updateAuthorData(Env, function () {
                updateMetadata(Env);
                Env.framework.localChange();
            });
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
        var toUncomment = {};
        var uids = Env.$inner.find('comment').map(function (i, el) {
            var id = el.getAttribute('data-uid');
            // Empty comment: remove from dom
            if (!el.innerHTML && el.parentElement) {
                el.parentElement.removeChild(el);
                changed = true;
                return;
            }
            // Comment not in the metadata: uncomment (probably an undo)
            var obj = Env.comments.data[id];
            if (!obj) {
                toUncomment[id] = toUncomment[id] || [];
                toUncomment[id].push(el);
                changed = true;
                return;
            }
            // If this comment was deleted, we're probably using "undo" to restore it:
            // remove the "deleted" state and continue
            if (obj.deleted) {
                delete obj.deleted;
                changed = true;
            }
            return id;
        }).toArray();

        if (Object.keys(toUncomment).length) {
            Object.keys(toUncomment).forEach(function (id) {
                Env.editor.plugins.comments.uncomment(id, toUncomment[id]);
            });
        }

        // Check if a comment has been deleted
        comments.forEach(function (uid) {
            if (uids.indexOf(uid) !== -1) { return; }
            // comment has been deleted
            var data = Env.comments.data[uid];
            if (!data) { return; }
            data.deleted = true;
            //delete Env.comments.data[uid];
            changed = true;
        });

        if (changed) {
            updateMetadata(Env);
        }
    };

    var removeCommentBubble = function (Env) {
        Env.bubble = undefined;
        Env.$contentContainer.find('.cp-comment-bubble').remove();
    };
    var updateBubble = function (Env) {
        if (!Env.bubble) { return; }
        var pos = Env.bubble.node.getBoundingClientRect();
        if (pos.y < 0 || pos.y > Env.$inner.outerHeight()) {
            //removeCommentBubble(Env);
        }
        Env.bubble.button.setAttribute('style', 'top:'+pos.y+'px');
    };
    var addCommentBubble = function (Env) {
        var ranges = Env.editor.getSelectedRanges();
        if (!ranges.length) { return; }
        var el = ranges[0].endContainer || ranges[0].startContainer;
        var node = el && el.$;
        if (!node) { return; }
        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
            if (!node) { return; }
        }
        var pos = node.getBoundingClientRect();
        var y = pos.y;
        if (y < 0 || y > Env.$inner.outerHeight()) { return; }
        var button = h('button.btn.btn-secondary', {
            style: 'top:'+y+'px;',
            title: Messages.comments_comment
        },h('i.fa.fa-comment'));
        Env.bubble = {
            node: node,
            button: button
        };
        $(button).click(function () {
            Env.editor.execCommand('comment');
            Env.bubble = undefined;
        });
        Env.$contentContainer.append(h('div.cp-comment-bubble', button));
    };

    var addAddCommentHandler = function (Env) {
        Env.editor.plugins.comments.addComment = function (uid, addMark) {
            if (!Env.ready) { return; }
            if (!Env.comments) { Env.comments = Util.clone(COMMENTS); }

            // Get all comments ID contained within the selection
            var applicable = Env.editor.plugins.comments.isApplicable();
            if (!applicable) {
                // Abort if our selection contains a comment
                console.error("Can't add a comment here");
                // XXX show error
                UI.warn(Messages.error);
                return;
            }

            Env.$container.find('.cp-comment-form').remove();
            var form = getCommentForm(Env, false, function (val) {
                $(form).remove();
                Env.$inner.focus();

                if (!val) { return; }
                var applicable = Env.editor.plugins.comments.isApplicable();
                if (!applicable) {
                    // text has been deleted by another user while we were typing our comment?
                    return void UI.warn(Messages.error);
                }

                // Don't override existing data
                if (Env.comments.data[uid]) { return; }

                var user = updateAuthorData(Env);
                Env.comments.data[uid] = {
                    m: [{
                        u: user, // Id or name
                        t: +new Date(),
                        m: val,
                        v: canonicalize(Env.editor.getSelection().getSelectedText())
                    }]
                };
                // There may be a race condition between updateMetadata and addMark that causes
                //  * updateMetadata first:  comment not rendered (redrawComments called
                //                           before addMark)
                //  * addMark first: comment deleted (checkDeleted called before updateMetadata)
                // ==> we're going to call updateMetadata first, and we'll invalidate the cache
                //     of rendered comments to display them properly in redrawComments
                updateMetadata(Env);
                addMark();

                Env.framework.localChange();

                Env.oldComments = undefined;
            });
            Env.$container.prepend(form).show();
        };


        Env.$iframe.on('scroll', function () {
            updateBubble(Env);
        });
        $(Env.ifrWindow.document).on('selectionchange', function () {
            removeCommentBubble(Env);
            var applicable = Env.editor.plugins.comments.isApplicable();
            if (!applicable) { return; }
            addCommentBubble(Env);
        });
    };

    var onContentUpdate = function (Env) {
        if (!Env.ready) { return; }
        // Check deleted
        onChange(Env);
        checkDeleted(Env);
    };

    var ready = function (Env) {
        Env.ready = 0;

        // If you're the only edit user online, clear "deleted" comments
        if (!Env.common.isLoggedIn()) { return; }
        var users = Env.metadataMgr.getMetadata().users || {};
        var isNotAlone = Object.keys(users).length > 1;
        if (isNotAlone) { return; }

        // Clear data
        var data = (Env.comments && Env.comments.data) || {};
        Object.keys(data).forEach(function (uid) {
            if (data[uid].deleted) { delete data[uid]; }
        });

        // Commit
        updateMetadata(Env);
        Env.framework.localChange();
    };

    Comments.create = function (cfg) {
        var Env = cfg;
        Env.comments = Util.clone(COMMENTS);

        addAddCommentHandler(Env);

        // Unselect comment when clicking outside
        $(window).click(function (e) {
            if ($(e.target).closest('.cp-comment-container').length) {
                return;
            }
            Env.$container.find('.cp-comment-active').removeClass('cp-comment-active');
            Env.$inner.find('comment.active').removeClass('active');
        });
        // Unselect comment when clicking on another part of the doc
        Env.$inner.on('click', function (e) {
            if ($(e.target).closest('comment').length) { return; }
            Env.$container.find('.cp-comment-active').removeClass('cp-comment-active');
            Env.$inner.find('comment.active').removeClass('active');
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
            ready: call(ready)
        };
    };

    return Comments;
});
