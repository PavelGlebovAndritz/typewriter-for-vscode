/**
 * Compiles the TypeScript source and packages the extension into a .vsix file.
 * Run via:  npm run build
 */
import { execSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd: string) {
    console.log(`> ${cmd}`);
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

console.log('\n=== Building VS Code Extension ===\n');

run('npx tsc -p ./');
run('npx --yes @vscode/vsce package');

console.log('\nDone! .vsix file created in the project root.\n');
