/* globals DocsAPI */
window.config = {
    "document": {
        "fileType": "xlsx",
        "key": "fresh", // "Khirz6zTPdfd7",
        "title": "test.xlsx",
        "url": "/onlyoffice/test.xlsx"
    },
    "documentType": "spreadsheet",
    "editorConfig": {
        customization: {
            chat: false,
            logo: {
                url: "/bounce/#" + encodeURIComponent('https://www.onlyoffice.com')
            }
        },
        "user": {
            "id": "", //"c0c3bf82-20d7-4663-bf6d-7fa39c598b1d",
            "name": "", //"John Smith"
        }
    },
    "events": {
        "onDocumentStateChange": function (evt) {
            if (evt.data) {
                console.log('in change (local)');
                return;
            }
            console.log("in change (remote)");
        },
        "onReady": function(/*evt*/) { console.log("in onReady"); },
        "onAppReady": function(/*evt*/) { console.log("in onAppReady"); },
    }
};
window.onbeforeunload = function () {
    var ifr = document.getElementsByTagName('iframe')[0];
    if (ifr) { ifr.remove(); }
};

window.docEditor = new DocsAPI.DocEditor("placeholder", window.config);

