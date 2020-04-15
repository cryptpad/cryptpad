define([
    '/common/common-util.js',
    '/common/sframe-common-codemirror.js',
    '/customize/messages.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function (Util, SFCodeMirror, Messages, ChainPad) {
    var Markers = {};

    Messages.cba_writtenBy = 'Written by <em>{0}</em>';

    var MARK_OPACITY = 90;
    var addMark = function (Env, from, to, uid) {
        var author = Env.authormarks.authors[uid] || {};
        uid = Number(uid);
        var name = Util.fixHTML(author.name || Messages.anonymous);
        return Env.editor.markText(from, to, {
            inclusiveLeft: uid === Env.myAuthorId,
            inclusiveRight: uid === Env.myAuthorId,
            css: "background-color: " + author.color + MARK_OPACITY,
            attributes: {
                title: Messages._getKey('cba_writtenBy', [name]),
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
    var parseMark = Markers.parseMark = function (array) {
        if (!Array.isArray(array)) { return {}; }
        var multiline = typeof(array[4]) !== "undefined";
        var singleChar = typeof(array[3]) === "undefined";
        return {
            startLine: array[1],
            startCh: array[2],
            endLine: multiline ? array[3] : array[1],
            endCh: singleChar ? (array[2]+1) : (multiline ? array[4] : array[3])
        };
    };

    var setAuthorMarks = function (Env, authormarks) {
        authormarks = authormarks || {};
        if (!authormarks.marks) { authormarks.marks = []; }
        if (!authormarks.authors) { authormarks.authors = {}; }
        Env.oldMarks = Env.authormarks;
        Env.authormarks = authormarks;
    };

    var getAuthorMarks = function (Env) {
        return Env.authormarks;
    };

    var updateAuthorMarks = function (Env) {
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
        Env.authormarks.marks = _marks.filter(Boolean);
    };

    // Remove marks added by OT and fix the incorrect ones
    // first: data about the change with the lowest offset
    // last: data about the change with the latest offset
    // in the comments, "I" am "first"
    var fixMarks = function (first, last, content, toKeepEnd) {
        var toKeep = [];

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
        var toJoin = {};
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

        // If we still have markers in "first", store the last one so that we can "join"
        // everything at the end
        if (first.marks.length) {
            var toJoinMark = first.marks[first.marks.length - 1].slice();
            toJoin = parseMark(toJoinMark);
        }

        // Add the new markers to the result
        Array.prototype.unshift.apply(toKeepEnd, toKeep);

        // Fix their offset: compute added lines and added characters on the last line
        // using the chainpad operation data (toInsert and toRemove)
        var pos = SFCodeMirror.posToCursor(first.offset, content);
        var removed = content.slice(first.offset, first.offset + first.toRemove).split('\n');
        var added = first.toInsert.split('\n');
        var addLine = added.length - removed.length;
        var addCh = added[added.length - 1].length - removed[removed.length - 1].length;
        if (addLine > 0) { addCh -= pos.ch; }
        toKeepEnd.forEach(function (array) {
            // Push to correct lines
            array[1] += addLine;
            if (typeof(array[4]) !== "undefined") { array[3] += addLine; }
            // If they have markers on my end line, push their "ch"
            if (array[1] === toJoin[1]) {
                array[2] += addCh;
                // If they have no end line, it means end line === start line,
                // so we also push their end offset
                if (!array[4] && array[3]) { array[3] += addCh; }
            }
        });

        if (toKeep.length && toJoin) {
            // Make sure the marks are joined correctly:
            // fix the start position of the marks to keep
            toKeepEnd[0][1] = toJoin.endLine;
            toKeepEnd[0][2] = toJoin.endCh;
        }
    };

    var checkAuthors = function (Env, userDoc) {
        var chainpad = Env.framework._.cpNfInner.chainpad;
        var editor = Env.editor;
        var CodeMirror = Env.CodeMirror;
        var oldMarks = Env.oldMarks;

        setAuthorMarks(Env, userDoc.authormarks);

        var authDoc = JSON.parse(chainpad.getAuthDoc() || '{}');
        if (!authDoc.content || !userDoc.content) { return; }
        if (authDoc.content === userDoc.content) { return; } // No uncommitted work

        if (!userDoc.authormarks || !Array.isArray(userDoc.authormarks.marks)) { return; }

        var localDoc = CodeMirror.canonicalize(editor.getValue());

        var commonParent = chainpad.getAuthBlock().getParent().getContent().doc;
        var content = JSON.parse(commonParent || '{}').content || '';

        var theirOps = ChainPad.Diff.diff(content, authDoc.content);
        var myOps = ChainPad.Diff.diff(content, localDoc);

        if (!myOps.length || !theirOps.length) { return; }

        // If I have uncommited content when receiving a remote patch, all the operations
        // placed after someone else's changes will create marker issues. We have to fix it
        var ops = {};

        var myTotal = 0;
        var theirTotal = 0;
        var parseOp = function (me) {
            return function (op) {
                var size = (op.toInsert.length - op.toRemove);

                ops[op.offset] = {
                    me: me,
                    offset: op.offset,
                    toInsert: op.toInsert,
                    toRemove: op.toRemove,
                    size: size,
                    marks: (me ? (oldMarks && oldMarks.marks)
                               : (authDoc.authormarks && authDoc.authormarks.marks)) || [],
                    doc: me ? localDoc : authDoc.content
                };

                if (me) { myTotal += size; }
                else { theirTotal += size; }
            };
        };
        myOps.forEach(parseOp(true));
        theirOps.forEach(parseOp(false));

        var sorted = Object.keys(ops).map(Number);
        sorted.sort().reverse();

        // We start from the end so that we don't have to fix the offsets everytime
        var prev;
        var toKeepEnd = [];
        sorted.forEach(function (offset) {
            var op = ops[offset];

            // Not the same author? fix!
            if (prev && prev.me !== op.me) {
                // Provide the new "totals"
                prev.total = prev.me ? myTotal : theirTotal;
                op.total = op.me ? myTotal : theirTotal;
                // Fix the markers
                fixMarks(op, prev, content, toKeepEnd);
            }

            if (op.me) { myTotal -= op.size; }
            else { theirTotal -= op.size; }
            prev = op;
        });

        // We now have all the markers located after the first operation (ordered by offset).
        // Prepend the markers placed before this operation
        var first = ops[sorted[sorted.length - 1]];
        if (first) { Array.prototype.unshift.apply(toKeepEnd, first.marks); }

        // Commit our new markers
        Env.authormarks.marks = toKeepEnd;
    };

    var setMarks = function (Env) {
        // on remote update: remove all marks, add new marks
        Env.editor.getAllMarks().forEach(function (marker) {
            if (marker.attributes && marker.attributes['data-type'] === 'authormark') {
                marker.clear();
            }
        });
        var authormarks = Env.authormarks;
        authormarks.marks.forEach(function (mark) {
            var uid = mark[0];
            if (!authormarks.authors || !authormarks.authors[uid]) { return; }
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
            Env.editor.findMarks(from, to).forEach(function (mark) {
                if (mark.attributes['data-type'] !== 'authormark') { return; }
                mark.clear();
            });

            addMark(Env, from, to, uid);
        });
    };

    var setMyData = function (Env) {
        var userData = Env.common.getMetadataMgr().getUserData();
        var old = Env.authormarks.authors[Env.myAuthorId];
        if (!old || (old.name === userData.data && old.color === userData.color)) { return; }
        Env.authormarks.authors[Env.myAuthorId] = {
            name: userData.name,
            curvePublic: userData.curvePublic,
            color: userData.color
        };
        return true;
    };

    var localChange = function (Env, change, cb) {
        cb = cb || function () {};

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
    var getAuthorId = function (Env) {
        var existing = Object.keys(Env.authormarks.authors || {});
        if (!Env.common.isLoggedIn()) { return authorUid(existing); }

        var userData = Env.common.getMetadataMgr().getUserData();
        var uid;
        existing.some(function (id) {
            var author = Env.authormarks.authors[id] || {};
            if (author.curvePublic !== userData.curvePublic) { return; }
            uid = Number(id);
            return true;
        });
        return uid || authorUid(existing);
    };

    var ready = function (Env) {
        Env.myAuthorId = getAuthorId(Env);
        var changed = setMyData(Env);
        if (changed) {
            Env.framework.localChange();
            setMarks(Env);
        }
    };

    Markers.create = function (config) {
        var Env = config;
        setAuthorMarks(Env);
        Env.myAuthorId = 0;

        var metadataMgr = Env.common.getMetadataMgr();
        metadataMgr.onChange(function () {
            // Update my data
            var changed = setMyData(Env);
            if (changed) {
                Env.framework.localChange();
                setMarks(Env);
            }
        });

        var call = function (f) {
            return function () {
                [].unshift.call(arguments, Env);
                return f.apply(null, arguments);
            };
        };


        return {
            addMark: call(addMark),
            setAuthorMarks: call(setAuthorMarks),
            getAuthorMarks: call(getAuthorMarks),
            updateAuthorMarks: call(updateAuthorMarks),
            checkAuthors: call(checkAuthors),
            setMarks: call(setMarks),
            localChange: call(localChange),
            ready: call(ready),
        };
    };

    return Markers;
});
