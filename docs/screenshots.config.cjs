'use strict';

// README screenshots, captured by exp-core's shared tool: npm run screenshots

module.exports = {
  build: ['scripts/build.cjs'],
  userscript: 'ward.user.js',
  host: '#exp-ward-root',
  url: 'https://www.amazon.com/dp/sample',
  page: '<!doctype html><meta charset="utf-8"><title>Amazon</title><body style="margin:0;font:17px/1.6 system-ui;background:#f4f5f8;color:#1b1d22"><main style="max-width:560px;margin:40px;padding:32px 36px;background:#fff;border:1px solid #d9dde5;border-radius:14px"><h1>Sample product</h1><p>Product details for a sample listing.</p></main></body>',
  viewport: { width: 960, height: 1400 },
  shots: [
    { file: 'protection.png', section: 'Protection', tab: 'Overview' },
    { file: 'amazon.png', section: 'Amazon', tab: 'Store' },
  ],
};
