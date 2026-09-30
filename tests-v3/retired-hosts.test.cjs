'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.resolve(__dirname, '../ward.user.js'), 'utf8');

// Amazon retired AmazonSmile (smile.amazon.com) in 2023; the host now only redirects to www.amazon.com.
test('WARD does not run on or mention the retired smile.amazon.com host', () => {
  assert.doesNotMatch(script, /^\/\/ @match\s+https:\/\/smile\.amazon\.com\//mu);
  assert.doesNotMatch(script, /smile\.amazon\.com/u);
  assert.match(script, /^\/\/ @match\s+https:\/\/www\.amazon\.com\/\*$/mu, 'www.amazon.com is still supported');
});
