define([
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (h, Msg, Pages) {
    return function () {
        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container-fluid.cp-about-intro', [
                h('div.container', [
                    h('center', [
                        h('h1', Msg.about),
                        Pages.setHTML(h('p'), Msg.about_intro),
                    ]),
                ]),
            ]),
            h('div.container.cp-container', [
                h('div.row', [
                    h('div.cp-develop-about.col-12',[
                            h('div.cp-icon-cent'),
                            h('h2.text-center', Msg.about_core)
                        ]),
                    ]),
                h('div.row.align-items-center',[
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.order-lg-2.cp-bio-avatar.cp-bio-avatar-right', [
                            h('img.img-fluid', {'src': '/customize/images/AaronMacSween.jpg'})
                    ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.order-lg-1.cp-profile-det',[
                        h('h3', "Aaron MacSween"),
                        h('hr'),
                        Pages.setHTML(h('div#bioAaron'), '<p>Aaron transitioned into distributed systems development from a background in jazz and live stage performance. <br/> He appreciates the elegance of biological systems and functional programming, and focused on both as a student at the University of Toronto, where he studied cognitive and computer sciences.<br/>He moved to Paris in 2015 to work as a research engineer at XWiki SAS, after having dedicated significant time to various cryptography-related software projects.<br/>He spends his spare time experimenting with guitars, photography, science fiction, and spicy food.</p>'),
                        h('a.cp-soc-media', { href : 'https://twitter.com/fc00ansuz'}, [
                                h('i.fa.fa-twitter')
                            ]),
                        h('a.cp-soc-media', { href : 'https://github.com/ansuz/'}, [
                                h('i.fa.fa-github')
                            ])
                    ]),
                ]),
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-bio-avatar', [
                        h('img.img-fluid', {'src': '/customize/images/YannFlory.jpg'})
                            ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-profile-det', [
                        h('h3', "Yann Flory"),
                        h('hr'),
                        Pages.setHTML(h('div#bioYann'), '<p>In 2015, Yann graduated with an engineering degree from Ecole Centrale de Lille majoring in Data Science. In his studies he worked on a project to detect defects in optical fiber using image processing technology.<br/>Upon joining XWiki SAS, Yann developed a Wiki page recommendation system, a common API for accessing data server-side and client-side, and an integrated development environment for development of XWiki applications.<br/>Yann is soft spoken but brutally efficient, he is known to say "It will take 5 minutes".</p>'),
                        h('a.cp-soc-media', { href : 'https://github.com/yflory/'}, [
                                h('i.fa.fa-github')
                            ])
                    ]),
                ]),
                h('div.row', [
                    h('div.cp-develop-about.col-12.cp-contrib',[
                            h('div.cp-icon-cent'),
                            h('h2.text-center', Msg.about_contributors)
                        ]),
                    ]),
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-bio-avatar', [
                        h('img.img-fluid', {'src': '/customize/images/CalebJames.jpg'})
                            ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-profile-det', [
                        h('h3', "Caleb James Delisle"),
                        h('hr'),
                        Pages.setHTML(h('div#bioCaleb'), '<p>Caleb is a cryptography developer, Machine Technology graduate of the Franklin County Technical School and lifelong tinkerer.<br/>In 2011, he started the cjdns Open Source project to show that secure networking could be invisible and easily deployed.<br/>After joining XWiki SAS in 2014, he started the CryptPad project with the intent of bringing the same transparent security to collaborative editing.<br/>He\'s always trying to learn from more experienced colleagues and when someone passes through the Research Team office, his favorite words are "Pull up a chair!".</p>'),
                        h('a.cp-soc-media', { href : 'https://twitter.com/cjdelisle'}, [
                                h('i.fa.fa-twitter')
                            ]),
                        h('a.cp-soc-media', { href : 'https://github.com/cjdelisle'}, [
                                h('i.fa.fa-github')
                            ])
                    ]),
                ]),
                h('div.row.align-items-center',[
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.order-lg-2.cp-bio-avatar.cp-bio-avatar-right', [
                            h('img.img-fluid', {'src': '/customize/images/Catalin.jpg'})
                    ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.order-lg-1.cp-profile-det',[
                        h('h3', "Catalin Scripcariu"),
                        h('hr'),
                        Pages.setHTML(h('div#bioCatalin'), '<p> Catalin is a Maths majour and has worked in B2B sales for 12 years. Design was always his passion and 3 years ago he started to dedicate himself to web design and front-end.<br/>At the beginning of 2017 he joined the XWiki, where he worked both on the business and the community side of XWiki, including the research team and CryptPad. </p>'),
                        h('a.cp-soc-media', { href : 'https://twitter.com/catalinscr'}, [
                                h('i.fa.fa-twitter')
                            ]),
                        h('a.cp-soc-media', { href : 'https://www.linkedin.com/in/catalinscripcariu/'}, [
                                h('i.fa.fa-linkedin')
                            ])
                    ]),
                ]),
                h('div.row.align-items-center.cp-margin-bot', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-bio-avatar', [
                        h('img.img-fluid', {'src': '/customize/images/LudovicDuboist.jpg'})
                            ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-profile-det', [
                        h('h3', "Ludovic Dubost"),
                        h('hr'),
                        Pages.setHTML(h('div#bioLudovic'), '<p>A graduate of PolyTech (X90) and Telecom School in Paris, Ludovic Dubost started his career as a software architect for Netscape Communications Europe. He then became CTO of NetValue, one of the first French start-ups that went public. He left NetValue after the company was purchased by Nielsen/NetRatings and in 2004 launched XWiki, the next generation wiki.<br/>Since the very beginning, Ludovic has been immensely helpful to the CryptPad project. He believed in the idea when there was nothing more than the collaborative pad and his help with sales strategy for the project.</p>'),
                        h('a.cp-soc-media', { href : 'https://twitter.com/ldubost'}, [
                                h('i.fa.fa-twitter')
                            ]),
                        h('a.cp-soc-media', { href : 'https://github.com/ldubost'}, [
                                h('i.fa.fa-github')
                            ])
                    ]),
                ]),
            ]),
            Pages.infopageFooter()
        ]);
    };
});

