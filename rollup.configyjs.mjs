// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {nodeResolve} from "@rollup/plugin-node-resolve"
import commonjs from '@rollup/plugin-commonjs';
//import builtins from 'rollup-plugin-node-builtins';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

//import nodePolyfills from 'rollup-plugin-polyfill-node';

export default {
    input: "./src/yjs.js",
    output: [{
        name: 'cryptpad-yjs',
        file: "./www/common/yjs-bundle.js",
        format: "umd",
        plugins: [terser({
            format: { comments: false, ecma: '2015' }
        })]
    }],
    plugins: [
        nodeResolve({}),
        commonjs({})
    ]
}
