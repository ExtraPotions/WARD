EXP.Audit = (() => {
  let sequence = 0;
  let nodeIds = new WeakMap();
  let detections = new Set();
  let decisions = new Set();
  let revealedTargets = new Set();
  const targets = new Map();

  function idFor(node) {
    let id = nodeIds.get(node);
    if (!id) {
      id = `target-${++sequence}`;
      nodeIds.set(node, id);
    }
    return id;
  }

  function targetFor(node) {
    const targetId = idFor(node);
    let target = targets.get(targetId);
    if (!target) {
      target = {
        targetId,
        node,
        detections: new Map(),
        decisions: new Map(),
        requestedAction: null,
        appliedAction: null,
        confidence: null,
        structuralSafe: null,
        reason: null,
        revealed: false
      };
      targets.set(targetId, target);
    }
    return target;
  }

  function detected(node, data = {}) {
    if (!(node instanceof Element)) return;
    const target = targetFor(node);
    const detectorId = String(data.detectorId || 'unknown');
    const patternId = String(data.patternId || 'unknown');
    const key = `${target.targetId}|${detectorId}|${patternId}`;
    detections.add(key);
    target.detections.set(`${detectorId}|${patternId}`, {
      detectorId,
      patternId,
      confidence: String(data.confidence || 'unknown'),
      structuralSafe: data.structuralSafe === true,
      structuralReason: data.structuralReason ? String(data.structuralReason) : null
    });
  }

  function decision(node, data = {}) {
    if (!(node instanceof Element)) return;
    const target = targetFor(node);
    const detectorId = String(data.detectorId || 'unknown');
    const patternId = String(data.patternId || 'unknown');
    const key = `${target.targetId}|${detectorId}|${patternId}`;
    decisions.add(key);
    const current = {
      detectorId,
      patternId,
      requestedAction: String(data.requestedAction || 'allow'),
      appliedAction: String(data.appliedAction || 'allow'),
      confidence: String(data.confidence || 'unknown'),
      structuralSafe: data.structuralSafe === true,
      reason: data.reason ? String(data.reason) : null
    };
    target.decisions.set(`${detectorId}|${patternId}`, current);
    target.requestedAction = current.requestedAction;
    target.appliedAction = current.appliedAction;
    target.confidence = current.confidence;
    target.structuralSafe = current.structuralSafe;
    target.reason = current.reason;
  }

  function revealed(node) {
    if (!(node instanceof Element)) return;
    const target = targetFor(node);
    revealedTargets.add(target.targetId);
    target.revealed = true;
  }

  function concealed(node) {
    if (!(node instanceof Element)) return;
    const targetId = nodeIds.get(node);
    if (!targetId) return;
    revealedTargets.delete(targetId);
    const target = targets.get(targetId);
    if (target) target.revealed = false;
  }

  function prune() {
    for (const [targetId, target] of targets) {
      if (target.node?.isConnected) continue;
      targets.delete(targetId);
      revealedTargets.delete(targetId);
      for (const key of [...detections]) if (key.startsWith(`${targetId}|`)) detections.delete(key);
      for (const key of [...decisions]) if (key.startsWith(`${targetId}|`)) decisions.delete(key);
    }
  }

  function snapshot() {
    const rows = [...targets.values()].map((target) => {
      const detectionsList = [...target.detections.values()];
      return {
        targetId: target.targetId,
        duplicate: detectionsList.length > 1,
        detections: detectionsList,
        decisions: [...target.decisions.values()],
        confidence: target.confidence,
        requestedAction: target.requestedAction,
        appliedAction: target.appliedAction,
        structuralSafe: target.structuralSafe,
        reason: target.reason,
        revealed: target.revealed
      };
    });

    const decided = rows.filter((item) => item.appliedAction !== null);
    const counts = {
      detected: detections.size,
      acted: decided.filter((item) => item.appliedAction !== 'allow').length,
      downgraded: decided.filter((item) => item.requestedAction !== item.appliedAction).length,
      skipped: decided.filter((item) => item.appliedAction === 'allow').length,
      revealed: revealedTargets.size,
      duplicateTargets: rows.filter((item) => item.duplicate).length,
      structuralCollapseSkipped: decided.filter((item) =>
        (item.requestedAction === 'hide' || item.requestedAction === 'collapse') &&
        item.appliedAction !== item.requestedAction &&
        item.structuralSafe === false
      ).length
    };

    return {
      schemaVersion: 1,
      privacy: 'Detector and action metadata only. Page text, form values, selectors, URLs, and DOM markup are excluded.',
      counts,
      targets: rows
    };
  }

  function resetRoute() {
    sequence = 0;
    nodeIds = new WeakMap();
    detections = new Set();
    decisions = new Set();
    revealedTargets = new Set();
    targets.clear();
  }

  return Object.freeze({ detected, decision, revealed, concealed, prune, snapshot, resetRoute });
})();
