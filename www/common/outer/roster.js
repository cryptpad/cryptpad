(function () {
var factory = function (Util, Hash, CPNetflux, Sortify, nThen, Crypto) {
    var Roster = {};

    /*
        roster: {
            state: {
                user0CurveKey: {
                    role: "OWNER|ADMIN|MEMBER",
                    profile: "",
                    mailbox: "",
                    name: "",
                    title: ""
                },
                user1CurveKey: {
                    ...
                }
            },
            metadata: {

            }
        }
    */

    var canCheckpoint = function (author, state) {
        // if you're here then you've received a checkpoint message
        // that you don't necessarily trust.

        // find the author's role from your knoweldge of the state
        var role = Util.find(state, ['author', 'role']);
        // and check if it is 'OWNER' or 'ADMIN'
        return ['OWNER', 'ADMIN'].indexOf(role) !== -1;
    };

    var isValidRole = function (role) {
        return ['OWNER', 'ADMIN', 'MEMBER'].indexOf(role) !== -1;
    };

    var canAddRole = function (author, role, state) {
        var authorRole = Util.find(state, [author, 'role']);
        if (!authorRole) { return false; }

        // nobody can add an invalid role
        if (!isValidRole(role)) { return false; }

        // owners can add any valid role they want
        if (authorRole === 'OWNER') { return true; }
        // admins can add other admins or members
        if (authorRole === "ADMIN") { return ['ADMIN', 'MEMBER'].indexOf(role) !== -1; }
        // (MEMBER, other) can't add anyone of any role
        return false;
    };

    var isValidId = function (id) {
        return typeof(id) === 'string' && id.length === 44;
    };

    var canDescribeTarget = function (author, curve, state) {
        // you must be in the group to describe anyone
        if (!state[curve]) { return false; }

        // anyone can describe themself
        if (author === curve && state[curve]) { return true; }

        var authorRole = Util.find(state, [author, 'role']);
        var targetRole = Util.find(state, [curve, 'role']);

        // something is really wrong if there's no authorRole
        if (!authorRole) { return false; }

        // owners can do whatever they want
        if (authorRole === 'OWNER') { return true; }

        // admins can describe anyone escept owners
        if (authorRole === 'ADMIN' && targetRole !== 'OWNER') { return true; }

        // members can't describe others
        return false;
    };

    var canRemoveRole = function (author, role, state) {
        var authorRole = Util.find(state, [author, 'role']);
        if (!authorRole) { return false; }

        // owners can remove anyone they want
        if (authorRole === 'OWNER') { return true; }
        // admins can remove other admins or members
        if (authorRole === "ADMIN") { return ["ADMIN", "MEMBER"].indexOf(role) !== -1; }
        // MEMBERS and non-members cannot remove anyone of any role
        return false;
    };

    var shouldCheckpoint = function (state) {
        // 

        state = state;
    };

    shouldCheckpoint = shouldCheckpoint; // XXX lint

    var commands = Roster.commands = {};
    /*  Commands are functions with the signature
        (args_any, base46_author_string, roster_map, optional_base64_message_id) => boolean

        they:
        * throw if any of their arguments are invalid
        * return true if their application to previous state results in a change
        * mutate the local account of the current state

        changes to the state can be simulated locally before being sent.
        if the simulation throws or returns false, don't send.

    */

    // the author is trying to add someone to the roster
    // owners can add any role
    commands.ADD = function (args, author, roster) {
        if (!(args && typeof(args) === 'object' && !Array.isArray(args))) {
            throw new Error("INVALID ARGS");
        }

        if (typeof(roster.state) === 'undefined') {
            throw new Error("CANNOT_ADD_TO_UNITIALIZED_ROSTER");
        }

        var changed = false;
        Object.keys(args).forEach(function (curve) {
            // FIXME only allow valid curve keys, anything else is pollution
            if (curve.length !== 44) {
                console.log(curve, curve.length);
                throw new Error("INVALID_CURVE_KEY");
            }

            var data = args[curve];


            // ignore anything that isn't a proper object
            if (!data || typeof(data) !== 'object' || Array.isArray(data)) {
                return;
            }

            // ignore instructions to ADD someone who is already in the roster
            if (roster.state[curve]) { return; }

            if (!canAddRole(author, data.role, roster.state)) { return; }

            // this will result in a change
            changed = true;
            roster.state[curve] = data;
        });

        return changed;
    };

    commands.RM = function (args, author, roster) {
        if (!Array.isArray(args)) { throw new Error("INVALID_ARGS"); }

        if (typeof(roster.state) === 'undefined') {
            throw new Error("CANNOT_RM_FROM_UNITIALIZED_ROSTER");
        }

        var changed = false;
        args.forEach(function (curve) {
            if (isValidId(curve)) { throw new Error("INVALID_CURVE_KEY"); }

            // don't try to remove something that isn't there
            if (!roster.state[curve]) { return; }

            var role = roster.state[curve].role;

            if (!canRemoveRole(author, role, roster.state)) { return; }

            changed = true;
            delete roster.state[curve];
        });
        return changed;
    };

    commands.DESCRIBE = function (args, author, roster) {
        if (!args || typeof(args) !== 'object' || Array.isArray(args)) {
            throw new Error("INVALID_ARGUMENTS");
        }

        if (typeof(roster.state) === 'undefined') {
            throw new Error("CANNOT_DESCRIBE_MEMBERS_OF_UNITIALIZED_ROSTER");
        }

        var changed = false;
        Object.keys(args).forEach(function (curve) {
            if (!isValidId(curve)) { return; }
            if (!roster.state[curve]) { return; }

            if (!canDescribeTarget(author, curve, roster.state)) { return; }

            var data = args[curve];
            if (!data || typeof(data) !== 'object' || Array.isArray(data)) { return; }

            var current = roster.state[curve];
            Object.keys(data).forEach(function (key) {
                if (current[key] === data[key]) { return; }
                changed = true;
                current[key] = data[key];
            });
        });
        return changed;


        /*
            args: {
                userkey: {
                    field: newValue
                },
            }
        */

        // owners can update information about any team member
        // admins can update information about members
        // members can update information about themselves
        // non-members cannot update anything
        //roster = roster;
    };

    // XXX what about concurrent checkpoints? Let's solve for race conditions...
    commands.CHECKPOINT = function (args, author, roster) {
        // args: complete state

        // args should be a map
        if (!(args && typeof(args) === 'object' && !Array.isArray(args))) { throw new Error("INVALID_CHECKPOINT_STATE"); }

        if (typeof(roster.state) === 'undefined') {
            // either you're connecting from the beginning of the log
            // or from a trusted lastKnownHash.
            // Either way, initialize the roster state

            roster.state = args;
            return true;
        } else if (Sortify(args) !== Sortify(roster.state)) {
            // a checkpoint must reinsert the previous state
            throw new Error("CHECKPOINT_DOES_NOT_MATCH_PREVIOUS_STATE");
        }

        // otherwise, you're iterating over the log from a previous checkpoint
        // so you should know everyone's role

        // owners and admins can checkpoint. members and non-members cannot
        if (!canCheckpoint(author, roster)) { return false; }

        // set the state, and indicate that a change was made
        roster.state = args;
        return true;
    };

    var handleCommand = function (content, author, roster) {
        if (!(Array.isArray(content) && typeof(author) === 'string')) {
            throw new Error("INVALID ARGUMENTS");
        }

        var command = content[0];
        if (typeof(commands[command]) !== 'function') { throw new Error('INVALID_COMMAND'); }

        return commands[command](content[1], author, roster);
    };

    var clone = function (o) {
        return JSON.parse(JSON.stringify(o));
    };

    var simulate = function (content, author, roster) {
        return handleCommand(content, author, clone(roster));
    };

    Roster.create = function (config, _cb) {
        if (typeof(_cb) !== 'function') { throw new Error("EXPECTED_CALLBACK"); }
        var cb = Util.once(Util.mkAsync(_cb));

        if (!config.network) { return void cb("EXPECTED_NETWORK"); }
        if (!config.channel || typeof(config.channel) !== 'string' || config.channel.length !== 32) { return void cb("EXPECTED_CHANNEL"); }
        if (!config.owners || !Array.isArray(config.owners)) { return void cb("EXPECTED_OWNERS"); }
        if (!config.keys || typeof(config.keys) !== 'object') { return void cb("EXPECTED_CRYPTO_KEYS"); }
        if (!config.anon_rpc) { return void cb("EXPECTED_ANON_RPC"); }

        var anon_rpc = config.anon_rpc;

        var keys = config.keys;

        var me = keys.myCurvePublic;
        var channel = config.channel;

        var ref = {};
        var roster = {};

        var events = {
            change: Util.mkEvent(),
        };

        roster.on = function (key, handler) {
            if (typeof(events[key]) !== 'object') { throw new Error("unsupported event"); }
            events[key].reg(handler);
        };

        roster.off = function (key, handler) {
            if (typeof(events[key]) !== 'object') { throw new Error("unsupported event"); }
            events[key].unreg(handler);
        };

        roster.getState = function () {
            return ref.state;
        };

        var ready = false;
        var onReady = function (/* info */) {
            ready = true;
            cb(void 0, roster);
        };

        // onError (deleted or expired)
            // you won't be able to connect

        // onMetadataUpdate
            // update owners?

        // deleted while you are open
        // emit an event
        var onChannelError = function (info) {
            if (!ready) { return void cb(info); } // XXX make sure we don't reconnect
            console.error("CHANNEL_ERROR", info);
        };

        var onConnect = function (/* wc, sendMessage */) {
            console.log("ROSTER CONNECTED");
        };

        var onMessage = function (msg, user, vKey, isCp , hash, author) {
            //console.log("onMessage");
            //console.log(typeof(msg), msg);
            var parsed = Util.tryParse(msg);

            if (!parsed) { return void console.error("could not parse"); }

            var changed;
            try {
                changed = handleCommand(parsed, author, ref);
            } catch (err) {
                console.error(err);
            }

            if (changed) { events.change.fire(); }

            return void console.log(msg);
        };


        var isReady = function () {
             return Boolean(ready && me);
        };

        var metadata, crypto;
        var send = function (msg, cb) {
            if (!isReady()) { return void cb("NOT_READY"); }

            var changed = false;
            try {
                // simulate the command before you send it
                changed = simulate(msg, keys.myCurvePublic, ref);
            } catch (err) {
                return void cb(err);
            }
            if (!changed) { return void cb("NO_CHANGE"); }

            var ciphertext = crypto.encrypt(Sortify(msg));

            anon_rpc.send('WRITE_PRIVATE_MESSAGE', [
                channel,
                ciphertext
            ], function (err) {
                if (err) { return void cb(err); }
                cb();
            });
        };

        roster.init = function (_data, cb) {
            var data = clone(_data);
            data.role = 'OWNER';
            var state = {};
            state[me] = data;
            send([ 'CHECKPOINT', state ], cb);
        };

        // commands
        roster.checkpoint = function () {
            send([ 'CHECKPOINT', ref.state], cb);
        };

        roster.add = function (data, cb) {
            send([ 'ADD', data ], cb);
        };

        roster.remove = function (data, cb) {
            send([ 'REMOVE', data ], cb);
        };

        roster.describe = function (data, cb) {
            send(['DESCRIBE', data], cb);
        };

        nThen(function (w) {
            // get metadata so we know the owners and validateKey
            anon_rpc.send('GET_METADATA', channel, function (err, data) {
                if (err) {
                    w.abort();
                    return void console.error(err);
                }
                metadata = ref.metadata = (data && data[0]) || undefined;
                console.log("TEAM_METADATA", metadata);
            });
        }).nThen(function (w) {
            if (!config.keys.teamEdPublic && metadata && metadata.validateKey) {
                config.keys.teamEdPublic = metadata.validateKey;
            }

            try {
                crypto = Crypto.Team.createEncryptor(config.keys);
            } catch (err) {
                w.abort();
                return void cb(err);
            }
        }).nThen(function () {
            CPNetflux.start({
                // if you don't have a lastKnownHash you will need the full history
                // passing -1 forces the server to send all messages, otherwise
                // malicious users with the signing key could send cp| messages
                // and fool new users into initializing their session incorrectly
                lastKnownHash: config.lastKnownHash || -1,

                network: config.network,
                channel: config.channel,

                crypto: crypto,
                validateKey: config.keys.teamEdPublic,

                owners: config.owners,

                onChannelError: onChannelError,
                onReady: onReady,
                onConnect: onConnect,
                onConnectionChange: function () {},
                onMessage: onMessage,

                noChainPad: true,
            });
        });
    };

    return Roster;
};

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory(
            require("../common-util"),
            require("../common-hash"),
            require("../../bower_components/chainpad-netflux/chainpad-netflux.js"),
            require("../../bower_components/json.sortify"),
            require("nthen"),
            require("../../bower_components/chainpad-crypto/crypto")
        );
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([
            '/common/common-util.js',
            '/common/common-hash.js',
            '/bower_components/chainpad-netflux/chainpad-netflux.js',
            '/bower_compoents/json.sortify/dist/JSON.sortify.js',
            '/bower_components/nthen/index.js',
            '/bower_components/chainpad-crypto/crypto.js'
            //'/bower_components/tweetnacl/nacl-fast.min.js',
        ], function (Util, Hash, CPNF, Sortify, nThen, Crypto) {
            return factory.apply(null, [
                Util,
                Hash,
                CPNF,
                Sortify,
                nThen,
                Crypto
            ]);
        });
    } else {
        // I'm not gonna bother supporting any other kind of instanciation
    }
}());
