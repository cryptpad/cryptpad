// This is the initialization loading the CryptPad libraries
define([
    'jquery',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-app-framework.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/modes.js',
    '/customize/messages.js',
    '/bower_components/x2js/xml2json.js',
    'less!/drawio/app.less',
    'css!/drawio/drawio.css',
    /* Here you can add your own javascript or css to load */
], function (
    $,
    nThen,
    SFCommon,
    Framework,
    Util,
    Hash,
    Modes,
    Messages,
    X2JS) {

    console.log("X2JS: ", X2JS);

    // This is the main initialization loop
    var andThen2 = function (framework) {

       var storeSelection = function() {
          try {
            return { "elements" : window.frames[0].ui.editor.graph.getSelectionCells(), "translate" : window.frames[0].ui.editor.graph.view.getTranslate() };
          } catch(e) {
            console.log("Exception storing selection");
            console.log(e);
            return null;
          }
        }

        var restoreSelection = function(selection) {
          try {
           var graph = window.frames[0].ui.editor.graph;
           if (selection && selection.elements) {
             selection.elements.forEach(function(element) {
               if (element!=null) {
                 var cell = graph.model.getCell(element.id);
                 if (cell)
                   graph.addSelectionCell(cell);
               }
             });
             if (selection.translate)
                     window.frames[0].ui.editor.graph.view.getTranslate(selection.translate.x, selection.translate.y)
           }
          } catch(e) {
            console.log("Exception restoring selection");
            console.log(e);
            return null;
          } 
        }

        // Here you can load the objects or call the functions you have defined
        // This is the function from which you will receive updates from CryptPad
        // In this example we update the textarea with the data received
        framework.onContentUpdate(function (newContent) {
            console.log("Content received from network: " + newContent);
            var x2js = new X2JS();
            console.log("Content received from network: ", newContent.content);
            console.log(JSON.stringify(newContent.content)); 
	    if (window.frames[0].ui) {
            var currentXml = window.frames[0].mxUtils.getXml(window.frames[0].ui.getXmlFileData(true, null, true, true));
            currentContent = x2js.xml_str2json(currentXml)
            currentContent.mxfile.diagram.mxGraphModel._dx = 0
            currentContent.mxfile.diagram.mxGraphModel._dy = 0
            if (currentContent!==newContent.content) {
              try {
                console.log("Applying content in drawio");
                var xml = x2js.json2xml_str(newContent.content);
                var selection = storeSelection();
                window.frames[0].ui.setFileData(xml);
                restoreSelection(selection);
	      } catch (e) {
		// in case application fails.. let's force the old content
                window.frames[0].ui.setFileData(currentXml);
	      } 
            } else {
              console.log("Content from network is the same");
            } 
            } else {
              console.log("Draw io is not yet initialized");
              var xml = x2js.json2xml_str(newContent.content);
              framework.initialContent = xml;
	    }
        });

        // This is the function called to get the current state of the data in your app
        // Here we read the data from the textarea and put it in a javascript object
        framework.setContentGetter(function () {
	  if (window.frames[0].ui) {
            var data = window.frames[0].mxUtils.getXml(window.frames[0].ui.getXmlFileData(true, null, true, true));
            if (!data || data==undefined)
             data = "";
            var x2js = new X2JS();
            content = x2js.xml_str2json(data)
            if (content.mxfile) {
            content.mxfile.diagram.mxGraphModel._dx = 0
            content.mxfile.diagram.mxGraphModel._dy = 0
	    } else {
             console.log("Could not find mxfile in content");
	    }
            console.log("Content sent to network ", content);
            console.log(JSON.stringify(content));
            return {
                content: content
            };
     	  } else {
            return {
                content: ""
            };
	  }
        });

        // This is called when the system is ready to start editing
        // We focus the textarea
        framework.onReady(function (newPad) {
            $("#cp-app-miniapp-content").focus();
        });

        framework.initDrawioDone = function() {
		console.log("draw io is initialized");
                if (framework.initialContent) {
                  var currentXml = window.frames[0].mxUtils.getXml(window.frames[0].ui.getXmlFileData(true, null, true, true));
	  	  try {
			  window.frames[0].ui.setFileData(framework.initialContent);
		  } catch (e) {
			  window.frames[0].ui.setFileData(currentXml);
		  }
		}
	}

        framework.start();
	if (window.frames[0] && window.frames[0].ui)
          window.frames[0].ui.toggleCompactMode();
    }

    // This is the main starting loop
    var main = function () {
        var framework;

        nThen(function (waitFor) {

            // Framework initialization
            Framework.create({
                toolbarContainer: '#cme_toolbox',
                contentContainer: '#cp-app-drawio-editor'
            }, waitFor(function (fw) {
                window.framework = framework = fw;
                andThen2(framework);
            }));
        });
    };
    main();
});
