define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/customize/messages.js?app=poll',
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    '/bower_components/hyperjson/hyperjson.js',
    '/poll/test/render.js',
    '/common/toolbar.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
    //'/customize/pad.js'
], function (Config, Messages, TextPatcher, Listmap, Crypto, Cryptpad, Hyperjson, Render, Toolbar) {
    var $ = window.jQuery;
    var APP = window.APP = {
        Toolbar: Toolbar,
        Hyperjson: Hyperjson,
        Render: Render,
        $bar: $('#toolbar').css({ border: '1px solid white', background: 'grey', 'margin-bottom': '1vh', }),
    };

    var sortColumns = function (order, firstcol) {
        var colsOrder = order.slice();
        colsOrder.sort(function (a, b) {
            return (a === firstcol) ? -1 :
                        ((b === firstcol) ? 1 : 0);
        });
        return colsOrder;
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
        if (proxy.table.colsOrder.indexOf(APP.userid) !== -1) {
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
        for (var k in uncommitted.table.cells) {
            if (!newObj.table.cells[k]) {
                newObj.table.cells[k] = uncommitted.table.cells[k];
            }
        }
        return newObj;
    };

    /*  Any time the realtime object changes, call this function */
    var change = function (o, n, path) {
        if (path && path.join) {
            console.log("Change from [%s] to [%s] at [%s]",
                o, n, path.join(', '));
        }

        var table = APP.$table[0];

        var displayedObj = mergeUncommitted(APP.proxy, APP.uncommitted);

        var colsOrder = sortColumns(displayedObj.table.colsOrder, APP.userid);
        var conf = {
            cols: colsOrder
        };

        Render.updateTable(table, displayedObj, conf);

        /*  FIXME browser autocomplete fills in new fields sometimes
            calling updateTable twice removes the autofilled in values
            setting autocomplete="off" is not reliable

            https://developer.mozilla.org/en-US/docs/Web/Security/Securing_your_site/Turning_off_form_autocompletion
        */
        window.setTimeout(function () {
            var displayedObj2 = mergeUncommitted(APP.proxy, APP.uncommitted);
            Render.updateTable(table, displayedObj2, conf);
        });
    };

    var getRealtimeId = function (input) {
        return input.getAttribute && input.getAttribute('data-rt-id');
    };

    /*  Called whenever an event is fired on an input element */
    var handleInput = function (input) {
        var type = input.type.toLowerCase();
        var id = getRealtimeId(input);

        console.log(input);

        var object = APP.proxy;

        var x = Render.getCoordinates(id)[0];
        if (type !== "row" && x === APP.userid && APP.proxy.table.colsOrder.indexOf(x) === -1) {
            object = APP.uncommitted;
        }

        switch (type) {
            case 'text':
                console.log("text[rt-id='%s'] [%s]", id, input.value);
                if (!input.value) { return void console.log("Hit enter?"); }
                Render.setValue(object, id, input.value);
                break;
            case 'checkbox':
                console.log("checkbox[tr-id='%s'] %s", id, input.checked);
                Render.setValue(object, id, input.checked);
                break;
            default:
                console.log("Input[type='%s']", type);
                break;
        }
    };

    /*  Called whenever an event is fired on a span */
    var handleSpan = function (span) {
        var id = span.getAttribute('data-rt-id');
        var type = Render.typeofId(id);
        if (type === 'row') {
            Render.removeRow(APP.proxy, id, function () {
                change();
            });
        } else if (type === 'col') {
            Render.removeColumn(APP.proxy, id, function () {
                change();
            });
        } else if (type === 'cell') {
            change();
        } else {
            console.log("UNHANDLED");
        }
    };

    var handleClick = function (e, isKeyup) {
        if (!APP.ready) { return; }
        var target = e && e.target;

        if (isKeyup) {
            console.log("Keyup!");
        }

        if (!target) { return void console.log("NO TARGET"); }

        var nodeName = target && target.nodeName;

        switch (nodeName) {
            case 'INPUT':
                handleInput(target);
                break;
            case 'SPAN':
            case 'LABEL':
                handleSpan(target);
                break;
            case undefined:
                //console.error(new Error("C'est pas possible!"));
                break;
            default:
                console.log(target, nodeName);
                break;
        }
    };

    /*
        Make sure that the realtime data structure has all the required fields
    */
    var prepareProxy = function (proxy, schema) {
        if (proxy && proxy.version === 1) { return; }
        console.log("Configuring proxy schema...");

        proxy.info = schema.info;
        proxy.table = schema.table;
        proxy.version = 1;
    };

    /*

    */
    var publish = APP.publish = function (bool) {
        if (!APP.ready || APP.proxy.published) { return; }
        APP.proxy.published = true;
        APP.$publish.hide();

        ['textarea', '#title'].forEach(function (sel) {
            $(sel).attr('disabled', bool);
        });
    };


    var copyObject = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    // special UI elements
    var $title = $('#title').attr('placeholder', Messages.poll_titleHint || 'title');
    var $description = $('#description').attr('placeholder', Messages.poll_descriptionHint || 'description');

    var items = [$title, $description];

    var ready = function (info, userid) {
        console.log("READY");
        console.log('userid: %s', userid);

        var proxy = APP.proxy;
        var uncommitted = APP.uncommitted = {};
        prepareProxy(proxy, copyObject(Render.Example));
        prepareProxy(uncommitted, copyObject(Render.Example));
        if (proxy.table.colsOrder.indexOf(userid) === -1 &&
                uncommitted.table.colsOrder.indexOf(userid) === -1) {
            uncommitted.table.colsOrder.unshift(userid);
        }

        var displayedObj = mergeUncommitted(proxy, uncommitted, false);

        var colsOrder = sortColumns(displayedObj.table.colsOrder, userid);


        var $table = APP.$table = $(Render.asHTML(displayedObj, null, colsOrder));
        var $createRow = APP.$createRow = $('#create-option').click(function () {
            // 
            console.error("BUTTON CLICKED! LOL");
            Render.createRow(proxy, function () {
                change();
            });
        });

        var $createCol = APP.$createCol = $('#create-user').click(function () {
            Render.createColumn(proxy, function () {
                change();
            });
        });

        //TODO
        var $commit = APP.$commit = $('#commit').click(function () {
            var uncommittedCopy = JSON.parse(JSON.stringify(APP.uncommitted));
            APP.uncommitted = {};
            prepareProxy(APP.uncommitted, copyObject(Render.Example));
            mergeUncommitted(proxy, uncommittedCopy, true);
            change();
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

        $('.realtime').append($table);

        $table
            .click(handleClick)
            .on('keyup', function (e) { handleClick(e, true); });

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
            })
            .on('change', ['table'], change)
            .on('remove', [], change);

        if (!proxy.published) {
            var $publish = APP.$publish = $('#publish')
                .show()
                .click(function () {
                    publish(true);
                });
        }

        APP.ready = true;
    };

    var secret = Cryptpad.getSecrets();

    var create = function (info) {
        var realtime = APP.realtime = info.realtime;

        var editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);

        APP.patchText = TextPatcher.create({
            realtime: realtime,
            logging: true,
        });

        var userList = info.userList;
        var config = {
            userData: {},
            readOnly: false,
            common: Cryptpad
        };
        toolbar = info.realtime.toolbar = Toolbar.create(APP.$bar, info.myID, info.realtime, info.getLag, userList, config);

        Cryptpad.replaceHash(editHash);
    };

    var disconnect = function () {
        //setEditable(false); // TODO
        //Cryptpad.alert(Messages.common_connectionLost); // TODO
    };

    var config = {
        websocketURL: Cryptpad.getWebsocketURL(),
        channel: secret.channel,
        data: {},
        // our public key
        validateKey: secret.keys.validateKey || undefined,
        //readOnly: readOnly,
        crypto: Crypto.createEncryptor(secret.keys),
    };

    // don't initialize until the store is ready.
    Cryptpad.ready(function () {
        var rt = window.rt = APP.rt = Listmap.create(config);
        APP.proxy = rt.proxy;
        rt.proxy
        .on('create', create)
        .on('ready', function (info) {
            Cryptpad.getPadAttribute('userid', function (e, userid) {
                if (e) { console.error(e); }
                if (userid === null) { userid = Render.coluid(); }
                APP.userid = userid;
                Cryptpad.setPadAttribute('userid', userid, function (e) {
                    ready(info, userid);
                });
            });
        })
        .on('disconnect', disconnect);
    });
});

