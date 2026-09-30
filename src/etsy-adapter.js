// Etsy tags many page sections with data-appears-component-name, which is the most
// stable hook it offers. Search cards are v2-listing-card units; an ad is a card
// whose caption reads "Ad by Etsy seller" or "Ad・By <shop>".
EXP.EtsyAdapter = (() => {
  const ID = 'ward.retailer.etsy';
  const VERSION = '1';
  const errors = [];
  let health = 'inactive';
  let epoch = 0;
  let lastScan = null;
  const supportedHosts = new Set(['www.etsy.com', 'etsy.com']);
  const component = (name) => `[data-appears-component-name="${name}"]`;
  const urgencySignal = component('Etsy-Modules-ListingPage-UrgencySignal-RecsRankingApiSpec');
  const financing = component('klarna_osm_messaging');
  const listingCard = '.v2-listing-card';
  const gridCell = 'li.wt-block-grid__item, li.wt-list-unstyled';
  const strikethrough = '.wt-text-strikethrough';
  const essentialSelector = [component('add_to_cart_form'), component('express_checkout_button'), component('variations'), component('price'), 'form[action*="cart" i]', '[data-add-to-cart-button]', '[data-buy-box-region]', 'button[type="submit"]'].join(',');
  const protectedRootSelector = 'main, [role~="main"], #content, #gnav-header-inner, ul.wt-grid, ol.wt-grid';
  const purchaseWording = /add to cart|buy it now|check ?out|proceed to|place order|continue/i;
  const adCaption = /^ad(?: by etsy seller|\s?・\s?by\b.*|\s?from shop\b.*)$/i;
  const detectors = Object.freeze([
    { id: 'etsy.sponsored.listing', patternId: 'sponsorship.placement', pages: ['search'], selectors: [listingCard], adCard: true },
    { id: 'etsy.reference-price.card', patternId: 'pricing.reference-price', pages: ['search'], selectors: [`${listingCard} ${strikethrough}`] },
    { id: 'etsy.reference-price.item', patternId: 'pricing.reference-price', pages: ['product'], selectors: [`${component('price')} ${strikethrough}`] },
    { id: 'etsy.social-proof.item', patternId: 'pressure.social-proof', pages: ['product'], selectors: [urgencySignal], text: /\bcarts?\b|\bpeople\b|\bviewing\b|\bbought\b|\bpopular now\b|\bbestseller\b/i },
    { id: 'etsy.scarcity.item', patternId: 'pressure.scarcity', pages: ['product'], selectors: [urgencySignal], text: /\bonly \d+ left\b|\blow in stock\b|\balmost gone\b|\bselling fast\b/i },
    { id: 'etsy.financial.klarna', patternId: 'upsell.financial-product', pages: ['product', 'cart'], selectors: [financing] }
  ]);

  function classify(pathname = location.pathname) {
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?listing\//.test(pathname)) return 'product';
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:search|c|market|featured)(?:\/|$)/.test(pathname)) return 'search';
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?cart(?:\/|$)/.test(pathname)) return 'cart';
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:checkout|cart\/checkout)(?:\/|$)/.test(pathname)) return 'checkout';
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?your\/(?:purchases|orders)/.test(pathname)) return 'orders';
    if (pathname === '/' || pathname === '') return 'home';
    return 'other';
  }

  function eligible() { return supportedHosts.has(location.hostname); }
  function record(error, code) { errors.push({ code, at: Date.now() }); if (errors.length > 8) errors.shift(); health = 'degraded'; EXP.Core.safeError(Object.assign(error || new Error(code), { code }), ID); }
  function safeQueryAll(root, selector) { try { return [...root.querySelectorAll(selector)]; } catch (error) { record(error, 'DETECTOR_SELECTOR'); return []; } }
  function isProtectedPageRoot(node) {
    return !node || node === document.documentElement || node === document.head || node === document.body ||
      Boolean(node.matches?.(protectedRootSelector)) || Boolean(node.querySelector?.(`${protectedRootSelector}, [data-exp-owned="1"]`));
  }
  function hasPurchaseControl(node) { return [...(node.querySelectorAll?.('button, a, input[type="submit"]') || [])].some((control) => purchaseWording.test(control.textContent || control.value || control.getAttribute('aria-label') || '')); }
  function essentialOverlap(node) { return hasPurchaseControl(node) || Boolean(node.matches?.(essentialSelector) || node.closest?.(essentialSelector) || safeQueryAll(node, essentialSelector).length); }
  function structuralSafety(node) {
    if (!node?.isConnected) return { safe: false, reason: 'detached' };
    if (isProtectedPageRoot(node) || node.closest?.('[data-exp-owned="1"]')) return { safe: false, reason: 'protected-root' };
    if (essentialOverlap(node)) return { safe: false, reason: 'essential-overlap' };
    if (node.matches?.(`${urgencySignal}, ${financing}`)) return { safe: true, reason: 'known-static' };
    if (node.matches?.(gridCell) || node.matches?.(listingCard)) return { safe: true, reason: 'complete-sponsored-placement' };
    if (node.matches?.(strikethrough)) return { safe: true, reason: 'price-text' };
    return { safe: false, reason: 'unverified-container' };
  }

  function carriesAdCaption(card) {
    return [...card.querySelectorAll('span, p')].some((label) => !label.childElementCount && adCaption.test((label.textContent || '').trim()));
  }

  function detect(roots = [document]) {
    if (!eligible()) { health = 'inactive'; lastScan = null; return []; }
    const pageType = classify();
    const found = new Map();
    const eligibleDetectors = detectors.filter((detector) => detector.pages.includes(pageType));
    const matchedDetectors = new Set();
    let matchedTargets = 0;
    health = 'healthy';
    for (const detector of eligibleDetectors) {
      try {
        for (const root of roots) for (const selector of detector.selectors) for (const match of [...(root.matches?.(selector) ? [root] : []), ...safeQueryAll(root, selector)]) {
          if (detector.adCard && !carriesAdCaption(match)) continue;
          // Hide the whole grid cell so no empty gap is left, but only when it holds just this card.
          const cell = detector.adCard ? match.closest(gridCell) : null;
          const node = cell && cell.querySelectorAll(listingCard).length === 1 ? cell : match;
          if (!node.isConnected || isProtectedPageRoot(node) || node.closest('[data-exp-owned="1"]')) continue;
          if (detector.text && !detector.text.test((node.textContent || '').trim())) continue;
          matchedDetectors.add(detector.id);
          matchedTargets += 1;
          const essential = essentialOverlap(node);
          const structural = structuralSafety(node);
          const confidence = essential ? 'ambiguous' : 'confirmed';
          EXP.Audit?.detected?.(node, { detectorId: detector.id, patternId: detector.patternId, confidence, structuralSafe: structural.safe, structuralReason: structural.reason });
          if (!found.has(node)) found.set(node, Object.freeze({ evidenceId: `${detector.id}:${selector}`, detectorId: detector.id, patternId: detector.patternId, pageType, node, signals: ['adapter-selector'], exclusions: essential ? ['essential-overlap'] : [], essentialOverlap: essential, structuralSafe: structural.safe, structuralReason: structural.reason, confidence, epoch }));
        }
      } catch (error) { record(error, 'DETECTOR_FAILURE'); }
    }
    lastScan = { pageType, eligibleDetectors: eligibleDetectors.map(({ id }) => id), matchedDetectors: [...matchedDetectors], matchedTargets };
    return [...found.values()];
  }

  function diagnose() { return { id: ID, version: VERSION, health, eligible: eligible(), pageType: eligible() ? classify() : 'unsupported', detectorCount: detectors.length, coverage: lastScan, errors: errors.slice() }; }
  function nextEpoch() { epoch += 1; health = eligible() ? 'healthy' : 'inactive'; lastScan = null; return epoch; }
  function cleanup() { epoch += 1; health = 'inactive'; lastScan = null; errors.length = 0; }
  const patternIds = Object.freeze([...new Set(detectors.map((detector) => detector.patternId))]);
  return Object.freeze({ key: 'etsy', label: 'Etsy', features: Object.freeze({ coupons: false, compactSearch: false, recommendationCleanup: false }), patternIds, ID, VERSION, classify, eligible, detect, structuralSafety, diagnose, nextEpoch, cleanup });
})();
EXP.Retailers.register(EXP.EtsyAdapter);
