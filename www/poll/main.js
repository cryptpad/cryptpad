define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/customize/messages.js',
    '/poll/table.js',
    '/poll/wizard.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Messages, Table, Wizard, TextPatcher, Listmap, Crypto, Cryptpad, Visible, Notify) {
    var $ = window.jQuery;
    var saveAs = window.saveAs;

    Cryptpad.styleAlerts();
    console.log("Initializing your realtime session...");

    /*  TODO
        * set range of dates/times
          * (pair of date pickers)
        * hide options within that range
        * show hidden options
        * add notes to a particular time slot

        * check or uncheck options for a particular user
        * mark preference level? (+1, 0, -1)

        * delete/hide columns/rows

        // let users choose what they want the default input to be...

        * date
          - http://foxrunsoftware.github.io/DatePicker/ ?
        * ???
    */

    var secret = Cryptpad.getSecrets();

    var module = window.APP = {
        Cryptpad: Cryptpad,
    };

    module.Wizard = Wizard;

    // special UI elements
    var $title = $('#title').attr('placeholder', Messages.dateTitleHint || 'title');
    var $location = $('#location').attr('placeholder', Messages.dateLocationHint || 'location');
    var $description = $('#description').attr('placeholder', Messages.dateDescription || 'description');

    var items = [$title, $location, $description];

    var Uid = function (prefix, f) {
        f = f || function () {
            return Number(Math.random() * Number.MAX_SAFE_INTEGER)
                .toString(32).replace(/\./g, '');
        };
        return function () { return prefix + '-' + f(); };
    };

    var xy = function (x, y) { return x + '_' + y; };
    var parseXY = function (id) {
        var p = id.split('_');
        return {
            x: p[0],
            y: p[1],
        };
    };

    var Input = function (opt) { return $('<input>', opt); };
    var Checkbox = function (id) {
        var p = parseXY(id);

        var proxy = module.rt.proxy;

        var $div = $('<div>', {
            'class': 'checkbox-contain',
        });

        var $cover = $('<span>', {
            'for': id,
            'class': 'cover'
        });

        var $check = Input({
            id: id,
            name: id,
            type:'checkbox',
        }).on('change', function () {
            console.log("(%s, %s) => %s", p.x, p.y, $check[0].checked);
            var checked = proxy.table.cells[id] = $check[0].checked? 1: 0;
            if (checked) {
                $cover.addClass('yes');
            }
            else {
                $cover.removeClass('yes');
            }
        });

        if (p.x === module.activeColumn) {
            $check.addClass('editable');
        }

        $div.append($check);
        $check.after($cover);

        return $div; //$check;
    };
    var Text = function () { return Input({type:'text'}); };

    var table = module.table = Table($('#table'), xy);

    var setEditable = function (bool) {
        module.isEditable = bool;

        items.forEach(function ($item) {
            $item.attr('disabled', !bool);
        });
        $('input[id^="y"]').each(function (i, e) {
            $(this).attr('disabled', !bool);
        });
    };

    var coluid = Uid('x');
    var rowuid = Uid('y');

    var addIfAbsent = function (A, e) {
        if (A.indexOf(e) !== -1) { return; }
        A.push(e);
    };

    var removeRow = function (proxy, uid) {
        // remove proxy.table.rows[uid]

        proxy.table.rows[uid] = undefined;
        delete proxy.table.rows[uid];

        // remove proxy.table.rowsOrder

        var order = proxy.table.rowsOrder;
        order.splice(order.indexOf(uid), 1);

        // remove all cells including uid
        // proxy.table.cells
        Object.keys(proxy.table.cells).forEach(function (cellUid) {
            if (cellUid.indexOf(uid) === -1) { return; }
            proxy.table.cells[cellUid] = undefined;
            delete proxy.table.cells[cellUid];
        });

        // remove elements from DOM
        table.removeRow(uid);
    };

    var removeColumn = function (proxy, uid) {
        // remove proxy.table.cols[uid]
        proxy.table.cols[uid] = undefined;
        delete proxy.table.rows[uid];

        // remove proxy.table.colsOrder
        var order = proxy.table.colsOrder;
        order.splice(order.indexOf(uid), 1);

        // remove all cells including uid
        Object.keys(proxy.table.cells).forEach(function (cellUid) {
            if (cellUid.indexOf(uid) === -1) { return; }
            proxy.table.cells[cellUid] = undefined;
            delete proxy.table.cells[cellUid];
        });

        // remove elements from DOM
        table.removeColumn(uid);
    };

    var removeFromArray = function (A, e) {
        var i = A.indexOf(e);
        if (i === -1) { return; }
        A.splice(i, 1);
    };

    var makeUserEditable = module.makeUserEditable = function (id, bool) {
        var $name = $('input[type="text"][id="' + id + '"]').attr('disabled', !bool);

        var $edit = $name.parent().find('.edit');

        $edit[bool?'addClass':'removeClass']('editable');

        var $sel = $('input[id^="' + id + '"]')
            [bool?'addClass':'removeClass']('editable');

        if (bool) {
            module.rt.proxy.table.colsOrder.forEach(function (coluid) {
                if (coluid !== id) { makeUserEditable(coluid, false); }
            });
        }

        return $sel;
    };

    var makeUser = function (proxy, id, value) {
        var $user = Input({
            id: id,
            type: 'text',
            placeholder: 'your name',
            disabled: true,
        }).on('keyup change', function () {
            proxy.table.cols[id] = $user.val() || "";
        });

        var $edit = $('<span>', {
                'class': 'edit',
                title: 'edit column', // TODO translate
            }).click(function () {
                if ($edit.hasClass('editable')) { return; }
                Cryptpad.confirm("Are you sure you'd like to edit this user?",
                    function (yes) {
                        if (!yes) { return; }
                        makeUserEditable(id, true);
                        $edit.addClass('editable');
                        $edit.text("");
                        module.activeColumn = id;
                    });
            });

        var $remove = $('<span>', {
                'class': 'remove',
                'title': 'remove column', // TODO translate
            }).text('✖').click(function () {
                Cryptpad.confirm("Are you sure you'd like to remove this user?", // TODO translate
                    function (yes) {
                        if (!yes) { return; }
                        removeColumn(proxy, id);
                        table.removeColumn(id);
                    });
            });

        var $wrapper = $('<div>', {
            'class': 'text-cell',
        })
            .append($edit)
            .append($user)
            .append($remove);

        proxy.table.cols[id] = value || "";
        addIfAbsent(proxy.table.colsOrder, id);
        table.addColumn($wrapper, Checkbox, id);
        return $user;
    };

    var scrollDown = module.scrollDown = function (px) {
        var top = $(window).scrollTop() + px + 'px';
        $('html, body').animate({
            scrollTop: top,
        }, {
            duration: 200,
            easing: 'swing',
        });
    };

    var makeOption = function (proxy, id, value) {
        var $option = Input({
            type: 'text',
            placeholder: 'option',
            id: id,
        }).on('keyup change', function () {
            proxy.table.rows[id] = $option.val();
        });

        var $remove = $('<span>', {
            'class': 'remove',
            'title': 'remove row', // TODO translate
        }).text('✖').click(function () {
            // TODO translate
            var msg = "Are you sure you'd like to remove this option?";
            Cryptpad.confirm(msg, function (yes) {
                if (!yes) { return; }
                removeRow(proxy, id);
                table.removeRow(id);
            });
        });

        var $wrapper = $('<div>', {
            'class': 'text-cell',
        })
            .append($option)
            .append($remove);

        proxy.table.rows[id] = value || "";
        addIfAbsent(proxy.table.rowsOrder, id);

        var $row = table.addRow($wrapper, Checkbox, id);
        scrollDown($row.height());

        return $option;
    };

    $('#adduser').click(function () {
        if (!module.isEditable) { return; }
        var id = coluid();
        makeUser(module.rt.proxy, id);
        makeUserEditable(id, true).focus();
    });

    $('#addoption').click(function () {
        if (!module.isEditable) { return; }
        var id = rowuid();
        makeOption(module.rt.proxy, id).focus();
    });

    Wizard.$getOptions.click(function () {
        Cryptpad.confirm("Are you really ready to add these options to your poll?", function (yes) {
            if (!yes) { return; }
            var options = Wizard.computeSlots(function (a, b) {
                return a + ' ('+ b + ')';
            });

            var proxy = module.rt.proxy;

            options.forEach(function (text) {
                var id = rowuid();
                makeOption(proxy, id, text).val(text);
            });
            console.log(options);
        });
    });

    // notifications
    var unnotify = function () {
        if (!(module.tabNotification &&
            typeof(module.tabNotification.cancel) === 'function')) { return; }
        module.tabNotification.cancel();
    };

    var notify = function () {
        if (!(Visible.isSupported() && !Visible.currently())) { return; }
        unnotify();
        module.tabNotification = Notify.tab(document.title, 1000, 10);
    };

    // don't make changes until the interface is ready
    setEditable(false);

    var ready = function (info) {
        console.log("Your realtime object is ready");
        module.ready = true;

        var proxy = module.rt.proxy;

        var First = false;

        // ensure that proxy.info and proxy.table exist
        ['info', 'table'].forEach(function (k) {
            if (typeof(proxy[k]) === 'undefined') {
                // you seem to be the first person to have visited this pad...
                First = true;
                proxy[k] = {};
            }
        });

        // table{cols,rows,cells}
        ['cols', 'rows', 'cells'].forEach(function (k) {
            if (typeof(proxy.table[k]) === 'undefined') { proxy.table[k] = {}; }
        });

        // table{rowsOrder,colsOrder}
        ['rows', 'cols'].forEach(function (k) {
            var K = k + 'Order';

            if (typeof(proxy.table[K]) === 'undefined') {
                console.log("Creating %s", K);
                proxy.table[K] = [];

                Object.keys(proxy.table[k]).forEach(function (uid) {
                    addIfAbsent(proxy.table[K], uid);
                });
            }
        });

        // HERE TODO make this idempotent so you can call it again

        // cols
        proxy.table.colsOrder.forEach(function (uid) {
            var val = proxy.table.cols[uid];
            makeUser(proxy, uid, val).val(val);
        });

        // rows
        proxy.table.rowsOrder.forEach(function (uid) {
            var val = proxy.table.rows[uid];
            makeOption(proxy, uid, val).val(val);
        });

        // cells
        Object.keys(proxy.table.cells).forEach(function (uid) {
            //var p = parseXY(uid);
            var box = document.getElementById(uid);
            if (!box) {
                console.log("Couldn't find an element with uid [%s]", uid);
                return;
            }
            var checked = box.checked = proxy.table.cells[uid] ? true : false;
            if (checked) {
                $(box).parent().find('.cover').addClass('yes');
            }
        });

        items.forEach(function ($item) {
            var id = $item.attr('id');

            $item.on('change keyup', function () {
                var val = $item.val();
                proxy.info[id] = val;
            });

            if (typeof(proxy.info[id]) !== 'undefined') {
                $item.val(proxy.info[id]);
            }
        });

        // listen for visibility changes
        if (Visible.isSupported()) {
            Visible.onChange(function (yes) {
                if (yes) { unnotify(); }
            });
        }

        proxy
        .on('change', [], function () {
            notify();
        })
        .on('change', ['info'], function (o, n, p) {
            var $target = $('#' + p[1]);
            var el = $target[0];
            var selects;
            var op;

            if (el && ['textarea', 'text'].indexOf(el.type) !== -1) {
                op = TextPatcher.diff(o, n);
                selects = ['selectionStart', 'selectionEnd'].map(function (attr) {
                    var before = el[attr];
                    var after = TextPatcher.transformCursor(el[attr], op);
                    return after;
                });
                $target.val(n);

                if (op) {
                    el.selectionStart = selects[0];
                    el.selectionEnd = selects[1];
                }
            }

            console.log("change: (%s, %s, [%s])", o, n, p.join(', '));
        })
        .on('change', ['table'], function (o, n, p) {
            var id = p[p.length -1];
            var type = p[1];

            if (typeof(o) === 'undefined' &&
                ['cols', 'rows', 'cells'].indexOf(type) !== -1) {
                switch (type) {
                    case 'cols':
                        makeUser(proxy, id, n);
                        break;
                    case 'rows':
                        makeOption(proxy, id, n);
                        break;
                    case 'cells':
                        //
                        break;
                    default:
                        console.log("Unhandled table element creation");
                        break;
                }
            }

            var el = document.getElementById(id);
            if (!el) { 
                console.log("Couldn't find the element you wanted!");
                return;
            }

            switch (p[1]) {
                case 'cols':
                    console.log("[Table.cols change] %s (%s => %s)@[%s]", id, o, n, p.slice(0, -1).join(', '));
                    el.value = n;
                    break;
                case 'rows':
                    console.log("[Table.rows change] %s (%s => %s)@[%s]", id, o, n, p.slice(0, -1).join(', '));
                    el.value = n;
                    break;
                case 'cells':
                    console.log("[Table.cell change] %s (%s => %s)@[%s]", id, o, n, p.slice(0, -1).join(', '));
                    var checked = el.checked = proxy.table.cells[id] ? true: false;

                    var $parent = $(el).parent();

                    if (!$parent.length) { console.log("couldn't find parent element of checkbox"); return; }

                    if (checked) {
                        $parent.find('.cover').addClass('yes');
                        //$(el).parent().
                    } else {
                        $parent.find('.cover').removeClass('yes');
                    }
                    break;
                default:
                    console.log("[Table change] (%s => %s)@[%s]", o, n, p.join(', '));
                    break;
            }
        })
        .on('remove', [], function (o, p, root) {
            //console.log("remove: (%s, [%s])", o, p.join(', '));
            //console.log(p, o, p.length);

            switch (p[1]) {
                case 'cols':
                    console.log("[Table.cols removal] [%s]", p[2]);
                    table.removeColumn(p[2]);
                    return false;
                case 'rows':
                    console.log("[Table.rows removal] [%s]", p[2]);
                    table.removeRow(p[2]);
                    return false;
                case 'rowsOrder':
                    Object.keys(proxy.table.rows)
                        .forEach(function (rowId) {
                            if (proxy.table.rowsOrder.indexOf(rowId) === -1) {
                                proxy.table.rows[rowId] = undefined;
                                delete proxy.table.rows[rowId];
                            }
                        });
                    break;
                case 'colsOrder':
                    Object.keys(proxy.table.cols)
                        .forEach(function (colId) {
                            if (proxy.table.colsOrder.indexOf(colId) === -1) {
                                proxy.table.cols[colId] = undefined;
                                delete proxy.table.cols[colId];
                            }

                        });
                    break;
                case 'cells':
                    // cool story bro
                    break;
                default:
                    console.log("[Table removal] [%s]", p.join(', '));
                    break;
            }

        })
        .on('disconnect', function (info) {
            setEditable(false);
        });

        Cryptpad.getPadTitle(function (err, title) {
            title = document.title = title || window.location.hash.slice(1, 9);

            Cryptpad.rememberPad(title, function (err, data) {
                if (err) {
                    console.log("unable to remember pad");
                    console.log(err);
                    return;
                }
            });
        });

        var $toolbar = $('#toolbar');

        $toolbar.find('sub a').text('⇐ back to Cryptpad');

        var Button = function (opt) {
            return $('<button>', opt);
        };

        var suggestName = function () {
            var hash = window.location.hash.slice(1, 9);
            if (document.title === hash) {
                return $title.val() || hash;
            }
            return document.title || $title.val() || hash;
        };

        $toolbar.append(Button({
            id: 'forget',
            'class': 'forget button action',
            title: Messages.forgetButtonTitle,
        }).text(Messages.forgetButton).click(function () {
            var href = window.location.href;
            Cryptpad.confirm(Messages.forgetPrompt, function (yes) {
                if (!yes) { return; }
                Cryptpad.forgetPad(href, function (err, data) {
                    if (err) {
                        console.log("unable to forget pad");
                        console.error(err);
                        return;
                    }
                    document.title = window.location.hash.slice(1, 9);
                });
            });
        }));

        $toolbar.append(Button({
            id: 'rename',
            'class': 'rename button action',
            title: Messages.renameButtonTitle,
        }).text(Messages.renameButton).click(function () {
            var suggestion = suggestName();
            Cryptpad.prompt(Messages.renamePrompt,
                suggestion, function (title, ev) {
                    if (title === null) { return; }

                    Cryptpad.causesNamingConflict(title, function (err, conflicts) {
                        if (conflicts) {
                            Cryptpad.alert(Messages.renameConflict);
                            return;
                        }
                        Cryptpad.setPadTitle(title, function (err, data) {
                            if (err) {
                                console.log("unable to set pad title");
                                console.error(err);
                                return;
                            }
                            document.title = title;
                        });
                    });
                });
        }));

        $toolbar.append(Button({
            id: 'wizard',
            'class': 'wizard button action',
            title: 'wizard!',
        }).text('WIZARD').click(function () {
            Wizard.show();
            if (Wizard.hasBeenDisplayed) { return; }
            Cryptpad.log("click the button in the top left to return to your poll");
            Wizard.hasBeenDisplayed = true;
        }));

        /* Import/Export buttons */
        /*
        $toolbar.append(Button({
            id: 'import',
            'class': 'import button action',
            title: 'IMPORT', // TODO translate
        }).text('IMPORT') // TODO translate
        .click(function () {
            var proxy = module.rt.proxy;

            console.log("pew pew");
            if (!module.ready) { return; }

            console.log("bang bang");
            Cryptpad.importContent('text/plain', function (content, file) {
                var parsed;
                try {
                    parsed = JSON.parse(content);
                } catch (err) {
                    Cryptpad.alert("Could not parse imported content");
                    return;
                }
                console.log(content);
                //module.rt.update(parsed);
            })();
        }));

        $toolbar.append(Button({
            id: 'export',
            'class': 'export button action',
            title: 'EXPORT', // TODO translate
        }).text("EXPORT") // TODO translate
        .click(function () {
            if (!module.ready) { return; }
            var proxy = module.rt.proxy;

            var title = suggestName();

            var text = JSON.stringify(proxy, null, 2);

            Cryptpad.prompt(Messages.exportPrompt, title + '.json', function (filename) {
                if (filename === null) { return; }
                var blob = new Blob([text], {
                    type: 'application/json',
                });
                saveAs(blob, filename);
            });
        }));*/


        setEditable(true);

        if (First) {
            // assume the first user to the poll wants to be the administrator...
            // TODO prompt them with questions to set up their poll...
        }

        Cryptpad.getPadAttribute('column', function (err, column) {
            if (err) {
                console.log("unable to retrieve column");
                return;
            }

            module.activeColumn = column;

            var promptForName = function () {
                // HERE
                Cryptpad.prompt("What is your name?", "", function (name, ev) {
                    if (name === null) {
                        name = '';
                    }

                    if (!module.isEditable) { return; }
                    var id = module.activeColumn = coluid();

                    Cryptpad.setPadAttribute('column', id, function (err) {
                        if (err) {
                            console.error("Couldn't remember your column id");
                            return;
                        }

                        console.log(id);
                        makeUser(module.rt.proxy, id, name).focus().val(name);
                        makeUserEditable(id, true);
                    });
                });
            };

            if (column === null) {
                //console.log("Looks like you're new to this poll, why don't you make a column");
                promptForName();
                return;
            }

            // column might be defined, but that column might have been deleted...
            if (proxy.table.colsOrder.indexOf(column) === -1) {
                promptForName();
                return;
            }

            // if column is defined, then you can just make that column editable
            makeUserEditable(column, true);
        });
    };

    var config = {
        websocketURL: Config.websocketURL,
        channel: secret.channel,
        data: {},
        crypto: Crypto.createEncryptor(secret.key),
    };

    // don't initialize until the store is ready.
    Cryptpad.ready(function () {

        var rt = module.rt = Listmap.create(config);
        rt.proxy.on('create', function (info) {
            var realtime = module.realtime = info.realtime;
            window.location.hash = info.channel + secret.key;
            module.patchText = TextPatcher.create({
                realtime: realtime,
                logging: true,
            });
        }).on('ready', ready)
        .on('disconnect', function () {
            setEditable(false);
            Cryptpad.alert("Network connection lost!");
        });
    });

});
