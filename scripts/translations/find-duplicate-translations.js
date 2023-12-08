// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var Assert = require("assert");
var Util = require("../../lib/common-util");
var addIfAbsent = function (A, e) {
    if (A.includes(e)) { return; }
    A.push(e);
};

var findDuplicates = function (map) {
    var keys = Object.keys(map);


    var duplicates = {};
    var markDuplicate = function  (value, key1, key2) {
        //console.log("[%s] === [%s] (%s)", key1, key2, value);
        if (!Array.isArray(duplicates[value])) {
            duplicates[value] = [];
        }
        addIfAbsent(duplicates[value], key1);
        addIfAbsent(duplicates[value], key2);
    };

    keys.forEach(function (key) {
        var value = map[key];

        //var duplicates = [];
        keys.forEach(function (key2) {
            if (key === key2) { return; }
            var value2 = map[key2];
            if (value === value2) {
                markDuplicate(value, key, key2);
            }
        });
    });

    var temp = {};
    // sort keys and construct a new index using the first key in the sorted array
    Object.keys(duplicates).forEach(function (key) {
        var val = duplicates[key]; // should be an array
        val.sort(); // default js sort
        var new_key = val[0];
        temp[new_key] = val;
    });

    var canonical = {};
    Object.keys(temp).sort().forEach(function (key) {
        canonical[key] = temp[key];
    });
    return canonical;
};

/*
var logDuplicates = function (duplicates) {
    // indicate which strings are duplicated and could potentially be changed to use one key
    Object.keys(duplicates).forEach(function (val) {
        console.log('\"%s\" => %s', val, JSON.stringify(duplicates[val]));
    });
};
*/

var FULL_LANGUAGES = {
    EN: Util.clone(require("../../www/common/translations/messages.json")),
    FR: Util.clone(require("../../www/common/translations/messages.fr.json")),
    DE: Util.clone(require("../../www/common/translations/messages.de.json")),
    JP: Util.clone(require("../../www/common/translations/messages.ja.json")),
    RU: Util.clone(require("../../www/common/translations/messages.ru.json")),
    CS: Util.clone(require("../../www/common/translations/messages.cs.json")),
    PT_BR: Util.clone(require("../../www/common/translations/messages.pt-br.json")),
};

var DUPLICATES = {};

Object.keys(FULL_LANGUAGES).forEach(function (code) {
    DUPLICATES[code] = findDuplicates(FULL_LANGUAGES[code]);
});

var extraneousKeys = 0;

// 1) check whether the same mapping exists across languages
// ie. English has "Open" (verb) and "Open" (adjective)
// while French has "Ouvrir" and "Ouvert(s)"
// such keys should not be simplified/deduplicated
Object.keys(DUPLICATES.EN).forEach(function (key) {
    var reference = DUPLICATES.EN[key];
    if (!['FR', 'DE', 'JP', 'RU', 'CS', 'PT_BR'].every(function (code) {
        try {
            Assert.deepEqual(reference, DUPLICATES[code][key]);
        } catch (err) {
            return false;
        }
        return true;
    })) {
        return;
    }
    console.log("The key [%s] (\"%s\") is duplicated identically across all fully supported languages", key, FULL_LANGUAGES.EN[key]);
    console.log("Values:", JSON.stringify(['EN', 'FR', 'DE', 'JP'].map(function (code) {
        return FULL_LANGUAGES[code][key];
    })));
    console.log("Keys:", JSON.stringify(reference));
    console.log();
    extraneousKeys += reference.length - 1;

    //console.log("\n" + code + "\n==\n");
    //logDuplicates(map);
});

console.log("Total extraneous keys: %s", extraneousKeys);


// TODO
// find instances where
// one of the duplicated keys is not translated
// perhaps we could automatically use the translated one everywhere
// and improve the completeness of translations

