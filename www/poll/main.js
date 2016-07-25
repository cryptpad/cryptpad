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
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Messages, Table, Wizard, TextPatcher, Listmap, Crypto, Cryptpad, Visible, Notify) {
    var $ = window.jQuery;

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

    var module = window.APP = {};

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

    var find = function (map, path) {
        return (map && path.reduce(function (p, n) {
            return typeof p[n] !== 'undefined' && p[n];
        }, map)) || undefined;
    };

    var Input = function (opt) { return $('<input>', opt); };
    var Checkbox = function (id) {
        var p = parseXY(id);

        var proxy = module.rt.proxy;

        var $check = Input({
            id: id,
            name: id,
            type:'checkbox'
        }).click(function () {
            console.log("(%s, %s) => %s", p.x, p.y, $check[0].checked);
            proxy.table.cells[id] = $check[0].checked? 1: 0;
        });
        return $check;
    };
    var Text = function () { return Input({type:'text'}); };

    var table = module.table = Table($('#table'), xy);

    var setEditable = function (bool) {
        module.isEditable = bool;
        $('input, textarea').attr('disabled', !bool);
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

    var makeUser = function (proxy, id, value) {
        var $user = Input({
            id: id,
            type: 'text',
            placeholder: 'your name',
        }).on('keyup change', function () {
            proxy.table.cols[id] = $user.val() || "";
        });

        var $wrapper = $('<div>')
            .append($user)
            .append($('<span>', {
                'class': 'remove',
                'title': 'remove column', // TODO translate
            }).text('✖').click(function () {
                removeColumn(proxy, id);
                table.removeColumn(id);
            }));

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

        var $wrapper = $('<div>')
            .append($option)
            .append($('<span>', {
                'class': 'remove',
                'title': 'remove row', // TODO translate
            }).text('✖').click(function () {
                removeRow(proxy, id);
                table.removeRow(id);
            }));

        proxy.table.rows[id] = value || "";
        addIfAbsent(proxy.table.rowsOrder, id);

        var $row = table.addRow($wrapper, Checkbox, id);
        scrollDown($row.height());

        return $option;
    };

    $('#adduser').click(function () {
        if (!module.isEditable) { return; }
        var id = coluid();
        makeUser(module.rt.proxy, id).focus();
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

        var proxy = module.rt.proxy;

        // ensure that proxy.info and proxy.table exist
        ['info', 'table'].forEach(function (k) {
            if (typeof(proxy[k]) === 'undefined') { proxy[k] = {}; }
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
            var p = parseXY(uid);
            document.getElementById(uid).checked = proxy.table.cells[uid] ? true : false;
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
            notify();
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
                    el.checked = proxy.table.cells[id] ? true: false;
                    break;
                default:
                    console.log("[Table change] (%s => %s)@[%s]", o, n, p.join(', '));
                    break;
            }
        })
        .on('remove', [], function (o, p, root) {
            console.log("remove: (%s, [%s])", o, p.join(', '));
        })
        .on('disconnect', function (info) {
            setEditable(false);
        });

        var title = document.title = Cryptpad.getPadTitle();
        Cryptpad.rememberPad(title);

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
                Cryptpad.forgetPad(href);
                document.title = window.location.hash.slice(1, 9);
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
                    if (Cryptpad.causesNamingConflict(title)) {
                        Cryptpad.alert(Messages.renameConflict);
                        return;
                    }
                    Cryptpad.setPadTitle(title);
                    document.title = title;
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

        setEditable(true);
    };

    var config = {
        websocketURL: Config.websocketURL,
        channel: secret.channel,
        data: {},
        crypto: Crypto.createEncryptor(secret.key),
    };

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
