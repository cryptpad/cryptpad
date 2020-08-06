define([
    'jquery',
    '/customize/messages.js',
    '/common/common-util.js',
    '/common/visible.js',
    '/bower_components/dragula.js/dist/dragula.min.js',
], function ($, Messages, Util, Visible, Dragula) {
        /**
         * jKanban
         * Vanilla Javascript plugin for manage kanban boards
         *
         * @site: http://www.riccardotartaglia.it/jkanban/
         * @author: Riccardo Tartaglia
         */
    return function () {
        var self = this;
        this.element = '';
        this.container = '';
        this.boardContainer = [];
        this.dragula = Dragula;
        this.drake = '';
        this.drakeBoard = '';
        this.addItemButton = false;
        this.cache = {};
        var defaults = {
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
            dragEl: function (/*el, source*/) {},
            dragendEl: function (/*el*/) {},
            dropEl: function (/*el, target, source, sibling*/) {},
            dragcancelEl: function (/*el, boardId*/) {},
            dragBoard: function (/*el, source*/) {},
            dragendBoard: function (/*el*/) {},
            dropBoard: function (/*el, target, source, sibling*/) {},
            click: function (/*el*/) {},
            boardTitleclick: function (/*el, boardId*/) {},
            addItemClick: function (/*el, boardId*/) {},
            renderMd: function (/*md*/) {},
            applyHtml: function (/*html, node*/) {},
            refresh: function () {},
            onChange: function () {}
        };

        var __extendDefaults = function (source, properties) {
            var property;
            for (property in properties) {
                if (properties.hasOwnProperty(property)) {
                    source[property] = properties[property];
                }
            }
            return source;
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

        // Private functions

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
            addBoard.innerHTML = '<i class="fa fa-plus"></i>';
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
        }

        function __onclickHandler(nodeItem) {
            nodeItem.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.options.click(this);
                if (typeof (this.clickfn) === 'function') {
                    this.clickfn(this);
                }
            });
        }

        function __onboardTitleClickHandler(nodeItem) {
            nodeItem.addEventListener('click', function (e) {
                e.preventDefault();
                self.options.boardTitleClick(this, e);
                if (typeof (this.clickfn) === 'function') {
                    this.clickfn(this);
                }
            });
        }

        function __onAddItemClickHandler(nodeItem) {
            nodeItem.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.options.addItemClick(this);
                if (typeof (this.clickfn) === 'function') {
                    this.clickfn(this);
                }
            });
        }

        function __findBoardJSON(id) {
            return (self.options.boards.data || {})[id];
        }


        this.init = function () {
            // set initial boards
            __setBoard();

            // Scroll on drag
            var $el = $(self.element);
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
            var mouseMoveState = false;
            var mouseDown = function () {
                mouseMoveState = true;
            };
            var mouseUp = function () {
                mouseMoveState = false;
            };
            var onMouseMove = function (isItem) {
                var to;
                var f = function (e) {
                    if (!mouseMoveState) { return; }
                    if (e.which !== 1) { return; } // left click
                    var distance = 20;
                    var moved = false;
                    // If this is an item drag, check scroll
                    if (isItem && activeBoard) {
                        var rect = activeBoard.getBoundingClientRect();
                        if (e.pageX > rect.left && e.pageX < rect.right) {
                            if (e.pageY < (rect.top + 20)) {
                                distance *= -1;
                                $aB.scrollTop(distance + $aB.scrollTop()) ;
                                moved = true;
                            } else if (e.pageY > (rect.bottom - 20)) {
                                $aB.scrollTop(distance + $aB.scrollTop()) ;
                                moved = true;
                            }
                        }
                    }
                    // Itme or board: horizontal scroll if needed
                    if (e.pageX < leftRegion) {
                        distance *= -1;
                        $el.scrollLeft(distance + $el.scrollLeft()) ;
                        moved = true;
                    } else if (e.pageX >= rightRegion) {
                        $el.scrollLeft(distance + $el.scrollLeft()) ;
                        moved = true;
                    }
                    if (!moved) { return; }
                    clearTimeout(to);
                    to = setTimeout(function () {
                        if (!mouseMoveState) { return; }
                        f(e);
                    }, 100);
                };
                return f;
            };

            //set drag with dragula
            if (window.innerWidth > self.options.responsive) {

                //Init Drag Board
                self.drakeBoard = self.dragula([self.container, self.trashContainer], {
                        moves: function (el, source, handle) {
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
                        mouseDown();
                        $(document).on('mousemove', onMouseMove());
                    })
                    .on('dragend', function (el) {
                        el.classList.remove('is-moving');
                        self.options.dragendBoard(el);
                        mouseUp();
                        $(document).off('mousemove');
                        $('.kanban-trash').removeClass('kanban-trash-suggest');
                        if (typeof (el.dragendfn) === 'function') {
                            el.dragendfn(el);
                        }
                    })
                    .on('over', function (el, target) {
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
                    moves: function (el) {
                        if (self.options.readOnly) { return false; }
                        if (el.classList.contains('new-item')) { return false; }
                        return el.classList.contains('kanban-item');
                    },
                    accepts: function () {
                        if (self.options.readOnly) { return false; }
                        return true;
                    },
                    revertOnSpill: true
                })
                    .on('cancel', function() {
                        self.enableAllBoards();
                    })
                    .on('drag', function (el, source) {
                        // we need to calculate the position before starting to drag
                        self.dragItemPos = self.findElementPosition(el);

                        setActiveDrag();
                        el.classList.add('is-moving');
                        mouseDown();
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
                        mouseUp();
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
                    .on('over', function (el, target) {
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
                    });
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
                nodeBody.setAttribute('id', 'kanban-body-' + element.id);
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
                //nodeBody.innerHTML = html;
                self.applyHtml(html, nodeBody);
                nodeBody.classList.add('kanban-item-body');
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

        this.addElement = function (boardID, element, before) {

            // add Element to JSON
            var boardJSON = __findBoardJSON(boardID);

            if (before) {
                boardJSON.item.unshift(element.id);
            } else {
                boardJSON.item.push(element.id);
            }
            self.options.boards.items = self.options.boards.items || {};
            self.options.boards.items[element.id] = element;

            var board = self.element.querySelector('[data-id="' + boardID + '"] .kanban-drag');
            if (before) {
                board.insertBefore(getElementNode(element), board.firstChild);
            } else {
                board.appendChild(getElementNode(element));
            }
            // send event that board has changed
            self.onChange();
            return self;
        };

        this.addForm = function (boardID, formItem, isTop) {
            var board = self.element.querySelector('[data-id="' + boardID + '"] .kanban-drag');
            if (isTop) {
                board.insertBefore(formItem, board.firstChild);
            } else {
                board.appendChild(formItem);
            }
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
            var allClasses = [];
            if (board.class !== '' && board.class !== undefined) {
                allClasses = board.class.split(",");
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

            var titleBoard = document.createElement('div');
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
            var addTopBoardItem = document.createElement('span');
            addTopBoardItem.classList.add('kanban-title-button');
            addTopBoardItem.setAttribute('data-top', "1");
            addTopBoardItem.innerHTML = '<i class="cptools cptools-add-top">';
            footerBoard.appendChild(addTopBoardItem);
            __onAddItemClickHandler(addTopBoardItem);
            var addBoardItem = document.createElement('span');
            addBoardItem.classList.add('kanban-title-button');
            addBoardItem.innerHTML = '<i class="cptools cptools-add-bottom">';
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
        };

        var onVisibleHandler = false;
        this.setBoards = function (boards) {
            var scroll = {};
            // Fix the tags
            checkCache(boards);
            removeUnusedTags(boards);
            // Get horizontal scroll
            var $el = $(self.element);
            var scrollLeft = $el.scrollLeft();
            // Get existing boards list
            var list = Util.clone(this.options.boards.list);

            // Update memory
            this.options.boards = boards;

            // If the tab is not focused but a handler already exists: abort
            if (!Visible.currently() && onVisibleHandler) { return; }

            var todoOnVisible = function () {
                // Remove all boards
                for (var i in list) {
                    var boardkey = list[i];
                    scroll[boardkey] = $('.kanban-board[data-id="'+boardkey+'"] .kanban-drag').scrollTop();
                    self.removeBoard(boardkey);
                }

                // Add all new boards
                self.addBoards();
                self.options.refresh();
                // Preserve scroll
                self.options.boards.list.forEach(function (id) {
                    if (!scroll[id]) { return; }
                    $('.kanban-board[data-id="'+id+'"] .kanban-drag').scrollTop(scroll[id]);
                });
                $el.scrollLeft(scrollLeft);
            };

            // If the tab is not focused, redraw on focus
            if (!Visible.currently()) {
                onVisibleHandler = true;
                return void Visible.onChange(function (visible) {
                    if (!visible) { return; }
                    todoOnVisible();
                    onVisibleHandler = false;
                }, true);
            }
            todoOnVisible();
        };

        this.findBoard = function (id) {
            var el = self.element.querySelector('[data-id="' + id + '"]');
            return el;
        };

        this.findElement = function (id) {
            var el = self.element.querySelector('[data-eid="' + id + '"]');
            return el;
        };

        this.findElementPosition = function (el) {
            // we are looking at the element position in the child array
            return $(el.parentNode.children).index(el);
        };

        this.getBoardElements = function (id) {
            var board = self.element.querySelector('[data-id="' + id + '"] .kanban-drag');
            return (board.childNodes);
        };

        this.removeElement = function (el) {
            if (typeof (el) === 'string') {
                el = self.element.querySelector('[data-eid="' + el + '"]');
            }
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
        };

        this.applyHtml = function (html, node) {
            return self.options.applyHtml(html, node);
        };
        this.renderMd = function (md) {
            return self.options.renderMd(md);
        };
        this.onChange = function () {
            self.options.onChange();
        };

        this.getBoardsJSON = function () {
            return self.options.boards;
        };

        this.getBoardJSON = function (id) {
            return __findBoardJSON(id);
        };
        this.getItemJSON = function (id) {
            return (self.options.boards.items || {})[id];
        };


        //init plugin
        this.init();
    };
});
