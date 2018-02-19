config = {
    "document": {
        "fileType": "pptx",
        "key": "Khirz6zTPdfd7",
        "title": "test.pptx",
        "url": "/onlyoffice/test.pptx"
    },
    "documentType": "presentation",
    "editorConfig": {
                        "user": {
                        "id": "c0c3bf82-20d7-4663-bf6d-7fa39c598b1d",
                        "name": "John Smith"
                    }
    },
    "events": {
     "onDocumentStateChange": function(evt) { console.log("in change"); },
     "onReady": function(evt) { console.log("in onReady"); }
    }
};
window.onbeforeunload = null;


var docEditor = new DocsAPI.DocEditor("placeholder", config);

