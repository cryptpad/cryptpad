define(['jquery'], function ($) {
    var module = {};

    module.create = function (Common, cfg) {
        var exp = {};
        var metadataMgr = Common.getMetadataMgr();
        var sframeChan = Common.getSframeChannel();
        var titleUpdated;

        exp.defaultTitle = metadataMgr.getMetadata().defaultTitle;
        exp.title = document.title;

        cfg = cfg || {};

        var getHeadingText = cfg.getHeadingText || function () { return; };

        var $title;
        exp.setToolbar = function (toolbar) {
            $title = toolbar && toolbar.title;
        };

        exp.getTitle = function () { return exp.title; };

        var isDefaultTitle = exp.isDefaultTitle = function (){return exp.title === exp.defaultTitle;};

        var suggestTitle = exp.suggestTitle = function (fallback) {
            if (isDefaultTitle()) {
                return getHeadingText() || fallback || "";
            } else {
                var title = metadataMgr.getMetadata().title;
                return title || getHeadingText() || exp.defaultTitle;
            }
        };

        // update title: href is optional; if not specified, we use window.location.href
        exp.updateTitle = function (newTitle, cb) {
            cb = cb || $.noop;
            if (newTitle === exp.title) { return; }
            metadataMgr.updateTitle(newTitle);
            titleUpdated = cb;
        };

        metadataMgr.onChange(function () {
            var md = metadataMgr.getMetadata();
            $title.find('span.cp-toolbar-title-value').text(md.title || md.defaultTitle);
            $title.find('input').val(md.title || md.defaultTitle);
            exp.title = md.title;
        });
        metadataMgr.onTitleChange(function (title) {
            sframeChan.query('Q_SET_PAD_TITLE_IN_DRIVE', title, function (err) {
                if (err) { return; }
                if (titleUpdated) { titleUpdated(undefined, title); }
            });
        });

        exp.getTitleConfig = function () {
            return {
                updateTitle: exp.updateTitle,
                suggestName: suggestTitle,
                defaultName: exp.defaultTitle
            };
        };

        return exp;
    };

    return module;
});

