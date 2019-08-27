define(['json.sortify'], function (Sortify) {
    var UNINIT = 'uninitialized';
    var create = function (sframeChan) {
        var meta = UNINIT;
        var members = [];
        var metadataObj = UNINIT;
        // This object reflects the metadata which is in the document at this moment.
        // Normally when a person leaves the pad, everybody sees them leave and updates
        // their metadata, this causes everyone to fight to change the document and
        // operational transform doesn't like it. So this is a lazy object which is
        // only updated either:
        // 1. On changes to the metadata that come in from someone else
        // 2. On changes connects, disconnects or changes to your own metadata
        var metadataLazyObj = UNINIT;
        var priv = {};
        var dirty = true;
        var changeHandlers = [];
        var lazyChangeHandlers = [];
        var titleChangeHandlers = [];

        // When someone leaves the document, their metadata is removed from our metadataObj
        // but it is not removed instantly from the chainpad document metadata. This is
        // the result of the lazy object: if we had to remove the metadata instantly, all
        // the remaining members would try to push a patch to do it, and it could create
        // conflicts. Their metadata is instead removed from the chainpad doc only when
        // someone calls onLocal to make another change.
        // The leaving user is not visible in the userlist UI because we filter it using
        // the list of "members" (netflux ID currently online).
        // Our Problem:
        // With the addition of shared workers, a user can leave and join back with the same
        // netflux ID (just reload the pad). If nobody has made any change in the mean time,
        // their metadata will still be in the document, but they won't be in our metadataObj.
        // This causes the presence of a "viewer" instead of an editor, because they don't
        // have user data.
        // To fix this problem, the metadata manager can request "syncs" from a chainpad app,
        // and the app should trigger a "metadataMgr.updateMetadata(data)" in the handler.
        // See "metadataMgr.onRequestSync" in sframe-app-framework for an example.
        var syncHandlers = [];

        var rememberedTitle;

        var checkUpdate = function (lazy) {
            if (!dirty) { return; }
            if (meta === UNINIT) { throw new Error(); }
            if (metadataObj === UNINIT) {
                metadataObj = {
                    defaultTitle: meta.doc.defaultTitle,
                    //title: meta.doc.defaultTitle,
                    type: meta.doc.type,
                    users: {},
                    authors: {}
                };
                metadataLazyObj = JSON.parse(JSON.stringify(metadataObj));
            }
            if (!metadataObj.users) { metadataObj.users = {}; }
            if (!metadataLazyObj.users) { metadataLazyObj.users = {}; }

            if (!metadataObj.type) { metadataObj.type = meta.doc.type; }
            if (!metadataLazyObj.type) { metadataLazyObj.type = meta.doc.type; }

            var mdo = {};
            // We don't want to add our user data to the object multiple times.
            Object.keys(metadataObj.users).forEach(function (x) {
                if (members.indexOf(x) === -1) { return; }
                mdo[x] = metadataObj.users[x];
            });
            if (!priv.readOnly) {
                mdo[meta.user.netfluxId] = meta.user;
            }
            metadataObj.users = mdo;

            // Always update the userlist in the lazy object, otherwise it may be outdated
            // and metadataMgr.updateMetadata() won't do anything, and so we won't push events
            // to the userlist UI ==> phantom viewers
            var lazyUserStr = Sortify(metadataLazyObj.users[meta.user.netfluxId]);
            dirty = false;
            if (lazy || lazyUserStr !== Sortify(meta.user)) {
                metadataLazyObj = JSON.parse(JSON.stringify(metadataObj));
                lazyChangeHandlers.forEach(function (f) { f(); });
            } else {
                metadataLazyObj.users = JSON.parse(JSON.stringify(mdo));
            }

            if (metadataObj.title !== rememberedTitle) {
                rememberedTitle = metadataObj.title;
                titleChangeHandlers.forEach(function (f) {
                    f(metadataObj.title, metadataObj.defaultTitle);
                });
            }

            changeHandlers.forEach(function (f) { f(); });
        };
        var change = function (lazy) {
            dirty = true;
            setTimeout(function () {
                checkUpdate(lazy);
            });
        };
        var addAuthor = function () {
            if (!meta.user || !meta.user.netfluxId || !priv || !priv.edPublic) { return; }
            var authors = metadataObj.authors || {};
            var old = Sortify(authors);
            if (!authors[priv.edPublic]) {
                authors[priv.edPublic] = {
                    nId: [meta.user.netfluxId],
                    name: meta.user.name
                };
            } else {
                authors[priv.edPublic].name = meta.user.name;
                if (authors[priv.edPublic].nId.indexOf(meta.user.netfluxId) === -1) {
                    authors[priv.edPublic].nId.push(meta.user.netfluxId);
                }
            }
            if (Sortify(authors) !== old) {
                metadataObj.authors = authors;
                metadataLazyObj.authors = JSON.parse(JSON.stringify(authors));
                change();
            }
        };

        var netfluxId;
        var isReady = false;
        var readyHandlers = [];
        sframeChan.on('EV_METADATA_UPDATE', function (ev) {
            meta = ev;
            if (ev.priv) {
                priv = ev.priv;
            }
            if (netfluxId) {
                meta.user.netfluxId = netfluxId;
            }
            if (!isReady) {
                isReady = true;
                readyHandlers.forEach(function (f) { f(); });
            }
            change(true);
        });
        sframeChan.on('EV_RT_CONNECT', function (ev) {
            netfluxId = ev.myID;
            members = ev.members;
            if (!meta.user) { return; }
            meta.user.netfluxId = netfluxId;
            change(true);
        });
        sframeChan.on('EV_RT_JOIN', function (ev) {
            var idx = members.indexOf(ev);
            if (idx !== -1) { console.log('Error: ' + ev + ' is already in members'); return; }
            members.push(ev);
            if (!meta.user) { return; }
            change(false);
            syncHandlers.forEach(function (f) { f(); });
        });
        sframeChan.on('EV_RT_LEAVE', function (ev) {
            var idx = members.indexOf(ev);
            if (idx === -1) { console.log('Error: ' + ev + ' not in members'); return; }
            members.splice(idx, 1);
            if (!meta.user) { return; }
            change(false);
        });
        sframeChan.on('EV_RT_DISCONNECT', function () {
            members = [];
            if (!meta.user) { return; }
            change(true);
        });
        sframeChan.on('EV_RT_ERROR', function (err) {
            if (err.type !== 'EEXPIRED' && err.type !== 'EDELETED') { return; }
            members = [];
            if (!meta.user) { return; }
            change(true);
        });

        return Object.freeze({
            updateMetadata: function (m) {
                // JSON.parse(JSON.stringify()) reorders the json, so we have to use sortify even
                // if it's on our own computer
                if (!m) { return; }
                if (Sortify(metadataLazyObj) === Sortify(m)) { return; }
                metadataObj = JSON.parse(JSON.stringify(m));
                metadataLazyObj = JSON.parse(JSON.stringify(m));
                change(false);
            },
            updateTitle: function (t) {
                metadataObj.title = t;
                change(true);
            },
            getMetadata: function () {
                checkUpdate(false);
                return Object.freeze(JSON.parse(JSON.stringify(metadataObj)));
            },
            getMetadataLazy: function () {
                return metadataLazyObj;
            },
            onTitleChange: function (f) { titleChangeHandlers.push(f); },
            onChange: function (f) { changeHandlers.push(f); },
            onChangeLazy: function (f) { lazyChangeHandlers.push(f); },
            onRequestSync: function (f) { syncHandlers.push(f); },
            off: function (name, f) {
                var h = [];
                if (name === 'change') { h = changeHandlers; }
                else if (name === 'lazy') { h = lazyChangeHandlers; }
                else if (name === 'title') { h = titleChangeHandlers; }
                else if (name === 'sync') { h = syncHandlers; }
                var idx = h.indexOf(f);
                if (idx !== -1) { h.splice(idx, 1); }
            },
            isConnected : function () {
                return members.indexOf(meta.user.netfluxId) !== -1;
            },
            getViewers : function () {
                checkUpdate(false);
                var list = members.slice().filter(function (m) { return m.length === 32; });
                return list.length - Object.keys(metadataLazyObj.users).length;
            },
            getChannelMembers: function () { return members.slice(); },
            getPrivateData : function () {
                return priv;
            },
            getUserData : function () {
                return meta.user;
            },
            getNetfluxId : function () {
                return meta.user.netfluxId;
            },
            onReady: function (f) {
                if (isReady) { return void f(); }
                readyHandlers.push(f);
            },
            addAuthor: addAuthor,
        });
    };
    return Object.freeze({ create: create });
});
