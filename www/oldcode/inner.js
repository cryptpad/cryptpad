define([
    'jquery',

    'cm/lib/codemirror',

    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/code/code.less',
    'less!/customize/src/less/toolbar.less',
    'less!/customize/src/less/cryptpad.less',

    'css!cm/lib/codemirror.css',
    'css!cm/addon/dialog/dialog.css',
    'css!cm/addon/fold/foldgutter.css',

    'cm/mode/markdown/markdown',
    'cm/addon/mode/loadmode',
    'cm/mode/meta',
    'cm/addon/mode/overlay',
    'cm/addon/mode/multiplex',
    'cm/addon/mode/simple',
    'cm/addon/edit/closebrackets',
    'cm/addon/edit/matchbrackets',
    'cm/addon/edit/trailingspace',
    'cm/addon/selection/active-line',
    'cm/addon/search/search',
    'cm/addon/search/match-highlighter',
    'cm/addon/search/searchcursor',
    'cm/addon/dialog/dialog',
    'cm/addon/fold/foldcode',
    'cm/addon/fold/foldgutter',
    'cm/addon/fold/brace-fold',
    'cm/addon/fold/xml-fold',
    'cm/addon/fold/markdown-fold',
    'cm/addon/fold/comment-fold',
    'cm/addon/display/placeholder',
], function ($, CMeditor) {
    window.CodeMirror = CMeditor;
    $('.loading-hidden').removeClass('loading-hidden');
});
