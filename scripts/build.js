// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var Fs = require("fs");
var Fse = require("fs-extra");
var Path = require("path");
var OS = require("os");

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

var Messages = require("../www/common/translations/messages.json");

var types = Messages.type;
[ 'calendar', 'notifications', ].forEach(k => { types[k] = Messages[k]; });

// FIXME it would be better if these were just included in the translated list of types
types.settings = Messages.settings_title;
types.support = Messages.supportPage;
types.profile = Messages.profilePage;

var translations;
try {
    translations = Fs.readdirSync('./www/common/translations/').filter(name => {
        return /messages\..*\.json$/.test(name);
    });
} catch (err) {
    console.error(err);
}

var preferredLanguage = config.preferredLanguage;
var Preferred;

var noScriptContent = [ Messages.ui_jsRequired ];
translations.forEach(name => {
    var path = `./www/common/translations/${name}`;
    var content;
    try {
        content = JSON.parse(Fs.readFileSync(path, 'utf-8'));
    } catch (err) {
        return void console.error(`Failed to parse ${path}`);
    }

    if (name === `messages.${preferredLanguage}.json`) { Preferred = content; }

    if (typeof(content.ui_jsRequired) !== 'string') { return; }
    noScriptContent.push(content.ui_jsRequired);
});

var makeNoscript = (indent) => {
    var lines = noScriptContent.map(s => {
        return `${indent + indent}<p class="noscript">${s}</p>`;
    }).join('\n');
    return `${indent}<noscript>\n${lines}\n${indent}</noscript>`;
};

var getKey = function (key, args) {
    var source;

    if (Preferred && Preferred[key]) {
        source = Preferred[key];
    } else if (Messages && Messages[key]) {
        source = Messages[key];
    } else {
        return '?';
    }

    if (typeof(source) !== 'string') { return '?'; }
    if (!Array.isArray(args)) { return source; }

    return source.replace(/\{(\d+)\}/g, (str, p1) => {
        if (['string', 'number'].includes(typeof(p1))) { return args[p1]; }
        console.error("Only strings and numbers can be used in _getKey params.\nAborting...");
        process.exit(1);
    });
};

var previewExists = function (name) {
    if (Fs.existsSync('./customize/images/opengraph_preview/')) {
        return Fs.existsSync(`./customize/images/opengraph_preview/${name}`);
    }
    return Fs.existsSync(`./customize.dist/images/opengraph_preview/${name}`);
};

var imagePath = `/customize/images/opengraph_preview/`;

var appImagePath = a => {
    var partial = previewExists(`og-${a}.png`) && `og-${a}.png` || `og-default.png`;
    return new URL(imagePath + partial, config.httpUnsafeOrigin).href;
};

var buildPath = Path.resolve('./customize');
var tmpPath = Path.join(OS.tmpdir(), '/CRYPTPAD_TEMP_BUILD/');

var write = function (content, dest) {
    console.log(`Creating ${dest}`);
    
    var path = Path.join(tmpPath, dest);
    var dirPath = Path.dirname(path);
    Fse.mkdirpSync(dirPath);
    Fs.writeFileSync(path, content);
    console.log();
};

console.log("Creating target directories");
// remove tmp path so we start fresh
Fse.removeSync(tmpPath);

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
    'diagram',
    'slide',
    'file',
    'calendar',
    'drive',
    'teams',
    'contacts',

    'notifications',
    'checkup',
    'file',
    'profile',
    'settings',
    'support',
    // bounce ??
];

var baseAppPath = './www/';
const ogData = `
    <meta property="og:url" content="{{url}}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{title}}">
    <meta property="og:description" content="{{description}}">
    <meta property="og:image" content="{{image}}">
    <meta property="twitter:card" content="summary_large_image">`;


var versionString = String(+new Date());

var processPage = (src) => {
    return src
        .replace(/(\s*)<noscript>([\s\S]*)<\/noscript>/, (all, space /*, content */) => {
            var indent = space.split('\n').filter(Boolean);
            if (indent && indent[0]) {
                return '\n' + makeNoscript(indent[0] || '    ');
            }
            return space + makeNoscript('    ');
        })
        .replace(/pre\-loading\.js\?ver=([^"]+)"/, (all, content) => {
            return all.replace(content, versionString);
        })
        .replace(/pre\-loading\.css\?ver=([^"]+)"/, (all, content) => {
            return all.replace(content, versionString);
        });
};

var checkPage = (built, srcPath) => {
    if (!/pre\-loading\.js/.test(built)) {
        console.log(`no preloading js in ${srcPath}`);
        process.exit(1);
    }
    if (!/pre\-loading\.css/.test(built)) {
        console.log(`no preloading css in ${srcPath}`);
        process.exit(1);
    }

    if (!/noscript/i.test(built)) {
        console.error(`NO NOSCRIPT TAG FOR ${srcPath}`);
        process.exit(1);
    }

    if (/<\/html>/.test(built)) {
        console.log(`weird html in ${srcPath}`);
        process.exit(1);
    }
};

appIndexesToBuild.forEach(function (app) {
    var srcPath = Path.resolve(Path.join(baseAppPath, app, 'index.html'));
    console.log(`Parsing ${srcPath}`);
    var src = Fs.readFileSync(srcPath, 'utf8');

    // rename types for shared documents (ones in place can sound weird)
    if (app === 'drive') { types[app] = Messages.fm_rootName; }
    if (app === 'teams') { types[app] = Messages.og_teamDrive; }

    var patt = /<\/title>/;
    var type = types[app];
    var built = processPage(src.replace(patt, (current) => {
        return current + swap(ogData, {
            url: new URL(`/${app}/`, config.httpUnsafeOrigin).href,
            title: type && `Encrypted ${type}` || 'CryptPad',
            image: appImagePath(app),
            description: Messages.og_default,
        });
    }));

    if (!/noscript/i.test(built)) {
        console.error(`NO NOSCRIPT TAG FOR ${srcPath}`);
        process.exit(1);
    }

    write(built, `./www/${app}/index.html`);

    // TODO preloading version for inner.html
});

var instance;
try {
    instance = new URL(config.httpUnsafeOrigin).hostname;
} catch (err) {
    console.error("Failed to parse instance domain name\nAborting...");
    return void process.exit(1);
}

[
    {
        src: './www/register/index.html',
        dest: './www/register/index.html',
        url: '/register/',
        title: getKey('og_register', [instance]),
    },
    {
        src: './www/login/index.html',
        dest: './www/login/index.html',
        url: '/login/',
        title: getKey('og_login', [instance]),
    },
    {
        src: './customize.dist/contact.html',
        dest: './www/contact.html',
        url: '/contact.html',
        title: getKey('og_contact', [instance]),
    },
    {
        src: './customize.dist/features.html',
        dest: './www/features.html',
        url: '/features.html',
        title: getKey((config.allow_subscriptions? 'og_pricing': 'og_features'), [instance]),
    },
    {
        src: './customize.dist/index.html',
        dest: './www/index.html',
        url: '/index.html',
        title: getKey('og_default'),
    }
    // TODO 404 ?
    // TODO 500 ?
    // TODO down ?
].forEach(obj => {
    var srcPath = obj.src;
    var destPath = obj.dest;

    console.log(`Parsing ${srcPath}`);
    var src = Fs.readFileSync(srcPath, 'utf8');
    var patt = /<\/title>/;
    var href = new URL(obj.url, config.httpUnsafeOrigin).href;
    var built = processPage(src.replace(patt, (current) => {
        return current + swap(ogData, {
            url: href,
            title: obj.title || "CryptPad",
            image: new URL(imagePath + 'og-default.png', config.httpUnsafeOrigin).href,
            description: Messages.og_default,
        });
    }));

    checkPage(built, srcPath);

    write(built, destPath);
});

try {
    console.log(`Copying built files to target directory (${buildPath})`);
    Fse.copySync(tmpPath, buildPath, {
        overwrite: true,
    });
} catch (err) {
    console.error(`Failed to copy generated content to ${buildPath}`);
    console.error(err);
}

try {
    console.log(`Removing temporary build directory (${tmpPath})`);
    Fse.rmSync(tmpPath, {
        recursive: true,
        force: true,
    });
    console.log(`Successfully removed ${tmpPath}`);
} catch (err) {
    console.error(err);
}

