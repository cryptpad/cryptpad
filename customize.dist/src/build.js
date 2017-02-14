var Fs = require("fs");

// read a file
var read = function (path) {
    return Fs.readFileSync(path, 'utf-8');
};

// write a file
var write = function (path, src) {
    return Fs.writeFileSync(path, src);
};

// basic templating
var swap = function (src, dict) {
    return src.replace(/\{\{(.*?)\}\}/g, function (a, b) {
        return dict[b] || b;
    });
};

// read the template file
var template = read('./template.html');

// read page fragments
var fragments = {};
[   'index',
    'fork',
    'topbar',
    'terms',
    'privacy',
    'about',
    'contact',
    'logo',
    'noscript',
    'footer',
    'empty',
    'script',
    'appscript'
].forEach(function (name) {
    fragments[name] = read('./fragments/' + name + '.html');
});

// build static pages
['index', 'privacy', 'terms', 'about', 'contact'].forEach(function (page) {
    var source = swap(template, {
       topbar: fragments.topbar,
       fork: fragments.fork,
       main: swap(fragments[page] || fragments.empty, {
           topbar: fragments.topbar,
           fork: fragments.fork,
           logo: fragments.logo,
           noscript: fragments.noscript,
           footer: fragments.footer,
       }),
       logo: fragments.logo,
       noscript: fragments.noscript,
       footer: fragments.footer,
       script: fragments.script
    });
    write('../' + page + '.html', source);
});

// build static pages
['../www/settings/index'].forEach(function (page) {
    var source = swap(template, {
       topbar: fragments.topbar,
       fork: fragments.fork,
       main: swap(fragments[page] || fragments.empty, {
           topbar: fragments.topbar,
           fork: fragments.fork,
           logo: fragments.logo,
           noscript: fragments.noscript,
           footer: fragments.footer,
       }),
       logo: fragments.logo,
       noscript: fragments.noscript,
       footer: fragments.footer,
       script: fragments.appscript
    });
    write('../' + page + '.html', source);
});


