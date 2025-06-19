// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outputDir = path.join('www', 'components', '@noble', 'post-quantum');
const outputFile = path.join(outputDir, 'index.js');

fs.mkdirSync(outputDir, { recursive: true });

function bundleWithBrowserify() {
    const entryFilePath = path.join(outputDir, 'entry.js');
    fs.writeFileSync(entryFilePath, `
// Entry point for bundling @noble post-quantum modules
const ml_kem = require('@noble/post-quantum/ml-kem');
const ml_dsa = require('@noble/post-quantum/ml-dsa');
const utils = require('@noble/post-quantum/utils');

module.exports = {
  ml_kem,
  ml_dsa,
  utils
};
  `);

    try {
        console.log('Bundling with browserify...');
        execSync(`npx browserify ${entryFilePath} -o ${outputFile}`, { stdio: 'inherit' });

        let content = fs.readFileSync(outputFile, 'utf8');

        const wrappedContent = `
// Post-quantum cryptography module bundled for RequireJS
define('components/@noble/post-quantum/index', [], function() {
  var global = typeof self !== 'undefined' ? self : this;
  var module = { exports: {} };
  var exports = module.exports;

  (function (module, exports) {
${content}
  })(module, exports);

  return module.exports;
});
`;

        fs.writeFileSync(outputFile, wrappedContent);
        console.log(`Successfully bundled PQ modules to ${outputFile}`);
        fs.unlinkSync(entryFilePath);
        return true;
    } catch (err) {
        console.error('Browserify bundling failed:', err.message);
        if (fs.existsSync(entryFilePath)) fs.unlinkSync(entryFilePath);
        return false;
    }
}

console.log('Starting PQ crypto browser conversion...');

if (bundleWithBrowserify()) {
    console.log('PQ crypto browser conversion complete!');
    console.log('Use it with:');
    console.log('define([\'components/@noble/post-quantum/index\'], function(PostQuantum) {');
    console.log('  // Use PostQuantum.ml_kem, etc.');
    console.log('});');
} else {
    process.exit(1);
}
