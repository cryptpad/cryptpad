define([
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (h, Msg, Pages) {
    return function () {
        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('.container-fluid.cp-privacy-top', [
                h('div.container',[
                    h('center', h('h1', Msg.policy_title)),
                ]),
            ]),
            h('div.container.cp-container.cp-privacy',[
                h('h3', Msg.policy_whatweknow),
                h('hr'),
                Pages.setHTML(h('p'), Msg.policy_whatweknow_p1),

                h('h3', Msg.policy_howweuse),
                h('hr'),
                h('p', Msg.policy_howweuse_p1),
                h('p', Msg.policy_howweuse_p2),

                h('h3', Msg.policy_whatwetell),
                h('hr'),
                h('p', Msg.policy_whatwetell_p1),

                h('h3', Msg.policy_links),
                h('hr'),
                h('p', Msg.policy_links_p1),

                h('h3', Msg.policy_ads),
                h('hr'),
                h('p', Msg.policy_ads_p1),

                h('h3', Msg.policy_choices),
                h('hr'),
                h('p', Msg.policy_choices_open),
                Pages.setHTML(h('p'), Msg.policy_choices_vpn),
            ]),
            Pages.infopageFooter()
        ]);
    };

});

