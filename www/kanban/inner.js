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
    'css!/kanban/jkanban.css',
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

    var addRemoveItemButton = function (framework, kanban) {
        if (framework.isReadOnly() || framework.isLocked()) { return; }
        var $container = $(kanban.element);
        $container.find('.kanban-remove-item').remove();
        $container.find('.kanban-board .kanban-item').each(function (i, el) {
            var pos = kanban.findElementPosition(el);
            var board = kanban.options.boards.find(function (b) {
                return b.id === $(el.parentNode.parentNode).attr('data-id');
            });
            $('<button>', {'class': 'kanban-remove-item btn btn-default'}).click(function (e) {
                e.stopPropagation();
                board.item.splice(pos, 1);
                $(el).remove();
                kanban.onChange();
            }).text('❌').appendTo($(el));
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
            });
        };

        var kanban = new window.jKanban({
            element: '#cp-app-kanban-content',
            gutter: '15px',
            widthBoard: '300px',
            buttonContent: '❌',
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
                    verbose("An edit is already active");
                    return;
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
                    var board = $(el.parentNode.parentNode).attr("data-id");
                    var pos = kanban.findElementPosition(el);
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
                    verbose("An edit is already active");
                    return;
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
            colorClick: function (el) {
                if (framework.isReadOnly() || framework.isLocked()) { return; }
                verbose("in color click");
                var board = $(el.parentNode).attr("data-id");
                var boardJSON = kanban.getBoardJSON(board);
                var currentColor = boardJSON.color;
                verbose("Current color " + currentColor);
                var index = kanban.options.colors.findIndex(function (element) {
                    return (element === currentColor);
                }) + 1;
                verbose("Next index " + index);
                if (index >= kanban.options.colors.length) { index = 0; }
                var nextColor = kanban.options.colors[index];
                verbose("Next color " + nextColor);
                boardJSON.color = nextColor;
                $(el).removeClass("kanban-header-" + currentColor);
                $(el).addClass("kanban-header-" + nextColor);
                kanban.onChange();
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
                    verbose("An edit is already active");
                    return;
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
                        kanban.inEditMode = false;
                        return;
                    }
                });
            },
            addItemButton: true,
            boards: boards,
            /*dragcancelEl: function (el, boardId) {
                var pos = kanban.findElementPosition(el);
                UI.confirm(Messages.kanban_deleteItem, function (yes) {
                    if (!yes) { return; }
                    var board;
                    kanban.options.boards.some(function (b) {
                        if (b.id === boardId) {
                            return (board = b);
                        }
                    });
                    if (!board) { return; }
                    board.item.splice(pos, 1);
                    $(el).remove();
                    kanban.onChange();
                });
            }*/
        });

        var addBoardDefault = document.getElementById('kanban-addboard');
        addBoardDefault.addEventListener('click', function () {
            if (framework.isReadOnly()) { return; }
            var counter = 1;

            // Get the new board id
            var boardExists = function (b) { return b.id === "board" + counter; };
            while (kanban.options.boards.some(boardExists)) { counter++; }

            kanban.addBoards([{
                "id": "board" + counter,
                "title": Messages.kanban_newBoard,
                "color": "yellow",
                "item": [{
                    "title": Messages._getKey('kanban_item', [1]),
                }]
            }]);
            kanban.onChange();
        });

        return kanban;
    };

    // Start of the main loop
    var andThen2 = function (framework) {

        var kanban;
        var $container = $('#cp-app-kanban-content');

        if (framework.isReadOnly()) {
            $container.addClass('cp-app-readonly');
        }
        framework.onEditableChange(function (unlocked) {
            if (framework.isReadOnly()) { return; }
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
            if (!kanban) { return; }
            var content = kanban.getBoardsJSON();
            verbose("Content current value is " + content);
            return {
                content: content
            };
        });

        framework.onReady(function () {
            $("#cp-app-kanban-content").focus();
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
