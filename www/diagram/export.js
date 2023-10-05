define([
    '/components/x2js/x2js.js',
], function (
    X2JS) {
    const x2js = new X2JS();
    const jsonContentAsXML = (content) => x2js.js2xml(content);

    return {
        main: function(userDoc, cb) {
            delete userDoc.metadata;
            cb(jsonContentAsXML(userDoc), '.drawio');
        }
    };
});
