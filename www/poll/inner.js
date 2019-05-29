define([
    'jquery',
    '/common/toolbar3.js',
    '/common/common-util.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-realtime.js',
    '/customize/application_config.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/poll/render.js',
    '/poll/export.js',
    '/common/diffMarked.js',
    '/common/sframe-common-codemirror.js',
    '/common/common-thumbnail.js',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    'cm/lib/codemirror',
    '/common/test.js',

    'cm/addon/display/placeholder',
    'cm/mode/markdown/markdown',
    'css!cm/lib/codemirror.css',

    '/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/poll/app-poll.less',
], function (
    $,
    Toolbar,
    Util,
    nThen,
    SFCommon,
    CommonRealtime,
    AppConfig,
    Listmap,
    Renderer,
    Exporter,
    DiffMd,
    SframeCM,
    Thumb,
    UI,
    h,
    Messages,
    CMeditor,
    Test)
{
    var saveAs = window.saveAs;

    var APP = window.APP = {
        unlocked: {
            row: [],
            col: []
        },
        readOnly: false,
        mobile: function () { return $('body').width() <= 600; } // Menu and content area are not inline-block anymore for mobiles
    };
    var Render = Renderer(APP);

    var debug = $.noop; //console.log;

    var metadataMgr;
    var Title;
    var common;

    var copyObject = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    APP.getCSV = function () {
        return Exporter.getCSV(APP.proxy.content);
    };

    var exportFile = function () {
        Exporter.main(APP.proxy, function (blob, isJson) {
            var suggestion = Title.suggestTitle(Title.defaultTitle);
            var ext = isJson ? '.json' : '.csv';
            UI.prompt(Messages.exportPrompt,
                Util.fixFileName(suggestion) + ext, function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                saveAs(blob, filename);
            });
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
        var idx = APP.proxy.content.colsOrder.indexOf(firstcol);
        if (!firstcol || idx === -1) { return colsOrder; }
        colsOrder.splice(idx, 1);
        colsOrder.unshift(firstcol);
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
            newObj = copyObject(proxy);
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

    var enableColumn  = APP.enableColumn = function (id, table) {
        table = table || $('body');
        var $input = $(table).find('input[disabled="disabled"][data-rt-id^="' + id + '"]')
            .removeAttr('disabled');
        $input.closest('td').addClass('cp-app-poll-table-editing');
        $(table).find('.cp-app-poll-table-lock[data-rt-id="' + id + '"]').addClass('fa-unlock')
            .removeClass('fa-lock').attr('title', Messages.poll_unlocked);
    };
    var disableColumn = function (id) {
        var $input = $('input[data-rt-id^="' + id + '"]')
            .attr('disabled', 'disabled');
        $input.closest('td').removeClass('cp-app-poll-table-editing');
        $('.cp-app-poll-table-lock[data-rt-id="' + id + '"]').addClass('fa-lock')
            .removeClass('fa-unlock').attr('title', Messages.poll_locked);
    };
    var enableRow = APP.enableRow = function (id, table) {
        table = table || $('body');
        var $input = $(table).find('input[disabled="disabled"][data-rt-id="' + id + '"]')
            .removeAttr('disabled');
        $input.closest('td').addClass('cp-app-poll-table-editing');
        $(table).find('span.cp-app-poll-table-edit[data-rt-id="' + id + '"]')
            .css('visibility', 'hidden');
    };
    var disableRow = function (id) {
        var $input = $('input[type="text"][data-rt-id="' + id + '"]')
            .attr('disabled', 'disabled');
        $input.closest('td').removeClass('cp-app-poll-table-editing');
        $('span.cp-app-poll-table-edit[data-rt-id="' + id + '"]').css('visibility', 'visible');
    };

    var unlockElements = function () {
        APP.unlocked.row.forEach(enableRow);
        APP.unlocked.col.forEach(enableColumn);
    };

    var setTablePublished = function (bool) {
        if (APP.locked) { bool = true; }
        if (APP.markdownTb) { APP.markdownTb.setState(!bool); }
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
    var addScrollClass = function () {
        var $scroll = $('#cp-app-poll-table-scroll');
        var hasScroll = $scroll.width() < $scroll[0].scrollWidth && $scroll.width() > 100;
        if (hasScroll) {
            $scroll.addClass('cp-app-poll-table-scrolled');
            return;
        }
        $scroll.removeClass('cp-app-poll-table-scrolled');
    };
    var updateTableButtons = function () {
        var uncomColId = APP.uncommitted.content.colsOrder[0];
        var uncomRowId = APP.uncommitted.content.rowsOrder[0];
        var $createOption = $('tbody input[data-rt-id="' + uncomRowId+'"]')
                                .closest('td').find('> div');
        $createOption.find('#cp-app-poll-create-option').remove();
        $createOption.append(APP.$createRow);
        var $createUser = $('thead input[data-rt-id="' + uncomColId + '"]')
                                .closest('td');
        $createUser.find('#cp-app-poll-create-user').remove();
        $createUser.prepend(APP.$createCol);
    };

    var updateDisplayedTable = function () {
        setTablePublished(APP.proxy.published);
        addScrollClass();
        updateTableButtons();
    };

    var unlockColumn = function (id, cb) {
        if (APP.unlocked.col.indexOf(id) === -1) {
            APP.unlocked.col.push(id);
        }
        enableColumn(id);
        if (typeof(cb) === "function") { cb(); }
    };
    var unlockRow = function (id, cb) {
        if (APP.unlocked.row.indexOf(id) === -1) {
            APP.unlocked.row.push(id);
        }
        enableRow(id);
        if (typeof(cb) === "function") { cb(); }
    };
    var lockColumn = function (id, cb) {
        var idx = APP.unlocked.col.indexOf(id);
        if (idx !== -1) {
            APP.unlocked.col.splice(idx, 1);
        }
        disableColumn(id);
        if (typeof(cb) === "function") { cb(); }
    };
    var lockRow = function (id, cb) {
        var idx = APP.unlocked.row.indexOf(id);
        if (idx !== -1) {
            APP.unlocked.row.splice(idx, 1);
        }
        disableRow(id);
        if (typeof(cb) === "function") { cb(); }
    };

    /*  Any time the realtime object changes, call this function */
    var change = function (o, n, path, throttle, cb) {
        if (path && !Array.isArray(path)) {
            return;
        }
        if (path && path.join) {
            debug("Change from [%s] to [%s] at [%s]",
                o, n, path.join(', '));
        }

        var table = APP.$table[0];

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
            var displayedObj = mergeUncommitted(APP.proxy, APP.uncommitted);
            var colsOrder = sortColumns(displayedObj.content.colsOrder, APP.userid);
            var conf = {
                cols: colsOrder,
                readOnly: APP.locked
            };
            var f = getFocus();
            APP.$createRow.detach();
            APP.$createCol.detach();
            Render.updateTable(table, displayedObj, conf);
            // Fix autocomplete bug:
            displayedObj.content.rowsOrder.forEach(function (rowId) {
                if (f.id === rowId) { return; }
                $('input[data-rt-id="' + rowId +'"]').val(displayedObj.content.rows[rowId] || '');
            });
            displayedObj.content.colsOrder.forEach(function (colId) {
                if (f.id === colId) { return; }
                $('input[data-rt-id="' + colId +'"]')
                    .val(displayedObj.content.cols[colId] || '');
            });
            updateDisplayedTable();
            setFocus(f);
            if (typeof(cb) === "function") {
                cb();
            }
        };

        if (throttle) {
            if (APP.throttled) { window.clearTimeout(APP.throttled); }
            APP.throttled = window.setTimeout(function () {
                updateTable();
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
                change(null, null, null, 1000);
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
        if (APP.locked) { return; }
        if (id) {
            var type = Render.typeofId(id);
            if (type === 'col') { return void lockColumn(id); }
            if (type === 'row') { return void lockRow(id); }
            return;
        }
        var keepColUnlocked = [APP.userid, APP.uncommitted.content.colsOrder[0]];
        var keepRowUnlocked = APP.uncommitted.content.rowsOrder.slice();

        var toLock = [];
        APP.unlocked.col.forEach(function (id) {
            if (keepColUnlocked.indexOf(id) !== -1) { return; }
            toLock.push(id);
        });
        toLock.forEach(lockColumn);

        toLock = [];
        APP.unlocked.row.forEach(function (id) {
            if (keepRowUnlocked.indexOf(id) !== -1) { return; }
            toLock.push(id);
        });
        toLock.forEach(lockRow);
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
                UI.confirm(Messages.poll_removeOption, function (res) {
                    if (!res) { return; }
                    Render.removeRow(APP.proxy, id, function () {
                        change();
                    });
                });
            } else if (isEdit) {
                unlockRow(id, function () {
                    $('input[data-rt-id="' + id + '"]').focus();
                });
            }
        } else if (type === 'col') {
            if (isRemove) {
                UI.confirm(Messages.poll_removeUser, function (res) {
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
                    $('input[data-rt-id="' + id + '"]').focus();
                });
            } else if (isLock) {
                lockColumn(id);
            }
        } else if (type === 'cell') {
            change();
        } else {
            debug("UNHANDLED");
        }
    };

    var optionOrder = {
        3: 1, // ? => ✔
        1: 2, // ✔ => ~
        2: 0, // ~ => x
        0: 3, // x => ?
        // undefined => 3
    };

    var handleClick = function (e, isKeyup) {
        if (APP.locked) { return; }

        e.stopPropagation();

        if (!APP.ready) { return; }
        if (!isKeyup && e.which !== 1) { return; } // only allow left clicks

        var target = e && e.target;

        if (!target) { return void debug("NO TARGET"); }

        var nodeName = target && target.nodeName;

        switch (nodeName) {
            case 'INPUT':
                if ($(target).is('[type="text"]') && !isKeyup) { return; }
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
                input.val(optionOrder[value]);

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
        $(APP.$mediaTagButton).toggle(!bool);
        setTablePublished(bool);
        /*['textarea'].forEach(function (sel) {
            $(sel).attr('disabled', bool);
        });*/
        updatePublishButton();
        APP.editor.refresh();
    };

    var setEditable = function (editable) {
        APP.locked = APP.readOnly || !editable;

        if (editable === false) {
            // disable all the things
            $('.cp-app-poll-realtime input, .cp-app-poll-realtime button, .cp-app-poll-upper button, .cp-app-poll-realtime textarea').attr('disabled', true);
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
        DiffMd.apply(DiffMd.render(v || ''), APP.$descriptionPublished, common);
    };
    var updateDescription = function (old, n) {
        var o = APP.editor.getValue();
        SframeCM.setValueAndCursor(APP.editor, o, n);
        updatePublishedDescription();
        common.notify();
    };
    var updateLocalDescription = function (n) {
        APP.proxy.description = n;
        updatePublishedDescription();
    };

    var getCommentId = Render.Uid('c');
    var removeComment = function (uid) {
        var idx = APP.proxy.commentsOrder.indexOf(uid);
        if (idx !== -1) { APP.proxy.commentsOrder.splice(idx, 1); }
        delete APP.proxy.comments[uid];
        APP.updateComments();
    };
    /*var editComment = function (id) {
        // TODO
    };*/
    var avatars = {};
    var updateComments = APP.updateComments = function () {
        if (!APP.proxy.comments) { APP.proxy.comments = {}; }
        if (!APP.proxy.commentsOrder) { APP.proxy.commentsOrder = []; }

        var profile;
        if (common.isLoggedIn()) {
            profile = metadataMgr.getUserData().profile;
        }

        var $comments = APP.$comments.html('');
        var comments = APP.proxy.comments;
        APP.proxy.commentsOrder.forEach(function (k) {
            var c = comments[k];
            if (!c) { return; }
            var name = c.name || Messages.anonymous;
            var $c = $('<div>', {
                'class': 'cp-app-poll-comments-list-el'
            }).prependTo($comments);
            // Metadata
            var $data = $('<div>', { 'class': 'cp-app-poll-comments-list-data' }).appendTo($c);
            var $avatar = $('<span>', {
                'class': 'cp-app-poll-comments-list-data-avatar cp-avatar'
            }).appendTo($data);
            if (c.avatar && avatars[c.avatar]) {
                $avatar.append(avatars[c.avatar]);
            } else {
                common.displayAvatar($avatar, c.avatar, name, function ($img) {
                    if (c.avatar && $img.length) { avatars[c.avatar] = $img[0].outerHTML; }
                });
            }
            if (c.profile) {
                $('<a>', {
                    'href': APP.origin + '/profile/#' + c.profile,
                    'target': '_blank',
                    'class': 'cp-app-poll-comments-list-data-name'
                }).appendTo($data).text(name);
            } else {
                $('<span>', {
                    'class': 'cp-app-poll-comments-list-data-name'
                }).appendTo($data).text(name);
            }
            $('<span>', {
                'class': 'cp-app-poll-comments-list-data-time'
            }).appendTo($data).text(new Date(c.time).toLocaleString());

            // Message
            var $msg = $('<div>', { 'class': 'cp-app-poll-comments-list-msg' }).appendTo($c);
            $('<div>', {
                'class': 'cp-app-poll-comments-list-msg-text'
            }).appendTo($msg).text(c.msg);
            var $actions = $('<div>', {
                'class': 'cp-app-poll-comments-list-msg-actions'
            }).appendTo($msg);

            // Actions
            if (!APP.readOnly && (!c.profile || c.profile === profile)) {
                $('<button>', {
                    'class': 'btn btn-secondary fa fa-times',
                    'title': Messages.poll_comment_remove,
                    'data-rt-id': k
                }).appendTo($actions).click(function () { removeComment(k); });
                /*$('<button>', {
                    'class': 'fa fa-pencil',
                    'title': 'TODO: edit comment',
                    'data-rt-id': c.uid
                }).appendTo($actions).click(editComment);*/
            }
        });
        common.notify();
    };
    var resetComment = function () {
        APP.$addComment.find('.cp-app-poll-comments-add-name')
            .val(metadataMgr.getUserData().name || '');
        APP.$addComment.find('.cp-app-poll-comments-add-msg').val('');
    };
    var addComment = function () {
        if (!APP.proxy.comments) { APP.proxy.comments = {}; }
        if (!APP.proxy.commentsOrder) { APP.proxy.commentsOrder = []; }
        var name = APP.$addComment.find('.cp-app-poll-comments-add-name').val().trim();
        var msg = APP.$addComment.find('.cp-app-poll-comments-add-msg').val().trim();
        var time = +new Date();

        if (!msg) { return; }

        var profile, avatar;
        if (common.isLoggedIn()) {
            profile = metadataMgr.getUserData().profile;
            avatar = metadataMgr.getUserData().avatar;
        }

        var uid = getCommentId();
        APP.proxy.commentsOrder.push(uid);
        APP.proxy.comments[uid] = {
            msg: msg,
            name: name,
            time: time,
            profile: profile,
            avatar: avatar
        };
        resetComment();
        updateComments();
    };

    var initThumbnails = function () {
        var privateDat = metadataMgr.getPrivateData();
        if (!privateDat.thumbnails) { return; } // Thumbnails are disabled
        var $el = $('.cp-app-poll-realtime');
        //var $el = $('#cp-app-poll-table');
        var scrollTop;
        var options = {
            getContainer: function () { return $el[0]; },
            filter: function (el, before) {
                if (before) {
                    $el.parents().css('overflow', 'visible');
                    scrollTop = $('#cp-app-poll-form').scrollTop();
                    $el.css('max-height', Math.max(600, $(el).width()) + 'px');
                    $el.find('tr td:first-child, tr td:last-child, tr td:nth-last-child(2)')
                        .css('position', 'static');
                    $el.find('#cp-app-poll-comments').css('display', 'none');
                    $el.find('#cp-app-poll-table-container').css('text-align', 'center');
                    $el.find('#cp-app-poll-table-scroll').css('margin', 'auto');
                    $el.find('#cp-app-poll-table-scroll').css('max-width', '100%');
                    return;
                }
                $el.parents().css('overflow', '');
                $el.css('max-height', '');
                $el.find('#cp-app-poll-comments').css('display', '');
                $el.find('#cp-app-poll-table-container').css('text-align', '');
                $el.find('#cp-app-poll-table-scroll').css('margin', '');
                $el.find('#cp-app-poll-table-scroll').css('max-width', '');
                $el.find('tr td:first-child, tr td:last-child, tr td:nth-last-child(2)')
                    .css('position', '');
                $('#cp-app-poll-form').scrollTop(scrollTop);
            },
            type: 'poll',
            getContent: function () { return JSON.stringify(APP.proxy.content); }
        };
        Thumb.initPadThumbnails(common, options);
    };

    var checkDeletedCells = function () {
        // faster than forEach?
        var c;
        if (!APP.proxy || !APP.proxy.content) { return; }
        for (var k in APP.proxy.content.cells) {
            c = Render.getCoordinates(k);
            if (APP.proxy.content.colsOrder.indexOf(c[0]) === -1 ||
                APP.proxy.content.rowsOrder.indexOf(c[1]) === -1) {
                delete APP.proxy.content.cells[k];
            }
        }
    };
    var onReady = function (info, userid) {
        var proxy = APP.proxy;

        var isNew = false;
        var userDoc = JSON.stringify(proxy);
        if (userDoc === "" || userDoc === "{}") { isNew = true; }

        if (!isNew) {
            if (proxy.info) {
                // Migration
                proxy.metadata = proxy.info;
                delete proxy.info;
            }
            if (proxy.table) {
                // Migration
                proxy.content = proxy.table;
                delete proxy.table;
            }
            checkDeletedCells();

            if (proxy.comments && !proxy.commentsOrder) { // Migration
                proxy.commentsOrder = Object.keys(copyObject(proxy.comments)).sort(function (a, b) {
                    return proxy.comments[a].time > proxy.comments[b].time;
                });
            }

            if (proxy && proxy.metadata) {
                metadataMgr.updateMetadata(proxy.metadata);
            }
            if (typeof (proxy) !== 'object' || Array.isArray(proxy) ||
                (proxy.metadata && typeof(proxy.metadata.type) !== 'undefined' &&
                 proxy.metadata.type !== 'poll')) {
                var errorText = Messages.typeError;
                UI.errorLoadingScreen(errorText);
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
        var coluid = Render.coluid();
        if (userid) {
            // If userid exists, it means the user already has a pinned column
            // and we should unlock it
            unlockColumn(userid);
        }
        uncommitted.content.colsOrder.push(coluid);
        unlockColumn(coluid);

        var rowuid = Render.rowuid();
        uncommitted.content.rowsOrder.push(rowuid);
        unlockRow(rowuid);

        /*
            Extract uncommitted data (row or column) and create a new uncommitted row or column
        */
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
            return ret;
        };
        APP.$createCol = $('#cp-app-poll-create-user').click(function () {
            var uncommittedCopy = { content: getUncommitted('col') };
            var id = uncommittedCopy.content.colsOrder[0];
            if (!APP.userid) { setUserId(id); }
            mergeUncommitted(proxy, uncommittedCopy, true);
            change(null, null, null, null, function() {
                unlockColumn(id);
                unlockColumn(APP.uncommitted.content.colsOrder[0]);
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

        var displayedObj = mergeUncommitted(proxy, uncommitted, false);

        var colsOrder = sortColumns(displayedObj.content.colsOrder, userid);

        Render.updateTable($('#cp-app-poll-table-scroll').find('table')[0], displayedObj, {
            cols: colsOrder,
            readOnly: APP.readOnly
        });

        // Description
        APP.editor.on('change', function () {
            var val = APP.editor.getValue();
            updateLocalDescription(val);
        });
        APP.$addComment.find('.cp-app-poll-comments-add-submit').click(addComment);
        APP.$addComment.find('.cp-app-poll-comments-add-cancel').click(resetComment);

        var $table = APP.$table = $('#cp-app-poll-table-scroll').find('table');
        updateDisplayedTable();
        updateDescription(null, APP.proxy.description || '');
        initThumbnails();

        var markdownTb = APP.markdownTb = common.createMarkdownToolbar(APP.editor);
        $('.CodeMirror').parent().prepend(markdownTb.toolbar);
        APP.toolbar.$rightside.append(markdownTb.button);

        // Initialize author name for comments.
        // Disable name modification for logged in users
        var $cName = APP.$addComment.find('.cp-app-poll-comments-add-name')
            .val(metadataMgr.getUserData().name || '');
        if (common.isLoggedIn()) { $cName.attr('disabled', 'disabled'); }
        updateComments();

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
            .on('change', ['content'], function () {
                change(null, null, null, 100);
            })
            .on('change', ['description'], updateDescription)
            .on('change', ['comments'], updateComments)
            .on('change', ['published'], function () {
                publish(proxy.published);
            })
            .on('remove', [], function () {
                change(null, null, null, 100);
            });

        // If the user's column is not committed, add his username
        var $userInput = $('.cp-app-poll-table-uncommitted > input');
        if (!APP.userid) {
            var uname = metadataMgr.getUserData().name;
            APP.uncommitted.content.cols[APP.uncommitted.content.colsOrder[0]] = uname;
            $userInput.val(uname);
        }

        APP.ready = true;
        if (!proxy.published) {
            publish(false);
        } else {
            publish(true);
        }

        var passIfOk = function (t) {
            t.assert($('#cp-app-poll-description-published').text().indexOf(
                "Content for the description") === 0);
            t.assert($('.cp-app-poll-comments-list-data-name').text().indexOf(
                "Mr.Me") === 0);
            t.assert($('.cp-app-poll-comments-list-msg-text').text().indexOf(
                "Example comment yay") === 0);
            t.assert($('input[value="Candy"]').length === 1);
            t.assert($('input[value="IceCream"]').length === 1);
            t.assert($('input[value="Soda"]').length === 1);
            t.assert($('input[value="Meeee"]').length === 1);
            t.pass();
        };

        if (!APP.readOnly) {
            console.log("Here is the test");
            Test(function (t) {
                if ($('input[value="Candy"]').length) {
                    t.fail("Test has already been performed");
                    return;
                }
                nThen(function (waitFor) {
                    console.log("Here is the test1");
                    APP.editor.setValue("Content for the description");
                    $('.cp-app-poll-table-editing .cp-app-poll-table-text-cell input').val(
                        'Candy').keyup();
                    $('#cp-app-poll-create-option').click();
                    // TODO(cjd): Need to click outside to lock the first option we create.. bug?
                    $(window).trigger({ type: "click", which: 1 });
                    setTimeout(waitFor());
                }).nThen(function (waitFor) {
                    $('.cp-app-poll-table-editing .cp-app-poll-table-text-cell input').val(
                        'IceCream').keyup();
                    $('#cp-app-poll-create-option').click();
                    setTimeout(waitFor());
                }).nThen(function (waitFor) {
                    $('.cp-app-poll-table-editing .cp-app-poll-table-text-cell input').val(
                        'Soda').keyup();
                    $('#cp-app-poll-create-option').click();
                    setTimeout(waitFor());
                }).nThen(function (waitFor) {
                    // Switch to non-admin mode
                    $('.cp-toolbar-icon-publish').click();
                    setTimeout(waitFor());
                }).nThen(function (waitFor) {
                    $('.cp-app-poll-comments-add-name').val("Mr.Me").keyup();
                    $('.cp-app-poll-comments-add-msg').val("Example comment yay").keyup();
                    setTimeout(waitFor());
                }).nThen(function (waitFor) {
                    $('.cp-app-poll-comments-add-submit').click();
                    setTimeout(waitFor());
                }).nThen(function (waitFor) {
                    $('#cp-app-poll-create-user').parent().find('input').val('Meeee').keyup();
                    [1,3,2].forEach(function (num, i) {
                        var x = $($('.cp-app-poll-table-checkbox-contain label')[i]);
                        for (var ii = 0; ii < num; ii++) {
                            x.trigger({ type: 'click', which: 1 });
                        }
                    });
                    setTimeout(waitFor());
                }).nThen(function (waitFor) {
                    $('#cp-app-poll-create-user').click();
                    setTimeout(waitFor());
                }).nThen(function (waitFor) {
                    APP.rt.realtime.onSettle(waitFor());
                }).nThen(function (/*waitFor*/) {
                    passIfOk(t);
                });
            });
        } else {
            Test(passIfOk);
        }

        // No need for onLocal in openPadChat because in poll, we listen for metadata changes
        // and save them everytime.
        // See `metadataMgr.onChange(function () {`
        common.openPadChat(function () {});

        UI.removeLoadingScreen();
        var privateDat = metadataMgr.getPrivateData();
        var skipTemp = Util.find(privateDat,
            ['settings', 'general', 'creation', 'noTemplate']);
        var skipCreation = Util.find(privateDat, ['settings', 'general', 'creation', 'skip']);
        if (isNew && (!AppConfig.displayCreationScreen || (!skipTemp && skipCreation))) {
            common.openTemplatePicker();
        }
    };

    var onError = function (info) {
        if (info && info.type) {
            if (info.type === 'CHAINPAD') {
                APP.unrecoverable = true;
                setEditable(false);
                APP.toolbar.errorState(true, info.error);
                var msg = Messages.chainpadError;
                UI.errorLoadingScreen(msg, true, true);
                console.error(info.error);
                return;
            }
            // Server error
            return void common.onServerError(info, APP.toolbar, function () {
                APP.unrecoverable = true;
                setEditable(false);
            });
        }
    };

    // Manage disconnections because of network or error
    var onDisconnect = function (info) {
        if (APP.unrecoverable) { return; }
        if (info && info.type) {
            // Server error
            return void common.onServerError(info, APP.toolbar, function () {
                APP.unrecoverable = true;
                setEditable(false);
            });
        }
        setEditable(false);
        //UI.alert(Messages.common_connectionLost, undefined, true);
    };

    var onReconnect = function () {
        if (APP.unrecoverable) { return; }
        setEditable(true);
        //UI.findOKButton().click();
    };

    var getHeadingText = function () {
        if (!APP.editor) { return; }
        return SframeCM.getHeadingText(APP.editor);
    };

    var onCreate = function (info) {
        APP.myID = info.myID;

        if (APP.realtime !== info.realtime) {
            APP.realtime = info.realtime;
        }

        metadataMgr = common.getMetadataMgr();

        var titleCfg = { getHeadingText: getHeadingText };
        Title = common.createTitle(titleCfg);

        var configTb = {
            displayed: [
                'chat',
                'userlist',
                'title',
                'useradmin',
                'spinner',
                'newpad',
                'share',
                'limit',
                'unpinnedWarning',
                'notifications'
            ],
            title: Title.getTitleConfig(),
            metadataMgr: metadataMgr,
            readOnly: APP.readOnly,
            realtime: info.realtime,
            sfCommon: common,
            $container: APP.$bar,
            $contentContainer: APP.$content
        };
        APP.toolbar = Toolbar.create(configTb);

        Title.setToolbar(APP.toolbar);

        var $rightside = APP.toolbar.$rightside;
        var $drawer = APP.toolbar.$drawer;

        metadataMgr.onChange(function () {
            var md = copyObject(metadataMgr.getMetadata());
            APP.proxy.metadata = md;
        });
        metadataMgr.onRequestSync(function () {
            var meta = JSON.parse(JSON.stringify(APP.proxy.metadata));
            metadataMgr.updateMetadata(meta);
        });

        /* add a forget button */
        var forgetCb = function (err) {
            if (err) { return; }
            setEditable(false);
        };
        var $forgetPad = common.createButton('forget', true, {}, forgetCb);
        $rightside.append($forgetPad);

        var $properties = common.createButton('properties', true);
        $drawer.append($properties);

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
        $drawer.append($export);

        var helpMenu = common.createHelpMenu(['poll']);
        $('#cp-app-poll-form').prepend(helpMenu.menu);
        $drawer.append(helpMenu.button);

        if (APP.readOnly) { publish(true); return; }
        var $publish = common.createButton('', true, {
            name: 'publish',
            icon: 'fa-check',
            hiddenReadOnly: true
        }).click(function () { publish(!APP.proxy.published); }).appendTo($rightside);
        APP.$publishButton = $publish;
        updatePublishButton();

        if (common.isLoggedIn()) {
            var fileDialogCfg = {
                onSelect: function (data) {
                    if (data.type === 'file' && APP.editor) {
                        var mt = '<media-tag src="' + data.src + '" data-crypto-key="cryptpad:' + data.key + '"></media-tag>';
                        APP.editor.replaceSelection(mt);
                        return;
                    }
                }
            };
            common.initFilePicker(fileDialogCfg);
            APP.$mediaTagButton = common.createButton('mediatag', true).click(function () {
                var pickerCfg = {
                    types: ['file'],
                    where: ['root']
                };
                common.openFilePicker(pickerCfg);
            }).appendTo($rightside);

            var $tags = common.createButton('hashtag', true);
            $rightside.append($tags);
        }
    };

    var initialContent = function () {
        return [
            h('div#cp-toolbar.cp-toolbar-container'),
            h('div#cp-app-poll-content', [
                h('div#cp-app-poll-form', [
                    h('div.cp-app-poll-realtime', [
                        h('br'),
                        h('div', [
                            h('textarea#cp-app-poll-description', {
                                rows: "5",
                                cols: "50",
                                placeholder: Messages.poll_descriptionHint,
                                disabled: true
                            }),
                            h('div#cp-app-poll-description-published'),
                            h('br')
                        ]),
                        h('div#cp-app-poll-table-container', [
                            h('div#cp-app-poll-table-scroll', [h('table')]),
                            h('button#cp-app-poll-create-user.btn.btn-secondary', {
                                title: Messages.poll_create_user
                            }, Messages.poll_commit),
                            h('button#cp-app-poll-create-option.btn.btn-secondary', {
                                title: Messages.poll_create_option
                            }, h('span.fa.fa-plus')),
                        ]),
                        h('div#cp-app-poll-comments', [
                            h('h2#cp-app-poll-comments-add-title', Messages.poll_comment_add),
                            h('div#cp-app-poll-comments-add', [
                                h('input.cp-app-poll-comments-add-name', {
                                    type: 'text',
                                    placeholder: Messages.anonymous
                                }),
                                h('textarea.cp-app-poll-comments-add-msg', {
                                    placeholder: Messages.poll_comment_placeholder
                                }),
                                h('button.cp-app-poll-comments-add-submit.btn.btn-secondary',
                                    Messages.poll_comment_submit),
                                h('button.cp-app-poll-comments-add-cancel.btn.btn-secondary',
                                    Messages.cancel)
                            ]),
                            h('h2#cp-app-poll-comments-list-title', Messages.poll_comment_list),
                            h('div#cp-app-poll-comments-list')
                        ]),
                        h('div#cp-app-poll-nocomments', Messages.poll_comment_disabled)
                    ])
                ])
            ])
        ];
    };

    var main = function () {

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen();
                var $div = $('<div>').append(initialContent());
                $('body').append($div.html());
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (waitFor) {
            common.getSframeChannel().onReady(waitFor());
        }).nThen(function (waitFor) {
            common.handleNewFile(waitFor);
        }).nThen(function (/* waitFor */) {
            Test.registerInner(common.getSframeChannel());
            var metadataMgr = common.getMetadataMgr();
            APP.locked = APP.readOnly = metadataMgr.getPrivateData().readOnly;
            APP.loggedIn = common.isLoggedIn();
            APP.SFCommon = common;

            if (APP.readOnly) {
                $('#cp-app-poll-form').addClass('cp-app-poll-readonly');
            }

            APP.origin = common.getMetadataMgr().getPrivateData().origin;

            APP.$body = $('body');
            APP.$bar = $('#cp-toolbar');
            APP.$content = $('#cp-app-poll-content');
            APP.$descriptionPublished = $('#cp-app-poll-description-published');
            APP.$description = $('#cp-app-poll-description');
            APP.$comments = $('#cp-app-poll-comments-list');
            APP.$addComment = $('#cp-app-poll-comments-add');

            APP.editor = CMeditor.fromTextArea(APP.$description[0], {
                lineNumbers: true,
                lineWrapping: true,
                styleActiveLine : true,
                mode: "markdown",
            });

            APP.$descriptionPublished.click(function (e) {
                if (!e.target) { return; }
                var $t = $(e.target);
                if ($t.is('a') || $t.parents('a').length) {
                    e.preventDefault();
                    var $a = $t.is('a') ? $t : $t.parents('a').first();
                    var href = $a.attr('href');
                    if (!href) { return; }
                    common.openUnsafeURL(href);
                }
            });

            var listmapConfig = {
                data: {},
                common: common,
                logLevel: 1
            };

            if (APP.readOnly) {
                $('#cp-app-poll-create-user, #cp-app-poll-create-option, #cp-app-poll-comments-add')
                    .remove();
                $('#cp-app-poll-comments-add-title').remove();
            }

            var rt = APP.rt = Listmap.create(listmapConfig);
            APP.proxy = rt.proxy;

            var firstConnection = true;
            rt.proxy.on('create', onCreate)
                 .on('ready', function (info) {
                    if (!firstConnection) { return; } // TODO fix this issue in listmap
                    firstConnection = false;
                    common.getPadAttribute('userid', function (e, userid) {
                        if (e) { console.error(e); }
                        APP.userid = userid;
                        onReady(info, userid);
                    });
                 })
                 .on('disconnect', onDisconnect)
                 .on('reconnect', onReconnect)
                 .on('error', onError);
        });
    };
    main();
});
