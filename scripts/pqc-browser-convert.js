// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const { execSync } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

// This content will be used for a temporary entry file for the bundle.
// It re-exports the necessary modules from the @noble/post-quantum package.
const entryPointContent = `
export * as ml_kem from '@noble/post-quantum/ml-kem';
export * as ml_dsa from '@noble/post-quantum/ml-dsa';
export * as utils from '@noble/post-quantum/utils';
`;

async function main() {
    try {
        console.log('Temporarily installing esbuild...');
        execSync('npm install esbuild', { stdio: 'inherit' });

        const esbuild = require('esbuild');

        const outputDir = path.join('www', 'components', '@noble', 'post-quantum');
        const entryPointPath = path.join(outputDir, '_pqc_entry.js');
        const outfile = path.resolve(outputDir, 'index.js');

        try {
            await fs.mkdir(outputDir, { recursive: true });
            await fs.writeFile(entryPointPath, entryPointContent.trim());
            console.log('Bundling for browser with esbuild...');

            await esbuild.build({
                entryPoints: [entryPointPath],
                bundle: true,
                outfile,
                format: 'iife',
                globalName: 'PostQuantum',
                platform: 'browser',
                minify: false,
                sourcemap: true,
            });

            const amdLoader = `\nif (typeof define === 'function' && define.amd) { define([], function() { return window.PostQuantum; }); }`;
            await fs.appendFile(outfile, amdLoader);

            console.log(`Bundle created successfully: ${outfile}`);
        } finally {
            // Clean up the temporary entry file
            await fs.unlink(entryPointPath).catch(err => {
                if (err.code !== 'ENOENT') {
                    console.error('Failed to remove temporary entry file:', err);
                }
            });
        }
    } catch (e) {
        console.error('An error occurred during the process:');
        console.error(e);
        process.exit(1);
    } finally {
        console.log('Removing temporary esbuild dependency...');
        try {
            execSync('npm uninstall esbuild', { stdio: 'inherit' });
        } catch (uninstallErr) {
            console.error('Failed to uninstall esbuild. You may need to remove it manually.', uninstallErr);
        }
    }
}

console.log('Starting PQ crypto browser conversion...');

main().then(() => {
    console.log('PQ crypto browser conversion complete!');
}).catch(() => {
    process.exit(1);
});
