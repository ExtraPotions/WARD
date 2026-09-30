// Walmart's class names are hashed and change often, so this adapter leans on the
// stable data-testid hooks the pages expose. Its badges share one testid and are
// told apart by their wording, which is why detectors here may carry a text test.
EXP.WalmartAdapter = (() => {
  const ID = 'ward.retailer.walmart';
  const VERSION = '1';
  const errors = [];
  let health = 'inactive';
  let epoch = 0;
  let lastScan = null;
  const supportedHosts = new Set(['www.walmart.com', 'walmart.com']);
  const badge = '[data-testid="badgeTagComponent"]';
  const essentialSelector = ['[data-testid*="add-to-cart" i]', '[data-testid="ugpp-main-price"]', '[data-testid="product-title"]', '[data-testid*="checkout" i]', '[data-testid*="fulfillment" i]', 'form[action*="cart" i]', 'button[type="submit"]'].join(',');
  const knownStaticSelector = '[data-testid="item-addon-services-new"], [data-testid="oneDebitCardBannerLink"], [data-testid="save-with-walmart-plus-badge"], [data-testid="wplus-opt-out-banner"], [data-testid="more-ways-to-pay-component-wrapper"]';
  const protectedRootSelector = '[data-testid="maincontent"], [data-testid="main-content-container"], [data-testid="layout-container"], [data-testid="item-stack"], main, [role~="main"]';
  const detectors = Object.freeze([
    { id: 'walmart.social-proof.badge', patternId: 'pressure.social-proof', pages: ['search', 'product', 'home', 'cart'], selectors: [badge], text: /\bbought since\b|\bin [\d.,]+k?\+? people'?s carts?\b|\bpeople (?:are )?(?:viewing|looking)\b|\b[\d.,]+k?\+? (?:viewed|bought)\b/i },
    { id: 'walmart.scarcity.badge', patternId: 'pressure.scarcity', pages: ['search', 'product', 'cart'], selectors: [badge], text: /\blow stock\b|\bonly \d+ left\b|\balmost gone\b/i },
    { id: 'walmart.urgency.badge', patternId: 'pressure.urgency', pages: ['search', 'product'], selectors: [badge], text: /^(?:deal|flash deal|ends (?:in|soon).*)$/i },
    { id: 'walmart.membership.badge', patternId: 'upsell.store-membership', pages: ['search', 'product', 'cart', 'home'], selectors: [badge], text: /^save with$|walmart\s?\+/i },
    { id: 'walmart.membership.cart-badge', patternId: 'upsell.store-membership', pages: ['cart', 'search', 'product'], selectors: ['[data-testid="save-with-walmart-plus-badge"]'] },
    { id: 'walmart.membership.checkout-banner', patternId: 'upsell.store-membership', pages: ['checkout'], selectors: ['[data-testid="wplus-opt-out-banner"]'] },
    { id: 'walmart.financial.more-ways-to-pay', patternId: 'upsell.financial-product', pages: ['checkout'], selectors: ['[data-testid="more-ways-to-pay-component-wrapper"]'] },
    { id: 'walmart.membership.cart-banner', patternId: 'upsell.store-membership', pages: ['cart'], selectors: ['[data-testid="wplus-banner-title-cart"]'], unit: 'section' },
    { id: 'walmart.plan.protection', patternId: 'upsell.protection-plan', pages: ['product', 'cart'], selectors: ['[data-testid="item-addon-services-new"]'] },
    { id: 'walmart.financial.card', patternId: 'upsell.financial-product', pages: ['product', 'cart', 'checkout', 'home'], selectors: ['[data-testid="oneDebitCardBannerLink"]'] },
    { id: 'walmart.sponsored.placement', patternId: 'sponsorship.placement', pages: ['search', 'product', 'home'], selectors: ['[data-testid="skyline-ad"]', '[data-testid="brand-box-ad"]', '[data-testid="sb-container"]', '[data-ad-component-type]'] },
    { id: 'walmart.reference-price', patternId: 'pricing.reference-price', pages: ['search', 'product'], selectors: ['[data-testid="ugpp-was-price"]'] }
  ]);

  function classify(pathname = location.pathname) {
    if (/^\/ip\//.test(pathname)) return 'product';
    if (/^\/(?:search|browse|shop|cp)(?:\/|$)/.test(pathname)) return 'search';
    if (/^\/cart(?:\/|$)/.test(pathname)) return 'cart';
    if (/^\/checkout(?:\/|$)/.test(pathname)) return 'checkout';
    if (/^\/(?:orders|account|purchase-history)(?:\/|$)/.test(pathname)) return 'orders';
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
  const purchaseWording = /check ?out|place (?:your )?order|add to cart|buy now|continue/i;
  function hasPurchaseControl(node) { return [...(node.querySelectorAll?.('button, a, input[type="submit"]') || [])].some((control) => purchaseWording.test(control.textContent || control.value || control.getAttribute('aria-label') || '')); }
  function essentialOverlap(node) { return hasPurchaseControl(node) || Boolean(node.matches?.(essentialSelector) || node.closest?.(essentialSelector) || safeQueryAll(node, essentialSelector).length); }
  // Only whole badges and complete ad units are known to be self-contained.
  function structuralSafety(node) {
    if (!node?.isConnected) return { safe: false, reason: 'detached' };
    if (isProtectedPageRoot(node) || node.closest?.('[data-exp-owned="1"]')) return { safe: false, reason: 'protected-root' };
    if (essentialOverlap(node)) return { safe: false, reason: 'essential-overlap' };
    if (node.matches?.(badge)) return { safe: true, reason: 'known-badge' };
    if (node.matches?.('section') && node.querySelector('[data-testid="wplus-banner-title-cart"]')) return { safe: true, reason: 'membership-banner' };
    if (node.matches?.(knownStaticSelector)) return { safe: true, reason: 'known-static' };
    if (node.matches?.('[data-testid="skyline-ad"], [data-testid="brand-box-ad"], [data-testid="sb-container"]')) return { safe: true, reason: 'complete-sponsored-placement' };
    return { safe: false, reason: 'unverified-container' };
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
          const unit = detector.unit ? match.closest(detector.unit) : null;
          const node = unit && !hasPurchaseControl(unit) ? unit : match;
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
  return Object.freeze({ key: 'walmart', label: 'Walmart', features: Object.freeze({ coupons: false, compactSearch: false, recommendationCleanup: false }), patternIds, ID, VERSION, classify, eligible, detect, structuralSafety, diagnose, nextEpoch, cleanup });
})();
EXP.Retailers.register(EXP.WalmartAdapter);
