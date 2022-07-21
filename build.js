var Fs = require("fs");
var Fse = require("fs-extra");
var Path = require("path");
var config = require("./lib/load-config");

var swap = function (s, o) {
    return s
    .replace(/\{\{([^}]+?)\}\}/g, function (all, token) {
        var content = o[token];

        if (typeof(content) === 'number') {
            content = String(content);
        }

        if (typeof(content) !== 'string') {
            console.error("expected {{%s}}", token);
            throw new Error("invalid input");
        }

        if (!content) {
            console.error("expected {{%s}}", token);
            throw new Error("insufficient input");
        }
        return content;
    });
};

const ogData = `
    <meta property="og:url" content="{{rootUrl}}/{{app}}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{title}}">
    <meta property="og:image" content="{{rootUrl}}/customize/images/opengraph_preview/{{image}}">`;

var previewExists = function (name) {
    if (Fs.existsSync('customize/images/opengraph_preview/')) {
        return Fs.existsSync(`customize/images/opengraph_preview/${name}`);
    }
    return Fs.existsSync(`customize.dist/images/opengraph_preview/${name}`);
};

var templateOG = function (a, type) {
    return swap(ogData, {
        rootUrl: config.httpUnsafeOrigin,
        app: a,
        title: type && `Encrypted ${type}` || 'CryptPad',
        image: previewExists(`og-${a}.png`) && `og-${a}.png` || `og-default.png`
    });
};

var insert = function (src, template) {
    var matchs = src.match(/(<meta .*>)|(.*<\/title>)/g);
    
    if (!matchs || !matchs.length) {
        return src;
    }
    return src.replace(matchs.at(-1), `$& ${template}`);
};

var buildPath = './customize/www';
var tmpPath = 'CRYPTPAD_TEMP_BUILD';

var write = function (content, dest) {
    console.log(`Creating ${dest}`);
    
    var path = Path.join(tmpPath, dest);
    var dirPath = Path.dirname(path);
    Fse.mkdirpSync(dirPath);
    Fs.writeFileSync(path, content);
};

console.log("Creating target directories");
// remove tmp path so we start fresh
Fse.removeSync(tmpPath);
Fse.mkdirpSync(tmpPath);

var srcAppTypes = Fs.readFileSync('./www/common/translations/messages.json', 'utf8');
var types = JSON.parse(srcAppTypes).type;

var appIndexesToBuild = [
    'sheet',
    'doc',
    'presentation',
    'pad',
    'kanban',
    'code',
    'form',
    'poll',
    'whiteboard',
    'slide'
];

appIndexesToBuild.forEach(function (app) {
    console.log(`Parsing ./www/${app}/index.html`);
    var src = Fs.readFileSync(`./www/${app}/index.html`, 'utf8');
    
    write(
        insert(src, templateOG(app, types[app])),
        `${app}/index.html`
    );
});

Fse.removeSync(buildPath);
Fse.moveSync(tmpPath, buildPath);
/* Fse.renameSync(tmpPath, buildPath); // is rename doing more than move here?
// cos not working with buildPath like 'pre-path/main-dir'. If so,
  var dirPath = Path.dirname(path);
  Fse.mkdirpSync(dirPath); // may work */
