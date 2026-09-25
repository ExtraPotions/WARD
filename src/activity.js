EXP.Activity = (() => {
  const active = new Map();
  const totals = { interventions: 0, couponsConfirmed: 0, couponsSkipped: 0, couponsFailed: 0, structuralCollapseSkipped: 0 };
  const reveals = [];
  const structuralSkipReasons = {};
  let structuralSkippedNodes = new WeakSet();
  function apply(id, data) { const existing = active.get(id); active.set(id, { patternId: data.patternId, category: data.category, action: data.action, confidence: data.confidence, revealed: false }); if (!existing) totals.interventions += 1; }
  function remove(id) { active.delete(id); }
  function reveal(id) { const item = active.get(id); if (!item || item.revealed) return; item.revealed = true; reveals.push({ patternId: item.patternId, action: item.action, at: Date.now() }); if (reveals.length > 20) reveals.shift(); }
  function conceal(id) { const item = active.get(id); if (item) item.revealed = false; }
  function coupon(result) { if (result === 'confirmed') totals.couponsConfirmed += 1; else if (result === 'skipped') totals.couponsSkipped += 1; else totals.couponsFailed += 1; }
  function structuralSkip(node, reason = 'unsafe-structural-target') { if (node && structuralSkippedNodes.has(node)) return; if (node) structuralSkippedNodes.add(node); totals.structuralCollapseSkipped += 1; structuralSkipReasons[reason] = (structuralSkipReasons[reason] || 0) + 1; }
  function snapshot() { const breakdown = {}; for (const item of active.values()) { const key = `${item.category}:${item.action}`; breakdown[key] = (breakdown[key] || 0) + 1; } return { active: active.size, breakdown, totals: { ...totals }, structuralSkipsByReason: { ...structuralSkipReasons }, reveals: reveals.map((item) => ({ ...item })) }; }
  function resetRoute() { active.clear(); structuralSkippedNodes = new WeakSet(); }
  function clearSession() { active.clear(); totals.interventions = 0; totals.couponsConfirmed = 0; totals.couponsSkipped = 0; totals.couponsFailed = 0; totals.structuralCollapseSkipped = 0; for (const key of Object.keys(structuralSkipReasons)) delete structuralSkipReasons[key]; structuralSkippedNodes = new WeakSet(); reveals.length = 0; }
  return Object.freeze({ apply, remove, reveal, conceal, coupon, structuralSkip, snapshot, resetRoute, clearSession });
})();
