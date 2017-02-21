CKEDITOR.editorConfig = function( config ) {
    var fixThings = false;
    // https://dev.ckeditor.com/ticket/10907
    needsBrFiller= fixThings;
    needsNbspFiller= fixThings;

    removeButtons= 'Source,Maximize';
    // magicline plugin inserts html crap into the document which is not part of the
    // document itself and causes problems when it's sent across the wire and reflected back
    removePlugins= 'resize';
    extraPlugins= 'autolink,colorbutton,colordialog,font';
    toolbarGroups= [{"name":"clipboard","groups":["clipboard","undo"]},{"name":"editing","groups":["find","selection"]},{"name":"links"},{"name":"insert"},{"name":"forms"},{"name":"tools"},{"name":"document","groups":["mode","document","doctools"]},{"name":"others"},{"name":"basicstyles","groups":["basicstyles","cleanup"]},{"name":"paragraph","groups":["list","indent","blocks","align","bidi"]},{"name":"styles"},{"name":"colors"}];

    //skin: 'moono-cryptpad,/pad/themes/moono-cryptpad/'
    //skin: 'flat,/pad/themes/flat/'
    //skin: 'moono-lisa,/pad/themes/moono-lisa/'
    //skin: 'moono-dark,/pad/themes/moono-dark/'
    //skin: 'office2013,/pad/themes/office2013/'
;
