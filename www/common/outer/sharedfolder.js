define([
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/userObject.js',

    '/bower_components/nthen/index.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function (Hash, Util, UserObject,
             nThen, Crypto, Listmap, ChainPad) {
    var SF = {};

    /* load
        create and load a proxy using listmap for a given shared folder
        - config: network and "manager" (either the user one or a team manager)
        - id: shared folder id
    */

    var allSharedFolders = {};

    // No version: visible edit
    // Version 2: encrypted edit links
    SF.checkMigration = function (secondaryKey, proxy, uo, cb) {
        if (true) { // XXX remove this block to enable migration at load time
            // FIXME history
            return void cb();
        }
        var drive = proxy.drive || proxy;
        // View access: can't migrate
        if (!secondaryKey) { return void cb(); }
        // Already migrated: nothing to do
        if (drive.version >= 2) { return void cb(); }
        // Not yet migrating: migrate
        if (!drive.migrateRo) { return void uo.migrateReadOnly(cb); }
        // Already migrating: wait for the end...
        var done = false;
        var to;
        var it = setInterval(function () {
            if (drive.version >= 2) {
                done = true;
                clearTimeout(to);
                clearInterval(it);
                return void cb();
            }
        }, 100);
        to = setTimeout(function () {
            clearInterval(it);
            uo.migrateReadOnly(function () {
                done = true;
                cb();
            });
        }, 20000);
        var path = proxy.drive ? ['drive', 'version'] : ['version'];
        proxy.on('change', path, function () {
            if (done) { return; }
            if (drive.version >= 2) {
                done = true;
                clearTimeout(to);
                clearInterval(it);
                cb();
            }
        });
    };

    SF.load = function (config, id, data, _cb) {
        var cb = Util.once(_cb);
        var network = config.network;
        var store = config.store;
        var teamId = store.id || -1;
        var handler = store.handleSharedFolder;

        var href = store.manager.user.userObject.getHref(data);

        var parsed = Hash.parsePadUrl(href);
        var secret = Hash.getSecrets('drive', parsed.hash, data.password);
        var secondaryKey = secret.keys.secondaryKey;

        var sf = allSharedFolders[secret.channel];
        if (sf && sf.readOnly && secondaryKey) {
            // We were in readOnly mode and now we know the edit keys!
            SF.upgrade(secret.channel, secret);
        }
        if (sf && sf.ready && sf.rt) {
            // The shared folder is already loaded, return its data
            setTimeout(function () {
                var leave = function () { SF.leave(secret.channel, teamId); };
                var uo = store.manager.addProxy(id, sf.rt, leave, secondaryKey);
                SF.checkMigration(secondaryKey, sf.rt.proxy, uo, function () {
                    cb(sf.rt, sf.metadata);
                });
            });
            sf.team.push(teamId);
            if (handler) { handler(id, sf.rt); }
            return sf.rt;
        }
        if (sf && sf.queue && sf.rt) {
            // The shared folder is loading, add our callbacks to the queue
            sf.queue.push({
                cb: cb,
                store: store,
                id: id
            });
            sf.team.push(teamId);
            if (handler) { handler(id, sf.rt); }
            return sf.rt;
        }

        sf = allSharedFolders[secret.channel] = {
            queue: [{
                cb: cb,
                store: store,
                id: id
            }],
            team: [store.id || -1],
            readOnly: Boolean(secondaryKey)
        };

        var owners = data.owners;
        var listmapConfig = {
            data: {},
            channel: secret.channel,
            readOnly: Boolean(secondaryKey),
            crypto: Crypto.createEncryptor(secret.keys),
            userName: 'sharedFolder',
            logLevel: 1,
            ChainPad: ChainPad,
            classic: true,
            network: network,
            metadata: {
                validateKey: secret.keys.validateKey || undefined,
                owners: owners
            }
        };
        var rt = sf.rt = Listmap.create(listmapConfig);
        rt.proxy.on('ready', function (info) {
            if (!sf.queue) {
                return;
            }
            sf.leave = info.leave;
            sf.metadata = info.metadata;
            sf.queue.forEach(function (obj) {
                var leave = function () { SF.leave(secret.channel, teamId); };
                var uo = obj.store.manager.addProxy(obj.id, rt, leave, secondaryKey);
                SF.checkMigration(secondaryKey, rt.proxy, uo, function () {
                    obj.cb(sf.rt, sf.metadata);
                });
            });
            sf.ready = true;
            delete sf.queue;
        });
        if (handler) { handler(id, rt); }
        return rt;
    };

    SF.upgrade = function (channel, secret) {
        var sf = allSharedFolders[channel];
        if (!sf || !sf.readOnly) { return; }
        if (!sf.rt.setReadOnly) { return; }

        if (!secret.keys || !secret.keys.editKeyStr) { return; }
        var crypto = Crypto.createEncryptor(secret.keys);
        sf.readOnly = false;
        sf.rt.setReadOnly(false, crypto);
    };

    SF.leave = function (channel, teamId) {
        var sf = allSharedFolders[channel];
        if (!sf) { return; }
        var clients = sf.teams;
        if (!Array.isArray(clients)) { return; }
        var idx = clients.indexOf(teamId);
        if (idx === -1) { return; }
        // Remove the selected team
        clients.splice(idx, 1);

        //If all the teams have closed this shared folder, stop it
        if (clients.length) { return; }
        if (sf.rt && sf.rt.stop) {
            sf.rt.stop();
        }
    };

    /* loadSharedFolders
        load all shared folder stored in a given drive
        - store: user or team main store
        - userObject: userObject associated to the main drive
        - handler: a function (sfid, rt) called for each shared folder loaded
    */
    SF.loadSharedFolders = function (Store, network, store, userObject, waitFor) {
        var shared = Util.find(store.proxy, ['drive', UserObject.SHARED_FOLDERS]) || {};
        // Check if any of our shared folder is expired or deleted by its owner.
        // If we don't check now, Listmap will create an empty proxy if it no longer exists on
        // the server.
        nThen(function (waitFor) {
            var checkExpired = Object.keys(shared).map(function (fId) {
                return shared[fId].channel;
            });
            Store.getDeletedPads(null, {list: checkExpired}, waitFor(function (chans) {
                if (chans && chans.error) { return void console.error(chans.error); }
                if (!Array.isArray(chans) || !chans.length) { return; }
                var toDelete = [];
                Object.keys(shared).forEach(function (fId) {
                    if (chans.indexOf(shared[fId].channel) !== -1
                        && toDelete.indexOf(fId) === -1) {
                        toDelete.push(fId);
                    }
                });
                toDelete.forEach(function (fId) {
                    var paths = userObject.findFile(Number(fId));
                    userObject.delete(paths, waitFor(), true);
                    delete shared[fId];
                });
            }));
        }).nThen(function (waitFor) {
            Object.keys(shared).forEach(function (id) {
                var sf = shared[id];
                SF.load({
                    network: network,
                    store: store
                }, id, sf, waitFor());
            });
        }).nThen(waitFor());
    };

    return SF;
});
