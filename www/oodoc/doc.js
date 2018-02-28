/* globals DocsAPI */
window.config = {
    "document": {
        "fileType": "docx",
        "key": "Khirz6zTPdfd7",
        "title": "test.docx",
        "url": "/onlyoffice/test.docx"
    },
    "documentType": "text",
    "editorConfig": {
                        "user": {
                        "id": "c0c3bf82-20d7-4663-bf6d-7fa39c598b1d",
                        "name": "John Smith"
                    }
    },
    "events": {
     "onDocumentStateChange": function (/* evt */) { console.log("in change"); },
     "onReady": function (/* evt */) { console.log("in onReady"); }
    }
};
window.onbeforeunload = null;

window.docEditor = new DocsAPI.DocEditor("placeholder", window.config);

