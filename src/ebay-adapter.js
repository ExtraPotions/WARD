// eBay's markup uses readable class names (s-card, su-styled-text, x-ebay-signal),
// but its pressure cues are plain text spans inside shared containers, so most
// detectors here match a container and then test the wording.
EXP.EbayAdapter = (() => {
  const ID = 'ward.retailer.ebay';
  const VERSION = '1';
  const errors = [];
  let health = 'inactive';
  let epoch = 0;
  let lastScan = null;
  const supportedHosts = new Set(['www.ebay.com', 'ebay.com']);
  const cardBadge = '.s-card__attribute-row .su-styled-text';
  const itemSignal = '.x-ebay-signal .ux-textspans, #qtyAvailability .ux-textspans';
  const recommendationModule = '.srp-river-answer--ITEMS_CAROUSEL_WITH_COLOR';
  const essentialSelector = ['#binBtn_btn', '#isCartBtn_btn', '#atcBtn_btn', '.x-bin-action', '.x-atc-action', '.x-msku', '.x-quantity__input', '#qtyTextBox', '[data-testid*="checkout" i]', 'form[action*="checkout" i]', 'button[type="submit"]'].join(',');
  const protectedRootSelector = '#mainContent, #CenterPanel, #RightSummaryPanel, .srp-main, .srp-river, ul.srp-results, main, [role~="main"]';
  const purchaseWording = /buy it now|place bid|add to cart|check ?out|make offer|confirm and pay|pay now|continue/i;
  const detectors = Object.freeze([
    { id: 'ebay.social-proof.card', patternId: 'pressure.social-proof', pages: ['search'], selectors: [cardBadge], text: /^[\d,.]+k?\+? (?:sold|watchers?|watching)$/i },
    { id: 'ebay.social-proof.item', patternId: 'pressure.social-proof', pages: ['product'], selectors: [itemSignal], text: /^(?:in [\d,.]+k?\+? carts?|[\d,.]+k?\+? (?:sold|watchers?|watching)|[\d,.]+k?\+? (?:people|viewers?) .*)$/i },
    { id: 'ebay.scarcity.card', patternId: 'pressure.scarcity', pages: ['search'], selectors: [cardBadge], text: /^(?:last one|only [\d,]+ left|[\d,]+ left)$/i },
    { id: 'ebay.scarcity.item', patternId: 'pressure.scarcity', pages: ['product'], selectors: [itemSignal], text: /^(?:last one|only [\d,]+ (?:left|available)|limited quantity)$/i },
    { id: 'ebay.recommendation.module', patternId: 'cross-sell.recommendation', pages: ['search'], selectors: [recommendationModule] },
    { id: 'ebay.sponsored.card', patternId: 'sponsorship.placement', pages: ['search'], selectors: ['li.s-card'], text: /(?:^|\n)\s*sponsored\s*(?:\n|$)/i, sponsoredOnly: true }
  ]);

  function classify(pathname = location.pathname) {
    if (/^\/itm\//.test(pathname)) return 'product';
    if (/^\/(?:sch|b)\//.test(pathname)) return 'search';
    if (/^\/(?:cart|sc)(?:\/|$)/.test(pathname)) return 'cart';
    if (/^\/(?:checkout|pay)(?:\/|$)/.test(pathname)) return 'checkout';
    if (/^\/mye\//.test(pathname)) return 'orders';
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
  // Text spans and complete result modules are self-contained; nothing else is known to be.
  function structuralSafety(node) {
    if (!node?.isConnected) return { safe: false, reason: 'detached' };
    if (isProtectedPageRoot(node) || node.closest?.('[data-exp-owned="1"]')) return { safe: false, reason: 'protected-root' };
    if (essentialOverlap(node)) return { safe: false, reason: 'essential-overlap' };
    if (node.matches?.(`${cardBadge}, ${itemSignal}`)) return { safe: true, reason: 'known-text-signal' };
    if (node.matches?.(recommendationModule)) return { safe: true, reason: 'complete-module' };
    if (node.matches?.('li.s-card')) return { safe: true, reason: 'complete-sponsored-placement' };
    return { safe: false, reason: 'unverified-container' };
  }

  // eBay draws its "Sponsored" tag as a background image on a heading that points
  // at a hidden label (aria-labelledby), so the word itself is never inside the card.
  // A card counts only when one of those labels reads exactly "Sponsored".
  function readsSponsored(id) { return /^sponsored$/i.test((document.getElementById(id)?.textContent || '').trim()); }
  function carriesSponsoredLabel(card) {
    return [...card.querySelectorAll('[aria-labelledby]')].some((label) => label.getAttribute('aria-labelledby').split(/\s+/).some(readsSponsored)) ||
      [...card.querySelectorAll('span, div')].some((label) => !label.childElementCount && /^sponsored$/i.test((label.textContent || '').trim()));
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
        for (const root of roots) for (const selector of detector.selectors) for (const node of [...(root.matches?.(selector) ? [root] : []), ...safeQueryAll(root, selector)]) {
          if (!node.isConnected || isProtectedPageRoot(node) || node.closest('[data-exp-owned="1"]')) continue;
          if (detector.sponsoredOnly) { if (!carriesSponsoredLabel(node)) continue; }
          else if (detector.text && !detector.text.test((node.textContent || '').trim())) continue;
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
  return Object.freeze({ key: 'ebay', label: 'eBay', features: Object.freeze({ coupons: false, compactSearch: false, recommendationCleanup: false }), patternIds, ID, VERSION, classify, eligible, detect, structuralSafety, diagnose, nextEpoch, cleanup });
})();
EXP.Retailers.register(EXP.EbayAdapter);
