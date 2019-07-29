define([
    'jquery',
    'json.sortify',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-app-framework.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/modes.js',
    '/customize/messages.js',
    '/kanban/jkanban.js',
    '/common/jscolor.js',
    'css!/kanban/jkanban.css',

    'less!/kanban/app-kanban.less'
], function (
    $,
    Sortify,
    nThen,
    SFCommon,
    Framework,
    Util,
    Hash,
    UI,
    Modes,
    Messages)
{

    var verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging

    var COLORS = ['yellow', 'green', 'orange', 'blue', 'red', 'purple', 'cyan', 'lightgreen', 'lightblue'];

    var addRemoveItemButton = function (framework, kanban) {
        if (!kanban) { return; }
        if (framework.isReadOnly() || framework.isLocked()) { return; }
        var $container = $(kanban.element);
        $container.find('.kanban-remove-item').remove();
        $container.find('.kanban-board .kanban-item').each(function (i, el) {
            var pos = kanban.findElementPosition(el);
            var board = kanban.options.boards.find(function (b) {
                return b.id === $(el.parentNode.parentNode).attr('data-id');
            });
            $('<button>', {
                'class': 'kanban-remove-item btn btn-default fa fa-times',
                title: Messages.kanban_removeItem
            }).click(function (e) {
                e.stopPropagation();
                UI.confirm(Messages.kanban_removeItemConfirm, function (yes) {
                    if (!yes) { return; }
                    board.item.splice(pos, 1);
                    $(el).remove();
                    kanban.onChange();
                });
            }).appendTo($(el));
        });
    };

    // Kanban code
    var initKanban = function (framework, boards) {
        var defaultBoards = [{
            "id": "todo",
            "title": Messages.kanban_todo,
            "color": "blue",
            "item": [{
                "title": Messages._getKey('kanban_item', [1])
            }, {
                "title": Messages._getKey('kanban_item', [2])
            }]
        }, {
            "id": "working",
            "title": Messages.kanban_working,
            "color": "orange",
            "item": [{
                "title": Messages._getKey('kanban_item', [3])
            }, {
                "title": Messages._getKey('kanban_item', [4])
            }]
        }, {
            "id": "done",
            "title": Messages.kanban_done,
            "color": "green",
            "item": [{
                "title": Messages._getKey('kanban_item', [5])
            }, {
                "title": Messages._getKey('kanban_item', [6])
            }]
        }];

        if (!boards) {
            verbose("Initializing with default boards content");
            boards = defaultBoards;
        } else {
            verbose("Initializing with boards content " + boards);
        }

        // Remove any existing elements
        $(".kanban-container-outer").remove();

        var getInput = function () {
            return $('<input>', {
                'type': 'text',
                'id': 'kanban-edit',
                'size': '30'
            }).click(function (e) { e.stopPropagation(); });
        };

        var kanban = new window.jKanban({
            element: '#cp-app-kanban-content',
            gutter: '5px',
            widthBoard: '300px',
            buttonContent: '❌',
            colors: COLORS,
            readOnly: framework.isReadOnly(),
            onChange: function () {
                verbose("Board object has changed");
                framework.localChange();
                if (kanban) {
                    addRemoveItemButton(framework, kanban);
                }
            },
            click: function (el) {
                if (framework.isReadOnly() || framework.isLocked()) { return; }
                if (kanban.inEditMode) {
                    $(el).focus();
                    verbose("An edit is already active");
                    //return;
                }
                kanban.inEditMode = true;
                $(el).find('button').remove();
                var name = $(el).text();
                $(el).html('');
                var $input = getInput().val(name).appendTo(el).focus();
                $input[0].select();
                var save = function () {
                    // Store the value
                    var name = $input.val();
                    // Remove the input
                    $(el).text(name);
                    // Save the value for the correct board
                    var board = $(el.parentNode.parentNode.parentNode).attr("data-id");
                    var pos = kanban.findElementPosition(el.parentNode);
                    kanban.getBoardJSON(board).item[pos].title = name;
                    kanban.onChange();
                    // Unlock edit mode
                    kanban.inEditMode = false;
                };
                $input.blur(save);
                $input.keydown(function (e) {
                    if (e.which === 13) {
                        e.preventDefault();
                        e.stopPropagation();
                        save();
                        return;
                    }
                    if (e.which === 27) {
                        e.preventDefault();
                        e.stopPropagation();
                        $(el).text(name);
                        kanban.inEditMode = false;
                        addRemoveItemButton(framework, kanban);
                        return;
                    }
                });

            },
            boardTitleClick: function (el, e) {
                e.stopPropagation();
                if (framework.isReadOnly() || framework.isLocked()) { return; }
                if (kanban.inEditMode) {
                    $(el).focus();
                    verbose("An edit is already active");
                    //return;
                }
                kanban.inEditMode = true;
                var name = $(el).text();
                $(el).html('');
                var $input = getInput().val(name).appendTo(el).focus();
                $input[0].select();
                var save = function () {
                    // Store the value
                    var name = $input.val();
                    // Remove the input
                    $(el).text(name);
                    // Save the value for the correct board
                    var board = $(el.parentNode.parentNode).attr("data-id");
                    kanban.getBoardJSON(board).title = name;
                    kanban.onChange();
                    // Unlock edit mode
                    kanban.inEditMode = false;
                };
                $input.blur(save);
                $input.keydown(function (e) {
                    if (e.which === 13) {
                        e.preventDefault();
                        e.stopPropagation();
                        save();
                        return;
                    }
                    if (e.which === 27) {
                        e.preventDefault();
                        e.stopPropagation();
                        $(el).text(name);
                        kanban.inEditMode = false;
                        return;
                    }
                });
            },
            colorClick: function (el, type) {
                if (framework.isReadOnly() || framework.isLocked()) { return; }
                verbose("on color click");
                var boardJSON;
                var board;
                if (type === "board") {
                    verbose("board color click");
                    board = $(el.parentNode).attr("data-id");
                    boardJSON = kanban.getBoardJSON(board);
                } else {
                    verbose("item color click");
                    board = $(el.parentNode.parentNode).attr("data-id");
                    var pos = kanban.findElementPosition(el);
                    boardJSON = kanban.getBoardJSON(board).item[pos];
                }
                var onchange = function (colorL) {
                    var elL = el;
                    var typeL = type;
                    var boardJSONL;
                    var boardL;
                    if (typeL === "board") {
                        verbose("board color change");
                        boardL = $(elL.parentNode).attr("data-id");
                        boardJSONL = kanban.getBoardJSON(boardL);
                    } else {
                        verbose("item color change");
                        boardL = $(elL.parentNode.parentNode).attr("data-id");
                        var pos = kanban.findElementPosition(elL);
                        boardJSONL = kanban.getBoardJSON(boardL).item[pos];
                    }
                    var currentColor = boardJSONL.color;
                    verbose("Current color " + currentColor);
                    if (currentColor !== colorL.toString()) {
                        $(elL).removeClass("kanban-header-" + currentColor);
                        boardJSONL.color = colorL.toString();
                        kanban.onChange();
                    }
                };
                var jscolorL;
                el._jscLinkedInstance = undefined;
                jscolorL = new window.jscolor(el,{showOnClick: false, onFineChange: onchange, valueElement:undefined});
                jscolorL.show();
                var currentColor = boardJSON.color;
                if (currentColor === undefined) {
                    currentColor = '';
                }
                jscolorL.fromString(currentColor);
            },
            buttonClick: function (el, boardId, e) {
                e.stopPropagation();
                if (framework.isReadOnly() || framework.isLocked()) { return; }
                UI.confirm(Messages.kanban_deleteBoard, function (yes) {
                    if (!yes) { return; }
                    verbose("Delete board");
                    //var boardName = $(el.parentNode.parentNode).attr("data-id");
                    for (var index in kanban.options.boards) {
                        if (kanban.options.boards[index].id === boardId) {
                            break;
                        }
                        index++;
                    }
                    kanban.options.boards.splice(index, 1);
                    kanban.removeBoard(boardId);
                    kanban.onChange();
                });
            },
            addItemClick: function (el) {
                if (framework.isReadOnly() || framework.isLocked()) { return; }
                if (kanban.inEditMode) {
                    $(el).focus();
                    verbose("An edit is already active");
                    //return;
                }
                kanban.inEditMode = true;
                // create a form to enter element
                var boardId = $(el.parentNode.parentNode).attr("data-id");
                var $item = $('<div>', {'class': 'kanban-item'});
                var $input = getInput().val(name).appendTo($item);
                kanban.addForm(boardId, $item[0]);
                $input.focus();
                var save = function () {
                    $item.remove();
                    kanban.inEditMode = false;
                    if (!$input.val()) { return; }
                    kanban.addElement(boardId, {
                        "title": $input.val(),
                    });
                };
                $input.blur(save);
                $input.keydown(function (e) {
                    if (e.which === 13) {
                        e.preventDefault();
                        e.stopPropagation();
                        save();
                        return;
                    }
                    if (e.which === 27) {
                        e.preventDefault();
                        e.stopPropagation();
                        $item.remove();
                        kanban.inEditMode = false;
                        return;
                    }
                });
            },
            addItemButton: true,
            boards: boards
        });

        var addBoardDefault = document.getElementById('kanban-addboard');
        $(addBoardDefault).attr('title', Messages.kanban_addBoard);
        addBoardDefault.addEventListener('click', function () {
            if (framework.isReadOnly()) { return; }
            var counter = 1;

            // Get the new board id
            var boardExists = function (b) { return b.id === "board" + counter; };
            while (kanban.options.boards.some(boardExists)) { counter++; }

            kanban.addBoards([{
                "id": "board" + counter,
                "title": Messages.kanban_newBoard,
                "color": COLORS[Math.floor(Math.random()*COLORS.length)], // random color
                "item": [{
                    "title": Messages._getKey('kanban_item', [1]),
                }]
            }]);
            kanban.onChange();
        });

        return kanban;
    };

    var mkHelpMenu = function (framework) {
        var $toolbarContainer = $('#cp-app-kanban-container');
        var helpMenu = framework._.sfCommon.createHelpMenu(['kanban']);
        $toolbarContainer.prepend(helpMenu.menu);

        framework._.toolbar.$drawer.append(helpMenu.button);
    };

    // Start of the main loop
    var andThen2 = function (framework) {

        var kanban;
        var $container = $('#cp-app-kanban-content');

        mkHelpMenu(framework);

        if (framework.isReadOnly()) {
            $container.addClass('cp-app-readonly');
        } else {
            framework.setFileImporter({}, function (content /*, file */) {
                var parsed;
                try { parsed = JSON.parse(content); }
                catch (e) { return void console.error(e); }
                return { content: parsed };
            });
        }

        framework.setFileExporter('.json', function () {
            return new Blob([JSON.stringify(kanban.getBoardsJSON(), 0, 2)], {
                type: 'application/json',
            });
        });

        framework.onEditableChange(function (unlocked) {
            if (framework.isReadOnly()) { return; }
            if (!kanban) { return; }
            if (unlocked) {
                addRemoveItemButton(framework, kanban);
                kanban.options.readOnly = false;
                return void $container.removeClass('cp-app-readonly');
            }
            kanban.options.readOnly = true;
            $container.addClass('cp-app-readonly');
        });

        framework.onContentUpdate(function (newContent) {
            // Init if needed
            if (!kanban) {
                kanban = initKanban(framework, (newContent || {}).content);
                addRemoveItemButton(framework, kanban);
                return;
            }

            // Need to update the content
            verbose("Content should be updated to " + newContent);
            var currentContent = kanban.getBoardsJSON();
            var remoteContent = newContent.content;

            if (Sortify(currentContent) !== Sortify(remoteContent)) {
                // reinit kanban (TODO: optimize to diff only)
                verbose("Content is different.. Applying content");
                kanban.setBoards(remoteContent);
                kanban.inEditMode = false;
                addRemoveItemButton(framework, kanban);
            }
        });

        framework.setContentGetter(function () {
            if (!kanban) {
                return {
                    content: []
                };
            }
            var content = kanban.getBoardsJSON();
            verbose("Content current value is " + content);
            return {
                content: content
            };
        });

        framework.onReady(function () {
            $("#cp-app-kanban-content").focus();
        });

        framework.onDefaultContentNeeded(function () {
            kanban = initKanban(framework);
        });

        framework.start();
    };

    var main = function () {
        // var framework;
        nThen(function (waitFor) {

            // Framework initialization
            Framework.create({
                toolbarContainer: '#cme_toolbox',
                contentContainer: '#cp-app-kanban-editor',
            }, waitFor(function (framework) {
                andThen2(framework);
            }));
        });
    };
    main();
});
