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
    '/common/common-ui-elements.js',
    '/common/inner/common-mediatag.js',
    '/common/modes.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/common/text-cursor.js',
    '/common/diffMarked.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/bower_components/marked/marked.min.js',
    'cm/lib/codemirror',

    'cm/mode/gfm/gfm',

    'css!/bower_components/codemirror/lib/codemirror.css',
    'css!/bower_components/codemirror/addon/dialog/dialog.css',
    'css!/bower_components/codemirror/addon/fold/foldgutter.css',



    '/kanban/jkanban.js',
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
    UIElements,
    MT,
    Modes,
    Messages,
    h,
    TextCursor,
    DiffMd,
    ChainPad,
    Marked,
    CodeMirror)
{

    var verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging
    var onRedraw = Util.mkEvent();
    var onCursorUpdate = Util.mkEvent();
    var remoteCursors = {};

    var setValueAndCursor = function (input, val, _cursor) {
        if (!input) { return; }
        var $input = $(input);
        var focus = _cursor || $input.is(':focus');
        var oldVal = $input.val();
        var ops = ChainPad.Diff.diff(_cursor ? _cursor.value : oldVal, val);

        var cursor = _cursor || input;

        var selects = ['selectionStart', 'selectionEnd'].map(function (attr) {
            return TextCursor.transformCursor(cursor[attr], ops);
        });
        $input.val(val);
        if (focus) { $input.focus(); }
        input.selectionStart = selects[0];
        input.selectionEnd = selects[1];
    };

    var getTextColor = function (hex) {
        if (hex && /^#/.test(hex)) { hex = hex.slice(1); }
        if (!/^[0-9a-f]{6}$/i.test(hex)) {
            return '#000000';
        }
        var r = parseInt(hex.slice(0,2), 16);
        var g = parseInt(hex.slice(2,4), 16);
        var b = parseInt(hex.slice(4,6), 16);
        if ((r*0.213 + g*0.715 + b*0.072) > 255/2) {
            return '#000000';
        }
        return '#FFFFFF';
    };

    var getAvatar = function (cursor, noClear) {
        // Tippy
        var html = MT.getCursorAvatar(cursor);

        var l = Util.getFirstCharacter(cursor.name || Messages.anonymous);

        var text = '';
        if (cursor.color) {
            text = 'color:'+getTextColor(cursor.color)+';';
        }
        var avatar = h('span.cp-cursor.cp-tippy-html', {
            style: "background-color: " + (cursor.color || 'red') + ";"+text,
            'data-cptippy-html': true,
            title: html
        }, l);
        if (!noClear) {
            cursor.clear = function () {
                $(avatar).remove();
            };
        }
        return avatar;
    };

    var getExistingTags = function (boards) {
        var tags = [];
        boards = boards || {};
        Object.keys(boards.items || {}).forEach(function (id) {
            var data = boards.items[id];
            if (!Array.isArray(data.tags)) { return; }
            data.tags.forEach(function (_tag) {
                var tag = _tag.toLowerCase();
                if (tags.indexOf(tag) === -1) { tags.push(tag); }
            });
        });
        tags.sort();
        return tags;
    };

    var addEditItemButton = function () {};
    var onRemoteChange = Util.mkEvent();
    var editModal;
    var PROPERTIES = ['title', 'body', 'tags', 'color'];
    var BOARD_PROPERTIES = ['title', 'color'];
    var createEditModal = function (framework, kanban) {
        if (framework.isReadOnly()) { return; }
        if (editModal) { return editModal; }

        var dataObject = {};
        var isBoard, id;
        var offline = false;

        var update = Util.throttle(function () {
            kanban.setBoards(kanban.options.boards);
            addEditItemButton(framework, kanban);
        }, 400);

        var commit = function () {
            framework.localChange();
            update();
        };

        var conflicts, conflictContainer, titleInput, tagsDiv, colors, text;
        var content = h('div', [
            conflictContainer = h('div#cp-kanban-edit-conflicts', [
                h('div', Messages.kanban_conflicts),
                conflicts = h('div.cp-kanban-cursors')
            ]),
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
        var $tags = $(tagsDiv);

        var $conflict = $(conflicts);
        var $cc = $(conflictContainer);
        var conflict = {
            setValue: function () {
                $conflict.empty();
                var i = 0;
                $cc.hide();
                Object.keys(remoteCursors).forEach(function (nid) {
                    var c = remoteCursors[nid];
                    var avatar = getAvatar(c, true);
                    if (Number(c.item) === Number(id) || Number(c.board) === Number(id)) {
                        $conflict.append(avatar);
                        i++;
                    }
                });
                if (!i) { return; }
                $cc.show();
            }
        };

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
            allowDropFileTypes: [],
            lineWrapping: true,
            styleActiveLine: true,
            autoCloseBrackets: true,
            inputStyle: 'contenteditable',
            extraKeys: {"Shift-Ctrl-R": undefined},
            mode: "gfm"
        });
        editor.on('keydown', function (editor, e) {
            if (e.which === 27) {
                // Focus the next form element but don't close the modal (stopPropagation)
                $tags.find('.token-input').focus();
            }
            e.stopPropagation();
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
                    editor.setValue(val || '');
                    editor.save();
                } else {
                    SFCodeMirror.setValueAndCursor(editor, editor.getValue(), val || '');
                }
            },
            refresh: function () {
                editor.refresh();
            }
        };
        SFCodeMirror.mkIndentSettings(editor, framework._.cpNfInner.metadataMgr);
        editor.on('change', function () {
            var val = editor.getValue();
            if (dataObject.body === val) { return; }
            dataObject.body = val;
            commit();
        });

        // Tags
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
                var existing = getExistingTags(kanban.options.boards);
                _field = UI.tokenField(input, existing).preventDuplicates(function (val) {
                    UI.warn(Messages._getKey('tags_duplicate', [val]));
                });
                _field.setTokens(tags || []);

                $tags.find('.token-input').on('keydown', function (e) {
                    e.stopPropagation();
                });

                var commitTags = function () {
                    if (offline) { return; }
                    setTimeout(function () {
                        dataObject.tags = Util.deduplicateString(_field.getTokens().map(function (t) {
                            return t.toLowerCase();
                        }));
                        initialTags = Sortify(dataObject.tags);
                        commit();
                    });
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
                if (offline) { return; }
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
                selectedColor = color;
            }
        };

        var button = [{
            className: 'danger left',
            name: Messages.kanban_delete,
            confirm: true,
            onClick: function (/*button*/) {
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
                onCursorUpdate.fire({});
            },
            keys: [13, 27]
        }];
        var modal = UI.dialog.customModal(content, {
            buttons: button
        });
        modal.classList.add('cp-kanban-edit-modal');
        var $modal = $(modal);

        framework.onEditableChange(function (unlocked) {
            editor.setOption('readOnly', !unlocked);
            $title.prop('disabled', unlocked ? '' : 'disabled');
            $(_field.element).tokenfield(unlocked ? 'enable' : 'disable');

            $modal.find('nav button.danger').prop('disabled', unlocked ? '' : 'disabled');
            offline = !unlocked;
        });


        var setId = function (_isBoard, _id) {
            // Reset the mdoal with a new id
            isBoard = _isBoard;
            id = _id;
            if (_isBoard) {
                onCursorUpdate.fire({
                    board: _id
                });
                dataObject = kanban.getBoardJSON(id);
                $(content)
                    .find('#cp-kanban-edit-body, #cp-kanban-edit-tags, [for="cp-kanban-edit-body"], [for="cp-kanban-edit-tags"]')
                    .hide();
            } else {
                onCursorUpdate.fire({
                    item: _id
                });
                dataObject = kanban.getItemJSON(id);
                $(content)
                    .find('#cp-kanban-edit-body, #cp-kanban-edit-tags, [for="cp-kanban-edit-body"], [for="cp-kanban-edit-tags"]')
                    .show();
            }
            // Also reset the buttons
            $modal.find('nav').after(UI.dialog.getButtons(button)).remove();
        };

        onRemoteChange.reg(function () {
            if (isBoard) {
                dataObject = kanban.getBoardJSON(id);
            } else {
                dataObject = kanban.getItemJSON(id);
            }
            // Check if our item has been deleted
            if (!dataObject) {
                var $frame = $(modal).parents('.alertify').first();
                if ($frame[0] && $frame[0].closeModal) {
                    $frame[0].closeModal();
                }
                return;
            }
            // Not deleted, apply updates
            editModal.conflict.setValue();
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
            color: color,
            conflict: conflict
        };
    };
    var getItemEditModal = function (framework, kanban, eid) {
        // Create modal if needed
        if (!editModal) { editModal = createEditModal(framework, kanban); }
        editModal.setId(false, eid);
        var boards = kanban.options.boards || {};
        var item = (boards.items || {})[eid];
        if (!item) { return void UI.warn(Messages.error); }
        editModal.conflict.setValue();
        PROPERTIES.forEach(function (type) {
            if (!editModal[type]) { return; }
            editModal[type].setValue(item[type]);
        });
        UI.openCustomModal(editModal.modal);
        editModal.body.refresh();
    };
    var getBoardEditModal = function (framework, kanban, id) {
        // Create modal if needed
        if (!editModal) { editModal = createEditModal(framework, kanban); }

        editModal.setId(true, id);
        var boards = kanban.options.boards || {};
        var board = (boards.data || {})[id];
        if (!board) { return void UI.warn(Messages.error); }
        editModal.conflict.setValue();
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
                'alt': Messages.kanban_editCard,
            }).click(function (e) {
                getItemEditModal(framework, kanban, itemId);
                e.stopPropagation();
            }).insertAfter($(el).find('.kanban-item-text'));
        });
        $container.find('.kanban-board').each(function (i, el) {
            var itemId = $(el).attr('data-id');
            $('<button>', {
                'class': 'kanban-edit-item btn btn-default fa fa-pencil',
                'alt': Messages.kanban_editBoard,
            }).click(function (e) {
                getBoardEditModal(framework, kanban, itemId);
                e.stopPropagation();
            }).appendTo($(el).find('.kanban-board-header'));
        });
    };

    // Kanban code
    var getDefaultBoards = function () {
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
                    "item": [1, 2]
                },
                "12": {
                    "id": 12,
                    "title": Messages.kanban_working,
                    "item": [3, 4]
                },
                "13": {
                    "id": 13,
                    "title": Messages.kanban_done,
                    "item": [5, 6]
                }
            },
            items: items
        };
        return defaultBoards;
    };
    var migrate = function (framework, boards) {
        if (!Array.isArray(boards)) { return; }
        console.log("Migration to new format");
        var b = {
            list: [],
            data: {},
            items: {}
        };
        var i = 1;
        boards.forEach(function (board) {
            board.id = i;
            b.list.push(i);
            b.data[i] = board;
            i++;
            if (!Array.isArray(board.item)) { return; }
            board.item = board.item.map(function (item) {
                item.id = i;
                b.items[i] = item;
                return i++; // return current id and incrmeent after
            });
        });
        return b;
    };


    var initKanban = function (framework, boards) {
        var migrated = false;
        if (!boards) {
            verbose("Initializing with default boards content");
            boards = getDefaultBoards();
        } else if (Array.isArray(boards)) {
            boards = migrate(framework, boards);
            migrated = true;
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

        var openLink = function (href) {
            if (/^\/[^\/]/.test(href)) {
                var privateData = framework._.cpNfInner.metadataMgr.getPrivateData();
                href = privateData.origin + href;
            }
            framework._.sfCommon.openUnsafeURL(href);
        };


        var kanban = new window.jKanban({
            element: '#cp-app-kanban-content',
            gutter: '5px',
            widthBoard: '300px',
            buttonContent: '❌',
            readOnly: framework.isReadOnly(),
            refresh: function () {
                onRedraw.fire();
            },
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
                setTimeout(function () {
                    // Make sure the click is sent after the "blur" in case we move from a card to another
                    onCursorUpdate.fire({
                        item: eid
                    });
                });
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
                    onCursorUpdate.fire({});
                };
                $input.blur(save);
                $input.keydown(function (e) {
                    if (e.which === 13) {
                        e.preventDefault();
                        e.stopPropagation();
                        save();
                        if (!$input.val()) { return; }
                        if (!$(el).closest('.kanban-item').is(':last-child')) { return; }
                        $(el).closest('.kanban-board').find('.kanban-title-button').click();
                        return;
                    }
                    if (e.which === 27) {
                        e.preventDefault();
                        e.stopPropagation();
                        save();
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
                setTimeout(function () {
                    // Make sure the click is sent after the "blur" in case we move from a card to another
                    onCursorUpdate.fire({
                        board: boardId
                    });
                });

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
                    onCursorUpdate.fire({});
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
                        save();
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
            addItemClick: function (el) {
                if (framework.isReadOnly() || framework.isLocked()) { return; }
                if (kanban.inEditMode) {
                    $(el).focus();
                    verbose("An edit is already active");
                    //return;
                }
                kanban.inEditMode = "new";
                // create a form to enter element
                var boardId = $(el).closest('.kanban-board').attr("data-id");
                var $item = $('<div>', {'class': 'kanban-item new-item'});
                var $input = getInput().val(name).appendTo($item);
                kanban.addForm(boardId, $item[0]);
                $input.focus();
                setTimeout(function () {
                    $input[0].scrollIntoView();
                });
                var save = function () {
                    $item.remove();
                    kanban.inEditMode = false;
                    onCursorUpdate.fire({});
                    if (!$input.val()) { return; }
                    var id = Util.createRandomInteger();
                    while (kanban.getItemJSON(id)) {
                        id = Util.createRandomInteger();
                    }
                    var item = {
                        "id": id,
                        "title": $input.val(),
                    };
                    if (kanban.options.tags && kanban.options.tags.length) {
                        item.tags = kanban.options.tags;
                    }
                    kanban.addElement(boardId, item);
                };
                $input.blur(save);
                $input.keydown(function (e) {
                    if (e.which === 13) {
                        e.preventDefault();
                        e.stopPropagation();
                        save();
                        if (!$input.val()) { return; }
                        $(el).closest('.kanban-board').find('footer .kanban-title-button').click();
                        return;
                    }
                    if (e.which === 27) {
                        e.preventDefault();
                        e.stopPropagation();
                        $item.remove();
                        kanban.inEditMode = false;
                        onCursorUpdate.fire({});
                        return;
                    }
                });
            },
            renderMd: function (md) {
                return DiffMd.render(md, true, false);
            },
            addItemButton: true,
            getTextColor: getTextColor,
            getAvatar: getAvatar,
            openLink: openLink,
            getTags: getExistingTags,
            cursors: remoteCursors,
            boards: boards
        });

        if (migrated) { framework.localChange(); }

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
            while (kanban.getBoardJSON(id)) {
                id = Util.createRandomInteger();
            }

            kanban.addBoard({
                "id": id,
                "title": Messages.kanban_newBoard,
                "item": []
            });
            kanban.onChange();
        });

        var $container = $('#cp-app-kanban-content');
        var $cContainer = $('#cp-app-kanban-container');
        var addControls = function () {
            // Quick or normal mode
            var small = h('span.cp-kanban-view-small.fa.fa-minus');
            var big = h('span.cp-kanban-view.fa.fa-bars');
            $(small).click(function () {
                if ($cContainer.hasClass('cp-kanban-quick')) { return; }
                $cContainer.addClass('cp-kanban-quick');
                //framework._.sfCommon.setPadAttribute('quickMode', true);
            });
            $(big).click(function () {
                if (!$cContainer.hasClass('cp-kanban-quick')) { return; }
                $cContainer.removeClass('cp-kanban-quick');
                //framework._.sfCommon.setPadAttribute('quickMode', false);
            });

            // Tags filter
            var existing = getExistingTags(kanban.options.boards);
            var list = h('div.cp-kanban-filterTags-list');
            var reset = h('span.cp-kanban-filterTags-reset', [h('i.fa.fa-times'), Messages.kanban_clearFilter]);
            var tags = h('div.cp-kanban-filterTags', [
                h('span.cp-kanban-filterTags-name', Messages.kanban_tags),
                list,
                reset
            ]);
            var $reset = $(reset);
            var $list = $(list);

            var getTags = function () {
                return $list.find('span.active').map(function () {
                    return $(this).data('tag');
                }).get();
            };
            var commitTags = function () {
                var t = getTags();
                if (t.length) {
                    $reset.css('visibility', '');
                } else {
                    $reset.css('visibility', 'hidden');
                }
                //framework._.sfCommon.setPadAttribute('tagsFilter', t);
                kanban.options.tags = t;
                kanban.setBoards(kanban.options.boards);
                addEditItemButton(framework, kanban);
            };

            var redrawList = function (allTags) {
                if (!Array.isArray(allTags)) { return; }
                $list.empty();
                if (!allTags.length) {
                    $list.append(h('em', Messages.kanban_noTags));
                    return;
                }
                allTags.forEach(function (t) {
                    var tag;
                    $list.append(tag = h('span', {
                        'data-tag': t
                    }, t));
                    var $tag = $(tag).click(function () {
                        if ($tag.hasClass('active')) {
                            $tag.removeClass('active');
                        } else {
                            $tag.addClass('active');
                        }
                        commitTags();
                    });
                });
            };
            redrawList(existing);

            var setTags = function (tags) {
                $list.find('span').removeClass('active');
                if (!Array.isArray(tags)) { return; }
                tags.forEach(function (t, i) {
                    if (existing.indexOf(t) === -1) {
                        // This tag doesn't exist anymore
                        tags.splice(i, 1);
                        return;
                    }
                    $list.find('span').filter(function () {
                        return $(this).data('tag') === t;
                    }).addClass('active');
                });
                if (tags.length) {
                    $reset.css('visibility', '');
                } else {
                    $reset.css('visibility', 'hidden');
                }
                //framework._.sfCommon.setPadAttribute('tagsFilter', tags);
            };
            $reset.css('visibility', 'hidden').click(function () {
                setTags([]);
                commitTags();
            });

            var container = h('div#cp-kanban-controls', [
                tags,
                h('div.cp-kanban-changeView', [
                    small,
                    big
                ])
            ]);
            $container.before(container);

            onRedraw.reg(function () {
                // Redraw if new tags have been added to items
                var old = Sortify(existing);
                var t = getTags();
                existing = getExistingTags(kanban.options.boards);
                if (old === Sortify(existing)) { return; } // No change
                // New tags:
                redrawList(existing);
                setTags(t);
            });
            /*
            framework._.sfCommon.getPadAttribute('tagsFilter', function (err, res) {
                if (!err && Array.isArray(res)) {
                    setTags(res);
                    commitTags();
                }
            });
            framework._.sfCommon.getPadAttribute('quickMode', function (err, res) {
                if (!err && res) {
                    $cContainer.addClass('cp-kanban-quick');
                }
            });
            */
        };
        addControls();

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
            $container.find('.kanban-edit-item').remove();
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
                    $newBoard.find('.kanban-title-button').click();
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
                if (!json) { return; }

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
                throw new Error("NOT INITIALIZED");
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

        var myCursor = {};
        onCursorUpdate.reg(function (data) {
            myCursor = data;
            framework.updateCursor();
        });
        framework.onCursorUpdate(function (data) {
            if (!data) { return; }
            var id = data.id;

            // Clear existing cursor
            Object.keys(remoteCursors).forEach(function (_id) {
                if (_id.indexOf(id) === 0 && remoteCursors[_id].clear) {
                    remoteCursors[_id].clear();
                    delete remoteCursors[_id];
                }
            });
            delete remoteCursors[id];

            var cursor = data.cursor;
            if (data.leave || !cursor) { return; }
            if (!cursor.item && !cursor.board) { return; }

            // Add new cursor
            var avatar = getAvatar(cursor);
            var $item = $('.kanban-item[data-eid="'+cursor.item+'"]');
            var $board = $('.kanban-board[data-id="'+cursor.board+'"]');
            if ($item.length) {
                remoteCursors[id] = cursor;
                $item.find('.cp-kanban-cursors').append(avatar);
                return;
            }
            if ($board.length) {
                remoteCursors[id] = cursor;
                $board.find('header .cp-kanban-cursors').append(avatar);
            }
        });
        framework.onCursorUpdate(function () {
            if (!editModal || !editModal.conflict) { return; }
            editModal.conflict.setValue();
        });
        framework.setCursorGetter(function () {
            return myCursor;
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
