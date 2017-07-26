define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/common/toolbar2.js',
    '/common/cryptpad-common.js',
    '/todo/todo.js',

    //'/common/media-tag.js',
    //'/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less/cryptpad.less',
], function ($, Crypto, Listmap, Toolbar, Cryptpad, Todo) {
    var Messages = Cryptpad.Messages;

    var APP = window.APP = {};
    $(function () {

    var $iframe = $('#pad-iframe').contents();
    var $body = $iframe.find('body');
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var $list = $iframe.find('#tasksList');

    var onReady = function () {

        var todo = Todo.init(APP.lm.proxy, Cryptpad);

        var deleteTask = function(id) {
            todo.remove(id);

            var $els = $list.find('.cp-task').filter(function (i, el) {
                return $(el).data('id') === id;
            });
            $els.fadeOut(null, function () {
                $els.remove();
                $('.tippy-popper').remove();
            });
            //APP.display();
        };

        // TODO make this actually work, and scroll to bottom...
        var scrollTo = function (t) {
            var $list = $iframe.find('#tasksList');

            $list.animate({
                scrollTop: t,
            });
        };
        scrollTo = scrollTo;

        var makeCheckbox = function (id, cb) {
            var entry = APP.lm.proxy.data[id];
            var checked = entry.state === 1? 'cp-task-checkbox-checked fa-check-square-o': 'cp-task-checkbox-unchecked fa-square-o';

            var title = entry.state === 1?
                Messages.todo_markAsIncompleteTitle:
                Messages.todo_markAsCompleteTitle;

            return $('<span>', {
                'class': 'cp-task-checkbox fa ' + checked,
                title: title,
            }).on('click', function () {
                entry.state = (entry.state + 1) % 2;
                if (typeof(cb) === 'function') {
                    cb(entry.state);
                }
            });
        };

        var addTaskUI = function (el, animate) {
            var $taskDiv = $('<div>', {
                'class': 'cp-task'
            }).appendTo($list);
            $taskDiv.data('id', el);

            makeCheckbox(el, function (/*state*/) {
                APP.display();
            })
            .appendTo($taskDiv);

            var entry = APP.lm.proxy.data[el];

            if (entry.state) {
                $taskDiv.addClass('cp-task-complete');
            }

            $('<span>', { 'class': 'cp-task-text' })
                .text(entry.task)
                .appendTo($taskDiv);
          /*$('<span>', { 'class': 'cp-task-date' })
                .text(new Date(entry.ctime).toLocaleString())
                .appendTo($taskDiv);*/
            $('<button>', {
                'class': 'fa fa-times cp-task-remove btn btn-danger',
                title: Messages.todo_removeTaskTitle,
            }).appendTo($taskDiv).on('click', function() {
                deleteTask(el);
            });

            if (animate) {
                $taskDiv.hide();
                window.setTimeout(function () {
                    // ???
                    $taskDiv.fadeIn();
                }, 0);
            }
        };
        var display = APP.display = function () {
            $list.empty();
            $('.tippy-popper').remove();
            APP.lm.proxy.order.forEach(function (el) {
                addTaskUI(el);
            });
            //scrollTo('300px');
        };

        var addTask = function () {
            var $input = $iframe.find('#newTodoName');
            var obj = {
                "state": 0,
                "task": $input.val(),
                "ctime": +new Date(),
                "mtime": +new Date()
            };

            var id = Cryptpad.createChannelId();
            todo.add(id, obj);

            $input.val("");
            addTaskUI(id, true);
            //display();
        };

        var $formSubmit = $iframe.find('.cp-create-form button').on('click', addTask);
        $iframe.find('#newTodoName').on('keypress', function (e) {
            switch (e.which) {
                case 13:
                    $formSubmit.click();
                    break;
                default:
                    console.log(e.which);
            }
        }).focus();

        var editTask = function () {

        };
        editTask = editTask;

        display();
        Cryptpad.removeLoadingScreen();
    };

    var onInit = function () {
        Cryptpad.addLoadingScreen();

        $body.on('dragover', function (e) { e.preventDefault(); });
        $body.on('drop', function (e) { e.preventDefault(); });

        var Title;
        var $bar = $iframe.find('.toolbar-container');

        Title = Cryptpad.createTitle({}, function(){}, Cryptpad);

        var configTb = {
            displayed: ['useradmin', 'newpad', 'limit', 'upgrade', 'pageTitle'],
            ifrw: ifrw,
            common: Cryptpad,
            //hideDisplayName: true,
            $container: $bar,
            pageTitle: Messages.todo_title
        };

        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.html(''); // Remove the drawer if we don't use it to hide the toolbar
    };

    var createTodo = function() {
        var obj = Cryptpad.getProxy();
        var hash = Cryptpad.createRandomHash();

        if(obj.todo) {
            hash = obj.todo;
        } else {
            obj.todo = hash;
        }

        var secret = Cryptpad.getSecrets('todo', hash);

        var listmapConfig = {
            data: {},
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: secret.channel,
            validateKey: secret.keys.validateKey || undefined,
            crypto: Crypto.createEncryptor(secret.keys),
            userName: 'todo',
            logLevel: 1,
        };

        var lm = APP.lm = Listmap.create(listmapConfig);

        lm.proxy.on('create', onInit)
                .on('ready', onReady);
    };

    Cryptpad.ready(function () {
        createTodo();
        Cryptpad.reportAppUsage();
    });

    });
});
