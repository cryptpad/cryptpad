define([
    '/api/config',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js',
    '/common/common-feedback.js',
], function (Config, h, Msg, Pages, Feedback) {
    var urlArgs = Config.requireConf.urlArgs;

    return function () {
        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container.cp-container', [
                h('div.row.cp-page-title',[
                    h('div.col-12.text-center', h('h1', Msg.whatis_title)),
                ]),
                h('div.row.cp-page-section', [
                    h('div.col-md-6', [
                        Pages.setHTML(h('h2'), Msg.whatis_collaboration),
                        Pages.setHTML(h('span'), Msg.whatis_collaboration_info),
                    ]),
                    h('div.col-md-6', [
                        h('img', {
                            src: '/customize/images/collaboration.png?' + urlArgs,
                            alt: '',
                            'aria-hidden': 'true'
                        }),
                    ]),
                ]),
                h('div.row.cp-page-section', [
                    h('div.col-md-6.order-md-2', [
                        Pages.setHTML(h('h2'), Msg.whatis_apps),
                        Pages.setHTML(h('span'), Msg.whatis_apps_info),
                    ]),
                    h('div.col-md-6.order-md-1', [
                        h('img', {
                            src: '/customize/images/apps-preview.png?' + urlArgs,
                            alt: '',
                            'aria-hidden': 'true'
                        }),
                    ]),
                ]),
                h('div.row.cp-page-section', [
                    h('div.col-md-6', [
                        Pages.setHTML(h('h2'), Msg.whatis_drive),
                        Pages.setHTML(h('spam'), Msg.whatis_drive_info),
                    ]),
                    h('div.col-md-6', [
                        h('img.cp-shadow', {
                            src: '/customize/images/drive-grid.png?' + urlArgs,
                            alt: '',
                            'aria-hidden': 'true'
                        }),
                    ]),
                ]),
                h('div.row.cp-page-section', [
                    h('div.col-md-6.order-md-2', [
                        Pages.setHTML(h('h2'), Msg.whatis_model),
                        Pages.setHTML(h('span'), Msg.whatis_model_info),
                        Pages.crowdfundingButton(function () {
                            Feedback.send('WHATIS_SUPPORT_CRYPTPAD');
                        }),
                        // XXX add link to subscription here on cryptpad.fr
                    ]),
                    h('div.col-md-6.order-md-1.small-logos', [
                        h('img', {
                            src: '/customize/images/logo_ngi.png?' + urlArgs,
                            alt: 'Logo NGI Trust'
                        }),
                        h('img', {
                            src: '/customize/images/logo_nlnet.svg?' + urlArgs,
                            alt: 'Logo NLNet Foundation'
                        }),
                        h('img', {
                            src: '/customize/images/logo_bpifrance.svg?' + urlArgs,
                            alt: 'Logo BPI France'
                        }),
                        h('img', {
                            src: '/customize/images/logo_moss.jpg?' + urlArgs,
                            alt: 'Logo Mozilla Open Source Support'
                        }),
                    ]),
                ]),
                h('div.row.cp-page-section', [
                    h('div.col-md-6', [
                        Pages.setHTML(h('h2'), Msg.whatis_xwiki),
                        Pages.setHTML(h('spam'), Msg.whatis_xwiki_info),
                    ]),
                    h('div.col-md-6.small-logos', [
                        h('img', {
                            src: '/customize/images/logo_XWiki.svg?' + urlArgs,
                            alt: 'Logo XWiki'
                        }),
                    ]),
                ]),
            ]),
            Pages.infopageFooter(),
        ]);
    };
});

