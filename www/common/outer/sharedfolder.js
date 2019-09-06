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
    SF.load = function (config, id, data, cb) {
        var network = config.network;
        var store = config.store;
        var manager = store.manager;
        var handler = store.handleSharedFolder;

        var parsed = Hash.parsePadUrl(data.href);
        var secret = Hash.getSecrets('drive', parsed.hash, data.password);
        var owners = data.owners;
        var listmapConfig = {
            data: {},
            channel: secret.channel,
            readOnly: false,
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
        var rt = Listmap.create(listmapConfig);
        rt.proxy.on('ready', function (info) {
            manager.addProxy(id, rt.proxy, info.leave);
            cb(rt, info.metadata);
        });
        if (handler) { handler(id, rt); }
        return rt;
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
