/* global CKEDITOR */
CKEDITOR.editorConfig = function( config ) {
    var fixThings = false;
    // https://dev.ckeditor.com/ticket/10907
    config.needsBrFiller= fixThings;
    config.needsNbspFiller= fixThings;

    config.removeButtons= 'Source,Maximize';
    // magicline plugin inserts html crap into the document which is not part of the
    // document itself and causes problems when it's sent across the wire and reflected back
    config.removePlugins= 'resize,elementspath';
    config.resize_enabled= false; //bottom-bar
    config.extraPlugins= 'autolink,colorbutton,colordialog,font,indentblock,justify,mediatag,print,blockbase64,mathjax';
    config.toolbarGroups= [
        // {"name":"clipboard","groups":["clipboard","undo"]},
        //{"name":"editing","groups":["find","selection"]},
        {"name":"links"},
        {"name":"insert"},
        {"name":"forms"},
        {"name":"tools"},
        {"name":"document","groups":["mode","document","doctools"]},
        {"name":"others"},
        {"name":"basicstyles","groups":["basicstyles","cleanup"]},
        {"name":"paragraph","groups":["list","indent","blocks","align","bidi"]},
        {"name":"styles"},
        {"name":"colors"},
        {"name":"print"}];

    config.mathJaxLib = '/pad/mathjax/MathJax.js?config=TeX-AMS_HTML';
    config.font_defaultLabel = 'Arial';
    config.fontSize_defaultLabel = '16';

    config.keystrokes = [
        [ CKEDITOR.ALT + 121 /*F10*/, 'toolbarFocus' ],
        [ CKEDITOR.ALT + 122 /*F11*/, 'elementsPathFocus' ],

        [ CKEDITOR.SHIFT + 121 /*F10*/, 'contextMenu' ],

        [ CKEDITOR.CTRL + 90 /*Z*/, 'undo' ],
        [ CKEDITOR.CTRL + 89 /*Y*/, 'redo' ],
        [ CKEDITOR.CTRL + CKEDITOR.SHIFT + 90 /*Z*/, 'redo' ],

        [ CKEDITOR.CTRL + CKEDITOR.SHIFT + 76 /*L*/, 'link' ],
        [ CKEDITOR.CTRL + 76 /*L*/, undefined ],

        [ CKEDITOR.CTRL + 66 /*B*/, 'bold' ],
        [ CKEDITOR.CTRL + 73 /*I*/, 'italic' ],
        [ CKEDITOR.CTRL + 85 /*U*/, 'underline' ],

        [ CKEDITOR.ALT + 109 /*-*/, 'toolbarCollapse' ]
    ];

    //skin: 'moono-cryptpad,/pad/themes/moono-cryptpad/'
    //skin: 'flat,/pad/themes/flat/'
    //config.skin= 'moono-lisa,/pad/themes/moono-lisa/'
    //skin: 'moono-dark,/pad/themes/moono-dark/'
    //skin: 'office2013,/pad/themes/office2013/'
};

(function () {
    // These are overrides inside of ckeditor which add ?ver= to the CSS files so that
    // every part of ckeditor will get in the browser cache.
    var fix = function (x) {
        if (x.map) { return x.map(fix); }
        return (/\/bower_components\/.*\.css$/.test(x)) ? (x + '?ver=' + CKEDITOR.timestamp) : x;
    };
    CKEDITOR.tools._buildStyleHtml = CKEDITOR.tools.buildStyleHtml;
    CKEDITOR.document._appendStyleSheet = CKEDITOR.document.appendStyleSheet;
    CKEDITOR.tools.buildStyleHtml = function (x) { return CKEDITOR.tools._buildStyleHtml(fix(x)); };
    CKEDITOR.document.appendStyleSheet = function (x) { return CKEDITOR.document._appendStyleSheet(fix(x)); };
}());
