// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/customize/messages.js'
], function (Messages) {
    var pollValues = [];
    var d8 = new Date();
    d8.setDate(d8.getDate() - d8.getDay() + 7); // set sunday
    d8.setHours(8);
    d8.setMinutes(0);
    d8.setSeconds(0);
    d8.setMilliseconds(0);
    var d14 = new Date(d8);
    d14.setHours(14);
    [0,1,2].forEach(function (el) {
        d8.setDate(d8.getDate() + 1);
        d14.setDate(d14.getDate() + 1);
        if (el === 2) {
            d8.setHours(10);
        }
        pollValues.push(+d8);
        if (el === 2) { return; }
        pollValues.push(+d14);
    });
    return [{
        id: 'a',
        used: 1,
        name: Messages.form_template_poll,
        content: {
            answers: {
                anonymous: true,
            },
            form: {
                "1": {
                    type: 'md'
                },
                "2": {
                    type: 'poll',
                    opts: {
                        type: 'time',
                        values: pollValues
                    }
                }
            },
            order: ["1", "2"]
        }
    }];
});
