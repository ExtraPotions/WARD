'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settings = fs.readFileSync(path.join(__dirname, '..', 'src', 'settings.js'), 'utf8');
const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');

test('WARD accepts only Light Dark System and delegates menu colors to Core',()=>{
 assert.ok(settings.includes("uiTheme: ['light', 'dark', 'system']"));
 assert.ok(ui.includes('createThemeModeControl'));assert.doesNotMatch(ui,/gem"|#120b05|#090f20/);
});
