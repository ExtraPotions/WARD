'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settings = fs.readFileSync(path.join(__dirname, '..', 'src', 'settings.js'), 'utf8');
const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');

test('WARD uses the locked eight-slot contract with Crimson', () => {
  assert.match(settings, /uiTheme: \['ember', 'midnight', 'glacier', 'contrast', 'verdant', 'pride', 'crimson', 'ward'\]/u);
  assert.doesNotMatch(ui, /"name":"Twitch"/u);
  for (const token of ['#120b05', '#b66a16', '#9d3131', '#356f78']) assert.match(ui, new RegExp(token, 'u'));
});
