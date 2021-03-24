define([
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (h, Msg, Pages) {
    return function () {
        var whatWeKnow = Pages.setHTML(h('p'), Msg.policy_whatweknow_p1);
        Pages.externalLink(whatWeKnow.querySelector('a'), "https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending");

        var vpn = Pages.setHTML(h('p'), Msg.policy_choices_vpn);
        Pages.externalLink(vpn.querySelector('a'), 'https://www.torproject.org/download/');

        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container.cp-container.cp-privacy',[
                h('div.row.cp-page-title', h('h1', Msg.policy_title)),
                h('h2', Msg.policy_whatweknow),
                whatWeKnow,

                h('h2', Msg.policy_howweuse),
                h('p', Msg.policy_howweuse_p1),
                h('p', Msg.policy_howweuse_p2),

                h('h2', Msg.policy_whatwetell),
                h('p', Msg.policy_whatwetell_p1),

                h('h2', Msg.policy_links),
                h('p', Msg.policy_links_p1),

                h('h2', Msg.policy_ads),
                h('p', Msg.policy_ads_p1),

                h('h2', Msg.policy_choices),
                h('p', Msg.policy_choices_open),
                vpn
            ]),
            Pages.infopageFooter()
        ]);
    };

});

