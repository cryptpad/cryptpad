define([
    'jquery',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/bower_components/nthen/index.js',
    //'/bower_components/chainpad-json-validator/json-ot.js',

    '/bower_components/chainpad/chainpad.dist.js',
], function ($, UI, h, Messages, nThen, ChainPad /* JsonOT */) {
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

        var realtime;
        var states = [];
        var c = 0;//states.length - 1;

        var getIndex = function (i) {
            return states.length - 1 + i;
        };
        var getRank = function (idx) {
            return idx - states.length + 1;
        };
        // Get the author or group of author linked to a state
        var getAuthor = function (idx, semantic) {
            if (semantic === 1 || !config.extractMetadata) {
                return states[idx].author;
            }
            try {
                var val = JSON.parse(states[idx].getContent().doc);
                var md = config.extractMetadata(val);
                var users = Object.keys(md.users).sort();
                return users.join();
            } catch (e) {
                console.error(e);
                return states[idx].author;
            }
        };

        // Refresh the timeline UI with the block states
        var bar = h('span.cp-history-timeline-bar');
        var refreshBar = function () {
            var $bar = $(bar).html('');
            var users = {
                list: [],
                author: '',
                el: undefined,
                i: 0
            };
            var user = {
                list: [],
                author: '',
                el: undefined,
                i: 0
            };

            var max = states.length - 1;
            var check = function (obj, author, i) {
                if (obj.author !== author) {
                    obj.author = author;
                    if (obj.el) {
                        $(obj.el).css('width', (100*(i - obj.i)/max)+'%');
                    }
                    obj.el = h('span.cp-history-bar-el');
                    obj.list.push(obj.el);
                    obj.i = i;
                }
            };

            for (var i = 1; i < states.length; i++) {
                check(user, getAuthor(i, 1), i);
                check(users, getAuthor(i, 2), i);
            }
            $(user.el).css('width', (100*(max + 1 - user.i)/max)+'%');
            $(users.el).css('width', (100*(max + 1 - users.i)/max)+'%');

            $bar.append([
                h('span.cp-history-timeline-users', users.list),
                h('span.cp-history-timeline-user', user.list),
            ]);

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
                var messages = (data.messages || []).map(function (obj) {
                    return obj;
                });
                if (config.debug) { console.log(data.messages); }
                Array.prototype.unshift.apply(allMessages, messages); // Destructive concat
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
        var onClose = function () {
            config.setHistory(false, true);
        };

        Messages.history_cantRestore = "Can't restore now. Disconnected."; // XXX
        var onRevert = function () {
            var closed = config.setHistory(false, false);
            if (!closed) {
                return void UI.alert(Messages.history_cantRestore);
            }
            config.onLocal();
            config.onRemote();
            return true;
        };

        config.setHistory(true);

        var $hist = $toolbar.find('.cp-toolbar-history');
        var $bottom = $toolbar.find('.cp-toolbar-bottom');
        var $cke = $toolbar.find('.cke_toolbox_main');

        $hist.html('').css('display', 'flex');
        $bottom.hide();
        $cke.hide();

        UI.spinner($hist).get().show();

        var update = function (newRt) {
            realtime = newRt;
            if (!realtime) { return []; }
            states = getStates(realtime);
            refreshBar();
            return states;
        };

        var $loadMore, $version, $time, get;

        // Get the content of the selected version, and change the version number
        var loading = false;
        var loadMore = function (cb) {
            if (loading) { return; }
            loading = true;
            $loadMore.find('.fa-ellipsis-h').hide();
            $loadMore.find('.fa-refresh').show();

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
                $loadMore.find('.fa-ellipsis-h').show();
                $loadMore.find('.fa-refresh').hide();
                get(c);
                if (isFull) {
                    $loadMore.off('click').hide();
                    $version.show();
                }
                if (cb) { cb(); }
            });
        };

        // semantic === 1 : group by user
        // semantic === 2 : group by "group of users"
        get = function (i, blockOnly, semantic) {
            i = parseInt(i);
            if (isNaN(i)) { return; }
            if (i > 0) { i = 0; }
            if (i < -(states.length - 2)) { i = -(states.length - 2); }
            if (i <= -(states.length - 11)) {
                loadMore();
            }

            var idx = getIndex(i);
            if (semantic && i !== c) {
                // If semantic is truc, jump to the next patch from a different netflux ID
                var author = getAuthor(idx, semantic);
                var forward = i > c;
                for (var j = idx; (j > 0 && j < states.length ); (forward ? j++ : j--)) {
                    if (author !== getAuthor(j, semantic)) {
                        break;
                    }
                    idx = j;
                    i = getRank(idx);
                }
            }

            if (blockOnly) { return states[idx]; }

            var val = states[idx].getContent().doc;
            c = i;
            $hist.find('.cp-toolbar-history-next, .cp-toolbar-history-previous')
                .prop('disabled', '');
            if (c === -(states.length-1)) {
                $hist.find('.cp-toolbar-history-previous').prop('disabled', 'disabled');
            }
            if (c === 0) {
                $hist.find('.cp-toolbar-history-next').prop('disabled', 'disabled');
            }
            var $pos = $hist.find('.cp-history-timeline-pos');
            var p = 100 * (1 - (-(c - 1) / (states.length-1)));
            $pos.css('left', 'calc('+p+'% - 2px)');

            // Display the version when the full history is loaded
            // Note: the first version is always empty and probably can't be displayed, so
            // we can consider we have only states.length - 1 versions
            $version.text(idx + ' / ' + (states.length-1));
            var time = states[idx].time;
            if (time) {
                $time.text(new Date(time).toLocaleString());
            } else { $time.text(''); }

            if (config.debug) {
                console.log(states[idx]);
                var ops = states[idx] && states[idx].getPatch() && states[idx].getPatch().operations;
                if (Array.isArray(ops)) {
                    ops.forEach(function (op) { console.log(op); });
                }
            }

            return val || '';
        };

        /*
        var getNext = function (step) {
            return typeof step === "number" ? get(c + step) : get(c + 1);
        };
        var getPrevious = function (step) {
            return typeof step === "number" ? get(c - step) : get(c - 1);
        };
        */

        // Create the history toolbar
        var display = function () {
            $hist.html('');

            var fastPrev = h('button.cp-toolbar-history-previous', { title: Messages.history_prev }, [
                h('i.fa.fa-step-backward'),
                h('i.fa.fa-users')
            ]);
            var userPrev = h('button.cp-toolbar-history-previous', { title: Messages.history_prev }, [
                h('i.fa.fa-step-backward'),
                h('i.fa.fa-user')
            ]);
            var prev = h('button.cp-toolbar-history-previous', { title: Messages.history_prev }, [
                h('i.fa.fa-step-backward')
            ]);
            var fastNext = h('button.cp-toolbar-history-next', { title: Messages.history_next }, [
                h('i.fa.fa-users'),
                h('i.fa.fa-step-forward'),
            ]);
            var userNext = h('button.cp-toolbar-history-next', { title: Messages.history_next }, [
                h('i.fa.fa-user'),
                h('i.fa.fa-step-forward'),
            ]);
            var next = h('button.cp-toolbar-history-next', { title: Messages.history_next }, [
                h('i.fa.fa-step-forward')
            ]);
            var $fastPrev = $(fastPrev);
            var $userPrev = $(userPrev);
            var $prev = $(prev);
            var $fastNext = $(fastNext);
            var $userNext = $(userNext);
            var $next = $(next);

            var _loadMore = h('button.cp-toolbar-history-loadmore', { title: Messages.history_loadMore }, [
                h('i.fa.fa-ellipsis-h'),
                h('i.fa.fa-refresh.fa-spin.fa-3x.fa-fw', { style: 'display: none;' })
            ]);

            var pos = h('span.cp-history-timeline-pos');
            var time = h('div.cp-history-timeline-time');
            $time = $(time);
            $version = $(); // XXX
            var timeline = h('div.cp-toolbar-history-timeline', [
                h('div.cp-history-timeline-line', [
                    h('span.cp-history-timeline-legend', [
                        h('i.fa.fa-users'),
                        h('i.fa.fa-user')
                    ]),
                    h('span.cp-history-timeline-loadmore', _loadMore),
                    h('span.cp-history-timeline-container', [
                        pos,
                        bar
                    ])
                ]),
                h('div.cp-history-timeline-actions', [
                    h('span.cp-history-timeline-prev', [
                        fastPrev,
                        userPrev,
                        prev,
                    ]),
                    time,
                    h('span.cp-history-timeline-next', [
                        next,
                        userNext,
                        fastNext
                    ])
                ])
            ]);

            Messages.history_restore = "Restore";// XXX
            Messages.history_close = "Close";// XXX
            var snapshot = h('button', {
                title: Messages.snapshots_button,
                disabled: History.readOnly ? 'disabled' : undefined
            }, [
                h('i.fa.fa-camera')
            ]);
            var share = h('button', { title: Messages.shareButton }, [
                h('i.fa.fa-shhare-alt'),
                h('span', Messages.shareButton)
            ]);
            var restore = h('button', {
                title: Messages.history_restoreTitle,
                disabled: History.readOnly ? 'disabled' : undefined
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

            $hist.append([timeline, actions]);

            /*
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
            var $userPrev =$('<button>', {
                'class': 'cp-toolbar-history-previous fa fa-backward buttonPrimary',
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
            var $userNext =$('<button>', {
                'class': 'cp-toolbar-history-next fa fa-forward buttonPrimary',
                title: Messages.history_next
            }).appendTo($hist);
            var $fastNext = $('<button>', {
                'class': 'cp-toolbar-history-fast-next fa fa-fast-forward buttonPrimary',
                title: Messages.history_next
            }).appendTo($hist);
            var $share = $('<button>', {
                'class': 'fa fa-shhare-alt buttonPrimary',
                title: Messages.shareButton
            }).appendTo($hist);
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
            */
            $(bar).click(function (e) {
                e.stopPropagation();
                if (!$(e.target).is('.cp-history-timeline-bar')) { return; }
                var p = e.offsetX / $bar.width();
                var v = -Math.round((states.length - 1) * (1 - p));
                render(get(v));
            });
            $loadMore = $(_loadMore).click(function () {
                loadMore(function () {
                    get(c);
                });
            });

            var onKeyDown, onKeyUp;
            var closeUI = function () {
                $hist.hide();
                $bottom.show();
                $cke.show();
                $(window).trigger('resize');
                $(window).off('keydown', onKeyDown);
                $(window).off('keyup', onKeyUp);
            };

            // Version buttons
            $prev.click(function () { render(get(c - 1)); });
            $next.click(function () { render(get(c + 1)); });
            $userPrev.click(function () { render(get(c - 1, false, 1)); });
            $userNext.click(function () { render(get(c + 1, false, 1)); });
            $fastPrev.click(function () { render(get(c - 1, false, 2)); });
            $fastNext.click(function () { render(get(c + 1, false, 2)); });
            onKeyDown = function (e) {
                var p = function () { e.preventDefault(); };
                if (e.which === 39) { p(); return $next.click(); } // Right
                if (e.which === 37) { p(); return $prev.click(); } // Left
                if (e.which === 38) { p(); return $userNext.click(); } // Up
                if (e.which === 40) { p(); return $userPrev.click(); } // Down
                if (e.which === 33) { p(); return $fastNext.click(); } // PageUp
                if (e.which === 34) { p(); return $fastPrev.click(); } // PageUp
                if (e.which === 27) { p(); $(close).click(); }
            };
            onKeyUp = function (e) { e.stopPropagation(); };
            $(window).on('keydown', onKeyDown).on('keyup', onKeyUp).focus();

            // Share
            $(share).click(function () {
                var block = get(c, true);
                common.getSframeChannel().event('EV_SHARE_OPEN', {
                    versionHash: block.serverHash,
                    //title: title
                });
            });

            // Close & restore buttons
            $(close).click(function () {
                states = [];
                onClose();
                closeUI();
            });
            $(restore).click(function () {
                UI.confirm(Messages.history_restorePrompt, function (yes) {
                    if (!yes) { return; }
                    var done = onRevert();
                    if (done) {
                        closeUI();
                        UI.log(Messages.history_restoreDone);
                    }
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
            display();
            c = states.length - 1;
            if (isFull) {
                $loadMore.off('click').hide();
                $version.show();
            }
        });
    };

    return History;
});


