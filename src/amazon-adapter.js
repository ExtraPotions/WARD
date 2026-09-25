EXP.AmazonAdapter = (() => {
  const ID = 'ward.retailer.amazon';
  const VERSION = '3';
  const errors = [];
  let health = 'inactive';
  let epoch = 0;
  let lastScan = null;
  let routeMatchedTargets = new WeakSet();
  let routeMatchedTargetCount = 0;
  const routeMatchedDetectors = new Set();
  const supportedHosts = new Set(['www.amazon.com', 'smile.amazon.com']);
  // These identify complete ad units, not arbitrary containers with ad text.
  // Their iframe/carousel children belong to the ad and can hide with the unit.
  const sponsoredWrapperSelector = 'div.ape-wrapper[id^="ape_"][id$="_wrapper"]';
  const completeSponsoredSelectors = [
    '[data-component-type="s-sponsored-result"]',
    sponsoredWrapperSelector,
    'div.ape-placement[id^="ape_"][id$="_placement"]',
    'div.a-carousel-container[id^="sp_detail"][data-a-carousel-options]',
    'li.dpx-smidget-desktop-pill-list-item:has(button[data-action-id^="related_questions_sponsored_related_question_"])'
  ];
  const completeSponsoredSelector = completeSponsoredSelectors.join(',');
  const primePlanPromotion = '.mobile-gateway-strategic_prime-retention-plan-switch-homepage-wd-widget-cx';
  const ordersBusinessPromotion = '[data-card-metrics-id^="abxs-yo-dsk-dynamic-upsell_"]';
  const essentialSelector = ['.order-card', '.js-order-card', '#searchOrdersInput', '#time-filter', 'form[action^="/your-orders/"]', '[data-buybox-component]', '#buybox', '#desktop_buybox', '#price', '#corePrice_feature_div', '#availability', '#deliveryBlockMessage', '#mir-layout-DELIVERY_BLOCK', '#addToCart', '#buyNow', '#checkout', '[name="placeYourOrder1"]', '[data-testid*="checkout"]'].join(',');
  const structuralCollapseSelector = [primePlanPromotion, ordersBusinessPromotion, '#sims-fbt','#buyItWith','[data-feature-name="sims-fbt"]','#primeDPUpsellStaticContainerNPA','#primeDPUpsellStaticContainer','#businessPrimeDPUpsellStaticContainer','#businessSavings_feature_div','[data-feature-name="businessSavings"]','[data-csa-c-content-id*="business-savings" i]','#primeSavingsUpsellAccordionRow','#attach-warranty-pane','#protectionPlan_feature_div','#insuranceAndWarranty_feature_div','[data-feature-name="insuranceAndWarranty"]','[data-csa-c-content-id*="insurance-and-warranty" i]','#snsAccordionRowMiddle','#subscribeAndSaveAccordionRow','#creditCard_feature_div','#installmentCalculator_feature_div','#audible-promo'].join(',');
  const structuralRiskSelector = ['#rufus-container','video','audio','iframe','.a-carousel','.a-carousel-container','[role="slider"]','[aria-live]','[data-testid*="rufus" i]','[data-testid*="video" i]','[data-testid*="follow" i]','[data-feature-name*="video" i]','[data-feature-name*="creator" i]','[data-feature-name*="follow" i]','[data-cel-widget*="video" i]','[data-cel-widget*="media" i]'].join(',');
  const detectors = Object.freeze([
    { id: 'amazon.prime.product', patternId: 'upsell.membership.prime', pages: ['product', 'search', 'cart', 'checkout', 'home', 'orders', 'other'], selectors: [primePlanPromotion, '[data-feature-name="desktop-dp-ilm"]', '#primeDPUpsellStaticContainerNPA', '#primeDPUpsellStaticContainer', '#nav-join-prime', '#osu-prime-recommendations', '#prime-spc-stripe-recommendations', '.isoa-wrapper-radio', '.udm-primary-delivery-message:has(.prime-signup-ingress)', 'span[data-csa-c-owner="PromotionsDiscovery"]:has(label[id^="greenBadge"])', '#businessPrimeDPUpsellStaticContainer', '#primeSavingsUpsellAccordionRow', '#pep_feature_div'] },
    { id: 'amazon.urgency.deal', patternId: 'pressure.urgency', pages: ['product', 'search', 'cart'], selectors: ['.a-badge[data-a-badge-type="deal"]', '#dealBadge_feature_div', '#dealProgress_feature_div', '.sc-delight-pricing', '#delightPricingBadge_feature_div'] },
    { id: 'amazon.scarcity.stock', patternId: 'pressure.scarcity', pages: ['product', 'search', 'cart'], selectors: ['.sc-product-scarcity', '[class*="_scarcityMessage_"]', 'span[aria-label*="left in stock" i]'] },
    { id: 'amazon.subscription.sns', patternId: 'pressure.subscription', pages: ['product', 'cart'], selectors: ['.sc-subscribe-and-save-upsell-message', '#snsAccordionRowMiddle', '#subscribeAndSaveAccordionRow'] },
    { id: 'amazon.financial.credit', patternId: 'upsell.financial-product', pages: ['product', 'cart', 'checkout', 'search'], selectors: ['#creditCard_feature_div', '#installmentCalculator_feature_div', '[data-feature-name*="creditCard" i]', '[data-csa-c-content-id*="credit" i]'] },
    { id: 'amazon.plan.protection', patternId: 'upsell.protection-plan', pages: ['product', 'cart'], selectors: ['#attach-warranty-pane', '#protectionPlan_feature_div', '#insuranceAndWarranty_feature_div', '[data-feature-name*="protectionPlan" i]', '[data-feature-name="insuranceAndWarranty"]', '[data-csa-c-content-id*="insurance-and-warranty" i]'] },
    { id: 'amazon.business.promo', patternId: 'upsell.business-membership', pages: ['product', 'search', 'cart', 'home', 'orders'], selectors: [ordersBusinessPromotion, '#businessPrimeDPUpsellStaticContainer', '#businessSavings_feature_div', '[data-feature-name="businessSavings"]', '[data-feature-name*="business" i][class*="promo" i]', '[data-csa-c-content-id*="business-savings" i]'] },
    { id: 'amazon.sponsored.placement', patternId: 'sponsorship.placement', pages: ['product', 'search', 'home', 'orders'], selectors: [...completeSponsoredSelectors, '[data-ad-details]', '#sp_detail', '[data-cel-widget^="sp_"]'] },
    { id: 'amazon.cross-sell.recommendation', patternId: 'cross-sell.recommendation', pages: ['product', 'cart', 'home'], selectors: ['#sims-fbt', '#desktop-dp-sims_session-similarities-sims-feature', '#buyItWith', '[data-feature-name="sims-fbt"]'] },
    { id: 'amazon.service.promo', patternId: 'upsell.amazon-service', pages: ['product', 'home', 'orders', 'other'], selectors: ['#audible-promo', '[data-feature-name*="audible" i][class*="promo" i]', '[data-feature-name*="music" i][class*="promo" i]'] },
    { id: 'amazon.ai.rufus', patternId: 'pressure.shopping-assistant', pages: ['product', 'search', 'home'], selectors: ['#rufus-container', '[data-testid*="rufus" i]'] }
  ]);

  function classify(pathname = location.pathname) {
    if (/^\/(?:your-orders\/(?:orders|search)|gp\/(?:your-account|css)\/order-history)(?:\/|$)/.test(pathname)) return 'orders';
    if (/\/dp\/|\/gp\/product\//.test(pathname)) return 'product';
    if (/\/s(?:\/|$)/.test(pathname)) return 'search';
    if (/\/cart|\/gp\/cart/.test(pathname)) return 'cart';
    if (/\/checkout|\/gp\/buy/.test(pathname)) return 'checkout';
    if (pathname === '/' || pathname === '') return 'home';
    return 'other';
  }

  function eligible() { return supportedHosts.has(location.hostname); }
  function isProtectedPageRoot(node) {
    return !node ||
      node === document.documentElement ||
      node === document.head ||
      node === document.body ||
      node === document.scrollingElement ||
      node.matches?.('#a-page, #pageContent, main, [role~="main"]') ||
      Boolean(node.querySelector?.('#a-page, #pageContent, main, [role~="main"], [data-exp-owned="1"]'));
  }
  function safeQueryAll(root, selector) { try { return [...root.querySelectorAll(selector)]; } catch (error) { record(error, 'DETECTOR_SELECTOR'); return []; } }
  function essentialOverlap(node) { return Boolean(node.matches?.(essentialSelector) || node.closest?.(essentialSelector) || safeQueryAll(node, essentialSelector).length); }
  function structuralSafety(node) {
    if (!node?.isConnected) return { safe: false, reason: 'detached' };
    if (isProtectedPageRoot(node) || node.closest?.('[data-exp-owned="1"]')) return { safe: false, reason: 'protected-root' };
    if (node.matches?.(completeSponsoredSelector) && !essentialOverlap(node)) return { safe: true, reason: 'complete-sponsored-placement' };
    const risky = node.matches?.(structuralRiskSelector) || node.closest?.(structuralRiskSelector) || safeQueryAll(node, structuralRiskSelector).length;
    if (risky) return { safe: false, reason: 'dynamic-widget' };
    if (node.matches?.(structuralCollapseSelector)) return { safe: true, reason: 'known-static' };
    return { safe: false, reason: 'unverified-container' };
  }
  function record(error, code) { errors.push({ code, at: Date.now() }); if (errors.length > 8) errors.shift(); health = 'degraded'; EXP.Core.safeError(Object.assign(error || new Error(code), { code }), ID); }
  function resetCoverage() {
    lastScan = null;
    routeMatchedTargets = new WeakSet();
    routeMatchedTargetCount = 0;
    routeMatchedDetectors.clear();
  }

  function detect(roots = [document]) {
    if (!eligible()) { health = 'inactive'; lastScan = null; return []; }
    const pageType = classify();
    if (lastScan && lastScan.pageType !== pageType) resetCoverage();
    const found = new Map();
    const eligibleDetectors = detectors.filter((detector) => detector.pages.includes(pageType));
    health = 'healthy';
    for (const detector of eligibleDetectors) {
      try {
        for (const root of roots) for (const selector of detector.selectors) for (const match of [...(root.matches?.(selector) ? [root] : []), ...safeQueryAll(root, selector)]) {
          // Light ads put the disclosure beside the creative inside a wrapper.
          // Treat that whole unit once, including on incremental child scans.
          const node = detector.id === 'amazon.sponsored.placement' ? match.closest(sponsoredWrapperSelector) || match : match;
          if (!node.isConnected || isProtectedPageRoot(node) || node.closest('[data-exp-owned="1"]')) continue;
          routeMatchedDetectors.add(detector.id);
          if (!routeMatchedTargets.has(node)) {
            routeMatchedTargets.add(node);
            routeMatchedTargetCount += 1;
          }
          const essential = essentialOverlap(node);
          const structural = structuralSafety(node);
          const confidence = essential ? 'ambiguous' : 'confirmed';
          EXP.Audit?.detected?.(node, { detectorId: detector.id, patternId: detector.patternId, confidence, structuralSafe: structural.safe, structuralReason: structural.reason });
          const key = `${detector.id}:${selector}:${node.dataset.wardInstance || ''}`;
          if (!found.has(node)) found.set(node, Object.freeze({ evidenceId: key, detectorId: detector.id, patternId: detector.patternId, pageType, node, signals: ['adapter-selector'], exclusions: essential ? ['essential-overlap'] : [], essentialOverlap: essential, structuralSafe: structural.safe, structuralReason: structural.reason, confidence, epoch }));
        }
      } catch (error) { record(error, 'DETECTOR_FAILURE'); }
    }
    lastScan = {
      pageType,
      eligibleDetectors: eligibleDetectors.map(({ id }) => id),
      matchedDetectors: [...routeMatchedDetectors],
      matchedTargets: routeMatchedTargetCount
    };
    return [...found.values()];
  }

  function couponCandidates(roots = [document]) {
    if (!eligible()) return [];
    const selector = '[data-component-type="s-coupon-component"] .s-coupon-tile.unclaimed input[type="checkbox"]:not(:checked), .ct-coupon-tile.unclaimed input[type="checkbox"]:not(:checked)';
    return roots.flatMap((root) => safeQueryAll(root, selector)).filter((node, index, all) => all.indexOf(node) === index);
  }

  function cosmeticRecommendationCandidates(roots = [document]) {
    if (!eligible()) return [];
    const selector = '#sims-fbt, #buyItWith, [data-feature-name="sims-fbt"]';
    return roots.flatMap((root) => safeQueryAll(root, selector)).filter((node, index, all) => all.indexOf(node) === index && !essentialOverlap(node) && structuralSafety(node).safe);
  }

  function verifyCouponTarget(control) {
    if (!control?.isConnected || control.disabled || control.checked || control.hidden || control.dataset.wardCouponAttempted === '1') return { eligible: false, reason: 'not-unclaimed' };
    const component = control.closest('[data-component-type="s-coupon-component"], .ct-coupon-tile');
    if (!component) return { eligible: false, reason: 'ambiguous-control' };
    if (component.closest('#addToCart, #buyNow, #checkout, [name="placeYourOrder1"], [data-testid*="checkout"]')) return { eligible: false, reason: 'unsafe-context' };
    return { eligible: true, component };
  }

  function diagnose() { return { id: ID, version: VERSION, health, eligible: eligible(), pageType: eligible() ? classify() : 'unsupported', detectorCount: detectors.length, coverage: lastScan ? { ...lastScan, eligibleDetectors:lastScan.eligibleDetectors.slice(), matchedDetectors:lastScan.matchedDetectors.slice() } : null, errors: errors.map(({ code }) => ({ code })) }; }
  function nextEpoch() { epoch += 1; health = eligible() ? 'healthy' : 'inactive'; resetCoverage(); return epoch; }
  function cleanup() { epoch += 1; health = 'inactive'; resetCoverage(); errors.length = 0; }
  return Object.freeze({ ID, VERSION, classify, eligible, detect, couponCandidates, cosmeticRecommendationCandidates, structuralSafety, verifyCouponTarget, diagnose, nextEpoch, cleanup, patterns: () => detectors.map(({ id, patternId, pages }) => ({ id, patternId, pages: pages.slice() })) });
})();
