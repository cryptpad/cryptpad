// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/common/common-icons.js',

], function ($, UI, h, Icons) {
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
        var loading = false;
        var currentTime;
        var position;
        var patch;
        var v;

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

        var fillOO = function (messages) {
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
                let version = (id === -1 || id === 0) ? 0 : id;
                
                if (position === undefined) {
                    position = ooMessages[id]?.length || 0;
                } else if (position === ooMessages[id]?.length && hashes[version + 1]) {
                    position = 0;
                    if (ooMessages[id]?.length) {
                        version++;
                    }
                }
                return version + '.' + position;
            }
        };

        var showVersion = function (initial, position) {
            v = getVersion(position, initial);
            if (initial) {
                v = Messages.oo_version_latest;
            }
            $version.text(Messages.oo_version + v);

            var $pos = $hist.find('.cp-history-timeline-pos');
            if (!ooMessages[id]) { return; }
            var msgs = ooMessages[id];
            var p;
            var messageIndex = APP.next ? msgIndex+1 : msgIndex;
            if (!Object.keys(hashes).length) {
                p = 100-100*((messageIndex ) / (-msgs.length));
            } else {
                var lastHash = hashes[Object.keys(hashes).pop()].hash;
                if (lastHash === config.onlyoffice.lastHash) {
                    var hashLength = Object.keys(hashes).length;
                } else {
                    var hashLength = Object.keys(hashes).length+1;
                }
                var segments = id/hashLength;
                p = 100*(segments); 

                if (id === 0) {
                    p = 0;
                }
                
                var percentage = ((position/msgs.length)*100);
                var timelinePosition = (percentage/100)*(100/hashLength);
                p += timelinePosition;
            }

            $pos.css('margin-left', p+'%');

            var time = msgs[msgIndex] && msgs[msgIndex].time;
            currentTime = time;
            if (time) { $time.text(new Date(time).toLocaleString()); }
            else { $time.text(''); }
            update();
        };

        function getMessages(fromHash, toHash, cpIndex, sortedCp, cp, config, fillOO, $share, ooCheckpoints, callback) {
            sframeChan.query('Q_GET_HISTORY_RANGE', {
                channel: config.onlyoffice.channel,
                lastKnownHash: fromHash,
                toHash: toHash,
            }, function (err, data) {
                if (err) { return void console.error(err); }
                if (!Array.isArray(data.messages)) { return void console.error('Not an array!'); }

                let initialCp = cpIndex === sortedCp.length || cp ? !cp?.hash : undefined;
                var messages = (data.messages || []).slice(initialCp || APP.ooconfig.documentType === 'spreadsheet' ? 0 : 1);
                if (config.debug) { console.log(data.messages); }
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

        var spinner = UI.makeSpinner($hist);
        spinner.spin();

        var $fastPrev, $fastNext, $next, $prev;

        var update = function () {
            $fastPrev.show();
            $next.show();
            $prev.show();
            $fastNext.show();
            $hist.find('.cp-toolbar-history-next, .cp-toolbar-history-previous')
                .prop('disabled', '');

            if ((id === -1 || id === 0) && Math.abs(msgIndex) === ooMessages[id]?.length+2) {
                $fastPrev.prop('disabled', 'disabled');
            }
            if ((id === -1 || id === 0) && ooMessages[id]?.length+2=== Math.abs(msgIndex)) {
                $prev.prop('disabled', 'disabled');
            }
            var version = v.split('.');
            var hashesLength = Object.keys(hashes).length;
            var lastestHash = hashes[Object.keys(hashes).pop()]?.hash;
              
            if (hashesLength === parseInt(version[0]) && ooMessages[id].length === parseInt(version[1]) ||
              hashesLength === parseInt(version[0]) && parseInt(version[1]) === 0 && lastestHash === config.onlyoffice.lastHash) {
                $next.prop('disabled', 'disabled');
                $fastNext.prop('disabled', 'disabled');
            }
        };

        var loadingFalse = function () {
            setTimeout(function () {
                $('iframe').blur();
                loading = false;
            }, 200);
        }

        var next = async function () {
            APP.next = true;
            msgIndex++;
            msgs = ooMessages[id];

            if (Object.keys(hashes).length) {
                if (msgIndex === 0) {
                    id++;
                    await loadMoreOOHistory();
                    msgs = ooMessages[id];

                    if (!msgs.length) {
                        id++;
                        config.loadCp(hashes[id]);
                        await loadMoreOOHistory();
                        msgIndex = -ooMessages[id].length - 1;
                    } else {
                        msgIndex = -msgs.length;
                        patch = msgs[msgs.length + msgIndex];
                        config.onPatchBack(hashes[id], [patch]);
                    }
                } else {
                    if (!msgs.length) return config.onPatchBack(hashes[id + 1]);
                    if (Math.abs(msgIndex) > msgs.length) msgIndex = -msgs.length;
                }
            } else if (msgs.length + msgIndex === -1) {
                msgIndex++;
            }

            patch = msgs[msgs.length + msgIndex];
            position = msgs.indexOf(patch) + 1;
            config.onPatch?.(patch);
            showVersion(false, position);
            loadingFalse();
        };


        var msgs;

        var prev = function () {
            APP.next = false;
            msgs = ooMessages[id];
            let hasHashes = Object.keys(hashes).length;
            let cp = hasHashes ? hashes[id] : {};
            let loadPrevCp = (!msgs.length) ||
                    (msgs.length + 1 === Math.abs(msgIndex) && id !== 0) ||
                    (msgs.length - Math.abs(msgIndex) === -2);
            
            var goBack = function () {
                var q = msgs.slice(0, msgIndex);
                config.onPatchBack(cp, q);
                position = q.length;
                patch = q[position - 1];
                showVersion(false, position);
                msgIndex--; 
                loadingFalse();
            }

            if (hasHashes && loadPrevCp) {
                id--; 
                msgIndex = -1;
                return loadMoreOOHistory().then(() => {
                    msgs = ooMessages[id];
                    cp = hashes[id];
                    goBack();                    
                });
            }
            goBack();
        };

        // Create the history toolbar
        var display = function () {
            $hist.html('');

            var fastPrev = h('button.cp-toolbar-history-previous', { title: Messages.history_prev }, [
                Icons.get('history-fast-prev'),
            ]);
            var fastNext = h('button.cp-toolbar-history-next', { title: Messages.history_next }, [
                Icons.get('history-fast-next'),
            ]);
            var _next = h('button.cp-toolbar-history-next', { title: Messages.history_next }, [
                Icons.get('history-next'),
            ]);
            var _prev = h('button.cp-toolbar-history-previous', { title: Messages.history_prev }, [
                h('i.fa.fa-step-backward')
            ]);
            $fastPrev = $(fastPrev);
            $prev = $(_prev);
            $fastNext = $(fastNext).prop('disabled', 'disabled');
            $next = $(_next).prop('disabled', 'disabled');
            // .prop('disabled', 'disabled');

            var pos = Icons.get('chevron-down', {'class': 'cp-history-timeline-pos'});
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
                class: 'cp-history-create-snapshot'
            }, [
                Icons.get('snapshot')
            ]);
            var share = h('button', { title: Messages.history_shareTitle }, [
                Icons.get('share'),
                h('span', Messages.shareButton)
            ]);
            var restore = h('button', {
                title: Messages.history_restoreTitle,
            }, [
                Icons.get('history-restore'),
                h('span', Messages.history_restore)
            ]);
            var close = h('button', { title: Messages.history_closeTitle }, [
                Icons.get('close'),
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
                if (loading) { return; }
                loading = true;
                next();
            });
            $prev.click(function () {
                if (loading) { return; }
                loading = true;
                prev();
            });

            // Go to next checkpoint
            $fastNext.click(function () {
                if (loading) { return; }
                loading = true;
                if (id < Object.keys(hashes).length && id !== -1) {
                    if (id === -1) {
                        id = 1;
                    } else {
                        id++;
                    }
                    loadMoreOOHistory().then(() => {
                        var cp = hashes[id];
                        loadMoreOOHistory();
                        config.loadCp(cp);
                        msgs = ooMessages[id];
                        msgIndex = -msgs.length-1
                        showVersion(false, 0)
                        loading = false;
                        return;
                    });
                } else {
                    var cp = hashes[id];
                    var msgs = ooMessages[id];
                    msgIndex = -1;
                    config.onPatchBack(cp, msgs);
                }

                loading = false;
                position = msgs?.length
                showVersion(false, position)
            });
            
            // Go to previous checkpoint
            $fastPrev.click(function () {
                if (loading) { return; }
                loading = true;
                if (!ooMessages[id].length || ooMessages[id].length+2 === Math.abs(msgIndex)) {
                    id--;
                } 
                var cp = hashes[id];
                config.loadCp(cp);
                loadMoreOOHistory().then(() => {
                    var msgs = ooMessages[id];
                    msgIndex = -msgs.length-2;
                    showVersion(false, 0)
                    update(true);
                });
                position = 0;
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
                    versionHash: getVersion(position)
                });
            });
            $(snapshot).click(function () {
                // if (cpIndex === -1 && msgIndex === -1) { return void UI.warn(Messages.snapshots_ooPickVersion); }
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
                    iconClass: 'snapshot',
                    name: Messages.snapshots_new,
                    onClick: function () {
                        var val = $input.val();
                        if (!val) { return true; }
                        msgs = ooMessages[id]
                        config.makeSnapshot(val, function (err) {
                            if (err) { return; }
                            $input.val('');
                            UI.log(Messages.saved);
                        }, {
                            hash: getVersion(position),                            
                            time: currentTime || patch && patch.time || 0
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


