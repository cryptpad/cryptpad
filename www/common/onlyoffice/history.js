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

        if (!config.onlyoffice || !config.setHistory || !config.onCheckpoint || !config.onPatch) {
            throw new Error("Missing config element");
        }

        var cpIndex = -1;
        var msgIndex = 0;
        var ooMessages = {};
        var loading = false;
        var update = function () {};

        // Get an array of the checkpoint IDs sorted their patch index
        var hashes = config.onlyoffice.hashes;
        var sortedCp = Object.keys(hashes).map(Number).sort(function (a, b) {
            return hashes[a].index - hashes[b].index;
        });

        var endWithCp = config.onlyoffice.lastHash === hashes[sortedCp[sortedCp.length - 1]].hash;

        var fillOO = function (id, messages) {
            if (!id) { return; }
            if (ooMessages[id]) { return; }
            ooMessages[id] = messages;
            update();
        };

        if (endWithCp) { cpIndex = 0; }

        var $version, $time, $share;
        var $hist = $toolbar.find('.cp-toolbar-history');
        var $bottom = $toolbar.find('.cp-toolbar-bottom');

        var getVersion = function () {
            var major = sortedCp.length - cpIndex;
            return major + '.' + msgIndex;
        };
        var showVersion = function (initial) {
            var v = getVersion();
            if (initial) {
                v = "Latest"; // XXX
            }
            $version.text("Version: " + v); // XXX

            var $pos = $hist.find('.cp-toolbar-history-pos');
            var cps = sortedCp.length;
            var id = sortedCp[cps - cpIndex -1] || -1;
            if (!ooMessages[id]) { return; }
            var msgs = ooMessages[id];
            var p = 100*(msgIndex / (msgs.length));
            $pos.css('margin-left', p+'%');

            var time = msgs[msgIndex].time;
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

            msgIndex = 0;

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

                var messages = (data.messages || []).slice(1);

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

        var Messages = common.Messages;

        var states = [];

        $hist.html('').css('display', 'flex');
        $bottom.hide();

        UI.spinner($hist).get().show();

        var $fastPrev = $('<button>', {
            'class': 'cp-toolbar-history-fast-previous fa fa-fast-backward buttonPrimary',
            title: Messages.history_prev
        });
        var $next = $('<button>', {
            'class': 'cp-toolbar-history-next fa fa-step-forward buttonPrimary',
            title: Messages.history_next
        });
        var $fastNext = $('<button>', {
            'class': 'cp-toolbar-history-fast-next fa fa-fast-forward buttonPrimary',
            title: Messages.history_next
        });

        var getId = function () {
            var cps = sortedCp.length;
            return sortedCp[cps - cpIndex -1] || -1;
        };

        update = function () {
            var cps = sortedCp.length;
            $fastPrev.show();
            $next.show();
            $fastNext.show();
            if (cpIndex >= cps) {
                $fastPrev.hide();
            }
            if (cpIndex === 0) {
                $fastNext.hide();
            }
            var id = getId();
            var msgs = (ooMessages[id] || []).length;
            if (msgIndex >= msgs) {
                $next.hide();
            }
        };

        var next = function () {
            var id = getId();
            if (!ooMessages[id]) { return; }
            var msgs = ooMessages[id];
            var patch = msgs[msgIndex];
            config.onPatch(patch);
            loading = false;
            msgIndex++;
            showVersion();
            setTimeout(function () {
                $('iframe').blur();
            }, 200);
        };

        // Create the history toolbar
        var display = function () {
            $hist.html('');

            var $rev = $('<button>', {
                'class':'cp-toolbar-history-revert buttonSuccess fa fa-check-circle-o',
                title: Messages.history_restoreTitle
            }).appendTo($hist);//.text(Messages.history_restore);
            if (History.readOnly) { $rev.css('visibility', 'hidden'); }
            $('<span>', {'class': 'cp-history-filler'}).appendTo($hist);

            $fastPrev.appendTo($hist);
            //$prev.hide().appendTo($hist);
            var $nav = $('<div>', {'class': 'cp-toolbar-history-goto'}).appendTo($hist);
            $next.hide().appendTo($hist);
            $fastNext.hide().appendTo($hist);

            $share = $('<button>', {
                'class': 'fa fa-shhare-alt buttonPrimary',
                title: Messages.shareButton
            }).hide().appendTo($hist);
            $('<span>', {'class': 'cp-history-filler'}).appendTo($hist);
            $time = $(h('div')).appendTo($hist);
            var $close = $('<button>', {
                'class':'cp-toolbar-history-close fa fa-window-close',
                title: Messages.history_closeTitle
            }).appendTo($hist);

            var $bar = $('<div>', {'class': 'cp-toolbar-history-bar'}).appendTo($nav);
            var $container = $('<div>', {'class':'cp-toolbar-history-pos-container'}).appendTo($bar);
            $('<div>', {'class': 'cp-toolbar-history-pos'}).appendTo($container);

            $version = $('<span>', {
                'class': 'cp-toolbar-history-version'
            }).prependTo($bar);

            var onKeyDown, onKeyUp;
            var close = function () {
                History.loading = false;
                $hist.hide();
                $bottom.show();
                $(window).trigger('resize');
                $(window).off('keydown', onKeyDown);
                $(window).off('keyup', onKeyUp);
            };

            // Close & restore buttons
            $close.click(function () {
                states = [];
                close();
                onClose();
            });
            $rev.click(function () {
                UI.confirm(Messages.history_restorePrompt, function (yes) {
                    if (!yes) { return; }
                    close();
                    History.loading = false;
                    onRevert();
                    UI.log(Messages.history_restoreDone);
                });
            });

            // Versioned link
            $share.click(function () {
                // XXX
                common.getSframeChannel().event('EV_SHARE_OPEN', {
                    versionHash: getVersion()
                });
            });

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
                if (msgIndex === 0) {
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
                if (e.which === 27) { p(); $close.click(); }
            };
            onKeyUp = function (e) { e.stopPropagation(); };
            $(window).on('keydown', onKeyDown).on('keyup', onKeyUp).focus();
            $(window).trigger('resize');
        };

        display();

        showVersion(true);

        //return void loadMoreOOHistory();
    };

    return History;
});


