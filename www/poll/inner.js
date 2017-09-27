define([
    'jquery',
    '/bower_components/textpatcher/TextPatcher.js',
    '/common/toolbar3.js',
    'json.sortify',
    '/common/cryptpad-common.js',
    '/common/common-util.js',
    '/common/cryptget.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-realtime.js',
    '/customize/application_config.js',
    '/common/sframe-chainpad-listmap.js',
    '/customize/pages.js',
    '/poll/render.js',

    '/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    TextPatcher,
    Toolbar,
    JSONSortify,
    Cryptpad,
    Util,
    Cryptget,
    nThen,
    SFCommon,
    CommonRealtime,
    AppConfig,
    Listmap,
    Pages,
    Renderer)
{
    var Messages = Cryptpad.Messages;

    var Render = Renderer(Cryptpad);
    var APP = window.APP = {
        Render: Render,
        unlocked: {
            row: [],
            col: []
        },
        readOnly: false,
        Cryptpad: Cryptpad,
        mobile: function () { return $('body').width() <= 600; } // Menu and content area are not inline-block anymore for mobiles
    };

    var debug = $.noop; //console.log;

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var HIDE_INTRODUCTION_TEXT = "hide-text";

    var metadataMgr;
    var Title;
    var defaultName;
    var common;
    var readOnly;















    var sortColumns = function (order, firstcol) {
        var colsOrder = order.slice();
        colsOrder.sort(function (a, b) {
            return (a === firstcol) ? -1 :
                        ((b === firstcol) ? 1 : 0);
        });
        return colsOrder;
    };

    var isOwnColumnCommitted = function () {
        return APP.proxy && APP.proxy.content.colsOrder.indexOf(APP.userid) !== -1;
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
        /*if (isOwnColumnCommitted()) {
            return newObj;
        }*/

        // Merge uncommitted into the proxy
        uncommitted.content.colsOrder = uncommitted.content.colsOrder || [];
        uncommitted.content.colsOrder.forEach(function (x) {
            if (newObj.content.colsOrder.indexOf(x) !== -1) { return; }
            newObj.content.colsOrder.push(x);
        });
        for (var k in uncommitted.content.cols) {
            if (!newObj.content.cols[k]) {
                newObj.content.cols[k] = uncommitted.content.cols[k];
            }
        }
        for (var l in uncommitted.content.cells) {
            if (!newObj.content.cells[l]) {
                newObj.content.cells[l] = uncommitted.content.cells[l];
            }
        }
        // Uncommitted rows
        uncommitted.content.rowsOrder = uncommitted.content.rowsOrder || [];
        uncommitted.content.rowsOrder.forEach(function (x) {
            if (newObj.content.rowsOrder.indexOf(x) !== -1) { return; }
            newObj.content.rowsOrder.push(x);
        });
        for (var k in uncommitted.content.rows) {
            if (!newObj.content.rows[k]) {
                newObj.content.rows[k] = uncommitted.content.rows[k];
            }
        }

        if (commit) {
            APP.uncommited = {};
            prepareProxy(APP.uncommitted, copyObject(Render.Example));
        }
        return newObj;
    };

    var styleUncommittedColumn = function () {
        var id = APP.userid;

        // TODO: move?
        // Enable input for the userid column
        $('input[disabled="disabled"][data-rt-id^="' + id + '"]').removeAttr('disabled');
        $('input[type="number"][data-rt-id^="' + id + '"]').addClass('enabled');
        $('.cp-app-poll-table-lock[data-rt-id="' + id + '"]').addClass('fa-unlock').removeClass('fa-lock').attr('title', Messages.poll_unlocked);

        APP.uncommitted.content.colsOrder.forEach(function(id) {
            // Enable the checkboxes for the uncommitted column
            $('input[disabled="disabled"][data-rt-id^="' + id + '"]').removeAttr('disabled');
            $('input[type="number"][data-rt-id^="' + id + '"]').addClass('enabled');
            $('.cp-app-poll-table-lock[data-rt-id="' + id + '"]').addClass('fa-unlock').removeClass('fa-lock').attr('title', Messages.poll_unlocked);

            $('[data-rt-id^="' + id + '"]').closest('td').addClass("cp-app-poll-table-uncommitted");
            $('td.cp-app-poll-table-uncommitted .cover').addClass("cp-app-poll-table-uncommitted");
        });
        APP.uncommitted.content.rowsOrder.forEach(function(id) {
            // Enable the checkboxes for the uncommitted column
            $('input[disabled="disabled"][data-rt-id="' + id + '"]').removeAttr('disabled');

            $('[data-rt-id="' + id + '"]').closest('tr').addClass("cp-app-poll-table-uncommitted");
            //$('td.uncommitted .cover').addClass("uncommitted");
            //$('.uncommitted input[type="text"]').attr("placeholder", Messages.poll_userPlaceholder);
        });
    };

    var unlockElements = function () {
        APP.unlocked.row.forEach(function (id) {
            var $input = $('input[type="text"][disabled="disabled"][data-rt-id="' + id + '"]').removeAttr('disabled');
            $input.parent().parent().addClass('cp-app-poll-table-editing');
            $('span.cp-app-poll-table-edit[data-rt-id="' + id + '"]').css('visibility', 'hidden');
        });
        APP.unlocked.col.forEach(function (id) {
            var $input = $('input[disabled="disabled"][data-rt-id^="' + id + '"]')
                .removeAttr('disabled');
            $input.parent().addClass('cp-app-poll-table-editing');
            $('input[type="number"][data-rt-id^="' + id + '"]').addClass('enabled');
            $('.cp-app-poll-table-lock[data-rt-id="' + id + '"]').addClass('fa-unlock')
                .removeClass('fa-lock').attr('title', Messages.poll_unlocked);
        });
    };

    var updateTableButtons = function () {
        var $createOption = APP.$table.find('tfoot tr td:first-child');
        $createOption.append(APP.$createRow);

        $('#cp-app-poll-create-user, #cp-app-poll-create-option').css('display', 'inline-flex');
        if (!APP.proxy ||
            !APP.proxy.content.rowsOrder ||
            APP.proxy.content.rowsOrder.length === 0) {
            //$('#create-user').hide();
        }
        var width = $('#cp-app-poll-table').outerWidth();
        if (width) {
            //$('#create-user').css('left', width + 30 + 'px');
        }
    };

    var setTablePublished = function (bool) {
        if (bool) {
            if (APP.$publish) { APP.$publish.hide(); }
            if (APP.$admin) { APP.$admin.show(); }
            $('#cp-app-poll-create-option').hide();
            $('.cp-app-poll-table-remove[data-rt-id^="y"], .cp-app-poll-table-edit[data-rt-id^="y"]').hide();
        } else {
            if (APP.$publish) { APP.$publish.show(); }
            if (APP.$admin) { APP.$admin.hide(); }
            $('#cp-app-poll-create-option').show();
            $('.cp-app-poll-table-remove[data-rt-id^="y"], .cp-app-poll-table-edit[data-rt-id^="y"]').show();
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
        if (APP.unlocked.col.indexOf(id) === -1) {
            APP.unlocked.col.push(id);
        }
        if (typeof(cb) === "function") {
            cb();
        }
    };
    var unlockRow = function (id, cb) {
        if (APP.unlocked.row.indexOf(id) === -1) {
            APP.unlocked.row.push(id);
        }
        if (typeof(cb) === "function") {
            cb();
        }
    };
    var lockColumn = function (id, cb) {
        var idx = APP.unlocked.col.indexOf(id);
        if (idx !== -1) {
            APP.unlocked.col.splice(idx, 1);
        }
        if (typeof(cb) === "function") {
            cb();
        }
    };
    var lockRow = function (id, cb) {
        var idx = APP.unlocked.row.indexOf(id);
        if (idx !== -1) {
            APP.unlocked.row.splice(idx, 1);
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

        var colsOrder = sortColumns(displayedObj.content.colsOrder, APP.userid);
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
        common.notify();

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
            APP.proxy.content.rowsOrder.forEach(function (rowId) {
                $('input[data-rt-id="' + rowId +'"]').val(APP.proxy.content.rows[rowId] || '');
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
        if (type !== "row" && x === APP.userid && APP.proxy.content.colsOrder.indexOf(x) === -1) {
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
                if (APP.unlocked.col.indexOf(x) >= 0 || x === APP.userid) {
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

    var hideInputs = function (id) {
        if (APP.readOnly) { return; }
        console.log(id);
        if (id) {
            var type = Render.typeofId(id);
            console.log(type);
            if (type === 'col') { return void lockColumn(id, change); }
            if (type === 'row') { return void lockRow(id, change); }
            return;
        }
        APP.unlocked.col = Cryptpad.deduplicateString([APP.userid].concat(APP.uncommitted.content.colsOrder).slice());
        APP.unlocked.row = APP.uncommitted.content.rowsOrder.slice();
        change();
    };

    /*  Called whenever an event is fired on a span */
    var handleSpan = function (span) {
        var id = span.getAttribute('data-rt-id');
        var type = Render.typeofId(id);
        var isRemove = span.className && span.className.split(' ')
            .indexOf('cp-app-poll-table-remove') !== -1;
        var isEdit = span.className && span.className.split(' ')
            .indexOf('cp-app-poll-table-edit') !== -1;
        var isLock = span.className && span.className.split(' ')
            .indexOf('cp-app-poll-table-lock') !== -1;
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
                //hideInputs(span);
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
                //hideInputs(span);
                unlockColumn(id, function () {
                    change(null, null, null, null, function() {
                        $('input[data-rt-id="' + id + '"]').focus();
                    });
                });
            } else if (isLock) {
                lockColumn(id, function () {
                    change(null, null, null, null, function() {
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
        if (APP.readOnly) { return; }

        e.stopPropagation();

        if (!APP.ready) { return; }
        if (!isKeyup && e.which !== 1) { return; } // only allow left clicks

        var target = e && e.target;

        if (!target) { return void debug("NO TARGET"); }

        var nodeName = target && target.nodeName;
        //var shouldLock = $(target).hasClass('fa-unlock');

        if ((!$(target).parents('#cp-app-poll-table tbody').length &&
            $(target).hasClass('cp-app-poll-table-lock'))) {
            //hideInputs(e);
        }

        switch (nodeName) {
            case 'INPUT':
                if (isKeyup && (e.keyCode === 13 || e.keyCode === 27)) {
                    var id = target.getAttribute('data-rt-id');
                    hideInputs(id);
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
                /*if (shouldLock) {
                    break;
                }*/
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

        proxy.metadata = proxy.metadata || schema.metadata;
        Object.keys(schema.metadata).forEach(function (k) {
            if (!proxy.metadata[k]) { proxy.metadata[k] = schema.metadata[k]; }
        });

        proxy.content = proxy.content || schema.content;
        Object.keys(schema.content).forEach(function (k) {
            if (!proxy.content[k]) { proxy.content[k] = schema.content[k]; }
        });

        proxy.version = 1;
        proxy.type = 'poll';
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
        if (typeof help === 'undefined') {
            help = !$('#cp-app-poll-help').is(':visible');
        }

        var msg = (help ? Messages.poll_hide_help_button : Messages.poll_show_help_button);

        $('#cp-app-poll-help').toggle(help);
        $('#cp-app-poll-action-help').text(msg);
    };

    var copyObject = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };















    var setEditable = function (editable) {
        APP.readOnly = !editable;

        if (editable === false) {
            // disable all the things
            $('.icp-app-poll-realtime input, .cp-app-poll-realtime button, .cp-app-poll-upper button, .cp-app-poll-realtime textarea').attr('disabled', true);
            $('span.cp-app-poll-table-edit, span.cp-app-poll-table-remove').hide();
            $('span.cp-app-poll-table-lock').addClass('fa-lock').removeClass('fa-unlock')
                .attr('title', Messages.poll_locked)
                .css({'cursor': 'default'});
        } else {
            // enable
            $('span.cp-app-poll-table-edit, span.cp-app-poll-table-remove').show();
            $('span.cp-app-poll-table-lock').css({'cursor': ''});
            $('.cp-app-poll-realtime button, .cp-app-poll-upper button, .cp-app-poll-realtime textarea').attr('disabled', false);
            unlockElements();
        }
    };

    var updateDescription = function (n) {
        var o = APP.$description.val();
        var op = TextPatcher.diff(o, n);
        var el = APP.$description[0];

        var selects = ['selectionStart', 'selectionEnd'].map(function (attr) {
            return TextPatcher.transformCursor(el[attr], op);
        });
        APP.$description.val(n);
        if (op) {
            el.selectionStart = selects[0];
            el.selectionEnd = selects[1];
        }
        common.notify();
    };
    var updateLocalDescription = function (n) {
        var md = copyObject(metadataMgr.getMetadata());
        md.description = n;
        metadataMgr.updateMetadata(md);
        APP.proxy.metadata.description = n;
    };

    var onReady = function (info, userid, readOnly) {
        var proxy = APP.proxy;

        var isNew = false;
        var userDoc = JSON.stringify(proxy);
        if (userDoc === "" || userDoc === "{}") { isNew = true; }

        if (!isNew) {
            if (proxy.info) {
                // Migration??
                proxy.metadata = proxy.info;
                delete proxy.info;
            }
            if (proxy.table) {
                // Migration??
                proxy.content = proxy.table;
                delete proxy.table;
            }
            if (proxy && proxy.metadata) {
                metadataMgr.updateMetadata(proxy.metadata);
            }
            if (typeof (proxy) !== 'object' || Array.isArray(proxy) ||
                (proxy.metadata && typeof(proxy.metadata.type) !== 'undefined' &&
                 proxy.metadata.type !== 'poll')) {
                var errorText = Messages.typeError;
                Cryptpad.errorLoadingScreen(errorText);
                throw new Error(errorText);
            }
        } else {
            //Title.updateTitle(Title.defaultTitle);
        }

        if (typeof(proxy.type) === 'undefined') {
            proxy.type = 'poll';
        }

        // Add uncommitted and unlock uncommited & own column
        var uncommitted = APP.uncommitted = {};
        prepareProxy(proxy, copyObject(Render.Example));
        prepareProxy(uncommitted, copyObject(Render.Example));
        if (!readOnly) {
            var coluid = Render.coluid();
            if (proxy.content.colsOrder.indexOf(userid) === -1 &&
                uncommitted.content.colsOrder.indexOf(userid) === -1) {
                // The user doesn't have his own column: the new one should be his
                coluid = userid;
            } else {
                // The user already has his own column: unlock it
                unlockColumn(userid);
            }
            uncommitted.content.colsOrder.push(coluid);
            unlockColumn(coluid);

            var rowuid = Render.rowuid();
            uncommitted.content.rowsOrder.push(rowuid);
            unlockRow(coluid);
        }

        var displayedObj = mergeUncommitted(proxy, uncommitted, false);

        var colsOrder = sortColumns(displayedObj.content.colsOrder, userid);

        var $table = APP.$table = $(Render.asHTML(displayedObj, null, colsOrder, readOnly));

        var getUncommitted = function (type) {
            var ret = {};
            var uncommitted = APP.uncommitted.content;
            if (type === 'col') {
                ret.colsOrder = uncommitted.colsOrder.slice();
                ret.cols = copyObject(uncommitted.cols);
                // get only the cells corresponding to the committed rows
                var toRemove = Object.keys(uncommitted.cells).filter(function (coor) {
                    var c = Render.getCoordinates(coor);
                    return APP.proxy.content.rowsOrder.indexOf(c[1]) !== -1;
                });
                ret.cells = {};
                toRemove.forEach(function (k) {
                    ret.cells[k] = uncommitted.cells[k];
                    delete uncommitted.cells[k];
                });
                uncommitted.colsOrder = [Render.coluid()];
                uncommitted.cols = {};
                return ret;
            }

            // Row
            ret.rowsOrder = uncommitted.rowsOrder.slice();
            ret.rows = copyObject(uncommitted.rows);
            // get only the cells corresponding to the committed rows
            var toRemove = Object.keys(uncommitted.cells).filter(function (coor) {
                var c = Render.getCoordinates(coor);
                return APP.proxy.content.colsOrder.indexOf(c[1]) !== -1;
            });
            ret.cells = {};
            toRemove.forEach(function (k) {
                ret.cells[k] = uncommitted.cells[k];
                delete uncommitted.cells[k];
            });
            uncommitted.rowsOrder = [Render.rowuid()];
            uncommitted.rows = {};
            return ret;
        };
        APP.$createCol = $('#cp-app-poll-create-user').click(function () {
            var uncommittedCopy = { content: getUncommitted('col') };
            var id = uncommittedCopy.content.colsOrder[0];
            mergeUncommitted(proxy, uncommittedCopy, true);
            change(null, null, null, null, function() {
                handleSpan($('.cp-app-poll-table-lock[data-rt-id="' + id + '"]')[0]);
            });
        });
        APP.$createRow = $('#cp-app-poll-create-option').click(function () {
            var uncommittedCopy = { content: getUncommitted('row') };
            var id = uncommittedCopy.content.rowsOrder[0];
            mergeUncommitted(proxy, uncommittedCopy, true);
            change(null, null, null, null, function() {
                handleSpan($('.cp-app-poll-table-edit[data-rt-id="' + id + '"]')[0]);
            });
        });

        // Commit button
        APP.$commit = $('#commit').click(function () {
            var uncommittedCopy = copyObject(APP.uncommitted);
            APP.uncommitted = {};
            prepareProxy(APP.uncommitted, copyObject(Render.Example));
            mergeUncommitted(proxy, uncommittedCopy, true);
            APP.$commit.hide();
            change();
        }).remove(); // TODO

        // #publish button is removed in readonly
        APP.$publish = $('#cp-app-poll-action-publish')
            .click(function () {
                publish(true);
            });

        APP.$admin = $('#cp-app-poll-action-admin')
            .click(function () {
                publish(false);
            });

        APP.$help = $('#cp-app-poll-action-help')
            .click(function () {
                showHelp();
            });

        if (!readOnly) {
            common.setPadAttribute('userid', userid, function (e) {
                if (e) { console.error(e); }
            });
        }

        // Description
        var resize = function () {
            var lineCount = APP.$description.val().split('\n').length;
            APP.$description.css('height', lineCount + 'rem');
        };
        APP.$description.on('change keyup', function () {
            var val = APP.$description.val();
            updateLocalDescription(val);
            resize();
        });
        resize();

        $('#cp-app-poll-table-scroll').html('').prepend($table);
        updateDisplayedTable();

        $table
            .click(handleClick)
            .on('keyup', function (e) { handleClick(e, true); });

        $(window).click(function(e) {
            if (e.which !== 1) { return; }
            hideInputs();
        });

        proxy
            .on('change', ['metadata'], function (o, n, p) {
                metadataMgr.updateMetadata(proxy.metadata);
            })
            .on('change', ['content'], change)
            .on('remove', [], change);

        // If the user's column is not committed, add his username
        var $userInput = $('.cp-app-poll-table-uncommitted > input[data-rt-id^='+ APP.userid +']');
        if ($userInput.val() === '') {
            $userInput.val(metadataMgr.getUserData().name);
        }

        APP.ready = true;
        if (!proxy.published) {
            publish(false);
        } else {
            publish(true);
        }

        Cryptpad.removeLoadingScreen();
    };

    var onDisconnect = function () {
        setEditable(false);
        // TODO toolar.failed?
        APP.toolbar.failed();
        Cryptpad.alert(Messages.common_connectionLost, undefined, true);
    };

    var onReconnect = function (info) {
        setEditable(true);
        // TODO: reconnecting??
        APP.toolbar.reconnecting(info.myId);
        Cryptpad.findOKButton().click();
    };

    var onCreate = function (info) {
        APP.myID = info.myID;

        if (APP.realtime !== info.realtime) {
            APP.realtime = info.realtime;
            APP.patchText = TextPatcher.create({
                realtime: info.realtime,
                logging: true,
            });
        }

        metadataMgr = common.getMetadataMgr();

        Title = common.createTitle();

        var configTb = {
            displayed: ['title', 'useradmin', 'spinner', 'share', 'userlist', 'newpad', 'limit'],
            title: Title.getTitleConfig(),
            metadataMgr: metadataMgr,
            readOnly: readOnly,
            realtime: info.realtime,
            common: Cryptpad,
            sfCommon: common,
            $container: APP.$bar,
            $contentContainer: APP.$content
        };
        var toolbar = APP.toolbar = Toolbar.create(configTb);

        Title.setToolbar(APP.toolbar);

        var $rightside = APP.toolbar.$rightside;

        metadataMgr.onChange(function () {
            var md = copyObject(metadataMgr.getMetadata());
            if (md.description) {
                updateDescription(md.description);
            }
            APP.proxy.metadata = md;
        });
        return; // TODO




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


    var main = function () {

        nThen(function (waitFor) {
            $(waitFor(function () {
                Cryptpad.addLoadingScreen();
                var $div = $('<div>').append(Pages['/poll/']());
                $('body').append($div.html());
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (waitFor) {
            var privReady = Util.once(waitFor());
            var metadataMgr = common.getMetadataMgr();
            if (JSON.stringify(metadataMgr.getPrivateData()) !== '{}') {
                privReady();
                return;
            }
            metadataMgr.onChange(function () {
                if (typeof(metadataMgr.getPrivateData().readOnly) === 'boolean') {
                    readOnly = metadataMgr.getPrivateData().readOnly;
                    privReady();
                }
            });
        }).nThen(function (/* waitFor */) {
            APP.loggedIn = common.isLoggedIn();
            APP.SFCommon = common;

            APP.$body = $('body');
            APP.$bar = $('#cp-toolbar');
            APP.$content = $('#cp-app-poll-content');
            APP.$description = $('#cp-app-poll-description')
                .attr('placeholder', Messages.poll_descriptionHint || 'description');

            var listmapConfig = {
                data: {},
                common: common,
                logLevel: 1
            };

            if (readOnly) {
                $('#cp-app-poll-create-user, #cp-app-poll-create-option, #cp-app-poll-action-publish, #cp-app-poll-action-admin').remove();
            }

            var metadataMgr;
            var rt = APP.rt = Listmap.create(listmapConfig);
            APP.proxy = rt.proxy;

            rt.proxy.on('create', onCreate)
                 .on('ready', function (info) {
                    common.getPadAttribute('userid', function (e, userid) {
                        if (e) { console.error(e); }
                        if (!userid) { userid = Render.coluid(); }
                        APP.userid = userid;
                        onReady(info, userid, readOnly);
                    });
                 })
                 .on('disconnect', onDisconnect)
                 .on('reconnect', onReconnect);

            common.getAttribute(['poll', HIDE_INTRODUCTION_TEXT], function (e, value) {
                if (e) { console.error(e); }
                if (!value) {
                    common.setAttribute(['poll', HIDE_INTRODUCTION_TEXT], "1", function (e) {
                        if (e) { console.error(e); }
                    });
                    showHelp(true);
                } else {
                    showHelp(false);
                }
            });

            /*Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });*/
            //Cryptpad.onLogout(function () { setEditable(false); });
        });
    };
    main();
});
