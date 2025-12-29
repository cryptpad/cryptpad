// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/common/common-icons.js',
    '/common/common-util.js',

], function ($, UI, h, Icons, Util) {
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
        var ooMessages = {};
        var loading = false;
        var currentTime;
        //Defining position here means it can be passed to the showVersion and share functions
        var position;
        //Defining patch here means it can be passed to the snapshot function
        var patch;
        var currentVersion;
        var forward;

        // Get an array of the checkpoint IDs sorted their patch index
        var hashes = config.onlyoffice.hashes;
        var id;

        var sortedCp = Object.keys(hashes).map(Number);

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

        var $version, $share;
        var $hist = $toolbar.find('.cp-toolbar-history');
        $hist.addClass('cp-smallpatch');
        $hist.addClass('cp-history-oo');
        var $bottom = $toolbar.find('.cp-toolbar-bottom');
        var Messages = common.Messages;

        var getVersion = function (position) {
            let version = (id === -1 || id === 0) ? 0 : id;
            if (!Object.keys(ooMessages).length) {
                return '0.0';
            }
            if (typeof(position) === "undefined" || position === -1) {
                position = ooMessages[id]?.length || 0;
            } 
            return version + '.' + position;
        };

        var getMessages = function(fromHash, toHash, callback) {
            sframeChan.query('Q_GET_HISTORY_RANGE', {
                channel: config.onlyoffice.channel,
                lastKnownHash: fromHash,
                toHash: toHash,
            }, function (err, data) {

                if (err) { return void console.error(err); }
                if (!Array.isArray(data.messages)) { return void console.error('Not an array!'); }

                let initialCp = cpIndex === sortedCp.length;
                var messages = (data.messages || []).slice(initialCp || (config.docType() === 'spreadsheet' && toHash === 'NONE') ? 0 : 1);
                if (config.debug) { console.log(data.messages); }
                id = typeof(id) !== "undefined" ? id : getId();

                fillOO(messages);
                loading = false;
                callback(null, messages);
            });
        };

        // We want to load a checkpoint (or initial state)
        var loadMoreOOHistory = function () {
            return new Promise((resolve, reject) => {
                if (!Array.isArray(sortedCp)) { 
                    console.error("Wrong type");
                    return reject();
                }

                // Get the checkpoint ID
                id = typeof(id) !== "undefined" ? id : getId();
                var cp;
                console.log("HELLO", ooMessages, id, ooMessages[id-1])
                if (ooMessages[id-1] && !ooMessages[id-1].length) {
                    cp = hashes[id-1];
                } else {
                    cp = hashes[id];
                }

                // Get the history between "toHash" and "fromHash". This function is using
                // "getOlderHistory", that's why we start from the more recent hash
                // and we go back in time to an older hash

                // We need to get all the patches between the current cp hash and the next cp hash
                
                var nextId = hashes[id+1] ? hashes[id+1] : undefined;
                // Current cp or initial hash (invalid hash ==> initial hash)
                var fromHash = cp?.hash || 'NONE';
                // Next cp or last hash
                var toHash = nextId ? nextId.hash : config.onlyoffice.lastHash;

                getMessages(toHash, fromHash, function (err) {
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
            config.onRevert();
        };

        config.setHistory(true);

        $hist.html('').css('display', 'flex');
        $bottom.hide();

        // UI.spinner($hist).get().show();

        var $fastPrev, $fastNext, $next, $prev;

        var update = function () {
            $fastPrev.show();
            $next.show();
            $prev.show();
            $fastNext.show();
            $hist.find('.cp-toolbar-history-next, .cp-toolbar-history-previous')
                .prop('disabled', '');

            if ((id === -1 || id === 0) && (ooMessages[id]?.length+1 === Math.abs(msgIndex) || ooMessages[id]?.length+2 === Math.abs(msgIndex))) {
                $prev.prop('disabled', 'disabled');
                $fastPrev.prop('disabled', 'disabled');
            }
            var version = currentVersion.split('.');
            var hashesLength = Object.keys(hashes).length;
            
            if (hashesLength === parseInt(version[0]) && ooMessages[id]?.length === parseInt(version[1]) || 
            hashesLength+1 === id && (msgIndex === -1) && forward  ||
            hashes[hashesLength-1] === id && !ooMessages[id].length && msgIndex === 0) {
                $next.prop('disabled', 'disabled');
                $fastNext.prop('disabled', 'disabled');
            }
        };

        var loadingFalse = function () {
            setTimeout(function () {
                $('iframe').blur();
                loading = false;
            }, 200);
        };

        var msgs;

        var showVersion = function (initial, position) {
            currentVersion = getVersion(position, initial);
            if (initial) { currentVersion = Messages.oo_version_latest; }
            $version.text(Messages.oo_version + currentVersion + ' ' + new Date(patch.time).toLocaleString());
            $('.cp-history-timeline-pos-oo').remove();
            $('.cp-history-oo-timeline-pos').removeClass('cp-history-oo-timeline-pos');
            if (position === msgs.length && id < Object.keys(hashes)[Object.keys(hashes).length-1]) {
                var currentPatch = $(`[data="${id+1},0"]`);
            } else {
                currentPatch = $(`[data="${id},${position}"]`);
            }
            var pos = Icons.get('chevron-down', {'class': 'cp-history-timeline-pos-oo'});
            $(currentPatch).addClass('cp-history-oo-timeline-pos').append(pos);

            update();
            loadingFalse();
        };

        var displayCheckpointTimeline = function(initial) {          
            var bar = $hist.find('.cp-history-timeline-container');
            $(bar).addClass('cp-history-timeline-bar').addClass('cp-oohistory-bar-el');
            if (initial) {
                var snapshotsEl = [];
                loadMoreOOHistory();
                msgs = ooMessages[id];
                var msgsRev = msgs;
            } else {
                msgs = ooMessages[id];
                snapshotsEl = Array.from($hist.find('.cp-history-snapshots-oo')[0].childNodes);
                msgsRev = msgs.slice().reverse();
            }

            var cpNfInner = common.startRealtime(config);
            var md = Util.clone(cpNfInner.metadataMgr.getMetadata());
            var snapshots = md.snapshots;

            var patchWidth;
            var patchDiv;
            for (var i = 0; i < msgs.length; i++) {
                var msg = msgs[i];
                if (initial || id === -1) {
                    patchWidth = (1/msgs.length)*100;
                } else {
                    patchWidth = (1/(msgs.length+Array.from($hist.find('.cp-history-snapshots-oo')[0].childNodes).length))*100;
                }
                
                patchDiv = h(`div.cp-history-patch`, {
                    style: 'width:'+patchWidth+'%; height: 100%; position: relative; display: flex; justify-content: center; box-sizing: border-box;',
                    title: new Date(msg.time).toLocaleString(),
                    data: [id, msgsRev.indexOf(msg)] 
                });
                if (initial) {
                    snapshotsEl.push(patchDiv);
                } else {
                    snapshotsEl.unshift(patchDiv);
                }
                 if (snapshots) {
                    var match = Object.values(snapshots).find(item => item.time === msg.time);
                    if (match) { $(patchDiv).addClass('cp-history-snapshot').append(Icons.get('snapshot', {title: match.title})); }
                 }
            }

            var finalpatchDiv = h('div.cp-history-patch', {
                style: 'width:'+patchWidth+'%; height: 100%; position: relative',
                title: new Date().toLocaleString(),
                data: [id, msgs.length] 
            });
            if (initial) {
                snapshotsEl.push(finalpatchDiv);
            } 
                
            var pos = Icons.get('chevron-down', {'class': 'cp-history-timeline-pos-oo'});

            if (!initial) {
                Array.from($hist.find('.cp-history-snapshots-oo')[0].childNodes).forEach(function(patch) {
                    $(patch).css('width', `${patchWidth}%`);
                });
            } 

            var patches = h('div.cp-history-snapshots-oo', [
                snapshotsEl
            ]);
            $(patches).css('height', '100%');
            $(patches).css('display', 'flex');

            bar.html('').append([
                patches
            ]);

            if (initial) {
                $('.cp-history-patch').last().addClass('cp-history-oo-timeline-pos').append(pos);
            }

            $('.cp-history-patch').on('click', function(e) {
                var patchData = $(e.target).attr('data').split(',');

                var cpNo = parseInt(patchData[0]);
                var patchNo = parseInt(patchData[1]);
                id = cpNo;

                loadMoreOOHistory().then(() => {
                    msgs = ooMessages[id];
                    if (cpNo === -1) {
                        var q = msgs.slice(0, patchNo);
                        config.onPatchBack({}, q);
                        patch = msgs[patchNo];
                    } else if (cpNo === 0 && patchNo === 0) {
                        config.onPatchBack({});
                        patch = msgs[0];
                    } else {
                        q = msgs.slice(0, patchNo);
                        config.onPatchBack(hashes[cpNo], q);
                        patch = msgs[patchNo];
                    }
                    position = msgs.indexOf(patch);
                    msgIndex = position === -1 ? -1 : position - msgs.length-1;
                    showVersion(false, position);
                    update();
                });
            });
        };

        var lastPatchIndex;
        var nextPatchIndex;

        var next = async function () {
            forward = true;
            msgIndex++;
            msgs = ooMessages[id];
            lastPatchIndex = 0;
            if (Object.keys(hashes).length) {
                //Check if the end of the checkpoint has been reached and the next one should be loaded
                if (msgIndex === 0) {
                    id++;
                    await loadMoreOOHistory();
                    msgs = ooMessages[id];
                    //Empty checkpoint (checkpoint created/history restored with no further changes)
                    if (!msgs.length) {
                        config.loadHistoryCp(hashes[id]);
                        await loadMoreOOHistory();
                        msgIndex = -ooMessages[id].length;
                        showVersion(false);
                        return;
                    } else {
                        //Is the checkpoint the result of restoring history? If yes, we need to load an extra patch
                        if (nextPatchIndex !== 0 &&  Math.abs(nextPatchIndex - JSON.parse(msgs[0].msg).changesIndex) <= 1) {
                            msgIndex = -ooMessages[id].length;
                            config.onPatchBack(hashes[id], [msgs[0]]);
                            position = 1;
                        } else {
                            msgIndex = -ooMessages[id].length-1;
                            config.loadHistoryCp(hashes[id]);
                            position = 0;
                        }            
                        showVersion(false, position);
                        return;
                    }
                } else {
                    if (!msgs.length) {    
                        position = 0;
                        showVersion(false, 0);
                        return config.loadHistoryCp(hashes[id + 1]); }
                        //Adjust msgIndex after fastPrev 
                    if (Math.abs(msgIndex) > msgs.length) { msgIndex = -msgs.length; }
                }
            } 
            else if (msgs.length + msgIndex === -1) { msgIndex++; }

            patch = msgs[msgs.length + msgIndex];
            position = msgs.indexOf(patch) + 1;
            config.onPatch?.(patch);
            nextPatchIndex = JSON.parse(patch.msg).changesIndex;
            showVersion(false, position);
        };

        var prev = function () {
            forward = false;
            msgs = ooMessages[id];
            nextPatchIndex = 0;
            let hasHashes = Object.keys(hashes).length;
            let cp = hasHashes ? hashes[id] : {};
            let loadPrevCp = (!msgs.length) ||
                    (msgs.length + 1 === Math.abs(msgIndex) && id !== 0) ||
                    (msgs.length - Math.abs(msgIndex) === -2); 
                    
            //Check if the end of the checkpoint has been reached and the previous one should be loaded
            if (hasHashes && loadPrevCp) {
                var currentCp = msgs.length;
                id--; 
                msgIndex = -1;
                return loadMoreOOHistory().then(() => {
          
                    //Empty checkpoint - checkpoint saved with no further changes
                    if (!msgs.length) {
                        msgs = ooMessages[id];
                        config.onPatchBack(hashes[id], msgs.slice(0, msgIndex));
                        msgIndex--;
                        showVersion(false);
                        return;
                    }
                    msgs = ooMessages[id];
                    var nextCp = msgs.length;
                    cp = hashes[id];
                    var q = msgs.slice(0, msgIndex);
                    patch = msgs[msgs.length-1];
                    var currentPatchIndex = JSON.parse(patch.msg).changesIndex;
                    position = msgs.indexOf(patch);
                    //Is the checkpoint the result of restoring history? If yes, we need to load an extra patch
                    if (lastPatchIndex !==0 && Math.abs(lastPatchIndex - currentPatchIndex) <= 1) {
                        config.onPatchBack(cp, q); 
                        msgIndex--;
                    } else {
                        config.onPatchBack(cp, msgs);
                    }
                    //Check if this checkpoint has already been added to the timeline
                    if (!$(`[data="${id},0"]`).length) {
                        displayCheckpointTimeline();
                    }
                    
                    showVersion(false, position, currentCp, nextCp);
                });
            }
            var q = msgs.slice(0, msgIndex);
            config.onPatchBack(cp, q);   
            patch = msgs[msgs.length + msgIndex];
            msgIndex--; 
            position = msgs.indexOf(patch);
            lastPatchIndex = JSON.parse(patch.msg).changesIndex;
            showVersion(false, position);
        };

        setTimeout(() => {
            displayCheckpointTimeline(true);
        }, "1000");

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
                Icons.get('history-prev')
            ]);
            $fastPrev = $(fastPrev);
            $prev = $(_prev);
            $fastNext = $(fastNext).prop('disabled', 'disabled');
            $next = $(_next).prop('disabled', 'disabled');

            var time = h('div.cp-history-timeline-time');
            var version = h('div.cp-history-timeline-version');
            $version = $(version);
            var timeline = h('div.cp-toolbar-history-timeline', [
                h('div.cp-history-timeline-line', [
                    h('span.cp-history-timeline-container')
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
                lastPatchIndex = 0;
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
                        config.loadHistoryCp(cp);
                        var msgs = ooMessages[id];
                        msgIndex = -msgs.length-1;
                        position = 0;
                        showVersion(false, position);
                        loading = false;
                        return;
                    });
                } else {
                    var cp = hashes[id];
                    var msgs = ooMessages[id];
                    msgIndex = -1;
                    config.onPatchBack(cp, msgs);
                }

                loadingFalse();
                position = msgs?.length;
                showVersion(false, position);
            });
            
            // Go to previous checkpoint
            $fastPrev.click(function () {
                if (loading) { return; }
                loading = true;
                if (!ooMessages[id].length || ooMessages[id].length+1 === Math.abs(msgIndex)) {
                    id--;
                } 
                var cp = hashes[id];
                config.loadHistoryCp(cp);
                loadMoreOOHistory().then(() => {
                    var msgs = ooMessages[id];
                    lastPatchIndex = JSON.parse(msgs[0].msg).changesIndex;
                    msgIndex = -msgs.length-1;
                    if (!$(`[data="${id},0"]`).length) {
                        displayCheckpointTimeline();
                    }
                    patch = msgs[msgs.length-1];
                    position = 0;

                    showVersion(false, 0);
                    update(true);
                });
                
                loadingFalse();
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
                    iconClass: 'snapshot',
                    name: Messages.snapshots_new,
                    onClick: function () {
                        var val = $input.val();
                        if (!val) { return true; }
                        msgs = ooMessages[id];
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

    };

    return History;
});


