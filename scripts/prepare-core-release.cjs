'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const product = "WARD";
const sourceId = "ward";

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}
function write(relative, value) {
  fs.writeFileSync(path.join(root, relative), value);
}
function exists(relative) {
  return fs.existsSync(path.join(root, relative));
}
function bumpPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || ''));
  if (!match) throw new Error(`Unsupported product version: ${version}`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}
function replaceRequired(text, pattern, replacement, label) {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`Could not update ${label}`);
  return next;
}
function atLeastVersion(version, minimum) {
  const a = String(version).split('.').map(Number);
  const b = String(minimum).split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) > (b[index] || 0);
  }
  return true;
}

const pkg = JSON.parse(read('package.json'));
const previous = pkg.version;
const next = bumpPatch(previous);
const coreTag = read('vendor/exp-core/PIN').trim();
if (!/^v\d+\.\d+\.\d+$/.test(coreTag)) throw new Error(`Invalid exp-core pin: ${coreTag}`);
const coreVersion = coreTag.slice(1);
const date = new Date().toISOString().slice(0, 10);

if (atLeastVersion(coreVersion, '3.3.14')) {
  write('src/core.js', "const services = ExtraPotionsCore.createProductServices({\n  productId: 'ward',\n  repository: 'ExtraPotions/WARD',\n  currentVersion: EXP.VERSION,\n  enabled: () => EXP.Settings.snapshot().updateNotifications,\n  onError: error => EXP.Core.safeError(Object.assign(error, { code: 'UPDATE_CHECK' }), 'ward.updates'),\n});\nEXP.Core = services.lifecycle;\nEXP.Diagnostics = services.diagnostics;\nEXP.Updates = services.updates;\n");
  for (const relative of ['src/updates.js', 'src/diagnostics.js']) {
    if (exists(relative)) fs.unlinkSync(path.join(root, relative));
  }
  let build = read('scripts/build.cjs');
  build = build
    .replace(/,\s*'updates\.js'/u, '')
    .replace(/,\s*'diagnostics\.js'/u, '');
  write('scripts/build.cjs', build);
  console.log('Migrated shared bootstrap to Core-owned product services.');
}

pkg.version = next;
write('package.json', JSON.stringify(pkg, null, 2) + '\n');

const lock = JSON.parse(read('package-lock.json'));
lock.version = next;
if (lock.packages?.['']) lock.packages[''].version = next;
write('package-lock.json', JSON.stringify(lock, null, 2) + '\n');

if (exists('src/metadata.txt')) {
  let metadata = read('src/metadata.txt');
  metadata = replaceRequired(
    metadata,
    /^\/\/ @version\s+\S+/m,
    `// @version      ${next}`,
    'userscript metadata version',
  );
  write('src/metadata.txt', metadata);
}

if (exists('src/main.js')) {
  let main = read('src/main.js');
  if (main.includes(`EXP.VERSION = '${previous}';`)) {
    main = main.replace(`EXP.VERSION = '${previous}';`, `EXP.VERSION = '${next}';`);
    write('src/main.js', main);
  }
}

if (exists('src/release-notes.js')) {
  let notes = read('src/release-notes.js');
  if (notes.includes(`EXP.VERSION = '${previous}';`)) {
    notes = notes.replace(`EXP.VERSION = '${previous}';`, `EXP.VERSION = '${next}';`);
  }
  const entry = `    '${next}': ['Updates the shared foundation to exp-core ${coreVersion}.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves ${product} product-specific engine behavior unchanged.'],\n`;
  const marker = /(const\s+(?:NOTES|notes)\s*=\s*Object\.freeze\(\{\n)/;
  if (!marker.test(notes)) throw new Error('Could not locate release-notes map');
  notes = notes.replace(marker, `$1${entry}`);
  write('src/release-notes.js', notes);
}

if (product === 'Dropper') {
  let source = read('src/dropper.user.js');
  source = replaceRequired(
    source,
    /^\/\/ @version\s+\S+/m,
    `// @version      ${next}`,
    'Dropper userscript metadata version',
  );
  source = replaceRequired(
    source,
    new RegExp(`const APP_VERSION = ["']${previous.replace(/\./g, '\\.') }["'];`),
    `const APP_VERSION = "${next}";`,
    'Dropper APP_VERSION',
  );
  write('src/dropper.user.js', source);
}

let changelog = read('CHANGELOG.md');
const heading = `## ${next} - ${date}\n\n`;
const body = [
  `- Updates the shared foundation to exp-core ${coreVersion}.`,
  '- Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.',
  `- Leaves ${product} product-specific engine behavior unchanged.`,
  '',
].join('\n');
if (!changelog.startsWith(`## ${next} `)) changelog = heading + body + '\n' + changelog;
write('CHANGELOG.md', changelog);

console.log(`Prepared ${product} ${next} for exp-core ${coreVersion} (from ${previous}).`);
