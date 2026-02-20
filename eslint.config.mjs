import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";


const rules = {
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
    "no-prototype-builtins": ["error"],
    "no-use-before-define": ["error"],
    "no-prototype-builtins": ["off"], // FIXME
    //"no-undef": ["error"],
    "no-unused-vars": [
        "error",
        {
            caughtErrors: "none"
        }
    ]
};

export default defineConfig([
    globalIgnores([
        "data/**",
        "datastore/**",
        "blob/**", "block/**", "pins/**",
        "LICENSES/**",
        "node_modules/**",
        "**/node_modules/",
        "www/components/**",
        "www/common/onlyoffice/dist/**",
        "www/common/onlyoffice/x2t/**",
        "**/onlyoffice-dist/**",
        "www/scratch/**",
        "www/accounts/**",
        "www/lib/**",
        "www/worker/**",
        "www/todo/**",
        "**/_build",
        "www/common/hyperscript.js",
        "www/pad/wysiwygarea-plugin.js",
        "www/pad/mediatag-plugin.js",
        "www/pad/mediatag-plugin-dialog.js",
        "www/pad/disable-base64.js",
        "www/pad/wordcount/**",
        "www/kanban/jkanban.js",
        "www/common/jscolor.js",
        "www/common/media-tag-nacl.min.js",
        "**/customize/**",
        "www/debug/chainpad.dist.js",
        "www/pad/mathjax/**",
        "www/code/mermaid*.js",
        "www/code/orgmode.js",
        "www/common/worker.bundle.js",
        "www/common/worker.bundle.min.js",
        "rollup.config.mjs",
        "*/lucide.js",
        "scripts/**",
        "**/.git/**"

    ]), {
        files: [
            "lib/**",
            "src/**",
            "www/**",
            "customize.dist/**",
            "config/**", "server.js"
        ],
        languageOptions: {
            globals: { ...globals.node, ...globals.browser, ...globals.amd }
        },
        rules
}]);
