define([
    'jquery',
    '/common/common-interface.js',
    '/bower_components/nthen/index.js',
    //'/bower_components/chainpad-json-validator/json-ot.js',

    '/bower_components/chainpad/chainpad.dist.js',
], function ($, UI, nThen, ChainPad /* JsonOT */) {
    //var ChainPad = window.ChainPad;
    var History = {};

    History.create = function (common, config) {
        if (!config.$toolbar) { return void console.error("config.$toolbar is undefined");}
        if (History.loading) { return void console.error("History is already being loaded..."); }
        History.loading = true;
        var $toolbar = config.$toolbar;

        if (!config.applyVal || !config.setHistory || !config.onLocal || !config.onRemote) {
            throw new Error("Missing config element: applyVal, onLocal, onRemote, setHistory");
        }

        var getStates = function (rt) {
            var states = [];
            var b = rt.getAuthBlock();
            if (b) { states.unshift(b); }
            while (b.getParent()) {
                b = b.getParent();
                states.unshift(b);
            }
            return states;
        };

        var createRealtime = function (config) {
            return ChainPad.create({
                userName: 'history',
                validateContent: function (content) {
                    try {
                        JSON.parse(content);
                        return true;
                    } catch (e) {
                        console.log('Failed to parse, rejecting patch');
                        return false;
                    }
                },
                initialState: '',
                logLevel: config.debug ? 2 : 0,
                noPrune: true
            });
        };

        var fillChainPad = function (realtime, messages) {
            messages.forEach(function (m) {
                realtime.message(m);
            });
        };

        var allMessages = [];
        var lastKnownHash;
        var isComplete = false;
        var loadMoreHistory = function (config, common, cb) {
            if (isComplete) { return void cb ('EFULL'); }
            var realtime = createRealtime(config);
            var sframeChan = common.getSframeChannel();

            sframeChan.query('Q_GET_HISTORY_RANGE', {
                lastKnownHash: lastKnownHash,
                sharedFolder: config.sharedFolder
            }, function (err, data) {
                if (err) { return void console.error(err); }
                if (!Array.isArray(data.messages)) { return void console.error('Not an array!'); }
                lastKnownHash = data.lastKnownHash;
                isComplete = data.isFull;
                Array.prototype.unshift.apply(allMessages, data.messages); // Destructive concat
                fillChainPad(realtime, allMessages);
                cb (null, realtime, data.isFull);
            });
        };

        // config.setHistory(bool, bool)
        // - bool1: history value
        // - bool2: reset old content?
        var render = function (val) {
            if (typeof val === "undefined") { return; }
            try {
                config.applyVal(val);
            } catch (e) {
                // Probably a parse error
                console.error(e);
            }
        };
        var onClose = function () { config.setHistory(false, true); };
        var onRevert = function () {
            config.setHistory(false, false);
            config.onLocal();
            config.onRemote();
        };

        config.setHistory(true);

        var Messages = common.Messages;

        var realtime;

        var states = [];
        var c = 0;//states.length - 1;

        var $hist = $toolbar.find('.cp-toolbar-history');
        var $left = $toolbar.find('.cp-toolbar-leftside');
        var $right = $toolbar.find('.cp-toolbar-rightside');
        var $cke = $toolbar.find('.cke_toolbox_main');

        $hist.html('').css('display', 'flex');
        $left.hide();
        $right.hide();
        $cke.hide();

        UI.spinner($hist).get().show();

        var onUpdate;

        var update = function (newRt) {
            realtime = newRt;
            if (!realtime) { return []; }
            states = getStates(realtime);
            if (typeof onUpdate === "function") { onUpdate(); }
            return states;
        };

        var $loadMore, $version, get;

        // Get the content of the selected version, and change the version number
        var loading = false;
        var loadMore = function (cb) {
            if (loading) { return; }
            loading = true;
            $loadMore.removeClass('fa fa-ellipsis-h')
                .append($('<span>', {'class': 'fa fa-refresh fa-spin fa-3x fa-fw'}));

            loadMoreHistory(config, common, function (err, newRt, isFull) {
                if (err === 'EFULL') {
                    $loadMore.off('click').hide();
                    get(c);
                    $version.show();
                    return;
                }
                loading = false;
                if (err) { return void console.error(err); }
                update(newRt);
                $loadMore.addClass('fa fa-ellipsis-h').html('');
                get(c);
                if (isFull) {
                    $loadMore.off('click').hide();
                    $version.show();
                }
                if (cb) { cb(); }
            });
        };
        get = function (i) {
            i = parseInt(i);
            if (isNaN(i)) { return; }
            if (i > 0) { i = 0; }
            if (i < -(states.length - 2)) { i = -(states.length - 2); }
            if (i <= -(states.length - 11)) {
                loadMore();
            }
            var idx = states.length - 1 + i;
            var val = states[idx].getContent().doc;
            c = i;
            if (typeof onUpdate === "function") { onUpdate(); }
            $hist.find('.cp-toolbar-history-next, .cp-toolbar-history-previous, ' +
                       '.cp-toolbar-history-fast-next, .cp-toolbar-history-fast-previous')
                .css('visibility', '');
            if (c === -(states.length-1)) {
                $hist.find('.cp-toolbar-history-previous').css('visibility', 'hidden');
                $hist.find('.cp-toolbar-history-fast-previous').css('visibility', 'hidden');
            }
            if (c === 0) {
                $hist.find('.cp-toolbar-history-next').css('visibility', 'hidden');
                $hist.find('.cp-toolbar-history-fast-next').css('visibility', 'hidden');
            }
            var $pos = $hist.find('.cp-toolbar-history-pos');
            var p = 100 * (1 - (-c / (states.length-2)));
            $pos.css('margin-left', p+'%');

            // Display the version when the full history is loaded
            // Note: the first version is always empty and probably can't be displayed, so
            // we can consider we have only states.length - 1 versions
            $version.text(idx + ' / ' + (states.length-1));

            if (config.debug) {
                console.log(states[idx]);
                var ops = states[idx] && states[idx].getPatch() && states[idx].getPatch().operations;
                if (Array.isArray(ops)) {
                    ops.forEach(function (op) { console.log(op); });
                }
            }

            return val || '';
        };

        var getNext = function (step) {
            return typeof step === "number" ? get(c + step) : get(c + 1);
        };
        var getPrevious = function (step) {
            return typeof step === "number" ? get(c - step) : get(c - 1);
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
            var $fastPrev = $('<button>', {
                'class': 'cp-toolbar-history-fast-previous fa fa-fast-backward buttonPrimary',
                title: Messages.history_prev
            }).appendTo($hist);
            var $prev =$('<button>', {
                'class': 'cp-toolbar-history-previous fa fa-step-backward buttonPrimary',
                title: Messages.history_prev
            }).appendTo($hist);
            var $nav = $('<div>', {'class': 'cp-toolbar-history-goto'}).appendTo($hist);
            var $next = $('<button>', {
                'class': 'cp-toolbar-history-next fa fa-step-forward buttonPrimary',
                title: Messages.history_next
            }).appendTo($hist);
            var $fastNext = $('<button>', {
                'class': 'cp-toolbar-history-fast-next fa fa-fast-forward buttonPrimary',
                title: Messages.history_next
            }).appendTo($hist);
            $('<span>', {'class': 'cp-history-filler'}).appendTo($hist);
            var $close = $('<button>', {
                'class':'cp-toolbar-history-close fa fa-window-close',
                title: Messages.history_closeTitle
            }).appendTo($hist);

            var $bar = $('<div>', {'class': 'cp-toolbar-history-bar'}).appendTo($nav);
            var $container = $('<div>', {'class':'cp-toolbar-history-pos-container'}).appendTo($bar);
            $('<div>', {'class': 'cp-toolbar-history-pos'}).appendTo($container);

            $version = $('<span>', {
                'class': 'cp-toolbar-history-version'
            }).prependTo($bar).hide();
            $loadMore = $('<button>', {
                'class':'cp-toolbar-history-loadmore fa fa-ellipsis-h',
                title: Messages.history_loadMore
            }).click(function () {
                loadMore(function () {
                    get(c);
                });
            }).prependTo($container);

            // Load a version when clicking on the bar
            $container.click(function (e) {
                e.stopPropagation();
                if (!$(e.target).is('.cp-toolbar-history-pos-container')) { return; }
                var p = e.offsetX / $container.width();
                var v = -Math.round((states.length - 1) * (1 - p));
                render(get(v));
            });

            onUpdate = function () {
                // Called when a new version is loaded
            };

            var onKeyDown, onKeyUp;
            var close = function () {
                $hist.hide();
                $left.show();
                $right.show();
                $cke.show();
                $(window).trigger('resize');
                $(window).off('keydown', onKeyDown);
                $(window).off('keyup', onKeyUp);
            };

            // Version buttons
            $prev.click(function () { render(getPrevious()); });
            $next.click(function () { render(getNext()); });
            $fastPrev.click(function () { render(getPrevious(10)); });
            $fastNext.click(function () { render(getNext(10)); });
            onKeyDown = function (e) {
                var p = function () { e.preventDefault(); };
                if ([37, 40].indexOf(e.which) >= 0) { p(); return render(getPrevious()); } // Left
                if ([38, 39].indexOf(e.which) >= 0) { p(); return render(getNext()); } // Right
                if (e.which === 33) { p(); return render(getNext(10)); } // PageUp
                if (e.which === 34) { p(); return render(getPrevious(10)); } // PageUp
                if (e.which === 27) { p(); $close.click(); }
            };
            onKeyUp = function (e) { e.stopPropagation(); };
            $(window).on('keydown', onKeyDown).on('keyup', onKeyUp).focus();

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
                    onRevert();
                    UI.log(Messages.history_restoreDone);
                });
            });

            // Display the latest content
            render(get(c));
            $(window).trigger('resize');
        };

        if (config.onOpen) {
            config.onOpen();
        }

        // Load all the history messages into a new chainpad object
        loadMoreHistory(config, common, function (err, newRt, isFull) {
            History.readOnly = common.getMetadataMgr().getPrivateData().readOnly;
            History.loading = false;
            if (err) { throw new Error(err); }
            update(newRt);
            c = states.length - 1;
            display();
            if (isFull) {
                $loadMore.off('click').hide();
                $version.show();
            }
        });
    };

    return History;
});


