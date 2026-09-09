// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const EXPORT_PATH = path.join(__dirname, '..', '..', 'www', 'form', 'export.js');

// www/form/export.js is an AMD module (`define([...], factory)`) meant to run
// in a browser. Shim the global `define` so it can be loaded under Node
// without a real AMD loader or DOM, and hand it just the bits of its two
// dependencies (common-util.js, messages.js) that Export.results touches.
const loadExportModule = function () {
    const mockUtil = {
        clone: function (obj) { return JSON.parse(JSON.stringify(obj)); }
    };
    const mockMessages = {
        form_poll_time: 'Time',
        share_formView: 'Answer',
        form_default: 'Untitled question',
        anonymous: 'Anonymous'
    };

    let ExportModule;
    global.define = function (deps, factory) {
        const modules = deps.map(function (dep) {
            if (/common-util/.test(dep)) { return mockUtil; }
            if (/messages/.test(dep)) { return mockMessages; }
            throw new Error('test-export-form: unexpected AMD dependency "' + dep + '"');
        });
        ExportModule = factory.apply(null, modules);
    };

    delete require.cache[require.resolve(EXPORT_PATH)];
    require(EXPORT_PATH);
    delete global.define;

    return ExportModule;
};

const Export = loadExportModule();

// Mirrors the real TYPES map built in www/form/inner.js: "input" questions
// have no exportCSV handler, so they fall through Export.results' generic
// branch, which is exactly where the array/CSV split lives.
const TYPES = { input: {} };

const content = {
    form: {
        age: { type: 'input', q: 'Age', opts: { type: 'number' } },
        score: { type: 'input', q: 'Score', opts: { type: 'number' } },
        name: { type: 'input', q: 'Name', opts: { type: 'text' } }
    }
};
const order = ['age', 'score', 'name'];

const answers = {
    curve1: {
        user1: {
            time: 1700000000000,
            msg: {
                age: '42',
                score: '0',
                name: 'Bob'
            }
        }
    }
};

// ---------------------------
// BEGIN TESTS FOR ISSUE #2214
// ---------------------------

test('"array" format casts numeric "input" answers to real JS numbers', function () {
    const rows = Export.results(content, answers, TYPES, order, 'array');
    const dataRow = rows[1];

    assert.equal(typeof dataRow[2], 'number');
    assert.equal(dataRow[2], 42);
});

test('"array" format keeps a numeric zero answer as the number 0, not an empty cell', function () {
    const rows = Export.results(content, answers, TYPES, order, 'array');
    const dataRow = rows[1];

    assert.equal(typeof dataRow[3], 'number');
    assert.equal(dataRow[3], 0);
});

test('"array" format leaves non-numeric "input" answers as strings', function () {
    const rows = Export.results(content, answers, TYPES, order, 'array');
    const dataRow = rows[1];

    assert.equal(typeof dataRow[4], 'string');
    assert.equal(dataRow[4], 'Bob');
});

test('CSV format (default) still renders numeric answers as text, unaffected by the fix', function () {
    const csv = Export.results(content, answers, TYPES, order);
    const fields = csv.split('\n')[1].split(',');

    assert.equal(fields[2], '42');
    assert.equal(fields[3], '0'); // must render as "0", not an empty cell
    assert.equal(fields[4], 'Bob');
});

// ---------------------------
// END TESTS FOR ISSUE #2214
// ---------------------------
