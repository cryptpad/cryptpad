define([
    'jquery',
    '/bower_components/textpatcher/TextPatcher.js',
    '/common/toolbar3.js',
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
    '/common/diffMarked.js',
    '/common/sframe-common-codemirror.js',

    'cm/lib/codemirror',
    'cm/mode/markdown/markdown',
    'css!cm/lib/codemirror.css',

    '/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    TextPatcher,
    Toolbar,
    Cryptpad,
    Util,
    Cryptget,
    nThen,
    SFCommon,
    CommonRealtime,
    AppConfig,
    Listmap,
    Pages,
    Renderer,
    DiffMd,
    SframeCM,
    CMeditor)
{
    var Messages = Cryptpad.Messages;
    var saveAs = window.saveAs;

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

    var HIDE_INTRODUCTION_TEXT = "hide-text";

    var metadataMgr;
    var Title;
    var common;

    var copyObject = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    var getCSV = APP.getCSV = function () {
        if (!APP.proxy) { return; }
        var data = copyObject(APP.proxy.content);
        var res = '';

        var escapeStr = function (str) {
            return '"' + str.replace(/"/g, '""') + '"';
        };

        [null].concat(data.rowsOrder).forEach(function (rowId, i) {
            [null].concat(data.colsOrder).forEach(function (colId, j) {
                // thead
                if (i === 0) {
                    if (j === 0) { res += ','; return; }
                    if (!colId) { throw new Error("Invalid data"); }
                    res += escapeStr(data.cols[colId] || Messages.anonymous) + ',';
                    return;
                }
                // tbody
                if (!rowId) { throw new Error("Invalid data"); }
                if (j === 0) {
                    res += escapeStr(data.rows[rowId] || Messages.poll_optionPlaceholder) + ',';
                    return;
                }
                if (!colId) { throw new Error("Invalid data"); }
                res += (data.cells[colId + '_' + rowId] || 3) + ',';
            });
            // last column: total
            // thead
            if (i === 0) {
                res += escapeStr(Messages.poll_total) + '\n';
                return;
            }
            // tbody
            if (!rowId) { throw new Error("Invalid data"); }
            res += APP.count[rowId] || '?';
            res += '\n';
        });

        return res;
    };
    var exportFile = function () {
        var csv = getCSV();
        var suggestion = Title.suggestTitle(Title.defaultTitle);
        Cryptpad.prompt(Messages.exportPrompt,
            Cryptpad.fixFileName(suggestion) + '.csv', function (filename) {
            if (!(typeof(filename) === 'string' && filename)) { return; }
            var blob = new Blob([csv], {type: "application/csv;charset=utf-8"});
            saveAs(blob, filename);
        });
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
        Set the user id (user column) in the pad attributes
    */
    var setUserId = function (id, cb) {
        cb = cb || $.noop;
        APP.userid = id;
        common.setPadAttribute('userid', id, function (e) {
            if (e) {
                console.error(e);
                return void cb(e);
            }
            cb();
        });
    };

    var sortColumns = function (order, firstcol) {
        var colsOrder = order.slice();
        // Never put at the first position an uncommitted column
        if (APP.proxy.content.colsOrder.indexOf(firstcol) === -1) { return colsOrder; }
        colsOrder.sort(function (a, b) {
            return (a === firstcol) ? -1 :
                        ((b === firstcol) ? 1 : 0);
        });
        return colsOrder;
    };

    var isUncommitted = function (id) {
        var idArr = id.split('_');
        var idx = idArr[0];
        var idy = idArr[1] || idArr[0]; // if id is y-{...} (no 'x'), use idArr[0] as 'y' coordinate
        return APP.uncommitted.content.colsOrder.indexOf(idx) !== -1 ||
               APP.uncommitted.content.rowsOrder.indexOf(idy) !== -1;
    };

    var mergeUncommitted = function (proxy, uncommitted, commit) {
        var newObj;
        if (commit) {
            newObj = proxy;
        } else {
            newObj = $.extend(true, {}, proxy);
        }

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
        for (var m in uncommitted.content.rows) {
            if (!newObj.content.rows[m]) {
                newObj.content.rows[m] = uncommitted.content.rows[m];
            }
        }

        if (commit) {
            APP.uncommited = {};
            prepareProxy(APP.uncommitted, copyObject(Render.Example));
        }
        return newObj;
    };

    var styleUserColumn = function () {
        var userid = APP.userid;
        if (!userid) { return; }

        // Enable input for the userid column
        $('input[disabled="disabled"][data-rt-id^="' + userid + '"]').removeAttr('disabled')
            .attr('placeholder', Messages.poll_userPlaceholder);
        $('input[type="number"][data-rt-id^="' + userid + '"]').addClass('enabled');
        $('.cp-app-poll-table-lock[data-rt-id="' + userid + '"]').remove();
        $('[data-rt-id^="' + userid + '"]').closest('td')
            .addClass("cp-app-poll-table-own");
        $('.cp-app-poll-table-bookmark[data-rt-id="' + userid + '"]').css('visibility', '')
            .addClass('cp-app-poll-table-bookmark-full')
            .attr('title', Messages.poll_bookmarked_col);
    };
    var styleUncommittedColumn = function () {
        var $scroll = $('#cp-app-poll-table-scroll');
        var hasScroll = $scroll.width() < $scroll[0].scrollWidth;
        APP.uncommitted.content.colsOrder.forEach(function(id) {
            // Enable the checkboxes for the uncommitted column
            $('input[disabled="disabled"][data-rt-id^="' + id + '"]').removeAttr('disabled');
            $('input[type="number"][data-rt-id^="' + id + '"]').addClass('enabled');
            $('.cp-app-poll-table-lock[data-rt-id="' + id + '"]').remove();
            //.addClass('fa-unlock').removeClass('fa-lock').attr('title', Messages.poll_unlocked);
            $('.cp-app-poll-table-remove[data-rt-id="' + id + '"]').remove();
            $('.cp-app-poll-table-bookmark[data-rt-id="' + id + '"]').remove();

            $('td.cp-app-poll-table-uncommitted .cover').addClass("cp-app-poll-table-uncommitted");
            var $uncommittedCol = $('[data-rt-id^="' + id + '"]').closest('td');
            $uncommittedCol.addClass("cp-app-poll-table-uncommitted");

            if (hasScroll) {
                $uncommittedCol.css('right', '100px');
            }
        });
        APP.uncommitted.content.rowsOrder.forEach(function(id) {
            // Enable the checkboxes for the uncommitted column
            $('input[disabled="disabled"][data-rt-id="' + id + '"]').removeAttr('disabled');
            $('.cp-app-poll-table-edit[data-rt-id="' + id + '"]').remove();
            $('.cp-app-poll-table-remove[data-rt-id="' + id + '"]').remove();

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
        var uncomColId = APP.uncommitted.content.colsOrder[0];
        var uncomRowId = APP.uncommitted.content.rowsOrder[0];
        var $createOption = APP.$table.find('tbody input[data-rt-id="' + uncomRowId+'"]')
                                .closest('td').find('> div');
        $createOption.append(APP.$createRow);
        var $createUser = APP.$table.find('thead input[data-rt-id="' + uncomColId + '"]')
                                .closest('td');
        $createUser.prepend(APP.$createCol);

        if (APP.proxy.content.colsOrder.indexOf(APP.userid) === -1) {
            APP.$table.find('.cp-app-poll-table-bookmark').css('visibility', '');
        }

        //$('#cp-app-poll-create-user, #cp-app-poll-create-option').css('display', 'inline-flex');
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
            $('#cp-app-poll-form').addClass('cp-app-poll-published');
        } else {
            if (APP.$publish) { APP.$publish.show(); }
            if (APP.$admin) { APP.$admin.hide(); }
            $('#cp-app-poll-form').removeClass('cp-app-poll-published');
        }
    };
    var addCount = function () {
        var $scroll = $('#cp-app-poll-table-scroll');
        var hasScroll = $scroll.width() < $scroll[0].scrollWidth;
        var $countCol = $('tr td:last-child');
        if (hasScroll) {
            $countCol.css('right', '0');
        }
        var $thead = APP.$table.find('thead');
        var $tr = APP.$table.find('tbody tr').first();
        $thead.find('tr td').last()
            .css({
                'height': $thead.height()+'px',
                'text-align': 'center',
                'line-height': $thead.height()+'px'
            })
            .text(Messages.poll_total);
        var winner = {
            v: 0,
            ids: []
        };
        APP.count = {};
        APP.proxy.content.rowsOrder.forEach(function (rId) {
            var count = Object.keys(APP.proxy.content.cells)
                .filter(function (k) {
                    return k.indexOf(rId) !== -1 && APP.proxy.content.cells[k] === 1;
                }).length;
            if (count > winner.v) {
                winner.v = count;
                winner.ids = [rId];
            } else if (count && count === winner.v) {
                winner.ids.push(rId);
            }
            APP.count[rId] = count;
            APP.$table.find('[data-rt-count-id="' + rId + '"]')
                .text(count)
                .css({
                    'height': $tr.height()+'px',
                    'line-height': $tr.height()+'px'
                });
        });
        winner.ids.forEach(function (rId) {
            $('[data-rt-id="' + rId + '"]').closest('td').addClass('cp-app-poll-table-winner');
            $('[data-rt-count-id="' + rId + '"]').addClass('cp-app-poll-table-winner');
        });
    };

    var updateDisplayedTable = function () {
        styleUserColumn();
        styleUncommittedColumn();
        unlockElements();
        updateTableButtons();
        setTablePublished(APP.proxy.published);
        addCount();
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
            readOnly: APP.readOnly
        };

        common.notify();

        var getFocus = function () {
            var active = document.activeElement;
            if (!active) { return; }
            return {
                el: active,
                id: $(active).attr('data-rt-id'),
                start: active.selectionStart,
                end: active.selectionEnd
            };
        };
        var setFocus = function (obj) {
            var el;
            if (document.body.contains(obj.el)) { el = obj.el; }
            else if($('input[data-rt-id="' + obj.id + '"]').length) {
                el = $('input[data-rt-id="' + obj.id + '"]')[0];
            }
            else { return; }
            el.focus();
            if (obj.start) { el.selectionStart = obj.start; }
            if (obj.end) { el.selectionEnd = obj.end; }
        };

        var updateTable = function () {
            var displayedObj2 = mergeUncommitted(APP.proxy, APP.uncommitted);
            var f = getFocus();
            APP.$createRow.detach();
            APP.$createCol.detach();
            Render.updateTable(table, displayedObj2, conf);
            // Fix autocomplete bug:
            displayedObj2.content.rowsOrder.forEach(function (rowId) {
                $('input[data-rt-id="' + rowId +'"]').val(displayedObj2.content.rows[rowId] || '');
            });
            displayedObj2.content.colsOrder.forEach(function (rowId) {
                $('input[data-rt-id="' + rowId +'"]')
                    .val(displayedObj2.content.cols[rowId] || '');
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

    var handleBookmark = function (id) {
        setUserId(id === APP.userid ? '' : id, change);
    };

    /*  Called whenever an event is fired on an input element */
    var handleInput = function (input) {
        var type = input.type.toLowerCase();
        var id = getRealtimeId(input);

        debug(input);

        var object = APP.proxy;

        var x = Render.getCoordinates(id)[0];
        if (isUncommitted(id)) { object = APP.uncommitted; }

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
        if (!span) { return; }
        var id = span.getAttribute('data-rt-id');
        var type = Render.typeofId(id);
        var isRemove = span.className && span.className.split(' ')
            .indexOf('cp-app-poll-table-remove') !== -1;
        var isEdit = span.className && span.className.split(' ')
            .indexOf('cp-app-poll-table-edit') !== -1;
        var isBookmark = span.className && span.className.split(' ')
            .indexOf('cp-app-poll-table-bookmark') !== -1;
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
                        if (id === APP.userid) { setUserId(''); }
                    });
                });
            } else if (isBookmark) {
                handleBookmark(id);
            } else if (isLock && isLocked) {
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

        switch (nodeName) {
            case 'INPUT':
                if (isKeyup && (e.keyCode === 13 || e.keyCode === 27)) {
                    var id = target.getAttribute('data-rt-id');
                    if ($(target).parents('.cp-app-poll-table-uncommitted').length
                        && e.keyCode === 13) {
                        var type = Render.typeofId(id);
                        if (type === "row") { APP.$createRow.click(); }
                        else if (type === "col") { APP.$createCol.click(); }
                        break;
                    }
                    hideInputs(id);
                    break;
                }
                if ($(target).is('input[type="number"]')) {
                    // Nothing to do...
                    //console.error("number input focused?");
                    break;
                }

                handleInput(target);
                break;
            case 'LABEL':
                var input = $('input[type="number"][id=' + $(target).attr('for') + ']');
                var value = parseInt(input.val());

                input.val((value + 1) % 4);

                handleInput(input[0]);
                break;
            case 'SPAN':
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

    */
    var updatePublishButton = function () {
        if (!APP.ready || !APP.proxy || !APP.$publishButton) { return; }
        var p = APP.proxy.published;
        var msg = (p ? Messages.poll_admin_button : Messages.poll_publish_button);
        APP.$publishButton.attr('title', msg);
        if (p) {
            APP.$publishButton.removeClass('fa-check').addClass('fa-pencil');
            return;
        }
        APP.$publishButton.addClass('fa-check').removeClass('fa-pencil');
    };
    var publish = APP.publish = function (bool) {
        if (!APP.readOnly) {
            if (!APP.ready) { return; }
            if (APP.proxy.published !== bool) {
                APP.proxy.published = bool;
            }
        } else {
            // If readOnly, always put the app in published mode
            bool = true;
        }
        setTablePublished(bool);
        /*['textarea'].forEach(function (sel) {
            $(sel).attr('disabled', bool);
        });*/
        updatePublishButton();
    };

    var updateHelpButton = function () {
        if (!APP.$helpButton) { return; }
        var help = $('#cp-app-poll-help').is(':visible');
        var msg = (help ? Messages.poll_hide_help_button : Messages.poll_show_help_button);
        APP.$helpButton.attr('title', msg);
        if (help) {
            APP.$helpButton.addClass('cp-toolbar-button-active');
            return;
        }
        APP.$helpButton.removeClass('cp-toolbar-button-active');
    };
    var showHelp = function(help) {
        if (typeof help === 'undefined') {
            help = !$('#cp-app-poll-help').is(':visible');
        }

        var msg = (help ? Messages.poll_hide_help_button : Messages.poll_show_help_button);

        $('#cp-app-poll-help').toggle(help);
        $('#cp-app-poll-action-help').text(msg);
        updateHelpButton();
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

    var updatePublishedDescription = function () {
        var v = APP.editor.getValue();
        DiffMd.apply(DiffMd.render(v || Messages.poll_descriptionHint), APP.$descriptionPublished);
    };
    var updateDescription = function (old, n) {
        var o = APP.$description.val();
        SframeCM.setValueAndCursor(APP.editor, o, n, TextPatcher);
        updatePublishedDescription();
        common.notify();
    };
    var updateLocalDescription = function (n) {
        APP.proxy.description = n;
        updatePublishedDescription();
    };

    var onReady = function (info, userid) {
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
            Title.updateTitle(Title.defaultTitle);
        }

        if (typeof(proxy.type) === 'undefined') {
            proxy.type = 'poll';
        }

        // Add uncommitted and unlock uncommited & own column
        var uncommitted = APP.uncommitted = {};
        prepareProxy(proxy, copyObject(Render.Example));
        prepareProxy(uncommitted, copyObject(Render.Example));
        if (!APP.readOnly) {
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

        var $table = APP.$table = $(Render.asHTML(displayedObj, null, colsOrder, APP.readOnly));

        var getUncommitted = function (type) {
            var ret = {}, toRemove;
            var uncommitted = APP.uncommitted.content;
            if (type === 'col') {
                ret.colsOrder = uncommitted.colsOrder.slice();
                ret.cols = copyObject(uncommitted.cols);
                // get only the cells corresponding to the committed rows
                toRemove = Object.keys(uncommitted.cells).filter(function (coor) {
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
            toRemove = Object.keys(uncommitted.cells).filter(function (coor) {
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
            console.log(JSON.stringify(ret, 0, 2));
            return ret;
        };
        APP.$createCol = $('#cp-app-poll-create-user').click(function () {
            var uncommittedCopy = { content: getUncommitted('col') };
            var id = uncommittedCopy.content.colsOrder[0];
            if (!APP.userid) { setUserId(id); }
            mergeUncommitted(proxy, uncommittedCopy, true);
            change(null, null, null, null, function() {
                handleSpan($('.cp-app-poll-table-lock[data-rt-id="' + id + '"]')[0]);
            });
        });
        APP.$createRow = $('#cp-app-poll-create-option').click(function () {
            var uncommittedCopy = { content: getUncommitted('row') };
            mergeUncommitted(proxy, uncommittedCopy, true);
            change(null, null, null, null, function() {
                var newId = APP.uncommitted.content.rowsOrder[0];
                $('input[data-rt-id="' + newId + '"]').focus();
            });
        });

        // Description
        APP.editor.on('change', function () {
            var val = APP.editor.getValue();
            updateLocalDescription(val);
        });

        $('#cp-app-poll-table-scroll').html('').prepend($table);
        updateDisplayedTable();
        updateDescription(null, APP.proxy.description);

        $table
            .click(handleClick)
            .on('keyup', function (e) { handleClick(e, true); });

        $(window).click(function(e) {
            if (e.which !== 1) { return; }
            hideInputs();
        });

        proxy
            .on('change', ['metadata'], function () {
                metadataMgr.updateMetadata(proxy.metadata);
            })
            .on('change', ['content'], change)
            .on('change', ['description'], updateDescription)
            .on('remove', [], change);

        // If the user's column is not committed, add his username
        var $userInput = $('.cp-app-poll-table-uncommitted > input[data-rt-id^='+ APP.userid +']');
        if ($userInput.val() === '') {
            var uname = metadataMgr.getUserData().name;
            APP.uncommitted.content.cols[APP.userid] = uname;
            $userInput.val(uname);
        }

        APP.ready = true;
        if (!proxy.published) {
            publish(false);
        } else {
            publish(true);
        }

        Cryptpad.removeLoadingScreen();
        if (isNew) {
            common.openTemplatePicker();
        }
    };

    var onDisconnect = function () {
        setEditable(false);
        Cryptpad.alert(Messages.common_connectionLost, undefined, true);
    };

    var onReconnect = function () {
        setEditable(true);
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
            readOnly: APP.readOnly,
            realtime: info.realtime,
            common: Cryptpad,
            sfCommon: common,
            $container: APP.$bar,
            $contentContainer: APP.$content
        };
        APP.toolbar = Toolbar.create(configTb);

        Title.setToolbar(APP.toolbar);

        var $rightside = APP.toolbar.$rightside;

        metadataMgr.onChange(function () {
            var md = copyObject(metadataMgr.getMetadata());
            APP.proxy.metadata = md;
        });

        /* add a forget button */
        var forgetCb = function (err) {
            if (err) { return; }
            setEditable(false);
        };
        var $forgetPad = common.createButton('forget', true, {}, forgetCb);
        $rightside.append($forgetPad);

        /* save as template */
        if (!metadataMgr.getPrivateData().isTemplate) {
            var templateObj = {
                rt: info.realtime,
                getTitle: function () { return metadataMgr.getMetadata().title; }
            };
            var $templateButton = common.createButton('template', true, templateObj);
            $rightside.append($templateButton);
        }

        /* add an export button */
        var $export = common.createButton('export', true, {}, exportFile);
        $rightside.append($export);

        var $help = common.createButton('', true).click(function () { showHelp(); })
            .appendTo($rightside);
        APP.$helpButton = $help;
        updateHelpButton();

        if (APP.readOnly) { publish(true); return; }
        var $publish = common.createButton('', true)
            .removeClass('fa-question').addClass('fa-check')
            .click(function () { publish(!APP.proxy.published); }).appendTo($rightside);
        APP.$publishButton = $publish;
        updatePublishButton();
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
                    APP.readOnly = metadataMgr.getPrivateData().readOnly;
                    privReady();
                }
            });
        }).nThen(function (/* waitFor */) {
            APP.loggedIn = common.isLoggedIn();
            APP.SFCommon = common;

            APP.$body = $('body');
            APP.$bar = $('#cp-toolbar');
            APP.$content = $('#cp-app-poll-content');
            APP.$descriptionPublished = $('#cp-app-poll-description-published');
            APP.$description = $('#cp-app-poll-description')
                .attr('placeholder', Messages.poll_descriptionHint || 'description');

            APP.editor = CMeditor.fromTextArea(APP.$description[0], {
                lineNumbers: true,
                lineWrapping: true,
                styleActiveLine : true,
                mode: "markdown",
            });


            var listmapConfig = {
                data: {},
                common: common,
                logLevel: 1
            };

            if (APP.readOnly) {
                $('#cp-app-poll-create-user, #cp-app-poll-create-option').remove();
            }

            var rt = APP.rt = Listmap.create(listmapConfig);
            APP.proxy = rt.proxy;

            rt.proxy.on('create', onCreate)
                 .on('ready', function (info) {
                    common.getPadAttribute('userid', function (e, userid) {
                        if (e) { console.error(e); }
                        if (!userid) { userid = Render.coluid(); }
                        APP.userid = userid;
                        onReady(info, userid);
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
        });
    };
    main();
});
