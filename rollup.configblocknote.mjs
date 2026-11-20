// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import path from 'path';
import { createRequire } from 'module';
import {nodeResolve} from "@rollup/plugin-node-resolve";
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import atImport from 'postcss-import';

const require = createRequire(import.meta.url);
// Resolve CSS imports
const resolveCssImport = (id, basedir) => {
    if (id.startsWith('.') || path.isAbsolute(id)) {
        return path.resolve(basedir, id);
    }
    return require.resolve(id, { paths: [basedir] });
};

const setNodeEnv = () => ({
    name: 'set-node-env',
    transform (code) {
        if (!code.includes('process.env.NODE_ENV')) { return null; }
        return {
            code: code.replace(/process\.env\.NODE_ENV/g, JSON.stringify('production')),
            map: null
        };
    }
});

export default {
    input: "./src/blocknote.js",
    output: [{
        name: 'cryptpad-blocknote',
        file: "./www/common/blocknote-bundle.js",
        format: "umd",
        exports: "default",
        inlineDynamicImports: true,
        plugins: [terser({
            format: { comments: false, ecma: '2015' }
        })]
    }],
    // Hide unnecessary warnings
    onwarn (warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') { return; }
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') { return; }
        warn(warning);
    },
    plugins: [
        postcss({
            extract: path.resolve('www/common/blocknote.css'),
            plugins: [atImport({ resolve: resolveCssImport })]
        }),
        setNodeEnv(),
        json(),
        nodeResolve({browser: true}),
        commonjs()
    ]
};
