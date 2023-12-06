// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/customize/messages.js'
], function ($, Util, UI, Messages) {
    var module = {};

    module.create = function (Common, cfg) {
        var exp = {};
        var metadataMgr = Common.getMetadataMgr();
        var sframeChan = Common.getSframeChannel();
        var titleUpdated;
        var evTitleChange = Util.mkEvent();

        exp.defaultTitle = metadataMgr.getMetadata().defaultTitle;
        exp.title = document.title;

        cfg = cfg || {};

        var getHeadingText = cfg.getHeadingText || function () { return; };

        var $title;
        exp.setToolbar = function (toolbar) {
            $title = toolbar && (toolbar.title || toolbar.pageTitle);
            if ($title && exp.defaultTitle) {
                var md = metadataMgr.getMetadata();
                $title.find('input').prop('placeholder', md.defaultTitle);
                $title.find('span.cp-toolbar-title-value').text(md.title || md.defaultTitle);
                $title.find('input').val(md.title || md.defaultTitle);
            }
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

        exp.updateTitle = function (newTitle, cb) {
            cb = cb || $.noop;
            if (newTitle === exp.title) { return void cb(); }
            if (newTitle === exp.defaultTitle) {
                newTitle = "";
            }
            metadataMgr.updateTitle(newTitle);
            titleUpdated = cb;
        };

        var ret = {
            updateTitle: exp.updateTitle,
            suggestName: suggestTitle,
            defaultName: exp.defaultTitle,
            getTitle: exp.getTitle
        };

        metadataMgr.onChange(function () {
            var md = metadataMgr.getMetadata();
            if ($title) {
                $title.find('input').prop('placeholder', md.defaultTitle);
            }
            ret.defaultName = exp.defaultTitle = md.defaultTitle;
        });
        metadataMgr.onTitleChange(function (title, defaultTitle) {
            if ($title) {
                $title.find('span.cp-toolbar-title-value').text(title || defaultTitle);
                $title.find('input').val(title || defaultTitle);
            }
            exp.title = title;
            sframeChan.query('Q_SET_PAD_TITLE_IN_DRIVE', {
                title: title,
                defaultTitle: defaultTitle
            }, function (err, obj) {
                err = err || (obj && obj.error);
                if (err === 'E_OVER_LIMIT') {
                    return void UI.alert(Messages.pinLimitNotPinned, null, true);
                } else if (err) {
                    return UI.alert(Messages.driveOfflineError);
                }
                evTitleChange.fire(title);
                if (titleUpdated) {
                    titleUpdated(undefined, title);
                }
            });
        });

        exp.getTitleConfig = function () {
            return ret;
        };

        exp.onTitleChange = evTitleChange.reg;

        return exp;
    };

    return module;
});

