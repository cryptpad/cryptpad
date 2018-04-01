define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar3.js',
    'json.sortify',
    '/common/common-util.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/api/config',
    '/common/common-realtime.js',
    '/customize/pages.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/common/common-thumbnail.js',
    '/bower_components/chainpad/chainpad.dist.js',

    '/bower_components/secure-fabric.js/dist/fabric.min.js',
    '/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
    'css!/kanban/jkanban.css',
    '/kanban/jkanban.js',
], function (
    $,
    Crypto,
    Toolbar,
    JSONSortify,
    Util,
    nThen,
    SFCommon,
    UI,
    ApiConfig,
    CommonRealtime,
    Pages,
    Messages,
    AppConfig,
    Thumb,
    ChainPad)
{
    var saveAs = window.saveAs;

    var APP = window.APP = {
        $: $
    };
    var Fabric = APP.Fabric = window.fabric;

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var toolbar;

    var andThen = function (common) {
        var config = {};
        /* Initialize Fabric */
        var canvas = APP.canvas = null;
        var $canvas = $('canvas');
        var readOnly = false;

        var setEditable = function (bool) {
            APP.editable = bool;
            if (readOnly && bool) { return; }
        };

        var saveImage = APP.saveImage = function () {
        };

        APP.FM = common.createFileManager({});
        APP.upload = function (title) {            
        };

        var initializing = true;
        var $bar = $('#cp-toolbar');
        var Title;
        var cpNfInner;
        var metadataMgr;

        config = {
            readOnly: readOnly,
            patchTransformer: ChainPad.NaiveJSONTransformer,
            // cryptpad debug logging (default is 1)
            // logLevel: 0,
            validateContent: function (content) {
                try {
                    JSON.parse(content);
                    return true;
                } catch (e) {
                    console.log("Failed to parse, rejecting patch");
                    return true;
                }
            }
        };

        var stringifyInner = function (textValue) {
            var obj = {
                content: textValue,
                metadata: metadataMgr.getMetadataLazy()
            };
            // stringify the json and send it into chainpad
            return stringify(obj);
        };

        var onLocal = config.onLocal = function () {
            if (initializing) { return; }
            if (readOnly) { return; }

            var content = stringifyInner(Kanban.getBoardsJSON());
            console.log("Updating content " + content);

            try {
                APP.realtime.contentUpdate(content);
            } catch (e) {
                APP.unrecoverable = true;
                setEditable(false);
                APP.toolbar.errorState(true, e.message);
                var msg = Messages.chainpadError;
                UI.errorLoadingScreen(msg, true, true);
                console.error(e);
            }
        };

        var initThumbnails = function () {
            var oldThumbnailState;
            var privateDat = metadataMgr.getPrivateData();
            if (!privateDat.thumbnails) { return; }
            var hash = privateDat.availableHashes.editHash ||
                       privateDat.availableHashes.viewHash;
            var href = privateDat.pathname + '#' + hash;
            var mkThumbnail = function () {
                if (!hash) { return; }
                if (initializing) { return; }
                if (!APP.realtime) { return; }
                var content = APP.realtime.getUserDoc();
                if (content === oldThumbnailState) { return; }
                /*
                var D = Thumb.getResizedDimensions($canvas[0], 'pad');
                Thumb.fromCanvas($canvas[0], D, function (err, b64) {
                    oldThumbnailState = content;
                    Thumb.setPadThumbnail(common, href, b64);
                });
                */
            };
            window.setInterval(mkThumbnail, Thumb.UPDATE_INTERVAL);
            window.setTimeout(mkThumbnail, Thumb.UPDATE_FIRST);
        };

        config.onInit = function (info) {
            readOnly = metadataMgr.getPrivateData().readOnly;

            Title = common.createTitle({});

            var configTb = {
                displayed: [
                    'userlist',
                    'title',
                    'useradmin',
                    'spinner',
                    'newpad',
                    'share',
                    'limit',
                    'unpinnedWarning'
                ],
                title: Title.getTitleConfig(),
                metadataMgr: metadataMgr,
                readOnly: readOnly,
                realtime: info.realtime,
                sfCommon: common,
                $container: $bar,
                $contentContainer: $('#cp-app-kanban-content')
            };
            toolbar = APP.toolbar = Toolbar.create(configTb);
            Title.setToolbar(toolbar);

            var $rightside = toolbar.$rightside;
            var $drawer = toolbar.$drawer;

            /* save as template */
            if (!metadataMgr.getPrivateData().isTemplate) {
                var templateObj = {
                    rt: info.realtime,
                    getTitle: function () { return metadataMgr.getMetadata().title; }
                };
                var $templateButton = common.createButton('template', true, templateObj);
                $rightside.append($templateButton);
            }

            /* add an export button */
            var $export = common.createButton('export', true, {}, saveImage);
            $drawer.append($export);

            if (common.isLoggedIn()) {
                common.createButton('savetodrive', true, {}, function () {})
                .click(function () {
                    UI.prompt(Messages.exportPrompt, document.title + '.png',
                    function (name) {
                        if (name === null || !name.trim()) { return; }
                        APP.upload(name);
                    });
                }).appendTo($rightside);

                common.createButton('hashtag', true).appendTo($rightside);
            }

            var $forget = common.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                setEditable(false);
            });
            $rightside.append($forget);

            var $properties = common.createButton('properties', true);
            toolbar.$drawer.append($properties);

            var $appContainer = $('#cp-app-kanban-container');
            var helpMenu = common.createHelpMenu(['kanban']);
            $appContainer.prepend(helpMenu.menu);
            toolbar.$drawer.append(helpMenu.button);

            metadataMgr.onChange(function () {
                var md = metadataMgr.getMetadata();
            });
            
        };

        config.onReady = function (info) {
            if (APP.realtime !== info.realtime) {
                APP.realtime = info.realtime;
            }

            var userDoc = APP.realtime.getUserDoc();
            var isNew = false;
            var newDoc = '';
            if (userDoc === "" || userDoc === "{}") { isNew = true; }

            if (userDoc !== "") {
                var hjson = JSON.parse(userDoc);

                if (hjson && hjson.metadata) {
                    metadataMgr.updateMetadata(hjson.metadata);
                }
                if (typeof (hjson) !== 'object' || Array.isArray(hjson) ||
                    (hjson.metadata && typeof(hjson.metadata.type) !== 'undefined' &&
                     hjson.metadata.type !== 'kanban')) {
                    var errorText = Messages.typeError;
                    UI.errorLoadingScreen(errorText);
                    throw new Error(errorText);
                }
                newDoc = hjson.content;

                // launch the kanban code
                config.initKanban(newDoc);

            } else {
                Title.updateTitle(Title.defaultTitle);
                config.initKanban();
            }

            nThen(function (waitFor) {
                if (newDoc) {
                }
            }).nThen(function () {
                setEditable(!readOnly);
                initializing = false;
                config.onLocal();
                UI.removeLoadingScreen();

                initThumbnails();


                if (readOnly) { return; }

                var privateDat = metadataMgr.getPrivateData();
                var skipTemp = Util.find(privateDat,
                    ['settings', 'general', 'creation', 'noTemplate']);
                var skipCreation = Util.find(privateDat, ['settings', 'general', 'creation', 'skip']);
                if (isNew && (!AppConfig.displayCreationScreen || (!skipTemp && skipCreation))) {
                    common.openTemplatePicker();
                }
            });
        };

        config.onRemote = function () {
            if (initializing) { return; }
            var userDoc = APP.realtime.getUserDoc();

            console.log("Received content: " + userDoc);

            var json = JSON.parse(userDoc);
            var remoteDoc = json.content;
            
            var currentContent = stringify(Kanban.getBoardsJSON());
            var remoteContent = stringify(json.content);

            
            if (currentContent !== remoteContent) { 
               // reinit kanban (TODO: optimize to diff only)
               console.log("Content is different.. Applying content");
               config.Kanban.setBoards(remoteDoc);
               common.notify(); 
            }
            if (readOnly) { setEditable(false); }
        };

        config.onAbort = function () {
            if (APP.unrecoverable) { return; }
            // inform of network disconnect
            setEditable(false);
            toolbar.failed();
            UI.alert(Messages.common_connectionLost, undefined, true);
        };

        config.onConnectionChange = function (info) {
            if (APP.unrecoverable) { return; }
            setEditable(info.state);
            if (info.state) {
                initializing = true;
                //UI.findOKButton().click();
            } else {
                //UI.alert(Messages.common_connectionLost, undefined, true);
            }
        };

        config.onError = function (err) {
            common.onServerError(err, toolbar, function () {
                APP.unrecoverable = true;
                setEditable(false);
            });
        };
              
        config.initKanban = function(boards) { 
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
   
    if (boards==null) {
        console.log("Initializing with default boards content");
        boards = defaultBoards; 
    } else {
        console.log("Initializing with boards content " + boards);
    } 
    
    // Remove any existing elements
    $(".kanban-container-outer").remove();
    
    window.Kanban = config.Kanban = new jKanban({
element: '#cp-app-kanban-content',
gutter: '15px',
widthBoard: '300px',
onChange: function() {
console.log("Board object has changed");
config.onLocal();
}
,click: function (el) { 
    if (Kanban.inEditMode) {
      console.log("An edit is already active");
      return;
    }
    Kanban.inEditMode = true;
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
    $('#kanban_edit').blur(function() {
      var name = $('#kanban_edit').val();
      $(el).text(name); 
      var board = $(el.parentNode.parentNode).attr("data-id");
      var pos = Kanban.findElementPosition(el);
      console.log(pos);
      console.log(board);
      Kanban.getBoardJSON(board).item[pos].title = name;
      Kanban.onChange();
      Kanban.inEditMode = false;  
    });

},
boardTitleClick: function (el) { 
    if (Kanban.inEditMode) {
      console.log("An edit is already active");
      return;
    }
    Kanban.inEditMode = true;
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
    $('#kanban_edit').blur(function() {
      var name = $('#kanban_edit').val();
      $(el).text(name); 
      var board = $(el.parentNode.parentNode).attr("data-id");
      Kanban.getBoardJSON(board).title = name;
      Kanban.onChange();
      Kanban.inEditMode = false;  
    });

},
colorClick: function (el, boardId) {
    console.log("in color click");
    var board = $(el.parentNode).attr("data-id");
    var boardJSON = Kanban.getBoardJSON(board);
    var currentColor = boardJSON.color;
    console.log("Current color " + currentColor);
    var index = Kanban.options.colors.findIndex(function(element) { return (element==currentColor) }) + 1;
    console.log("Next index " + index);
    if (index>=Kanban.options.colors.length)
      index = 0;
    var nextColor = Kanban.options.colors[index];
    console.log("Next color " + nextColor);   
    boardJSON.color = nextColor;
    $(el).removeClass("kanban-header-" + currentColor);
    $(el).addClass("kanban-header-" + nextColor);
    Kanban.onChange();
     
},
removeClick: function(el, boardId) {
    if (confirm("Do you want to delete this board?")) {
     console.log("Delete board");
     var boardName = $(el.parentNode.parentNode).attr("data-id");
     for (index in Kanban.options.boards) {
       if (Kanban.options.boards[index].id == boardName) {
          break;
       }
       index++;
     }
     Kanban.options.boards.splice(index, 1);
     Kanban.removeBoard(boardName);
     Kanban.onChange();
    }
},
buttonClick: function (el, boardId) {
console.log(el);
console.log(boardId);
// create a form to enter element 
var formItem = document.createElement('form');
formItem.setAttribute("class", "itemform");
formItem.innerHTML = '<div class="form-group"><textarea class="form-control" rows="2" autofocus></textarea></div><div class="form-group"><button type="submit" class="btn btn-primary btn-xs">Submit</button><button type="button" id="CancelBtn" class="btn btn-default btn-xs pull-right">Cancel</button></div>'

Kanban.addForm(boardId, formItem);
formItem.addEventListener("submit", function (e) {
		e.preventDefault();
		var text = e.target[0].value
		Kanban.addElement(boardId, {
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
         for (var board in Kanban.options.boards) {
           if (board.id == "board" + counter) {
             counter++;
             break;
           }
         }
         found = true;
        }

   		Kanban.addBoards(
				[{
				"id" : "board" + counter,
				"title": "New Board",
				"color": "yellow",
				"item": [
				{
				"title": "Item 1",
				}
				]
				}]
				)
		Kanban.onChange();
		});
		
/*
var toDoButton = document.getElementById('addToDo');
toDoButton.addEventListener('click', function () {
		Kanban.addElement(
				"_todo",
				{
				"title": "Test Add",
				}
				);
		});

var addBoardDefault = document.getElementById('addDefault');
addBoardDefault.addEventListener('click', function () {
		Kanban.addBoards(
				[{
				"id": "_default",
				"title": "Kanban Default",
				"item": [
				{
				"title": "Default Item",
				},
				{
				"title": "Default Item 2",
				},
				{
				"title": "Default Item 3",
				}
				]
				}]
				)
		});

var removeBoard = document.getElementById('removeBoard');
removeBoard.addEventListener('click', function () {
		Kanban.removeBoard('_done');
		});

var removeElement = document.getElementById('removeElement');
removeElement.addEventListener('click', function () {
		Kanban.removeElement('_test_delete');
		});

var allEle = Kanban.getBoardElements('_todo');
allEle.forEach(function (item, index) {
		//console.log(item);
		});
*/
};

        cpNfInner = common.startRealtime(config);
        metadataMgr = cpNfInner.metadataMgr;

        cpNfInner.onInfiniteSpinner(function () {
            if (APP.unrecoverable) { return; }
            setEditable(false);
            UI.confirm(Messages.realtime_unrecoverableError, function (yes) {
                if (!yes) { return; }
                common.gotoURL();
            });
        });

        $('#save').on('click', function () {
        });


        common.onLogout(function () { setEditable(false); });
    };
    
        

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen();
                var $div = $('<div>').append(Pages['/kanban/']());
                $('body').append($div.html());
                $('body').addClass("cp-app-kanban");
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (waitFor) {
            common.getSframeChannel().onReady(waitFor());
        }).nThen(function (waitFor) {
            common.handleNewFile(waitFor);
        }).nThen(function (/*waitFor*/) {
            andThen(common);
        });
    };
    main();
});
