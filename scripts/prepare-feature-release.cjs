'use strict';

// Prepares a feature release: bumps the patch version everywhere it lives and
// writes the same 2-4 release notes into the changelog and the in-app notes.
//
//   RELEASE_NOTES_JSON='["First note.","Second note."]' node scripts/prepare-feature-release.cjs
//
// Optional: RELEASE_VERSION=x.y.z to choose the version instead of the next patch.
// Run npm test afterward so the generated userscript is rebuilt.

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const write = (relative, value) => fs.writeFileSync(path.join(root, relative), value);
const exists = relative => fs.existsSync(path.join(root, relative));
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const replaceRequired = (text, pattern, replacement, label) => {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`Could not update ${label}`);
  return next;
};
const bumpPatch = version => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || ''));
  if (!match) throw new Error(`Unsupported product version: ${version}`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
};

let notes;
try { notes = JSON.parse(process.env.RELEASE_NOTES_JSON || ''); } catch { throw new Error('RELEASE_NOTES_JSON must be a JSON array of 2-4 release notes'); }
if (!Array.isArray(notes) || notes.length < 2 || notes.length > 4 || notes.some(note => typeof note !== 'string' || !note.trim())) {
  throw new Error('Feature releases need 2-4 non-empty release notes');
}
notes = notes.map(note => note.trim());

const pkg = JSON.parse(read('package.json'));
const previous = pkg.version;
const next = String(process.env.RELEASE_VERSION || bumpPatch(previous));
if (!/^\d+\.\d+\.\d+$/.test(next) || next === previous) throw new Error(`Invalid release version: ${next}`);
const from = escapeRegExp(previous);
const date = new Date().toISOString().slice(0, 10);

pkg.version = next;
write('package.json', JSON.stringify(pkg, null, 2) + '\n');

const lock = JSON.parse(read('package-lock.json'));
lock.version = next;
if (lock.packages?.['']) lock.packages[''].version = next;
write('package-lock.json', JSON.stringify(lock, null, 2) + '\n');

write('src/metadata.txt', replaceRequired(read('src/metadata.txt'), /^(\/\/ @version\s+)\S+/m, `$1${next}`, 'userscript metadata version'));

const versionLine = new RegExp(`EXP\\.VERSION = ['"]${from}['"];`);
for (const file of ['src/main.js', 'src/release-notes.js']) {
  if (exists(file) && versionLine.test(read(file))) write(file, replaceRequired(read(file), versionLine, `EXP.VERSION = '${next}';`, `${file} version`));
}
write('src/release-notes.js', replaceRequired(
  read('src/release-notes.js'),
  new RegExp(`^(\\s*)'${from}': \\[`, 'm'),
  (match, indent) => `${indent}'${next}': ${JSON.stringify(notes)},\n${match}`,
  'in-app release notes',
));

// Match the separator the changelog already uses (em dash or hyphen).
const changelog = read('CHANGELOG.md');
const separator = /^## \d+\.\d+\.\d+ (—|-) /m.exec(changelog)?.[1] || '—';
const section = `## ${next} ${separator} ${date}\n\n${notes.map(note => `- ${note}`).join('\n')}\n\n`;
write('CHANGELOG.md', changelog.startsWith(`## ${next} `) ? changelog : section + changelog);

console.log(`Prepared ${pkg.name || 'product'} ${next} from ${previous} with ${notes.length} release notes. Run npm test to rebuild.`);
