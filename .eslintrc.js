// SPDX-FileCopyrightText: 2024 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

module.exports = {
    'env': {
        'browser': true,
        'es2021': true,
        'node': true
    },
    'plugins': ['compat'],
    'extends': ['eslint:recommended', 'plugin:compat/recommended'],
    "globals": {
        "define": "readonly",
    },
    'overrides': [
        {
            'env': {
                'node': true
            },
            'files': [
                '.eslintrc.{js,cjs}'
            ],
            'parserOptions': {
                'sourceType': 'script'
            }
        }
    ],
    'parserOptions': {
        'ecmaVersion': 'latest'
    },
    'rules': {
        'indent': [
            'off', // TODO enable this check
            4
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'off', // TODO enable this check
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],

        // TODO remove these exceptions from the eslint defaults
        'no-irregular-whitespace': ['off'],
        'no-unused-vars': ['warn'],
        'no-self-assign': ['off'],
        'no-empty': ['off'],
        'no-useless-escape': ['off'],
        'no-redeclare': ['off'],
        'no-extra-boolean-cast': ['off'],
        'no-global-assign': ['off'],
        'no-prototype-builtins': ['off'],
    }
};
