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

    var isMap = function (obj) {
        return Boolean(obj && typeof(obj) === 'object' && !Array.isArray(obj));
    };

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

    var canUpdateMetadata = function (author, state) {
        var authorRole = Util.find(state, [author, 'role']);
        return Boolean(authorRole && ['OWNER', 'ADMIN'].indexOf(authorRole) !== -1);
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

        // iterate over everything and make sure it is valid, throw if not
        Object.keys(args).forEach(function (curve) {
            // FIXME only allow valid curve keys, anything else is pollution
            if (!isValidId(curve)) {
                console.log(curve, curve.length);
                throw new Error("INVALID_CURVE_KEY");
            }
            // reject commands where the members are not proper objects
            if (!isMap(args[curve])) { throw new Error("INVALID_CONTENT"); }
            if (roster.state[curve]) { throw new Error("ALREADY_PRESENT"); }

            var data = args[curve];
            // if no role was provided, assume MEMBER
            if (typeof(data.role) !== 'string') { data.role = 'MEMBER'; }

            if (typeof(data.displayName) !== 'string') { throw new Error("DISPLAYNAME_REQUIRED"); }
            if (typeof(data.notifications) !== 'string') { throw new Error("NOTIFICATIONS_REQUIRED"); }
        });

        var changed = false;
        // then iterate again and apply it
        Object.keys(args).forEach(function (curve) {
            var data = args[curve];
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
            if (!isValidId(curve)) { throw new Error("INVALID_CURVE_KEY"); }

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
            throw new Error("NOT_READY");
        }

        // iterate over all the data and make sure it is valid, throw otherwise
        Object.keys(args).forEach(function (curve) {
            if (!isValidId(curve)) {  throw new Error("INVALID_ID"); }
            if (!roster.state[curve]) { throw new Error("NOT_PRESENT"); }

            if (!canDescribeTarget(author, curve, roster.state)) { throw new Error("INSUFFICIENT_PERMISSIONS"); }

            var data = args[curve];
            if (!isMap(data)) { throw new Error("INVALID_ARGUMENTS"); }

            var current = Util.clone(roster.state[curve]);

            // DESCRIBE commands must initialize a displayName if it isn't already present
            if (typeof(current.displayName) !== 'string' && typeof(data.displayName) !== 'string') { throw new Error('DISPLAYNAME_REQUIRED'); }

            // DESCRIBE commands must initialize a mailbox channel if it isn't already present
            if (typeof(current.notifications) !== 'string' && typeof(data.displayName) !== 'string') { throw new Error('NOTIFICATIONS_REQUIRED'); }
        });

        var changed = false;
        // then do a second pass and apply it if there were changes
        Object.keys(args).forEach(function (curve) {
            var current = Util.clone(roster.state[curve]);

            var data = args[curve];

            Object.keys(data).forEach(function (key) {
                if (current[key] === data[key]) { return; }
                current[key] = data[key];
            });

            if (Sortify(current) !== Sortify(roster.state[curve])) {
                changed = true;
                roster.state[curve] = current;
            }
        });

        return changed;
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

    // only admin/owner can change group metadata
    commands.METADATA = function (args, author, roster) {
        if (!isMap(args)) { throw new Error("INVALID_ARGS"); }

        if (!canUpdateMetadata(author, roster.state)) { throw new Error("INSUFFICIENT_PERMISSIONS"); }

        // validate inputs
        Object.keys(args).forEach(function (k) {
            // can't set metadata to anything other than strings
            // use empty string to unset a value if you must
            if (typeof(args[k]) !== 'string') { throw new Error("INVALID_ARGUMENTS"); }
        });

        var changed = false;
        // {topic, name, avatar} are all strings...
        Object.keys(args).forEach(function (k) {
            // ignore things that won't cause changes
            if (args[k] === roster.metadata[k]) { return; }

            changed = true;
            roster.metadata[k] = args[k];
        });
        return changed;
    };

    var handleCommand = function (content, author, roster) {
        if (!(Array.isArray(content) && typeof(author) === 'string')) {
            throw new Error("INVALID ARGUMENTS");
        }

        var command = content[0];
        if (typeof(commands[command]) !== 'function') { throw new Error('INVALID_COMMAND'); }

        return commands[command](content[1], author, roster);
    };

    var simulate = function (content, author, roster) {
        return handleCommand(content, author, Util.clone(roster));
    };

    var getMessageId = function (msgString) {
        return msgString.slice(0, 64);
    };

    Roster.create = function (config, _cb) {
        if (typeof(_cb) !== 'function') { throw new Error("EXPECTED_CALLBACK"); }
        var cb = Util.once(Util.mkAsync(_cb));

        if (!config.network) { return void cb("EXPECTED_NETWORK"); }
        if (!config.channel || typeof(config.channel) !== 'string' || config.channel.length !== 32) { return void cb("EXPECTED_CHANNEL"); }
        if (!config.keys || typeof(config.keys) !== 'object') { return void cb("EXPECTED_CRYPTO_KEYS"); }
        if (!config.anon_rpc) { return void cb("EXPECTED_ANON_RPC"); }


        var response = Util.response();

        var anon_rpc = config.anon_rpc;

        var keys = config.keys;

        var me = keys.myCurvePublic;
        var channel = config.channel;

        var ref = {
            // topic, name, and avatar are all guaranteed to be strings, though they might be empty
            metadata: {
                topic: '',
                name: '',
                avatar: '',
            },
            internal: {},
        };

        var roster = {};

        var events = {
            change: Util.mkEvent(),
            checkpoint: Util.mkEvent(),
        };

        roster.on = function (key, handler) {
            if (typeof(events[key]) !== 'object') { throw new Error("unsupported event"); }
            events[key].reg(handler);
            return roster;
        };

        roster.off = function (key, handler) {
            if (typeof(events[key]) !== 'object') { throw new Error("unsupported event"); }
            events[key].unreg(handler);
            return roster;
        };

        roster.once = function (key, handler) {
            if (typeof(events[key]) !== 'object') { throw new Error("unsupported event"); }
            var f = function () {
                handler.apply(null, Array.prototype.slice.call(arguments));
                events[key].unreg(f);
            };
            events[key].reg(f);
            return roster;
        };

        roster.getState = function () {
            if (!isMap(ref.state)) { return; }

            // XXX return parent element instead of .state ?
            return Util.clone(ref.state);
        };

        var webChannel;

        roster.stop = function () {
            if (webChannel && typeof(webChannel.leave) === 'function') {
                webChannel.leave();
            } else {
                console.log("FAILED TO LEAVE");
            }
        };

        var ready = false;
        var onReady = function (info) {
            //console.log("READY");
            webChannel = info;
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

        var isReady = function () {
             return Boolean(ready && me);
        };

        var onMessage = function (msg, user, vKey, isCp , hash, author) {
            var parsed = Util.tryParse(msg);

            if (!parsed) { return void console.error("could not parse"); }

            var changed;
            var error;
            try {
                changed = handleCommand(parsed, author, ref);
            } catch (err) {
                error = err;
            }

            var id = getMessageId(hash);

            if (response.expected(id)) {
                if (error) { return void response.handle(id, [error]); }
                try {
                    if (!changed) {
                        response.handle(id, ['NO_CHANGE']);
                    } else {
                        response.handle(id, [void 0, roster.getState()]);
                    }
                } catch (err) {
                    console.log('CAUGHT', err);
                }
            }
            /*
            else {
                if (isReady()) {
                    console.log("unexpected message [%s]", hash, msg);
                    console.log("received by %s", me);
                }
                // it was not your message, or it timed out...
            }*/

            // if a checkpoint was successfully applied, emit an event
            if (parsed[0] === 'CHECKPOINT' && changed) {
                events.checkpoint.fire(hash);
            } else if (changed) {
                events.change.fire();
            }
        };


        var metadata, crypto;
        var send = function (msg, cb) {
            if (!isReady()) {
                return void cb("NOT_READY");
            }

            var changed = false;
            try {
                // simulate the command before you send it
                changed = simulate(msg, keys.myCurvePublic, ref);
            } catch (err) {
                return void cb(err);
            }
            if (!changed) {
                return void cb("NO_CHANGE");
            }

            var ciphertext = crypto.encrypt(Sortify(msg));

            var id = getMessageId(ciphertext);

            //console.log("Sending with id [%s]", id, msg);
            //console.log();

            response.expect(id, cb, 3000);
            anon_rpc.send('WRITE_PRIVATE_MESSAGE', [
                channel,
                ciphertext
            ], function (err) {
                if (err) { return response.handle(id, [err]); }
            });
        };

        roster.init = function (_data, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));
            if (ref.state) { return void cb("ALREADY_INITIALIZED"); }
            var data = Util.clone(_data);
            data.role = 'OWNER';
            var state = {};
            state[me] = data;
            send([ 'CHECKPOINT', state ], cb);
        };

        // commands
        roster.checkpoint = function (_cb) {
            var cb = Util.once(Util.mkAsync(_cb));
            var state = ref.state;
            if (!state) { return cb("UNINITIALIZED"); }
            send([ 'CHECKPOINT', ref.state], cb);
        };

        roster.add = function (data, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));
            var state = ref.state;
            if (!state) { return cb("UNINITIALIZED"); }
            if (!isMap(data)) { return void cb("INVALID_ARGUMENTS"); }

            // don't add members that are already present
            // use DESCRIBE to amend
            Object.keys(data).forEach(function (curve) {
                if (!isValidId(curve) || isMap(state[curve])) { return delete data[curve]; }
            });

            send([ 'ADD', data ], cb);
        };

        roster.remove = function (data, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));
            var state = ref.state;
            if (!state) { return cb("UNINITIALIZED"); }

            if (!Array.isArray(data)) { return void cb("INVALID_ARGUMENTS"); }

            var toRemove = [];
            var current = Object.keys(state);
            data.forEach(function (curve) {
                // don't try to remove elements which are not in the current state
                if (current.indexOf(curve) === -1) { return; }
                toRemove.push(curve);
            });

            send([ 'RM', toRemove ], cb);
        };

        roster.describe = function (data, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));
            var state = ref.state;
            if (!state) { return cb("UNINITIALIZED"); }
            if (!isMap(data)) { return void cb("INVALID_ARGUMENTS"); }

            Object.keys(data).forEach(function (curve) {
                var member = data[curve];
                if (!isMap(member)) { delete data[curve]; }
                // don't send fields that won't result in a change
                Object.keys(member).forEach(function (k) {
                    if (member[k] === state[curve][k]) { delete member[k]; }
                });
            });

            send(['DESCRIBE', data], cb);
        };

        roster.metadata = function (data, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));
            var metadata = ref.metadata;
            if (!isMap(data)) { return void cb("INVALID_ARGUMENTS"); }

            Object.keys(data).forEach(function (k) {
                if (data[k] === metadata[k]) { delete data[k]; }
            });
            send(['METADATA', data], cb);
        };

        nThen(function (w) {
            // get metadata so we know the owners and validateKey
            anon_rpc.send('GET_METADATA', channel, function (err, data) {
                if (err) {
                    w.abort();
                    return void console.error(err);
                }
                metadata = ref.internal.metadata = (data && data[0]) || undefined;
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
