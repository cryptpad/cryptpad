define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/sframe-chainpad-listmap.js',
    '/common/toolbar3.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-hash.js',
    '/todo/todo.js',
    '/customize/messages.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Crypto,
    Listmap,
    Toolbar,
    nThen,
    SFCommon,
    UI,
    Hash,
    Todo,
    Messages
    )
{
    var APP = window.APP = {};

    var common;
    var sFrameChan;
    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (/*waitFor*/) {
        var $body = $('body');
        var $list = $('#cp-app-todo-taskslist');

        var removeTips = function () {
            UI.clearTooltips();
        };

        var onReady = function () {
            var todo = Todo.init(APP.lm.proxy);

            var deleteTask = function(id) {
                todo.remove(id);

                var $els = $list.find('.cp-app-todo-task').filter(function (i, el) {
                    return $(el).data('id') === id;
                });
                $els.fadeOut(null, function () {
                    $els.remove();
                    removeTips();
                });
                //APP.display();
            };

            // TODO make this actually work, and scroll to bottom...
            var scrollTo = function (t) {
                $list.animate({
                    scrollTop: t,
                });
            };
            scrollTo = scrollTo;

            var makeCheckbox = function (id, cb) {
                var entry = APP.lm.proxy.data[id];
                var checked = entry.state === 1 ?
                    'cp-app-todo-task-checkbox-checked fa-check-square-o':
                    'cp-app-todo-task-checkbox-unchecked fa-square-o';

                var title = entry.state === 1?
                    Messages.todo_markAsIncompleteTitle:
                    Messages.todo_markAsCompleteTitle;
                    title = title;

                removeTips();
                return $('<span>', {
                    'class': 'cp-app-todo-task-checkbox fa ' + checked,
                    //title: title,
                }).on('click', function () {
                    entry.state = (entry.state + 1) % 2;
                    if (typeof(cb) === 'function') {
                        cb(entry.state);
                    }
                });
            };

            var addTaskUI = function (el, animate) {
                var $taskDiv = $('<div>', {
                    'class': 'cp-app-todo-task'
                });
                if (animate) {
                    $taskDiv.prependTo($list);
                } else {
                    $taskDiv.appendTo($list);
                }
                $taskDiv.data('id', el);

                makeCheckbox(el, function (/*state*/) {
                    APP.display();
                })
                .appendTo($taskDiv);

                var entry = APP.lm.proxy.data[el];

                if (entry.state) {
                    $taskDiv.addClass('cp-app-todo-task-complete');
                }

                $('<span>', { 'class': 'cp-app-todo-task-text' })
                    .text(entry.task)
                    .appendTo($taskDiv);
              /*$('<span>', { 'class': 'cp-app-todo-task-date' })
                    .text(new Date(entry.ctime).toLocaleString())
                    .appendTo($taskDiv);*/
                $('<button>', {
                    'class': 'fa fa-times cp-app-todo-task-remove btn btn-danger',
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
                removeTips();
            };
            var display = APP.display = function () {
                $list.empty();
                removeTips();
                APP.lm.proxy.order.forEach(function (el) {
                    addTaskUI(el);
                });
                //scrollTo('300px');
            };

            var addTask = function () {
                var $input = $('#cp-app-todo-newtodo');
                // if the input is empty after removing leading and trailing spaces
                // don't create a new entry
                if (!$input.val().trim()) { return; }

                var obj = {
                    "state": 0,
                    "task": $input.val(),
                    "ctime": +new Date(),
                    "mtime": +new Date()
                };

                var id = Hash.createChannelId();
                todo.add(id, obj);

                $input.val("");
                addTaskUI(id, true);
                //display();
            };

            var $formSubmit = $('.cp-app-todo-create-form button').on('click', addTask);
            $('#cp-app-todo-newtodo').on('keypress', function (e) {
                switch (e.which) {
                    case 13:
                        $formSubmit.click();
                        break;
                    default:
                        //console.log(e.which);
                }
            }).focus();

            var editTask = function () {

            };
            editTask = editTask;

            display();
            UI.removeLoadingScreen();
        };

        var onInit = function () {
            $body.on('dragover', function (e) { e.preventDefault(); });
            $body.on('drop', function (e) { e.preventDefault(); });

            var $bar = $('.cp-toolbar-container');

            var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle'];
            var configTb = {
                displayed: displayed,
                sfCommon: common,
                $container: $bar,
                pageTitle: Messages.todo_title,
                metadataMgr: common.getMetadataMgr(),
            };
            APP.toolbar = Toolbar.create(configTb);
            APP.toolbar.$rightside.hide();
        };
        var createTodo = function() {
            var listmapConfig = {
                data: {},
                common: common,
                userName: 'todo',
                logLevel: 1
            };

            var lm = APP.lm = Listmap.create(listmapConfig);

            lm.proxy.on('create', onInit)
                    .on('ready', onReady);
        };
        createTodo();
    });
});
