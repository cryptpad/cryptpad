// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var Meta = require("../lib/metadata");

var lines = [
    {
        "validateKey":"TMsHGx/I5EWBqckKTq/9t/6Xjvl7IdA/IMg0ssn27BY=",
        "owners":[
            "BpL3pEyX2IlfsvxQELB9uz5qh+40re0gD6J6LOobBm8="
        ],
        "channel":"771cefbdf2e62543388f1f7acb0338c1",
        "created":1628512619236
    },
    {
        "validateKey":"TMsHGx/I5EWBqckKTq/9t/6Xjvl7IdA/IMg0ssn27BY=",
        "channel":"771cefbdf2e62543388f1f7acb0338c1",
        "created":1628512619236
    }
];


var ref = {};
var lineHandler = Meta.createLineHandler(ref, console.log);

lines.forEach(line => {
    lineHandler(void 0, line);
});

console.log(ref);
