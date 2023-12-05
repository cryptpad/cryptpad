// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This file is used when a user tries to export the entire CryptDrive.
// Pads from the code app will be exported using this format instead of plain text.
define([
], function () {
    var module = {
        ext: '.json'
    };

    module.main = function (userDoc, cb) {
        var content = userDoc.content;
        cb(new Blob([JSON.stringify(content, 0, 2)], {
            type: 'application/json',
        }));
    };

    module.import = function (content) {
        // Import from Trello

        var c = {
            data: {},
            items: {},
            list: []
        };

        var colorMap = {
            red: 'color1',
            orange: 'color2',
            yellow: 'color3',
            lime: 'color4',
            green: 'color5',
            sky: 'color6',
            blue: 'color7',
            purple: 'color8',
            pink: 'color9',
            black: 'nocolor'
        };
        content.cards.forEach(function (obj, i) {
            var tags;
            var color;
            if (Array.isArray(obj.labels)) {
                obj.labels.forEach(function (l) {
                    if (!color) {
                        color = colorMap[l.color] || '';
                    }
                    if (l.name) {
                        tags = tags || [];
                        var n = l.name.toLowerCase().trim();
                        if (tags.indexOf(n) === -1) { tags.push(n); }
                    }
                });
            }
            c.items[(i+1)] = {
                id: (i+1),
                title: obj.name,
                body: obj.desc,
                color: color,
                tags: tags
            };
        });

        var id = 1;
        content.lists.forEach(function (obj) {
            var _id = obj.id;
            var cards = [];
            content.cards.forEach(function (card, i) {
                if (card.idList === _id) {
                    cards.push(i+1);
                }
            });
            c.data[id] = {
                id: id,
                title: obj.name,
                item: cards
            };
            c.list.push(id);

            id++;
        });

        return c;
    };

    return module;
});

