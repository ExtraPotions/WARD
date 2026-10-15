'use strict';
// WARD loads on every https page and leaves at once unless the page is a listed store or a Shopify storefront.
// The announcement section is Keychron's markup (October 2026). No live sign-up pop-up could be captured, so the
// pop-up fixtures follow the structure every vendor shares: a fixed layer, an email field and promotional wording.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const distribution = fs.readFileSync(path.join(root, 'ward.user.js'), 'utf8');

const SHOPIFY_HEAD = '<script id="shopify-features" type="application/json">{"accessToken":"x"}</script><meta name="shopify-digital-wallet" content="/1/digital_wallets/dialog">';
const ANNOUNCEMENT = '<div id="shopify-section-sections--22739711426649__announcement" class="shopify-section shopify-section-group-header-group cc-announcement"> <announcement-bar class="announcement block text-body-small" data-slide-delay="7000"> <announcement-bar class="announcement block text-body-small convx__country-announcement-bar" data-slide-delay="7000"> <div class="container"> <div class="flex"> <div class="announcement__col--left announcement__col--align-center announcement__slider" aria-roledescription="carousel" aria-live="off"> <div class="announcement__text flex items-center m-0 is-visible" aria-roledescription="slide"> <div class="rte"> <p> Shop <a href="/collections/us-warehouse-in-stock-products" title="US in-stock products">US in-stock products</a> - no surprise tariffs, and free shipping $69+ </p> </div> </div> </div> </div> </div> </announcement-bar> </announcement-bar> </div>';
const PRODUCT = `<main id="MainContent"><h1>Keychron Q1 HE</h1><div class="price" id="price"><span class="price__current">$219.00</span></div>
  <div class="countdown-timer" id="urgency">Sale ends in 02:14:09</div>
  <form method="post" action="/cart/add" id="product-form"><input type="hidden" name="id" value="1"><button type="submit" name="add" id="add">Add to Cart</button></form></main>
  <footer><form id="footer-newsletter" class="newsletter-form"><input type="email" name="contact[email]" placeholder="Email"><button>Subscribe</button></form></footer>`;
const POPUP = '<div class="needsclick kl-private-reset-css-Xuajs1" id="popup-layer" style="position:fixed;inset:0;z-index:90000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center"><div role="dialog" aria-modal="true" aria-label="POPUP Form" class="needsclick" id="popup" style="background:#fff;width:400px;height:300px"><h2>Unlock 10% off your first order</h2><input type="email" placeholder="Email"><button type="button">Sign up</button><button type="button" aria-label="Close dialog">×</button></div></div>';
const BACK_IN_STOCK = '<modal-dialog id="klaviyo_back_in_stock_drawer"><div class="klaviyo-back-in-stock-drawer" id="bis" role="dialog" style="position:fixed;right:0;top:0;width:300px;height:400px;background:#fff"><p>Get notified when this is back in stock</p><input type="email"><button>Notify me</button></div></modal-dialog>';
const SIGN_IN = '<div role="dialog" aria-modal="true" id="sign-in" style="position:fixed;left:0;bottom:0;width:300px;height:200px;background:#fff"><h2>Sign in to your account</h2><input type="email"><input type="password"><button>Sign in</button></div>';

const page = (head, body) => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

async function open(t, url, html, { settings, init = false, instrument = false } = {}) {
  const source = instrument ? require('./load-source.cjs').loadSource().replace('EXP.App.start();', 'globalThis.__ward = EXP; EXP.App.start();') : distribution;
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const tab = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  if (settings) await tab.addInitScript((settings) => localStorage.setItem('exp:v3:ward:settings', JSON.stringify(settings)), settings);
  if (init) await tab.addInitScript({ content: source });
  const origin = new URL(url).origin;
  await tab.route(`${origin}/**`, (route) => route.request().isNavigationRequest() ? route.fulfill({ status: 200, contentType: 'text/html', body: html }) : route.fulfill({ status: 200, body: '' }));
  await tab.goto(url);
  if (!init) await tab.addScriptTag({ content: source });
  await tab.waitForTimeout(400);
  return tab;
}

const owned = (tab) => tab.evaluate(() => ({
  root: Boolean(document.getElementById('exp-ward-root')),
  marker: Boolean(document.querySelector('meta[data-exp-diagnostics-product="ward"]')),
  ownedNodes: document.querySelectorAll('[data-exp-owned="1"]').length,
  actions: document.querySelectorAll('[data-ward-action]').length,
}));
const action = (tab, id) => tab.evaluate((id) => document.getElementById(id)?.dataset.wardAction || null, id);

test('WARD stays out of a page that is not a store, even one loading images and styles from cdn.shopify.com', async (t) => {
  const html = page('<link rel="stylesheet" href="https://cdn.shopify.com/s/files/1/theme.css">', '<main><img src="https://cdn.shopify.com/s/files/1/pic.png"><p>A blog post</p></main>');
  const tab = await open(t, 'https://plain.example/post', html, { init: true });
  assert.deepEqual(await owned(tab), { root: false, marker: false, ownedNodes: 0, actions: 0 });
});

test('listed stores still start at document-start; Shopify storefronts start once the page is parsed', async (t) => {
  // WARD saves its settings as soon as it starts, so a script in the page body can see whether it already ran.
  const probe = '<script>window.wardSeenWhileParsing = localStorage.getItem(\'exp:v3:ward:settings\') !== null;</script>';
  const amazon = await open(t, 'https://www.amazon.com/dp/ward', page('', `<main>Item</main>${probe}`), { init: true });
  assert.equal(await amazon.evaluate(() => window.wardSeenWhileParsing), true);
  const shopify = await open(t, 'https://www.keychron.com/products/q1', page(SHOPIFY_HEAD, `${ANNOUNCEMENT}${PRODUCT}${probe}`), { init: true });
  assert.equal(await shopify.evaluate(() => window.wardSeenWhileParsing), false);
  assert.equal((await owned(shopify)).root, true);
});

test('on a Shopify storefront WARD dims the announcement bar and urgency, and leaves price, Add to Cart and the footer newsletter alone', async (t) => {
  const tab = await open(t, 'https://www.keychron.com/products/q1', page(SHOPIFY_HEAD, `${ANNOUNCEMENT}${PRODUCT}`), { init: true });
  assert.equal(await action(tab, 'shopify-section-sections--22739711426649__announcement'), 'dim');
  assert.equal(await action(tab, 'urgency'), 'dim');
  const untouched = await tab.evaluate(() => ['price', 'product-form', 'add', 'footer-newsletter'].map((id) => { const node = document.getElementById(id); return [id, Boolean(node.closest('[data-ward-action]')), getComputedStyle(node).display !== 'none']; }));
  assert.deepEqual(untouched, [['price', false, true], ['product-form', false, true], ['add', false, true], ['footer-newsletter', false, true]]);
});

test('a sign-up pop-up that appears after load is hidden whole, backdrop included, with nothing left in its place', async (t) => {
  const tab = await open(t, 'https://www.keychron.com/', page(SHOPIFY_HEAD, `${ANNOUNCEMENT}${PRODUCT}`), { init: true });
  await tab.evaluate((html) => document.body.insertAdjacentHTML('beforeend', html), POPUP);
  await tab.waitForFunction(() => document.getElementById('popup-layer').dataset.wardAction === 'hide');
  const after = await tab.evaluate(() => ({
    display: getComputedStyle(document.getElementById('popup-layer')).display,
    companions: document.querySelectorAll('.exp-ward-collapse,.exp-ward-annotation').length,
    centre: document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('#popup-layer') ? 'popup' : 'page',
  }));
  assert.deepEqual(after, { display: 'none', companions: 0, centre: 'page' });
});

test('back-in-stock alerts, sign-in dialogs and pop-ups that lock page scrolling are left alone', async (t) => {
  const tab = await open(t, 'https://www.keychron.com/', page(SHOPIFY_HEAD, `${PRODUCT}${BACK_IN_STOCK}${SIGN_IN}`), { init: true });
  assert.equal(await tab.evaluate(() => document.querySelectorAll('#bis [data-ward-action], #bis[data-ward-action], modal-dialog[data-ward-action], #sign-in[data-ward-action]').length), 0);
  // Body is never changed by WARD, so hiding a pop-up that froze scrolling would leave the page stuck.
  const locked = await open(t, 'https://www.keychron.com/', page(SHOPIFY_HEAD, `${PRODUCT}${POPUP}`).replace('<body>', '<body style="overflow:hidden">'), { init: true });
  assert.equal(await action(locked, 'popup-layer'), null);
  assert.notEqual(await locked.evaluate(() => getComputedStyle(document.getElementById('popup-layer')).display), 'none');
});

// Stores lock scrolling while a pop-up is open. If the lock lands after WARD hid the pop-up, or the theme opens a
// pop-up WARD hid while it was still a template, the page must never be left locked behind an invisible pop-up.
const stuck = (tab) => tab.evaluate(() => {
  const locked = [document.body, document.documentElement].some((node) => /hidden|clip/.test(getComputedStyle(node).overflowY));
  const layer = document.getElementById('popup-layer');
  const unusable = getComputedStyle(layer).display === 'none' || Boolean(layer.closest('[inert]'));
  return locked && unusable;
});

test('a scroll lock that lands after the pop-up was hidden gives the pop-up back', async (t) => {
  const tab = await open(t, 'https://www.keychron.com/', page(`${SHOPIFY_HEAD}<style>html.lock{overflow:hidden}</style>`, `${PRODUCT}`), { init: true });
  await tab.evaluate((html) => document.body.insertAdjacentHTML('beforeend', html), POPUP);
  await tab.waitForFunction(() => document.getElementById('popup-layer').dataset.wardAction === 'hide');
  await tab.evaluate(() => setTimeout(() => document.documentElement.classList.add('lock'), 300));
  await tab.waitForTimeout(700);
  assert.equal(await stuck(tab), false);
  assert.notEqual(await tab.evaluate(() => getComputedStyle(document.getElementById('popup-layer')).display), 'none');
});

test('a pop-up template present at load is not hidden, so the theme can still open it with the page locked', async (t) => {
  const template = POPUP.replace('kl-private-reset-css-Xuajs1"', 'kl-private-reset-css-Xuajs1 popup-template"').replace('display:flex;', '');
  const tab = await open(t, 'https://www.keychron.com/', page(`${SHOPIFY_HEAD}<style>.popup-template{display:none}.popup-template.is-open{display:flex}</style>`, `${PRODUCT}${template}`), { init: true });
  await tab.evaluate(() => setTimeout(() => { document.getElementById('popup-layer').classList.add('is-open'); document.body.style.overflow = 'hidden'; }, 300));
  await tab.waitForTimeout(700);
  assert.equal(await stuck(tab), false);
  assert.notEqual(await tab.evaluate(() => getComputedStyle(document.getElementById('popup-layer')).display), 'none');
});

test('a sign-up pop-up that fades in from transparent is hidden once it is visible', async (t) => {
  const tab = await open(t, 'https://www.keychron.com/', page(SHOPIFY_HEAD, `${PRODUCT}`), { init: true });
  // Klaviyo-style entrance: inserted transparent, then faded in by the theme a moment later.
  await tab.evaluate((html) => { document.body.insertAdjacentHTML('beforeend', html.replace('display:flex;', 'display:flex;opacity:0;transition:opacity .2s;')); setTimeout(() => { document.getElementById('popup-layer').style.opacity = '1'; }, 300); }, POPUP);
  await tab.waitForFunction(() => document.getElementById('popup-layer').dataset.wardAction === 'hide', null, { timeout: 4000 });
  assert.equal(await tab.evaluate(() => getComputedStyle(document.getElementById('popup-layer')).display), 'none');
});

// Captured live 2026-10-14. Allbirds: Attentive draws its sign-up unit in a full-window iframe and locks scrolling with
// inline styles on <html> and <body>, writing them several times. Edikted: Klaviyo's first step has no email field yet,
// and it locks scrolling with a body class.
const ATTENTIVE = '<div id="attentive_overlay" style="position:fixed;left:0;bottom:0;width:100vw;height:0;z-index:2147483647"><iframe id="attentive_creative" title="Sign Up via Text for Offers" referrerpolicy="origin" src="https://creatives.attn.tv/creatives-dynamic/multiPage/index.html" style="width:100%;height:100%;position:fixed;inset:0;border:0"></iframe></div>';
const ATTENTIVE_LOCK = () => { document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; document.body.style.position = 'absolute'; document.body.style.inset = '0px'; };
const KLAVIYO_TEASER = '<div class="needsclick kl-private-reset-css-Xuajs1" role="dialog" aria-modal="true" aria-label="POPUP Form" data-kl-scroll-locking-modal="true" id="teaser" style="display:flex;z-index:90000;position:fixed;left:0;top:0;width:100%;height:100%;justify-content:center;align-items:center;background:rgba(20,20,20,.6)"><div class="needsclick kl-private-reset-css-Xuajs1" style="background:#fff;width:400px;height:300px"><p>UP TO 80% OFF SITEWIDE + EXTRA 10% JUST FOR YOU</p><button type="button">YES, PLEASE!</button><button type="submit" aria-label="Close dialog">×</button></div></div>';
const scrolls = (tab) => tab.evaluate(() => [document.body, document.documentElement].every((node) => !/hidden|clip/.test(getComputedStyle(node).overflowY)));
async function attentive(tab) {
  await tab.route('https://creatives.attn.tv/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Get 15% off by text</p>' }));
  await tab.evaluate(([html, lock]) => { document.body.insertAdjacentHTML('beforeend', html); const write = new Function(`(${lock})()`); setTimeout(write, 100); setTimeout(write, 250); }, [ATTENTIVE, ATTENTIVE_LOCK.toString()]);
  await tab.waitForFunction(() => document.getElementById('attentive_overlay').dataset.wardAction === 'hide', null, { timeout: 4000 });
  await tab.waitForTimeout(600);
}

test('an Attentive sign-up iframe is hidden and the scroll lock Attentive wrote is released, keeping the store\'s own styles', async (t) => {
  const tab = await open(t, 'https://www.allbirds.com/', page(SHOPIFY_HEAD, PRODUCT).replace('<html>', '<html style="--global-banner-height: 32px">'), { init: true });
  await attentive(tab);
  assert.equal(await tab.evaluate(() => getComputedStyle(document.getElementById('attentive_overlay')).display), 'none');
  assert.equal(await scrolls(tab), true, 'the page scrolls again');
  assert.equal(await tab.evaluate(() => document.documentElement.style.getPropertyValue('--global-banner-height').trim()), '32px', 'the store\'s own html styles stay');
});

test('Attentive releases only its measured lock and preserves store inline layout styles', async (t) => {
  const html = page(SHOPIFY_HEAD, PRODUCT).replace('<html>', '<html style="height:100%;position:relative;top:12px;--global-banner-height:32px">').replace('<body>', '<body style="height:100%;--store-color:red">');
  const tab = await open(t, 'https://www.allbirds.com/', html, { init: true });
  await attentive(tab);
  assert.equal(await action(tab, 'attentive_overlay'), 'hide');
  assert.equal(await scrolls(tab), true);
  assert.deepEqual(await tab.evaluate(() => ({ height:document.documentElement.style.height, position:document.documentElement.style.position, top:document.documentElement.style.top, banner:document.documentElement.style.getPropertyValue('--global-banner-height'), bodyHeight:document.body.style.height, color:document.body.style.getPropertyValue('--store-color') })), { height:'100%', position:'relative', top:'12px', banner:'32px', bodyHeight:'100%', color:'red' });
});

test('another inline drawer lock gives Attentive back without removing store styles', async (t) => {
  const tab = await open(t, 'https://www.allbirds.com/', page(SHOPIFY_HEAD, PRODUCT), { init: true });
  await attentive(tab);
  await tab.evaluate(() => { document.body.style.overflow = 'hidden'; document.body.style.position = 'relative'; document.body.style.top = '12px'; });
  await tab.waitForTimeout(500);
  assert.equal(await action(tab, 'attentive_overlay'), null);
  assert.equal(await scrolls(tab), false);
  assert.deepEqual(await tab.evaluate(() => [document.body.style.position, document.body.style.top]), ['relative', '12px']);
});

test('switching Hide to Dim through settings rebuild restores the visible provider modal lock', async (t) => {
  const tab = await open(t, 'https://www.allbirds.com/', page(SHOPIFY_HEAD, PRODUCT), { init: true, instrument:true });
  await attentive(tab);
  assert.equal(await scrolls(tab), true);
  await tab.evaluate(() => { __ward.Settings.update({ contentAction:'dim' }); __ward.Engine.rebuild(); });
  await tab.waitForTimeout(500);
  assert.equal(await action(tab, 'attentive_overlay'), 'dim');
  assert.notEqual(await tab.evaluate(() => getComputedStyle(document.getElementById('attentive_overlay')).display), 'none');
  assert.equal(await scrolls(tab), false);
});

for (const [property, temporary, visible] of [['opacity', '0', '1'], ['visibility', 'hidden', 'visible']]) test(`temporary provider ${property} while hidden preserves the lock for Dim`, async (t) => {
  const tab = await open(t, 'https://www.allbirds.com/', page(SHOPIFY_HEAD, PRODUCT), { init:true, instrument:true });
  await attentive(tab);
  assert.equal(await scrolls(tab), true);
  await tab.evaluate(([property, value]) => { document.getElementById('attentive_creative').style[property] = value; }, [property, temporary]);
  await tab.waitForTimeout(500);
  await tab.evaluate(([property, value]) => { document.getElementById('attentive_creative').style[property] = value; }, [property, visible]);
  await tab.waitForTimeout(500);
  await tab.evaluate(() => { __ward.Settings.update({ contentAction:'dim' }); __ward.Engine.rebuild(); });
  await tab.waitForTimeout(500);
  assert.equal(await action(tab, 'attentive_overlay'), 'dim');
  assert.notEqual(await tab.evaluate(() => getComputedStyle(document.getElementById('attentive_overlay')).display), 'none');
  assert.equal(await scrolls(tab), false);
});

test('cleanup restores the lock of a temporarily transparent Attentive modal', async (t) => {
  const tab = await open(t, 'https://www.allbirds.com/', page(SHOPIFY_HEAD, PRODUCT), { init:true, instrument:true });
  await attentive(tab);
  assert.equal(await scrolls(tab), true);
  await tab.evaluate(() => { document.getElementById('attentive_creative').style.opacity = '0'; });
  await tab.waitForTimeout(100);
  await tab.evaluate(() => __ward.Engine.cleanup());
  assert.equal(await scrolls(tab), false);
  assert.deepEqual(await tab.evaluate(() => [document.body.style.overflow, document.body.style.position, document.body.style.inset]), ['hidden', 'absolute', '0px']);
});

for (const [property, invisible, visible] of [['opacity', '0', '1'], ['visibility', 'hidden', 'visible']]) test(`pause restores Attentive's lock during temporary ${property} and resume releases it again`, async (t) => {
  const tab = await open(t, 'https://www.allbirds.com/', page(SHOPIFY_HEAD, PRODUCT), { init:true, instrument:true });
  await attentive(tab);
  await tab.evaluate(([property, value]) => { document.getElementById('attentive_creative').style[property] = value; }, [property, invisible]);
  await tab.waitForTimeout(100);
  await tab.evaluate(() => __ward.App.lifecycle.disable());
  assert.equal(await tab.evaluate(() => __ward.App.lifecycle.state), 'disabled');
  assert.deepEqual(await tab.evaluate(() => [document.documentElement.style.overflow, document.body.style.overflow, document.body.style.position, document.body.style.inset]), ['hidden', 'hidden', 'absolute', '0px']);
  assert.equal(await action(tab, 'attentive_overlay'), null);
  await tab.evaluate(([property, value]) => { document.getElementById('attentive_creative').style[property] = value; }, [property, visible]);
  await tab.evaluate(() => __ward.App.lifecycle.enable());
  await tab.waitForFunction(() => document.getElementById('attentive_overlay').dataset.wardAction === 'hide' && document.body.style.overflow === '');
  assert.equal(await scrolls(tab), true);
});

for (const closed of ['removed', 'hidden']) test(`a provider ${closed} while hidden leaves no lock to restore or clean up`, async (t) => {
  const tab = await open(t, 'https://www.allbirds.com/', page(SHOPIFY_HEAD, PRODUCT), { init:true, instrument:true });
  await attentive(tab);
  await tab.evaluate((closed) => { const frame = document.getElementById('attentive_creative'); if (closed === 'removed') frame.remove(); else frame.style.display = 'none'; }, closed);
  await tab.waitForTimeout(100);
  await tab.evaluate(() => __ward.Actions.restoreAll());
  await tab.waitForTimeout(100);
  assert.equal(await scrolls(tab), true, 'restoring an empty or closed outer container must not lock the store');
  await tab.evaluate(() => __ward.Engine.cleanup());
  assert.equal(await scrolls(tab), true, 'cleanup must not revive a dismissed provider lock');
});

test('Klaviyo clearing its modal marker before cleanup does not restore an obsolete body lock', async (t) => {
  const tab = await open(t, 'https://edikted.com/', page(`${SHOPIFY_HEAD}<style>.klaviyo-prevent-body-scrolling{overflow:hidden}</style>`, PRODUCT), { init:true, instrument:true });
  await tab.evaluate((html) => { document.body.insertAdjacentHTML('beforeend', html); document.body.classList.add('klaviyo-prevent-body-scrolling'); }, KLAVIYO_TEASER);
  await tab.waitForFunction(() => document.getElementById('teaser').dataset.wardAction === 'hide' && !document.body.classList.contains('klaviyo-prevent-body-scrolling'));
  await tab.evaluate(() => { document.getElementById('teaser').setAttribute('data-kl-scroll-locking-modal', 'false'); __ward.Engine.cleanup(); });
  assert.equal(await scrolls(tab), true);
  assert.equal(await tab.evaluate(() => document.body.classList.contains('klaviyo-prevent-body-scrolling')), false);
});

test('an Attentive frame that fades in is hidden once it is visible', async (t) => {
  const tab = await open(t, 'https://www.allbirds.com/', page(SHOPIFY_HEAD, PRODUCT), { init: true });
  await tab.route('https://creatives.attn.tv/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Get 15% off by text</p>' }));
  await tab.evaluate(([html, lock]) => {
    document.body.insertAdjacentHTML('beforeend', html.replace('border:0', 'border:0;opacity:0;visibility:hidden;transition:opacity 500ms'));
    setTimeout(() => { const frame = document.getElementById('attentive_creative'); frame.style.visibility = 'visible'; frame.style.opacity = '1'; new Function(`(${lock})()`)(); }, 300);
  }, [ATTENTIVE, ATTENTIVE_LOCK.toString()]);
  await tab.waitForFunction(() => document.getElementById('attentive_overlay').dataset.wardAction === 'hide', null, { timeout: 5000 });
  await tab.waitForTimeout(500);
  assert.equal(await scrolls(tab), true);
});

test('if WARD gives an Attentive pop-up back, Attentive\'s scroll lock comes back with it', async (t) => {
  const tab = await open(t, 'https://www.allbirds.com/', page(`${SHOPIFY_HEAD}<style>html.lock{overflow:hidden}</style>`, PRODUCT), { init: true });
  await attentive(tab);
  // Another lock WARD cannot trace (a consent banner) lands: the pop-up is given back, exactly as the store showed it.
  await tab.evaluate(() => document.documentElement.classList.add('lock'));
  await tab.waitForTimeout(500);
  assert.notEqual(await tab.evaluate(() => getComputedStyle(document.getElementById('attentive_overlay')).display), 'none');
  assert.equal(await tab.evaluate(() => document.body.style.overflow), 'hidden', 'Attentive\'s own lock is back');
});

test('a provider that keeps re-locking the page gets its pop-up back instead of a fight', async (t) => {
  const tab = await open(t, 'https://www.allbirds.com/', page(SHOPIFY_HEAD, PRODUCT), { init: true });
  await attentive(tab);
  await tab.evaluate((lock) => { const write = new Function(`(${lock})()`); setInterval(write, 50); }, ATTENTIVE_LOCK.toString());
  await tab.waitForTimeout(1500);
  const state = await tab.evaluate(() => ({ shown: getComputedStyle(document.getElementById('attentive_overlay')).display !== 'none', locked: [document.body, document.documentElement].some((node) => /hidden|clip/.test(getComputedStyle(node).overflowY)) }));
  assert.deepEqual(state, { shown: true, locked: true }, 'never a locked page behind a hidden pop-up');
});

test('Klaviyo\'s first step, with no email field yet, is hidden and its body-class scroll lock released', async (t) => {
  const tab = await open(t, 'https://edikted.com/', page(`${SHOPIFY_HEAD}<style>.klaviyo-prevent-body-scrolling{overflow:hidden}</style>`, PRODUCT), { init: true });
  await tab.evaluate((html) => { document.body.insertAdjacentHTML('beforeend', html); setTimeout(() => document.body.classList.add('klaviyo-prevent-body-scrolling'), 100); }, KLAVIYO_TEASER);
  await tab.waitForFunction(() => document.getElementById('teaser').dataset.wardAction === 'hide', null, { timeout: 4000 });
  await tab.waitForTimeout(500);
  assert.equal(await scrolls(tab), true);
  assert.equal(await tab.evaluate(() => document.body.classList.contains('klaviyo-prevent-body-scrolling')), false);
});

test('a fixed mobile menu drawer holding a newsletter block is left alone, open or closed', async (t) => {
  const links = ['Keyboards', 'Mice', 'Keycaps', 'Switches', 'Accessories', 'Support'].map((label) => `<li><a href="/collections/${label.toLowerCase()}">${label}</a></li>`).join('');
  const drawer = (id, transform) => `<div id="${id}" class="menu-drawer" style="position:fixed;left:0;top:0;width:320px;height:100vh;background:#fff;transform:${transform}"><nav><ul>${links}</ul></nav><div class="drawer-newsletter"><p>Join our newsletter</p><input type="email" placeholder="Email"><button>Subscribe</button></div></div>`;
  const tab = await open(t, 'https://www.keychron.com/', page(SHOPIFY_HEAD, `${PRODUCT}${drawer('drawer-open', 'none')}${drawer('drawer-closed', 'translateX(-100%)')}`), { init: true });
  assert.deepEqual(await tab.evaluate(() => ['drawer-open', 'drawer-closed'].map((id) => document.getElementById(id).dataset.wardAction || null)), [null, null]);
});

test('Shopify checkout pages are never touched', async (t) => {
  const tab = await open(t, 'https://www.keychron.com/checkouts/cn/abc123', page(SHOPIFY_HEAD, `${ANNOUNCEMENT}${PRODUCT}${POPUP}`), { init: true });
  assert.deepEqual(await owned(tab), { root: false, marker: false, ownedNodes: 0, actions: 0 });
});

test('the store tab is named Shopify store, lists the new patterns, and its switch turns protection off', async (t) => {
  const tab = await open(t, 'https://www.keychron.com/products/q1', page(SHOPIFY_HEAD, `${ANNOUNCEMENT}${PRODUCT}`), { init: true });
  const host = tab.locator('#exp-ward-root');
  await host.locator('.ward-launcher').click();
  const storeTab = host.locator('[data-exp-section-tab="exp-ward-view-tools"]');
  assert.equal((await storeTab.textContent()).trim(), 'Shopify store');
  await storeTab.evaluate((node) => node.click());
  const storeSwitch = host.locator('button[role="switch"][aria-label="Protect Shopify store"]').first();
  assert.equal(await storeSwitch.getAttribute('aria-checked'), 'true');
  await host.locator('.exp-submenu-row:visible').filter({ hasText: /^Patterns/ }).first().evaluate((node) => node.click());
  await host.locator('button:visible').filter({ hasText: /^Customize$/ }).first().evaluate((node) => node.click());
  assert.deepEqual(await host.locator('.row-copy strong:visible').allTextContents(), ['Individual patterns', 'Email sign-up pop-ups', 'Announcement bars', 'Urgency messages', 'Scarcity messages', 'Cross-sell recommendations', 'Popularity claims']);
  const off = await open(t, 'https://www.keychron.com/products/q1', page(SHOPIFY_HEAD, `${ANNOUNCEMENT}${PRODUCT}`), { init: true, settings: { retailers: { shopify: false } } });
  assert.equal(await action(off, 'shopify-section-sections--22739711426649__announcement'), null);
});
