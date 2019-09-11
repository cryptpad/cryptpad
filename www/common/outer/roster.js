(function () {
var factory = function (Util, Hash, CPNetflux) {
    var Roster = {};

    Roster.commands = {};

    Roster.create = function (config, _cb) {
        if (typeof(_cb) !== 'function') { throw new Error("EXPECTED_CALLBACK"); }
        var cb = Util.once(Util.mkAsync(_cb));

        if (!config.network) { return void cb("EXPECTED_NETWORK"); }
        if (!config.channel) { return void cb("EXPECTED_CHANNEL"); }
        if (!config.owners) { return void cb("EXPECTED_OWNERS"); }
        if (!config.crypto) { return void cb("EXPECTED_CRYPTO"); }

        var roster = {};

        /*  Commands
            * addUser(key, role) // owner, member
            * describeUser(key, data) // mailbox, role
            * removeUser(key)
        */

        /*  Events
            * checkpoint(id)
            * description(data)
            * metadata change
        */

        var ready = false;
        var onReady = function (/* info */) {
            ready = true;
            cb(void 0, roster);
        };

        var onChannelError = function (info) {
            if (!ready) { return void cb(info); } // XXX make sure we don't reconnect 
            console.error("CHANNEL_ERROR", info);
        };

        var onConnect = function (/* wc, sendMessage */) {
            Util.both(Util.bake(console.log, "onConnect"), console.log).apply(null, arguments);
        };

        var onMessage = function (msg, user, vKey, isCp, hash /*, author */) {
            if (isCp) { roster.lastKnownCp = hash; }
            console.log("onMessage");
            console.log.apply(null, arguments);
        };


        CPNetflux.start({
            lastKnownHash: config.lastKnownHash,

            network: config.network,
            channel: config.channel,

            crypto: config.crypto,
            validateKey: config.validateKey,

            owners: config.owners,

            onChannelError: onChannelError,
            onReady: onReady,
            onConnect: onConnect,
            onConnectionChange: function () {},
            onMessage: onMessage,

            noChainPad: true,
        });
    };

    return Roster;
};

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(
            require("../common-util"),
            require("../common-hash"),
            require("../../bower_components/chainpad-netflux/chainpad-netflux.js")
        );
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/common/common-util.js',
            '/common/common-hash.js',
            '/bower_components/chainpad-netflux/chainpad-netflux.js',
            //'/bower_components/tweetnacl/nacl-fast.min.js',
        ], function (Util, Hash, CPNF) {
            return factory.apply(null, [
                Util,
                Hash,
                CPNF
            ]);
        });
    } else {
        // I'm not gonna bother supporting any other kind of instanciation
    }
}());
