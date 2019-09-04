define([
    '/common/common-hash.js',

    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function (Hash, Crypto, Listmap, ChainPad) {
    var SF = {};

    SF.load = function (config, id, data, cb) {
        var network = config.network;
        var manager = config.manager;

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
        //store.sharedFolders[id] = rt; // XXX
        rt.proxy.on('ready', function (info) {
            manager.addProxy(id, rt.proxy, info.leave);
            cb(rt, info.metadata);
        });
        // XXX
        /*if (store.driveEvents) {
            registerProxyEvents(rt.proxy, id);
        }*/
        return rt;
    };
    

    return SF;
});
