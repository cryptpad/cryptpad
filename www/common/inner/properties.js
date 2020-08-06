define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/inner/common-modal.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/bower_components/nthen/index.js',
], function ($, Util, Hash, UI, UIElements, Modal, h,
             Messages, nThen) {
    var Properties = {};

    var getPadProperties = function (Env, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var common = Env.common;
        opts = opts || {};
        var $d = $('<div>');
        if (!data) { return void cb(void 0, $d); }

        if (data.href) {
            $('<label>', {'for': 'cp-app-prop-link'}).text(Messages.editShare).appendTo($d);
            $d.append(UI.dialog.selectable(data.href, {
                id: 'cp-app-prop-link',
            }));
        }

        if (data.roHref && !opts.noReadOnly) {
            $('<label>', {'for': 'cp-app-prop-rolink'}).text(Messages.viewShare).appendTo($d);
            $d.append(UI.dialog.selectable(data.roHref, {
                id: 'cp-app-prop-rolink',
            }));
        }

        if (data.tags && Array.isArray(data.tags)) {
            $d.append(h('div.cp-app-prop', [Messages.fm_prop_tagsList, h('br'), h('span.cp-app-prop-content', data.tags.join(', '))]));
        }

        if (data.ctime) {
            $d.append(h('div.cp-app-prop', [Messages.fm_creation,  h('br'), h('span.cp-app-prop-content', new Date(data.ctime).toLocaleString())]));
        }

        if (data.atime) {
            $d.append(h('div.cp-app-prop', [Messages.fm_lastAccess,  h('br'), h('span.cp-app-prop-content', new Date(data.atime).toLocaleString())]));
        }

        if (!common.isLoggedIn()) { return void cb(void 0, $d); }

        // File and history size...
        var owned = Modal.isOwned(Env, data);

        // check the size of this file, including additional channels
        var bytes = 0;
        var historyBytes;
        var chan = [data.channel];
        if (data.rtChannel) { chan.push(data.rtChannel); }
        if (data.lastVersion) { chan.push(Hash.hrefToHexChannelId(data.lastVersion)); }

        // Get the channels with history (no blobs)
        var channels = chan.filter(function (c) { return c.length === 32; }).map(function (id) {
            if (id === data.rtChannel && data.lastVersion && data.lastCpHash) {
                return {
                    channel: id,
                    lastKnownHash: data.lastCpHash
                };
            }
            return {
                channel: id
            };
        });

        var history = common.makeUniversal('history');
        var trimChannels = [];
        nThen(function (waitFor) {
            // Get total size
            chan.forEach(function (c) {
                common.getFileSize(c, waitFor(function (e, _bytes) {
                    if (e) {
                        // there was a problem with the RPC
                        console.error(e);
                    }
                    bytes += _bytes;
                }));
            });

            if (!owned) { return; }
            // Get history size
            history.execCommand('GET_HISTORY_SIZE', {
                pad: true,
                channels: channels,
                teamId: typeof(owned) === "number" && owned
            }, waitFor(function (obj) {
                if (obj && obj.error) { return; }
                historyBytes = obj.size;
                trimChannels = obj.channels;
            }));
        }).nThen(function () {
            if (bytes === 0) { return void cb(void 0, $d); }
            var formatted = UIElements.prettySize(bytes);

            if (!owned || !historyBytes || historyBytes > bytes || historyBytes < 0) {
                $d.append(h('div.cp-app-prop', [
                    Messages.upload_size,
                    h('br'),
                    h('span.cp-app-prop-content', formatted)
                ]));
                return void cb(void 0, $d);
            }


            var p = Math.round((historyBytes / bytes) * 100);
            var historyPrettySize = UIElements.prettySize(historyBytes);
            var contentsPrettySize = UIElements.prettySize(bytes - historyBytes);
            var button;
            var spinner = UI.makeSpinner();
            var size = h('div.cp-app-prop', [
                Messages.upload_size,
                h('br'),
                h('div.cp-app-prop-size-container', [
                    h('div.cp-app-prop-size-history', { style: 'width:'+p+'%;' })
                ]),
                h('div.cp-app-prop-size-legend', [
                    h('div.cp-app-prop-history-size', [
                        h('span.cp-app-prop-history-size-color'),
                        h('span.cp-app-prop-content', Messages._getKey('historyTrim_historySize', [historyPrettySize]))
                    ]),
                    h('div.cp-app-prop-contents-size', [
                        h('span.cp-app-prop-contents-size-color'),
                        h('span.cp-app-prop-content', Messages._getKey('historyTrim_contentsSize', [contentsPrettySize]))
                    ]),
                ]),
                button = h('button.btn.btn-danger-alt.no-margin', Messages.trimHistory_button),
                spinner.spinner
            ]);
            $d.append(size);

            var $button = $(button);
            UI.confirmButton(button, {
                classes: 'btn-danger'
            }, function () {
                $button.remove();
                spinner.spin();
                history.execCommand('TRIM_HISTORY', {
                    pad: true,
                    channels: trimChannels,
                    teamId: typeof(owned) === "number" && owned
                }, function (obj) {
                    spinner.hide();
                    if (obj && obj.error) {
                        $(size).append(h('div.alert.alert-danger', Messages.trimHistory_error));
                        return;
                    }
                    $(size).remove();
                    var formatted = UIElements.prettySize(bytes - historyBytes);
                    $d.append(h('div.cp-app-prop', [
                        Messages.upload_size,
                        h('br'),
                        h('span.cp-app-prop-content', formatted)
                    ]));
                    $d.append(h('div.alert.alert-success', Messages.trimHistory_success));
                });
            });

            cb(void 0, $d);
        });
    };

    Properties.getPropertiesModal = function (common, opts, cb) {
        cb = cb || function () {};
        opts = opts || {};
        var tabs = [{
            getTab: getPadProperties,
            title: Messages.fc_prop,
            icon: "fa fa-info-circle",
        }];
        Modal.getModal(common, opts, tabs, cb);
    };

    return Properties;
});
