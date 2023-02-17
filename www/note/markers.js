define([
    '/common/common-util.js',
    '/common/sframe-common-codemirror.js',
    '/customize/messages.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/common/inner/common-mediatag.js',
    '/common/common-interface.js',
], function (Util, SFCodeMirror, Messages, ChainPad, MT, UI) {
    var Markers = {};

    /* TODO Known Issues
     * 1. ChainPad diff is not completely accurate: we're not aware of the other user's cursor
          position so if they insert an "a" in the middle of "aaaaa", the diff will think that
          the "a" was inserted at the end of this sequence. This is not an issue for the content
          but it will cause issues for the colors
       2. ChainPad doesn't always provide the good result in case of conflict (?)
          e.g. Alice is inserting "pew" at offset 10, Bob is removing 1 character at offset 10
               The expected result is to have "pew" and the following character deleted
               In some cases, the result is "ew" inserted and the following character not deleted
     */

    var debug = function () {};

    var MARK_OPACITY = 0.5;
    var DEFAULT = {
        authors: {},
        marks: [[-1, 0, Number.MAX_SAFE_INTEGER]]
    };

    var addMark = function (Env, from, to, uid) {
        if (!Env.enabled) { return; }
        uid = Number(uid);
        if (uid === -1) {
            return void Env.editor.CP_addAuthor("transparent", "", uid, false, from, to);
        }
        var author = Env.authormarks.authors[uid] || {};
        var name = Util.fixHTML(UI.getDisplayName(author.name));
        var animal;
        if ((!name || name === Messages.anonymous) && typeof(author.uid) === 'string') {
            animal = MT.getPseudorandomAnimal(author.uid);
            if (animal) {
                name = animal + ' ' + Messages.anonymous;
            } else {
                name = Messages.anonymous;
            }
        }

        var col = Util.hexToRGB(author.color);
        var rgba = 'rgba('+col[0]+','+col[1]+','+col[2]+','+Env.opacity+');';
        var title = Env.opacity ? Messages._getKey('cba_writtenBy', [name]) : '';
        var inclusive = uid === Env.myAuthorId; // include text just before or after inside the mark
        return Env.editor.CP_addAuthor(rgba, title, uid, inclusive, from, to);
    };
    var sortMarks = function (a, b) {
        if (!Array.isArray(b)) { return -1; }
        if (!Array.isArray(a)) { return 1; }
        return a[1] - b[1];
    };

    /* Formats:
        [uid, from, to]
    */
    var parseMark = Markers.parseMark = function (array) {
        if (!Array.isArray(array)) { return {}; }
        return {
            uid: array[0],
            from: array[1],
            to: array[2],
        };
    };

    var setAuthorMarks = function (Env, authormarks) {
        if (!Env.enabled) {
            Env.authormarks = {};
            return;
        }
        authormarks = authormarks || {};
        if (!authormarks.marks) { authormarks.marks = Util.clone(DEFAULT.marks); }
        if (!authormarks.authors) { authormarks.authors = Util.clone(DEFAULT.authors); }
        Env.oldMarks = Env.authormarks;
        Env.authormarks = authormarks;
    };

    var getAuthorMarks = function (Env) {
        return Env.authormarks;
    };

    var updateAuthorMarks = function (Env) {
        if (!Env.enabled) { return; }

        // get author marks
        var _marks = [];
        var all = [];

        var i = 0;
        Env.editor.CP_getAllAuthors().forEach(function (mark) {
            var attributes = mark.attrs || {};
            var uid = Number(attributes['data-uid']) || 0;

            all.forEach(function (obj) {
                if (obj.uid !== uid) { return; }
                if (obj.removed) { return; }
                // Merge left
                if (obj.pos.to === mark.from) {
                    obj.removed = true;
                    _marks[obj.index] = undefined;
                    obj.mark.clear();
                    mark.clear();
                    mark = addMark(Env, obj.pos.from, mark.to, uid);
                    mark.from = obj.pos.from;
                    return;
                }
                // Merge right
                if (obj.pos.from === mark.to) {
                    obj.removed = true;
                    _marks[obj.index] = undefined;
                    obj.mark.clear();
                    mark.clear();
                    mark = addMark(Env, mark.from, obj.pos.to, uid);
                    mark.to = obj.pos.to;
                }
            });

            _marks.push([uid, mark.from, mark.to]);
            all.push({
                uid: uid,
                pos: {
                    from: mark.from,
                    to: mark.to
                },
                mark: mark,
                index: i++
            });
        });
        _marks.sort(sortMarks);
        debug('warn', _marks);
        Env.authormarks.marks = _marks.filter(Boolean);
    };

    // Fix all marks located after the given operation in the provided document
    var fixMarksFromOp = function (Env, op, marks, doc) {

        var from = op.offset; // My patch start
        var to = op.offset + op.toInsert.length; // My patch end
        var removedEnd = op.offset + op.toRemove; // End of the removed content (before insert)
        var diff = op.toInsert.length - op.toRemove; // Diff size

        var splitted;

        marks.forEach(function (mark, i) {
            if (!mark) { return; }
            var p = parseMark(mark);

            // Don't update marks located before the operation
            if (p.to < from) { return; }

            // Remove markers that have been deleted by my changes
            if (p.from >= from && p.to <= removedEnd) {
                marks[i] = undefined;
                return;
            }

            // Update markers that have been cropped right
            if (p.to <= removedEnd) {
                mark[2] = from;
                return;
            }

            // Update markers that have been cropped left. This markers will be affected by
            // my toInsert so don't abort
            if (p.from < removedEnd) {
                // If our change will split an existing mark, put the existing mark after the change
                // and create a new mark before
                if (p.from < from) {
                    splitted = [mark[0], p.from, from];
                }
                mark[1] = removedEnd;
            }

            mark[1] += diff;
            mark[2] += diff;
        });
        if (op.toInsert.length) {
            marks.push([Env.myAuthorId, from, to]);
        }
        if (splitted) {
            marks.push(splitted);
        }
        marks.sort(sortMarks);
    };

    // Remove marks added by OT and fix the incorrect ones
    // first: data about the change with the lowest offset
    // last: data about the change with the latest offset
    // in the comments, "I" am "first"
    var fixMarks = function (Env, first, last, content, toKeepEnd) {
        var toKeep = [];
        var toJoin = {};

        debug('error', "Fix marks");
        debug('warn', first);
        debug('warn', last);

        if (first.me !== last.me) {
            // Get their start position compared to the authDoc
            var lastAuthOffset = last.offset + last.total;
            var lastAuthPos = SFCodeMirror.posToCursor(lastAuthOffset, last.doc);
            // Get their start position compared to the localDoc
            var lastLocalOffset = last.offset + first.total;
            var lastLocalPos = SFCodeMirror.posToCursor(lastLocalOffset, first.doc);

            // Keep their changes in the marks (after their offset)
            last.marks.some(function (array, i) {
                var p = parseMark(array);
                // End of the mark before offset? ignore
                if (p.to < lastAuthOffset) { return; }
                // Take everything from the first mark ending after the pos
                toKeep = last.marks.slice(i);
                last.marks.splice(i);
                return true;
            });
            // Keep my marks (based on currentDoc) before their changes
            first.marks.some(function (array, i) {
                var p = parseMark(array);
                // End of the mark before offset? ignore
                if (p.to < lastLocalOffset) { return; }
                // Take everything from the first mark ending after the pos
                first.marks.splice(i);
                return true;
            });
        }

        // If we still have markers in "first", store the last one so that we can "join"
        // everything at the end
        if (first.marks.length) {
            var toJoinMark = first.marks[first.marks.length - 1].slice();
            toJoin = parseMark(toJoinMark);
        }


        // Add the new markers to the result
        Array.prototype.unshift.apply(toKeepEnd, toKeep);

        debug('warn', toJoin);
        debug('warn', toKeep);
        debug('warn', toKeepEnd);

        // Fix their offset: compute added lines and added characters on the last line
        // using the chainpad operation data (toInsert and toRemove)
        var diff = first.toInsert.length - first.toRemove;
        toKeepEnd.forEach(function (array) {
            array[1] += diff;
            array[2] += diff;
        });

        if (toKeep.length && toJoin) {
            toKeepEnd[0][1] = toJoin.to;
        }

        debug('log', 'Fixed');
        debug('warn', toKeepEnd);
    };

    var checkMarks = function (Env, userDoc) {

        var chainpad = Env.framework._.cpNfInner.chainpad;
        var editor = Env.editor;
        var CodeMirror = Env.CodeMirror;

        Env.enabled = Boolean(userDoc.authormarks && userDoc.authormarks.marks);
        setAuthorMarks(Env, userDoc.authormarks);

        if (!Env.enabled) { return; }

        debug('error', 'Check marks');

        var authDoc = JSON.parse(chainpad.getAuthDoc() || '{}');
        if (!authDoc.content || !userDoc.content) { return; }

        var authPatch = chainpad.getAuthBlock();
        if (authPatch.isFromMe) {
            debug('log', 'Switch branch, from me');
            debug('log', authDoc.content);
            debug('log', authDoc.authormarks.marks);
            debug('log', userDoc.content);
            // We're switching to a different branch that was created by us.
            // We can't trust localDoc anymore because it contains data from the other branch
            // It means the only changes that we need to consider are ours.
            // Diff between userDoc and authDoc to see what we changed
            var _myOps = ChainPad.Diff.diff(authDoc.content, userDoc.content).reverse();
            var authormarks = Util.clone(authDoc.authormarks);
            _myOps.forEach(function (op) {
                fixMarksFromOp(Env, op, authormarks.marks, authDoc.content);
            });
            authormarks.marks = authormarks.marks.filter(Boolean);
            debug('log', 'Fixed marks');
            debug('warn', authormarks.marks);
            setAuthorMarks(Env, authormarks);
            return;
        }


        var oldMarks = Env.oldMarks;


        if (authDoc.content === userDoc.content) { return; } // No uncommitted work

        if (!userDoc.authormarks || !Array.isArray(userDoc.authormarks.marks)) { return; }

        debug('warn', 'Begin...');

        var localDoc = CodeMirror.canonicalize(CodeMirror.getValue());

        var commonParent = chainpad.getAuthBlock().getParent().getContent().doc;
        var content = JSON.parse(commonParent || '{}').content || '';

        var theirOps = ChainPad.Diff.diff(content, authDoc.content);
        var myOps = ChainPad.Diff.diff(content, localDoc);

        debug('log', theirOps);
        debug('log', myOps);

        if (!myOps.length || !theirOps.length) { return; }

        // If I have uncommited content when receiving a remote patch, all the operations
        // placed after someone else's changes will create marker issues. We have to fix it
        var sorted = [];

        var myTotal = 0;
        var theirTotal = 0;
        var parseOp = function (me) {
            return function (op) {
                var size = (op.toInsert.length - op.toRemove);

                sorted.push({
                    me: me,
                    offset: op.offset,
                    toInsert: op.toInsert,
                    toRemove: op.toRemove,
                    size: size,
                    marks: (me ? (oldMarks && oldMarks.marks)
                               : (authDoc.authormarks && authDoc.authormarks.marks)) || [],
                    doc: me ? localDoc : authDoc.content
                });

                if (me) { myTotal += size; }
                else { theirTotal += size; }
            };
        };
        myOps.forEach(parseOp(true));
        theirOps.forEach(parseOp(false));

        // Sort the operation in reverse order of offset
        // If an operation from them has the same offset than an operation from me, put mine first
        sorted.sort(function (a, b) {
            if (a.offset === b.offset) {
                return a.me ? -1 : 1;
            }
            return b.offset - a.offset;
        });

        debug('log', sorted);

        // We start from the end so that we don't have to fix the offsets everytime
        var prev;
        var toKeepEnd = [];
        sorted.forEach(function (op) {

            // Not the same author? fix!
            if (prev) {
                // Provide the new "totals"
                prev.total = prev.me ? myTotal : theirTotal;
                op.total = op.me ? myTotal : theirTotal;
                // Fix the markers
                fixMarks(Env, op, prev, content, toKeepEnd);
            }

            if (op.me) { myTotal -= op.size; }
            else { theirTotal -= op.size; }
            prev = op;
        });

        debug('log', toKeepEnd);

        // We now have all the markers located after the first operation (ordered by offset).
        // Prepend the markers placed before this operation
        var first = sorted[sorted.length - 1];
        if (first) { Array.prototype.unshift.apply(toKeepEnd, first.marks); }

        // Commit our new markers
        Env.authormarks.marks = toKeepEnd;

        debug('warn', toKeepEnd);
        debug('warn', '...End');
    };

    // Reset marks displayed in CodeMirror to the marks stored in Env
    var setMarks = function (Env) {
        // on remote update: remove all marks, add new marks if colors are enabled
        Env.editor.CP_removeAuthors();

        if (!Env.enabled) { return; }

        debug('error', 'setMarks');
        debug('log', Env.authormarks.marks);

        var authormarks = Env.authormarks;
        authormarks.marks.forEach(function (mark) {
            var uid = mark[0];
            if (uid !== -1 && (!authormarks.authors || !authormarks.authors[uid])) { return; }
            var from = mark[1];
            var to = mark[2];

            // Remove marks that are placed under this one
            try {
                Env.editor.CP_findAuthors(from, to).forEach(function (mark) {
                    mark.clear();
                });
            } catch (e) {
                console.warn(mark, JSON.stringify(authormarks.marks));
                console.error(from, to);
                console.error(e);
            }

            addMark(Env, from, to, uid);
        });
    };

    var setMyData = function (Env) {
        if (!Env.enabled) { return; }

        var userData = Env.common.getMetadataMgr().getUserData();
        var old = Env.authormarks.authors[Env.myAuthorId];
        Env.authormarks.authors[Env.myAuthorId] = {
            name: userData.name,
            curvePublic: userData.curvePublic,
            color: userData.color,
            uid: userData.uid,
        };
        if (!old || (old.name === userData.name && old.color === userData.color)) { return; }
        return true;
    };

    var localChange = function (Env, change, cb) {
        cb = cb || function () {};

        if (!Env.enabled) { return void cb(); }

        debug('error', 'Local change');
        debug('log', change, true);

        var origin = 'remote';
        try {
            origin = change.transactions[0].annotations[0].value;
            if (typeof(origin) === "number") { origin = 'remote'; }
        } catch (e) {}

        if (origin === "remote") {
            // If the content is changed from a remote patch, we call localChange
            // in "onContentUpdate" directly
            return;
        }

        var insertedL = change.changes.inserted.reduce(function (length, obj) {
            return length + obj.length;
        }, 0);
        if (!insertedL || !/^input/.test(origin)) {
            return void cb();
        }

        // add new author mark if text is added. marks from removed text are removed automatically

        // Add my data to the doc if it's missing
        if (!Env.authormarks.authors[Env.myAuthorId]) {
            setMyData(Env);
        }

        change.changes.iterChanges(function (fromA, toA, fromB, toB, inserted) {

            // If my text is inside an existing mark:
            //  * if it's my mark, do nothing
            //  * if it's someone else's mark, break it
            // We can only have one author mark at a given position, but there may be
            // another mark (cursor selection...) at this position so we use ".some"
            var toSplit, abort;


            Env.editor.CP_findAuthors(fromB, toB).some(function (mark) {
                if (!mark.attrs) { return; }
                if (mark.attrs['data-uid'] !== Env.myAuthorId) {
                    toSplit = {
                        mark: mark,
                        uid: mark.attrs['data-uid']
                    };
                } else {
                    // This is our mark: abort to avoid making a new one
                    abort = true;
                }

                return true;
            });
            if (abort) { return; }

            if (toSplit && toSplit.mark && typeof(toSplit.uid) !== "undefined") {
                // Break the other user's mark if needed
                var m = toSplit.mark;
                toSplit.mark.clear();
                addMark(Env, m.from, fromB, toSplit.uid); // their mark, 1st part
                addMark(Env, fromB, toB, Env.myAuthorId); // my mark
                addMark(Env, toB, m.to, toSplit.uid); // their mark, 2nd part
            } else {
                // Add my mark
                addMark(Env, fromB, toB, Env.myAuthorId);
            }
        });

        /*
        // change.to is not always correct, fix it!
        var to_add = {
            line: change.from.line + change.text.length-1,
        };
        if (change.text.length > 1) {
            // Multiple lines => take the length of the text added to the last line
            to_add.ch = change.text[change.text.length-1].length;
        } else {
            // Single line => use the "from" position and add the length of the text
            to_add.ch = change.from.ch + change.text[change.text.length-1].length;
        }
        */

        cb();
    };

    var setButton = function (Env, $button) {
        var toggle = function () {
            if (Env.opacity) {
                Env.opacity = 0;
                $button.find('.cp-toolbar-drawer-element').text(Messages.cba_show);
                $button.removeClass("cp-toolbar-button-active");
            } else {
                Env.opacity = MARK_OPACITY;
                $button.find('.cp-toolbar-drawer-element').text(Messages.cba_hide);
                $button.addClass("cp-toolbar-button-active");
            }
        };
        toggle();
        Env.$button = $button;
        $button.click(function() {
            toggle();
            setMarks(Env);
        });
    };

    var getAuthorId = function (Env) {
        var userData = Env.common.getMetadataMgr().getUserData();
        return Env.common.getAuthorId(Env.authormarks.authors, userData.curvePublic);
    };
    var ready = function (Env) {
        Env.ready = true;
        Env.myAuthorId = getAuthorId(Env);

        if (!Env.enabled) { return; }
        if (Env.$button) { Env.$button.show(); }
        if (!Env.authormarks.marks || !Env.authormarks.marks.length) {
            Env.authormarks = Util.clone(DEFAULT);
        }
        setMarks(Env);
    };

    var getState = function (Env) {
        return Boolean(Env.authormarks && Env.authormarks.marks);
    };
    var setState = function (Env, enabled) {
        // If the state has changed in the pad, change the Env too
        if (!Env.ready) { return; }
        if (Env.enabled === enabled) { return; }
        Env.enabled = enabled;
        if (!Env.enabled) {
            // Reset marks
            Env.authormarks = {};
            setMarks(Env);
            if (Env.$button) { Env.$button.hide(); }
        } else {
            Env.myAuthorId = getAuthorId(Env);
            // If it's a reset, add initial marker
            if (!Env.authormarks.marks || !Env.authormarks.marks.length) {
                Env.authormarks = Util.clone(DEFAULT);
                setMarks(Env);
            }
            if (Env.$button) { Env.$button.show(); }
        }
        if (Env.ready) { Env.framework.localChange(); }
    };

    Markers.create = function (config) {
        var Env = config;
        Env.authormarks = {};
        Env.enabled = false;
        Env.myAuthorId = 0;

        if (Env.devMode) {
            debug = function (level, obj, logObject) {
                var f = console.log;
                if (typeof(console[level]) === "function") {
                    f = console[level];
                }
                if (logObject) { return void f(obj); }
            };
        }

        var metadataMgr = Env.common.getMetadataMgr();
        metadataMgr.onChange(function () {
            // If the markers are disabled or if I haven't pushed content since the last reset,
            // don't update my data
            if (!Env.enabled || !Env.myAuthorId || !Env.authormarks.authors ||
                !Env.authormarks.authors[Env.myAuthorId]) {
                return;
            }

            // Update my data
            var changed = setMyData(Env);
            if (changed) {
                setMarks(Env);
                Env.framework.localChange();
            }
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


        return {
            addMark: call(addMark),
            getAuthorMarks: call(getAuthorMarks),
            updateAuthorMarks: call(updateAuthorMarks),
            checkMarks: call(checkMarks),
            setMarks: call(setMarks),
            localChange: call(localChange),
            ready: call(ready),
            setButton: call(setButton),
            getState: call(getState),
            setState: call(setState),
        };
    };

    return Markers;
});
