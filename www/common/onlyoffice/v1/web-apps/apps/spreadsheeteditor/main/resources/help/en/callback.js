function onhyperlinkclick(element) {
    function _postMessage(msg) {
       if (window.parent && window.JSON) {
            window.parent.postMessage(window.JSON.stringify(msg), "*");
      	}
    }

    _postMessage({
        command: 'internalCommand',
        data: {
            type: 'help:hyperlink',
            data: element.href
        }
    });
}
