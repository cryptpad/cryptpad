define([
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (h, Msg, Pages) {
    return function () {
        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container-fluid.cp-contdet', [
                h('row.col-12.col-sm-12',
                    h('h1.text-center', Msg.contact )
                )
            ]),
            h('div.container.cp-container', [
                h('div.row.cp-iconCont.align-items-center', [
                    h('div.col-12',
                        Pages.setHTML(h('h4.text-center'), Msg.main_about_p26)
                    ),
                    h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "https://twitter.com/cryptpad"}, 
                            h('div.card-body', 
                                Pages.setHTML(h('p'), Msg.main_about_p22)
                            )
                        )
                    ),
                    h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "https://github.com/xwiki-labs/cryptpad/issues/"},
                            h('div.card-body', 
                                Pages.setHTML(h('p'), Msg.main_about_p23)
                            )
                        )
                    ),
                    h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "https://riot.im/app/#/room/#cryptpad:matrix.org"},
                            h('div.card-body', 
                                Pages.setHTML(h('p'), Msg.main_about_p24)
                            )
                        )
                    ),
                    h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "mailto:research@xwiki.com"},
                            h('div.card-body', 
                                Pages.setHTML(h('p'), Msg.main_about_p25)
                            )
                        )
                    ),
                ]),
            ]),
            Pages.infopageFooter(),
        ]);
    };
});

