define([
    'jquery',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-app-framework.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/modes.js',
    '/customize/messages.js',
    '/kanban/jkanban.js',
    'css!/kanban/jkanban.css',
], function (
    $,
    nThen,
    SFCommon,
    Framework,
    Util,
    Hash,
    Modes,
    Messages) {

    // Kanban code
    var initKanban = function (framework, boards) {
        var defaultBoards = [
            {
                "id": "todo",
                "title": "To Do",
                "color": "blue",
                "item": [
                    {
                        "title": "Item 1"
                    },
                    {
                        "title": "Item 2"
                    }
	]
   },
            {
                "id": "working",
                "title": "Working",
                "color": "orange",
                "item": [
                    {
                        "title": "Item 3",
	},
                    {
                        "title": "Item 4",
	}
	]
   },
            {
                "id": "done",
                "title": "Done",
                "color": "green",
                "item": [
                    {
                        "title": "Item 5",
	},
                    {
                        "title": "Item 6",
	}
	]
   }];

        if (boards == null) {
            console.log("Initializing with default boards content");
            boards = defaultBoards;
        } else {
            console.log("Initializing with boards content " + boards);
        }

        // Remove any existing elements
        $(".kanban-container-outer").remove();

        var kanban = new jKanban({
            element: '#cp-app-kanban-content',
            gutter: '15px',
            widthBoard: '300px',
            onChange: function () {
                console.log("Board object has changed");
                framework.localChange();
            },
            click: function (el) {
                if (kanban.inEditMode) {
                    console.log("An edit is already active");
                    return;
                }
                kanban.inEditMode = true;
                var name = $(el).text();
                $(el).html('');
                $('<input></input>')
                    .attr({
                        'type': 'text',
                        'name': 'text',
                        'id': 'kanban_edit',
                        'size': '30',
                        'value': name
                    })
                    .appendTo(el);
                $('#kanban_edit').focus();
                $('#kanban_edit').blur(function () {
                    var name = $('#kanban_edit').val();
                    $(el).text(name);
                    var board = $(el.parentNode.parentNode).attr("data-id");
                    var pos = kanban.findElementPosition(el);
                    console.log(pos);
                    console.log(board);
                    kanban.getBoardJSON(board).item[pos].title = name;
                    kanban.onChange();
                    kanban.inEditMode = false;
                });

            },
            boardTitleClick: function (el) {
                if (kanban.inEditMode) {
                    console.log("An edit is already active");
                    return;
                }
                kanban.inEditMode = true;
                var name = $(el).text();
                $(el).html('');
                $('<input></input>')
                    .attr({
                        'type': 'text',
                        'name': 'text',
                        'id': 'kanban_edit',
                        'size': '30',
                        'value': name
                    })
                    .appendTo(el);
                $('#kanban_edit').focus();
                $('#kanban_edit').blur(function () {
                    var name = $('#kanban_edit').val();
                    $(el).text(name);
                    var board = $(el.parentNode.parentNode).attr("data-id");
                    kanban.getBoardJSON(board).title = name;
                    kanban.onChange();
                    kanban.inEditMode = false;
                });

            },
            colorClick: function (el, boardId) {
                console.log("in color click");
                var board = $(el.parentNode).attr("data-id");
                var boardJSON = kanban.getBoardJSON(board);
                var currentColor = boardJSON.color;
                console.log("Current color " + currentColor);
                var index = kanban.options.colors.findIndex(function (element) {
                    return (element == currentColor)
                }) + 1;
                console.log("Next index " + index);
                if (index >= kanban.options.colors.length)
                    index = 0;
                var nextColor = kanban.options.colors[index];
                console.log("Next color " + nextColor);
                boardJSON.color = nextColor;
                $(el).removeClass("kanban-header-" + currentColor);
                $(el).addClass("kanban-header-" + nextColor);
                kanban.onChange();

            },
            removeClick: function (el, boardId) {
                if (confirm("Do you want to delete this board?")) {
                    console.log("Delete board");
                    var boardName = $(el.parentNode.parentNode).attr("data-id");
                    for (index in kanban.options.boards) {
                        if (kanban.options.boards[index].id == boardName) {
                            break;
                        }
                        index++;
                    }
                    kanban.options.boards.splice(index, 1);
                    kanban.removeBoard(boardName);
                    kanban.onChange();
                }
            },
            buttonClick: function (el, boardId) {
                console.log(el);
                console.log(boardId);
                // create a form to enter element 
                var formItem = document.createElement('form');
                formItem.setAttribute("class", "itemform");
                formItem.innerHTML = '<div class="form-group"><textarea class="form-control" rows="2" autofocus></textarea></div><div class="form-group"><button type="submit" class="btn btn-primary btn-xs">Submit</button><button type="button" id="CancelBtn" class="btn btn-default btn-xs pull-right">Cancel</button></div>'

                kanban.addForm(boardId, formItem);
                formItem.addEventListener("submit", function (e) {
                    e.preventDefault();
                    var text = e.target[0].value
                    kanban.addElement(boardId, {
                        "title": text,
                    })
                    formItem.parentNode.removeChild(formItem);
                });
                document.getElementById('CancelBtn').onclick = function () {
                    formItem.parentNode.removeChild(formItem)
                }
            },
            addItemButton: true,
            boards: boards
        });

        var addBoardDefault = document.getElementById('kanban-addboard');
        addBoardDefault.addEventListener('click', function () {
            var counter = 1;
            found = false;
            while (found) {
                for (var board in kanban.options.boards) {
                    if (board.id == "board" + counter) {
                        counter++;
                        break;
                    }
                }
                found = true;
            }

            kanban.addBoards(
				[{
                    "id": "board" + counter,
                    "title": "New Board",
                    "color": "yellow",
                    "item": [
                        {
                            "title": "Item 1",
				}
				]
				}]
            )
            kanban.onChange();
        });

        return kanban;
    };

    // Start of the main loop
    var andThen2 = function (framework) {

        var kanban = initKanban(framework);  

        framework.onContentUpdate(function (newContent) {
            // Need to update the content
            console.log("Content should be updated to " + newContent);
            var currentContent = kanban.getBoardsJSON();
            var remoteContent = newContent.content;
            
            if (currentContent !== remoteContent) { 
               // reinit kanban (TODO: optimize to diff only)
               console.log("Content is different.. Applying content");
               kanban.setBoards(remoteContent);
            }
        });

        framework.setContentGetter(function () {
            // var content = $("#cp-app-kanban-content").val();
            var content = kanban.getBoardsJSON();
            console.log("Content current value is " + content);
            return {
                content: content
            };
        });

        framework.onReady(function (newPad) {          
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
            }, waitFor(function (fw) {
                framework = fw;
                andThen2(framework);
            }));
        });
    };
    main();
});
