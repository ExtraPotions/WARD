// Dedicated retailer modules declare narrow selectors; this factory owns their safety contract.
EXP.createRetailerModule = (config) => {
  let epoch = 0, health = 'inactive', coverage = null;
  const errors = [];
  const eligible = () => config.hosts.includes(location.hostname);
  const classify = (path = location.pathname) => config.routes.find(([expression]) => expression.test(path))?.[1] || (path === '/' ? 'home' : 'other');
  const essential = 'button,input,select,textarea,form,[role="button"],[aria-live],video,audio,iframe,[data-exp-owned="1"]';
  function query(root, selector) { try { return [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)]; } catch { if (errors.length < 8) errors.push({ code:'DETECTOR_SELECTOR' }); health = 'degraded'; return []; } }
  function protectedRoot(node) { return !node || node === document.body || node === document.documentElement || node.matches?.('main,header,nav,footer,[role="main"]') || Boolean(node.closest?.('[data-exp-owned="1"]')); }
  function essentialOverlap(node) { return Boolean(node.matches?.(essential) || node.closest?.('form') || query(node, essential).length || [...query(node, 'a')].some(control => /add to cart|buy now|checkout|place order/i.test(control.textContent || control.getAttribute('aria-label') || ''))); }
  function structuralSafety(node) {
    if (!node?.isConnected) return { safe:false, reason:'detached' };
    if (protectedRoot(node)) return { safe:false, reason:'protected-root' };
    if (essentialOverlap(node)) return { safe:false, reason:'essential-overlap' };
    const detector = config.detectors.find(item => item.selectors.some(selector => { try { return node.matches(selector); } catch { return false; } }));
    return { safe:Boolean(detector?.complete), reason:detector?.complete ? 'known-static' : 'unverified-container' };
  }
  function detect(roots = [document]) {
    if (!eligible()) { health = 'inactive'; return []; }
    const pageType = classify(), found = new Map(), matched = new Set(); health = 'healthy';
    const detectors = config.detectors.filter(item => item.pages.includes(pageType));
    for (const item of detectors) for (const root of roots) for (const selector of item.selectors) for (const node of query(root, selector)) {
      if (!node.isConnected || protectedRoot(node) || (item.text && !item.text.test((node.textContent || '').trim()))) continue;
      const essentialOverlapValue = essentialOverlap(node), structural = structuralSafety(node), confidence = essentialOverlapValue ? 'blocked' : 'supported';
      const detectorId = `${config.key}.${item.id}`;
      matched.add(detectorId);
      EXP.Audit?.detected?.(node, { detectorId, patternId:item.patternId, confidence, structuralSafe:structural.safe, structuralReason:structural.reason });
      if (!found.has(node)) found.set(node, Object.freeze({ detectorId, evidenceId:detectorId, patternId:item.patternId, pageType, node, signals:['retailer-selector'], exclusions:essentialOverlapValue ? ['essential-overlap'] : [], essentialOverlap:essentialOverlapValue, structuralSafe:structural.safe, structuralReason:structural.reason, confidence, epoch }));
    }
    coverage = { pageType, eligibleDetectors:detectors.map(item => `${config.key}.${item.id}`), matchedDetectors:[...matched], matchedTargets:found.size };
    return [...found.values()];
  }
  return Object.freeze({ key:config.key, label:config.label, ID:`ward.retailer.${config.key}`, VERSION:'1', patternIds:Object.freeze([...new Set(config.detectors.map(item => item.patternId))]), features:Object.freeze({ coupons:false, compactSearch:false, recommendationCleanup:false }), eligible, classify, detect, structuralSafety,
    diagnose:() => ({ id:`ward.retailer.${config.key}`, version:'1', health, eligible:eligible(), pageType:eligible() ? classify() : 'unsupported', detectorCount:config.detectors.length, coverage, errors:errors.slice() }),
    nextEpoch() { epoch++; coverage = null; health = eligible() ? 'healthy' : 'inactive'; return epoch; }, cleanup() { epoch++; coverage = null; health = 'inactive'; errors.length = 0; },
    patterns:() => config.detectors.map(item => ({ id:`${config.key}.${item.id}`, patternId:item.patternId, complete:Boolean(item.complete), pages:item.pages.slice() }))
  });
};
