// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/hyperscript.js',
    '/common/common-icons.js',
    '/common/common-util.js',

], function ($, UI, UIElements, h, Icons, Util) {
    //var ChainPad = window.ChainPad;
    var History = {};

    History.loadHistoryData = (cfg) => {
        const {
            sframeChan, mainRtChannel, hashes, sortedCp, downloadId,
            currentCp, nextCp
        } = cfg;

        return new Promise((resolve, reject) => {
            // New CP: use this cp's rtChannel
            if (currentCp?.rtChannel) {
                // Load all messages from currentCp.rtChannel
                sframeChan.query('Q_GET_FULL_HISTORY', {
                    channel: currentCp.rtChannel,
                    isDownload: downloadId,
                    full: true
                }, function (err, data) {
                    if (err) { return void reject(err); }
                    resolve(data);
                });
                return;
            }

            // Old CP or no CP: use mainRtChannel

            // No CP and no nextCp hash
            if (!currentCp && !nextCp?.hash) {
                // Load all messages from mainRtChannel
                sframeChan.query('Q_GET_FULL_HISTORY', {
                    channel: mainRtChannel,
                    isDownload: downloadId,
                    full: true
                }, function (err, data) {
                    if (err) { return void reject(err); }
                    resolve(data);
                });
                return;
            }

            // If we have a startHash or an endHash, use
            // the GET_HISTORY_RANGE command
            let startHash = currentCp?.hash || 'NONE';
            let endHash = nextCp?.hash;

            if (currentCp?.hash || nextCp?.hash) {
                sframeChan.query('Q_GET_HISTORY_RANGE', {
                    channel: mainRtChannel,
                    lastKnownHash: endHash,
                    toHash: startHash,
                    isDownload: downloadId,
                }, function (err, data) {
                    if (err || !Array.isArray(data.messages)) {
                        return void reject(err || 'EINVAL');
                    }
                    let msgs = data.messages;
                    if (data.messages[0].serverHash === startHash) {
                        msgs.shift();
                    }
                    resolve(msgs);
                });
                return;
            }

            reject('INVALID_CP');
        });


    };

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

        const metadataMgr = common.getMetadataMgr();

        const ooMessages = {};

        const hashes = config.onlyoffice.hashes;
        const mainRtChannel = config.onlyoffice.channel;

        const sortedCp = config.sortCpIndex(hashes);
        const maxCpIdx = sortedCp.length - 1;

        let cpIdx = sortedCp.length - 1;
        let msgIdx = 0;
        let loading = true;

        const getCpId = () => {
            return sortedCp[cpIdx] || 0;
        };
        const getCpMsgs = () => {
            return ooMessages[getCpId()] || [];
        };
        const getCurrentMsg = () => {
            const msgs = getCpMsgs();
            return msgs[msgIdx];
        };
        const getCurrentVersion = () => {
            return `${getCpId()}.${msgIdx}`;
        };

        const loadMessages = () => {
            return new Promise((resolve, reject) => {
                let cpId = getCpId();

                if (Array.isArray(ooMessages[cpId])) {
                    return void resolve(ooMessages[cpId]);
                }

                let currentCp = hashes[cpId];
                let nextCp = hashes[sortedCp[cpIdx + 1]];

                History.loadHistoryData({
                    sframeChan,
                    mainRtChannel, hashes, sortedCp, currentCp, nextCp
                }).then(data => {
                    data.unshift(void 0);
                    ooMessages[cpId] = data;
                    resolve(data);
                }).catch(reject);
            });
        };

        let $version, $share, $timeline, $pos;
        let $next, $prev;
        const $hist = $toolbar.find('.cp-toolbar-history');
        $hist.addClass('cp-smallpatch');
        $hist.addClass('cp-history-oo');
        const $bottom = $toolbar.find('.cp-toolbar-bottom');
        const Messages = common.Messages;

        const onClose = function () { config.setHistory(false); };
        const onRevert = function () {
            config.onRevert();
        };


        config.setHistory(true);
        $hist.html('').css('display', 'flex');
        $bottom.hide();

        const updateNavButtons = () => {
            const max = getCpMsgs().length - 1;

            if (msgIdx <= 0) {
                $prev.prop('disabled', 'disabled');
            } else {
                $prev.prop('disabled', '');
            }

            if (msgIdx >= max) {
                $next.prop('disabled', 'disabled');
            } else {
                $next.prop('disabled', '');
            }
        };

        const updateTimeline = () => {
            $timeline.empty();
            const msgs = getCpMsgs();
            const cp = hashes[getCpId()];

            const md = Util.clone(metadataMgr.getMetadata());
            const snapshots = md?.snapshots || {};

            const els = msgs.map((msg, i) => {
                const selected = i === msgIdx;
                const selClass = selected ? '.cp-selected' : '';
                const content = selected ? Icons.get('chevron-down', {})
                                         : undefined;
                let title = `${getCpId()}.${i}`

                const s = snapshots[title];

                if (msg?.time) {
                    title += ' - ' + new Date(msg.time).toLocaleString();
                } else if (i === 0 && cp?.time) {
                    title += ' - ' + new Date(cp.time).toLocaleString();
                }

                let snap;
                if (s) {
                    if (s?.title) { title += `\n${Util.fixHTML(s.title)}`; }
                    snap = Icons.get('snapshot', {'data-snapshot': '1'});
                }

                return h('span.cp-history-bar-el'+selClass, {
                    title,
                    'data-msg': i
                }, [content, snap]);
            });
            $timeline.append(els);

            updateNavButtons();
        };

        const hideVersion = () => {
            $version[0].classList.add('cp-hidden');
        };
        const showVersion = () => {
            const patch = getCurrentMsg();
            if (!patch) { return $version.hide(); }
            const time = new Date(patch?.time).toLocaleString();
            $version.text(`${getCurrentVersion()} - ${time}`).show();
            $version[0].classList.remove('cp-hidden');
        };

        const prev = (i = 1) => {
            if ((msgIdx - i) < 0) { loading = false; return; }
            msgIdx -= i;
            const msgs = getCpMsgs().slice(1, (msgIdx + 1));
            const cp = hashes[getCpId()] || {};
            config.onPatchBack(cp, msgs);
            loading = false;

            showVersion();
            updateTimeline();
        };
        const next = (i = 1) => {
            const max = getCpMsgs().length - 1;
            if (msgIdx > (max - i)) { return; }
            for (let j = 0; j < i; j++) {
                msgIdx++;
                const msg = getCurrentMsg();
                if (msg) { config.onPatch(msg); }
            }
            showVersion();
            updateTimeline();
        };

        // Dropdown to select checkpoint (or "major version")
        const makeDropdown = ($dropdown) => {
            const all = sortedCp.slice();
            all.unshift(0);
            const options = all.map((id, idx) => {
                const cp = hashes[id] || {};
                let time = '';;
                if (cp?.time) {
                    time = ` - ${new Date(cp.time).toLocaleString()}`;
                }
                return {
                    tag: 'a',
                    attributes: {
                        'class': 'cp-history-major-version',
                        'data-value': idx,
                    },
                    content: `${id}.x` + time
                };
            });
            const dropdownConfig = {
                text: `${getCpId()}.x`, // Button initial text
                options, // Entries displayed in the menu
                isSelect: true,
                caretDown: true,
                buttonCls: 'btn btn-default small'
            };
            const dd = UIElements.createDropdown(dropdownConfig);
            dd.setValue(cpIdx + 1);
            dd.onChange.reg((id, idx) => {
                loading = true;
                dd.find('> button').attr('disabled', 'disabled');

                cpIdx = idx - 1; // -1 because we've added "0" to the list
                hideVersion();

                loadMessages().then(() => {
                    loading = false;
                    dd.find('> button').removeAttr('disabled');

                    msgIdx = 0;
                    showVersion();
                    updateTimeline();

                    const cp = hashes[getCpId()];
                    config.onCheckpoint(cp);
                });
            });

            $dropdown.empty().append([
                h('span', Messages.oo_version),
                dd
            ]);
        };

        // Create the history toolbar
        var display = function () {
            $hist.html('');

            const _next = h('button.cp-toolbar-history-next', { title: Messages.history_next }, [
                Icons.get('history-next'),
            ]);
            const _prev = h('button.cp-toolbar-history-previous', { title: Messages.history_prev }, [
                Icons.get('history-prev')
            ]);
            $prev = $(_prev);
            $next = $(_next);

            var version = h('div.cp-history-version-time');
            $version = $(version);
            var dropdown = h('div.cp-history-version-select');
            var $dropdown = $(dropdown);

            var line = h('span.cp-history-timeline-patch');
            $timeline = $(line);

            var pos = h('span.cp-history-snapshots');
            $pos = $(pos);


            var timeline = h('div.cp-toolbar-history-timeline', [
                h('div.cp-history-timeline-line', [
                    h('span.cp-history-timeline-container', [
                        h('span.cp-history-timeline-bar', [
                            line
                        ]),
                        pos
                    ])
                ]),
                h('div.cp-history-timeline-actions', [
                    h('span.cp-history-timeline-prev', [
                        _prev
                    ]),
                    h('div.cp-history-version', [
                        dropdown,
                        version,
                    ]),
                    h('span.cp-history-timeline-next', [
                        _next
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

            makeDropdown($dropdown);

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
                next();
            });
            $prev.click(function () {
                if (loading) { return; }
                loading = true;
                prev();
            });

            // XXX
            onKeyDown = function (e) {
                var p = function () { e.preventDefault(); };
                if ([38, 39].indexOf(e.which) >= 0) { p(); return $next.click(); } // Right
                if (e.which === 27) { p(); return $(close).click(); }
            };
            onKeyUp = function (e) { e.stopPropagation(); };
            $(window).on('keydown', onKeyDown).on('keyup', onKeyUp).focus();

            $timeline.on('click', '.cp-history-bar-el', (ev, el) => {
                let target = ev.target;
                if (!target) { return; }
                if (!target.classList.contains('cp-history-bar-el')) {
                    target = $(target).closest('.cp-history-bar-el')[0];
                }
                const attr = target?.attributes?.getNamedItem('data-msg');
                const idx = Number(attr?.value || 0);
                if (idx > msgIdx) {
                    return void next(idx - msgIdx);
                }
                if (idx < msgIdx) {
                    return void prev(msgIdx - idx);
                }
            });

            // Versioned link
            $share.click(function () {
                common.getSframeChannel().event('EV_SHARE_OPEN', {
                    versionHash: getVersion(position)
                });
            });
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
                    iconClass: 'snapshot',
                    name: Messages.snapshots_new,
                    onClick: function () {
                        var val = $input.val();
                        if (!val) { return true; }
                        const patch = getCurrentMsg();
                        config.makeSnapshot(val, function (err) {
                            if (err) { return; }
                            $input.val('');
                            UI.log(Messages.saved);
                        }, {
                            hash: getCurrentVersion(),
                            time: patch?.time || +new Date()
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

        // Build UI
        display();

        // Load initial state
        loadMessages().then((msgs) => {
            loading = false;
            msgIdx = msgs.length - 1;
            showVersion();
            updateTimeline();
        }).catch(err => { console.error(err); });
    };

    return History;
});

