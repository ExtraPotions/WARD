// Store adapters register here. The engine, settings and menu talk to EXP.Retailer,
// which forwards to whichever registered adapter matches the current site, so
// supporting another store means adding an adapter and registering it.
//
// An adapter provides: key, label, patternIds, features, eligible(), classify(),
// detect(roots), structuralSafety(node), diagnose(), nextEpoch(), cleanup().
// Optional: couponCandidates(roots), verifyCouponTarget(control),
// cosmeticRecommendationCandidates(roots).
EXP.Retailers = (() => {
  const adapters = new Map();
  const REQUIRED = ['eligible', 'classify', 'detect', 'structuralSafety', 'diagnose', 'nextEpoch', 'cleanup'];

  function register(adapter) {
    if (!adapter || typeof adapter.key !== 'string' || !/^[a-z][a-z0-9-]*$/.test(adapter.key)) {
      throw Object.assign(new Error('Retailer adapter needs a lowercase key'), { code: 'RETAILER_KEY' });
    }
    if (adapters.has(adapter.key)) throw Object.assign(new Error(`Duplicate retailer adapter: ${adapter.key}`), { code: 'RETAILER_DUPLICATE' });
    for (const name of REQUIRED) {
      if (typeof adapter[name] !== 'function') throw Object.assign(new Error(`Retailer adapter ${adapter.key} is missing ${name}()`), { code: 'RETAILER_INTERFACE' });
    }
    adapters.set(adapter.key, adapter);
    return adapter;
  }

  function all() { return [...adapters.values()]; }
  function get(key) { return adapters.get(key) || null; }
  function keys() { return [...adapters.keys()]; }
  // The adapter for the page being viewed, or null on an unsupported site.
  function current() {
    for (const adapter of adapters.values()) {
      try { if (adapter.eligible()) return adapter; } catch { /* a broken adapter never claims a page */ }
    }
    return null;
  }

  return Object.freeze({ register, all, get, keys, current });
})();

// What the engine and menu call. Everything falls back to a safe answer on a page
// that no adapter supports.
EXP.Retailer = (() => {
  const idle = Object.freeze({ id: 'none', key: 'none', label: 'Store', health: 'inactive', eligible: false, pageType: 'unsupported' });
  const none = () => [];
  function adapter() { return EXP.Retailers.current(); }
  function coverage() {
    const active=adapter(),patterns=active?.patterns?.(),ids=active?.patternIds||[],rows=Array.isArray(patterns)?patterns:[];
    const supportedCategories=[...new Set(rows.filter(row=>row.complete===true).map(row=>row.patternId))];
    const conservativeCategories=[...new Set(ids)].filter(id=>!supportedCategories.includes(id));
    return {retailer:active?.key||'none',supportedCategories,conservativeCategories,unsupportedCategories:EXP.Patterns.all().map(row=>row.id).filter(id=>!ids.includes(id))};
  }
  function optional(name, fallback) {
    return (...args) => {
      const active = adapter();
      return active && typeof active[name] === 'function' ? active[name](...args) : fallback(...args);
    };
  }

  return Object.freeze({
    coverage,
    key: () => adapter()?.key || 'none',
    label: () => adapter()?.label || 'Store',
    features: () => adapter()?.features || Object.freeze({}),
    patternIds: () => new Set(adapter()?.patternIds || []),
    eligible: () => Boolean(adapter()),
    // WARD acts on this page only if the master switch and this store's own switch are on.
    enabled: (settings) => Boolean(settings?.enabled) && Boolean(adapter()) && settings.retailers?.[adapter().key] !== false,
    classify: optional('classify', () => 'other'),
    detect: optional('detect', none),
    couponCandidates: optional('couponCandidates', none),
    verifyCouponTarget: optional('verifyCouponTarget', () => ({ eligible: false, reason: 'unsupported-store' })),
    cosmeticRecommendationCandidates: optional('cosmeticRecommendationCandidates', none),
    structuralSafety: optional('structuralSafety', () => ({ safe: false, reason: 'unsupported-store' })),
    diagnose: () => adapter()?.diagnose() || idle,
    nextEpoch: () => { for (const item of EXP.Retailers.all()) item.nextEpoch(); },
    cleanup: () => { for (const item of EXP.Retailers.all()) item.cleanup(); },
  });
})();
