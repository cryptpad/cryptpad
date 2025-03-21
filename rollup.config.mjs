import {nodeResolve} from "@rollup/plugin-node-resolve"
import commonjs from '@rollup/plugin-commonjs';
//import builtins from 'rollup-plugin-node-builtins';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

//import nodePolyfills from 'rollup-plugin-polyfill-node';

export default {
    //input: "./_src/worker/index.ts",
    input: "./src/worker/store.ts",
    output: [{
        name: 'cryptpad-worker',
        file: "./www/common/worker.bundle.js",
        format: "umd",
        plugins: [
            terser({
                format: {
                    comments: 'some',
                    beautify: true,
                    ecma: '2015',
                },
                compress: false,
                mangle: false,
                module: true,
            }),
        ]
    }, {
        name: 'cryptpad-worker-min',
        file: "./www/common/worker.bundle.min.js",
        format: "umd",
        plugins: [terser({
            format: { comments: false, ecma: '2015' }
        })]
    }],
    preserveSymlinks: true,
    plugins: [
        json(),
        typescript(),
        //builtins(),
        nodeResolve({
        }),
        commonjs({
            ignore:['crypto', 'node:http', 'node:https'] // required by tweetnacl for node
        }),
        //nodePolyfills( /* options */ )
    ]
}
