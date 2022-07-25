var Fs = require("fs");
var Fse = require("fs-extra");
var Path = require("path");

if (process.env.CRYPTPAD_CONFIG) {
    /* using Fs.existsSync() function and __dirname variable here won't filter 
    environment variables like CRYPTPAD_CONFIG='/../docs/config2.js', while require() 
    inside load-config.js will, outputing some non intellegible error messages. 
    (plus, it won't handle missing '.js' in file names neither) */
    try {
        require.resolve(process.env.CRYPTPAD_CONFIG);
    } catch (e) {
        console.error(`The configuration file ${process.env.CRYPTPAD_CONFIG} can not 
                    be loaded. Please review your CRYPTPAD_CONFIG environment variable.`
                    .replace(/\s{2,}/g, ' '));
        process.exit(1);
    }
} else {
    if (!Fs.existsSync(__dirname + '/../config/config.js')) {
        console.error(`This script needs the file config/config.js to work properly. 
                    You can make one by copying config/config.example.js. Check the 
                    value of httpUnsafeOrigin for this script to behave as expected.`
                    .replace(/\s{2,}/g, ' '));
        process.exit(1);
    }
}
var config = require("../lib/load-config");

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
    <meta property="og:url" content="{{rootUrl}}/{{app}}/">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{title}}">
    <meta property="og:description" content="CryptPad: end-to-end encrypted collaboration suite">
    <meta property="og:image" content="{{rootUrl}}/customize/images/opengraph_preview/{{image}}">`;

var previewExists = function (name) {
    if (Fs.existsSync(__dirname + '/../customize/images/opengraph_preview/')) {
        return Fs.existsSync(__dirname + `/../customize/images/opengraph_preview/${name}`);
    }
    return Fs.existsSync(__dirname + `/../customize.dist/images/opengraph_preview/${name}`);
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

var buildPath = __dirname + '/../customize/www';
var tmpPath = __dirname + '/../CRYPTPAD_TEMP_BUILD';

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

var srcAppTypes = Fs.readFileSync(__dirname + '/../www/common/translations/messages.json', 'utf8');
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
    'slide',
    'file',
    'drive',
    'teams'
];

appIndexesToBuild.forEach(function (app) {
    console.log(`Parsing www/${app}/index.html`);
    var src = Fs.readFileSync(__dirname + `/../www/${app}/index.html`, 'utf8');
    
    // rename types for shared documents (ones in place can sound weird)
    if (app === 'drive') { types[app] = 'Drive'; }
    if (app === 'teams') { types[app] = 'Team drive'; }
    
    write(
        insert(src, templateOG(app, types[app])),
        `${app}/index.html`
    );
});

Fse.removeSync(buildPath);
var dirPath = Path.dirname(buildPath);
Fse.mkdirpSync(dirPath);
Fse.renameSync(tmpPath, buildPath);
