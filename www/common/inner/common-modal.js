define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/customize/messages.js',
    '/bower_components/nthen/index.js',
], function ($, Util, Hash, UI, UIElements, Messages, nThen) {
    var Modal = {};

    Modal.override = function (data, obj) {
        data.owners = obj.owners;
        data.expire = obj.expire;
        data.pending_owners = obj.pending_owners;
        data.mailbox = obj.mailbox;
        data.restricted = obj.restricted;
        data.allowed = obj.allowed;
        data.rejected = obj.rejected;
    };
    Modal.loadMetadata = function (Env, data, waitFor, redraw) {
        Env.common.getPadMetadata({
            channel: data.channel
        }, waitFor(function (md) {
            if (md && md.error) { return void console.error(md.error); }
            Modal.override(data, md);
            if (redraw) { Env.evRedrawAll.fire(redraw); }
        }));
    };
    Modal.getPadData = function (Env, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var common = Env.common;
        opts = opts || {};
        var data = {};
        nThen(function (waitFor) {
            var priv = common.getMetadataMgr().getPrivateData();
            var base = priv.origin;
            common.getPadAttribute('', waitFor(function (err, val) {
                if (err || !val) {
                    if (opts.access) {
                        data.password = priv.password;
                        // Access modal and the pad is not stored: we're not an owner
                        // so we don't need the correct href, just the type
                        var h = Hash.createRandomHash(priv.app, priv.password);
                        data.fakeHref = true;
                        data.href = base + priv.pathname + '#' + h;
                    } else {
                        waitFor.abort();
                        return void cb(err || 'EEMPTY');
                    }
                    return;
                }
                if (!val.fileType) {
                    delete val.owners;
                    delete val.expire;
                }
                Util.extend(data, val);
                if (data.href) { data.href = base + data.href; }
                if (data.roHref) { data.roHref = base + data.roHref; }
            }), opts.href);

            // If this is a file, don't try to look for metadata
            if (opts.channel && opts.channel.length > 32) { return; }
            if (opts.channel) { data.channel = opts.channel; }
            Modal.loadMetadata(Env, data, waitFor);
        }).nThen(function () {
            cb(void 0, data);
        });
    };
    Modal.isOwned = function (Env, data) {
        var common = Env.common;
        data = data || {};
        return common.isOwned(data.owners);
    };

    var blocked = false;
    Modal.getModal = function (common, opts, _tabs, cb) {
        if (blocked) { return; }
        blocked = true;
        var Env = {
            common: common,
            evRedrawAll: Util.mkEvent()
        };
        var data;
        var button = [{
            className: 'cancel',
            name: Messages.filePicker_close,
            onClick: function () {},
            keys: [13,27]
        }];
        var tabs = [];
        nThen(function (waitFor) {
            Modal.getPadData(Env, opts, waitFor(function (e, _data) {
                if (e) {
                    blocked = false;
                    waitFor.abort();
                    return void cb(e);
                }
                data = _data;
            }));
        }).nThen(function (waitFor) {
            var owned = Modal.isOwned(Env, data);
            if (typeof(owned) !== "boolean") {
                data.teamId = Number(owned);
            }
            _tabs.forEach(function (obj, i) {
                obj.getTab(Env, data, opts, waitFor(function (e, c) {
                    if (e) {
                        blocked = false;
                        waitFor.abort();
                        return void cb(e);
                    }
                    var node = (c instanceof $) ? c[0] : c;
                    tabs[i] = {
                        content: c && UI.dialog.customModal(node, {
                            buttons: obj.buttons || button,
                            onClose: function () {
                                blocked = false;
                                if (typeof(opts.onClose) === "function") { opts.onClose(); }
                            }
                        }),
                        disabled: !c,
                        title: obj.title,
                        icon: obj.icon
                    };
                }));
            });
        }).nThen(function () {
            var tabsContent = UI.dialog.tabs(tabs);
            var modal = UI.openCustomModal(tabsContent, {
                wide: opts.wide
            });
            cb (void 0, modal);

            var sframeChan = common.getSframeChannel();
            var handler = sframeChan.on('EV_RT_METADATA', function (md) {
                if (!$(modal).length) {
                    return void handler.stop();
                }
                Modal.override(data, Util.clone(md));
                Env.evRedrawAll.fire();
            });
            var metadataMgr = common.getMetadataMgr();
            var f = function () {
                if (!$(modal).length) {
                    return void metadataMgr.off('change', f);
                }
                Env.evRedrawAll.fire();
            };
            metadataMgr.onChange(f);
        });
    };

    return Modal;
});
