define([
    '/common/common-util.js',
    '/common/sframe-common-codemirror.js',
    '/customize/messages.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function (Util, SFCodeMirror, Messages, ChainPad) {
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
        marks: [[-1, 0, 0, Number.MAX_SAFE_INTEGER,  Number.MAX_SAFE_INTEGER]]
    };

    var addMark = function (Env, from, to, uid) {
        if (!Env.enabled) { return; }
        var author = Env.authormarks.authors[uid] || {};
        if (uid === -1) {
            return void Env.editor.markText(from, to, {
                css: "background-color: transparent",
                attributes: {
                    'data-type': 'authormark',
                    'data-uid': uid
                }
            });
        }
        uid = Number(uid);
        var name = Util.fixHTML(author.name || Messages.anonymous);
        var col = Util.hexToRGB(author.color);
        var rgba = 'rgba('+col[0]+','+col[1]+','+col[2]+','+Env.opacity+');';
        return Env.editor.markText(from, to, {
            inclusiveLeft: uid === Env.myAuthorId,
            inclusiveRight: uid === Env.myAuthorId,
            css: "background-color: " + rgba,
            attributes: {
                title: Env.opacity ? Messages._getKey('cba_writtenBy', [name]) : '',
                'data-type': 'authormark',
                'data-uid': uid
            }
        });
    };
    var sortMarks = function (a, b) {
        if (!Array.isArray(b)) { return -1; }
        if (!Array.isArray(a)) { return 1; }
        // Check line
        if (a[1] < b[1]) { return -1; }
        if (a[1] > b[1]) { return 1; }
        // Same line: check start offset
        if (a[2] < b[2]) { return -1; }
        if (a[2] > b[2]) { return 1; }
        return 0;
    };

    /* Formats:
        [uid, startLine, startCh, endLine, endCh] (multi line)
        [uid, startLine, startCh, endCh] (single line)
        [uid, startLine, startCh] (single character)
    */
    var parseMark = Markers.parseMark = function (array) {
        if (!Array.isArray(array)) { return {}; }
        var multiline = typeof(array[4]) !== "undefined";
        var singleChar = typeof(array[3]) === "undefined";
        return {
            uid: array[0],
            startLine: array[1],
            startCh: array[2],
            endLine: multiline ? array[3] : array[1],
            endCh: singleChar ? (array[2]+1) : (multiline ? array[4] : array[3])
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
        Env.editor.getAllMarks().forEach(function (mark) {
            var pos = mark.find();
            var attributes = mark.attributes || {};
            if (!pos || attributes['data-type'] !== 'authormark') { return; }


            var uid = Number(attributes['data-uid']) || 0;

            all.forEach(function (obj) {
                if (obj.uid !== uid) { return; }
                if (obj.removed) { return; }
                // Merge left
                if (obj.pos.to.line === pos.from.line && obj.pos.to.ch === pos.from.ch) {
                    obj.removed = true;
                    _marks[obj.index] = undefined;
                    obj.mark.clear();
                    mark.clear();
                    mark = addMark(Env, obj.pos.from, pos.to, uid);
                    pos.from = obj.pos.from;
                    return;
                }
                // Merge right
                if (obj.pos.from.line === pos.to.line && obj.pos.from.ch === pos.to.ch) {
                    obj.removed = true;
                    _marks[obj.index] = undefined;
                    obj.mark.clear();
                    mark.clear();
                    mark = addMark(Env, pos.from, obj.pos.to, uid);
                    pos.to = obj.pos.to;
                }
            });

            var array = [uid, pos.from.line, pos.from.ch];
            if (pos.from.line === pos.to.line && pos.to.ch > (pos.from.ch+1)) {
                // If there is more than 1 character, add the "to" character
                array.push(pos.to.ch);
            } else if (pos.from.line !== pos.to.line) {
                // If the mark is on more than one line, add the "to" line data
                Array.prototype.push.apply(array, [pos.to.line, pos.to.ch]);
            }
            _marks.push(array);
            all.push({
                uid: uid,
                pos: pos,
                mark: mark,
                index: i
            });
            i++;
        });
        _marks.sort(sortMarks);
        debug('warn', _marks);
        Env.authormarks.marks = _marks.filter(Boolean);
    };

    // Fix all marks located after the given operation in the provided document
    var fixMarksFromOp = function (Env, op, marks, doc) {
        var pos = SFCodeMirror.posToCursor(op.offset, doc); // pos of start offset
        var rPos = SFCodeMirror.posToCursor(op.offset + op.toRemove, doc); // end of removed content
        var removed = doc.slice(op.offset, op.offset + op.toRemove).split('\n'); // removed content
        var added = op.toInsert.split('\n'); // added content
        var posEndLine = pos.line + added.length - 1; // end line after op
        var posEndCh = added[added.length - 1].length; // end ch after op
        var addLine = added.length - removed.length;
        var addCh = added[added.length - 1].length - removed[removed.length - 1].length;
        if (addLine > 0) { addCh -= pos.ch; }
        else if (addLine < 0) { addCh += pos.ch; }
        else { posEndCh += pos.ch; }

        var splitted;

        marks.forEach(function (mark, i) {
            if (!mark) { return; }
            var p = parseMark(mark);
            // Don't update marks located before the operation
            if (p.endLine < pos.line || (p.endLine === pos.line && p.endCh < pos.ch)) { return; }
            // Remove markers that have been deleted by my changes
            if ((p.startLine > pos.line || (p.startLine === pos.line && p.startCh >= pos.ch)) &&
                (p.endLine < rPos.line || (p.endLine === rPos.line && p.endCh <= rPos.ch))) {
                marks[i] = undefined;
                return;
            }
            // Update markers that have been cropped right
            if (p.endLine < rPos.line || (p.endLine === rPos.line && p.endCh <= rPos.ch)) {
                mark[3] = pos.line;
                mark[4] = pos.ch;
                return;
            }
            // Update markers that have been cropped left. This markers will be affected by
            // my toInsert so don't abort
            if (p.startLine < rPos.line || (p.startLine === rPos.line && p.startCh < rPos.ch)) {
                // If our change will split an existing mark, put the existing mark after the change
                // and create a new mark before
                if (p.startLine < pos.line || (p.startLine === pos.line && p.startCh < pos.ch)) {
                    splitted = [mark[0], mark[1], mark[2], pos.line, pos.ch];
                }
                mark[1] = rPos.line;
                mark[2] = rPos.ch;
            }
            // Apply my toInsert the to remaining marks
            mark[1] += addLine;
            if (typeof(mark[4]) !== "undefined") { mark[3] += addLine; }

            if (mark[1] === posEndLine) {
                mark[2] += addCh;
                if (typeof(mark[4]) === "undefined" && typeof(mark[3]) !== "undefined") {
                    mark[3] += addCh;
                } else if (typeof(mark[4]) !== "undefined" && mark[3] === posEndLine) {
                    mark[4] += addCh;
                }
            }
        });
        if (op.toInsert.length) {
            marks.push([Env.myAuthorId, pos.line, pos.ch, posEndLine, posEndCh]);
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
                if (p.endLine < lastAuthPos.line) { return; }
                // Take everything from the first mark ending after the pos
                if (p.endLine > lastAuthPos.line || p.endCh >= lastAuthPos.ch) {
                    toKeep = last.marks.slice(i);
                    last.marks.splice(i);
                    return true;
                }
            });
            // Keep my marks (based on currentDoc) before their changes
            first.marks.some(function (array, i) {
                var p = parseMark(array);
                // End of the mark before offset? ignore
                if (p.endLine < lastLocalPos.line) { return; }
                // Take everything from the first mark ending after the pos
                if (p.endLine > lastLocalPos.line || p.endCh >= lastLocalPos.ch) {
                    first.marks.splice(i);
                    return true;
                }
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
        var pos = SFCodeMirror.posToCursor(first.offset, content);
        var removed = content.slice(first.offset, first.offset + first.toRemove).split('\n');
        var added = first.toInsert.split('\n');
        var posEndLine = pos.line + added.length - 1; // end line after op
        var addLine = added.length - removed.length;
        var addCh = added[added.length - 1].length - removed[removed.length - 1].length;
        if (addLine > 0) { addCh -= pos.ch; }
        if (addLine < 0) { addCh += pos.ch; }
        toKeepEnd.forEach(function (array) {
            // Push to correct lines
            array[1] += addLine;
            if (typeof(array[4]) !== "undefined") { array[3] += addLine; }
            // If they have markers on my end line, push their "ch"
            if (array[1] === posEndLine) {
                array[2] += addCh;
                // If they have no end line, it means end line === start line,
                // so we also push their end offset
                if (typeof(array[4]) === "undefined" && typeof(array[3]) !== "undefined") {
                    array[3] += addCh;
                } else if (typeof(array[4]) !== "undefined" && array[3] === posEndLine) {
                    array[4] += addCh;
                }
            }
        });

        if (toKeep.length && toJoin && typeof(toJoin.endLine) !== "undefined"
                                    && typeof(toJoin.endCh) !== "undefined") {
            // Make sure the marks are joined correctly:
            // fix the start position of the marks to keep
            // Note: we must preserve the same end for this mark if it was single line!
            if (typeof(toKeepEnd[0][4]) === "undefined") { // Single line
                toKeepEnd[0][4] = toKeepEnd[0][3] || (toKeepEnd[0][2]+1); // preserve end ch
                toKeepEnd[0][3] = toKeepEnd[0][1]; // preserve end line
            }
            toKeepEnd[0][1] = toJoin.endLine;
            toKeepEnd[0][2] = toJoin.endCh;
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

        var localDoc = CodeMirror.canonicalize(editor.getValue());

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
        Env.editor.getAllMarks().forEach(function (marker) {
            if (marker.attributes && marker.attributes['data-type'] === 'authormark') {
                marker.clear();
            }
        });

        if (!Env.enabled) { return; }

        debug('error', 'setMarks');
        debug('log', Env.authormarks.marks);

        var authormarks = Env.authormarks;
        authormarks.marks.forEach(function (mark) {
            var uid = mark[0];
            if (uid !== -1 && (!authormarks.authors || !authormarks.authors[uid])) { return; }
            var from = {};
            var to = {};
            from.line = mark[1];
            from.ch = mark[2];
            if (mark.length === 3)  {
                to.line = mark[1];
                to.ch = mark[2]+1;
            } else if (mark.length === 4) {
                to.line = mark[1];
                to.ch = mark[3];
            } else if (mark.length === 5) {
                to.line = mark[3];
                to.ch = mark[4];
            }

            // Remove marks that are placed under this one
            try {
                Env.editor.findMarks(from, to).forEach(function (mark) {
                    if (!mark || !mark.attributes || mark.attributes['data-type'] !== 'authormark') { return; }
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
            color: userData.color
        };
        if (!old || (old.name === userData.name && old.color === userData.color)) { return; }
        return true;
    };

    var localChange = function (Env, change, cb) {
        cb = cb || function () {};

        if (!Env.enabled) { return void cb(); }

        debug('error', 'Local change');
        debug('log', change, true);

        if (change.origin === "setValue") {
            // If the content is changed from a remote patch, we call localChange
            // in "onContentUpdate" directly
            return;
        }
        if (change.text === undefined || ['+input', 'paste'].indexOf(change.origin) === -1) {
            return void cb();
        }

        // add new author mark if text is added. marks from removed text are removed automatically

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

        // If my text is inside an existing mark:
        //  * if it's my mark, do nothing
        //  * if it's someone else's mark, break it
        // We can only have one author mark at a given position, but there may be
        // another mark (cursor selection...) at this position so we use ".some"
        var toSplit, abort;


        Env.editor.findMarks(change.from, to_add).some(function (mark) {
            if (!mark.attributes) { return; }
            if (mark.attributes['data-type'] !== 'authormark') { return; }
            if (mark.attributes['data-uid'] !== Env.myAuthorId) {
                toSplit = {
                    mark: mark,
                    uid: mark.attributes['data-uid']
                };
            } else {
                // This is our mark: abort to avoid making a new one
                abort = true;
            }

            return true;
        });
        if (abort) { return void cb(); }

        // Add my data to the doc if it's missing
        if (!Env.authormarks.authors[Env.myAuthorId]) {
            setMyData(Env);
        }

        if (toSplit && toSplit.mark && typeof(toSplit.uid) !== "undefined") {
            // Break the other user's mark if needed
            var _pos = toSplit.mark.find();
            toSplit.mark.clear();
            addMark(Env, _pos.from, change.from, toSplit.uid); // their mark, 1st part
            addMark(Env, change.from, to_add, Env.myAuthorId); // my mark
            addMark(Env, to_add, _pos.to, toSplit.uid); // their mark, 2nd part
        } else {
            // Add my mark
            addMark(Env, change.from, to_add, Env.myAuthorId);
        }

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
