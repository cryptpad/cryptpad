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
        var currentTime;

        // Get an array of the checkpoint IDs sorted their patch index
        var hashes = config.onlyoffice.hashes;
        var sortedCp = Object.keys(hashes).map(Number);
        var id;

        var sortedCp = Object.keys(hashes).map(Number).sort(function (a, b) {
            return hashes[a].index - hashes[b].index;
        });

        var getId = function () {
            var cps = sortedCp.length;
            id = sortedCp[cps -1] || -1;
            return id;
        };

        var endWithCp = sortedCp.length &&
                        config.onlyoffice.lastHash === hashes[sortedCp[sortedCp.length - 1]].hash;

        var fillOO = function (messages, ooCheckpoints) {
            ooMessages = {};
            ooMessages[id] = messages;
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
                var major = (id === -1 || id === 0) ? 0 : id;
                console.log("MAJOR", id, ooMessages[id], )
                return major + '.' + position;
            }

        };
        var showVersion = function (initial, position) {
            if (!position) {
                position = 0
            }
            var v = getVersion(position);
            if (initial) {
                v = Messages.oo_version_latest;
            }
            
            $version.text(Messages.oo_version + v);

            var $pos = $hist.find('.cp-history-timeline-pos');
            if (!ooMessages[id]) { return; }
            var msgs = ooMessages[id];
            var p;
             
            if (!Object.keys(hashes).length) {
                p = 100-100*((msgIndex+1) / (-msgs.length));
                p = Math.sign(p) === -1 ? 0 : p

            } else {
                var pId = id
                if (id) {
                    p = 100-100*(pId / Object.keys(hashes).length)


                } else {
                    p = 0
                }
                

            }
                        // console.log("VERSION", 10-((msgIndex+1) / (-msgs.length)), p)

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
                const messages = (data.messages || []).slice(initialCp || APP.ooconfig.documentType === 'spreadsheet' ? 0 : 1);

                if (config.debug) {
                    console.log(data.messages);
                }
                id = id !== undefined ? id : getId();
                fillOO(messages, ooCheckpoints);
                loading = false;
                // $share.show();

                callback(null, messages);
            });
        }

        // We want to load a checkpoint (or initial state)
        var loadMoreOOHistory = function (cb) {
            return new Promise((resolve, reject) => {
                if (!Array.isArray(sortedCp)) { 
                    console.error("Wrong type");
                    return resolve();
                }
                
                id = id !== undefined ? id : getId();

                if (ooMessages[id-1] && !ooMessages[id-1].length) {
                    var cp = hashes[id-1];
                } else {
                    var cp = hashes[id];
                }
                
                var nextId = hashes[id+1] ? hashes[id+1] : undefined;
                
                var toHash = nextId ? nextId.hash : config.onlyoffice.lastHash;
                var fromHash = cp?.hash || 'NONE';

                getMessages(toHash, fromHash, cpIndex, sortedCp, undefined, config, fillOO, $share, hashes, function (err, messages) {
                    if (err) {
                        console.error(err);
                        reject(err);
                        return;
                    }
                    resolve(); 
                });
            });
            
        };

        loadMoreOOHistory();

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

        var update = function (prev) {
            var cps = sortedCp.length;
            $fastPrev.show();
            $next.show();
            $prev.show();
            $fastNext.show();
            $hist.find('.cp-toolbar-history-next, .cp-toolbar-history-previous')
                .prop('disabled', '');

            var msgLength = Object.keys(hashes).length   

            if (
                (id === -1 || id === 0) && Math.abs(msgIndex) === ooMessages[id]?.length+2) {
                $fastPrev.prop('disabled', 'disabled');
            }
            if ((id === -1 || id === 0) && ooMessages[id]?.length+2=== Math.abs(msgIndex)
                ) {
                $prev.prop('disabled', 'disabled');
            }
            
            if ((id === msgLength) && msgIndex === -1 || 
            id === -1 && msgIndex === -1 ||
            Object.keys(hashes)[0] === id && msgIndex === -1 && !prev ||
            parseInt(Object.keys(hashes)[Object.keys(hashes).length - 1]) === id 
            && parseInt(Object.keys(ooMessages)[Object.keys(ooMessages).length - 1]) === id && !ooMessages[id].length ||
            parseInt(Object.keys(hashes)[Object.keys(hashes).length - 2]) === id && msgIndex === -1) {
                $fastNext.prop('disabled', 'disabled');
            } 

            // console.log((id === msgLength) && msgIndex === -1,
            // id === -1 && msgIndex === -1,
            // (id === msgLength || id === msgLength-1) && msgIndex === -1 && !prev,
            // parseInt(Object.keys(hashes)[Object.keys(hashes).length - 1]) === id && parseInt(Object.keys(ooMessages)[Object.keys(ooMessages).length - 1]) === id && !ooMessages[id].length)
            
            console.log(hashes, ooMessages, id, msgIndex, msgLength, ooMessages[id]?.length)  
                        // console.log(typeof id, typeof Object.keys(hashes)[Object.keys(hashes).length - 2])  


            console.log(
                            Object.keys(hashes)[0] === id && msgIndex === -1,
            (id === msgLength) && msgIndex === -1, 
                id === -1 && msgIndex === -1, 
            parseInt(Object.keys(hashes)[Object.keys(hashes).length - 1]) === id && 
            parseInt(Object.keys(ooMessages)[Object.keys(ooMessages).length - 1]) === id && !ooMessages[id].length,
            parseInt(Object.keys(hashes)[Object.keys(hashes).length - 2]) === id && msgIndex === -1 )

            if (
            Object.keys(hashes)[0]=== id && msgIndex === -1 || 
            (id === msgLength) && msgIndex === -1 || 
            id === -1 && msgIndex === -1 || 
            parseInt(Object.keys(hashes)[Object.keys(hashes).length - 1]) === id && 
            parseInt(Object.keys(ooMessages)[Object.keys(ooMessages).length - 1]) === id && !ooMessages[id].length ||
            parseInt(Object.keys(hashes)[Object.keys(hashes).length - 2]) === id && msgIndex === -1) {
                $next.prop('disabled', 'disabled');
            }
            
        };

        var loadingFalse = function () {
            setTimeout(function () {
                $('iframe').blur();
                loading = false;
            }, 200);
        }

        var next = async function () {
            msgIndex++;
            msgs = ooMessages[id];
            console.log("next1", hashes, id, ooMessages, msgIndex, msgs)
            if (Object.keys(hashes).length) {
                if (msgIndex === 0) {
                    id++;
                    loadMoreOOHistory().then(() => {
                        msgs = ooMessages[id];
                        if (!msgs.length) {
                            id++;
                            config.loadCp(hashes[id]);
                            return loadMoreOOHistory().then(() => {
                                loadingFalse();
                                msgIndex = -ooMessages[id].length-1;
                                showVersion(false, msgs.indexOf(patch)+1);
                                return;
                            });
                        }
                        msgIndex = -msgs.length;
                        var patch = msgs[msgs.length + msgIndex] ? msgs[msgs.length + msgIndex] : undefined;
                        var cp = hashes[id];
                        config.onPatchBack(cp, [patch]);
                        showVersion(false, msgs.indexOf(patch)+1);
                        loadingFalse();
                    })
                    return;
                } 
                else if (Math.abs(msgIndex) > msgs.length && msgs.length) {
                    msgIndex = -msgs.length
                }
                else if (!msgs.length) {
                    config.onPatchBack(hashes[id+1]);
                    return
                }
            } 
            else if (msgs.length + msgIndex === -1) {
                msgIndex++
            }
            var patch = msgs[msgs.length + msgIndex];
            console.log("next0.5", hashes, id, ooMessages, msgIndex, msgs, msgs.length + msgIndex)
            config.onPatch(patch);
            showVersion(false, msgs.indexOf(patch)+1);
            loadingFalse();
        };

        var msgs;

        var prev = function () {
            console.log("prev1", hashes, id, ooMessages, msgIndex)
            msgs = ooMessages[id];
            if (!Object.keys(hashes).length) {
                var cp = {};
            } else {
                if (msgs.length+1 === Math.abs(msgIndex) && id !== 0 || !msgs.length || msgs.length-Math.abs(msgIndex) === -2) {
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
            console.log("prev2", hashes, id, ooMessages, msgIndex)

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
                next().then(
                    update()
                );
                // update();
            });
            $prev.click(function () {
                if (loading) { return; }
                loading = true;
                prev();
                update(true)
            });
            // Go to previous checkpoint
            $fastNext.click(function () {
                if (loading) { return; }
                console.log("fastnext1", hashes, id, ooMessages, msgIndex)
                loading = true;
                if (id < Object.keys(hashes).length && id !== -1) {
                    if (id === -1) {
                        id = 1;
                    } else {
                        id++;
                    }
                    loadMoreOOHistory().then(() => {
                        var cp = hashes[id];
                        loadMoreOOHistory()
                        config.loadCp(cp);
                        msgs = ooMessages[id]
                        msgIndex = -msgs.length-1
                        console.log("fastnext0.5", hashes, id, ooMessages, msgIndex)
                        setTimeout(function () {
                            showVersion()
                            update();
                            loading = false;
                        }, 100);
                        return;


                    });
                    
                } else {
                    var cp = hashes[id];
                    var msgs = ooMessages[id]
                    msgIndex = -1
                    config.onPatchBack(cp, msgs);
                    
                }
                showVersion()
                console.log("fastnext2", hashes, id, ooMessages, msgIndex)

                setTimeout(function () {
                    update('end');
                    loading = false;
                }, 100);
            });
            // Go to next checkpoint
            $fastPrev.click(function () {
                console.log("fastprev1", hashes, id, ooMessages, msgIndex)

                if (loading) { return; }
                loading = true;
                if (!ooMessages[id].length || ooMessages[id].length+2 === Math.abs(msgIndex)) {
                    // console.log("fastprev0.25", ooMessages[id].length+1, Math.abs(msgIndex))
                    id--;
                } 
                // console.log("fastprev0.5", ooMessages[id]?.length+1, Math.abs(msgIndex))

                var cp = hashes[id];
                config.loadCp(cp);
                loadMoreOOHistory().then(() => {
                    var msgs = ooMessages[id];
                    msgIndex = -msgs.length-2;
                    showVersion()
                    update(true);
                // console.log("fastprev2", hashes, id, ooMessages, msgIndex)
                });
                loading = false;

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


