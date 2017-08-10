define([], function () {
    var create = function (sframeChan) {
        var personalMetadata = 'uninitialized';
        var myID = 'uninitialized';
        var members = [];
        var metadataObj = 'unintialized';
        var dirty = true;
        var changeHandlers = [];

        var checkUpdate = function () {
            if (!dirty) { return; }
            if (metadataObj === 'uninitialized') { throw new Error(); }
            if (myID === 'uninitialized') { throw new Error(); }
            if (personalMetadata === 'uninitialized') { throw new Error(); }
            var mdo = {};
            Object.keys(metadataObj).forEach(function (x) {
                if (members.indexOf(x) === -1) { return; }
                mdo[x] = metadataObj[x];
            });
            mdo[myID] = personalMetadata;
            metadataObj = mdo;
            dirty = false;
            changeHandlers.forEach(function (f) { f(); });
        };
        var change = function () {
            dirty = true;
            setTimeout(checkUpdate);
        };

        sframeChan.on('EV_USERDATA_UPDATE', function (ev) {
            personalMetadata = ev;
            change();
        });
        sframeChan.on('EV_RT_CONNECT', function (ev) {
            myID = ev.myID;
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
            metadataChange: function (meta) {
                metadataObj = meta;
                change();
            },
            getMetadata: function () {
                checkUpdate();
                return metadataObj;
            },
            onChange: function (f) { changeHandlers.push(f); }
        });
    };
    return Object.freeze({ create: create });
});