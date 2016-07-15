define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/customize/messages.js',
    '/poll/table.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Messages, Table, TextPatcher, Listmap, Crypto, Cryptpad, Visible, Notify) {
    var $ = window.jQuery;

    /*  TODO
        * design a data structure for a collaborative date picker
        * add new input fields to the interface when they are found in the object
          but do not exist locally

        * set range of dates/times
          * (pair of date pickers)
        * hide options within that range
        * show hidden options
        * add notes to a particular time slot

        * check or uncheck options for a particular user
        * mark preference level?

        // let users choose what they want the default input to be...

        * date
          - http://foxrunsoftware.github.io/DatePicker/ ?
        * ???
    */

    var secret = Cryptpad.getSecrets();

    var module = window.APP = {};

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

    var table = module.table = Table($('table'), xy);
    var setEditable = function (bool) {
        module.isEditable = bool;
        items.forEach(function ($item) {
            $item.attr('disabled', !bool);
        });
    };

    var coluid = Uid('x');
    var rowuid = Uid('y');

    var makeUser = function (proxy, id, value) {
        var $user = Input({
            id: id,
            type: 'text',
            placeholder: 'your name',
        }).on('keyup', function () {
            proxy.table.cols[id] = $user.val() || "";
        });
        proxy.table.cols[id] = value || "";
        table.addColumn($user, Checkbox, id);
        return $user;
    };

    $('#adduser').click(function () {
        if (!module.isEditable) { return; }
        var id = coluid();
        makeUser(module.rt.proxy, id).focus();
    });

    var makeOption = function (proxy, id, value) {
        var $option = Input({
            type: 'text',
            placeholder: 'option',
            id: id,
        }).on('keyup change', function () {
            proxy.table.rows[id] = $option.val();
        });

        proxy.table.rows[id] = value || "";

        table.addRow($option, Checkbox, id);
        return $option;
    };

    $('#addoption').click(function () {
        if (!module.isEditable) { return; }
        var id = rowuid();
        makeOption(module.rt.proxy, id).focus();
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
        setEditable(true);

        var proxy = module.rt.proxy;

        ['info', 'table'].forEach(function (k) {
            if (typeof(proxy[k]) === 'undefined') { proxy[k] = {}; }
        });

        ['cols', 'rows', 'cells'].forEach(function (k) {
            if (typeof(proxy.table[k]) === 'undefined') { proxy.table[k] = {}; }
        });

        var each = function (o, f) {
            Object.keys(o).forEach(f);
        };

        // cols
        each(proxy.table.cols, function (uid) {
            var val = proxy.table.cols[uid];
            makeUser(proxy, uid, val).val(val);
        });

        // rows
        each(proxy.table.rows, function (uid) {
            var val = proxy.table.rows[uid];
            makeOption(proxy, uid, val).val(val);
        });

        // cells
        each(proxy.table.cells, function (uid) {
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
    }).on('ready', ready);
});
