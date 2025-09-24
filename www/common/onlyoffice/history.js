// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/common-interface.js',
    '/common/hyperscript.js',
], function ($, UI, h) {
    //var ChainPad = window.ChainPad;
    var History = {};

    History.create = function (common, config) {
        if (!config.$toolbar) { return void console.error("config.$toolbar is undefined");}
        if (History.loading) { return void console.error("History is already being loaded..."); }
        History.loading = true;
        var $toolbar = config.$toolbar;
        var sframeChan = common.getSframeChannel();
        History.readOnly = common.getMetadataMgr().getPrivateData().readOnly || !common.isLoggedIn();
        
        if (!config.onlyoffice || !config.setHistory || !config.onCheckpoint || !config.onPatch || !config.makeSnapshot) {
            throw new Error("Missing config element");
        }

        var cpIndex = -1;
        var msgIndex = -1;
        var APP = window.APP;
        var ooMessages = {};
        var ooCheckpoints = {};
        var loading = false;
        var update = function () {};
        var currentTime;

        // Get an array of the checkpoint IDs sorted their patch index
        var hashes = config.onlyoffice.hashes;
        var sortedCp = Object.keys(hashes).map(Number);
        var id;

        var sortedCp = Object.keys(hashes).map(Number).sort(function (a, b) {
            return hashes[a].index - hashes[b].index;
        });

        console.log("hashescp", sortedCp)
        var getId = function () {
            var cps = sortedCp.length;
            id = sortedCp[cps -1] || -1;
            return sortedCp[cps -1] || -1;
        };

        var endWithCp = sortedCp.length &&
                        config.onlyoffice.lastHash === hashes[sortedCp[sortedCp.length - 1]].hash;

        var fillOO = function (messages, ooCheckpoints) {
            console.log("fill1", id)
            // if (!id) { return; }
                        console.log("fill2")

            // if (ooMessages[id]) { return; }
                        console.log("fill3")
            ooMessages = {}
            ooMessages[id] = messages;
            update();
            // var checkpoints = [];
            // Object.keys(ooCheckpoints).forEach(function(key) {
            //     checkpoints.push(ooCheckpoints[key].index);
            // })
            // checkpoints.forEach((current, index) => {
            //     var preceding = index > 0 ? checkpoints[index - 1] : 1;
            //     ooMessages[index+1] = messages.slice(preceding-1, current-1);
            // });
            // var cpMessages = Object.values(ooMessages).flat().length;
            // var messageDiff = messages.length - cpMessages;
            // if (messageDiff !== 0 && cpMessages) {
            //     var keys = Object.keys(ooMessages);
            //     var currentM = parseInt(keys[keys.length - 1]);
            //     ooMessages[currentM+1] = messages.slice(-messageDiff);
            // } else if (messageDiff !== 0 && !cpMessages) {
            //     ooMessages[1] = messages;
            // }
            // id = id ? id : getId();
            // update();
        };

        if (endWithCp) { cpIndex = 0; }

        var $version, $time, $share;
        var $hist = $toolbar.find('.cp-toolbar-history');
        $hist.addClass('cp-smallpatch');
        $hist.addClass('cp-history-oo');
        var $bottom = $toolbar.find('.cp-toolbar-bottom');
        var Messages = common.Messages;

        var getVersion = function (position) {
            if (Object.keys(ooMessages).length) {
                var major = id === 0 ? 0 : id-1;
                return major + '.' + position;
            }

        };
        var showVersion = function (initial, position) {
            var v = getVersion(position);
            if (initial) {
                v = Messages.oo_version_latest;
            }
            $version.text(Messages.oo_version + v);

            var $pos = $hist.find('.cp-history-timeline-pos');
            if (!ooMessages[id]) { return; }
            var msgs = ooMessages[id];
            var p = 100*((msgIndex+1) / (msgs.length));
            $pos.css('margin-left', p+'%');

            var time = msgs[msgIndex] && msgs[msgIndex].time;
            currentTime = time;
            if (time) { $time.text(new Date(time).toLocaleString()); }
            else { $time.text(''); }
        };

        function getMessages(fromHash, toHash, cpIndex, sortedCp, cp, config, fillOO, $share, ooCheckpoints, callback) {
            sframeChan.query('Q_GET_HISTORY_RANGE', {
                channel: config.onlyoffice.channel,
                lastKnownHash: fromHash,
                toHash: toHash,
            }, function (err, data) {
                if (err) {
                    console.error(err);
                    callback(err);
                    return;
                }

                if (!Array.isArray(data.messages)) {
                    return;
                }

                let initialCp = cpIndex === sortedCp.length || cp ? !cp?.hash : undefined;
                // console.log("hash messss", data)
                const messages = (data.messages || []).slice(initialCp ? 0 : 1);
                // console.log("hashmes", messages)
                if (config.debug) {
                    console.log(data.messages);
                }
                console.log("ID HERE", id)
                id = id !== undefined ? id : getId();
                fillOO(messages, ooCheckpoints);
                loading = false;
                // $share.show();

                callback(null, messages);
            });
        }

        // We want to load a checkpoint (or initial state)
        var loadMoreOOHistory = function (cb) {
            return new Promise((resolve, reject) => { // Return a promise
                if (!Array.isArray(sortedCp)) { 
                    console.error("Wrong type");
                    return resolve();
                }
                
                console.log("id", id);
                id = id !== undefined ? id : getId();
                console.log("id2", id);

                var cp = hashes[id];
                var nextId = hashes[id+1] ? hashes[id+1] : undefined;
                
                var toHash = nextId ? nextId.hash : config.onlyoffice.lastHash;
                var fromHash = cp?.hash || 'NONE';

                console.log("hashes", config.onlyoffice.lastHash, nextId?.hash, hashes, id);
                console.log("hashes2", toHash, fromHash);

                getMessages(toHash, fromHash, cpIndex, sortedCp, undefined, config, fillOO, $share, hashes, function (err, messages) {
                    if (err) {
                        console.error(err);
                        reject(err);
                        return;
                    }
                    resolve(); // Resolve when done
                });
            });
            
        };

        loadMoreOOHistory()

        

        var onClose = function () { config.setHistory(false); };
        var onRevert = function () {
            APP.revert = true
            config.onRevert();
        };

        config.setHistory(true);

        $hist.html('').css('display', 'flex');
        $bottom.hide();

        UI.spinner($hist).get().show();

        var $fastPrev, $fastNext, $next, $prev;


        update = function () {
            var cps = sortedCp.length;
            $fastPrev.show();
            $next.show();
            $prev.show();
            $fastNext.show();
            $hist.find('.cp-toolbar-history-next, .cp-toolbar-history-previous')
                .prop('disabled', '');

            if (cpIndex >= cps && msgIndex === 0) {
                $fastPrev.prop('disabled', 'disabled');
            }
            var msgLength = Object.keys(ooMessages).length   
            if (id === msgLength) {
                $fastNext.prop('disabled', 'disabled');
            }        
            // if (msgLength === id && msgIndex === -1) {
                // $next.prop('disabled', 'disabled');
            // }
            if (id === 0 && msgIndex === 0) {
                $prev.prop('disabled', 'disabled');
            }
        };

        var loadingFalse = function () {
            setTimeout(function () {
                $('iframe').blur();
                loading = false;
            }, 200);
        }

        
        var next = function () {
            msgIndex++;
            msgs = ooMessages[id];
            if (Object.keys(hashes).length) {
                console.log("next", ooMessages, id, msgs, msgIndex)
                if (msgIndex === 0) {
                    id++;
                    loadMoreOOHistory().then(() => {
                        msgs = ooMessages[id];
                                        console.log("next2", ooMessages, id, msgs, msgIndex)

                        if (!msgs.length) {
                            id++;
                            msgIndex = -1
                            config.loadCp(hashes[id]);
                            return loadMoreOOHistory().then(() => {
                                loadingFalse();
                                return;
                            });
                        }
                        
                        msgIndex = -msgs.length;
                                        console.log("next3", ooMessages, id, msgs, msgIndex)

                        var patch = msgs[msgs.length + msgIndex] ? msgs[msgs.length + msgIndex] : undefined;
                        var cp = hashes[id-1];
                        config.onPatchBack(cp, [patch]);
                        showVersion(false, msgs.indexOf(patch)+1);
                        loadingFalse();
                    }).catch(err => {
                        console.error(err);
                        loadingFalse();
                    });
                    return;
                }
            } 
            var patch = msgs[msgs.length + msgIndex];
            config.onPatch(patch);
            showVersion(false, msgs.indexOf(patch)+1);
            loadingFalse();
        };

        var msgs;

        var prev = function () {
            msgs = ooMessages[id];
            if (!Object.keys(hashes).length) {
                var cp = {};
            } else {
                if (msgs.length+1 === Math.abs(msgIndex) && id !== 0 || !msgs.length) {
                    id--;
                    msgIndex = -1;
                    loadMoreOOHistory().then(() => {
                        msgs = ooMessages[id];
                        var queue = msgs.slice(0, msgIndex);
                        var cp = hashes[id];
                        config.onPatchBack(cp, queue);                                          
                        showVersion(false, queue.length);
                        msgIndex--;
                        loadingFalse();
                    });
                    return; 
                }
                var cp = hashes[id];
            } 
            var queue = msgs.slice(0, msgIndex);
            config.onPatchBack(cp, queue);                                          
            showVersion(false, queue.length);
            msgIndex--;
            loadingFalse();
        };


        // Create the history toolbar
        var display = function () {
            $hist.html('');

            var fastPrev = h('button.cp-toolbar-history-previous', { title: Messages.history_prev }, [
                h('i.fa.fa-fast-backward'),
            ]);
            var fastNext = h('button.cp-toolbar-history-next', { title: Messages.history_next }, [
                h('i.fa.fa-fast-forward'),
            ]);
            var _next = h('button.cp-toolbar-history-next', { title: Messages.history_next }, [
                h('i.fa.fa-step-forward')
            ]);
            var _prev = h('button.cp-toolbar-history-previous', { title: Messages.history_prev }, [
                h('i.fa.fa-step-backward')
            ]);
            $fastPrev = $(fastPrev);
            $prev = $(_prev);
            $fastNext = $(fastNext).prop('disabled', 'disabled');
            $next = $(_next)
            // .prop('disabled', 'disabled');


            var pos = h('span.cp-history-timeline-pos.fa.fa-caret-down');
            var time = h('div.cp-history-timeline-time');
            var version = h('div.cp-history-timeline-version');
            $time = $(time);
            $version = $(version);
            var bar;
            var timeline = h('div.cp-toolbar-history-timeline', [
                h('div.cp-history-timeline-line', [
                    bar = h('span.cp-history-timeline-container')
                ]),
                h('div.cp-history-timeline-actions', [
                    h('span.cp-history-timeline-prev', [
                        fastPrev,
                        _prev
                    ]),
                    time,
                    version,
                    h('span.cp-history-timeline-next', [
                        _next,
                        fastNext
                    ])
                ])
            ]);
            var snapshot = h('button', {
                title: Messages.snapshots_new,
            }, [
                h('i.fa.fa-camera')
            ]);
            var share = h('button', { title: Messages.history_shareTitle }, [
                h('i.fa.fa-shhare-alt'),
                h('span', Messages.shareButton)
            ]);
            var restore = h('button', {
                title: Messages.history_restoreTitle,
            }, [
                h('i.fa.fa-check'),
                h('span', Messages.history_restore)
            ]);
            var close = h('button', { title: Messages.history_closeTitle }, [
                h('i.fa.fa-times'),
                h('span', Messages.history_close)
            ]);
            var actions = h('div.cp-toolbar-history-actions', [
                h('span.cp-history-actions-first', [
                    snapshot,
                    share
                ]),
                h('span.cp-history-actions-last', [
                    restore,
                    close
                ])
            ]);

            if (History.readOnly) {
                snapshot.disabled = true;
                restore.disabled = true;
            }

            $share = $(share);
            $hist.append([timeline, actions]);
            $(bar).append(pos);

            var onKeyDown, onKeyUp;
            var closeUI = function () {
                $hist.hide();
                $bottom.show();
                $(window).trigger('resize');
                $(window).off('keydown', onKeyDown);
                $(window).off('keyup', onKeyUp);
            };

            // Push one patch
            $next.click(function () {
                // if (loading) { return; }
                loading = true;
                next();
                update();
            });
            $prev.click(function () {
                if (loading) { return; }
                loading = true;
                prev();
                update();
            });
            // Go to previous checkpoint
            $fastNext.click(function () {
                if (loading) { return; }
                loading = true;
                id++;
                var cp = hashes[id];
                config.loadCp(cp);
                setTimeout(function () {
                    update();
                    loading = false;
                }, 100);
            });
            // Go to next checkpoint
            $fastPrev.click(function () {
                if (loading) { return; }
                loading = true;
                id--;
                var cp = hashes[id];
                config.loadCp(cp);
                setTimeout(function () {
                    update();
                    loading = false;
                }, 100);
                
            });
            onKeyDown = function (e) {
                var p = function () { e.preventDefault(); };
                if ([38, 39].indexOf(e.which) >= 0) { p(); return $next.click(); } // Right
                if (e.which === 33) { p(); return $fastNext.click(); } // PageUp
                if (e.which === 34) { p(); return $fastPrev.click(); } // PageUp
                if (e.which === 27) { p(); return $(close).click(); }
            };
            onKeyUp = function (e) { e.stopPropagation(); };
            $(window).on('keydown', onKeyDown).on('keyup', onKeyUp).focus();

            // Versioned link
            $share.click(function () {
                common.getSframeChannel().event('EV_SHARE_OPEN', {
                    versionHash: getVersion()
                });
            });
            $(snapshot).click(function () {
                if (cpIndex === -1 && msgIndex === -1) { return void UI.warn(Messages.snapshots_ooPickVersion); }
                var input = h('input', {
                    placeholder: Messages.snapshots_placeholder
                });
                var $input = $(input);
                var content = h('div', [
                    h('h5', Messages.snapshots_new),
                    input
                ]);

                var buttons = [{
                    className: 'cancel',
                    name: Messages.filePicker_close,
                    onClick: function () {},
                    keys: [27],
                }, {
                    className: 'primary',
                    iconClass: '.fa.fa-camera',
                    name: Messages.snapshots_new,
                    onClick: function () {
                        var val = $input.val();
                        if (!val) { return true; }
                        config.makeSnapshot(val, function (err) {
                            if (err) { return; }
                            $input.val('');
                            UI.log(Messages.saved);
                        }, {
                            hash: getVersion(),
                            time: currentTime || 0
                        });
                    },
                    keys: [13],
                }];

                UI.openCustomModal(UI.dialog.customModal(content, {buttons: buttons }));
                setTimeout(function () {
                    $input.focus();
                });
            });

            // Close & restore buttons
            $(close).click(function () {
                History.loading = false;
                onClose();
                closeUI();
            });
            $(restore).click(function () {
                UI.confirm(Messages.history_restorePrompt, function (yes) {
                    if (!yes) { return; }
                    closeUI();
                    History.loading = false;
                    onRevert();
                    UI.log(Messages.history_restoreDone);
                });
            });
        };

        display();

        showVersion(true);

        //return void loadMoreOOHistory();
    };

    return History;
});


