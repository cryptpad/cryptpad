// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/api/config',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/components/nthen/index.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-constants.js',
    '/common/cryptget.js',
    '/common/cryptpad-common.js',
    '/common/outer/cache-store.js',
    '/common/common-interface.js',
    'chainpad-netflux',
    '/components/chainpad-crypto/crypto.js',
    '/common/userObject.js',
    '/common/clipboard.js',
    '/common/outer/login-block.js',
    '/common/outer/roster.js',
    '/common/rpc.js',
    '/common/pinpad.js',


    '/components/tweetnacl/nacl-fast.min.js',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/pages/page-report.less',
], function ($, ApiConfig, h, Messages,
            nThen, Hash, Util, Constants, Crypt, Cryptpad, Cache, UI, CPNetflux,
            Crypto, UserObject, Clipboard, Block, Roster, Rpc, Pinpad) {
    var $report = $('#cp-report');
    var blockHash = localStorage.Block_hash;
    if (!blockHash) {
        return void UI.alert(Messages.mustLogin, function () {
            var href = Hash.hashToHref('', 'login');
            var url = Hash.getNewPadURL(href, {
                href: '/report/',
            });
            console.log(url);
            window.location.href = url;
        });
    }

    let report = true;
    let fixRoster = false;

    let urlHash = window.location.hash.slice(1);
    if (urlHash) {
        let s = urlHash.split('=');
        let key = s[0];
        let value = s[1];
        if (key === "roster") {
            report = false;
            fixRoster = value; // teamid
        }
    }


    var addReport = function (str) {
        $report.append(h('div', str));
    };

    var getReportContent = window.getReportContent = function () {
        try {
            return $report[0].innerText;
        } catch (err) {
            return '';
        }
    };

    var copyToClipboard = function () {
        Clipboard.copy(getReportContent(), (err) => {
            if (err) { return UI.warn(Messages.error); }
            UI.log(Messages.genericCopySuccess);
        });
    };

    var checkCache = function (chan, cb) {
        Cache.getChannelCache(chan, function (err, val) {
            if (err) {
                addReport('Cache error:' + err);
            } else {
                addReport('Cache: ' + val.c.length + ' entries');
            }
            cb();
        });
    };
    var onCacheReady = function (info) {
        var doc;
        try {
            doc = info.realtime.getUserDoc();
            JSON.parse(doc);
            addReport('Cache ready success: ' + info.id + ' - Length: ' + doc.length);
        } catch (e) {
            addReport('Cache ready error: ' + info.id + ' - Length: ' + (doc || '').length);
        }
    };

    var network;
    var proxy;
    var hash;

    nThen(function (waitFor) {
        // If this instance is configured to enforce MFA for all registered users,
        // request the login block with no credential to check if it is protected.
        let done = waitFor();
        var parsed = Block.parseBlockHash(blockHash);
        Util.getBlock(parsed.href, { }, waitFor((err, response) => {
            if (err) {
                waitFor.abort();
                return void UI.alert('Invalid user');
            }
            response.arrayBuffer().then(arraybuffer => {
                arraybuffer = new Uint8Array(arraybuffer);
                // use the results to load your user hash and
                // put your userhash into localStorage
                try {
                    var block_info = Block.decrypt(arraybuffer, parsed.keys);
                    if (!block_info) { return console.error("Failed to decrypt !"); }
                    hash = block_info[Constants.userHashKey];
                    if (!hash) {
                        return void console.error("failed to decrypt or decode block content");
                    }
                } catch (e) {
                    return void console.error("failed to decrypt or decode block content");
                }
                done();
            });
        }));
    }).nThen(function (waitFor) {
        Cryptpad.makeNetwork(waitFor(function (err, _network) {
            if (err) {
                console.error(err);
                waitFor.abort();
                return void UI.errorLoadingScreen(err);
            }
            network = _network;
        }));
    }).nThen(function (waitFor) {
        addReport('BEGIN REPORT');
        var secret = Hash.getSecrets('drive', hash);
        addReport('Load drive. ID: ' + secret.channel);
        checkCache(secret.channel, waitFor());
    }).nThen(function (waitFor) {
        Crypt.get(hash, waitFor(function (err, val) {
            if (err) {
                console.error(err);
                addReport('Load drive error. err: ' + err);
                return void waitFor.abort();
            }
            try {
                proxy = JSON.parse(val);
            } catch (e) {
                console.error(e);
                addReport('Load drive error. Parse error: ' + e);
                waitFor.abort();
            }
        }), { network: network, onCacheReady: onCacheReady});
    }).nThen(function (waitFor) {
        var drive = proxy.drive || {};
        if (!proxy.drive) {
            addReport('ERROR: no drive');
            return void waitFor.abort();
        }
        addReport('Load drive success.');
        addReport('Public key: '+proxy.edPublic);
        addReport('Shared folders: ' + Object.keys(drive.sharedFolders || {}).join(', '));
        addReport('Teams: ' + Object.keys(proxy.teams || {}).join(', '));
        addReport('-------------------');

        if (!report) { return; }

        var n = nThen;
        Object.keys(drive.sharedFolders || {}).forEach(function (id) {
            n = n(function (w) {
                var next = w();
                var obj = drive.sharedFolders[id];
                addReport('Load shared folder. ID: ' + id + '. Channel ID: '+ obj.channel);
                if (obj.password) { addReport("Password protected"); }
                if (!obj.href) { addReport("View only"); }
                checkCache(obj.channel, function () {
                    var parsed = Hash.parsePadUrl(obj.href || obj.roHref);
                    Crypt.get(parsed.hash, function (err, val, errorObj) {
                        if (err) {
                            addReport('ERROR: ' + err);
                            if (err === "ERESTRICTED") {
                                addReport('RESTRICTED: ' + (errorObj && errorObj.message));
                            }
                        } else {
                            addReport('Load shared folder: success. Size: ' + val.length);
                        }
                        addReport('-------------------');
                        next();
                    }, {
                        network: network,
                        password: obj.password,
                        onCacheReady: onCacheReady
                    });

                });
            }).nThen;
        });
        n(waitFor());
    }).nThen(function () {
        addReport('===================');
        var n = nThen;
        Object.keys(proxy.teams || {}).forEach(function (id) {
            // If we're in "repair" mode, only load the affected team
            var obj = proxy.teams[id];
            if (!report && fixRoster !== obj.channel) { return; }
            n = n(function (w) {
                var next = w();
                var team;
                addReport('Load team. ID: ' + id + '. Channel ID: '+ obj.channel);
                addReport('Roster channel: ' + obj.keys.roster.channel);
                addReport('Roster lkh: ' + obj.keys.roster.lastKnownHash);
                if (!obj.hash) { addReport("View only"); }

                var teamSecret = Hash.getSecrets('team', obj.hash || obj.roHash, obj.password);
                var cryptor = UserObject.createCryptor(teamSecret.keys.secondaryKey);


                // Repair roster mode
                if (!report) {
                    let roster = obj.keys.roster;
                    let rpc, anon_rpc;
                    if (!obj.owner || !roster.edit) {
                        return void addReport('Roster error: only owners can repair');
                    }
                    n(w => {
                        Rpc.createAnonymous(network, w(function (e, call) {
                            anon_rpc = call;
                        }));
                        Pinpad.create(network, proxy, w(function (e, call) {
                            rpc = call;
                        }));
                    }).nThen(w => {
                        if (!anon_rpc || !rpc) {
                            return void addReport('RPC error');
                        }
                        var rosterKeys = Crypto.Team.deriveMemberKeys(roster.edit, {
                            curvePublic: proxy.curvePublic,
                            curvePrivate: proxy.curvePrivate
                        });
                        let store = { anon_rpc };
                        Roster.create({
                            network: network,
                            channel: roster.channel,
                            keys: rosterKeys,
                            store: store,
                            lastKnownHash: roster.lastKnownHash
                        }, w(function (err, _roster) {
                            if (err) { return void addReport('Fix roster error', err); }
                            _roster.checkpoint(w((err, state, hash) => {
                                if (err) { addReport('Fix roster error', err); }
                                rpc.trimHistory({
                                    channel: roster.channel,
                                    hash
                                }, w(function (err) {
                                    console.error(arguments);
                                    if (err) { addReport('Trim roster error', err); }
                                }));
                            }));
                        }));
                    }).nThen(next);
                    return;
                }

                // Check team drive
                nThen(function (ww) {
                    addReport('Team drive');
                    var _next = ww();
                    checkCache(obj.channel, function () {
                        Crypt.get(obj.hash || obj.roHash, function (err, val) {
                            if (err) {
                                addReport('ERROR: ' + err);
                                addReport('===================');
                                next();
                                ww.abort();
                            } else {
                                addReport('Team drive success. Size: ' + val.length);
                                try {
                                    team = JSON.parse(val);
                                } catch (e) {
                                    addReport('PARSE ERROR: ' + e);
                                    addReport('===================');
                                    next();
                                    ww.abort();
                                }
                                addReport('Shared folders: ' + Object.keys(team.drive.sharedFolders || {}).join(', '));
                            }
                            addReport('-------------------');
                            _next();
                        }, {
                            network: network,
                            password: obj.password,
                            onCacheReady: onCacheReady
                        });
                    });
                }).nThen(function (ww) {
                    var _next = ww();
                    var d = Util.find(obj, ['keys', 'roster']);

                    var rosterKeys = d.edit ? Crypto.Team.deriveMemberKeys(d.edit, proxy)
                                        : Crypto.Team.deriveGuestKeys(d.view || '');

                    if (d.channel !== rosterKeys.channel) {
                        next();
                        ww.abort();
                        addReport("Invalid roster keys:", d.channel, rosterKeys.channel);
                        return;
                    }
                    addReport('Roster channel: ' + d.channel);
                    checkCache(d.channel, function () {
                        var crypto = Crypto.Team.createEncryptor(rosterKeys);
                        var m = 0;
                        CPNetflux.start({
                            lastKnownHash: d.lastKnownHash || -1,
                            network: network,
                            channel: d.channel,
                            crypto: crypto,
                            validateKey: rosterKeys.teamEdPublic,
                            Cache: Cache,
                            noChainPad: true,
                            onCacheReady: onCacheReady,
                            onChannelError: function (obj) {
                                addReport('ERROR:' + obj.error);
                                if (obj.error === "ERESTRICTED") {
                                    addReport('RESTRICTED: ' + obj.message);
                                }
                                next();
                                ww.abort();
                                addReport('===================');
                                return;
                            },
                            onMessage: function () {
                                m++;
                            },
                            onReady: function () {
                                addReport("Roster success. Length: "+m);
                                addReport('-------------------');
                                _next();
                            }
                        });
                    });
                }).nThen(function (ww) {
                    var _next = ww();
                    var n = nThen;
                    var drive = team.drive;
                    Object.keys(drive.sharedFolders || {}).forEach(function (id) {
                        n = n(function (w) {
                            var next = w();
                            var _obj = drive.sharedFolders[id];
                            addReport('Load shared folder. ID: ' + id + '. Channel ID: '+ _obj.channel);
                            if (_obj.password) { addReport("Password protected"); }
                            if (!_obj.href) { addReport("View only"); }
                            checkCache(_obj.channel, function () {
                                if (_obj.href && _obj.href.indexOf('#') === -1) {
                                    _obj.href = cryptor.decrypt(_obj.href);
                                }
                                var parsed = Hash.parsePadUrl(_obj.href || _obj.roHref);
                                Crypt.get(parsed.hash, function (err, val, errorObj) {
                                    if (err) {
                                        addReport('ERROR: ' + err);
                                        if (err === "ERESTRICTED") {
                                            addReport('RESTRICTED: ' + (errorObj && errorObj.message));
                                        }
                                    } else {
                                        addReport('Load shared folder: success. Size: ' + val.length);
                                    }
                                    addReport('-------------------');
                                    next();
                                }, {
                                    network: network,
                                    password: _obj.password,
                                    onCacheReady: onCacheReady
                                });

                            });
                        }).nThen;
                    });
                    n(_next);
                }).nThen(next);


            }).nThen;
        });
        n(function () {
            addReport('===================');
            addReport('DONE');

            var copyButton = h('button.btn.btn-primary', Messages.copyToClipboard);
            copyButton.onclick = copyToClipboard;
            var buttonContainer = h('div#cp-report-ui', [
                copyButton,
            ]);

            document.body.appendChild(buttonContainer);
        });
    });


});
