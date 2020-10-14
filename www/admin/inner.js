define([
    'jquery',
    '/api/config',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-signing-keys.js',
    '/support/ui.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/admin/app-admin.less',
], function (
    $,
    ApiConfig,
    Crypto,
    Toolbar,
    nThen,
    SFCommon,
    h,
    Messages,
    UI,
    Util,
    Hash,
    Keys,
    Support
    )
{
    var APP = {
        'instanceStatus': {}
    };

    var common;
    var sFrameChan;

    var categories = {
        'general': [
            'cp-admin-flush-cache',
            'cp-admin-update-limit',
            // 'cp-admin-registration',
        ],
        'quota': [
            'cp-admin-defaultlimit',
            'cp-admin-setlimit',
            'cp-admin-getlimits',
        ],
        'stats': [
            'cp-admin-active-sessions',
            'cp-admin-active-pads',
            'cp-admin-open-files',
            'cp-admin-registered',
            'cp-admin-disk-usage',
        ],
        'support': [
            'cp-admin-support-list',
            'cp-admin-support-init'
        ]
    };

    var create = {};

    var makeBlock = function (key, addButton) {
        // Convert to camlCase for translation keys
        var safeKey = key.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });

        var $div = $('<div>', {'class': 'cp-admin-' + key + ' cp-sidebarlayout-element'});
        $('<label>').text(Messages['admin_'+safeKey+'Title'] || key).appendTo($div);
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages['admin_'+safeKey+'Hint'] || 'Coming soon...').appendTo($div);
        if (addButton) {
            $('<button>', {
                'class': 'btn btn-primary'
            }).text(Messages['admin_'+safeKey+'Button'] || safeKey).appendTo($div);
        }
        return $div;
    };
    create['update-limit'] = function () {
        var key = 'update-limit';
        var $div = makeBlock(key, true);
        $div.find('button').click(function () {
            sFrameChan.query('Q_UPDATE_LIMIT', null, function (e, res) {
                if (e || (res && res.error)) { return void console.error(e || res.error); }
                UI.alert(Messages.admin_updateLimitDone || 'done');
            });
        });
        return $div;
    };
    create['flush-cache'] = function () {
        var key = 'flush-cache';
        var $div = makeBlock(key, true);
        var called = false;
        $div.find('button').click(function () {
            if (called) { return; }
            called = true;
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'FLUSH_CACHE',
            }, function (e, data) {
                called = false;
                UI.alert(data ? Messages.admin_flushCacheDone || 'done' : 'error' + e);
            });
        });
        return $div;
    };
    create['registration'] = function () {
        var key = 'registration';
        var $div = makeBlock(key, true);
        var $button = $div.find('button');
        var state = APP.instanceStatus.restrictRegistration;
        if (state) {
            $button.text(Messages.admin_registrationAllow);
        } else {
            $button.removeClass('btn-primary').addClass('btn-danger');
        }
        var called = false;
        $div.find('button').click(function () {
            called = true;
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['RESTRICT_REGISTRATION', [!state]]
            }, function (e) {
                if (e) { UI.warn(Messages.error); console.error(e); }
                APP.updateStatus(function () {
                    called = false;
                    state = APP.instanceStatus.restrictRegistration;
                    if (state) {
                        console.log($button);
                        $button.text(Messages.admin_registrationAllow);
                        $button.addClass('btn-primary').removeClass('btn-danger');
                    } else {
                        $button.text(Messages.admin_registrationButton);
                        $button.removeClass('btn-primary').addClass('btn-danger');
                    }
                });
            });
        });
        return $div;
    };

    var getPrettySize = function (bytes) {
        var unit = Util.magnitudeOfBytes(bytes);
        var value = unit === 'GB' ? Util.bytesToGigabytes(bytes) : Util.bytesToMegabytes(bytes);
        return unit === 'GB' ? Messages._getKey('formattedGB', [value])
                             : Messages._getKey('formattedMB', [value]);
    };

    create['defaultlimit'] = function () {
        var key = 'defaultlimit';
        var $div = makeBlock(key);
        var _limit = APP.instanceStatus.defaultStorageLimit;
        var _limitMB = Util.bytesToMegabytes(_limit);
        var limit = getPrettySize(_limit);
        var newLimit = h('input', {type: 'number', min: 0, value: _limitMB});
        var set = h('button.btn.btn-primary', Messages.admin_setlimitButton);
        $div.append(h('div', [
            h('span.cp-admin-defaultlimit-value', Messages._getKey('admin_limit', [limit])),
            h('div.cp-admin-setlimit-form', [
                h('label', Messages.admin_defaultLimitMB),
                newLimit,
                h('nav', [set])
            ])
        ]));

        UI.confirmButton(set, {
            classes: 'btn-primary',
            multiple: true,
            validate: function () {
                var l = parseInt($(newLimit).val());
                if (isNaN(l)) { return false; }
                return true;
            }
        }, function () {
            var lMB = parseInt($(newLimit).val()); // Megabytes
            var l = lMB * 1024 * 1024; // Bytes
            var data = [l];
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['UPDATE_DEFAULT_STORAGE', data]
            }, function (e) {
                if (e) { UI.warn(Messages.error); return void console.error(e); }
                var limit = getPrettySize(l);
                $div.find('.cp-admin-defaultlimit-value').text(Messages._getKey('admin_limit', [limit]));
            });
        });
        return $div;
    };
    create['getlimits'] = function () {
        var key = 'getlimits';
        var $div = makeBlock(key);
        APP.refreshLimits = function () {
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'GET_LIMITS',
            }, function (e, data) {
                if (e) { return; }
                if (!Array.isArray(data) || !data[0]) { return; }

                $div.find('.cp-admin-all-limits').remove();

                var obj = data[0];
                if (obj && (obj.message || obj.location)) {
                    delete obj.message;
                    delete obj.location;
                }
                var list = Object.keys(obj).sort(function (a, b) {
                    return obj[a].limit > obj[b].limit;
                });

                var compact = list.length > 10;

                var content = list.map(function (key) {
                    var user = obj[key];
                    var limit = getPrettySize(user.limit);
                    var title = Messages._getKey('admin_limit', [limit]) + ', ' +
                                Messages._getKey('admin_limitPlan', [user.plan]) + ', ' +
                                Messages._getKey('admin_limitNote', [user.note]);

                    var keyEl = h('code.cp-limit-key', key);
                    $(keyEl).click(function () {
                        $('.cp-admin-setlimit-form').find('.cp-setlimit-key').val(key);
                        $('.cp-admin-setlimit-form').find('.cp-setlimit-quota').val(Math.floor(user.limit/1024));
                        $('.cp-admin-setlimit-form').find('.cp-setlimit-note').val(user.note);
                    });
                    if (compact) {
                        return h('tr.cp-admin-limit', {
                            title: title
                        }, [
                            h('td', keyEl),
                            h('td.limit', Messages._getKey('admin_limit', [limit])),
                            h('td.plan', Messages._getKey('admin_limitPlan', [user.plan])),
                            h('td.note', Messages._getKey('admin_limitNote', [user.note]))
                        ]);
                    }
                    return h('li.cp-admin-limit', [
                        keyEl,
                        h('ul.cp-limit-data', [
                            h('li.limit', Messages._getKey('admin_limit', [limit])),
                            h('li.plan', Messages._getKey('admin_limitPlan', [user.plan])),
                            h('li.note', Messages._getKey('admin_limitNote', [user.note]))
                        ])
                    ]);
                });
                if (compact) { return $div.append(h('table.cp-admin-all-limits', content)); }
                $div.append(h('ul.cp-admin-all-limits', content));
            });
        };
        APP.refreshLimits();
        return $div;
    };

    create['setlimit'] = function () {
        var key = 'setlimit';
        var $div = makeBlock(key);

        var user = h('input.cp-setlimit-key');
        var $key = $(user);
        var limit = h('input.cp-setlimit-quota', {type: 'number', min: 0, value: 0});
        var note = h('input.cp-setlimit-note');
        var remove = h('button.btn.btn-danger', Messages.fc_remove);
        var set = h('button.btn.btn-primary', Messages.admin_setlimitButton);
        var form = h('div.cp-admin-setlimit-form', [
            h('label', Messages.admin_limitUser),
            user,
            h('label', Messages.admin_limitMB),
            limit,
            h('label', Messages.admin_limitSetNote),
            note,
            h('nav', [set, remove])
        ]);

        var getValues = function () {
            var key = $key.val();
            var _limit = parseInt($(limit).val());
            var _note = $(note).val();
            if (key.length !== 44) {
                try {
                    var u = Keys.parseUser(key);
                    if (!u.domain || !u.user || !u.pubkey) {
                        return void UI.warn(Messages.admin_invalKey);
                    }
                } catch (e) {
                    return void UI.warn(Messages.admin_invalKey);
                }
            }
            if (isNaN(_limit) || _limit < 0) {
                return void UI.warn(Messages.admin_invalLimit);
            }
            return {
                key: key,
                data: {
                    limit: _limit * 1024 * 1024,
                    note: _note,
                    plan: 'custom'
                }
            };
        };

        UI.confirmButton(remove, {
            classes: 'btn-danger',
            multiple: true,
            validate: function () {
                var obj = getValues();
                if (!obj || !obj.key) { return false; }
                return true;
            }
        }, function () {
            var obj = getValues();
            var data = [obj.key];
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['RM_QUOTA', data]
            }, function (e) {
                if (e) { UI.warn(Messages.error); console.error(e); }
                APP.refreshLimits();
                $key.val('');
            });
        });

        $(set).click(function () {
            var obj = getValues();
            if (!obj || !obj.key) { return; }
            var data = [obj.key, obj.data];
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'ADMIN_DECREE',
                data: ['SET_QUOTA', data]
            }, function (e) {
                if (e) { UI.warn(Messages.error); console.error(e); }
                APP.refreshLimits();
                $key.val('');
            });
        });

        $div.append(form);
        return $div;
    };

    create['active-sessions'] = function () {
        var key = 'active-sessions';
        var $div = makeBlock(key);
        sFrameChan.query('Q_ADMIN_RPC', {
            cmd: 'ACTIVE_SESSIONS',
        }, function (e, data) {
            var total = data[0];
            var ips = data[1];
            $div.append(h('pre', total + ' (' + ips + ')'));
        });
        return $div;
    };
    create['active-pads'] = function () {
        var key = 'active-pads';
        var $div = makeBlock(key);
        sFrameChan.query('Q_ADMIN_RPC', {
            cmd: 'ACTIVE_PADS',
        }, function (e, data) {
            console.log(e, data);
            $div.append(h('pre', String(data)));
        });
        return $div;
    };
    create['open-files'] = function () {
        var key = 'open-files';
        var $div = makeBlock(key);
        sFrameChan.query('Q_ADMIN_RPC', {
            cmd: 'GET_FILE_DESCRIPTOR_COUNT',
        }, function (e, data) {
            console.log(e, data);
            $div.append(h('pre', String(data)));
        });
        return $div;
    };
    create['registered'] = function () {
        var key = 'registered';
        var $div = makeBlock(key);
        sFrameChan.query('Q_ADMIN_RPC', {
            cmd: 'REGISTERED_USERS',
        }, function (e, data) {
            console.log(e, data);
            $div.append(h('pre', String(data)));
        });
        return $div;
    };
    create['disk-usage'] = function () {
        var key = 'disk-usage';
        var $div = makeBlock(key, true);
        var called = false;
        $div.find('button').click(function () {
            $div.find('button').hide();
            if (called) { return; }
            called = true;
            sFrameChan.query('Q_ADMIN_RPC', {
                cmd: 'DISK_USAGE',
            }, function (e, data) {
                console.log(e, data);
                if (e) { return void console.error(e); }
                var obj = data[0];
                Object.keys(obj).forEach(function (key) {
                    var val = obj[key];
                    var unit = Util.magnitudeOfBytes(val);
                    if (unit === 'GB') {
                        obj[key] = Util.bytesToGigabytes(val) + ' GB';
                    } else if (unit === 'MB') {
                        obj[key] = Util.bytesToMegabytes(val) + ' MB';
                    } else {
                        obj[key] = Util.bytesToKilobytes(val) + ' KB';
                    }
                });
                $div.append(h('ul', Object.keys(obj).map(function (k) {
                    return h('li', [
                        h('strong', k === 'total' ? k : '/' + k),
                        ' : ',
                        obj[k]
                    ]);
                })));
            });
        });
        return $div;
    };

    var supportKey = ApiConfig.supportMailbox;
    create['support-list'] = function () {
        if (!supportKey || !APP.privateKey) { return; }
        var $container = makeBlock('support-list');
        var $div = $(h('div.cp-support-container')).appendTo($container);

        var catContainer = h('div.cp-dropdown-container');
        $div.append(catContainer);
        var category = 'all';
        var $drop = APP.support.makeCategoryDropdown(catContainer, function (key) {
            category = key;
            if (key === 'all') {
                $div.find('.cp-support-list-ticket').show();
                return;
            }
            $div.find('.cp-support-list-ticket').hide();
            $div.find('.cp-support-list-ticket[data-cat="'+key+'"]').show();
        }, true);
        $drop.setValue('all');

        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var cat = privateData.category || '';
        var linkedId = cat.indexOf('-') !== -1 && cat.slice(8);

        var hashesById = {};

        var reorder = function () {
            var order = Object.keys(hashesById);
            order.sort(function (id1, id2) {
                var t1 = hashesById[id1];
                var t2 = hashesById[id2];
                if (!Array.isArray(t1)) { return 1; }
                if (!Array.isArray(t2)) { return -1; }
                var lastMsg1 = t1[t1.length - 1];
                var lastMsg2 = t2[t2.length - 1];
                var time1 = Util.find(lastMsg1, ['content', 'msg', 'content', 'time']);
                var time2 = Util.find(lastMsg2, ['content', 'msg', 'content', 'time']);
                var authorEd1 = Util.find(lastMsg1, ['content', 'msg', 'content', 'sender', 'edPublic']);
                var authorEd2 = Util.find(lastMsg2, ['content', 'msg', 'content', 'sender', 'edPublic']);
                var admin1 = ApiConfig.adminKeys.indexOf(authorEd1) !== -1;
                var admin2 = ApiConfig.adminKeys.indexOf(authorEd2) !== -1;
                // If one is answered and not the other, put the unanswered first
                if (admin1 && !admin2) { return 1; }
                if (!admin1 && admin2) { return -1; }
                // Otherwise, sort them by time
                return time2 - time1;
            });
            order.forEach(function (id, i) {
                $div.find('[data-id="'+id+'"]').css('order', i);
            });
        };

        var to = Util.throttle(function () {
            var $ticket = $div.find('.cp-support-list-ticket[data-id="'+linkedId+'"]');
            $ticket[0].scrollIntoView();
            linkedId = undefined;
        }, 100);

        // Register to the "support" mailbox
        common.mailbox.subscribe(['supportadmin'], {
            onMessage: function (data) {
                /*
                    Get ID of the ticket
                    If we already have a div for this ID
                        Push the message to the end of the ticket
                    If it's a new ticket ID
                        Make a new div for this ID
                */
                var msg = data.content.msg;
                var hash = data.content.hash;
                var content = msg.content;
                var id = content.id;
                var $ticket = $div.find('.cp-support-list-ticket[data-id="'+id+'"]');

                hashesById[id] = hashesById[id] || [];
                if (hashesById[id].indexOf(hash) === -1) {
                    hashesById[id].push(data);
                }

                if (msg.type === 'CLOSE') {
                    // A ticket has been closed by the admins...
                    if (!$ticket.length) { return; }
                    $ticket.addClass('cp-support-list-closed');
                    $ticket.append(APP.support.makeCloseMessage(content, hash));
                    return;
                }
                if (msg.type !== 'TICKET') { return; }

                if (!$ticket.length) {
                    $ticket = APP.support.makeTicket($div, content, function (hideButton) {
                        // the ticket will still be displayed until the worker confirms its deletion
                        // so make it unclickable in the meantime
                        hideButton.setAttribute('disabled', true);
                        var error = false;
                        nThen(function (w) {
                            hashesById[id].forEach(function (d) {
                                common.mailbox.dismiss(d, w(function (err) {
                                    if (err) {
                                        error = true;
                                        console.error(err);
                                    }
                                }));
                            });
                        }).nThen(function () {
                            if (!error) { return void $ticket.remove(); }
                            // if deletion failed then reactivate the button and warn
                            hideButton.removeAttribute('disabled');
                            // and show a generic error message
                            UI.alert(Messages.error);
                        });
                    });
                    if (category !== 'all' && $ticket.attr('data-cat') !== category) {
                        $ticket.hide();
                    }
                }
                $ticket.append(APP.support.makeMessage(content, hash));
                reorder();

                if (linkedId) { to(); }
            }
        });
        return $container;
    };


    var checkAdminKey = function (priv) {
        if (!supportKey) { return; }
        return Hash.checkBoxKeyPair(priv, supportKey);
    };

    create['support-init'] = function () {
        var $div = makeBlock('support-init');
        if (!supportKey) {
            $div.append(h('p', Messages.admin_supportInitHelp));
            return $div;
        }
        if (!APP.privateKey || !checkAdminKey(APP.privateKey)) {
            $div.append(h('p', Messages.admin_supportInitPrivate));

            var error = h('div.cp-admin-support-error');
            var input = h('input.cp-admin-add-private-key');
            var button = h('button.btn.btn-primary', Messages.admin_supportAddKey);

            if (APP.privateKey && !checkAdminKey(APP.privateKey)) {
                $(error).text(Messages.admin_supportAddError);
            }

            $div.append(h('div', [
                error,
                input,
                button
            ]));

            $(button).click(function () {
                var key = $(input).val();
                if (!checkAdminKey(key)) {
                    $(input).val('');
                    return void $(error).text(Messages.admin_supportAddError);
                }
                sFrameChan.query("Q_ADMIN_MAILBOX", key, function () {
                    APP.privateKey = key;
                    $('.cp-admin-support-init').hide();
                    APP.$rightside.append(create['support-list']());
                });
            });
            return $div;
        }
        return;
    };

    var hideCategories = function () {
        APP.$rightside.find('> div').hide();
    };
    var showCategories = function (cat) {
        hideCategories();
        cat.forEach(function (c) {
            APP.$rightside.find('.'+c).show();
        });
    };
    var createLeftside = function () {
        var $categories = $('<div>', {'class': 'cp-sidebarlayout-categories'})
                            .appendTo(APP.$leftside);
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var active = privateData.category || 'general';
        if (active.indexOf('-') !== -1) {
            active = active.split('-')[0];
        }
        common.setHash(active);
        Object.keys(categories).forEach(function (key) {
            var $category = $('<div>', {'class': 'cp-sidebarlayout-category'}).appendTo($categories);
            if (key === 'general') { $category.append($('<span>', {'class': 'fa fa-user-o'})); }
            if (key === 'stats') { $category.append($('<span>', {'class': 'fa fa-line-chart'})); }
            if (key === 'quota') { $category.append($('<span>', {'class': 'fa fa-hdd-o'})); }
            if (key === 'support') { $category.append($('<span>', {'class': 'fa fa-life-ring'})); }

            if (key === active) {
                $category.addClass('cp-leftside-active');
            }

            $category.click(function () {
                if (!Array.isArray(categories[key]) && categories[key].onClick) {
                    categories[key].onClick();
                    return;
                }
                active = key;
                common.setHash(key);
                $categories.find('.cp-leftside-active').removeClass('cp-leftside-active');
                $category.addClass('cp-leftside-active');
                showCategories(categories[key]);
            });

            $category.append(Messages['admin_cat_'+key] || key);
        });
        showCategories(categories[active]);
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.adminPage || 'Admin',
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
    };

    var updateStatus = APP.updateStatus = function (cb) {
        sFrameChan.query('Q_ADMIN_RPC', {
            cmd: 'INSTANCE_STATUS',
        }, function (e, data) {
            if (e) { console.error(e); return void cb(e); }
            if (!Array.isArray(data)) { return void cb('EINVAL'); }
            APP.instanceStatus = data[0];
            console.log("Status", APP.instanceStatus);
            cb();
        });
    };

    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        APP.$container = $('#cp-sidebarlayout-container');
        APP.$toolbar = $('#cp-toolbar');
        APP.$leftside = $('<div>', {id: 'cp-sidebarlayout-leftside'}).appendTo(APP.$container);
        APP.$rightside = $('<div>', {id: 'cp-sidebarlayout-rightside'}).appendTo(APP.$container);
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (waitFor) {
        updateStatus(waitFor());
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        common.setTabTitle(Messages.adminPage || 'Administration');

        if (!privateData.edPublic || !ApiConfig.adminKeys || !Array.isArray(ApiConfig.adminKeys)
            || ApiConfig.adminKeys.indexOf(privateData.edPublic) === -1) {
            return void UI.errorLoadingScreen(Messages.admin_authError || '403 Forbidden');
        }

        APP.privateKey = privateData.supportPrivateKey;
        APP.origin = privateData.origin;
        APP.readOnly = privateData.readOnly;
        APP.support = Support.create(common, true);


        // Content
        var $rightside = APP.$rightside;
        var addItem = function (cssClass) {
            var item = cssClass.slice(9); // remove 'cp-settings-'
            if (typeof (create[item]) === "function") {
                $rightside.append(create[item]());
            }
        };
        for (var cat in categories) {
            if (!Array.isArray(categories[cat])) { continue; }
            categories[cat].forEach(addItem);
        }

        createLeftside();

        UI.removeLoadingScreen();

    });
});
