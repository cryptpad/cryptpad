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
        var APP = window.APP
        

        var ooMessages = {};
        var ooCheckpoints = {};
        var currentMessages = {}
        var loading = false;
        var update = function () {};
        var currentTime;

        // Get an array of the checkpoint IDs sorted their patch index
        var hashes = config.onlyoffice.hashes;
        var sortedCp = Object.keys(hashes).map(Number);

        var getId = function () {
            var cps = sortedCp.length;
            return sortedCp[cps-1] || 1;
        };

        var id = getId();

        var endWithCp = sortedCp.length &&
                        config.onlyoffice.lastHash === hashes[sortedCp[sortedCp.length - 1]].hash;

        var fillOO = function (id, messages, ooCheckpoints) {
            if (!id) { return; }
            var checkpoints = []
            Object.keys(ooCheckpoints).forEach(function(key) {
                checkpoints.push(ooCheckpoints[key].index)
            })
            checkpoints.forEach((current, index) => {
                var preceding = index > 0 ? checkpoints[index - 1] : 1;
                ooMessages[index+1] = messages.slice(preceding-1, current-1)
            });
            var cpMessages = Object.values(ooMessages).flat().length;
            var messageDiff = messages.length - cpMessages
            if (messageDiff !== 0 && cpMessages) {
                var keys = Object.keys(ooMessages)
                var currentM = parseInt(keys[keys.length - 1]);
                ooMessages[currentM+1] = messages.slice(-messageDiff)
            } else if (messageDiff !== 0 && !cpMessages) {
                ooMessages[1] = messages
            }
            console.log("next fill", messageDiff, cpMessages, ooMessages, messages, hashes)

            update();
        };

        if (endWithCp) { cpIndex = 0; }

        var $version, $time, $share;
        var $hist = $toolbar.find('.cp-toolbar-history');
        $hist.addClass('cp-smallpatch');
        $hist.addClass('cp-history-oo');
        var $bottom = $toolbar.find('.cp-toolbar-bottom');
        var Messages = common.Messages;

        var getVersion = function () {
            if (Object.keys(ooMessages).length) {
                var major = sortedCp.length - cpIndex;
                // console.log("version", major, sortedCp.length, cpIndex, msgIndex, ooMessages, id )
                // console.log("version2", ooMessages )
                return major-1 + '.' + (ooMessages[id]?.length-Math.abs(msgIndex+1));
            }

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

        function getMessages(fromHash, toHash, cpIndex, sortedCp, cp, id, config, fillOO, $share, ooCheckpoints, callback) {
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
                id = getId()
                fillOO(id, messages, ooCheckpoints);
                loading = false;
                // $share.show();

                callback(null, messages);
            });
        }

        // We want to load a checkpoint (or initial state)
        var loadMoreOOHistory = function (cb) {
            if (!Array.isArray(sortedCp)) { return void console.error("Wrong type"); }

            var cp = {};

            if (cb) {
                cb()
            }

            showVersion();
            if (ooMessages[id] || id === 0) {
                // Cp already loaded: reload OO
                loading = false;
                return void config.onCheckpoint(cp);
            }
            
        };

        getMessages(config.onlyoffice.lastHash, 'NONE', cpIndex, sortedCp, undefined, -1, config, fillOO, $share, hashes, function (err, messages) {
            if (err) {
                console.error(err);
                return;
            }
        });

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
            if (cpIndex === 0) {
                $fastNext.prop('disabled', 'disabled');
            }            
            if (msgIndex === -1 && cps === id) {
                $next.prop('disabled', 'disabled');
            }
            if (id === 0 && msgIndex === 0) {
                $prev.prop('disabled', 'disabled');
            }
        };

        
        var next = function () {
            msgIndex++;
            msgs = ooMessages[id]
            if (Object.keys(hashes).length) {
                if (!ooMessages[id] && id !== 0) { loading = false; return; }
            
                if (id === 0 && msgIndex === 0|| msgIndex === msgs.length) {
                    id++;
                    msgIndex = 0;
                    console.log("next0")

                }
                if (Object.keys(hashes).length && msgIndex === 0) {

                    var patch = msgs[msgIndex]; 
                    cp = hashes[id-1];
                    console.log("next1", hashes, ooMessages, id, msgIndex, cp)

                    config.onPatchBack(cp, [patch]);
                }
                else if (Object.keys(hashes).length && msgIndex > 0) {
                    console.log("next2", hashes, ooMessages, id, msgIndex)

                    var patch = msgs[msgIndex]; 
                }
                else if (Object.keys(hashes).length && Math.sign(msgIndex) === -1) {
                    if (Object.keys(ooMessages) > Object.keys(hashes) && !hashes[id+1]) {
                        msgs = ooMessages[id+1]

                    } else {
                                            msgs = ooMessages[id]

                    }
                    console.log("next3", hashes, ooMessages, id, cpIndex, msgIndex)
                    // msgs = ooMessages[id+1]

                    var patch = msgs[msgs.length + msgIndex];
                }
            } else {
                var patch = msgs[msgs.length + msgIndex];
            }

            config.onPatch(patch)
            showVersion();
            setTimeout(function () {
                $('iframe').blur();
                loading = false;
            }, 200);

        };

        var msgs;

        var prev = function () {
            loadMoreOOHistory(function() {
                if (Math.abs(msgIndex) > msgs?.length && id > 1 || msgIndex === 0 && id > 0) {
                    id--;

                    if (id === 1 || id === 0) {
                                                console.log("prev?")

                        msgIndex = ooMessages[id+1].length-1;

                    } else {
                        console.log("prev!")
                        msgIndex = ooMessages[id+1].length-2;

                    }
                    console.log("prev0", id, )
                }
                if (Object.keys(hashes).length && Object.keys(ooMessages).length > Object.keys(hashes).length) {
                    console.log("prev1", hashes, ooMessages, id, msgIndex)
                    cp = hashes[id] ? hashes[id] : {};
                    msgs = ooMessages[id+1];
                    var queue = msgs.slice(0, msgIndex);
                    config.onPatchBack(cp, queue);
                } 
                else if (Object.keys(hashes).length) {
                    console.log("prev2", hashes, ooMessages, id, msgIndex)

                    cp = hashes[id-1] ? hashes[id-1] : {};
                    msgs = ooMessages[id];
                    console.log("prev2.25", msgs.length)
                    if (msgIndex === msgs.length) {
                        msgIndex--
                    } 
                    msgIndex = msgIndex === msgs.length ? msgIndex-- : msgIndex
                    console.log("prev2.5", hashes, ooMessages, id, msgIndex)

                    var queue = msgs.slice(0, msgIndex);
                    config.onPatchBack(cp, queue);
                }
                else if (!Object.keys(hashes).length) {
                    console.log("prev3", hashes, ooMessages, id, msgIndex)

                    msgs = ooMessages[id]
                    var queue = msgs.slice(0, msgIndex)
                    config.onPatchBack({}, queue)
                }
                                    
                showVersion();
                msgIndex--;

            });
            

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
            $next = $(_next).prop('disabled', 'disabled');


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
                // if (loading) { return; }
                loading = true;
                prev();
                update();
            });
            // Go to previous checkpoint
            $fastNext.click(function () {
                if (loading) { return; }
                loading = true;
                cpIndex--;
                loadMoreOOHistory();
                update();
            });
            // Go to next checkpoint
            $fastPrev.click(function () {
                if (loading) { return; }
                loading = true;
                id = 0
                msgIndex = 0
                console.log("prev0", id, msgIndex)
                loadMoreOOHistory();
                setTimeout(function () {
                    update();
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


