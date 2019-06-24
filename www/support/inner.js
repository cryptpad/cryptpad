define([
    'jquery',
    '/common/toolbar3.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/api/config',
    '/common/common-feedback.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/support/app-support.less',
], function (
    $,
    Toolbar,
    nThen,
    SFCommon,
    UI,
    UIElements,
    Util,
    Hash,
    Messages,
    h,
    ApiConfig,
    Feedback
    )
{
    var saveAs = window.saveAs;
    var APP = window.APP = {};

    var common;
    var metadataMgr;
    var privateData;
    var sframeChan;

    var categories = {
        'tickets': [
            'cp-support-list',
        ],
        'new': [
            'cp-support-form',
        ],
    };

    var supportKey = ApiConfig.supportMailbox; // XXX curvePublic
    var supportChannel = Hash.getChannelIdFromKey(supportKey); // XXX
    if (true || !supportKey || !supportChannel) {
        categories = {
            'tickets': [
                'cp-support-disabled'
            ]
        };
    }

    var create = {};

    var makeBlock = function (key, addButton) {
        // Convert to camlCase for translation keys
        var safeKey = key.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });

        var $div = $('<div>', {'class': 'cp-support-' + key + ' cp-sidebarlayout-element'});
        $('<label>').text(Messages['support_'+safeKey+'Title'] || key).appendTo($div);
        $('<span>', {'class': 'cp-sidebarlayout-description'})
            .text(Messages['support_'+safeKey+'Hint'] || 'Coming soon...').appendTo($div);
        if (addButton) {
            $('<button>', {
                'class': 'btn btn-primary'
            }).text(Messages['support_'+safeKey+'Button'] || safeKey).appendTo($div);
        }
        return $div;
    };

    var showError = function (form, msg) {
        if (!msg) {
            return void $(form).find('.cp-support-form-error').text('').hide();
        }
        $(form).find('.cp-support-form-error').text(msg).show();
    };

    var makeForm = function (cb, title) {
        var button;

        if (typeof(cb) === "function") {
            button = h('button.btn.btn-primary.cp-support-list-send', Messages.support_send || 'Send'); // XXX
            $(button).click(cb);
        }

        var content = [
            h('hr'),
            h('div.cp-support-form-error'),
            h('label' + (title ? '.cp-hidden' : ''), Messages.support_formTitle || 'title...'), // XXX
            h('input.cp-support-form-title' + (title ? '.cp-hidden' : ''), {
                placeholder: Messages.support_formTitlePlaceholder || 'title here...', // XXX
                value: title
            }),
            cb ? undefined : h('br'),
            h('label', Messages.support_formMessage || 'content...'), // XXX
            h('textarea.cp-support-form-msg', {
                placeholder: Messages.support_formMessagePlaceholder || 'describe your problem here...' // XXX
            }),
            h('hr'),
            button
        ];

        return h('div.cp-support-form-container', content);
    };

    var sendForm = function (id, form) {
        var user = metadataMgr.getUserData();
        privateData = metadataMgr.getPrivateData();

        var $title = $(form).find('.cp-support-form-title');
        var $content = $(form).find('.cp-support-form-msg');

        var title = $title.val();
        if (!title) {
            return void showError(form, Messages.support_formTitleError || 'title error'); // XXX
        }
        var content = $content.val();
        if (!content) {
            return void showError(form, Messages.support_formContentError || 'content error'); // XXX
        }
        // Success: hide any error
        showError(form, null);
        $content.val('');
        $title.val('');

        common.mailbox.sendTo('TICKET', {
            sender: {
                name: user.name,
                channel: privateData.support,
                curvePublic: user.curvePublic,
                edPublic: privateData.edPublic
            },
            title: title,
            message: content,
            id: id
        }, {
            channel: supportChannel,
            curvePublic: supportKey
        });
        common.mailbox.sendTo('TICKET', {
            sender: {
                name: user.name,
                channel: privateData.support,
                curvePublic: user.curvePublic,
                edPublic: privateData.edPublic
            },
            title: title,
            message: content,
            id: id
        }, {
            channel: privateData.support,
            curvePublic: user.curvePublic
        });

        return true;
    };

    // List existing (open?) tickets
    create['list'] = function () {
        var key = 'list';
        var $div = makeBlock(key);

        var makeTicket = function (content) {
            var ticketTitle = content.id + ' - ' + content.title;
            var answer = h('button.btn.btn-primary.cp-support-answer', Messages.support_answer || 'Answer'); // XXX

            var $ticket = $(h('div.cp-support-list-ticket', {
                'data-id': content.id
            }, [
                h('h2', ticketTitle),
                h('div.cp-support-list-actions', answer)
            ]));

            $(answer).click(function () {
                $div.find('.cp-support-form-container').remove();
                $div.find('.cp-support-answer').show();
                $(answer).hide();
                var form = makeForm(function () {
                    var sent = sendForm(content.id, form);
                    if (sent) {
                        $(answer).show();
                        $(form).remove();
                    }
                }, content.title);
                $ticket.append(form);
            });

            $div.append($ticket);
            return $ticket;
        };

        var makeMessage = function (content, hash) {
            // Check content.sender to see if it comes from us or from an admin
            // XXX admins should send their personal public key?
            var fromMe = content.sender && content.sender.edPublic === privateData.edPublic;
            return h('div.cp-support-list-message', [
                h('p.cp-support-message-from' + fromMe ? '.cp-support-fromme' : '',
                    //Messages._getKey('support_from', [content.sender.name])), // XXX
                    [h('b', 'From: '), content.sender.name]),
                h('pre.cp-support-message-content', content.message)
            ]);
        };

        // Register to the "support" mailbox
        common.mailbox.subscribe(['support'], {
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
                if (msg.type === 'CLOSE') {
                    // A ticket has been closed by the admins...
                    // TODO: add a "closed" class to the ticket in the UI
                }
                if (msg.type !== 'TICKET') { return; }
                var content = msg.content;
                var id = content.id;

                var $ticket = $div.find('.cp-support-list-ticket[data-id="'+id+'"]');
                if (!$ticket.length) {
                    $ticket = makeTicket(content);
                }
                $ticket.append(makeMessage(content, hash));
            },
            onViewed: function (data) {
                // Remove the ticket with this hash
                // If the ticket div is empty, remove the ticket div
            }
        });
        return $div;
    };

    // Create a new tickets
    create['form'] = function () {
        var key = 'form';
        var $div = makeBlock(key, true);

        var form = makeForm();

        $div.find('button').before(form);

        var id = Util.uid();

        $div.find('button').click(function () {
            var sent = sendForm(id, form);
            if (sent) {
                $('.cp-sidebarlayout-category[data-category="tickets"]').click();
            }
        });
        return $div;
    };

    // Support is disabled...
    create['disabled'] = function () {
        var key = 'disabled';
        var $div = makeBlock(key);
        // XXX add text
        return $div;
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
        var active = privateData.category || 'tickets';
        common.setHash(active);
        Object.keys(categories).forEach(function (key) {
            var $category = $('<div>', {
                'class': 'cp-sidebarlayout-category',
                'data-category': key
            }).appendTo($categories);
            if (key === 'tickets') { $category.append($('<span>', {'class': 'fa fa-envelope-o'})); }
            if (key === 'new') { $category.append($('<span>', {'class': 'fa fa-life-ring'})); }

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

            $category.append(Messages['support_cat_'+key] || key);
        });
        showCategories(categories[active]);
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.supportPage || 'Support', // XXX
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
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
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        metadataMgr = common.getMetadataMgr();
        privateData = metadataMgr.getPrivateData();
        common.setTabTitle(Messages.supportPage || 'Support');

        APP.origin = privateData.origin;
        APP.readOnly = privateData.readOnly;

        // Content
        var $rightside = APP.$rightside;
        var addItem = function (cssClass) {
            var item = cssClass.slice(11); // remove 'cp-support-'
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
