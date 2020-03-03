define([
    'jquery',
    'json.sortify',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-app-framework.js',
    '/common/sframe-common-codemirror.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/modes.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/common/text-cursor.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/bower_components/marked/marked.min.js',
    'cm/lib/codemirror',

    'cm/mode/gfm/gfm',

    'css!/bower_components/codemirror/lib/codemirror.css',
    'css!/bower_components/codemirror/addon/dialog/dialog.css',
    'css!/bower_components/codemirror/addon/fold/foldgutter.css',



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
    SFCodeMirror,
    Util,
    Hash,
    UI,
    Modes,
    Messages,
    h,
    TextCursor,
    ChainPad,
    Marked,
    CodeMirror)
{

    var verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging

    Messages.kanban_title = "Title"; // XXX
    Messages.kanban_body = "Body"; // XXX
    Messages.kanban_color = "Color"; // XXX
    Messages.kanban_submit = "Submit"; // XXX
    Messages.kanban_delete = "Delete"; // XXX

// XXX
// Fix remote board deletion not applied to local UI
// Add colors...
// Add "large" view

    var setValueAndCursor = function (input, val, _cursor) {
        if (!input) { return; }
        var $input = $(input);
        var focus = _cursor || $input.is(':focus');
        var oldVal = $input.val();
        var ops = ChainPad.Diff.diff(_cursor.value || oldVal, val);

        var cursor = _cursor || input;

        var selects = ['selectionStart', 'selectionEnd'].map(function (attr) {
            return TextCursor.transformCursor(cursor[attr], ops);
        });
        $input.val(val);
        if (focus) { $input.focus(); }
        input.selectionStart = selects[0];
        input.selectionEnd = selects[1];
    };

    var addEditItemButton = function () {};
    var onRemoteChange = Util.mkEvent();
    var editModal;
    var PROPERTIES = ['title', 'body', 'tags', 'color'];
    var BOARD_PROPERTIES = ['title', 'color'];
    var createEditModal = function (framework, kanban) {
        var dataObject = {};
        var isBoard, id;

        var commit = function () {
            framework.localChange();
            kanban.setBoards(kanban.options.boards);
            addEditItemButton(framework, kanban);
        };
        if (editModal) { return editModal; }
        var titleInput, tagsDiv, colors, text;
        var content = h('div', [
            h('label', {for:'cp-kanban-edit-title'}, Messages.kanban_title),
            titleInput = h('input#cp-kanban-edit-title'),
            h('label', {for:'cp-kanban-edit-body'}, Messages.kanban_body),
            h('div#cp-kanban-edit-body', [
                text = h('textarea')
            ]),
            h('label', {for:'cp-kanban-edit-tags'}, Messages.fm_tagsName),
            tagsDiv = h('div#cp-kanban-edit-tags'),
            h('label', {for:'cp-kanban-edit-color'}, Messages.kanban_color),
            colors = h('div#cp-kanban-edit-colors'),
        ]);

        // Title
        var $title = $(titleInput);
        $title.on('change keyup', function () {
            dataObject.title = $title.val();
            commit();
        });
        var title = {
            getValue: function () {
                return $title.val();
            },
            setValue: function (val, preserveCursor) {
                if (!preserveCursor) {
                    $title.val(val);
                } else {
                    setValueAndCursor(titleInput, val);
                }
            }
        };

        // Body
        var editor = CodeMirror.fromTextArea(text, {
            lineWrapping: true,
            styleActiveLine : true,
            mode: "gfm"
        });
        var common = framework._.sfCommon;
        var markdownTb = common.createMarkdownToolbar(editor);
        $(text).before(markdownTb.toolbar);
        $(markdownTb.toolbar).show();
        editor.refresh();
        var body = {
            getValue: function () {
                return editor.getValue();
            },
            setValue: function (val, preserveCursor) {
                if (isBoard) { return; }
                if (!preserveCursor) {
                    setTimeout(function () {
                        editor.setValue(val || ' ');
                        editor.setValue(val || '');
                        editor.save();
                    });
                } else {
                    SFCodeMirror.setValueAndCursor(editor, editor.getValue(), val || '');
                }
            }
        };
        editor.on('change', function () {
            dataObject.body = editor.getValue();
            commit();
        });

        // Tags
        var getExisting = function () {
            var tags = [];
            var boards = kanban.options.boards || {};
            Object.keys(boards.items || {}).forEach(function (id) {
                var data = boards.items[id];
                if (!Array.isArray(data.tags)) { return; }
                data.tags.forEach(function (tag) {
                    if (tags.indexOf(tag) === -1) { tags.push(tag); }
                });
            });
            tags.sort();
            return tags;
        };
        var $tags = $(tagsDiv);
        var _field, initialTags;
        var tags = {
            getValue: function () {
                if (!_field) { return; }
                return _field.getTokens();
            },
            setValue: function (tags, preserveCursor) {
                if (isBoard) { return; }
                if (preserveCursor && initialTags && Sortify(tags || []) === initialTags) {
                    // Don't redraw if there is no change
                    return;
                }
                initialTags = Sortify(tags || []);
                $tags.empty();
                var input = UI.dialog.textInput();
                $tags.append(input);
                var existing = getExisting();
                _field = UI.tokenField(input, existing).preventDuplicates(function (val) {
                    UI.warn(Messages._getKey('tags_duplicate', [val]));
                });
                $tags.append(_field);
                _field.setTokens(tags || []);

                var commitTags = function () {
                    dataObject.tags = _field.getTokens();
                    initialTags = Sortify(dataObject.tags);
                    commit();
                };
                _field.tokenfield.on('tokenfield:createdtoken', commitTags);
                _field.tokenfield.on('tokenfield:editedoken', commitTags);
                _field.tokenfield.on('tokenfield:removedtoken', commitTags);
            }
        };

        // Colors
        var $colors = $(colors);
        var palette = [''];
        for (var i=1; i<=8; i++) { palette.push('color'+i); }
        var selectedColor = '';
        palette.forEach(function (color) {
            var $color = $(h('span.cp-kanban-palette.fa'));
            $color.addClass('cp-kanban-palette-'+(color || 'nocolor'));
            $color.click(function () {
                if (color === selectedColor) { return; }
                selectedColor = color;
                $colors.find('.cp-kanban-palette').removeClass('fa-check');
                var $col = $colors.find('.cp-kanban-palette-'+(color || 'nocolor'));
                $col.addClass('fa-check');

                dataObject.color = color;
                commit();
            }).appendTo($colors);
        });
        var color = {
            getValue: function () {
                return selectedColor;
            },
            setValue: function (color) {
                $colors.find('.cp-kanban-palette').removeClass('fa-check');
                var $col = $colors.find('.cp-kanban-palette-'+(color || 'nocolor'));
                $col.addClass('fa-check');
            }
        };

        var setId = function (_isBoard, _id) {
            isBoard = _isBoard;
            id = _id;
            if (_isBoard) {
                dataObject = kanban.getBoardJSON(id);
                $(content)
                    .find('#cp-kanban-edit-body, #cp-kanban-edit-tags, [for="cp-kanban-edit-body"], [for="cp-kanban-edit-tags"]')
                    .hide();
            } else {
                dataObject = kanban.getItemJSON(id);
                $(content)
                    .find('#cp-kanban-edit-body, #cp-kanban-edit-tags, [for="cp-kanban-edit-body"], [for="cp-kanban-edit-tags"]')
                    .show();
            }
        };

        var button = [{
            className: 'danger', // XXX align left
            name: Messages.kanban_delete,
            onClick: function () {
                var boards = kanban.options.boards || {};
                if (isBoard) {
                    var list = boards.list || [];
                    var idx = list.indexOf(id);
                    if (idx !== -1) { list.splice(idx, 1); }
                    delete (boards.data || {})[id];
                    return void commit();
                }
                Object.keys(boards.data || {}).forEach(function (boardId) {
                    var board = boards.data[boardId];
                    if (!board) { return; }
                    var items = board.item || [];
                    var idx = items.indexOf(id);
                    if (idx !== -1) { items.splice(idx, 1); }
                });
                delete (boards.items || {})[id];
                commit();
            },
            keys: []
        }, {
            className: 'primary',
            name: Messages.filePicker_close,
            onClick: function () {
            },
            keys: []
        }];
        var modal = UI.dialog.customModal(content, {
            buttons: button
        });

        onRemoteChange.reg(function () {
            if (isBoard) {
                dataObject = kanban.getBoardJSON(id);
            } else {
                dataObject = kanban.getItemJSON(id);
            }
            // Check if our itme has been deleted
            if (!dataObject) {
                var $frame = $(modal).parents('.alertify').first();
                if ($frame[0] && $frame[0].closeModal) {
                    $frame[0].closeModal();
                }
                return;
            }
            // Not deleted, apply updates
            PROPERTIES.forEach(function (type) {
                editModal[type].setValue(dataObject[type], true);
            });
        });

        return {
            modal: modal,
            setId: setId,
            title: title,
            body: body,
            tags: tags,
            color: color
        };
    };
    var getItemEditModal = function (framework, kanban, eid) {
        // Create modal if needed
        if (!editModal) { editModal = createEditModal(framework, kanban); }
        editModal.setId(false, eid);
        var boards = kanban.options.boards || {};
        var item = (boards.items || {})[eid];
        if (!item) { return void UI.warn(Messages.error); }
        PROPERTIES.forEach(function (type) {
            if (!editModal[type]) { return; }
            editModal[type].setValue(item[type]);
        });
        UI.openCustomModal(editModal.modal);
    };
    var getBoardEditModal = function (framework, kanban, id) {
        // Create modal if needed
        if (!editModal) { editModal = createEditModal(framework, kanban); }

        editModal.setId(true, id);
        var boards = kanban.options.boards || {};
        var board = (boards.data || {})[id];
        if (!board) { return void UI.warn(Messages.error); }
        BOARD_PROPERTIES.forEach(function (type) {
            if (!editModal[type]) { return; }
            editModal[type].setValue(board[type]);
        });
        UI.openCustomModal(editModal.modal);
    };

    addEditItemButton = function (framework, kanban) {
        if (!kanban) { return; }
        if (framework.isReadOnly() || framework.isLocked()) { return; }
        var $container = $(kanban.element);
        $container.find('.kanban-edit-item').remove();
        $container.find('.kanban-item').each(function (i, el) {
            var itemId = $(el).attr('data-eid');
            $('<button>', {
                'class': 'kanban-edit-item btn btn-default fa fa-pencil',
            }).click(function (e) {
                getItemEditModal(framework, kanban, itemId);
                e.stopPropagation();
            }).appendTo($(el));
        });
        $container.find('.kanban-board').each(function (i, el) {
            var itemId = $(el).attr('data-id');
            $('<button>', {
                'class': 'kanban-edit-item btn btn-default fa fa-pencil',
            }).click(function (e) {
                getBoardEditModal(framework, kanban, itemId);
                e.stopPropagation();
            }).appendTo($(el).find('.kanban-board-header'));
        });
    };

    // Kanban code
    var initKanban = function (framework, boards) {
        var items = {};
        for (var i=1; i<=6; i++) {
            items[i] = {
                id: i,
                title: Messages._getKey('kanban_item', [i])
            };
        }
        var defaultBoards = {
            list: [11, 12, 13],
            data: {
                "11": {
                    "id": 11,
                    "title": Messages.kanban_todo,
                    "color": "blue",
                    "item": [1, 2]
                },
                "12": {
                    "id": 12,
                    "title": Messages.kanban_working,
                    "color": "orange",
                    "item": [3, 4]
                },
                "13": {
                    "id": 13,
                    "title": Messages.kanban_done,
                    "color": "green",
                    "item": [5, 6]
                }
            },
            items: items
        };

        if (!boards) {
            verbose("Initializing with default boards content");
            boards = defaultBoards;
        } else if (Array.isArray(boards)) {
            // XXX also migrate colors!
            throw new Error("NEED MIGRATION"); // XXX
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
            readOnly: framework.isReadOnly(),
            onChange: function () {
                verbose("Board object has changed");
                framework.localChange();
                if (kanban) {
                    addEditItemButton(framework, kanban);
                }
            },
            click: function (el) {
                if (framework.isReadOnly() || framework.isLocked()) { return; }
                if (kanban.inEditMode) {
                    $(el).focus();
                    verbose("An edit is already active");
                    //return;
                }
                var eid = $(el).attr('data-eid');
                kanban.inEditMode = eid;
                var name = $(el).text();
                $(el).html('');

                // Add input
                var $input = getInput().val(name).appendTo(el).focus();
                $input[0].select();

                var save = function () {
                    // Store the value
                    var name = $input.val();
                    // Remove the input
                    $(el).text(name);
                    // Save the value for the correct board
                    var item = kanban.getItemJSON(eid);
                    item.title = name;
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
                        if (!$input.val()) { return; }
                        if (!$(el).closest('.kanban-item').is(':last-child')) { return; }
                        $(el).closest('.kanban-board').find('.kanban-title-button.fa-plus').click();
                        return;
                    }
                    if (e.which === 27) {
                        e.preventDefault();
                        e.stopPropagation();
                        $(el).text(name);
                        kanban.inEditMode = false;
                        addEditItemButton(framework, kanban);
                        return;
                    }
                });
                $input.on('change keyup', function () {
                    var item = kanban.getItemJSON(eid);
                    if (!item) { return; }
                    var name = $input.val();
                    item.title = name;
                    framework.localChange();
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
                var boardId = $(el).closest('.kanban-board').attr("data-id");
                kanban.inEditMode = boardId;

                var name = $(el).text();
                $(el).html('');
                var $input = getInput().val(name).appendTo(el).focus();
                $input[0].select();

                var save = function () {
                    // Store the value
                    var name = $input.val();
                    if (!name || !name.trim()) {
                        return kanban.onChange();
                    }
                    // Remove the input
                    $(el).text(name);
                    // Save the value for the correct board
                    kanban.getBoardJSON(boardId).title = name;
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
                $input.on('change keyup', function () {
                    var item = kanban.getBoardJSON(boardId);
                    if (!item) { return; }
                    var name = $input.val();
                    item.title = name;
                    framework.localChange();
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
            addItemClick: function (el) {
                if (framework.isReadOnly() || framework.isLocked()) { return; }
                if (kanban.inEditMode) {
                    $(el).focus();
                    verbose("An edit is already active");
                    //return;
                }
                kanban.inEditMode = "new";
                // create a form to enter element
                var boardId = $(el.parentNode.parentNode).attr("data-id");
                var $item = $('<div>', {'class': 'kanban-item new-item'});
                var $input = getInput().val(name).appendTo($item);
                kanban.addForm(boardId, $item[0]);
                $input.focus();
                var save = function () {
                    $item.remove();
                    kanban.inEditMode = false;
                    if (!$input.val()) { return; }
                    var id = Util.createRandomInteger();
                    kanban.addElement(boardId, {
                        "id": id,
                        "title": $input.val(),
                    });
                };
                $input.blur(save);
                $input.keydown(function (e) {
                    if (e.which === 13) {
                        e.preventDefault();
                        e.stopPropagation();
                        save();
                        if (!$input.val()) { return; }
                        $(el).closest('.kanban-board').find('.kanban-title-button.fa-plus').click();
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
            /*var counter = 1;

            // Get the new board id
            var boardExists = function (b) { return b.id === "board" + counter; };
            while (kanban.options.boards.some(boardExists)) { counter++; }
            */
            var id = Util.createRandomInteger();

            kanban.addBoard({
                "id": id,
                "title": Messages.kanban_newBoard,
                "item": []
            });
            kanban.onChange();
        });

        return kanban;
    };

    var mkHelpMenu = function (framework) {
        var $toolbarContainer = $('#cp-app-kanban-container');
        $toolbarContainer.prepend(framework._.sfCommon.getBurnAfterReadingWarning());

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
                addEditItemButton(framework, kanban);
                kanban.options.readOnly = false;
                return void $container.removeClass('cp-app-readonly');
            }
            kanban.options.readOnly = true;
            $container.addClass('cp-app-readonly');
        });

        var getCursor = function () {
            if (!kanban || !kanban.inEditMode) { return; }
            try {
                var id = kanban.inEditMode;
                var newBoard;
                var $el = $container.find('[data-id="'+id+'"]');
                if (id === "new") {
                    $el = $container.find('.kanban-item.new-item');
                    newBoard = $el.closest('.kanban-board').attr('data-id');
                } else if (!$el.length) {
                    $el = $container.find('[data-eid="'+id+'"]');
                }
                if (!$el.length) { return; }
                var $input = $el.find('input');
                if (!$input.length) { return; }
                var input = $input[0];

                var val = ($input.val && $input.val()) || '';
                var start = input.selectionStart;
                var end = input.selectionEnd;

                var json = kanban.getBoardJSON(id) || kanban.getItemJSON(id);
                // XXX only title for now...
                var oldVal = json && json.title;

                return {
                    id: id,
                    newBoard: newBoard,
                    value: val,
                    start: start,
                    end: end,
                    oldValue: oldVal
                };
            } catch (e) {
                console.error(e);
                return {};
            }
        };
        var restoreCursor = function (data) {
            if (!data) { return; }
            try {
                var id = data.id;

                // An item was being added: add a new item
                if (id === "new" && !data.oldValue) {
                    var $newBoard = $('.kanban-board[data-id="'+data.newBoard+'"]');
                    $newBoard.find('.kanban-title-button.fa-plus').click();
                    var $newInput = $newBoard.find('.kanban-item:last-child input');
                    $newInput.val(data.value);
                    $newInput[0].selectionStart = data.start;
                    $newInput[0].selectionEnd = data.end;
                    return;
                }

                // Edit a board title or a card title
                var $el = $container.find('.kanban-board[data-id="'+id+'"]');
                if (!$el.length) {
                    $el = $container.find('.kanban-item[data-eid="'+id+'"]');
                }
                if (!$el.length) { return; }

                var isBoard = true;
                var json = kanban.getBoardJSON(id);
                if (!json) {
                    isBoard = false;
                    json = kanban.getItemJSON(id);
                }

                // Editing a board or card title...
                $el.find(isBoard ? '.kanban-title-board' : '.kanban-item-text').click();
                var $input = $el.find('input');
                if (!$input.length) { return; }

                // if the value was changed by a remote user, abort
                setValueAndCursor($input[0], json.title, {
                    value: data.value,
                    selectionStart: data.start,
                    selectionEnd: data.end
                });
            } catch (e) {
                console.error(e);
                return;
            }
        };

        framework.onContentUpdate(function (newContent) {
            // Init if needed
            if (!kanban) {
                kanban = initKanban(framework, (newContent || {}).content);
                addEditItemButton(framework, kanban);
                return;
            }

            // Need to update the content
            verbose("Content should be updated to " + newContent);
            var currentContent = kanban.getBoardsJSON();
            var remoteContent = newContent.content;

            if (Sortify(currentContent) !== Sortify(remoteContent)) {
                var cursor = getCursor();
                verbose("Content is different.. Applying content");
                kanban.setBoards(remoteContent);
                kanban.inEditMode = false;
                addEditItemButton(framework, kanban);
                restoreCursor(cursor);
                onRemoteChange.fire();
            }
        });

        framework.setContentGetter(function () {
            if (!kanban) {
                return {
                    content: {}
                };
            }
            var content = kanban.getBoardsJSON();
            verbose("Content current value is " + content);
            return {
                content: content
            };
        });

        var cleanData = function (boards) {
            if (typeof(boards) !== "object") { return; }
            var items = boards.items || {};
            var data = boards.data || {};
            var list = boards.list || [];
            Object.keys(data).forEach(function (id) {
                if (list.indexOf(Number(id)) === -1) { delete data[id]; }
            });
            Object.keys(items).forEach(function (eid) {
                var exists = Object.keys(data).some(function (id) {
                    return (data[id].item || []).indexOf(Number(eid)) !== -1;
                });
                if (!exists) { delete items[eid]; }
            });
            framework.localChange();
        };

        framework.onReady(function () {
            $("#cp-app-kanban-content").focus();
            var content = kanban.getBoardsJSON();
            cleanData(content);
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
