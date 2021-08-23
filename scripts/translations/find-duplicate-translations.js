var Util = require("../lib/common-util");
var EN = Util.clone(require("../www/common/translations/messages.json"));
var FR = Util.clone(require("../www/common/translations/messages.fr.json"));
var DE = Util.clone(require("../www/common/translations/messages.de.json"));
var JP = Util.clone(require("../www/common/translations/messages.ja.json"));

var keys = Object.keys(EN);

var duplicates = {};
var addIfAbsent = function (A, e) {
    if (A.includes(e)) { return; }
    A.push(e);
};
var markDuplicate = function  (value, key1, key2) {
    //console.log("[%s] === [%s] (%s)", key1, key2, value);
    if (!Array.isArray(duplicates[value])) {
        duplicates[value] = [];
    }
    addIfAbsent(duplicates[value], key1);
    addIfAbsent(duplicates[value], key2);
};

keys.forEach(function (key) {
    var value = EN[key];

    //var duplicates = [];
    keys.forEach(function (key2) {
        if (key === key2) { return; }
        var value2 = EN[key2];
        if (value === value2) {
            markDuplicate(value, key, key2);
        }
    });
});

// indicate which strings are duplicated and could potentially be changed to use one key
Object.keys(duplicates).forEach(function (val) {
    console.log('\"%s\" => %s', val, JSON.stringify(duplicates[val]));
});

// TODO iterate over all languages and

// 1) check whether the same mapping exists across languages
// ie. English has "Open" (verb) and "Open" (adjective)
// while French has "Ouvrir" and "Ouvert(s)"
// such keys should not be simplified/deduplicated



// find instances where
// one of the duplicated keys is not translated
// perhaps we could automatically use the translated one everywhere
// and improve the completeness of translations


