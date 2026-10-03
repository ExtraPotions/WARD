EXP.Engine = (() => {
  let active = false;
  let routeEpoch = 0;
  let couponQuarantined = false;
  let couponStatus = { state:'ready', reason:'not-run', lastResult:null };
  let lastActivityDigest = '';
  const couponPending = new Set();

  function activityDigest() {
    const data = EXP.Activity.snapshot();
    const adapter = EXP.Retailer.diagnose();
    return JSON.stringify({ active: data.active, totals: data.totals, breakdown: data.breakdown, adapter:adapter.health, coupon:couponStatus, quarantined:couponQuarantined });
  }

  function syncActivityUi() {
    const digest = activityDigest();
    if (digest === lastActivityDigest) return;
    lastActivityDigest = digest;
    EXP.UI?.refreshActivity?.();
  }

  function structuralDowngrade(action, evidence, pattern) {
    if ((action !== 'hide' && action !== 'collapse') || evidence.structuralSafe !== false) return action;
    EXP.Activity.structuralSkip(evidence.node, evidence.structuralReason || 'unsafe-structural-target');
    if (pattern.allowedActions.includes('dim')) return 'dim';
    if (pattern.allowedActions.includes('annotate')) return 'annotate';
    return 'allow';
  }

  function requestedDecision(evidence, pattern, settings) {
    if (!EXP.Retailer.enabled(settings) || settings.safeMode) return { action: 'allow', reason: 'protection-disabled' };
    if(settings.pageExceptions?.some(v=>v.path===location.hostname+location.pathname&&v.patternId===pattern.id))return {action:'allow',reason:'remembered-page-exception'};
    const patternMode = settings.patterns[pattern.id] || 'inherit';
    const categoryMode = settings.categories[pattern.category] || 'inherit';
    if (patternMode === 'off') return { action: 'allow', reason: 'pattern-disabled' };
    if (patternMode === 'inherit' && categoryMode === 'off') return { action: 'allow', reason: 'category-disabled' };
    if (evidence.confidence === 'blocked') return { action: 'allow', reason: 'blocked-confidence' };
    if (evidence.essentialOverlap) return { action: pattern.allowedActions.includes('annotate') ? 'annotate' : 'allow', reason: 'essential-overlap' };
    if (evidence.confidence === 'ambiguous') return { action: pattern.allowedActions.includes('annotate') ? 'annotate' : 'allow', reason: 'ambiguous-confidence' };
    if (evidence.confidence === 'supported' && settings.confidencePolicy === 'confirmed') return { action: 'allow', reason: 'confidence-policy' };

    if (settings.contentAction === 'automatic' && settings.protectionLevel !== 'custom' && pattern.id === 'cross-sell.recommendation' && settings.recommendationCleanup && evidence.structuralSafe === true) {
      return { action: 'collapse', reason: 'recommendation-cleanup' };
    }

    let action;
    let reason;
    if (settings.contentAction === 'hide' || settings.contentAction === 'dim') {
      action = pattern.allowedActions.includes(settings.contentAction) ? settings.contentAction : 'dim';
      reason = 'content-action';
    } else if (settings.protectionLevel === 'essential') {
      if (pattern.essentialPolicy === 'complete-placement-only' && evidence.structuralSafe === true) {
        action = pattern.defaultAction;
        reason = 'essential-complete-placement';
      } else if (pattern.defaultAction === 'annotate' && pattern.allowedActions.includes('annotate')) {
        action = 'annotate';
        reason = 'essential-annotate';
      } else if (pattern.allowedActions.includes('dim')) {
        action = 'dim';
        reason = 'essential-dim';
      } else if (pattern.allowedActions.includes('annotate')) {
        action = 'annotate';
        reason = 'essential-annotate';
      } else {
        action = 'allow';
        reason = 'essential-allow';
      }
    } else if (settings.protectionLevel === 'custom') {
      action = pattern.allowedActions.includes(settings.defaultAction) ? settings.defaultAction : pattern.defaultAction;
      reason = 'custom-policy';
    } else {
      action = pattern.defaultAction;
      reason = 'balanced-pattern-policy';
    }

    if (evidence.confidence === 'supported' && action === 'hide') {
      action = pattern.allowedActions.includes('collapse') ? 'collapse' : 'annotate';
      reason = 'supported-safe-action';
    }
    return { action, reason };
  }

  function processEvidence(evidence, settings) {
    const pattern = EXP.Patterns.get(evidence.patternId);
    if (!pattern) return;
    const requested = requestedDecision(evidence, pattern, settings);
    const appliedAction = structuralDowngrade(requested.action, evidence, pattern);
    const reason = requested.action !== appliedAction
      ? (evidence.structuralReason || 'unsafe-structural-target')
      : requested.reason;
    EXP.Audit?.decision?.(evidence.node, {
      detectorId: evidence.detectorId,
      patternId: evidence.patternId,
      confidence: evidence.confidence,
      requestedAction: requested.action,
      appliedAction,
      structuralSafe: evidence.structuralSafe,
      reason
    });
    EXP.Actions.apply(evidence.node, { action: appliedAction, pattern, confidence: evidence.confidence, structuralSafe: evidence.structuralSafe, reason });
  }

  function verifyCoupon(control, component, epoch, href) {
    setTimeout(() => {
      couponPending.delete(control);
      if (epoch !== routeEpoch || !active) return;
      if (location.href !== href) { couponQuarantined = true; couponStatus = { state:'quarantined', reason:'unexpected-navigation', lastResult:'failed' }; EXP.Activity.coupon('failed'); control.dataset.wardCouponFailure = 'unexpected-navigation'; syncActivityUi(); return; }
      const claimed = control.checked || (component.isConnected && (!component.classList.contains('unclaimed') || component.matches('.claimed, [data-claimed="true"]')));
      if (claimed) { EXP.Activity.coupon('confirmed'); couponStatus = { state:'confirmed', reason:'coupon-confirmed', lastResult:'confirmed' }; }
      else { const reason = component.isConnected ? 'no-confirmation' : 'detached'; EXP.Activity.coupon('failed'); control.dataset.wardCouponFailure = reason; couponStatus = { state:'attention', reason, lastResult:'failed' }; }
      syncActivityUi();
    }, 300);
  }

  function processCoupons(roots, settings) {
    if (!EXP.Retailer.enabled(settings) || settings.safeMode || !settings.autoClipCoupons || !EXP.Retailer.features().coupons) { couponStatus = { state:'disabled', reason:'coupon-setting', lastResult:couponStatus.lastResult }; return; }
    if (couponQuarantined) { couponStatus = { state:'quarantined', reason:couponStatus.reason || 'coupon-quarantine', lastResult:couponStatus.lastResult }; return; }
    const candidates = EXP.Retailer.couponCandidates(roots);
    if (!candidates.length && couponStatus.state === 'ready') couponStatus = { state:'idle', reason:'no-eligible-coupon', lastResult:null };
    for (const control of candidates) {
      const check = EXP.Retailer.verifyCouponTarget(control);
      if (!check.eligible) { if (!control.dataset.wardCouponSkipped) { control.dataset.wardCouponSkipped = check.reason; EXP.Activity.coupon('skipped'); couponStatus = { state:'attention', reason:check.reason, lastResult:'skipped' }; } continue; }
      if (couponPending.has(control)) continue;
      couponStatus = { state:'checking', reason:'awaiting-confirmation', lastResult:couponStatus.lastResult };
      control.dataset.wardCouponAttempted = '1'; couponPending.add(control);
      try { const href = location.href; control.click(); verifyCoupon(control, check.component, routeEpoch, href); }
      catch (error) { couponPending.delete(control); couponQuarantined = true; couponStatus = { state:'quarantined', reason:'activation-error', lastResult:'failed' }; EXP.Activity.coupon('failed'); EXP.Core.safeError(Object.assign(error, { code: 'COUPON_ACTIVATION' }), 'ward.amazon.coupon'); }
    }
  }

  function resumeCoupons() {
    couponQuarantined = false;
    couponPending.clear();
    couponStatus = { state:'ready', reason:'manual-resume', lastResult:couponStatus.lastResult };
    for (const control of document.querySelectorAll('[data-ward-coupon-attempted],[data-ward-coupon-failure],[data-ward-coupon-skipped]')) {
      delete control.dataset.wardCouponAttempted;
      delete control.dataset.wardCouponFailure;
      delete control.dataset.wardCouponSkipped;
    }
    if (active) processBatch([document]);
    syncActivityUi();
    return true;
  }

  function publishSuiteState(pageType = 'unknown') {
    const records = EXP.Actions.snapshot();
    const counts = { hide: 0, dim: 0, collapse: 0, annotate: 0 };
    for (const record of records) if (Object.hasOwn(counts, record.action)) counts[record.action] += 1;
    globalThis.ExtraPotionsCore?.publishSuiteState?.('ward', 'ward.state-changed', {
      active: Boolean(active),
      pageType: String(pageType || 'unknown'),
      interventions: records.length,
      hide: counts.hide,
      dim: counts.dim,
      collapse: counts.collapse,
      annotate: counts.annotate,
    });
  }

  function processBatch(roots = [document]) {
    if (!active) return;
    const settings = EXP.Settings.snapshot();
    if (!EXP.Retailer.enabled(settings) || settings.safeMode) { EXP.Actions.restoreAll(); EXP.UI?.restack?.(); syncActivityUi(); publishSuiteState('inactive'); return; }
    const pageType = EXP.Retailer.classify();
    EXP.Layout.apply(settings, pageType);
    const evidenceList = EXP.Retailer.detect(roots);
    const seenNodes = new Set();
    for (const evidence of evidenceList) {
      seenNodes.add(evidence.node);
      processEvidence(evidence, settings);
    }
    if (settings.recommendationCleanup && EXP.Retailer.features().recommendationCleanup) {
      for (const node of EXP.Retailer.cosmeticRecommendationCandidates(roots)) {
        if (seenNodes.has(node)) continue;
        const structural = EXP.Retailer.structuralSafety(node);
        const evidence = {
          detectorId: `${EXP.Retailer.key()}.cross-sell.recommendation`,
          patternId: 'cross-sell.recommendation',
          pageType,
          node,
          signals: ['recommendation-cleanup'],
          exclusions: [],
          essentialOverlap: false,
          structuralSafe: structural.safe,
          structuralReason: structural.reason,
          confidence: 'confirmed'
        };
        EXP.Audit?.detected?.(node, {
          detectorId: evidence.detectorId,
          patternId: evidence.patternId,
          confidence: evidence.confidence,
          structuralSafe: evidence.structuralSafe,
          structuralReason: evidence.structuralReason
        });
        processEvidence(evidence, settings);
      }
    }
    processCoupons(roots, settings);
    EXP.Actions.prune();
    EXP.Audit?.prune?.();
    EXP.UI?.restack?.();
    syncActivityUi();
    publishSuiteState(pageType);
  }

  function rebuild() { EXP.Actions.restoreAll(); EXP.Layout.cleanup(); EXP.Audit?.resetRoute?.(); if (active) processBatch([document]); }
  function navigation() { routeEpoch += 1; couponQuarantined = false; couponStatus = { state:'ready', reason:'navigation', lastResult:null }; couponPending.clear(); EXP.Retailer.nextEpoch(); EXP.Actions.restoreAll(); EXP.Layout.cleanup(); EXP.Activity.resetRoute(); EXP.Audit?.resetRoute?.(); if (active) processBatch([document]); }
  function start() { if (active) return; active = true; routeEpoch += 1; couponQuarantined = false; couponStatus = { state:'ready', reason:'start', lastResult:null }; EXP.Retailer.nextEpoch(); EXP.Audit?.resetRoute?.(); processBatch([document]); }
  function stop() { active = false; couponPending.clear(); couponStatus = { state:'disabled', reason:'engine-stopped', lastResult:couponStatus.lastResult }; EXP.Actions.restoreAll(); EXP.Layout.cleanup(); publishSuiteState('inactive'); }
  function cleanup() { stop(); EXP.Actions.cleanup(); EXP.PageStyles.cleanup(); EXP.Retailer.cleanup(); EXP.Activity.resetRoute(); EXP.Audit?.resetRoute?.(); }
  function diagnostics() { return { product: { id: 'ward', version: EXP.VERSION, active }, adapter: EXP.Retailer.diagnose(), coupon: { ...couponStatus, quarantined:couponQuarantined, pending:couponPending.size }, activity: EXP.Activity.snapshot(), audit: EXP.Audit?.snapshot?.() || null, interventions: EXP.Actions.snapshot(), core: EXP.Core.diagnosticSnapshot() }; }
  return Object.freeze({ start, stop, cleanup, navigation, rebuild, processBatch, resumeCoupons, diagnostics, get active() { return active; }, get couponQuarantined() { return couponQuarantined; } });
})();
