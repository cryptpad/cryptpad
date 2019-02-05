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
                this.buttonContent = '+';
                defaults = {
                    element: '',
                    gutter: '15px',
                    widthBoard: '250px',
                    responsive: '700',
                    colors: ["yellow", "green", "blue", "red", "orange"],
                    responsivePercentage: false,
                    boards: [],
                    dragBoards: true,
                    addItemButton: false,
                    buttonContent: '+',
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
                    buttonClick: function (el, boardId) {},
                    colorClick: function (el, type) {},
                    addItemClick: function (el, boardId) {},
                    onChange: function () {}
                };

                if (arguments[0] && typeof arguments[0] === "object") {
                    this.options = __extendDefaults(defaults, arguments[0]);
                }

                this.init = function () {
                    // set initial boards
                    __setBoard();
                    //set drag with dragula
                    if (window.innerWidth > self.options.responsive) {

                        //Init Drag Board
                        self.drakeBoard = self.dragula([self.container], {
                                moves: function (el, source, handle, sibling) {
                                    if (self.options.readOnly) { return false; }
                                    if (!self.options.dragBoards) return false;
                                    return (handle.classList.contains('kanban-board-header') || handle.classList.contains('kanban-title-board'));
                                },
                                accepts: function (el, target, source, sibling) {
                                    if (self.options.readOnly) { return false; }
                                    return target.classList.contains('kanban-container');
                                },
                                revertOnSpill: true,
                                direction: 'horizontal',
                            })
                            .on('drag', function (el, source) {
                                el.classList.add('is-moving');
                                self.options.dragBoard(el, source);
                                if (typeof (el.dragfn) === 'function')
                                    el.dragfn(el, source);
                            })
                            .on('dragend', function (el) {
                                el.classList.remove('is-moving');
                                self.options.dragendBoard(el);
                                if (typeof (el.dragendfn) === 'function')
                                    el.dragendfn(el);
                            })
                            .on('drop', function (el, target, source, sibling) {
                                el.classList.remove('is-moving');
                                self.options.dropBoard(el, target, source, sibling);
                                if (typeof (el.dropfn) === 'function')
                                    el.dropfn(el, target, source, sibling);

                                // TODO: update board object board order
                                console.log("Drop " + $(el).attr("data-id") + " just before " + (sibling ? $(sibling).attr("data-id") : " end "));
                                var index1, index2;
                                self.options.boards.some(function (element, index) {
                                    if (element.id === $(el).attr("data-id")) {
                                        index1 = index;
                                        return true;
                                    }
                                });
                                if (sibling) {
                                    self.options.boards.some(function (element, index) {
                                        if (element.id === $(sibling).attr("data-id")) {
                                            index2 = index;
                                            return true;
                                        }
                                    })
                                } else {
                                    index2 = self.options.boards.length;
                                }
                                console.log("Switch " + index1 + " and " + index2);
                                if (index1 < index2)
                                    index2 = index2 - 1;
                                self.options.boards.splice(index2, 0, self.options.boards.splice(index1, 1)[0]);
                                // send event that board has changed
                                self.onChange();

                            });

                        //Init Drag Item
                        self.drake = self.dragula(self.boardContainer, {
                            moves: function (el, source, handle, sibling) {
                                if (self.options.readOnly) { return false; }
                                return handle.classList.contains('kanban-item');
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

                                el.classList.add('is-moving');
                                var boardJSON = __findBoardJSON(source.parentNode.dataset.id);
                                if (boardJSON.dragTo !== undefined) {
                                    self.options.boards.map(function (board) {
                                        if (boardJSON.dragTo.indexOf(board.id) === -1 && board.id !== source.parentNode.dataset.id) {
                                            self.findBoard(board.id).classList.add('disabled-board');
                                        }
                                    })
                                }

                                self.options.dragEl(el, source);
                                if (el !== null && typeof (el.dragfn) === 'function')
                                    el.dragfn(el, source);
                            })
                            .on('dragend', function (el) {
                                console.log("In dragend");
                                el.classList.remove('is-moving');
                                self.options.dragendEl(el);
                                if (el !== null && typeof (el.dragendfn) === 'function')
                                    el.dragendfn(el);
                            })
                            .on('cancel', function (el, container, source) {
                                console.log("In cancel");
                                el.classList.remove('is-moving');
                                // FIXME custom code
                                var boardId = source.parentNode.dataset.id;
                                self.options.dragcancelEl(el, boardId);
                            })
                            .on('drop', function(el, target, source, sibling) {
                                self.enableAllBoards();
                                el.classList.remove('is-moving');

                                console.log("In drop");

                                // TODO: update board object board order
                                var board1;
                                self.options.boards.some(function (element) {
                                    if (element.id === $(source.parentNode).attr("data-id")) {
                                        return board1 = element;
                                    }
                                });
                                var board2;
                                self.options.boards.some(function (element) {
                                    if (element.id === $(target.parentNode).attr("data-id")) {
                                        return board2 = element;
                                    }
                                });
                                var pos1 = self.dragItemPos;
                                var pos2 = (sibling) ? self.findElementPosition(sibling) : (board2.item.length + 1);
                                console.log("Drop element " + pos1 + " before " + pos2);

                                // TODO: update board object item order

                                var allB = document.querySelectorAll('.kanban-board');
                                if (allB.length > 0 && allB !== undefined) {
                                    for (var i = 0; i < allB.length; i++) {
                                        allB[i].classList.remove('disabled-board');
                                    }
                                }
                                var boardJSON = __findBoardJSON(source.parentNode.dataset.id);
                                if (boardJSON.dragTo !== undefined) {
                                    if (boardJSON.dragTo.indexOf(target.parentNode.dataset.id) === -1 && target.parentNode.dataset.id !== source.parentNode.dataset.id) {
                                        self.drake.cancel(true)
                                    }
                                }
                                if (el !== null) {
                                    self.options.dropEl(el, target, source, sibling);
                                    el.classList.remove('is-moving');
                                    if (typeof (el.dropfn) === 'function')
                                        el.dropfn(el, target, source, sibling);
                                }

                                var item = board1.item[pos1];
                                // if (board1==board2 && pos2<pos1)
                                //   pos2 = pos2;

                                // moving element to target array
                                board1.item.splice(pos1, 1);
                                board2.item.splice(pos2 - 1, 0, item);

                                // send event that board has changed
                                self.onChange();

                            })
                    }
                };

                this.enableAllBoards = function() {
                    var allB = document.querySelectorAll('.kanban-board');
                    if (allB.length > 0 && allB !== undefined) {
                        for (var i = 0; i < allB.length; i++) {
                            allB[i].classList.remove('disabled-board');
                        }
                    }
                };

                this.addElement = function (boardID, element) {

                    // add Element to JSON
                    var boardJSON = __findBoardJSON(boardID);
                    boardJSON.item.push({
                        title: element.title
                    });
                    var board = self.element.querySelector('[data-id="' + boardID + '"] .kanban-drag');
                    var nodeItem = document.createElement('div');
                    nodeItem.classList.add('kanban-item');
                    if (element.id) {
                        nodeItem.setAttribute('data-eid', element.id)
                    }
                    nodeItem.innerHTML = element.title;
                    //add function
                    nodeItem.clickfn = element.click;
                    nodeItem.dragfn = element.drag;
                    nodeItem.dragendfn = element.dragend;
                    nodeItem.dropfn = element.drop;
                    __onclickHandler(nodeItem);
                    __onColorClickHandler(nodeItem, "item");
                    board.appendChild(nodeItem);
                    // send event that board has changed
                    self.onChange();
                    return self;
                };

                this.addForm = function (boardID, formItem) {
                    var board = self.element.querySelector('[data-id="' + boardID + '"] .kanban-drag');
                    board.appendChild(formItem);
                    return self;
                };


                this.addBoards = function(boards) {
                    if (self.options.responsivePercentage) {
                        self.container.style.width = '100%';
                        self.options.gutter = '1%';
                        if (window.innerWidth > self.options.responsive) {
                            var boardWidth = (100 - boards.length * 2) / boards.length;
                        } else {
                            var boardWidth = 100 - (boards.length * 2);
                        }
                    } else {
                        var boardWidth = self.options.widthBoard;
                    }
                    var addButton = self.options.addItemButton;
                    var buttonContent = self.options.buttonContent;


                    //for on all the boards
                    for (var boardkey in boards) {
                        // single board
                        var board = boards[boardkey];
                        if (self.options.boards !== boards)
                            self.options.boards.push(board);

                        //create node
                        var boardNode = document.createElement('div');
                        boardNode.dataset.id = board.id;
                        boardNode.classList.add('kanban-board');
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
                        if (board.class !== '' && board.class !== undefined)
                            var allClasses = board.class.split(",");
                        else allClasses = [];
                        headerBoard.classList.add('kanban-board-header');
                        allClasses.map(function (value) {
                            headerBoard.classList.add(value);
                        });
                        if (board.color !== '' && board.color !== undefined) {
                            headerBoard._jscLinkedInstance = undefined;
                            jscolorL = new jscolor(headerBoard,{showOnClick: false, valueElement:undefined});
                            jscolorL.fromString(board.color);
                            headerBoard._jscLinkedInstance = undefined;
                            headerBoard.classList.add("kanban-header-" + board.color);
                        }
                        titleBoard = document.createElement('div');
                        titleBoard.classList.add('kanban-title-board');
                        titleBoard.innerHTML = board.title;
                        titleBoard.setAttribute('title', board.title);
                        titleBoard.clickfn = board.boardTitleClick;
                        __onboardTitleClickHandler(titleBoard);
                        headerBoard.appendChild(titleBoard);
                        __onColorClickHandler(headerBoard, "board");

                        // if add button is true, add button to the board
                        if (addButton) {
                            var btn = document.createElement("BUTTON");
                            btn.setAttribute("class", "kanban-title-button btn btn-default btn-xs fa fa-times");
                            //var buttonHtml = '<button class="kanban-title-button btn btn-default btn-xs">'+buttonContent+'</button>'
                            headerBoard.appendChild(btn);
                            __onButtonClickHandler(btn, board.id);
                        }
                        //content board
                        var contentBoard = document.createElement('main');
                        contentBoard.classList.add('kanban-drag');
                        //add drag to array for dragula
                        self.boardContainer.push(contentBoard);
                        for (var itemkey in board.item) {
                            //create item
                            var itemKanban = board.item[itemkey];
                            var nodeItem = document.createElement('div');
                            nodeItem.classList.add('kanban-item');
                            nodeItem.dataset.eid = itemKanban.id;
                            var nodeItemText = document.createElement('div');
                            nodeItemText.classList.add('kanban-item-text');
                            nodeItemText.dataset.eid = itemKanban.id;
                            nodeItemText.innerHTML = itemKanban.title;
                            nodeItem.appendChild(nodeItemText);
                            //add function
                            nodeItemText.clickfn = itemKanban.click;
                            nodeItemText.dragfn = itemKanban.drag;
                            nodeItemText.dragendfn = itemKanban.dragend;
                            nodeItemText.dropfn = itemKanban.drop;
                            //add click handler of item
                            __onclickHandler(nodeItemText);
                            if (itemKanban.color !== '' && itemKanban.color !== undefined) {
	                            jscolorL = new jscolor(nodeItem,{showOnClick: false, valueElement:undefined});
	                            jscolorL.fromString(itemKanban.color);
	                        }
                            __onColorClickHandler(nodeItem, "item");

                            contentBoard.appendChild(nodeItem);
                        }
                        //footer board
                        var footerBoard = document.createElement('footer');
                        //add button
                        var addBoardItem = document.createElement('button');
                        $(addBoardItem).addClass("kanban-additem btn btn-default fa fa-plus");
                        footerBoard.appendChild(addBoardItem);
                        __onAddItemClickHandler(addBoardItem);

                        //board assembly
                        boardNode.appendChild(headerBoard);
                        boardNode.appendChild(contentBoard);
                        boardNode.appendChild(footerBoard);
                        //board add
                        self.container.appendChild(boardNode);
                    }

                    // send event that board has changed
                    self.onChange();

                    return self;
                }

                this.setBoards = function (boards) {
                    self.element
                    for (var boardkey in this.options.boards) {
                        var board = this.options.boards[boardkey];
                        this.removeBoard(board.id);
                    }
                    this.options.boards = [];
                    this.addBoards(boards);
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
                    if (typeof (board) === 'string')
                        board = self.element.querySelector('[data-id="' + board + '"]');
                    if (board) {
                        board.remove();

                        // send event that board has changed
                        self.onChange();
                    }

                    return self;
                }

                // board button on click function
                this.onButtonClick = function (el) {

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
                    addBoard.setAttribute('class', 'fa fa-plus');
                    boardContainerOuter.appendChild(addBoard);

                    self.container = boardContainer;
                    //add boards
                    self.addBoards(self.options.boards);
                    //appends to container
                    self.element.appendChild(boardContainerOuter);

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

                function __onColorClickHandler(nodeItem, type) {
                    nodeItem.addEventListener('click', function (e) {
                        if (Array.prototype.slice.call(nodeItem.classList).indexOf('is-moving') !== -1) {
                            return;
                        }
                        e.preventDefault;
                        e.stopPropagation();
                        self.options.colorClick(this, type);
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

                function __onButtonClickHandler(nodeItem, boardId) {
                    nodeItem.addEventListener('click', function (e) {
                        e.stopPropagation();
                        e.preventDefault;
                        self.options.buttonClick(this, boardId, e);
                        // if(typeof(this.clickfn) === 'function')
                        //     this.clickfn(this);
                    });
                }

                function __findBoardJSON(id) {
                    var el = []
                    self.options.boards.map(function (board) {
                        if (board.id === id) {
                            return el.push(board)
                        }
                    })
                    return el[0]
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
