define([], function () {
    var UNINIT = 'uninitialized';
    var create = function (sframeChan) {
        var meta = UNINIT;
        var members = [];
        var metadataObj = UNINIT;
        var dirty = true;
        var changeHandlers = [];

        var checkUpdate = function () {
            if (!dirty) { return; }
            if (meta === UNINIT) { throw new Error(); }
            if (metadataObj === UNINIT) {
                metadataObj = {
                    defaultTitle: meta.doc.defaultTitle,
                    title: meta.doc.defaultTitle,
                    type: meta.doc.type,
                    users: {}
                };
            }
            var mdo = {};
            // We don't want to add our user data to the object multiple times.
            //var containsYou = false;
            //console.log(metadataObj);
            console.log(metadataObj.users);
            Object.keys(metadataObj.users).forEach(function (x) {
                if (members.indexOf(x) === -1) { return; }
                mdo[x] = metadataObj.users[x];
                /*if (metadataObj.users[x].uid === meta.user.uid) {
                    //console.log('document already contains you');
                    containsYou = true;
                }*/
            });
            //if (!containsYou) { mdo[meta.user.netfluxId] = meta.user; }
            mdo[meta.user.netfluxId] = meta.user;
            metadataObj.users = mdo;

            dirty = false;
            changeHandlers.forEach(function (f) { f(); });
        };
        var change = function () {
            dirty = true;
            setTimeout(checkUpdate);
        };

        sframeChan.on('EV_METADATA_UPDATE', function (ev) {
            meta = ev;
            change();
        });
        sframeChan.on('EV_RT_CONNECT', function (ev) {
            meta.user.netfluxId = ev.myID;
            members = ev.members;
            change();
        });
        sframeChan.on('EV_RT_JOIN', function (ev) {
            members.push(ev);
            change();
        });
        sframeChan.on('EV_RT_LEAVE', function (ev) {
            var idx = members.indexOf(ev);
            if (idx === -1) { console.log('Error: ' + ev + ' not in members'); return; }
            members.splice(idx, 1);
            change();
        });
        sframeChan.on('EV_RT_DISCONNECT', function () {
            members = [];
            change();
        });

        return Object.freeze({
            updateMetadata: function (m) {
                if (JSON.stringify(metadataObj) === JSON.stringify(m)) { return; }
                metadataObj = m;
                change();
            },
            getMetadata: function () {
                checkUpdate();
                return Object.freeze(JSON.parse(JSON.stringify(metadataObj)));
            },
            onChange: function (f) { changeHandlers.push(f); },
            getNetfluxId: function () {
                return meta && meta.user && meta.user.netfluxId;
            },
            getUserlist: function () {
                var list = members.slice().filter(function (m) { return m.length === 32; });
                return list;
            }
        });
    };
    return Object.freeze({ create: create });
});
