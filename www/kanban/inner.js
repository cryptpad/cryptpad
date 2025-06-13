// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    'json.sortify',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-app-framework.js',
    '/common/sframe-common-codemirror.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/inner/common-mediatag.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/common/text-cursor.js',
    '/common/diffMarked.js',
    '/components/chainpad/chainpad.dist.js',
    'cm/lib/codemirror',
    '/kanban/jkanban_cp.js',
    '/kanban/export.js',
    '/common/TypingTests.js',

    'cm/mode/gfm/gfm',
    'cm/addon/edit/closebrackets',
    'cm/addon/edit/matchbrackets',
    'cm/addon/edit/trailingspace',
    'cm/addon/selection/active-line',
    'cm/addon/search/search',
    'cm/addon/search/match-highlighter',

    'css!/components/codemirror/lib/codemirror.css',
    'css!/components/codemirror/addon/dialog/dialog.css',
    'css!/components/codemirror/addon/fold/foldgutter.css',
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
    Messages,
    h,
    TextCursor,
    DiffMd,
    ChainPad,
    CodeMirror,
    jKanban,
    Export,
    TypingTest)
{

    var verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging
    var onRedraw = Util.mkEvent();
    var onCursorUpdate = Util.mkEvent();
    var remoteCursors = {};

    let getCursor = () => {};
    let restoreCursor = () => {};

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

        var name = UI.getDisplayName(cursor.name);

        var l; // label?
        var animal = '';
        if (cursor.name === Messages.anonymous && typeof(cursor.uid) === 'string') {
            l = MT.getPseudorandomAnimal(cursor.uid);
            if (l) {
                animal = '.animal';
            }
        }
        if (!l) {
            l = MT.getPrettyInitials(name);
        }

        var text = '';
        if (cursor.color) {
            text = 'background-color:' + cursor.color + '; color:'+getTextColor(cursor.color)+';';
        }
        var avatar = h('span.cp-cursor.cp-tippy-html' + animal, {
            style: text,
            'data-cptippy-html': true,
            title: html,
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
    var addMoveElementButton = function () {};

    var onRemoteChange = Util.mkEvent();
    var now = function () { return +new Date(); };
    var _lastUpdate = 0;
    var _updateBoards = function (framework, kanban, boards) {
        _lastUpdate = now();
        var cursor = getCursor();
        kanban.setBoards(Util.clone(boards));
        kanban.inEditMode = false;
        addEditItemButton(framework, kanban);
        addMoveElementButton(framework, kanban);
        restoreCursor(cursor);
        onRemoteChange.fire();
    };
    var _updateBoardsThrottle = Util.throttle(_updateBoards, 1000);
    var updateBoards = function (framework, kanban, boards) {
        if ((now() - _lastUpdate) > 5000 || framework.isLocked()) {
            _updateBoards(framework, kanban, boards);
            return;
        }
        _updateBoardsThrottle(framework, kanban, boards);
    };

    var editModal;
    var PROPERTIES = ['title', 'body', 'tags', 'color'];
    var BOARD_PROPERTIES = ['title', 'color'];
    var createEditModal = function (framework, kanban) {
        if (framework.isReadOnly()) { return; }
        if (editModal) { return editModal; }

        var dataObject = {};
        var isBoard, id;
        var offline = false;

        var update = function () {
            updateBoards(framework, kanban, kanban.options.boards);
        };

        var commit = function () {
            framework.localChange();
            update();
        };

        var colors = UIElements.makePalette(8, color => {
            dataObject.color = color;
            commit();
        });

        var conflicts, conflictContainer, titleInput, tagsDiv, text;
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
            colors,
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
        var cm = SFCodeMirror.create("gfm", CodeMirror, text);
        var editor = cm.editor;
        window.easyTest = function () {
            var test = TypingTest.testCode(editor);
            return test;
        };
        editor.setOption('gutters', []);
        editor.setOption('lineNumbers', false);
        editor.setOption('readOnly', false);
        editor.on('keydown', function (editor, e) {
            if (e.which === 27) {
                // Focus the next form element but don't close the modal (stopPropagation)
                $tags.find('.token-input').focus();
            }
            e.stopPropagation();
        });
        var common = framework._.sfCommon;
        var markdownTb = common.createMarkdownToolbar(editor, {
            embed: function (mt) {
                editor.focus();
                editor.replaceSelection($(mt)[0].outerHTML);
            }
        });
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
        cm.configureTheme(common, function () {});
        SFCodeMirror.mkIndentSettings(editor, framework._.cpNfInner.metadataMgr);
        editor.on('change', function () {
            var val = editor.getValue();
            if (dataObject.body === val) { return; }
            dataObject.body = val;
            commit();
        });

        setTimeout(function () {
            var privateData = framework._.cpNfInner.metadataMgr.getPrivateData();
            var fmConfig = {
                dropArea: $('.CodeMirror'),
                body: $('body'),
                onUploaded: function (ev, data) {
                    var parsed = Hash.parsePadUrl(data.url);
                    var secret = Hash.getSecrets('file', parsed.hash, data.password);
                    var fileHost = privateData.fileHost || privateData.origin;
                    var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
                    var key = Hash.encodeBase64(secret.keys.cryptKey);
                    var mt = UI.mediaTag(src, key).outerHTML;
                    editor.replaceSelection(mt);
                }
            };
            common.createFileManager(fmConfig);
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
                    // if the tokenfield is blank and the user hits enter or escape
                    // then allow the event to propogate (closing the modal)
                    // this can leave behind the autocomplete menu, so forcefully hide it
                    if (!$(this).val() && [13, 27].indexOf(e.which) !== -1) {
                        return void $('.ui-autocomplete.ui-front').hide();
                    }
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
        var resetThemeClass = function () {
            $colors.find('.cp-palette-color').each(function (i, el) {
                var $c = $(el);
                $c.removeClass('cp-kanban-palette-card');
                $c.removeClass('cp-kanban-palette-board');
                if (isBoard) {
                    $c.addClass('cp-kanban-palette-board');
                } else {
                    $c.addClass('cp-kanban-palette-card');
                }
            });
        };
        var color = {
            getValue: function () {
                return colors.getValue();
            },
            setValue: function (color) {
                resetThemeClass();
                colors.setValue(color);
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
                    kanban.removeBoard(id);
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
            if (_field) {
                $(_field.element).tokenfield(unlocked ? 'enable' : 'disable');
            }

            $modal.find('nav button.danger').prop('disabled', unlocked ? '' : 'disabled');
            offline = !unlocked;
            colors.disable(offline);
        });


        var setId = function (_isBoard, _id) {
            // Reset the mdoal with a new id
            isBoard = _isBoard;
            id = Number(_id);
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

    addMoveElementButton = function (framework, kanban) {
        if (!kanban) { return; }
        if (framework.isReadOnly() || framework.isLocked()) { return; }
        var $container = $(kanban.element);
        var drag = kanban.drag;
        kanban.options.dragBoards = drag;
        kanban.options.dragItems = drag;
        $container.find('.kanban-board').each(function (i, el) {
            $(el).find('.item-icon-container').remove();
            $(el).find('.kanban-board-header').removeClass('no-drag');
        });
        $container.find('.kanban-item').each(function (i, el) {
            $(el).find('.item-arrow-container').remove();
            $(el).removeClass('no-drag');
        });
        if (drag === false) {
            var move = function (arr, oldIndex, newIndex) {
                arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
                _updateBoards(framework, kanban, kanban.options.boards, false);
            };

            var moveBetweenBoards = function (nextBoardItems, elId, boardItems, index, boards) {
                nextBoardItems.unshift(elId);
                boardItems.splice(index, 1);
                _updateBoards(framework, kanban, boards, false);
                $(`.kanban-item[data-eid="${elId}"]`)[0].scrollIntoView();
            };

            var shiftItem = function (direction, el) {
                var board = $(el).closest('.kanban-board');
                var boards = kanban.options.boards;
                var elId = parseInt($(el).attr("data-eid"));
                var boardId = parseInt($(board).attr("data-id"));
                var boardItems = boards.data[boardId].item;
                var index = boardItems.indexOf(elId);
                var boardIndex = boards.list.indexOf(parseInt(boardId));
                let nextBoardItems;

                if (direction === 'up' && index > 0) {
                    move(boardItems, index, index-1);
                } else if (direction === 'down' && index < boardItems.length-1) {
                    move(boardItems, index, index+1);
                } else if (direction === 'left' && boardIndex > 0) {
                    nextBoardItems = boards.data[boards.list[boardIndex-1]].item;
                    moveBetweenBoards(nextBoardItems, elId, boardItems, index, boards, boardId);
                } else if (direction === 'right' && boardIndex < kanban.options.boards.list.length-1){
                    nextBoardItems = boards.data[boards.list[boardIndex+1]].item;
                    moveBetweenBoards(nextBoardItems, elId, boardItems, index, boards, boardId);
                }
            };

            var shiftBoards = function (direction, el) {
                var elId = $(el).attr("data-id");
                var index = kanban.options.boards.list.indexOf(parseInt(elId));
                if (direction === 'left' && index > 0) {
                    move(kanban.options.boards.list, index, index-1);
                } else if (direction === 'right' && index < kanban.options.boards.list.length-1) {
                    move(kanban.options.boards.list, index, index+1);
                }
                $(`.kanban-board[data-id="${elId}"]`)[0].scrollIntoView();
            };
            $container.find('.kanban-board').each(function (i, el) {
                $(el).find('.kanban-board-header').addClass('no-drag');
                var arrowContainer = h('div.item-icon-container');
                $(arrowContainer).appendTo($(el).find('.kanban-board-header'));
                $(h('button', {
                    'class': 'cp-kanban-arrow board-arrow',
                    'title': Messages.kanban_moveBoardLeft,
                    'aria-label': Messages.kanban_moveBoardLeft
                }, [
                    h('i.fa.fa-arrow-left', {'aria-hidden': true})
                ])).click(function () { 
                    shiftBoards('left', el);
                }).appendTo(arrowContainer);
                $(h('button', {
                    'class': 'cp-kanban-arrow board-arrow',
                    'title': Messages.kanban_moveBoardRight,
                    'aria-label': Messages.kanban_moveBoardRight
                }, [
                    h('i.fa.fa-arrow-right', {'aria-hidden': true})
                ])).click(function () {
                    shiftBoards('right', el);
                }).appendTo(arrowContainer);
            });
            $container.find('.kanban-item').each(function (i, el) {
                $(el).addClass('no-drag');
                var arrowContainerItem = h('div.item-arrow-container');
                $(arrowContainerItem).appendTo((el));
                $(h('button', {
                    'data-notippy':1,
                    'class': 'cp-kanban-arrow item-arrow',
                    'title': Messages.moveItemLeft,
                    'aria-label': Messages.moveItemLeft
                }, [
                    h('i.fa.fa-arrow-left', {'aria-hidden': true})
                ])).click(function () {
                    shiftItem('left', el);
                }).appendTo(arrowContainerItem);
                var centralArrowContainerItem = h('div.item-central-arrow-container');
                $(centralArrowContainerItem).appendTo(arrowContainerItem);
                $(h('button', {
                    'data-notippy':1,
                    'class': 'cp-kanban-arrow item-arrow',
                    'title': Messages.moveItemDown,
                    'aria-label': Messages.moveItemDown
                }, [
                    h('i.fa.fa-arrow-down', {'aria-hidden': true})
                ])).click(function () {
                    shiftItem('down', el);
                }).appendTo(centralArrowContainerItem);
                $(h('button', {
                    'data-notippy':1,
                    'class': 'cp-kanban-arrow item-arrow',
                    'title': Messages.moveItemUp,
                    'aria-label': Messages.moveItemUp
                }, [
                    h('i.fa.fa-arrow-up', {'aria-hidden': true})
                ])).click(function () {
                    shiftItem('up', el);
                }).appendTo(centralArrowContainerItem);
                $(h('button', {
                    'data-notippy':1,
                    'class': 'cp-kanban-arrow item-arrow',
                    'title': Messages.moveItemRight,
                    'aria-label': Messages.moveItemRight
                }, [
                    h('i.fa.fa-arrow-right', {'aria-hidden': true})
                ])).click(function () {
                    shiftItem('right', el);
                }).appendTo(arrowContainerItem);
            });
        } 
    };

    addEditItemButton = function (framework, kanban) {
        if (!kanban) { return; }
        if (framework.isReadOnly() || framework.isLocked()) { return; }
        var $container = $(kanban.element);
        $container.find('.kanban-edit-item').remove();
        $container.find('.kanban-item').each(function (i, el) {
            var itemId = $(el).attr('data-eid');
            $(h('button', {
                'class': 'kanban-edit-item',
                'title': Messages.kanban_editCard,
                'aria-label': Messages.kanban_editCard
            }, [
                h('i.fa.fa-pencil', {'aria-hidden': true})
            ])).click(function (e) {
                getItemEditModal(framework, kanban, itemId);
                e.stopPropagation();
            }).insertAfter($(el).find('.kanban-item-text'));
        });
        $container.find('.kanban-board').each(function (i, el) {
            var itemId = $(el).attr('data-id');
            $(h('button', {
                'class': 'kanban-edit-item',
                'title': Messages.kanban_editBoard,
                'aria-label': Messages.kanban_editBoard
            }, [
                h('i.fa.fa-pencil', {'aria-hidden': true})
            ])).click(function (e) {
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
                    "item": [],
                },
                "13": {
                    "id": 13,
                    "title": Messages.kanban_done,
                    "item": [],
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

        var md = framework._.cpNfInner.metadataMgr.getPrivateData();
        var _tagsAnd = Util.find(md, ['settings', 'kanban', 'tagsAnd']);

        var kanban = new jKanban({
            element: '#cp-app-kanban-content',
            gutter: '5px',
            widthBoard: '300px',
            buttonContent: '❌',
            readOnly: framework.isReadOnly() || framework.isLocked(),
            tagsAnd: _tagsAnd,
            dragItems: true,
            refresh: function () {
                onRedraw.fire();
            },
            onChange: function () {
                verbose("Board object has changed");
                framework.localChange();
                if (kanban) {
                    addEditItemButton(framework, kanban);
                    addMoveElementButton(framework, kanban);
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
                    // Unlock edit mode unless we're already editing
                    // something else
                    if (kanban.inEditMode === eid) {
                        kanban.inEditMode = false;
                    }
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
                    if (kanban.inEditMode === boardId) {
                        kanban.inEditMode = false;
                    }
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
                var $el = $(el);
                if (kanban.inEditMode) {
                    $el.focus();
                    verbose("An edit is already active");
                    //return;
                }
                kanban.inEditMode = "new";
                // create a form to enter element
                var isTop = $el.attr('data-top');
                var boardId = $el.closest('.kanban-board').attr("data-id");
                var $item = $('<div>', {'class': 'kanban-item new-item'});
                var $text = $('<div>', {'class': 'kanban-item-text'}).appendTo($item);
                if (isTop) {
                    $item.addClass('item-top');
                }
                var $input = getInput().val(name).appendTo($text);
                kanban.addForm(boardId, $item[0], isTop);
                $input.focus();
                setTimeout(function () {
                    if (isTop) {
                        $el.closest('.kanban-drag').scrollTop(0);
                    } else {
                        $input[0].scrollIntoView();
                    }
                });
                var save = function () {
                    $item.remove();
                    if (kanban.inEditMode === "new") {
                        kanban.inEditMode = false;
                    }
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
                    kanban.addElement(boardId, item, isTop);
                    addMoveElementButton(framework, kanban);
                };
                $input.blur(save);
                $input.keydown(function (e) {
                    if (e.which === 13) {
                        e.preventDefault();
                        e.stopPropagation();
                        save();
                        if (!$input.val()) { return; }
                        var $footer = $el.closest('.kanban-board').find('footer');
                        if (isTop) {
                            $footer.find('.kanban-title-button[data-top]').click();
                        } else {
                            $footer.find('.kanban-title-button').click();
                        }
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
            applyHtml: function (html, node) {
                DiffMd.apply(html, $(node),framework._.sfCommon);
            },
            renderMd: function (md) {
                return DiffMd.render(md);
            },
            addItemButton: true,
            getTextColor: getTextColor,
            getAvatar: getAvatar,
            openLink: openLink,
            getTags: getExistingTags,
            cursors: remoteCursors,
            boards: boards,
            _boards: Util.clone(boards),
        });

        framework._.cpNfInner.metadataMgr.onChange(function () {
            var md = framework._.cpNfInner.metadataMgr.getPrivateData();
            var tagsAnd = Util.find(md, ['settings', 'kanban', 'tagsAnd']);
            if (_tagsAnd === tagsAnd) { return; }

            // If the rendering has changed, update the value and redraw
            kanban.options.tagsAnd = tagsAnd;
            _tagsAnd = tagsAnd;
            updateBoards(framework, kanban, kanban.options.boards);
        });

        if (migrated) { framework.localChange(); }

        var addBoardDefault = document.getElementById('kanban-addboard');
        let $addBoard = $(addBoardDefault).attr('tabindex', 0);
        $(addBoardDefault).attr('title', Messages.kanban_addBoard);
        Util.onClickEnter($addBoard, function () {
            if (framework.isReadOnly() || framework.isLocked()) { return; }
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
            var small = h('button.cp-kanban-view-small.fa.fa-minus');
            var big = h('button.cp-kanban-view.fa.fa-bars');
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
            var reset = h('button.btn.btn-cancel.cp-kanban-filterTags-reset.cp-kanban-toggle-tags', [
                h('i.fa.fa-times'),
                h('span', Messages.kanban_clearFilter)
            ]);
            var hint = h('span.cp-kanban-filterTags-name', Messages.kanban_tags);
            var tags = h('div.cp-kanban-filterTags', [
                h('span.cp-kanban-filterTags-toggle', [
                    hint,
                    reset,
                ]),
                list,
            ]);

            var $reset = $(reset);
            var $list = $(list);
            var $hint = $(hint);

            var setTagFilterState = function (bool) {
                //$hint.toggle(!bool);
                //$reset.toggle(!!bool);
                $hint.css('visibility', bool? 'hidden': 'visible');
                $hint.css('height', bool ? 0 : '');
                $hint.css('padding-top', bool ? 0 : '');
                $hint.css('padding-bottom', bool ? 0 : '');
                $reset.css('visibility', bool? 'visible': 'hidden');
                $reset.css('height', !bool ? 0 : '');
                $reset.css('padding-top', !bool ? 0 : '');
                $reset.css('padding-bottom', !bool ? 0 : '');
            };
            setTagFilterState();

            var getTags = function () {
                return $list.find('span.active').map(function () {
                    return String($(this).data('tag'));
                }).get();
            };

            var commitTags = function () {
                var t = getTags();
                setTagFilterState(t.length);
                //framework._.sfCommon.setPadAttribute('tagsFilter', t);
                kanban.options.tags = t;
                kanban.setBoards(kanban.options.boards);
                addEditItemButton(framework, kanban);
                addMoveElementButton(framework, kanban);
            };

            var redrawList = function (allTags) {
                if (!Array.isArray(allTags)) { return; }
                $list.empty();
                $list.removeClass('cp-empty');
                if (!allTags.length) {
                    $list.addClass('cp-empty');
                    $list.append(h('em', Messages.kanban_noTags));
                    return;
                }
                allTags.forEach(function (t) {
                    var tag;
                    $list.append(tag = h('span', {
                        'data-tag': t,
                        'tabindex': 0,
                        'role': 'button',
                        'aria-pressed': 'false'
                    }, t));
                    var $tag = $(tag).click(function () {
                        if ($tag.hasClass('active')) {
                            $tag.removeClass('active');
                            $tag.attr('aria-pressed', 'false');
                        } else {
                            $tag.addClass('active');
                            $tag.attr('aria-pressed', 'true');
                        }
                        commitTags();
                    }).keydown(function (e) {
                        if (e.which === 13 || e.which === 32) {
                            $tag.click();
                        }
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
                setTagFilterState(tags.length);
                //framework._.sfCommon.setPadAttribute('tagsFilter', tags);
            };
            setTagFilterState();
            $reset.click(function () {
                setTags([]);
                commitTags();
            });

            let toggleTagsButton = h('button.btn.btn-toolbar-alt.cp-kanban-toggle-tags', {'aria-expanded': 'true'}, [
                h('i.fa.fa-tags'),
                h('span', Messages.fm_tagsName)
            ]);
            let toggleContainer = h('div.cp-kanban-toggle-container', toggleTagsButton);

            let toggleClicked = false;
            let $tags = $(tags);
            let $toggleBtn = $(toggleTagsButton);
            let toggle = () => {
                $tags.toggle();
                let visible = $tags.is(':visible');
                $toggleBtn.attr('aria-expanded', visible.toString());
                $(toggleContainer).toggleClass('cp-kanban-container-flex', !visible);
                $toggleBtn.toggleClass('btn-toolbar-alt', visible);
                $toggleBtn.toggleClass('btn-toolbar', !visible);
            };
            $toggleBtn.click(function() {
                toggleClicked = true;
                toggle();
            });

            const resizeTags = () => {
                if (toggleClicked) { return; }
                let visible = $tags.is(':visible');
                // Small screen and visible: hide
                if ($(window).width() < 600) {
                    if (visible) {
                        $(tags).show();
                        toggle();
                    }
                    return;
                }
                // Large screen: make visible by default
                if (visible) { return; }
                $(tags).hide();
                toggle();
            };

            $(window).on('resize', resizeTags);

            var toggleOffclass = 'ontouchstart' in window ? 'cp-toggle-active' : 'cp-toggle-inactive'; 
            var toggleOnclass = 'ontouchstart' in window ? 'cp-toggle-inactive' : 'cp-toggle-active'; 
            var toggleDragOff = h(`button#toggle-drag-off.cp-kanban-view-drag.${toggleOffclass}.fa.fa-arrows`, {'title': Messages.toggleArrows, 'tabindex': 0});
            var toggleDragOn = h(`button#toggle-drag-on.cp-kanban-view-drag.${toggleOnclass}.fa.fa-hand-o-up`, {'title': Messages.toggleDrag, 'tabindex': 0});
            kanban.drag = 'ontouchstart' in window ? false : true;
            const updateDrag = state => {
                return function () {
                    $(toggleDragOn).toggleClass('cp-toggle-active', state).toggleClass('cp-toggle-inactive', !state);
                    $(toggleDragOff).toggleClass('cp-toggle-active', !state).toggleClass('cp-toggle-inactive', state);
                    kanban.drag = state;
                    addMoveElementButton(framework, kanban);
                };
            };
            $(toggleDragOn).click(updateDrag(true));
            $(toggleDragOff).click(updateDrag(false));

            var container = h('div#cp-kanban-controls', [
                toggleContainer,
                tags,
                h('div.cp-kanban-changeView.drag', [
                    toggleDragOff,
                    toggleDragOn
                ]),
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

        var helpMenu = framework._.sfCommon.createHelpMenu(['kanban']);

        var $helpMenuButton = UIElements.getEntryFromButton(helpMenu.button);
        $toolbarContainer.prepend(helpMenu.menu);
        framework._.toolbar.$drawer.append($helpMenuButton);
    };


    // Start of the main loop
    var andThen2 = function (framework) {

        var kanban;
        var $container = $('#cp-app-kanban-content');

        var privateData = framework._.cpNfInner.metadataMgr.getPrivateData();
        if (!privateData.isEmbed) {
            mkHelpMenu(framework);
        }

        if (framework.isReadOnly() || framework.isLocked()) {
            $container.addClass('cp-app-readonly');
        }

        var cleanData = function (boards) {
            if (typeof(boards) !== "object") { return; }
            var items = boards.items || {};
            var data = boards.data || {};
            var list = boards.list || [];

            // Remove duplicate boards
            list = boards.list = Util.deduplicateString(list);

            Object.keys(data).forEach(function (id) {
                if (list.indexOf(Number(id)) === -1) {
                    list.push(Number(id));
                }
                // Remove duplicate items
                var b = data[id];
                b.item = Util.deduplicateString(b.item || []);
            });
            Object.keys(items).forEach(function (eid) {
                var exists = Object.keys(data).some(function (id) {
                    return (data[id].item || []).indexOf(Number(eid)) !== -1;
                });
                if (!exists) { delete items[eid]; }
            });
            framework.localChange();
        };

        framework.setFileImporter({accept: ['.json', 'application/json']}, function (content /*, file */) {
            var parsed;
            try { parsed = JSON.parse(content); }
            catch (e) { return void console.error(e); }

            if (parsed && parsed.id && parsed.lists && parsed.cards) {
                return { content: Export.import(parsed) };
            }

            return { content: parsed };
        });

        framework.setFileExporter('.json', function () {
            var content = kanban.getBoardsJSON();
            cleanData(content);
            return new Blob([JSON.stringify(kanban.getBoardsJSON(), 0, 2)], {
                type: 'application/json',
            });
        });

        framework.onEditableChange(function (unlocked) {
            if (framework.isReadOnly()) { return; }
            if (!kanban) { return; }
            if (unlocked) {
                addEditItemButton(framework, kanban);
                addMoveElementButton(framework, kanban);
                kanban.options.readOnly = false;
                return void $container.removeClass('cp-app-readonly');
            }
            kanban.options.readOnly = true;
            $container.addClass('cp-app-readonly');
            $container.find('.kanban-edit-item').remove();
        });

        getCursor = function () {
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
                var isTop = $el && $el.hasClass('item-top');
                if (!$el.length) { return; }
                var $input = $el.find('input');
                if (!$input.length) { return; }
                var input = $input[0];

                var val = ($input.val && $input.val()) || '';
                var start = input.selectionStart;
                var end = input.selectionEnd;

                var json = kanban.getBoardJSON(id) || kanban.getItemJSON(id);
                var oldVal = json && json.title;

                if (id === "new") { $el.remove(); }

                return {
                    id: id,
                    newBoard: newBoard,
                    value: val,
                    start: start,
                    end: end,
                    isTop: isTop,
                    oldValue: oldVal
                };
            } catch (e) {
                console.error(e);
                return {};
            }
        };
        restoreCursor = function (data) {
            if (!data) { return; }
            try {
                var id = data.id;

                // An item was being added: add a new item
                if (id === "new" && !data.oldValue) {
                    var $newBoard = $('.kanban-board[data-id="'+data.newBoard+'"]');
                    var topSelector = ':not([data-top])';
                    if (data.isTop) { topSelector = '[data-top]'; }
                    $newBoard.find('.kanban-title-button' + topSelector).click();
                    var $newInput = $newBoard.find('.kanban-item.new-item input');
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
                addMoveElementButton(framework, kanban);
                return;
            }

            // Need to update the content
            verbose("Content should be updated to " + newContent);
            var currentContent = kanban.getBoardsJSON();
            var remoteContent = newContent.content;

            if (Sortify(currentContent) !== Sortify(remoteContent)) {
                verbose("Content is different.. Applying content");
                kanban.options.boards = remoteContent;
                updateBoards(framework, kanban, remoteContent);
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
            if (data.reset) {
                Object.keys(remoteCursors).forEach(function (id) {
                    if (remoteCursors[id].clear) {
                        remoteCursors[id].clear();
                    }
                    delete remoteCursors[id];
                });
                return;
            }

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
            if ($item.length) {
                remoteCursors[id] = cursor;
                $item.find('.cp-kanban-cursors').append(avatar);
                return;
            }
            var $board = $('.kanban-board[data-id="'+cursor.board+'"]');
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
                skipLink: '#cp-app-kanban-content'
            }, waitFor(function (framework) {
                andThen2(framework);
            }));
        });
    };
    main();
});
