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

        var cpIndex;
        var msgIndex = 0;

        var ooMessages = {};
        var loading = false;
        var update = function () {};
        var currentTime;

        // Get an array of the checkpoint IDs sorted their patch index
        var hashes = config.onlyoffice.hashes;
        var sortedCp = Object.keys(hashes).map(Number).sort(function (a, b) {
            return hashes[a].index - hashes[b].index;
        });

        var endWithCp = sortedCp.length &&
                        config.onlyoffice.lastHash === hashes[sortedCp[sortedCp.length - 1]].hash;
        console.log("endwithcp?", sortedCp, config.onlyoffice.lastHash)
        var fillOO = function (id, messages) {
            if (!id) { return; }
            if (ooMessages[id]) { return; }
            ooMessages[id] = messages;
            update();
        };

        if (endWithCp) { cpIndex = 0; } else {cpIndex = -1}

        var $version, $time, $share;
        var $hist = $toolbar.find('.cp-toolbar-history');
        $hist.addClass('cp-smallpatch');
        $hist.addClass('cp-history-oo');
        var $bottom = $toolbar.find('.cp-toolbar-bottom');
        var Messages = common.Messages;

        var getVersion = function () {
            var major = sortedCp.length - cpIndex;
            return major + '.' + (msgIndex+1);
        };
        var showVersion = function (initial) {
            var v = getVersion();
            if (initial) {
                v = Messages.oo_version_latest;
            }
            $version.text(Messages.oo_version + v);

            var $pos = $hist.find('.cp-history-timeline-pos');
            var cps = sortedCp.length;
            var id = sortedCp[cps - cpIndex -1] || -1;
            if (!ooMessages[id]) { return; }
            var msgs = ooMessages[id];
            var p = 100*((msgIndex+1) / (msgs.length));
            $pos.css('margin-left', p+'%');

            var time = msgs[msgIndex] && msgs[msgIndex].time;
            currentTime = time;
            if (time) { $time.text(new Date(time).toLocaleString()); }
            else { $time.text(''); }
        };

        function getMessages(fromHash, toHash, cpIndex, sortedCp, cp, id, config, fillOO, $share, callback) {
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

                const messages = (data.messages || []).slice(initialCp ? 0 : 1);

                if (config.debug) {
                    console.log(data.messages);
                }

                fillOO(id, messages);
                loading = false;
                // $share.show();

                callback(null, messages);
            });
        }

        var allMsgs

        // We want to load a checkpoint (or initial state)
        var loadMoreOOHistory = function (keepQueue, patch) {
            if (!Array.isArray(sortedCp)) { return void console.error("Wrong type"); }

            var cp = {};

            // Get the checkpoint ID
            var id = -1;
            console.log("CP", cpIndex, sortedCp)
            if (cpIndex < sortedCp.length) {
                id = sortedCp[sortedCp.length - 1 - cpIndex];
                cp = hashes[id];ooMessages[-1]
            }
            var nextId = sortedCp[sortedCp.length - cpIndex];

            // Get the history between "toHash" and "fromHash". This function is using
            // "getOlderHistory", that's why we start from the more recent hash
            // and we go back in time to an older hash

            // We need to get all the patches between the current cp hash and the next cp hash

            // Current cp or initial hash (invalid hash ==> initial hash)
            var toHash = cp?.hash ? cp.hash : 'NONE';
            // // Next cp or last hash
            var fromHash = nextId ? hashes[nextId].hash : config.onlyoffice.lastHash;

            msgIndex = -2;


            showVersion();
            console.log("oomsgs", ooMessages, id, cp)
            console.log("oomsgs2", ooMessages[-1], ooMessages[-1].length)
                            console.log('checkt', patch)

            if (ooMessages[id] && keepQueue) {
                // Cp already loaded: reload OO
                return void config.onCheckpoint(cp, keepQueue);
            } else if (ooMessages[id] && patch) {
                const parsedMsg = JSON.parse(patch.msg);

                // Create the output object
                const checkPoint = {
                msg: parsedMsg,
                hash: patch.serverHash
                };
                console.log('checkpoint', checkPoint)
                                loading = false;

                                return void config.onCheckpoint(checkPoint);

                config.onPatch(patch)
            }

            getMessages(fromHash, toHash, cpIndex, sortedCp, cp, id, config, fillOO, $share, function (err, messages) {
                if (err) {
                    return;
                }
                console.log('msgs', messages);
            });
        }

        getMessages(config.onlyoffice.lastHash, 'NONE', cpIndex, sortedCp, undefined, -1, config, fillOO, $share, function (err, messages) {
            allMsgs = ooMessages[-1].length-1

            if (err) {
                console.error(err);
                return;
            }
        });
        // console.log()

        var trackMsgs= function (msgNumber) {
            msgNumber--
            

        }
        

        var onClose = function () { config.setHistory(false); };
        var onRevert = function () {
            config.onRevert();
        };

        config.setHistory(true);

        $hist.html('').css('display', 'flex');
        $bottom.hide();

        UI.spinner($hist).get().show();

        var $fastPrev, $fastNext, $next, $prev;

        var getId = function () {
            var cps = sortedCp.length;
            return sortedCp[cps - cpIndex -1] || -1;
        };

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
            if (cpIndex === 0) {
                $fastNext.prop('disabled', 'disabled');
            }
            var id = getId();
            var msgs = (ooMessages[id] || []).length;
            if (msgIndex >= (msgs-1)) {
                $next.prop('disabled', 'disabled');
            }
        };

        var next = function () {
                        console.log('indexN', msgIndex, allMsgs)

            console.log("patch next1", msgIndex, allMsgs)
            var id = getId();
            if (!ooMessages[id]) { loading = false; return; }
            console.log("check1", ooMessages[id])
            var msgs = ooMessages[id];
            // msgIndex = 0
            msgIndex++;
            id++;
            allMsgs++

            var patch = msgs[allMsgs];
            if (!patch) { loading = false; return; }
                        console.log("patch next", msgs, msgIndex, id)
            console.log('patch!', patch)
            // config.onPatch(patch);
            // showVersion();
            // setTimeout(function () {
            //     $('iframe').blur();
            //     loading = false;
            // }, 200);
            loadMoreOOHistory(false, patch);

        };

        var prev = function () {
            console.log('indexP', msgIndex, allMsgs)
            allMsgs--
            // var id = getId();
            // if (!ooMessages[id]) { loading = false; return; }
            // var msgs = ooMessages[id];
            // // msgIndex = 0
            // msgIndex++;
            // // id++;
            // var patch = msgs[msgIndex];
            // if (!patch) { loading = false; return; }
            //             console.log("patch next", msgs, msgIndex, id)

            // config.onPatch(patch);
            // showVersion();
            // setTimeout(function () {
            //     $('iframe').blur();
            //     loading = false;
            // }, 200);
        };

        // var prev = (function () {
        //     var msgIndexPrevMap = {};


        //     return function () {
                
        //         var id = getId();

        //         if (!ooMessages[id]) { loading = false; return; }

        //         var msgs = ooMessages[id];

        //         if (!(id in msgIndexPrevMap)) {
        //             msgIndexPrevMap[id] = Object.keys(msgs).length - 1;
        //         } else {
        //             msgIndexPrevMap[id]--;
        //         }

        //         var index = msgIndexPrevMap[id];

        //         var patch = msgs[index];

        //         if (!patch) { loading = false; return; }
        //         console.log("patch", msgs, index)
        //         config.onPatch(patch);
        //         showVersion();

        //         setTimeout(function () {
        //             $('iframe').blur();
        //             loading = false;
        //         }, 200);
        //     };
        // })();



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
            $fastNext = $(fastNext).prop('disabled', 'disabled');
            $next = $(_next).prop('disabled', 'disabled');
            $prev = $(_prev)

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
                        _prev,
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
                console.log("laodin", loading)
                // if (loading) { return; }
                loading = true;
                console.log("hello")
                next();
                // update();
            });
            // Go to previous checkpoint
            $fastNext.click(function () {
                if (loading) { return; }
                loading = true;
                cpIndex--;
                loadMoreOOHistory();
                update();
            });
             $prev.click(function () {
                if (loading) { return; }
                loading = true;
                cpIndex = 0
                console.log("CP1", cpIndex)

                // if (msgIndex === -1) {
                //     // cpIndex++;
                // }
                loadMoreOOHistory(true);
                console.log("CP2", cpIndex)
                setTimeout(function () {
                    prev()
                    // loading = false;
                }, 2000);
                // next()

                // var id = getId();
                // if (!ooMessages[id]) { loading = false; return; }
                // var msgs = ooMessages[id];
                // msgIndex--;
                // var patch = msgs[32];
                // if (!patch) { loading = false; return; }
                // config.onPatch(patch);
                // showVersion();
                // setTimeout(function () {
                //     $('iframe').blur();
                //     loading = false;
                // }, 200);
                // update();
                
                // if (loading) { return; }
                // loading = true;
                // if (msgIndex === -1) {
                //     cpIndex++;
                // }
                // prev();
                update();
            });
            // Go to next checkpoint
            $fastPrev.click(function () {
                if (loading) { return; }
                loading = true;
                if (msgIndex === -1) {
                    cpIndex++;
                }
                loadMoreOOHistory();
                // update();
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


