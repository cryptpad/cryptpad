// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {nodeResolve} from "@rollup/plugin-node-resolve";
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

const require = createRequire(import.meta.url);
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const IMPORT_RE = /@import\s+(?:url\s*\(\s*)?['"]([^'"]+)['"]\s*\)?\s*;/g;

// Resolve CSS imports
const resolveCssImport = (fromFile, spec) => {
    if (spec.startsWith('.') || spec.startsWith('/')) {
        return path.resolve(path.dirname(fromFile), spec);
    }
    return require.resolve(spec, { paths: [path.dirname(fromFile), ROOT] });
};

const flattenCss = (file, seen = new Set()) => {
    const abs = path.resolve(file);
    if (seen.has(abs)) { return ''; }
    seen.add(abs);
    const css = fs.readFileSync(abs, 'utf8');
    return css.replace(IMPORT_RE, (all, spec) => {
        return flattenCss(resolveCssImport(abs, spec), seen);
    });
};

const copyBlockNoteCss = () => ({
    name: 'copy-blocknote-css',
    buildStart () {
        this.emitFile({
            type: 'asset',
            fileName: 'blocknote.css',
            source: flattenCss(path.join(ROOT, 'node_modules/@blocknote/mantine/src/style.css'))
        });
    }
});

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
        copyBlockNoteCss(),
        setNodeEnv(),
        json(),
        nodeResolve({
            browser: true,
            exportConditions: ['browser', 'import', 'module', 'default']
        }),
        commonjs({
            include: /node_modules/,
            transformMixedEsModules: true
        })
    ]
};
