define([
    'jquery',
    'json.sortify',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js'
], function($, Sortify, Util, Hash, h, UI, Messages) {
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
                    v: "str", // value of the commented content
                    e: undefined/1, // edited
                    d: undefined/1, // deleted
                }],
                d: undefined/1,
            }
        }
    }
    */

    var COMMENTS = {
        authors: {},
        data: {}
    };

    var canonicalize = function(t) { return t.replace(/\r\n/g, '\n'); };

    var getAuthorId = function(Env, curve) {
        return Env.common.getAuthorId(Env.comments.authors, curve);
    };

    // Return the author ID  and add/update the data for registered users
    // Return the username for unregistered users
    var updateAuthorData = function(Env, onChange) {
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

    var updateMetadata = function(Env) {
        var md = Util.clone(Env.metadataMgr.getMetadata());
        md.comments = Util.clone(Env.comments);
        Env.metadataMgr.updateMetadata(md);
    };

    var sendReplyNotification = function(Env, uid) {
        if (!Env.comments || !Env.comments.data || !Env.comments.authors) { return; }
        if (!Env.common.isLoggedIn()) { return; }
        var thread = Env.comments.data[uid];
        if (!thread || !Array.isArray(thread.m)) { return; }
        var userData = Env.metadataMgr.getUserData();
        var privateData = Env.metadataMgr.getPrivateData();
        var others = {};
        // Get all the other registered users with a mailbox
        thread.m.forEach(function(obj) {
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
        Object.keys(others).forEach(function(id) {
            var data = others[id];
            Env.common.mailbox.sendTo("COMMENT_REPLY", {
                channel: privateData.channel,
                comment: data.comment.replace(/<[^>]*>/g, ''),
                content: data.content
            }, {
                channel: data.notifications,
                curvePublic: data.curvePublic
            });
        });

    };

    var cleanMentions = function($el) {
        $el.html('');
        var el = $el[0];
        var allowed = ['data-profile', 'data-name', 'data-avatar', 'class'];
        // Remove unnecessary/unsafe attributes
        for (var i = el.attributes.length - 1; i > 0; i--) {
            var name = el.attributes[i] && el.attributes[i].name;
            if (allowed.indexOf(name) === -1) {
                $el.removeAttr(name);
            }
        }
    };

    // Seletc all text of a contenteditable element
    var selectAll = function(element) {
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    };

    var getCommentForm = function(Env, reply, _cb, editContent) {
        var cb = Util.once(_cb);
        var userData = Env.metadataMgr.getUserData();
        var name = Util.fixHTML(userData.name || Messages.anonymous);
        var avatar = h('span.cp-avatar');
        var textarea = h('div.cp-textarea', {
            tabindex: 1,
            role: 'textbox',
            'aria-multiline': true,
            'aria-labelledby': 'cp-comments-label',
            'aria-required': true,
            contenteditable: true,
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

        // List of allowed attributes in mentions
        $(submit).click(function(e) {
            e.stopPropagation();
            var clone = textarea.cloneNode(true);
            var notify = {};
            var $clone = $(clone);
            $clone.find('span.cp-mentions').each(function(i, el) {
                var $el = $(el);
                var curve = $el.attr('data-curve');
                var notif = $el.attr('data-notifications');
                cleanMentions($el, true);
                if (!curve || !notif) { return; }
                notify[curve] = notif;
            });
            $clone.find('br').replaceWith("\n");
            $clone.find('> *:not(.cp-mentions)').remove();
            var content = clone.innerHTML.trim();
            if (!content) { return; }

            // Send notification
            var privateData = Env.metadataMgr.getPrivateData();
            var userData = Env.metadataMgr.getUserData();
            Object.keys(notify).forEach(function(curve) {
                if (curve === userData.curvePublic) { return; }
                Env.common.mailbox.sendTo("MENTION", {
                    channel: privateData.channel,
                }, {
                    channel: notify[curve],
                    curvePublic: curve
                });
            });

            // Push the content
            cb(content);
        });
        $(cancel).click(function(e) {
            e.stopPropagation();
            cb();
        });

        var $text = $(textarea).keydown(function(e) {
            e.stopPropagation();
            if (e.which === 27) {
                $(cancel).click();
                e.stopImmediatePropagation();
            }
            if (e.which === 13 && !e.shiftKey) {
                // Submit form on Enter is the autocompelte menu is not visible
                try {
                    var visible = $text.autocomplete("instance").menu.activeMenu.is(':visible');
                    if (visible) { return; }
                } catch (err) {}
                $(submit).click();
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        }).click(function(e) {
            e.stopPropagation();
        });


        if (Env.common.isLoggedIn()) {
            var authors = {};
            Object.keys((Env.comments && Env.comments.authors) ||  {}).forEach(function(id) {
                var obj = Util.clone(Env.comments.authors[id]);
                authors[obj.curvePublic] = obj;
            });
            Env.common.addMentions({
                $input: $text,
                contenteditable: true,
                type: 'contacts',
                sources: authors
            });
        }

        var deleteButton;
        // Edit? start with the old content
        // Add a space to make sure we won't end with a mention and a bad cursor
        if (editContent) {
            textarea.innerHTML = editContent + " ";
            deleteButton = h('button.btn.btn-danger', {
                tabindex: 1
            }, [
                h('i.fa.fa-times'),
                Messages.kanban_delete
            ]);
            $(deleteButton).click(function(e) {
                e.stopPropagation();
                cb(false);
            });
        }


        setTimeout(function() {
            $(textarea).focus();
            selectAll(textarea);
        });

        return h('div.cp-comment-form' + (reply ? '.cp-comment-reply' : ''), {
            'data-uid': reply || ''
        }, [
            h('div.cp-comment-form-input', [
                avatar,
                textarea
            ]),
            h('div.cp-comment-form-actions', [
                cancel,
                deleteButton,
                submit
            ])
        ]);
    };

    var isVisible = function(el, $container) {
        var size = $container.outerHeight();
        var pos = el.getBoundingClientRect();
        return (pos.bottom < size) && (pos.y > 0);
    };

    var redrawComments = function(Env) {
        // Don't redraw if there were no change
        var str = Sortify(Env.comments || {});
        if (str === Env.oldComments) { return; }
        Env.oldComments = str;

        // Store the cursor position if it's located in this form
        var oldSelection = window.getSelection();
        var oldRangeObj;
        if ($(oldSelection.anchorNode).closest('.cp-comment-form').length) {
            var oldRange = oldSelection.getRangeAt && oldSelection.getRangeAt(0);
            oldRangeObj = {
                start: oldRange.startContainer,
                startO: oldRange.startOffset,
                end: oldRange.endContainer,
                endO: oldRange.endOffset
            };
        }
        // Store existing input form in memory
        var $oldInput = Env.$container.find('.cp-comment-form').detach();
        if ($oldInput.length !== 1) { $oldInput = undefined; }

        // Remove everything
        Env.$container.html('');

        // "show" tells us if we need to display the "comments" column or not
        var show = false;

        // Add invisible label for accessibility tools
        var label = h('label#cp-comments-label', Messages.comments_comment);
        Env.$container.append(label);

        // If we were adding a new comment, redraw our form
        if ($oldInput && !$oldInput.attr('data-uid')) {
            show = true;
            Env.$container.append($oldInput);
        }

        var userData = Env.metadataMgr.getUserData();

        // Get all the comment threads in their order in the pad
        var threads = Env.$inner.find('comment').map(function(i, el) {
            return el.getAttribute('data-uid');
        }).toArray();

        // Draw all comment threads
        Util.deduplicateString(threads).forEach(function(key) {
            // Get thread data
            var obj = Env.comments.data[key];
            if (!obj || obj.d ||  !Array.isArray(obj.m) ||  !obj.m.length) {
                return;
            }

            // If at least one thread is visible, display the "comments" column
            show = true;

            var content = [];
            var $div;
            var $actions;

            // Draw all messages for this thread
            (obj.m || []).forEach(function(msg, i) {
                var replyCls = i === 0 ? '' : '.cp-comment-reply';
                if (msg.d) {

                    content.push(h('div.cp-comment.cp-comment-deleted' + replyCls,
                        Messages.comments_deleted));
                    return;
                }
                var author = typeof(msg.u) === "number" ?
                    ((Env.comments.authors || {})[msg.u] || {}) : { name: msg.u };
                var name = Util.fixHTML(author.name || Messages.anonymous);
                var date = new Date(msg.t);
                var avatar = h('span.cp-avatar');
                Env.common.displayAvatar($(avatar), author.avatar, name);
                if (author.profile) {
                    $(avatar).click(function(e) {
                        Env.common.openURL(Hash.hashToHref(author.profile, 'profile'));
                        e.stopPropagation();
                    });
                }

                // Build sanitized html with mentions
                var m = h('div.cp-comment-content');
                m.innerHTML = msg.m;
                var $m = $(m);
                $m.find('> *:not(span.cp-mentions)').remove();
                $m.find('span.cp-mentions').each(function(i, el) {
                    var $el = $(el);
                    var name = $el.attr('data-name');
                    var avatarUrl = $el.attr('data-avatar');
                    var profile = $el.attr('data-profile');
                    if (!name && !avatarUrl && !profile) {
                        $el.remove();
                        return;
                    }
                    cleanMentions($el);
                    var avatar = h('span.cp-avatar');
                    Env.common.displayAvatar($(avatar), avatarUrl, name);
                    $el.append([
                        avatar,
                        h('span.cp-mentions-name', name)
                    ]);
                    if (profile) {
                        $el.attr('tabindex', 1);
                        $el.addClass('cp-mentions-clickable').click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            Env.common.openURL(Hash.hashToHref(profile, 'profile'));
                        }).focus(function(e) {
                            e.stopPropagation();
                        });
                    }
                });

                // edited state
                var edited;
                if (msg.e) {
                    edited = h('div.cp-comment-edited', Messages.comments_edited);
                }

                var container;

                // Add edit button when applicable (last message of the thread, written by ourselves)
                var edit;
                if (i === (obj.m.length - 1) && author.curvePublic === userData.curvePublic) {
                    edit = h('span.cp-comment-edit', {
                        tabindex: 1,
                        title: Messages.clickToEdit
                    }, h('i.fa.fa-pencil'));
                    $(edit).click(function(e) {
                        Env.$container.find('.cp-comment-active').removeClass('cp-comment-active');
                        $div.addClass('cp-comment-active');
                        e.stopPropagation();
                        Env.$container.find('.cp-comment-form').remove();
                        if ($actions) { $actions.hide(); }
                        var form = getCommentForm(Env, key, function(val) {
                            // Show the "reply" and "resolve" buttons again
                            $(form).closest('.cp-comment-container')
                                .find('.cp-comment-actions').css('display', '');
                            $(form).remove();

                            if (typeof(val) === "undefined") { return; }

                            var obj = Env.comments.data[key];
                            if (!obj || !Array.isArray(obj.m)) { return; }
                            var msg = obj.m[i];
                            if (!msg) { return; }
                            // i is our index
                            if (val === false) {
                                msg.d = 1;
                                if (container) {
                                    $(container).addClass('cp-comment-deleted')
                                        .html(Messages.comments_deleted);
                                }
                                if (obj.m.length === 1) {
                                    delete Env.comments.data[key];
                                }
                            } else {
                                msg.e = 1;
                                msg.m = val;
                            }

                            // Send to chainpad
                            updateMetadata(Env);
                            Env.framework.localChange();
                        }, m.innerHTML);

                        if (!$div) { return; }
                        $div.append(form);
                    });
                }

                // Add the comment
                content.push(container = h('div.cp-comment' + replyCls, [
                    h('div.cp-comment-header', [
                        avatar,
                        h('span.cp-comment-metadata', [
                            h('span.cp-comment-author', name),
                            h('span.cp-comment-time', date.toLocaleString())
                        ]),
                        edit
                    ]),
                    m,
                    edited
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
            $actions = $(actions);

            var div;
            Env.$container.append(div = h('div.cp-comment-container', {
                'data-uid': key,
                tabindex: 1
            }, content));
            $div = $(div);

            $(reply).click(function(e) {
                e.stopPropagation();
                $actions.hide();
                var form = getCommentForm(Env, key, function(val) {
                    // Show the "reply" and "resolve" buttons again
                    $(form).closest('.cp-comment-container')
                        .find('.cp-comment-actions').css('display', '');
                    $(form).remove();

                    if (!val) { return; }
                    var obj = Env.comments.data[key];
                    if (!obj || !Array.isArray(obj.m)) { return; }

                    // Get the value of the commented text
                    var res = Env.$inner.find('comment[data-uid="' + key + '"]').toArray();
                    var value = res.map(function(el) {
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

                // Make sure the submit button is visible: scroll by the height of the form
                setTimeout(function() {
                    var yContainer = Env.$container[0].getBoundingClientRect().bottom;
                    var yActions = form.getBoundingClientRect().bottom;
                    if (yActions > yContainer) {
                        Env.$container.scrollTop(Env.$container.scrollTop() + 55);
                    }
                });
            });

            UI.confirmButton(resolve, {
                classes: 'btn-danger'
            }, function() {
                // Delete the comment
                delete Env.comments.data[key];

                // Send to chainpad
                updateMetadata(Env);
                Env.framework.localChange();
            });

            var focusContent = function() {
                // Add class "active"
                Env.$inner.find('comment.active').removeClass('active');
                Env.$inner.find('comment[data-uid="' + key + '"]').addClass('active');
                var $last = Env.$inner.find('comment[data-uid="' + key + '"]').last();

                // Scroll into view
                if (!$last.length) { return; }
                var visible = isVisible($last[0], Env.$inner);
                if (!visible) { $last[0].scrollIntoView(); }
            };

            $div.on('click focus', function(e) {
                // Prevent the click event to propagate if we're already selected
                // The propagation to #cp-app-pad-inner would trigger the "unselect" handler
                e.stopPropagation();
                if ($div.hasClass('cp-comment-active')) { return; }
                Env.$container.find('.cp-comment-active').removeClass('cp-comment-active');
                $div.addClass('cp-comment-active');
                $actions.css('display', '');
                Env.$container.find('.cp-comment-form').remove();

                focusContent();

                var visible = isVisible(div, Env.$container);
                if (!visible) { div.scrollIntoView(); }
            });

            if ($oldInput && $oldInput.attr('data-uid') === key) {
                $div.addClass('cp-comment-active');
                $actions.hide();
                $div.append($oldInput);
                $oldInput.find('textarea').focus();
                focusContent();
            }
        });

        // Restore selection
        if (oldRangeObj) {
            setTimeout(function() {
                if (!oldRangeObj) { return; }
                var range = document.createRange();
                range.setStart(oldRangeObj.start, oldRangeObj.startO);
                range.setEnd(oldRangeObj.end, oldRangeObj.endO);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            });
        }

        if (show) {
            Env.$container.show();
        } else {
            Env.$container.hide();
        }
    };

    var onChange = function(Env) {
        var md = Util.clone(Env.metadataMgr.getMetadata());
        Env.comments = md.comments;
        var changed = false;
        if (!Env.comments || !Env.comments.data) {
            changed = true;
            Env.comments = Util.clone(COMMENTS);
        }
        if (Env.ready === 0) {
            Env.ready = true;
            updateAuthorData(Env, function() {
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
            // and push the updates if necessary
            updateAuthorData(Env, function() {
                updateMetadata(Env);
                Env.framework.localChange();
            });
        }
        redrawComments(Env);
    };

    // Check if comments have been deleted from the document but not from metadata
    var checkDeleted = function(Env) {
        if (!Env.comments || !Env.comments.data) { return; }

        // Don't recheck if there were no change
        var str = Env.$inner[0].innerHTML;
        if (str === Env.oldCheck) { return; }
        Env.oldCheck = str;

        // If there is no comment stored in the metadata, abort
        var comments = Object.keys(Env.comments.data || {}).filter(function(id) {
            return !Env.comments.data[id].d;
        });

        var changed = false;

        // Get the comments from the document
        var toUncomment = {};
        var uids = Env.$inner.find('comment').map(function(i, el) {
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
            if (obj.d) {
                delete obj.d;
                changed = true;
            }
            return id;
        }).toArray();

        if (Object.keys(toUncomment).length) {
            Object.keys(toUncomment).forEach(function(id) {
                Env.editor.plugins.comments.uncomment(id, toUncomment[id]);
            });
        }

        // Check if a comment has been deleted
        comments.forEach(function(uid) {
            if (uids.indexOf(uid) !== -1) { return; }
            // comment has been deleted
            var data = Env.comments.data[uid];
            if (!data) { return; }
            data.d = 1;
            //delete Env.comments.data[uid];
            changed = true;
        });

        if (changed) {
            updateMetadata(Env);
        }
    };

    var removeCommentBubble = function(Env) {
        Env.bubble = undefined;
        Env.$contentContainer.find('.cp-comment-bubble').remove();
    };
    var updateBubble = function(Env) {
        if (!Env.bubble) { return; }
        var pos = Env.bubble.node.getBoundingClientRect();
        if (pos.y < 0 || pos.y > Env.$inner.outerHeight()) {
            //removeCommentBubble(Env);
        }
        Env.bubble.button.setAttribute('style', 'top:' + pos.y + 'px');
    };
    var addCommentBubble = function(Env) {
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
            style: 'top:' + y + 'px;',
            title: Messages.comments_comment
        }, h('i.fa.fa-comment'));
        Env.bubble = {
            node: node,
            button: button
        };
        $(button).click(function(e)  {
            e.stopPropagation();
            Env.editor.execCommand('comment');
            Env.bubble = undefined;
        });
        Env.$contentContainer.append(h('div.cp-comment-bubble', button));
    };

    var addAddCommentHandler = function(Env) {
        Env.editor.plugins.comments.addComment = function(uid, addMark) {
            if (!Env.ready) { return; }
            if (!Env.comments) { Env.comments = Util.clone(COMMENTS); }

            // Get all comments ID contained within the selection
            var applicable = Env.editor.plugins.comments.isApplicable();
            if (!applicable) {
                // Abort if our selection contains a comment
                UI.warn(Messages.comments_error);
                return;
            }

            // Remove active class on other comments
            Env.$container.find('.cp-comment-active').removeClass('cp-comment-active');
            Env.$container.find('.cp-comment-form').remove();
            var form = getCommentForm(Env, false, function(val) {
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


        Env.$iframe.on('scroll', function() {
            updateBubble(Env);
        });
        $(Env.ifrWindow.document).on('selectionchange', function() {
            removeCommentBubble(Env);
            var applicable = Env.editor.plugins.comments.isApplicable();
            if (!applicable) { return; }
            addCommentBubble(Env);
        });
    };

    var onContentUpdate = function(Env) {
        if (!Env.ready) { return; }
        // Check deleted
        onChange(Env);
        checkDeleted(Env);
    };

    var ready = function(Env) {
        Env.ready = 0;

        // If you're the only edit user online, clear "deleted" comments
        if (!Env.common.isLoggedIn()) { return; }
        var users = Env.metadataMgr.getMetadata().users || {};
        var isNotAlone = Object.keys(users).length > 1;
        if (isNotAlone) { return; }

        // Clear data
        var data = (Env.comments && Env.comments.data) || {};
        Object.keys(data).forEach(function(uid) {
            if (data[uid].d) { delete data[uid]; }
        });

        // Commit
        updateMetadata(Env);
        Env.framework.localChange();
    };

    Comments.create = function(cfg) {
        var Env = cfg;
        Env.comments = Util.clone(COMMENTS);

        var ro = cfg.framework.isReadOnly();
        var onEditableChange = function(unlocked) {
            Env.$container.removeClass('cp-comments-readonly');
            if (ro || !unlocked) {
                Env.$container.addClass('cp-comments-readonly');
            }
        };
        cfg.framework.onEditableChange(onEditableChange);
        onEditableChange();

        addAddCommentHandler(Env);

        // Unselect comment when clicking outside
        $(window).click(function(e) {
            var $target = $(e.target);
            if (!$target.length) { return; }
            if ($target.is('.cp-comment-container')) { return; }
            if ($target.closest('.cp-comment-container').length) { return; }
            if ($target.closest('.ui-autocomplete').length) { return; }
            // Add comment button? don't remove anything because this handler is called after
            // the button action
            if ($target.is('.cke_button__comment')) { return; }
            if ($target.closest('.cke_button__comment').length) { return; }
            Env.$container.find('.cp-comment-active').removeClass('cp-comment-active');
            Env.$inner.find('comment.active').removeClass('active');
            Env.$container.find('.cp-comment-form').remove();
        });
        // Unselect comment when clicking on another part of the doc
        Env.$inner.on('click', function(e) {
            if ($(e.target).closest('comment').length) { return; }
            Env.$container.find('.cp-comment-active').removeClass('cp-comment-active');
            Env.$inner.find('comment.active').removeClass('active');
            Env.$container.find('.cp-comment-form').remove();
        });
        Env.$inner.on('click', 'comment', function(e) {
            var $comment = $(e.target);
            var uid = $comment.attr('data-uid');
            if (!uid) { return; }
            Env.$container.find('.cp-comment-container[data-uid="' + uid + '"]').click();
        });

        var call = function(f) {
            return function() {
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
