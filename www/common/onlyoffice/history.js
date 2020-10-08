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

        var fillOO = function (id, messages) {
            if (!id) { return; }
            if (ooMessages[id]) { return; }
            ooMessages[id] = messages;
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

        // We want to load a checkpoint (or initial state)
        var loadMoreOOHistory = function () {
            if (!Array.isArray(sortedCp)) { return void console.error("Wrong type"); }

            var cp = {};

            // Get the checkpoint ID
            var id = -1;
            if (cpIndex < sortedCp.length) {
                id = sortedCp[sortedCp.length - 1 - cpIndex];
                cp = hashes[id];
            }
            var nextId = sortedCp[sortedCp.length - cpIndex];

            // Get the history between "toHash" and "fromHash". This function is using
            // "getOlderHistory", that's why we start from the more recent hash
            // and we go back in time to an older hash

            // We need to get all the patches between the current cp hash and the next cp hash

            // Current cp or initial hash (invalid hash ==> initial hash)
            var toHash = cp.hash || 'NONE';
            // Next cp or last hash
            var fromHash = nextId ? hashes[nextId].hash : config.onlyoffice.lastHash;

            msgIndex = -1;

            showVersion();
            if (ooMessages[id]) {
                // Cp already loaded: reload OO
                loading = false;
                return void config.onCheckpoint(cp);
            }

            sframeChan.query('Q_GET_HISTORY_RANGE', {
                channel: config.onlyoffice.channel,
                lastKnownHash: fromHash,
                toHash: toHash,
            }, function (err, data) {
                if (err) { return void console.error(err); }
                if (!Array.isArray(data.messages)) { return void console.error('Not an array!'); }

                // The first "cp" in history is the empty doc. It doesn't include the first patch
                // of the history
                var initialCp = cpIndex === sortedCp.length;

                var messages = (data.messages || []).slice(initialCp ? 0 : 1);

                if (config.debug) { console.log(data.messages); }
                fillOO(id, messages);
                loading = false;
                config.onCheckpoint(cp);
                $share.show();
            });
        };

        var onClose = function () { config.setHistory(false); };
        var onRevert = function () {
            config.onRevert();
        };

        config.setHistory(true);

        $hist.html('').css('display', 'flex');
        $bottom.hide();

        UI.spinner($hist).get().show();

        var $fastPrev, $fastNext, $next;

        var getId = function () {
            var cps = sortedCp.length;
            return sortedCp[cps - cpIndex -1] || -1;
        };

        update = function () {
            var cps = sortedCp.length;
            $fastPrev.show();
            $next.show();
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
            var id = getId();
            if (!ooMessages[id]) { loading = false; return; }
            var msgs = ooMessages[id];
            msgIndex++;
            var patch = msgs[msgIndex];
            if (!patch) { loading = false; return; }
            config.onPatch(patch);
            showVersion();
            setTimeout(function () {
                $('iframe').blur();
                loading = false;
            }, 200);
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
            $fastPrev = $(fastPrev);
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
                if (loading) { return; }
                loading = true;
                next();
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
                if (msgIndex === -1) {
                    cpIndex++;
                }
                loadMoreOOHistory();
                update();
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


