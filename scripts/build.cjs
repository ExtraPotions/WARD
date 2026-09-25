'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const crypto = require('node:crypto');
const normalize = (text) => text.replace(/\r\n/g, '\n');
const corePath = path.join(root, 'vendor', 'exp-core', 'exp-core.js');
const coreSource = fs.readFileSync(corePath, 'utf8');
const core = normalize(coreSource);
const coreManifest = JSON.parse(fs.readFileSync(path.join(root, 'vendor', 'exp-core', 'manifest.json'), 'utf8'));
if (crypto.createHash('sha256').update(coreSource).digest('hex') !== coreManifest.bundleSha256) throw new Error('Bundled Core hash mismatch');

const sources = ['core.js', 'settings.js', 'patterns.js', 'audit.js', 'amazon-adapter.js', 'activity.js', 'page-styles.js', 'actions.js', 'layout.js', 'engine.js', 'release-notes.js', 'updates.js', 'menu-chrome.js', 'diagnostics.js', 'ui.js', 'main.js'];
let metadata = normalize(fs.readFileSync(path.join(root, 'src', 'metadata.txt'), 'utf8')).trimEnd();
const badgeData = `data:image/svg+xml;base64,${fs.readFileSync(path.join(root, 'assets', 'ward.svg')).toString('base64')}`;
metadata = metadata.replaceAll('__EXP_WARD_BADGE_DATA__', badgeData);
const launcherData = `data:image/svg+xml;base64,${fs.readFileSync(path.join(root, 'assets', 'ward-launcher.svg')).toString('base64')}`;
const body = sources.map((name) => normalize(fs.readFileSync(path.join(root, 'src', name), 'utf8')).trim()).join('\n\n');
const output = `${metadata}\n\n(() => {\n'use strict';\nconst EXP = Object.create(null);\n\n${core}\n${body}\n})();\n`.replaceAll('__EXP_WARD_BADGE_DATA__', badgeData).replaceAll('__EXP_WARD_LAUNCHER_DATA__', launcherData);
const target = path.join(root, 'ward.user.js');

if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) {
    console.error('ward.user.js is not reproducible from current source.');
    process.exit(1);
  }
  console.log('Build check passed.');
} else {
  fs.writeFileSync(target, output, 'utf8');
  console.log(`Built ${path.relative(root, target)} (${Buffer.byteLength(output)} bytes).`);
}
