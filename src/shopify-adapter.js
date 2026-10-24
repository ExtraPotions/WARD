// Shopify storefronts share no domain and no class names, so this adapter recognises the platform from the markers
// Shopify writes into every storefront, and finds placements by theme section ids, structure and wording.
EXP.ShopifyAdapter = (() => {
  const STOREFRONT = '#shopify-features,meta[name="shopify-digital-wallet"],meta[name="shopify-checkout-api-token"]';
  const CHECKOUT = /\/checkouts?\//;
  const ALL_PAGES = ['home', 'search', 'product', 'cart', 'other'];
  // Text detectors only accept short nodes, so a wrapper that happens to hold the words is never dimmed whole.
  const short = (words) => new RegExp(`^(?=[\\s\\S]{1,160}$)[\\s\\S]*?(?:${words})`, 'i');
  const PROMOTION = /sign ?up|subscribe|newsletter|join|\d+ ?% off|discount|unlock|exclusive|be the first|first order|vip|rewards/i;
  const NOT_PROMOTION = /back in stock|notify me|restock|wait ?list|sign ?in|log ?in|password|track (?:your )?order|shipping address|payment/i;
  const PURCHASE = /add to cart|buy now|checkout|place order/i;
  let storefront = null;
  function isStorefront() {
    if (storefront !== null) return storefront;
    const found = Boolean(document.querySelector(STOREFRONT));
    if (document.readyState !== 'loading') storefront = found;
    return found;
  }
  const base = EXP.createRetailerModule({
    key:'shopify', label:'Shopify store', hosts:[],
    eligible: () => !CHECKOUT.test(location.pathname) && isStorefront(),
    routes:[[CHECKOUT,'checkout'],[/^\/cart(?:\/|$)/,'cart'],[/\/products\//,'product'],[/^\/(?:collections|search)(?:\/|$)/,'search']],
    detectors:[
      { id:'urgency', patternId:'pressure.urgency', pages:ALL_PAGES, selectors:['countdown-timer','[class*="countdown" i]','[class*="timer" i]'], text:short('ends? (?:today|soon|in)|limited time|hurry|offer ends|sale ends') },
      { id:'scarcity', patternId:'pressure.scarcity', pages:['product','search','cart'], selectors:['[class*="inventory" i]','[class*="stock" i]'], text:short('only \\d+ left|low stock|almost gone|selling fast') },
      { id:'social-proof', patternId:'pressure.social-proof', pages:ALL_PAGES, selectors:['[class*="sales-pop" i]','[class*="social-proof" i]','[class*="recent-sale" i]','[class*="viewers" i]'], text:short('\\d+ (?:people|others|customers|shoppers)|bought|viewing|in (?:their )?carts?') },
      { id:'recommendations', patternId:'cross-sell.recommendation', pages:['product','cart'], selectors:['product-recommendations','.product-recommendations','complementary-products','.frequently-bought-section','[class*="frequently-bought" i]'], complete:true }
    ]
  });
  const verified = new WeakSet();
  let epoch = 0;
  function query(root, selector) { try { return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) || [])]; } catch { return []; } }
  const purchaseControls = (node) => Boolean(node.querySelector('form[action*="/cart"],form[action*="/checkout"],form[action*="/account"]') || [...node.querySelectorAll('a,button,input[type="submit"]')].some((control) => PURCHASE.test(control.textContent || control.value || control.getAttribute('aria-label') || '')));
  function evidence(node, id, patternId) {
    verified.add(node);
    const detectorId = `shopify.${id}`;
    EXP.Audit?.detected?.(node, { detectorId, patternId, confidence:'confirmed', structuralSafe:true, structuralReason:'verified-placement' });
    return Object.freeze({ detectorId, evidenceId:detectorId, patternId, pageType:base.classify(), node, signals:['shopify-structure'], exclusions:[], essentialOverlap:false, structuralSafe:true, structuralReason:'verified-placement', confidence:'confirmed', epoch });
  }
  // A theme's announcement section, or its announcement-bar element when the section id says nothing.
  function announcementBars(roots) {
    const found = new Set();
    for (const root of roots) {
      for (const node of query(root, '[id^="shopify-section-"][id*="announcement"]')) found.add(node);
      for (const node of query(root, 'announcement-bar,.announcement-bar')) if (!node.closest('[id^="shopify-section-"][id*="announcement"]') && !node.parentElement?.closest('announcement-bar,.announcement-bar')) found.add(node);
      for (const node of [root.closest?.('[id^="shopify-section-"][id*="announcement"]')]) if (node) found.add(node);
    }
    return [...found].filter((node) => node.isConnected && !node.querySelector('input,select,textarea') && !purchaseControls(node));
  }
  // The outermost fixed layer around an email or phone field, so the backdrop goes with the form.
  function fixedLayer(field) {
    let layer = null;
    for (let node = field.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) if (getComputedStyle(node).position === 'fixed') layer = node;
    return layer;
  }
  // A pop-up hidden while the page is scroll-locked would leave the page stuck, unless the lock is a known provider's.
  const scrollLocked = () => [document.body, document.documentElement].some((node) => node && /hidden|clip/.test(getComputedStyle(node).overflowY));
  // Only a layer the visitor can see now: a template the theme opens later, or a drawer parked off screen, stays the theme's.
  function onScreen(layer) {
    const style = getComputedStyle(layer);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    const box = layer.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.right > 0 && box.bottom > 0 && box.left < innerWidth && box.top < innerHeight;
  }
  // Pop-ups often enter transparent and fade in, which changes no element WARD watches. A transparent layer that is
  // already in place is looked at again a few times; one that never becomes visible is left alone.
  const FADE_RECHECKS = [400, 1200, 3000];
  const fadeChecks = new WeakMap();
  function recheckFade(layer) {
    const style = getComputedStyle(layer);
    if (style.display === 'none' || !(Number(style.opacity) === 0 || style.visibility === 'hidden')) return;
    const attempt = fadeChecks.get(layer) || 0;
    if (attempt >= FADE_RECHECKS.length) return;
    fadeChecks.set(layer, attempt + 1);
    const at = epoch;
    setTimeout(() => { if (at === epoch && layer.isConnected) EXP.Engine.processBatch([layer]); }, FADE_RECHECKS[attempt]);
  }
  // A menu drawer can carry a newsletter block; site navigation is never a sign-up pop-up.
  const navigation = (layer) => Boolean(layer.querySelector('nav,[role="navigation"],[role="menu"]')) || layer.querySelectorAll('a[href]').length > 3;
  // Sign-up providers that lock scrolling themselves when they open, and exactly what each writes (both captured live,
  // October 2026). While WARD hides one of their pop-ups it takes back only that lock, and puts it back when the pop-up
  // is shown again. Any other lock still hands the pop-up back.
  const PROVIDERS = [
    // Attentive draws its unit in a full-window iframe WARD cannot read, and writes the lock inline on <html> and <body>.
    { id:'attentive', marker:'iframe#attentive_creative,iframe[src*=".attn.tv/"]', frame:true, styles:true },
    // Klaviyo marks its modal pop-ups and locks with a body class; its first step often has no email field yet.
    { id:'klaviyo', marker:'[data-kl-scroll-locking-modal="true"]', lockClass:'klaviyo-prevent-body-scrolling' }
  ];
  const providerOf = (layer) => PROVIDERS.find((provider) => layer.matches(provider.marker) || layer.querySelector(provider.marker));
  // null means temporarily invisible: retain the saved lock without releasing or restoring it.
  function providerActive(layer, provider) {
    let transparent = false;
    const active = layer.isConnected && query(layer, provider.marker).some((marker) => {
      let fading = false;
      for (let node = marker; node; node = node.parentElement) {
        const style = getComputedStyle(node), wardHidden = node === layer && node.dataset.wardAction === 'hide';
        if (!wardHidden && (node.hidden || node.getAttribute('aria-hidden') === 'true' || style.display === 'none')) return false;
        if (wardHidden && node.style.display === 'none' && node.style.getPropertyPriority('display') !== 'important') return false;
        if (style.visibility === 'hidden' || Number(style.opacity) === 0) fading = true;
        if (node === layer) break;
      }
      if (fading) { transparent = true; return false; }
      return true;
    });
    return active ? true : transparent ? null : false;
  }
  const outermostFixed = (node) => fixedLayer(node) || (getComputedStyle(node).position === 'fixed' ? node : null);
  // Many stores lock scrolling after the pop-up appears. Once that happens, the hidden pop-up is handed back for good.
  const hiddenLayers = new Set();
  const returned = new WeakSet();
  const released = new Map();
  const MAX_RELEASES = 5;
  let lockWatch = null;
  const pageNodes = () => [document.documentElement, document.body].filter(Boolean);
  const providerLocked = (provider) => provider.lockClass ? document.body.classList.contains(provider.lockClass) : pageNodes().some((node) => /hidden|clip/.test(`${node.style.overflow} ${node.style.overflowY}`));
  function release(layer, provider) {
    const record = released.get(layer) || { provider, count:0, saved:new Map(), removedClass:false };
    released.set(layer, record);
    if (!providerLocked(provider)) return true;
    if (provider.styles && !(document.documentElement.style.overflow === 'hidden' && document.body.style.overflow === 'hidden' && document.body.style.position === 'absolute' && document.body.style.inset === '0px')) return false;
    if (++record.count > MAX_RELEASES) return false;
    if (provider.lockClass) { document.body.classList.remove(provider.lockClass); record.removedClass = true; }
    if (provider.styles) for (const node of pageNodes()) {
      const saved = record.saved.get(node) || new Map();
      record.saved.set(node, saved);
      for (const name of node === document.body ? ['overflow', 'position', 'inset'] : ['overflow']) {
        const value = node.style.getPropertyValue(name);
        if (!value) continue;
        if (!saved.has(name)) saved.set(name, [value, node.style.getPropertyPriority(name)]);
        node.style.removeProperty(name);
      }
    }
    return true;
  }
  function relock(layer, stopping = false) {
    const record = released.get(layer);
    const active = record && providerActive(layer, record.provider);
    if (active === null && !stopping) return;
    released.delete(layer);
    if (!record || active === false) return;
    if (record.removedClass) document.body.classList.add(record.provider.lockClass);
    for (const [node, saved] of record.saved) for (const [name, [value, priority]] of saved) {
      if (node.style.getPropertyValue(name) || (name === 'inset' && ['top', 'right', 'bottom', 'left'].some((side) => node.style.getPropertyValue(side))) || (name === 'overflow' && (node.style.overflowX || node.style.overflowY))) continue;
      node.style.setProperty(name, value, priority);
    }
  }
  function giveBackAll() {
    for (const layer of hiddenLayers) { returned.add(layer); EXP.Actions.restoreNode(layer); }
    stopLockWatch();
  }
  // Runs on every class or style change of <html>, <body> and the hidden pop-ups.
  function reconcile() {
    for (const layer of hiddenLayers) {
      const provider = providerOf(layer);
      const active = provider ? providerActive(layer, provider) : false;
      if (active === false) { released.delete(layer); continue; }
      if (active === null) continue;
      if (layer.dataset.wardAction !== 'hide') { relock(layer); continue; }
      if (layer.dataset.wardAction === 'hide' && !release(layer, provider)) return giveBackAll();
    }
    if (scrollLocked() && [...hiddenLayers].some((layer) => layer.dataset.wardAction === 'hide')) giveBackAll();
  }
  function watchLock(layer) {
    hiddenLayers.add(layer);
    if (!lockWatch) {
      lockWatch = new MutationObserver(reconcile);
      for (const node of pageNodes()) lockWatch.observe(node, { attributes:true, attributeFilter:['style', 'class'] });
    }
    if (providerOf(layer)) lockWatch.observe(layer, { childList:true, subtree:true, attributes:true, attributeFilter:['data-ward-action', 'data-kl-scroll-locking-modal', 'style', 'class', 'hidden', 'aria-hidden', 'id', 'src'] });
  }
  function stopLockWatch() {
    lockWatch?.disconnect(); lockWatch = null;
    for (const layer of [...released.keys()]) relock(layer, true);
    hiddenLayers.clear();
  }
  function signupPopups(roots) {
    const found = new Set(), locked = scrollLocked();
    const eligible = (layer) => layer && !found.has(layer) && !returned.has(layer) && !layer.closest('[data-exp-owned="1"]') && !navigation(layer) && !layer.querySelector('input[type="password"]') && !purchaseControls(layer);
    const promotional = (layer) => { const text = (layer.textContent || '').replace(/\s+/g, ' '); return PROMOTION.test(text) && !NOT_PROMOTION.test(text); };
    for (const root of roots) {
      for (const field of query(root, 'input[type="email"],input[type="tel"],input[name*="email" i]')) {
        const layer = fixedLayer(field);
        if (!eligible(layer) || (locked && !providerOf(layer))) continue;
        if (!onScreen(layer)) { recheckFade(layer); continue; }
        if (promotional(layer)) found.add(layer);
      }
      for (const provider of PROVIDERS) for (const marker of query(root, provider.marker)) {
        const layer = outermostFixed(marker), shown = provider.frame ? marker : layer;
        // An iframe's words cannot be read; Attentive's frame is itself the evidence, and it must be on screen.
        if (!eligible(layer)) continue;
        // Our hidden ancestor gives the iframe an empty rectangle. Keep its detection until
        // the provider actually closes; otherwise the next scan restores it and its scroll lock.
        const managedHidden = hiddenLayers.has(layer) && layer.dataset.wardAction === 'hide' && providerActive(layer, provider) !== false;
        if (!onScreen(shown) && !managedHidden) { recheckFade(shown); continue; }
        if (provider.frame || promotional(layer)) found.add(layer);
      }
    }
    return [...found];
  }
  function detect(roots = [document]) {
    const found = base.detect(roots);
    if (!base.eligible() || base.classify() === 'checkout') return found;
    const seen = new Set(found.map((item) => item.node));
    for (const node of announcementBars(roots)) if (!seen.has(node)) { seen.add(node); found.push(evidence(node, 'announcement-bar', 'promotion.announcement-bar')); }
    for (const node of signupPopups(roots)) if (!seen.has(node)) { seen.add(node); watchLock(node); found.push(evidence(node, 'signup-popup', 'pressure.signup-popup')); }
    return found;
  }
  return Object.freeze({ ...base,
    patternIds:Object.freeze([...base.patternIds, 'pressure.signup-popup', 'promotion.announcement-bar']),
    detect,
    structuralSafety:(node) => verified.has(node) && node.isConnected ? { safe:true, reason:'verified-placement' } : base.structuralSafety(node),
    nextEpoch() { epoch++; return base.nextEpoch(); },
    cleanup() { epoch++; storefront = null; stopLockWatch(); base.cleanup(); },
    patterns:() => [...base.patterns(), { id:'shopify.signup-popup', patternId:'pressure.signup-popup', complete:true, pages:ALL_PAGES.slice() }, { id:'shopify.announcement-bar', patternId:'promotion.announcement-bar', complete:true, pages:ALL_PAGES.slice() }]
  });
})();
EXP.Retailers.register(EXP.ShopifyAdapter);
