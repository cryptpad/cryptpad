// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const fs = require('node:fs');
const plugins = {};
const extensions = plugins._extensions = [];
const styles = plugins._styles = [];

try {
    let pluginsDir = fs.readdirSync(__dirname + '/plugins');
    pluginsDir.forEach((name) => {
        if (name=== "README.md") { return; }
        try {
            let plugin = require(`./plugins/${name}/index`);
            plugins[plugin.name] = plugin.modules;
            try {
                let hasExt = fs.existsSync(`lib/plugins/${name}/client/extensions.js`);
                if (hasExt) {
                    extensions.push(plugin.name.toLowerCase());
                }
            } catch (e) {}
            try {
                let hasStyle = fs.existsSync(`lib/plugins/${name}/client/style.less`);
                if (hasStyle) {
                    styles.push(plugin.name.toLowerCase());
                }
            } catch (e) {}
        } catch (err) {
            console.error(err);
        }
    });
} catch (err) {
    if (err.code !== 'ENOENT') { console.error(err); }
}

module.exports = plugins;
