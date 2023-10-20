// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var fs = require("fs");

//var en = require("./messages.json");

var others = fs.readdirSync('.').filter(name => {
    return /^messages\..+\.json$/.test(name);
});

var suggestions = {
    'ui_restore': [
        'admin_unarchiveButton',
        'fc_restore', 
        'snapshots_restore',
        'settings_restore',
    ],
    ui_archive: [
        'admin_archiveButton',
    ],
    ui_undefined: [
        'owner_unknownUser',
    ],
    admin_documentType: [
        'fm_type',
    ],

};

others.forEach(n => {
    console.log(n);
    var path = `./${n}`;
    var content = require(path);

    Object.keys(suggestions).forEach(k => {
        if (content[k]) { return; }
        console.log(`${k} is not defined`);
        var suggestion;
        suggestions[k].some(option => {
            if (typeof(content[option]) !== 'string') { return; }
            console.log(`\t${option} (${content[option]}) seems like a viable candidate`);
            suggestion = option;
            return true;
        });

        if (!suggestion) { return; }
        content[k] = content[suggestion];
        fs.writeFileSync(path, JSON.stringify(content, null, 4));
    });

    console.log();
});

