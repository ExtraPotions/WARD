'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('diagnostics omit saved browsing paths and brands without changing exports', () => {
  const context = vm.createContext({ EXP: {}, ExtraPotionsCore: { cloneSettings: value => JSON.parse(JSON.stringify(value)) } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/settings.js'), 'utf8'), context);
  const settings = context.EXP.Settings;
  settings.load();
  settings.update({ pageExceptions: [{ path: 'amazon.com/private-order/synthetic-order', patternId: 'pressure.urgency' }], trustedBrands: ['privatebrand'], safeMode: true });
  const original = JSON.stringify(settings.exportData());
  const result = settings.diagnosticSnapshot();
  assert.ok(!JSON.stringify(result).includes('private-order'));
  assert.ok(!JSON.stringify(result).includes('privatebrand'));
  assert.equal(result.pageExceptionCount, 1);
  assert.equal(result.trustedBrandCount, 1);
  assert.equal(result.safeMode, true);
  assert.equal(settings.diagnosticSnapshot(settings.defaults).pageExceptionCount, 0);
  assert.equal(JSON.stringify(settings.exportData()), original);
  assert.ok(original.includes('private-order'));
});

test('issue summaries use redacted settings for current values and defaults', () => {
  const ui = fs.readFileSync(path.join(__dirname, '../src/ui.js'), 'utf8');
  assert.match(ui, /issueSettings:\(\)=>\(\{current:EXP\.Settings\.diagnosticSnapshot\(\),defaults:EXP\.Settings\.diagnosticSnapshot\(EXP\.Settings\.defaults\)\}\)/);
});
