// SPDX-FileCopyrightText: 2024 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const compatPlugin = require("eslint-plugin-compat");
const globals = require("globals");
const js = require("@eslint/js");
const FlatCompat = require("@eslint/eslintrc").FlatCompat;

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = [{
    ignores: [
        "**/node_modules/",
        "www/components/",
        "www/bower_components/",
        "www/common/onlyoffice/dist",
        "www/common/onlyoffice/x2t",
        "**/onlyoffice-dist/",
        "www/scratch",
        "www/accounts",
        "www/lib",
        "www/accounts",
        "www/worker",
        "www/todo",
        "**/*worker.bundle.js",
        "**/_build",
        "www/common/hyperscript.js",
        "www/pad/wysiwygarea-plugin.js",
        "www/pad/mediatag-plugin.js",
        "www/pad/mediatag-plugin-dialog.js",
        "www/pad/disable-base64.js",
        "www/pad/wordcount/",
        "www/kanban/jkanban.js",
        "www/common/jscolor.js",
        "www/common/media-tag-nacl.min.js",
        "**/customize/",
        "www/debug/chainpad.dist.js",
        "www/pad/mathjax/",
        "www/code/mermaid*.js",
        "www/code/orgmode.js",
        "www/common/worker.bundle.js",
        "src/tweetnacl",
        "_build",
        "testapi.js",
        "rollup.config.mjs",
    ],
}, ...compat.extends("eslint:recommended", "plugin:compat/recommended"), {
    plugins: {
        compatPlugin,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            define: "readonly",
        },

        ecmaVersion: "latest",
        sourceType: "commonjs",
    },

    rules: {
        indent: ["off", 4],
        "linebreak-style": ["off", "unix"],
        quotes: ["off", "single"],
        semi: ["error", "always"],
        eqeqeq: ["error", "always"],
        "no-irregular-whitespace": ["off"],
        "no-self-assign": ["off"],
        "no-empty": ["off"],
        "no-useless-escape": ["off"],
        "no-extra-boolean-cast": ["off"],
        "no-prototype-builtins": ["off"],
        "no-use-before-define": ["error"],
        "no-unused-vars": [
            "error",
            {
                caughtErrors: "none"
            }
        ]
    },
}, {
    files: ["**/.eslintrc.{js,cjs}"],

    languageOptions: {
        globals: {
            ...globals.node,
        },

        ecmaVersion: 5,
        sourceType: "commonjs",
    },
}];
