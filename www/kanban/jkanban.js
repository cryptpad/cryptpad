(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, l, l.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
})({
    1: [function (require, module, exports) {
        /**
         * jKanban
         * Vanilla Javascript plugin for manage kanban boards
         *
         * @site: http://www.riccardotartaglia.it/jkanban/
         * @author: Riccardo Tartaglia
         */

        //Require dragula
        var dragula = require('dragula');

        (function () {

            this.jKanban = function () {
                var self = this;
                this.element = '';
                this.container = '';
                this.boardContainer = [];
                this.dragula = dragula;
                this.drake = '';
                this.drakeBoard = '';
                this.addItemButton = false;
                this.cache = {};
                defaults = {
                    element: '',
                    gutter: '15px',
                    widthBoard: '250px',
                    responsive: '700',
                    responsivePercentage: false,
                    boards: {
                        data: {},
                        items: {},
                        list: []
                    },
                    getAvatar: function () {},
                    openLink: function () {},
                    getTags: function () {},
                    getTextColor: function () { return '#000'; },
                    cursors: {},
                    tags: [],
                    dragBoards: true,
                    addItemButton: false,
                    readOnly: false,
                    dragEl: function (el, source) {},
                    dragendEl: function (el) {},
                    dropEl: function (el, target, source, sibling) {},
                    dragcancelEl: function (el, boardId) {},
                    dragBoard: function (el, source) {},
                    dragendBoard: function (el) {},
                    dropBoard: function (el, target, source, sibling) {},
                    click: function (el) {},
                    boardTitleclick: function (el, boardId) {},
                    addItemClick: function (el, boardId) {},
                    renderMd: function (md) {},
                    refresh: function () {},
                    onChange: function () {}
                };

                if (arguments[0] && typeof arguments[0] === "object") {
                    this.options = __extendDefaults(defaults, arguments[0]);
                }

                var checkCache = function (boards) {
                    Object.keys(self.cache).forEach(function (id) {
                        if (boards.items[id]) { return; }
                        delete self.cache[id];
                    });
                };
                var removeUnusedTags = function (boards) {
                    var tags = self.options.getTags(boards);
                    var filter = self.options.tags || [];
                    var toClean = [];
                    filter.forEach(function (tag) {
                        if (tags.indexOf(tag) === -1) { toClean.push(tag); }
                    });
                    toClean.forEach(function (t) {
                        var idx = filter.indexOf(t);
                        if (idx === -1) { return; }
                        filter.splice(idx, 1);
                    });
                    // If all the tags have bene remove, make sure we show everything again
                    if (!filter.length) {
                        $('.kanban-item-hidden').removeClass('kanban-item-hidden');
                    }
                };

                this.init = function () {
                    // set initial boards
                    __setBoard();

                    // Scroll on drag
                    var $el = $(self.element)
                    var $inner = $el.find('.kanban-container');
                    var leftRegion = $el.position().left + 10;
                    var rightRegion = $(window).width() - 10;
                    var activeBoard;
                    var $aB;
                    var setActiveDrag = function (board) {
                        activeBoard = undefined;
                        if (!board) { return; }
                        if (!board.classList.contains('kanban-drag')) { return; }
                        activeBoard = board;
                        $aB = $(activeBoard);
                    };
                    var onMouseMove = function (isItem) {
                        return function (e) {
                            if (e.which !== 1) { return; } // left click
                            var distance = 20;
                            // If this is an item drag, check scroll
                            if (isItem && activeBoard) {
                                var rect = activeBoard.getBoundingClientRect();
                                if (e.pageX > rect.left && e.pageX < rect.right) {
                                    if (e.pageY < (rect.top + 10)) {
                                        distance *= -1;
                                        $aB.scrollTop(distance + $aB.scrollTop()) ;
                                    } else if (e.pageY > (rect.bottom - 10)) {
                                        $aB.scrollTop(distance + $aB.scrollTop()) ;
                                    }
                                }
                            }
                            // Itme or board: horizontal scroll if needed
                            if (e.pageX < leftRegion) {
                                distance *= -1;
                                $el.scrollLeft(distance + $el.scrollLeft()) ;
                            } else if (e.pageX >= rightRegion) {
                                $el.scrollLeft(distance + $el.scrollLeft()) ;
                            }
                        };
                    };

                    //set drag with dragula
                    if (window.innerWidth > self.options.responsive) {

                        //Init Drag Board
                        self.drakeBoard = self.dragula([self.container, self.trashContainer], {
                                moves: function (el, source, handle, sibling) {
                                    if (self.options.readOnly) { return false; }
                                    if (!self.options.dragBoards) { return false; }
                                    return (handle.classList.contains('kanban-board-header') || handle.classList.contains('kanban-title-board'));
                                },
                                accepts: function (el, target, source, sibling) {
                                    if (self.options.readOnly) { return false; }
                                    if (sibling && sibling.getAttribute('id') === "kanban-addboard") { return false; }
                                    return target.classList.contains('kanban-container') ||
                                           target.classList.contains('kanban-trash');
                                },
                                revertOnSpill: true,
                                direction: 'horizontal',
                            })
                            .on('drag', function (el, source) {
                                el.classList.add('is-moving');
                                self.options.dragBoard(el, source);
                                if (typeof (el.dragfn) === 'function') {
                                    el.dragfn(el, source);
                                }
                                $('.kanban-trash').addClass('kanban-trash-suggest');
                                $(document).on('mousemove', onMouseMove());
                            })
                            .on('dragend', function (el) {
                                el.classList.remove('is-moving');
                                self.options.dragendBoard(el);
                                $(document).off('mousemove');
                                $('.kanban-trash').removeClass('kanban-trash-suggest');
                                if (typeof (el.dragendfn) === 'function')
                                    el.dragendfn(el);
                            })
                            .on('over', function (el, target, source) {
                                if (!target.classList.contains('kanban-trash')) { return false; }
                                $('.kanban-trash').addClass('kanban-trash-active');
                                $('.kanban-trash').removeClass('kanban-trash-suggest');
                            })
                            .on('out', function (el, target) {
                                if (!target.classList.contains('kanban-trash')) { return false; }
                                $('.kanban-trash').removeClass('kanban-trash-active');
                                $('.kanban-trash').addClass('kanban-trash-suggest');
                            })
                            .on('drop', function (el, target, source, sibling) {
                                el.classList.remove('is-moving');
                                self.options.dropBoard(el, target, source, sibling);
                                if (typeof (el.dropfn) === 'function') {
                                    el.dropfn(el, target, source, sibling);
                                }

                                var id = Number($(el).attr('data-id'));
                                var list = self.options.boards.list || [];

                                var index1 = list.indexOf(id);
                                if (index1 === -1) { return; }

                                // Move to trash?
                                if (target.classList.contains('kanban-trash')) {
                                    list.splice(index1, 1);
                                    delete self.options.boards.data[id];
                                    self.onChange();
                                    return;
                                }

                                var index2;
                                var id2 = Number($(sibling).attr("data-id"));
                                if (sibling && id2) {
                                    index2 = list.indexOf(id2);
                                }
                                // If we can't find the drop position, drop at the end
                                if (typeof(index2) === "undefined" || index2 === -1) {
                                    index2 = list.length;
                                }

                                console.log("Switch " + index1 + " and " + index2);
                                if (index1 < index2) {
                                    index2 = index2 - 1;
                                }
                                list.splice(index1, 1);
                                list.splice(index2, 0, id);
                                // send event that board has changed
                                self.onChange();
                                self.setBoards(self.options.boards);
                            });

                        //Init Drag Item
                        self.drake = self.dragula(self.boardContainer, {
                            moves: function (el, source, handle, sibling) {
                                if (self.options.readOnly) { return false; }
                                if (el.classList.contains('new-item')) { return false; }
                                return el.classList.contains('kanban-item');
                            },
                            accepts: function (el, target, source, sibling) {
                                if (self.options.readOnly) { return false; }
                                return true;
                            },
                            revertOnSpill: true
                        })
                            .on('cancel', function(el, container, source) {
                                self.enableAllBoards();
                            })
                            .on('drag', function (el, source) {
                                // we need to calculate the position before starting to drag
                                self.dragItemPos = self.findElementPosition(el);

                                setActiveDrag();
                                el.classList.add('is-moving');
                                $(document).on('mousemove', onMouseMove(el));
                                $('.kanban-trash').addClass('kanban-trash-suggest');

                                self.options.dragEl(el, source);
                                if (el !== null && typeof (el.dragfn) === 'function') {
                                    el.dragfn(el, source);
                                }
                            })
                            .on('dragend', function (el) {
                                console.log("In dragend");
                                el.classList.remove('is-moving');
                                self.options.dragendEl(el);
                                $('.kanban-trash').removeClass('kanban-trash-suggest');
                                $(document).off('mousemove');
                                if (el !== null && typeof (el.dragendfn) === 'function') {
                                    el.dragendfn(el);
                                }
                            })
                            .on('cancel', function (el, container, source) {
                                console.log("In cancel");
                                el.classList.remove('is-moving');
                                var boardId = $(source).closest('kanban-board').data('id');
                                self.options.dragcancelEl(el, boardId);
                            })
                            .on('over', function (el, target, source) {
                                setActiveDrag(target);
                                if (!target.classList.contains('kanban-trash')) { return false; }
                                target.classList.remove('kanban-trash-suggest');
                                target.classList.add('kanban-trash-active');

                            })
                            .on('out', function (el, target) {
                                setActiveDrag();
                                if (!target.classList.contains('kanban-trash')) { return false; }
                                target.classList.remove('kanban-trash-active');
                                target.classList.add('kanban-trash-suggest');

                            })
                            .on('drop', function(el, target, source, sibling) {
                                self.enableAllBoards();
                                el.classList.remove('is-moving');

                                console.log("In drop");

                                var id1 = Number($(el).attr('data-eid'));

                                // Move to trash?
                                if (target.classList.contains('kanban-trash')) {
                                    self.moveItem(id1);
                                    self.onChange();
                                    return;
                                }

                                // Find the new board
                                var targetId = Number($(target).closest('.kanban-board').data('id'));
                                if (!targetId) { return; }
                                var board2 = __findBoardJSON(targetId);
                                var id2 = $(sibling).attr('data-eid');
                                if (id2) { id2 = Number(id2); }
                                var pos2 = id2 ? board2.item.indexOf(id2) : board2.item.length;
                                if (pos2 === -1) { pos2 = board2.item.length; }

                                // Remove the "move" effect
                                if (el !== null) {
                                    el.classList.remove('is-moving');
                                }

                                // Move the item
                                self.moveItem(id1, board2, pos2);

                                // send event that board has changed
                                self.onChange();
                                self.setBoards(self.options.boards);
                            })
                    }
                };

                var findItem = function (eid) {
                    var boards = self.options.boards;
                    var list = boards.list || [];
                    var res = [];
                    list.forEach(function (id) {
                        var b = boards.data[id];
                        if (!b) { return; }
                        var items = b.item || [];
                        var idx = items.indexOf(eid);
                        if (idx === -1) { return; }
                        // This board contains our item...
                        res.push({
                            board: b,
                            pos: idx
                        });
                    });
                    return res;
                };
                this.moveItem = function (eid, board, pos) {
                    var boards = self.options.boards;
                    var list = boards.list || [];
                    var from = [];
                    var same = -1;
                    var from = findItem(eid);
                    // Remove the item from its board
                    from.forEach(function (obj) {
                        obj.board.item.splice(obj.pos, 1);
                        if (obj.board === board) { same = obj.pos; }
                    });
                    // If it's a deletion, remove the item data
                    if (!board) {
                        delete boards.items[eid];
                        delete self.cache[eid];
                        removeUnusedTags(boards);
                        self.options.refresh();
                        return;
                    }
                    // If it's moved to the same board at a bigger index, decrement the index by one
                    // (we just removed one element)
                    if (same !== -1 && same < pos) {
                        pos = pos - 1;
                    }
                    board.item.splice(pos, 0, eid);
                };

                this.enableAllBoards = function() {
                    var allB = document.querySelectorAll('.kanban-board');
                    if (allB.length > 0 && allB !== undefined) {
                        for (var i = 0; i < allB.length; i++) {
                            allB[i].classList.remove('disabled-board');
                        }
                    }
                };

                var getElementNode = function (element) {
                    var nodeItem = document.createElement('div');
                    nodeItem.classList.add('kanban-item');
                    nodeItem.dataset.eid = element.id;
                    if (element.color) {
                        if (/color/.test(element.color)) {
                            // Palette color
                            nodeItem.classList.add('cp-kanban-palette-'+element.color);
                        } else {
                            // Hex color code
                            var textColor = self.options.getTextColor(element.color);
                            nodeItem.setAttribute('style', 'background-color:#'+element.color+';color:'+textColor+';');
                        }
                    }
                    var nodeCursors = document.createElement('div');
                    nodeCursors.classList.add('cp-kanban-cursors');
                    Object.keys(self.options.cursors).forEach(function (id) {
                        var c = self.options.cursors[id];
                        if (Number(c.item) !== Number(element.id)) { return; }
                        var el = self.options.getAvatar(c);
                        nodeCursors.appendChild(el);
                    });
                    var nodeItemText = document.createElement('div');
                    nodeItemText.classList.add('kanban-item-text');
                    nodeItemText.dataset.eid = element.id;
                    nodeItemText.innerText = element.title;
                    nodeItem.appendChild(nodeItemText);
                    // Check if this card is filtered out
                    if (Array.isArray(self.options.tags) && self.options.tags.length) {
                        var hide = !Array.isArray(element.tags) ||
                            !element.tags.some(function (tag) {
                              return self.options.tags.indexOf(tag) !== -1;
                        });
                        if (hide) {
                            nodeItem.classList.add('kanban-item-hidden');
                        }
                    }
                    if (element.body) {
                        var html;
                        if (self.cache[element.id] && self.cache[element.id].body === element.body) {
                            html = self.cache[element.id].html;
                        } else {
                            html = self.renderMd(element.body);
                            self.cache[element.id] = {
                                body: element.body,
                                html: html
                            };
                        }
                        var nodeBody = document.createElement('div');
                        nodeBody.classList.add('kanban-item-body');
                        $(nodeBody).on('click', 'a', function (e) {
                            e.preventDefault();
                            var a = e.target;
                            if (!a.href) { return; }
                            var href = a.getAttribute('href');
                            self.options.openLink(href);
                        });
                        nodeBody.onclick = function (e) {
                            e.preventDefault();
                        };
                        nodeBody.innerHTML = html;
                        nodeItem.appendChild(nodeBody);
                    }
                    if (Array.isArray(element.tags)) {
                        var nodeTags = document.createElement('div');
                        nodeTags.classList.add('kanban-item-tags');
                        element.tags.forEach(function (_tag) {
                            var tag = document.createElement('span');
                            tag.innerText = _tag;
                            nodeTags.appendChild(tag);
                        });
                        nodeItem.appendChild(nodeTags);
                    }
                    nodeItem.appendChild(nodeCursors);
                    //add function
                    nodeItem.clickfn = element.click;
                    nodeItem.dragfn = element.drag;
                    nodeItem.dragendfn = element.dragend;
                    nodeItem.dropfn = element.drop;
                    __onclickHandler(nodeItemText);
                    return nodeItem;
                };

                this.addElement = function (boardID, element) {

                    // add Element to JSON
                    var boardJSON = __findBoardJSON(boardID);

                    boardJSON.item.push(element.id);
                    self.options.boards.items = self.options.boards.items || {};
                    self.options.boards.items[element.id] = element;

                    var board = self.element.querySelector('[data-id="' + boardID + '"] .kanban-drag');
                    board.appendChild(getElementNode(element));
                    // send event that board has changed
                    self.onChange();
                    return self;
                };

                this.addForm = function (boardID, formItem) {
                    var board = self.element.querySelector('[data-id="' + boardID + '"] .kanban-drag');
                    board.appendChild(formItem);
                    return self;
                };

                var getBoardNode = function (board) {
                    var boards = self.options.boards;
                    var boardWidth = self.options.widthBoard;
                    //create node
                    var boardNode = document.createElement('div');
                    boardNode.dataset.id = board.id;
                    boardNode.classList.add('kanban-board');
                    var boardNodeInner = document.createElement('div');
                    boardNodeInner.classList.add('kanban-board-inner');
                    //set style
                    if (self.options.responsivePercentage) {
                        boardNode.style.width = boardWidth + '%';
                    } else {
                        boardNode.style.width = boardWidth;
                    }
                    boardNode.style.marginLeft = self.options.gutter;
                    boardNode.style.marginRight = self.options.gutter;
                    // header board
                    var headerBoard = document.createElement('header');
                    if (board.class !== '' && board.class !== undefined) {
                        var allClasses = board.class.split(",");
                    } else {
                        allClasses = [];
                    }
                    headerBoard.classList.add('kanban-board-header');
                    allClasses.map(function (value) {
                        headerBoard.classList.add(value);
                    });
                    if (board.color !== '' && board.color !== undefined) {
                        if (/color/.test(board.color)) {
                            // Palette color
                            headerBoard.classList.add('cp-kanban-palette-'+board.color);
                            boardNodeInner.classList.add('cp-kanban-palette-'+board.color);
                        } else if (!/^[0-9a-f]{6}$/.test(board.color)) {
                            // "string" color (red, blue, etc.)
                            headerBoard.classList.add("kanban-header-" + board.color);
                        } else {
                            // Hex color code
                            var textColor = self.options.getTextColor(board.color);
                            headerBoard.setAttribute('style', 'background-color:#'+board.color+';color:'+textColor+';');
                        }
                    }

                    titleBoard = document.createElement('div');
                    titleBoard.classList.add('kanban-title-board');
                    titleBoard.innerText = board.title;

                    titleBoard.clickfn = board.boardTitleClick;
                    __onboardTitleClickHandler(titleBoard);
                    headerBoard.appendChild(titleBoard);

                    var nodeCursors = document.createElement('div');
                    nodeCursors.classList.add('cp-kanban-cursors');
                    Object.keys(self.options.cursors).forEach(function (id) {
                        var c = self.options.cursors[id];
                        if (Number(c.board) !== Number(board.id)) { return; }
                        var el = self.options.getAvatar(c);
                        nodeCursors.appendChild(el);
                    });
                    headerBoard.appendChild(nodeCursors);

                    //content board
                    var contentBoard = document.createElement('main');
                    contentBoard.classList.add('kanban-drag');
                    //add drag to array for dragula
                    self.boardContainer.push(contentBoard);
                    (board.item || []).forEach(function (itemkey) {
                        //create item
                        var itemKanban = boards.items[itemkey];
                        if (!itemKanban) {
                            var idx = board.item.indexOf(itemkey);
                            if (idx > -1) { board.item.splice(idx, 1); }
                            return;
                        }
                        var nodeItem = getElementNode(itemKanban);
                        contentBoard.appendChild(nodeItem);
                    });

                    //footer board
                    var footerBoard = document.createElement('footer');
                    footerBoard.classList.add('kanban-board-footer');
                    //add button
                    var addBoardItem = document.createElement('span');
                    addBoardItem.classList.add('kanban-title-button');
                    addBoardItem.innerText = '+';
                    footerBoard.appendChild(addBoardItem);
                    __onAddItemClickHandler(addBoardItem);

                    //board assembly
                    boardNode.appendChild(boardNodeInner);
                    boardNodeInner.appendChild(headerBoard);
                    boardNodeInner.appendChild(contentBoard);
                    boardNodeInner.appendChild(footerBoard);

                    return boardNode;
                };
                this.addBoard = function (board) {
                    if (!board || !board.id) { return; }
                    var boards = self.options.boards;
                    boards.data = boards.data || {};
                    boards.list = boards.list || [];
                    // If it already there, abort
                    boards.data[board.id] = board;
                    if (boards.list.indexOf(board.id) !== -1) { return; }

                    boards.list.push(board.id);
                    var boardNode = getBoardNode(board);
                    self.container.appendChild(boardNode);
                };

                this.addBoards = function() {
                    //for on all the boards
                    var boards = self.options.boards;
                    boards.list = boards.list || [];
                    boards.data = boards.data || {};
                    var toRemove = [];
                    boards.list.forEach(function (boardkey) {
                        // single board
                        var board = boards.data[boardkey];
                        if (!board) {
                            toRemove.push(boardkey);
                            return;
                        }

                        var boardNode = getBoardNode(board);

                        //board add
                        self.container.appendChild(boardNode);
                    });
                    toRemove.forEach(function (id) {
                        var idx = boards.list.indexOf(id);
                        if (idx > -1) { boards.list.splice(idx, 1); }
                    });

                    // send event that board has changed
                    self.onChange();

                    return self;
                }

                this.setBoards = function (boards) {
                    var scroll = {};
                    // Fix the tags
                    checkCache(boards);
                    removeUnusedTags(boards);
                    // Get horizontal scroll
                    var $el = $(self.element);
                    var scrollLeft = $el.scrollLeft();
                    // Remove all boards
                    for (var i in this.options.boards.list) {
                        var boardkey = this.options.boards.list[i];
                        scroll[boardkey] = $('.kanban-board[data-id="'+boardkey+'"] .kanban-drag').scrollTop();
                        this.removeBoard(boardkey);
                    }
                    this.options.boards = boards;
                    // Add all new boards
                    this.addBoards();
                    self.options.refresh();
                    // Preserve scroll
                    this.options.boards.list.forEach(function (id) {
                        if (!scroll[id]) { return; }
                        $('.kanban-board[data-id="'+id+'"] .kanban-drag').scrollTop(scroll[id]);
                    });
                    $el.scrollLeft(scrollLeft);
                }

                this.findBoard = function (id) {
                    var el = self.element.querySelector('[data-id="' + id + '"]');
                    return el;
                }

                this.findElement = function (id) {
                    var el = self.element.querySelector('[data-eid="' + id + '"]');
                    return el;
                }

                this.findElementPosition = function (el) {
                    // we are looking at the element position in the child array
                    return $(el.parentNode.children).index(el);
                }

                this.getBoardElements = function (id) {
                    var board = self.element.querySelector('[data-id="' + id + '"] .kanban-drag');
                    return (board.childNodes);
                }

                this.removeElement = function (el) {
                    if (typeof (el) === 'string')
                        el = self.element.querySelector('[data-eid="' + el + '"]');
                    el.remove();

                    // send event that board has changed
                    self.onChange();

                    return self;
                };

                this.removeBoard = function (board) {
                    var id;
                    if (typeof (board) === 'string' || typeof (board) === "number") {
                        id = board;
                        board = self.element.querySelector('[data-id="' + board + '"]');
                    } else if (board) {
                        id = board.id;
                    }
                    if (board) {
                        board.remove();

                        // send event that board has changed
                        self.onChange();
                    }

                    // Remove duplicates
                    if (id) { $(self.element).find('.kanban-board[data-id="' + board + '"]').remove(); }

                    return self;
                }

                this.renderMd = function (md) {
                    return self.options.renderMd(md);
                }
                this.onChange = function () {
                    self.options.onChange();
                }

                this.getBoardsJSON = function (id) {
                    return self.options.boards;
                }

                this.getBoardJSON = function (id) {
                    return __findBoardJSON(id);
                }
                this.getItemJSON = function (id) {
                    return (self.options.boards.items || {})[id];
                };

                //PRIVATE FUNCTION
                function __extendDefaults(source, properties) {
                    var property;
                    for (property in properties) {
                        if (properties.hasOwnProperty(property)) {
                            source[property] = properties[property];
                        }
                    }
                    return source;
                }

                function __setBoard() {
                    self.element = document.querySelector(self.options.element);
                    //create container
                    var boardContainerOuter = document.createElement('div');
                    boardContainerOuter.classList.add('kanban-container-outer');
                    var boardContainer = document.createElement('div');
                    boardContainer.classList.add('kanban-container');
                    boardContainerOuter.appendChild(boardContainer);
                    var addBoard = document.createElement('div');
                    addBoard.id = 'kanban-addboard';
                    addBoard.innerText = '+';
                    boardContainer.appendChild(addBoard);
                    var trash = self.trashContainer = document.createElement('div');
                    trash.setAttribute('id', 'kanban-trash');
                    trash.setAttribute('class', 'kanban-trash');
                    var trashBg = document.createElement('div');
                    var trashIcon = document.createElement('i');
                    trashIcon.setAttribute('class', 'fa fa-trash');
                    trash.appendChild(trashIcon);
                    trash.appendChild(trashBg);
                    self.boardContainer.push(trash);

                    self.container = boardContainer;
                    //add boards
                    self.addBoards();
                    //appends to container
                    self.element.appendChild(boardContainerOuter);
                    self.element.appendChild(trash);

                    // send event that board has changed
                    self.onChange();
                };

                function __onclickHandler(nodeItem, clickfn) {
                    nodeItem.addEventListener('click', function (e) {
                        e.preventDefault;
                        e.stopPropagation();
                        self.options.click(this);
                        if (typeof (this.clickfn) === 'function')
                            this.clickfn(this);
                    });
                }

                function __onboardTitleClickHandler(nodeItem, clickfn) {
                    nodeItem.addEventListener('click', function (e) {
                        e.preventDefault;
                        self.options.boardTitleClick(this, e);
                        if (typeof (this.clickfn) === 'function')
                            this.clickfn(this);
                    });
                }

                function __onAddItemClickHandler(nodeItem, clickfn) {
                    nodeItem.addEventListener('click', function (e) {
                        e.preventDefault;
                        e.stopPropagation();
                        self.options.addItemClick(this);
                        if (typeof (this.clickfn) === 'function')
                            this.clickfn(this);
                    });
                }

                function __findBoardJSON(id) {
                    return (self.options.boards.data || {})[id];
                }


                //init plugin
                this.init();
            };
        }());


}, {
        "dragula": 9
    }],
    2: [function (require, module, exports) {
        module.exports = function atoa(a, n) {
            return Array.prototype.slice.call(a, n);
        }

}, {}],
    3: [function (require, module, exports) {
        'use strict';

        var ticky = require('ticky');

        module.exports = function debounce(fn, args, ctx) {
            if (!fn) {
                return;
            }
            ticky(function run() {
                fn.apply(ctx || null, args || []);
            });
        };

}, {
        "ticky": 10
    }],
    4: [function (require, module, exports) {
        'use strict';

        var atoa = require('atoa');
        var debounce = require('./debounce');

        module.exports = function emitter(thing, options) {
            var opts = options || {};
            var evt = {};
            if (thing === undefined) {
                thing = {};
            }
            thing.on = function (type, fn) {
                if (!evt[type]) {
                    evt[type] = [fn];
                } else {
                    evt[type].push(fn);
                }
                return thing;
            };
            thing.once = function (type, fn) {
                fn._once = true; // thing.off(fn) still works!
                thing.on(type, fn);
                return thing;
            };
            thing.off = function (type, fn) {
                var c = arguments.length;
                if (c === 1) {
                    delete evt[type];
                } else if (c === 0) {
                    evt = {};
                } else {
                    var et = evt[type];
                    if (!et) {
                        return thing;
                    }
                    et.splice(et.indexOf(fn), 1);
                }
                return thing;
            };
            thing.emit = function () {
                var args = atoa(arguments);
                return thing.emitterSnapshot(args.shift()).apply(this, args);
            };
            thing.emitterSnapshot = function (type) {
                var et = (evt[type] || []).slice(0);
                return function () {
                    var args = atoa(arguments);
                    var ctx = this || thing;
                    if (type === 'error' && opts.throws !== false && !et.length) {
                        throw args.length === 1 ? args[0] : args;
                    }
                    et.forEach(function emitter(listen) {
                        if (opts.async) {
                            debounce(listen, args, ctx);
                        } else {
                            listen.apply(ctx, args);
                        }
                        if (listen._once) {
                            thing.off(type, listen);
                        }
                    });
                    return thing;
                };
            };
            return thing;
        };

}, {
        "./debounce": 3,
        "atoa": 2
    }],
    5: [function (require, module, exports) {
        (function (global) {
            'use strict';

            var customEvent = require('custom-event');
            var eventmap = require('./eventmap');
            var doc = global.document;
            var addEvent = addEventEasy;
            var removeEvent = removeEventEasy;
            var hardCache = [];

            if (!global.addEventListener) {
                addEvent = addEventHard;
                removeEvent = removeEventHard;
            }

            module.exports = {
                add: addEvent,
                remove: removeEvent,
                fabricate: fabricateEvent
            };

            function addEventEasy(el, type, fn, capturing) {
                return el.addEventListener(type, fn, capturing);
            }

            function addEventHard(el, type, fn) {
                return el.attachEvent('on' + type, wrap(el, type, fn));
            }

            function removeEventEasy(el, type, fn, capturing) {
                return el.removeEventListener(type, fn, capturing);
            }

            function removeEventHard(el, type, fn) {
                var listener = unwrap(el, type, fn);
                if (listener) {
                    return el.detachEvent('on' + type, listener);
                }
            }

            function fabricateEvent(el, type, model) {
                var e = eventmap.indexOf(type) === -1 ? makeCustomEvent() : makeClassicEvent();
                if (el.dispatchEvent) {
                    el.dispatchEvent(e);
                } else {
                    el.fireEvent('on' + type, e);
                }

                function makeClassicEvent() {
                    var e;
                    if (doc.createEvent) {
                        e = doc.createEvent('Event');
                        e.initEvent(type, true, true);
                    } else if (doc.createEventObject) {
                        e = doc.createEventObject();
                    }
                    return e;
                }

                function makeCustomEvent() {
                    return new customEvent(type, {
                        detail: model
                    });
                }
            }

            function wrapperFactory(el, type, fn) {
                return function wrapper(originalEvent) {
                    var e = originalEvent || global.event;
                    e.target = e.target || e.srcElement;
                    e.preventDefault = e.preventDefault || function preventDefault() {
                        e.returnValue = false;
                    };
                    e.stopPropagation = e.stopPropagation || function stopPropagation() {
                        e.cancelBubble = true;
                    };
                    e.which = e.which || e.keyCode;
                    fn.call(el, e);
                };
            }

            function wrap(el, type, fn) {
                var wrapper = unwrap(el, type, fn) || wrapperFactory(el, type, fn);
                hardCache.push({
                    wrapper: wrapper,
                    element: el,
                    type: type,
                    fn: fn
                });
                return wrapper;
            }

            function unwrap(el, type, fn) {
                var i = find(el, type, fn);
                if (i) {
                    var wrapper = hardCache[i].wrapper;
                    hardCache.splice(i, 1); // free up a tad of memory
                    return wrapper;
                }
            }

            function find(el, type, fn) {
                var i, item;
                for (i = 0; i < hardCache.length; i++) {
                    item = hardCache[i];
                    if (item.element === el && item.type === type && item.fn === fn) {
                        return i;
                    }
                }
            }

        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {
        "./eventmap": 6,
        "custom-event": 7
    }],
    6: [function (require, module, exports) {
        (function (global) {
            'use strict';

            var eventmap = [];
            var eventname = '';
            var ron = /^on/;

            for (eventname in global) {
                if (ron.test(eventname)) {
                    eventmap.push(eventname.slice(2));
                }
            }

            module.exports = eventmap;

        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {}],
    7: [function (require, module, exports) {
        (function (global) {

            var NativeCustomEvent = global.CustomEvent;

            function useNative() {
                try {
                    var p = new NativeCustomEvent('cat', {
                        detail: {
                            foo: 'bar'
                        }
                    });
                    return 'cat' === p.type && 'bar' === p.detail.foo;
                } catch (e) {}
                return false;
            }

            /**
             * Cross-browser `CustomEvent` constructor.
             *
             * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent.CustomEvent
             *
             * @public
             */

            module.exports = useNative() ? NativeCustomEvent :

                // IE >= 9
                'function' === typeof document.createEvent ? function CustomEvent(type, params) {
                    var e = document.createEvent('CustomEvent');
                    if (params) {
                        e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
                    } else {
                        e.initCustomEvent(type, false, false, void 0);
                    }
                    return e;
                } :

                // IE <= 8
                function CustomEvent(type, params) {
                    var e = document.createEventObject();
                    e.type = type;
                    if (params) {
                        e.bubbles = Boolean(params.bubbles);
                        e.cancelable = Boolean(params.cancelable);
                        e.detail = params.detail;
                    } else {
                        e.bubbles = false;
                        e.cancelable = false;
                        e.detail = void 0;
                    }
                    return e;
                }

        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {}],
    8: [function (require, module, exports) {
        'use strict';

        var cache = {};
        var start = '(?:^|\\s)';
        var end = '(?:\\s|$)';

        function lookupClass(className) {
            var cached = cache[className];
            if (cached) {
                cached.lastIndex = 0;
            } else {
                cache[className] = cached = new RegExp(start + className + end, 'g');
            }
            return cached;
        }

        function addClass(el, className) {
            var current = el.className;
            if (!current.length) {
                el.className = className;
            } else if (!lookupClass(className).test(current)) {
                el.className += ' ' + className;
            }
        }

        function rmClass(el, className) {
            el.className = el.className.replace(lookupClass(className), ' ').trim();
        }

        module.exports = {
            add: addClass,
            rm: rmClass
        };

}, {}],
    9: [function (require, module, exports) {
        (function (global) {
            'use strict';

            var emitter = require('contra/emitter');
            var crossvent = require('crossvent');
            var classes = require('./classes');
            var doc = document;
            var documentElement = doc.documentElement;

            function dragula(initialContainers, options) {
                var len = arguments.length;
                if (len === 1 && Array.isArray(initialContainers) === false) {
                    options = initialContainers;
                    initialContainers = [];
                }
                var _mirror; // mirror image
                var _source; // source container
                var _item; // item being dragged
                var _offsetX; // reference x
                var _offsetY; // reference y
                var _moveX; // reference move x
                var _moveY; // reference move y
                var _initialSibling; // reference sibling when grabbed
                var _currentSibling; // reference sibling now
                var _copy; // item used for copying
                var _renderTimer; // timer for setTimeout renderMirrorImage
                var _lastDropTarget = null; // last container item was over
                var _grabbed; // holds mousedown context until first mousemove

                var o = options || {};
                if (o.moves === void 0) {
                    o.moves = always;
                }
                if (o.accepts === void 0) {
                    o.accepts = always;
                }
                if (o.invalid === void 0) {
                    o.invalid = invalidTarget;
                }
                if (o.containers === void 0) {
                    o.containers = initialContainers || [];
                }
                if (o.isContainer === void 0) {
                    o.isContainer = never;
                }
                if (o.copy === void 0) {
                    o.copy = false;
                }
                if (o.copySortSource === void 0) {
                    o.copySortSource = false;
                }
                if (o.revertOnSpill === void 0) {
                    o.revertOnSpill = false;
                }
                if (o.removeOnSpill === void 0) {
                    o.removeOnSpill = false;
                }
                if (o.direction === void 0) {
                    o.direction = 'vertical';
                }
                if (o.ignoreInputTextSelection === void 0) {
                    o.ignoreInputTextSelection = true;
                }
                if (o.mirrorContainer === void 0) {
                    o.mirrorContainer = doc.body;
                }

                var drake = emitter({
                    containers: o.containers,
                    start: manualStart,
                    end: end,
                    cancel: cancel,
                    remove: remove,
                    destroy: destroy,
                    canMove: canMove,
                    dragging: false
                });

                if (o.removeOnSpill === true) {
                    drake.on('over', spillOver).on('out', spillOut);
                }

                events();

                return drake;

                function isContainer(el) {
                    return drake.containers.indexOf(el) !== -1 || o.isContainer(el);
                }

                function events(remove) {
                    var op = remove ? 'remove' : 'add';
                    touchy(documentElement, op, 'mousedown', grab);
                    touchy(documentElement, op, 'mouseup', release);
                }

                function eventualMovements(remove) {
                    var op = remove ? 'remove' : 'add';
                    touchy(documentElement, op, 'mousemove', startBecauseMouseMoved);
                }

                function movements(remove) {
                    var op = remove ? 'remove' : 'add';
                    crossvent[op](documentElement, 'selectstart', preventGrabbed); // IE8
                    crossvent[op](documentElement, 'click', preventGrabbed);
                }

                function destroy() {
                    events(true);
                    release({});
                }

                function preventGrabbed(e) {
                    if (_grabbed) {
                        e.preventDefault();
                    }
                }

                function grab(e) {
                    _moveX = e.clientX;
                    _moveY = e.clientY;

                    var ignore = whichMouseButton(e) !== 1 || e.metaKey || e.ctrlKey;
                    if (ignore) {
                        return; // we only care about honest-to-god left clicks and touch events
                    }
                    var item = e.target;
                    var context = canStart(item);
                    if (!context) {
                        return;
                    }
                    _grabbed = context;
                    eventualMovements();
                    if (e.type === 'mousedown') {
                        if (isInput(item)) { // see also: https://github.com/bevacqua/dragula/issues/208
                            item.focus(); // fixes https://github.com/bevacqua/dragula/issues/176
                        } else {
                            e.preventDefault(); // fixes https://github.com/bevacqua/dragula/issues/155
                        }
                    }
                }

                function startBecauseMouseMoved(e) {
                    if (!_grabbed) {
                        return;
                    }
                    if (whichMouseButton(e) === 0) {
                        release({});
                        return; // when text is selected on an input and then dragged, mouseup doesn't fire. this is our only hope
                    }
                    // truthy check fixes #239, equality fixes #207
                    if (e.clientX !== void 0 && e.clientX === _moveX && e.clientY !== void 0 && e.clientY === _moveY) {
                        return;
                    }
                    if (o.ignoreInputTextSelection) {
                        var clientX = getCoord('clientX', e);
                        var clientY = getCoord('clientY', e);
                        var elementBehindCursor = doc.elementFromPoint(clientX, clientY);
                        if (isInput(elementBehindCursor)) {
                            return;
                        }
                    }

                    var grabbed = _grabbed; // call to end() unsets _grabbed
                    eventualMovements(true);
                    movements();
                    end();
                    start(grabbed);

                    var offset = getOffset(_item);
                    _offsetX = getCoord('pageX', e) - offset.left;
                    _offsetY = getCoord('pageY', e) - offset.top;

                    classes.add(_copy || _item, 'gu-transit');
                    renderMirrorImage();
                    drag(e);
                }

                function canStart(item) {
                    if (drake.dragging && _mirror) {
                        return;
                    }
                    if (isContainer(item)) {
                        return; // don't drag container itself
                    }
                    var handle = item;
                    while (getParent(item) && isContainer(getParent(item)) === false) {
                        if (o.invalid(item, handle)) {
                            return;
                        }
                        item = getParent(item); // drag target should be a top element
                        if (!item) {
                            return;
                        }
                    }
                    var source = getParent(item);
                    if (!source) {
                        return;
                    }
                    if (o.invalid(item, handle)) {
                        return;
                    }

                    var movable = o.moves(item, source, handle, nextEl(item));
                    if (!movable) {
                        return;
                    }

                    return {
                        item: item,
                        source: source
                    };
                }

                function canMove(item) {
                    return !!canStart(item);
                }

                function manualStart(item) {
                    var context = canStart(item);
                    if (context) {
                        start(context);
                    }
                }

                function start(context) {
                    if (isCopy(context.item, context.source)) {
                        _copy = context.item.cloneNode(true);
                        drake.emit('cloned', _copy, context.item, 'copy');
                    }

                    _source = context.source;
                    _item = context.item;
                    _initialSibling = _currentSibling = nextEl(context.item);

                    drake.dragging = true;
                    drake.emit('drag', _item, _source);
                }

                function invalidTarget() {
                    return false;
                }

                function end() {
                    if (!drake.dragging) {
                        return;
                    }
                    var item = _copy || _item;
                    drop(item, getParent(item));
                }

                function ungrab() {
                    _grabbed = false;
                    eventualMovements(true);
                    movements(true);
                }

                function release(e) {
                    ungrab();

                    if (!drake.dragging) {
                        return;
                    }
                    var item = _copy || _item;
                    var clientX = getCoord('clientX', e);
                    var clientY = getCoord('clientY', e);
                    var elementBehindCursor = getElementBehindPoint(_mirror, clientX, clientY);
                    var dropTarget = findDropTarget(elementBehindCursor, clientX, clientY);
                    if (dropTarget && ((_copy && o.copySortSource) || (!_copy || dropTarget !== _source))) {
                        drop(item, dropTarget);
                    } else if (o.removeOnSpill) {
                        remove();
                    } else {
                        cancel();
                    }
                }

                function drop(item, target) {
                    var parent = getParent(item);
                    if (_copy && o.copySortSource && target === _source) {
                        parent.removeChild(_item);
                    }
                    if (isInitialPlacement(target)) {
                        drake.emit('cancel', item, _source, _source);
                    } else {
                        drake.emit('drop', item, target, _source, _currentSibling);
                    }
                    cleanup();
                }

                function remove() {
                    if (!drake.dragging) {
                        return;
                    }
                    var item = _copy || _item;
                    var parent = getParent(item);
                    if (parent) {
                        parent.removeChild(item);
                    }
                    drake.emit(_copy ? 'cancel' : 'remove', item, parent, _source);
                    cleanup();
                }

                function cancel(revert) {
                    if (!drake.dragging) {
                        return;
                    }
                    var reverts = arguments.length > 0 ? revert : o.revertOnSpill;
                    var item = _copy || _item;
                    var parent = getParent(item);
                    var initial = isInitialPlacement(parent);
                    if (initial === false && reverts) {
                        if (_copy) {
                            if (parent) {
                                parent.removeChild(_copy);
                            }
                        } else {
                            _source.insertBefore(item, _initialSibling);
                        }
                    }
                    if (initial || reverts) {
                        drake.emit('cancel', item, _source, _source);
                    } else {
                        drake.emit('drop', item, parent, _source, _currentSibling);
                    }
                    cleanup();
                }

                function cleanup() {
                    var item = _copy || _item;
                    ungrab();
                    removeMirrorImage();
                    if (item) {
                        classes.rm(item, 'gu-transit');
                    }
                    if (_renderTimer) {
                        clearTimeout(_renderTimer);
                    }
                    drake.dragging = false;
                    if (_lastDropTarget) {
                        drake.emit('out', item, _lastDropTarget, _source);
                    }
                    drake.emit('dragend', item);
                    _source = _item = _copy = _initialSibling = _currentSibling = _renderTimer = _lastDropTarget = null;
                }

                function isInitialPlacement(target, s) {
                    var sibling;
                    if (s !== void 0) {
                        sibling = s;
                    } else if (_mirror) {
                        sibling = _currentSibling;
                    } else {
                        sibling = nextEl(_copy || _item);
                    }
                    return target === _source && sibling === _initialSibling;
                }

                function findDropTarget(elementBehindCursor, clientX, clientY) {
                    var target = elementBehindCursor;
                    while (target && !accepted()) {
                        target = getParent(target);
                    }
                    return target;

                    function accepted() {
                        var droppable = isContainer(target);
                        if (droppable === false) {
                            return false;
                        }

                        var immediate = getImmediateChild(target, elementBehindCursor);
                        var reference = getReference(target, immediate, clientX, clientY);
                        var initial = isInitialPlacement(target, reference);
                        if (initial) {
                            return true; // should always be able to drop it right back where it was
                        }
                        return o.accepts(_item, target, _source, reference);
                    }
                }

                function drag(e) {
                    if (!_mirror) {
                        return;
                    }
                    e.preventDefault();

                    var clientX = getCoord('clientX', e);
                    var clientY = getCoord('clientY', e);
                    var x = clientX - _offsetX;
                    var y = clientY - _offsetY;

                    _mirror.style.left = x + 'px';
                    _mirror.style.top = y + 'px';

                    var item = _copy || _item;
                    var elementBehindCursor = getElementBehindPoint(_mirror, clientX, clientY);
                    var dropTarget = findDropTarget(elementBehindCursor, clientX, clientY);
                    var changed = dropTarget !== null && dropTarget !== _lastDropTarget;
                    if (changed || dropTarget === null) {
                        out();
                        _lastDropTarget = dropTarget;
                        over();
                    }
                    var parent = getParent(item);
                    if (dropTarget === _source && _copy && !o.copySortSource) {
                        if (parent) {
                            parent.removeChild(item);
                        }
                        return;
                    }
                    var reference;
                    var immediate = getImmediateChild(dropTarget, elementBehindCursor);
                    if (immediate !== null) {
                        reference = getReference(dropTarget, immediate, clientX, clientY);
                    } else if (o.revertOnSpill === true && !_copy) {
                        reference = _initialSibling;
                        dropTarget = _source;
                    } else {
                        if (_copy && parent) {
                            parent.removeChild(item);
                        }
                        return;
                    }
                    if (
                        (reference === null && changed) ||
                        reference !== item &&
                        reference !== nextEl(item)
                    ) {
                        _currentSibling = reference;
                        dropTarget.insertBefore(item, reference);
                        drake.emit('shadow', item, dropTarget, _source);
                    }

                    function moved(type) {
                        drake.emit(type, item, _lastDropTarget, _source);
                    }

                    function over() {
                        if (changed) {
                            moved('over');
                        }
                    }

                    function out() {
                        if (_lastDropTarget) {
                            moved('out');
                        }
                    }
                }

                function spillOver(el) {
                    classes.rm(el, 'gu-hide');
                }

                function spillOut(el) {
                    if (drake.dragging) {
                        classes.add(el, 'gu-hide');
                    }
                }

                function renderMirrorImage() {
                    if (_mirror) {
                        return;
                    }
                    var rect = _item.getBoundingClientRect();
                    _mirror = _item.cloneNode(true);
                    _mirror.style.width = getRectWidth(rect) + 'px';
                    _mirror.style.height = getRectHeight(rect) + 'px';
                    classes.rm(_mirror, 'gu-transit');
                    classes.add(_mirror, 'gu-mirror');
                    o.mirrorContainer.appendChild(_mirror);
                    touchy(documentElement, 'add', 'mousemove', drag);
                    classes.add(o.mirrorContainer, 'gu-unselectable');
                    drake.emit('cloned', _mirror, _item, 'mirror');
                }

                function removeMirrorImage() {
                    if (_mirror) {
                        classes.rm(o.mirrorContainer, 'gu-unselectable');
                        touchy(documentElement, 'remove', 'mousemove', drag);
                        getParent(_mirror).removeChild(_mirror);
                        _mirror = null;
                    }
                }

                function getImmediateChild(dropTarget, target) {
                    var immediate = target;
                    while (immediate !== dropTarget && getParent(immediate) !== dropTarget) {
                        immediate = getParent(immediate);
                    }
                    if (immediate === documentElement) {
                        return null;
                    }
                    return immediate;
                }

                function getReference(dropTarget, target, x, y) {
                    var horizontal = o.direction === 'horizontal';
                    var reference = target !== dropTarget ? inside() : outside();
                    return reference;

                    function outside() { // slower, but able to figure out any position
                        var len = dropTarget.children.length;
                        var i;
                        var el;
                        var rect;
                        for (i = 0; i < len; i++) {
                            el = dropTarget.children[i];
                            rect = el.getBoundingClientRect();
                            if (horizontal && (rect.left + rect.width / 2) > x) {
                                return el;
                            }
                            if (!horizontal && (rect.top + rect.height / 2) > y) {
                                return el;
                            }
                        }
                        return null;
                    }

                    function inside() { // faster, but only available if dropped inside a child element
                        var rect = target.getBoundingClientRect();
                        if (horizontal) {
                            return resolve(x > rect.left + getRectWidth(rect) / 2);
                        }
                        return resolve(y > rect.top + getRectHeight(rect) / 2);
                    }

                    function resolve(after) {
                        return after ? nextEl(target) : target;
                    }
                }

                function isCopy(item, container) {
                    return typeof o.copy === 'boolean' ? o.copy : o.copy(item, container);
                }
            }

            function touchy(el, op, type, fn) {
                var touch = {
                    mouseup: 'touchend',
                    mousedown: 'touchstart',
                    mousemove: 'touchmove'
                };
                var pointers = {
                    mouseup: 'pointerup',
                    mousedown: 'pointerdown',
                    mousemove: 'pointermove'
                };
                var microsoft = {
                    mouseup: 'MSPointerUp',
                    mousedown: 'MSPointerDown',
                    mousemove: 'MSPointerMove'
                };
                if (global.navigator.pointerEnabled) {
                    crossvent[op](el, pointers[type], fn);
                } else if (global.navigator.msPointerEnabled) {
                    crossvent[op](el, microsoft[type], fn);
                } else {
                    crossvent[op](el, touch[type], fn);
                    crossvent[op](el, type, fn);
                }
            }

            function whichMouseButton(e) {
                if (e.touches !== void 0) {
                    return e.touches.length;
                }
                if (e.which !== void 0 && e.which !== 0) {
                    return e.which;
                } // see https://github.com/bevacqua/dragula/issues/261
                if (e.buttons !== void 0) {
                    return e.buttons;
                }
                var button = e.button;
                if (button !== void 0) { // see https://github.com/jquery/jquery/blob/99e8ff1baa7ae341e94bb89c3e84570c7c3ad9ea/src/event.js#L573-L575
                    return button & 1 ? 1 : button & 2 ? 3 : (button & 4 ? 2 : 0);
                }
            }

            function getOffset(el) {
                var rect = el.getBoundingClientRect();
                return {
                    left: rect.left + getScroll('scrollLeft', 'pageXOffset'),
                    top: rect.top + getScroll('scrollTop', 'pageYOffset')
                };
            }

            function getScroll(scrollProp, offsetProp) {
                if (typeof global[offsetProp] !== 'undefined') {
                    return global[offsetProp];
                }
                if (documentElement.clientHeight) {
                    return documentElement[scrollProp];
                }
                return doc.body[scrollProp];
            }

            function getElementBehindPoint(point, x, y) {
                var p = point || {};
                var state = p.className;
                var el;
                p.className += ' gu-hide';
                el = doc.elementFromPoint(x, y);
                p.className = state;
                return el;
            }

            function never() {
                return false;
            }

            function always() {
                return true;
            }

            function getRectWidth(rect) {
                return rect.width || (rect.right - rect.left);
            }

            function getRectHeight(rect) {
                return rect.height || (rect.bottom - rect.top);
            }

            function getParent(el) {
                return el.parentNode === doc ? null : el.parentNode;
            }

            function isInput(el) {
                return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || isEditable(el);
            }

            function isEditable(el) {
                if (!el) {
                    return false;
                } // no parents were editable
                if (el.contentEditable === 'false') {
                    return false;
                } // stop the lookup
                if (el.contentEditable === 'true') {
                    return true;
                } // found a contentEditable element in the chain
                return isEditable(getParent(el)); // contentEditable is set to 'inherit'
            }

            function nextEl(el) {
                return el.nextElementSibling || manually();

                function manually() {
                    var sibling = el;
                    do {
                        sibling = sibling.nextSibling;
                    } while (sibling && sibling.nodeType !== 1);
                    return sibling;
                }
            }

            function getEventHost(e) {
                // on touchend event, we have to use `e.changedTouches`
                // see http://stackoverflow.com/questions/7192563/touchend-event-properties
                // see https://github.com/bevacqua/dragula/issues/34
                if (e.targetTouches && e.targetTouches.length) {
                    return e.targetTouches[0];
                }
                if (e.changedTouches && e.changedTouches.length) {
                    return e.changedTouches[0];
                }
                return e;
            }

            function getCoord(coord, e) {
                var host = getEventHost(e);
                var missMap = {
                    pageX: 'clientX', // IE8
                    pageY: 'clientY' // IE8
                };
                if (coord in missMap && !(coord in host) && missMap[coord] in host) {
                    coord = missMap[coord];
                }
                return host[coord];
            }

            module.exports = dragula;

        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {
        "./classes": 8,
        "contra/emitter": 4,
        "crossvent": 5
    }],
    10: [function (require, module, exports) {
        var si = typeof setImmediate === 'function',
            tick;
        if (si) {
            tick = function (fn) {
                setImmediate(fn);
            };
        } else {
            tick = function (fn) {
                setTimeout(fn, 0);
            };
        }

        module.exports = tick;
}, {}]
}, {}, [1]);
