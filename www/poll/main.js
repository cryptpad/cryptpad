define([
    'jquery',
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    '/bower_components/hyperjson/hyperjson.js',
    'render.js',
    '/common/toolbar2.js',
    '/bower_components/file-saver/FileSaver.min.js'
], function ($, TextPatcher, Listmap, Crypto, Cryptpad, Cryptget, Hyperjson, Renderer, Toolbar) {

    var Messages = Cryptpad.Messages;

    $(function () {

    var HIDE_INTRODUCTION_TEXT = "hide_poll_text";
    var defaultName;

    var secret = Cryptpad.getSecrets();
    var readOnly = secret.keys && !secret.keys.editKeyStr;
    // DEPRECATE_F
    if (!secret.keys) {
        secret.keys = secret.key;
    }

    var DEBUG = false;
    var debug = console.log;
    if (!DEBUG) {
        debug = function() {};
    }

    Cryptpad.addLoadingScreen();
    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var Render = Renderer(Cryptpad);

    var APP = window.APP = {
        Toolbar: Toolbar,
        Hyperjson: Hyperjson,
        Render: Render,
        $bar: $('#toolbar'),
        editable: {
            row: [],
            col: []
        },
        locked: false
    };

    var sortColumns = function (order, firstcol) {
        var colsOrder = order.slice();
        colsOrder.sort(function (a, b) {
            return (a === firstcol) ? -1 :
                        ((b === firstcol) ? 1 : 0);
        });
        return colsOrder;
    };

    var isOwnColumnCommitted = function () {
        return APP.proxy && APP.proxy.table.colsOrder.indexOf(APP.userid) !== -1;
    };

    var mergeUncommitted = function (proxy, uncommitted, commit) {
        var newObj;
        if (commit) {
            newObj = proxy;
        } else {
            newObj = $.extend(true, {}, proxy);
        }
        // We have uncommitted data only if the user's column is not in the proxy
        // If it is already is the proxy, nothing to merge
        if (isOwnColumnCommitted()) {
            return newObj;
        }
        // Merge uncommitted into the proxy
        uncommitted.table.colsOrder.forEach(function (x) {
            if (newObj.table.colsOrder.indexOf(x) !== -1) { return; }
            newObj.table.colsOrder.push(x);
        });
        for (var k in uncommitted.table.cols) {
            if (!newObj.table.cols[k]) {
                newObj.table.cols[k] = uncommitted.table.cols[k];
            }
        }
        for (var l in uncommitted.table.cells) {
            if (!newObj.table.cells[l]) {
                newObj.table.cells[l] = uncommitted.table.cells[l];
            }
        }
        return newObj;
    };

    var styleUncommittedColumn = function () {
        var id = APP.userid;

        // Enable the checkboxes for the user's column (committed or not)
        $('input[disabled="disabled"][data-rt-id^="' + id + '"]').removeAttr('disabled');
        $('input[type="number"][data-rt-id^="' + id + '"]').addClass('enabled');
        $('.lock[data-rt-id="' + id + '"]').addClass('fa-unlock').removeClass('fa-lock').attr('title', Messages.poll_unlocked);

        if (isOwnColumnCommitted()) { return; }
        $('[data-rt-id^="' + id + '"]').closest('td').addClass("uncommitted");
        $('td.uncommitted .cover').addClass("uncommitted");
        $('.uncommitted input[type="text"]').attr("placeholder", Messages.poll_userPlaceholder);
    };

    var unlockElements = function () {
        APP.editable.row.forEach(function (id) {
            var $input = $('input[type="text"][disabled="disabled"][data-rt-id="' + id + '"]').removeAttr('disabled');
            $input.parent().parent().addClass('editing');
            $('span.edit[data-rt-id="' + id + '"]').css('visibility', 'hidden');
        });
        APP.editable.col.forEach(function (id) {
            var $input = $('input[disabled="disabled"][data-rt-id^="' + id + '"]').removeAttr('disabled');
            $input.parent().addClass('editing');
            $('input[type="number"][data-rt-id^="' + id + '"]').addClass('enabled');
            $('.lock[data-rt-id="' + id + '"]').addClass('fa-unlock').removeClass('fa-lock').attr('title', Messages.poll_unlocked);
        });
    };

    var updateTableButtons = function () {
        if (!isOwnColumnCommitted()) {
            $('#commit').show();
        }

        var $createOption = APP.$table.find('tfoot tr td:first-child');
        var $commitCell = APP.$table.find('tfoot tr td:nth-child(2)');
        $createOption.append(APP.$createRow);
        $commitCell.append(APP.$commit);
        $('#create-user, #create-option').css('display', 'inline-block');
        if (!APP.proxy || !APP.proxy.table.rowsOrder || APP.proxy.table.rowsOrder.length === 0) { $('#create-user').hide(); }
        var width = $('#table').outerWidth();
        if (width) {
            //$('#create-user').css('left', width + 30 + 'px');
        }
    };

    var setTablePublished = function (bool) {
        if (bool) {
            if (APP.$publish) { APP.$publish.hide(); }
            if (APP.$admin) { APP.$admin.show(); }
            $('#create-option').hide();
            $('.remove[data-rt-id^="y"], .edit[data-rt-id^="y"]').hide();
        } else {
            if (APP.$publish) { APP.$publish.show(); }
            if (APP.$admin) { APP.$admin.hide(); }
            $('#create-option').show();
            $('.remove[data-rt-id^="y"], .edit[data-rt-id^="y"]').show();
        }
    };

    var updateDisplayedTable = function () {
        styleUncommittedColumn();
        unlockElements();
        updateTableButtons();
        setTablePublished(APP.proxy.published);

        /*
        APP.proxy.table.rowsOrder.forEach(function (rowId) {
            $('[data-rt-id="' + rowId +'"]').val(APP.proxy.table.rows[rowId] || '');
        });*/
    };

    var unlockColumn = function (id, cb) {
        if (APP.editable.col.indexOf(id) === -1) {
            APP.editable.col.push(id);
        }
        if (typeof(cb) === "function") {
            cb();
        }
    };
    var unlockRow = function (id, cb) {
        if (APP.editable.row.indexOf(id) === -1) {
            APP.editable.row.push(id);
        }
        if (typeof(cb) === "function") {
            cb();
        }
    };

    /*  Any time the realtime object changes, call this function */
    var change = function (o, n, path, throttle, cb) {
        if (path && !Cryptpad.isArray(path)) {
            return;
        }
        if (path && path.join) {
            debug("Change from [%s] to [%s] at [%s]",
                o, n, path.join(', '));
        }

        var table = APP.$table[0];

        var displayedObj = mergeUncommitted(APP.proxy, APP.uncommitted);

        var colsOrder = sortColumns(displayedObj.table.colsOrder, APP.userid);
        var conf = {
            cols: colsOrder,
            readOnly: readOnly
        };

        //Render.updateTable(table, displayedObj, conf);

        /*  FIXME browser autocomplete fills in new fields sometimes
            calling updateTable twice removes the autofilled in values
            setting autocomplete="off" is not reliable

            https://developer.mozilla.org/en-US/docs/Web/Security/Securing_your_site/Turning_off_form_autocompletion
        */
        Cryptpad.notify();

        var getFocus = function () {
            var active = document.activeElement;
            if (!active) { return; }
            return {
                el: active,
                start: active.selectionStart,
                end: active.selectionEnd
            };
        };
        var setFocus = function (obj) {
            if (obj.el) { obj.el.focus(); }
            else { return; }
            if (obj.start) { obj.el.selectionStart = obj.start; }
            if (obj.end) { obj.el.selectionEnd = obj.end; }
        };

        var updateTable = function () {
            var displayedObj2 = mergeUncommitted(APP.proxy, APP.uncommitted);
            var f = getFocus();
            Render.updateTable(table, displayedObj2, conf);
            APP.proxy.table.rowsOrder.forEach(function (rowId) {
                $('input[data-rt-id="' + rowId +'"]').val(APP.proxy.table.rows[rowId] || '');
            });
            updateDisplayedTable();
            setFocus(f);
            if (typeof(cb) === "function") {
                cb();
            }
        };

        if (throttle) {
            if (APP.throttled) { window.clearTimeout(APP.throttled); }
            updateTable();
            APP.throttled = window.setTimeout(function () {
                updateDisplayedTable();
            }, throttle);
            return;
        }

        window.setTimeout(updateTable);
    };

    var getRealtimeId = function (input) {
        return input.getAttribute && input.getAttribute('data-rt-id');
    };

    /*  Called whenever an event is fired on an input element */
    var handleInput = function (input) {
        var type = input.type.toLowerCase();
        var id = getRealtimeId(input);

        debug(input);

        var object = APP.proxy;

        var x = Render.getCoordinates(id)[0];
        if (type !== "row" && x === APP.userid && APP.proxy.table.colsOrder.indexOf(x) === -1) {
            object = APP.uncommitted;
        }

        switch (type) {
            case 'text':
                debug("text[rt-id='%s'] [%s]", id, input.value);
                Render.setValue(object, id, input.value);
                change(null, null, null, 50);
                break;
            case 'number':
                debug("checkbox[tr-id='%s'] %s", id, input.value);
                if (APP.editable.col.indexOf(x) >= 0 || x === APP.userid) {
                    var value = parseInt(input.value);

                    if (isNaN(value)) {
                        console.error("Got NaN?!");
                        break;
                    }

                    Render.setValue(object, id, value);
                    change();
                } else {
                    debug('checkbox locked');
                }
                break;
            default:
                debug("Input[type='%s']", type);
                break;
        }
    };

    var hideInputs = function (target, isKeyup) {
        if (APP.locked) { return; }
        if (!isKeyup && $(target).is('[type="text"]')) {
            return;
        }
        $('.lock[data-rt-id!="' + APP.userid + '"]').addClass('fa-lock').removeClass('fa-unlock').attr('title', Messages.poll_locked);
        var $cells = APP.$table.find('thead td:not(.uncommitted), tbody td');
        $cells.find('[type="text"][data-rt-id!="' + APP.userid + '"]').attr('disabled', true);
        $cells.removeClass('editing');
        $('.edit[data-rt-id!="' + APP.userid + '"]').css('visibility', 'visible');
        APP.editable.col = [APP.userid];
        APP.editable.row = [];
    };

    /*  Called whenever an event is fired on a span */
    var handleSpan = function (span) {
        var id = span.getAttribute('data-rt-id');
        var type = Render.typeofId(id);
        var isRemove = span.className && span.className.split(' ').indexOf('remove') !== -1;
        var isEdit = span.className && span.className.split(' ').indexOf('edit') !== -1;
        var isLock = span.className && span.className.split(' ').indexOf('lock') !== -1;
        var isLocked = span.className && span.className.split(' ').indexOf('fa-lock') !== -1;
        if (type === 'row') {
            if (isRemove) {
                Cryptpad.confirm(Messages.poll_removeOption, function (res) {
                    if (!res) { return; }
                    Render.removeRow(APP.proxy, id, function () {
                        change();
                    });
                });
            } else if (isEdit) {
                hideInputs(span);
                unlockRow(id, function () {
                    change(null, null, null, null, function() {
                        $('input[data-rt-id="' + id + '"]').focus();
                    });
                });
            }
        } else if (type === 'col') {
            if (isRemove) {
                Cryptpad.confirm(Messages.poll_removeUser, function (res) {
                    if (!res) { return; }
                    Render.removeColumn(APP.proxy, id, function () {
                        change();
                    });
                });
            } else if (isLock && isLocked) {
                hideInputs(span);
                unlockColumn(id, function () {
                    change(null, null, null, null, function() {
                        $('input[data-rt-id="' + id + '"]').focus();
                    });
                });
            }
        } else if (type === 'cell') {
            change();
        } else {
            debug("UNHANDLED");
        }
    };

    var handleClick = function (e, isKeyup) {
        if (APP.locked) { return; }

        e.stopPropagation();

        if (!APP.ready) { return; }
        if (!isKeyup && e.which !== 1) { return; } // only allow left clicks

        var target = e && e.target;

        if (!target) { return void debug("NO TARGET"); }

        var nodeName = target && target.nodeName;
        var shouldLock = $(target).hasClass('fa-unlock');

        if ((!$(target).parents('#table tbody').length && $(target).hasClass('lock'))) {
            hideInputs(e);
        }

        switch (nodeName) {
            case 'INPUT':
                if (isKeyup && (e.keyCode === 13 || e.keyCode === 27)) {
                    hideInputs(target, isKeyup);
                    break;
                }
                if ($(target).is('input[type="number"]')) { console.error("number input focused?"); break; }

                handleInput(target);
                break;
            case 'LABEL':
                var input = $('input[type="number"][id=' + $(target).attr('for') + ']');
                var value = parseInt(input.val());

                input.val((value + 1) % 4);

                handleInput(input[0]);
                break;
            case 'SPAN':
                if (shouldLock) {
                    break;
                }
                handleSpan(target);
                break;
            case undefined:
                //console.error(new Error("C'est pas possible!"));
                break;
            default:
                debug(target, nodeName);
                break;
        }
    };

    /*
        Make sure that the realtime data structure has all the required fields
    */
    var prepareProxy = function (proxy, schema) {
        if (proxy && proxy.version === 1) { return; }
        debug("Configuring proxy schema...");

        proxy.info = proxy.info || schema.info;
        Object.keys(schema.info).forEach(function (k) {
            if (!proxy.info[k]) { proxy.info[k] = schema.info[k]; }
        });

        proxy.table = proxy.table || schema.table;
        Object.keys(schema.table).forEach(function (k) {
            if (!proxy.table[k]) { proxy.table[k] = schema.table[k]; }
        });

        proxy.version = 1;
    };

    /*

    */
    var publish = APP.publish = function (bool) {
        if (!APP.ready) { return; }
        if (APP.proxy.published !== bool) {
            APP.proxy.published = bool;
        }
        setTablePublished(bool);
        ['textarea'].forEach(function (sel) {
            $(sel).attr('disabled', bool);
        });
    };

    var showHelp = function(help) {
        if (typeof help === 'undefined') { help = !$('#howItWorks').is(':visible'); }

        var msg = (help ? Messages.poll_hide_help_button : Messages.poll_show_help_button);

        $('#howItWorks').toggle(help);
        $('#help').text(msg).attr('title', msg);
    };

    var Title;
    var UserList;

    var copyObject = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    // special UI elements
    var $description = $('#description').attr('placeholder', Messages.poll_descriptionHint || 'description');

var ready = function (info, userid, readOnly) {
    debug("READY");
    debug('userid: %s', userid);

    var proxy = APP.proxy;

    var isNew = false;
    var userDoc = JSON.stringify(proxy);
    if (userDoc === "" || userDoc === "{}") { isNew = true; }

    var uncommitted = APP.uncommitted = {};
    prepareProxy(proxy, copyObject(Render.Example));
    prepareProxy(uncommitted, copyObject(Render.Example));
    if (!readOnly && proxy.table.colsOrder.indexOf(userid) === -1 &&
        uncommitted.table.colsOrder.indexOf(userid) === -1) {
        uncommitted.table.colsOrder.unshift(userid);
    }

    var displayedObj = mergeUncommitted(proxy, uncommitted, false);

    var colsOrder = sortColumns(displayedObj.table.colsOrder, userid);

    var $table = APP.$table = $(Render.asHTML(displayedObj, null, colsOrder, readOnly));
    APP.$createRow = $('#create-option').click(function () {
        Render.createRow(proxy, function (empty, id) {
            change(null, null, null, null, function() {
                handleSpan($('.edit[data-rt-id="' + id + '"]')[0]);
            });
        });
    });

    APP.$createCol = $('#create-user').click(function () {
        Render.createColumn(proxy, function (empty, id) {
            change(null, null, null, null, function() {
                handleSpan($('.lock[data-rt-id="' + id + '"]')[0]);
            });
        });
    });

    // Commit button
    APP.$commit = $('#commit').click(function () {
        var uncommittedCopy = JSON.parse(JSON.stringify(APP.uncommitted));
        APP.uncommitted = {};
        prepareProxy(APP.uncommitted, copyObject(Render.Example));
        mergeUncommitted(proxy, uncommittedCopy, true);
        APP.$commit.hide();
        change();
    });

    // #publish button is removed in readonly
    APP.$publish = $('#publish')
        .click(function () {
            publish(true);
        });

    APP.$admin = $('#admin')
        .click(function () {
            publish(false);
        });

    APP.$help = $('#help')
        .click(function () {
            showHelp();
        });

    // Title
    if (APP.proxy.info.defaultTitle) {
        Title.updateDefaultTitle(APP.proxy.info.defaultTitle);
    } else {
        APP.proxy.info.defaultTitle = Title.defaultTitle;
    }
    if (Cryptpad.initialName && !APP.proxy.info.title) {
        APP.proxy.info.title = Cryptpad.initialName;
        Title.updateTitle(Cryptpad.initialName);
    } else {
        Title.updateTitle(APP.proxy.info.title || Title.defaultTitle);
    }

    // Description
    var resize = function () {
        var lineCount = $description.val().split('\n').length;
        $description.css('height', lineCount + 'rem');
    };
    $description.on('change keyup', function () {
        var val = $description.val();
        proxy.info.description = val;
        resize();
    });
    resize();
    if (typeof(proxy.info.description) !== 'undefined') {
        $description.val(proxy.info.description);
    }

    $('#tableScroll').html('').prepend($table);
    updateDisplayedTable();

    $table
        .click(handleClick)
        .on('keyup', function (e) { handleClick(e, true); });

    $(window).click(function(e) {
        if (e.which !== 1) { return; }
        hideInputs();
    });

    proxy
        .on('change', ['info'], function (o, n, p) {
            if (p[1] === 'title') {
                Title.updateTitle(n);
                Cryptpad.notify();
            } else if (p[1] === "userData") {
                UserList.addToUserData(APP.proxy.info.userData);
            } else if (p[1] === 'description') {
                var op = TextPatcher.diff(o, n);
                var el = $description[0];

                var selects = ['selectionStart', 'selectionEnd'].map(function (attr) {
                    return TextPatcher.transformCursor(el[attr], op);
                });
                $description.val(n);
                if (op) {
                    el.selectionStart = selects[0];
                    el.selectionEnd = selects[1];
                }
                Cryptpad.notify();
            }

            debug("change: (%s, %s, [%s])", o, n, p.join(', '));
        })
        .on('change', ['table'], change)
        .on('remove', [], change);

    UserList.addToUserData(APP.proxy.info.userData);

    APP.ready = true;
    if (!proxy.published) {
        publish(false);
    } else {
        publish(true);
    }
    Cryptpad.removeLoadingScreen();

    if (readOnly) { return; }
    UserList.getLastName(APP.toolbar.$userNameButton, isNew);
};

var setEditable = function (editable) {
    APP.locked = !editable;

    if (editable === false) {
        // disable all the things
        $('.realtime input, .realtime button, .upper button, .realtime textarea').attr('disabled', APP.locked);
        $('span.edit, span.remove').hide();
        $('span.lock').addClass('fa-lock').removeClass('fa-unlock')
            .attr('title', Messages.poll_locked)
            .css({'cursor': 'default'});
    } else {
        // enable
        $('span.edit, span.remove').show();
        $('span.lock').css({'cursor': ''});
        $('.realtime button, .upper button, .realtime textarea').attr('disabled', APP.locked);
        unlockElements();
    }
};

var disconnect = function () {
    setEditable(false);
    APP.toolbar.failed();
    Cryptpad.alert(Messages.common_connectionLost, undefined, true);
};

var reconnect = function (info) {
    setEditable(true);
    APP.toolbar.reconnecting(info.myId);
    Cryptpad.findOKButton().click();
};

var create = function (info) {
    APP.myID = info.myID;

    var editHash;
    if (!readOnly) {
        editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
    }

    if (APP.realtime !== info.realtime) {
        APP.realtime = info.realtime;
        APP.patchText = TextPatcher.create({
            realtime: info.realtime,
            logging: true,
        });
    }

    var onLocal = function () {
        APP.proxy.info.userData = UserList.userData;
    };
    UserList = Cryptpad.createUserList(info, onLocal, Cryptget, Cryptpad);

    var onLocalTitle = function () {
        APP.proxy.info.title = Title.isDefaultTitle() ? "" : Title.title;
    };
    Title = Cryptpad.createTitle({}, onLocalTitle, Cryptpad);

    var configTb = {
        displayed: ['title', 'useradmin', 'spinner', 'lag', 'state', 'share', 'userlist', 'newpad', 'limit', 'upgrade'],
        userList: UserList.getToolbarConfig(),
        share: {
            secret: secret,
            channel: info.channel
        },
        title: Title.getTitleConfig(),
        common: Cryptpad,
        readOnly: readOnly,
        ifrw: window,
        realtime: info.realtime,
        network: info.network,
        $container: APP.$bar
    };
    APP.toolbar = Toolbar.create(configTb);

    Title.setToolbar(APP.toolbar);

    var $rightside = APP.toolbar.$rightside;

    /* add a forget button */
    var forgetCb = function (err) {
        if (err) { return; }
        setEditable(false);
    };
    var $forgetPad = Cryptpad.createButton('forget', true, {}, forgetCb);
    $rightside.append($forgetPad);

    // set the hash
    if (!readOnly) { Cryptpad.replaceHash(editHash); }

    /* save as template */
    if (!Cryptpad.isTemplate(window.location.href)) {
        var templateObj = {
            rt: info.realtime,
            Crypt: Cryptget,
            getTitle: function () { return document.title; }
        };
        var $templateButton = Cryptpad.createButton('template', true, templateObj);
        $rightside.append($templateButton);
    }
};

    // don't initialize until the store is ready.
    Cryptpad.ready(function () {
        Cryptpad.reportAppUsage();
        var config = {
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: secret.channel,
            readOnly: readOnly,
            data: {},
            // our public key
            validateKey: secret.keys.validateKey || undefined,
            //readOnly: readOnly,
            crypto: Crypto.createEncryptor(secret.keys),
            userName: 'poll',
            network: Cryptpad.getNetwork()
        };

        if (readOnly) {
            $('#commit, #create-user, #create-option, #publish, #admin').remove();
        }

        var parsedHash = Cryptpad.parsePadUrl(window.location.href);
        defaultName = Cryptpad.getDefaultName(parsedHash);
        var rt = window.rt = APP.rt = Listmap.create(config);
        APP.proxy = rt.proxy;
        rt.proxy
        .on('create', create)
        .on('ready', function (info) {
            Cryptpad.getPadAttribute('userid', function (e, userid) {
                if (e) { console.error(e); }
                if (!userid) { userid = Render.coluid(); }
                APP.userid = userid;
                Cryptpad.setPadAttribute('userid', userid, function (e) {
                    if (e) { console.error(e); }
                    ready(info, userid, readOnly);
                });
            });
        })
        .on('disconnect', disconnect)
        .on('reconnect', reconnect);

        Cryptpad.getAttribute(HIDE_INTRODUCTION_TEXT, function (e, value) {
            if (e) { console.error(e); }
            if (!value) {
                Cryptpad.setAttribute(HIDE_INTRODUCTION_TEXT, "1", function (e) {
                    if (e) { console.error(e); }
                });
                showHelp(true);
            } else {
                showHelp(false);
            }
        });

        Cryptpad.onLogout(function () { setEditable(false); });
    });
    Cryptpad.onError(function (info) {
        if (info) {
            onConnectError();
        }
    });

    });
});
