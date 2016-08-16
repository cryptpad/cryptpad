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
[   'analytics',
    'index',
    'fork',
    'terms',
    'privacy',
].forEach(function (name) {
    fragments[name] = read('./fragments/' + name + '.html');
});

// build static pages
['index', 'privacy', 'terms'].forEach(function (page) {
    var source = swap(template, {
       fork: fragments.fork,
       analytics: fragments.analytics,
       main: fragments[page],
    });
    write('../' + page + '.html', source);
});
