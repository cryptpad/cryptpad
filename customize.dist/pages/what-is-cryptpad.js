define([
    '/api/config',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (Config, h, Msg, Pages) {
    var urlArgs = Config.requireConf.urlArgs;

    Msg.whatis_collaboration = "Private Collaboration"; // XXX existing key
    Msg.whatis_collaboration_info = '<p>CryptPad is built to enable collaboration, synchronizing in real time between users editing the same document, but has no access to the content of the document or data about users. Because all data is encrypted, the service and its administrators have no way of seeing the content being edited and stored.</p><p>Collaborating in real time on online documents is now a common thing. A range of well known internet platforms offer this service. In order to enable collaboration, these services synchronize changes between all users. In the process they gain access to the content of the document and to data about the behaviour of users. While these services are often advertised as "free", platforms monetise user data by using it to profile users and selling advertising.</p>'; // XXX
    // XXX remove whatis_collaboration_p1, p2, p3

    Msg.whatis_apps = "A full suite of applications"; // XXX
    Msg.whatis_apps_info = "<p>CryptPad provides a full-fledged office suite, with all the tools necessary for productive collaboration. Applications include: Rich Text, Spreadsheets, Code/Markdown, Kanban, Slides, Whiteboard and Polls.</p><p> A secure chat is available in each document for secure communication, [continue ...]</p>"; // XXX
    // XXX remove all whatis_zeroknowledge keys

    Msg.whatis_drive_info = "<p>Manage documents with CryptDrive. Create folders, shared folders, tags, [continue ...]</p>" // XXX
    // XXX remove whatis_drive_p1, p2, p3

    Msg.whatis_model = "Business model"; // XXX
    Msg.whatis_model_info = "<p>CryptPad is open source...</p><p>CryptPad does not profit from its users data. This is because being fully encrypted it does not gather any useful data that could be sold to profile users. This lack of data is a feature, not a bug, it is part of a vision for online services that respect users privacy. Instead of pretending to be \"free\" like the big platforms CryptPad aims to build a financially sustainable model: funded willingly by users instead of profiting form personal information.</p><p>Since 2016, CryptPad is supported by French and European research grants such as BPI France, NLNet Foundation, NGI Trust, Mozilla Open Source Support, as well as donations and subscriptions to the service. Now that the feasibility of the project has been established, the next goal is to make financially sustainable through user funding. If you would like to support CryptPad and help make it a sustainable alternative to the big platforms, please consider making a donation.</p>" // XXX

    Msg.whatis_xwiki = "Made at XWiki"; // XXX
    Msg.whatis_xwiki_info = "<p>CryptPad is made at XWiki, a company based in Paris that has been making open-source software for over 15 years. [continue ...]</p>"
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
                            src: '/customize/images/collaboration.png?' + urlArgs
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
                            src: '/customize/images/apps-preview.png?' + urlArgs
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
                            src: '/customize/images/drive-grid.png?' + urlArgs
                        }),
                    ]),
                ]),
                h('div.row.cp-page-section', [
                    h('div.col-md-6.order-md-2', [
                        Pages.setHTML(h('h2'), Msg.whatis_model),
                        Pages.setHTML(h('span'), Msg.whatis_model_info),
                        h('button', [
                            Msg.crowdfunding_button // XXX not functional
                        ])
                        // XXX add link to subscription here on cryptpad.fr
                    ]),
                    h('div.col-md-6.order-md-1.small-logos', [
                        h('img', {
                            src: '/customize/images/logo_ngi.png?' + urlArgs
                        }),
                        h('img', {
                            src: '/customize/images/logo_nlnet.svg?' + urlArgs
                        }),
                        h('img', {
                            src: '/customize/images/logo_bpifrance.svg?' + urlArgs
                        }),
                        h('img', {
                            src: '/customize/images/logo_moss.jpg?' + urlArgs
                        }),
                    ]),
                ]),
                // XXX XWiki info
                h('div.row.cp-page-section', [
                    h('div.col-md-6', [
                        Pages.setHTML(h('h2'), Msg.whatis_xwiki),
                        Pages.setHTML(h('spam'), Msg.whatis_xwiki_info),
                    ]),
                    h('div.col-md-6.small-logos', [
                        h('img', {
                            src: '/customize/images/logo_XWiki.svg?' + urlArgs
                        }),
                    ]),
                ]),
            ]),
            Pages.infopageFooter(),
        ]);
    };
});

