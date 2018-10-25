define([
    '/api/config',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (Config, h, Msg, Pages) {
    var urlArgs = Config.requireConf.urlArgs;
    return function () {
        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container-fluid.cp-what-is',[
                h('div.container',[
                    h('div.row',[
                        h('div.col-12.text-center', h('h1', Msg.whatis_title)),
                    ]),
                ]),
            ]),
            h('div.container.cp-container', [
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6', [
                        Pages.setHTML(h('h2'), Msg.whatis_collaboration),
                        Pages.setHTML(h('p'), Msg.whatis_collaboration_p1),
                        Pages.setHTML(h('p'), Msg.whatis_collaboration_p2),
                        Pages.setHTML(h('p'), Msg.whatis_collaboration_p3),
                    ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6', [
                        h('img', { src: '/customize/images/pad_screenshot.png?' + urlArgs }),
                    ]),
                ]),
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.order-2', [
                        Pages.setHTML(h('h2'), Msg.whatis_zeroknowledge),
                        Pages.setHTML(h('p'), Msg.whatis_zeroknowledge_p1),
                        Pages.setHTML(h('p'), Msg.whatis_zeroknowledge_p2),
                        Pages.setHTML(h('p'), Msg.whatis_zeroknowledge_p3),
                    ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.order-1', [
                        h('img#zeroknowledge', { src: '/customize/images/zeroknowledge_small.png?' + urlArgs }),
                    ]),
                ]),
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6', [
                        Pages.setHTML(h('h2'), Msg.whatis_drive),
                        Pages.setHTML(h('p'), Msg.whatis_drive_p1),
                        Pages.setHTML(h('p'), Msg.whatis_drive_p2),
                        Pages.setHTML(h('p'), Msg.whatis_drive_p3),
                    ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6', [
                        h('img', { src: '/customize/images/drive_screenshot.png?' + urlArgs }),
                    ]),
                ]),
                h('div.row.align-items-center', [
                    h('div.col-12', [
                        Pages.setHTML(h('h2.text-center'), Msg.whatis_business),
                        Pages.setHTML(h('p'), Msg.whatis_business_p1),
                        Pages.setHTML(h('p'), Msg.whatis_business_p2),
                    ]),
                ]),
            ]),
            Pages.infopageFooter(),
        ]);
    };
});

