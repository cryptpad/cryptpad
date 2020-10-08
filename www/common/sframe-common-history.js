define([
    'jquery',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/bower_components/nthen/index.js',
    //'/bower_components/chainpad-json-validator/json-ot.js',

    '/bower_components/chainpad/chainpad.dist.js',
], function ($, UI, Util, h, Messages, nThen, ChainPad /* JsonOT */) {
    //var ChainPad = window.ChainPad;
    var History = {};

    History.create = function (common, config) {
        if (!config.$toolbar) { return void console.error("config.$toolbar is undefined");}
        if (History.loading) { return void console.error("History is already being loaded..."); }
        if (History.state) { return void console.error("Already loaded"); }
        History.loading = true;
        History.state = true;
        var $toolbar = config.$toolbar;
        var $hist = $toolbar.find('.cp-toolbar-history');
        $hist.addClass('cp-history-init');

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
        var patchWidth = 0;
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

        var bar = h('span.cp-history-timeline-bar');
        var onResize = function () {
            var $bar = $(bar);
            if (!$bar.width() || !$bar.length) { return; }
            var widthPx = patchWidth * $bar.width() / 100;
            $hist.removeClass('cp-smallpatch');
            $bar.find('.cp-history-snapshot').css('margin-left', "");
            var $pos = $hist.find('.cp-history-timeline-pos');
            $pos.css('margin-left', "");
            if (widthPx < 18) {
                $hist.addClass('cp-smallpatch');
                $bar.find('.cp-history-snapshot').css('margin-left', (widthPx/2-2)+"px");
                $pos.css('margin-left', (widthPx/2-2)+"px");
            }
        };

        // Refresh the timeline UI with the block states
        var refreshBar = function (snapshotsOnly) {
            var $pos = $hist.find('.cp-history-timeline-pos');
            var $bar = $(bar);
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

            var snapshotsData = {};
            var snapshots = [];
            if (config.getLastMetadata) {
                try {
                    var md = config.getLastMetadata();
                    if (md.snapshots) {
                        snapshotsData = md.snapshots;
                        snapshots = Object.keys(md.snapshots);
                    }
                } catch (e) { console.error(e); }
            }

            var max = states.length - 1;
            var snapshotsEl = [];
            patchWidth = 100 / max;

            // Check if we need a new block on the index i for the "obj" type (user or users)
            var check = function (obj, author, i) {
                if (snapshotsOnly) { return; }
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

            var hash;
            for (var i = 1; i < states.length; i++) {
                hash = states[i].serverHash;
                if (snapshots.indexOf(hash) !== -1) {
                    snapshotsEl.push(h('div.cp-history-snapshot', {
                        style: 'width:'+patchWidth+'%;left:'+(patchWidth * (i-1))+'%;',
                        title: snapshotsData[hash].title
                    }, h('i.fa.fa-camera')));
                }
                if (config.drive) {
                    // Display only one bar, split by patch
                    check(user, i, i);
                } else {
                    // Display two bars, split by author(s)
                    check(user, getAuthor(i, 1), i);
                    check(users, getAuthor(i, 2), i);
                }
            }

            if (snapshotsOnly) {
                // We only want to redraw the snapshots
                $bar.find('.cp-history-snapshots').html('').append([
                    $pos,
                    snapshotsEl
                ]);
            } else {
                $(user.el).css('width', (100*(max + 1 - user.i)/max)+'%');
                if (!config.drive) {
                    $(users.el).css('width', (100*(max + 1 - users.i)/max)+'%');
                }

                $bar.html('').append([
                    h('span.cp-history-timeline-users', users.list),
                    h('span.cp-history-timeline-user', user.list),
                    h('div.cp-history-snapshots', [
                        $pos[0],
                        snapshotsEl
                    ]),
                ]);
            }

            onResize();
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

                // We're supposed to receive 2 checkpoints. If the result is only ONE message
                // and this message is a checkpoint, it means it's the last message of the history
                // (and this is a trimmed history)
                if (messages.length === 1) {
                    var parsed = JSON.parse(messages[0].msg);
                    if (parsed[0] === 4) {
                        isComplete = true;
                    }
                }
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

        var onRevert = function () {
            // Before we can restore the current version, we need to update metadataMgr
            // so that it will uses the snapshots from the realtime version!
            // Restoring the snapshots to their old version would go against the
            // goal of having snapshots
            if (config.getLastMetadata) {
                var metadataMgr = common.getMetadataMgr();
                var lastMd = config.getLastMetadata();
                var _snapshots = lastMd.snapshots;
                var _users = lastMd.users;
                var md = Util.clone(metadataMgr.getMetadata());
                md.snapshots = _snapshots;
                md.users = _users;
                metadataMgr.updateMetadata(md);
            }

            // And now we can properly restore the content
            var closed = config.setHistory(false, false);
            if (!closed) {
                return void UI.alert(Messages.history_cantRestore);
            }
            config.onLocal();
            config.onRemote();
            return true;
        };

        config.setHistory(true);

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

        var $loadMore, $time, get;

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

            var idx = getIndex(i);
            if (semantic && i !== c) {
                // If semantic is true, jump to the next patch from a different netflux ID
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

            if (i <= -(states.length - 11)) {
                loadMore();
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
            $pos.css('left', p+'%');
            $pos.css('width', patchWidth+'%');

            // Display the version when the full history is loaded
            // Note: the first version is always empty and probably can't be displayed, so
            // we can consider we have only states.length - 1 versions
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

        var makeSnapshot = function (title, $input) {
            var idx = getIndex(c);
            if (!config.getLastMetadata || !config.setLastMetadata) { return; }
            try {
                var block = states[idx];
                var hash = block.serverHash;
                var md = config.getLastMetadata();
                md.snapshots = md.snapshots || {};
                if (md.snapshots[hash]) { return; }
                md.snapshots[hash] = {
                    title: title,
                    time: block.time ? (+new Date(block.time)) : +new Date()
                };
                var sent = config.setLastMetadata(md);
                if (!sent) { return void UI.alert(Messages.snapshots_cantMake); }
                $input.val('');
                refreshBar();
            } catch (e) {
                console.error(e);
            }
        };

        // Create the history toolbar
        var display = function () {
            $hist.html('');
            $hist.removeClass('cp-history-init');

            var fastPrev = h('button.cp-toolbar-history-previous', { title: Messages.history_fastPrev }, [
                h('i.fa.fa-step-backward'),
                h('i.fa.fa-users')
            ]);
            var userPrev = h('button.cp-toolbar-history-previous', { title: Messages.history_userPrev }, [
                h('i.fa.fa-step-backward'),
                h('i.fa.fa-user')
            ]);
            var prev = h('button.cp-toolbar-history-previous', { title: Messages.history_prev }, [
                h('i.fa.fa-step-backward')
            ]);
            var fastNext = h('button.cp-toolbar-history-next', { title: Messages.history_fastNext }, [
                h('i.fa.fa-users'),
                h('i.fa.fa-step-forward'),
            ]);
            var userNext = h('button.cp-toolbar-history-next', { title: Messages.history_userNext }, [
                h('i.fa.fa-user'),
                h('i.fa.fa-step-forward'),
            ]);
            var next = h('button.cp-toolbar-history-next', { title: Messages.history_next }, [
                h('i.fa.fa-step-forward')
            ]);
            if (config.drive) {
                fastNext = h('button.cp-toolbar-history-next', { title: Messages.history_next }, [
                    h('i.fa.fa-fast-forward'),
                ]);
                fastPrev = h('button.cp-toolbar-history-previous', {title: Messages.history_prev}, [
                    h('i.fa.fa-fast-backward'),
                ]);
            }

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

            var pos = h('span.cp-history-timeline-pos.fa.fa-caret-down');
            var time = h('div.cp-history-timeline-time');
            $time = $(time);
            var timeline = h('div.cp-toolbar-history-timeline', [
                h('div.cp-history-timeline-line', [
                    h('span.cp-history-timeline-legend', [
                        h('i.fa.fa-users'),
                        h('i.fa.fa-user')
                    ]),
                    h('span.cp-history-timeline-loadmore', _loadMore),
                    h('span.cp-history-timeline-container', [
                        bar
                    ])
                ]),
                h('div.cp-history-timeline-actions', [
                    h('span.cp-history-timeline-prev', [
                        fastPrev,
                        config.drive ? undefined : userPrev,
                        prev,
                    ]),
                    time,
                    h('span.cp-history-timeline-next', [
                        next,
                        config.drive ? undefined : userNext,
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
            var restoreTitle = config.drive ? Messages.history_restoreDriveTitle
                                   : Messages.history_restoreTitle;
            var restore = h('button', {
                title: restoreTitle,
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
            if (config.drive) {
                $hist.addClass('cp-history-drive');
                $(snapshot).hide();
                $(share).hide();
            }

            $hist.append([timeline, actions]);
            onResize();
            $(window).on('resize', onResize);

            var $bar = $(bar);
            $bar.find('.cp-history-snapshots').append(pos);
            $bar.click(function (e) {
                e.stopPropagation();
                var $t = $(e.target);
                if ($t.closest('.cp-history-snapshot').length) {
                    $t = $t.closest('.cp-history-snapshot');
                }
                var isEl = $t.is('.cp-history-snapshot');
                if (!$t.is('.cp-history-snapshots') && !isEl) { return; }
                var x = e.offsetX;
                if (isEl) {
                    x += $t.position().left;
                }
                var p = x / $bar.width();
                var v = 1-Math.ceil((states.length - 1) * (1 - p));
                render(get(v));
            });
            $loadMore = $(_loadMore).click(function () {
                loadMore(function () {
                    get(c);
                });
            });

            var onKeyDown, onKeyUp;
            var closeUI = function () {
                History.state = false;
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
            if (config.drive) {
                $fastPrev.click(function () { render(get(c - 10)); });
                $fastNext.click(function () { render(get(c + 10)); });
                $userPrev.click(function () { render(get(c - 10)); });
                $userNext.click(function () { render(get(c + 10)); });
            } else {
                $userPrev.click(function () { render(get(c - 1, false, 1)); });
                $userNext.click(function () { render(get(c + 1, false, 1)); });
                $fastPrev.click(function () { render(get(c - 1, false, 2)); });
                $fastNext.click(function () { render(get(c + 1, false, 2)); });
            }
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

            // Snapshots
            $(snapshot).click(function () {
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
                        makeSnapshot(val, $input);
                    },
                    keys: [],
                }];

                UI.openCustomModal(UI.dialog.customModal(content, {buttons: buttons }));
                setTimeout(function () {
                    $input.focus();
                });
            });

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
                var restorePrompt = config.drive ? Messages.history_restoreDrivePrompt
                                                 : Messages.history_restorePrompt;
                UI.confirm(restorePrompt, function (yes) {
                    if (!yes) { return; }
                    var done = onRevert();
                    if (done) {
                        closeUI();
                        var restoreDone = config.drive ? Messages.history_restoreDriveDone
                                                       : Messages.history_restoreDone;
                        UI.log(restoreDone);
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
            if (isFull) {
                $loadMore.off('click').hide();
            }
        });
    };

    return History;
});


