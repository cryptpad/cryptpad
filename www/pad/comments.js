define([
    'json.sortify',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/customize/messages.js'
], function (Sortify, Util, UI, Messages) {
    var Comments = {};

    var COMMENTS = {
        authors: {},
        messages: {}
    };

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

    var onChange = function (Env) {
        var md = Util.clone(Env.metadataMgr.getMetadata());
        Env.comments = md.comments;
        if (!Env.comments) { Env.comments = Util.clone(COMMENTS); }
    };

    Comments.create = function (cfg) {
        var Env = cfg;
        Env.comments = Util.clone(COMMENTS);

        Env.editor.plugins.comments.addComment = function (uid, addMark) {
            if (!Env.comments) { Env.comments = Util.clone(COMMENTS); }

            UI.prompt("Message", "", function (val) { // XXX
                if (!val) { return; }
                if (!editor.getSelection().getSelectedText()) {
                    // text has been deleted by another user while we were typing our comment?
                    return void UI.warn(Messages.error);
                }
                var myId = updateAuthorData(Env);
                Env.comments.messages[uid] = {
                    user: myId,
                    time: +new Date(),
                    message: val
                };
                var md = Util.clone(Env.metadataMgr.getMetadata());
                md.comments = Util.clone(Env.comments);
                Env.metadataMgr.updateMetadata(md);

                addMark();

                Env.framework.localChange();
            });
        };

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
        };
    };

    return Comments;
});
