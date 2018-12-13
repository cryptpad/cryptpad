define([
    'jquery',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function ($, h, Msg, Pages) {
    return function () {
        var categories = [];
        var faq = Msg.faq;
        Object.keys(faq).forEach(function (c) {
            var questions = [];
            Object.keys(faq[c]).forEach(function (q) {
                var item = faq[c][q];
                if (typeof item !== "object") { return; }
                var answer = h('p.cp-faq-questions-a');
                var hash = c + '-' + q;
                var question = h('p.cp-faq-questions-q#' + hash);
                $(question).click(function () {
                    if ($(answer).is(':visible')) {
                        $(question).toggleClass('cp-active-faq');
                        return void $(answer).slideUp();
                    }
                    $(question).toggleClass('cp-active-faq');
                    $(answer).slideDown();
                    var t = $(window).scrollTop();
                    window.location.hash = hash;
                    $(window).scrollTop(t);
                });
                questions.push(h('div.cp-faq-questions-items', [
                    Pages.setHTML(question, item.q),
                    Pages.setHTML(answer, item.a)
                ]));
            });
            categories.push(h('div.cp-faq-category', [
                h('h3', faq[c].title),
                h('div.cp-faq-category-questions', questions)
            ]));
        });
        var hash = window.location.hash;
        if (hash) {
            $(categories).find(hash).click();
        }
        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container-fluid.cp-faq', [
                h('div.container',[
                    h('center', h('h1', Msg.faq_title)),
                ]),
            ]),
            h('div.container.cp-faq-ques-det',[
                h('div.cp-faq-header.text-center', h('a.nav-item.nav-link', {
                    href: '/what-is-cryptpad.html'
                }, Pages.setHTML(h('h4'),Msg.faq_whatis))),
                h('div.cp-faq-container', categories)
            ]),
            Pages.infopageFooter()
        ]);
    };

});

