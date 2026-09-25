EXP.Actions = (() => {
  const records = new Map();
  const byNode = new WeakMap();
  let sequence = 0;
  let style;

  function isProtectedRoot(node) {
    return !(node instanceof Element) ||
      node === document.documentElement ||
      node === document.head ||
      node === document.body ||
      node === document.scrollingElement;
  }

  function ensureStyles() {
    if (style?.active()) return;
    style = EXP.PageStyles.inject(`
      .exp-ward-dimmed{
        opacity:.58!important;
        filter:saturate(.72)!important;
        transition:opacity .12s ease,filter .12s ease!important
      }
      .exp-ward-collapse,.exp-ward-reprotect{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
        width:100%!important;
        min-height:28px!important;
        margin:4px 0!important;
        padding:5px 8px!important;
        border:1px solid rgba(183,91,0,.38)!important;
        border-radius:6px!important;
        background:rgba(255,244,199,.72)!important;
        color:#4a3518!important;
        box-shadow:none!important;
        font:600 11px/1.25 system-ui,sans-serif!important;
        cursor:pointer!important;
        text-align:left!important
      }
      .exp-ward-collapse:hover,.exp-ward-reprotect:hover{
        background:rgba(255,244,199,.9)!important;
        border-color:rgba(183,91,0,.6)!important
      }
      .exp-ward-collapse:focus-visible,.exp-ward-reprotect:focus-visible{
        outline:2px solid #1b70c9!important;
        outline-offset:2px!important
      }
      .exp-ward-collapse-label{
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
        opacity:.82!important
      }
      .exp-ward-collapse-action{
        flex:0 0 auto!important;
        font-weight:800!important
      }
      .exp-ward-annotation{
        display:inline-block!important;
        margin:2px 4px!important;
        padding:2px 5px!important;
        border:1px solid rgba(183,91,0,.32)!important;
        border-radius:5px!important;
        background:rgba(255,244,199,.65)!important;
        color:#5a421f!important;
        font:700 9px/1.2 system-ui,sans-serif!important
      }
      .exp-ward-reprotect{
        width:auto!important;
        margin:4px 0 4px auto!important;
        color:#4a3518!important
      }
    `, { wardActions:'1' });
  }

  function idFor(node) {
    const existing = byNode.get(node);
    if (existing && records.get(existing.id) === existing) return existing.id;
    if (existing) byNode.delete(node);
    const id = `ward-${++sequence}`;
    const record = {
      id,
      node,
      action: 'allow',
      patternId: '',
      category: '',
      confidence: '',
      structuralSafe: null,
      original: null,
      companion: null,
      revealed: false
    };
    records.set(id, record);
    byNode.set(node, record);
    node.dataset.wardInstance = id;
    return id;
  }

  function capture(record) {
    if (record.original) return;
    const node = record.node;
    record.original = {
      hidden: node.hidden,
      ariaHidden: node.getAttribute('aria-hidden'),
      inert: node.hasAttribute('inert'),
      display: node.style.getPropertyValue('display'),
      displayPriority: node.style.getPropertyPriority('display'),
      opacity: node.style.getPropertyValue('opacity'),
      opacityPriority: node.style.getPropertyPriority('opacity'),
      filter: node.style.getPropertyValue('filter'),
      filterPriority: node.style.getPropertyPriority('filter'),
      position: node.style.position
    };
  }

  function clearPresentation(record) {
    const { node, original } = record;
    record.companion?.remove();
    record.companion = null;
    node.classList.remove('exp-ward-dimmed');

    if (original) {
      node.hidden = original.hidden;
      original.ariaHidden === null
        ? node.removeAttribute('aria-hidden')
        : node.setAttribute('aria-hidden', original.ariaHidden);
      original.inert ? node.setAttribute('inert', '') : node.removeAttribute('inert');
      if (original.display) node.style.setProperty('display', original.display, original.displayPriority);
      else node.style.removeProperty('display');
      if (original.opacity) node.style.setProperty('opacity', original.opacity, original.opacityPriority);
      else node.style.removeProperty('opacity');
      if (original.filter) node.style.setProperty('filter', original.filter, original.filterPriority);
      else node.style.removeProperty('filter');
      node.style.position = original.position;
    }

    node.removeAttribute('data-ward-action');
  }

  function presentationIntact(record, action) {
    const node = record.node;
    if (record.revealed) return node.dataset.wardRevealed === '1' && record.companion?.isConnected && record.companion.classList.contains('exp-ward-reprotect');
    if (action === 'allow') return !node.hasAttribute('data-ward-action') && !record.companion && !node.classList.contains('exp-ward-dimmed');
    if (action === 'dim') return node.dataset.wardAction === 'dim' && node.classList.contains('exp-ward-dimmed') && node.style.getPropertyValue('opacity') === '0.58' && node.style.getPropertyPriority('opacity') === 'important' && !record.companion;
    if (action === 'annotate') return node.dataset.wardAction === 'annotate' && record.companion?.isConnected && record.companion.classList.contains('exp-ward-annotation');
    if (action === 'collapse') return node.dataset.wardAction === 'collapse' && node.hidden && node.hasAttribute('inert') && node.style.getPropertyValue('display') === 'none' && node.style.getPropertyPriority('display') === 'important' && record.companion?.isConnected && record.companion.classList.contains('exp-ward-collapse');
    if (action === 'hide') return node.dataset.wardAction === 'hide' && node.hidden && node.hasAttribute('inert') && node.style.getPropertyValue('display') === 'none' && node.style.getPropertyPriority('display') === 'important';
    return false;
  }

  function makeCompanion(record, kind, text) {
    const element = document.createElement(kind === 'collapse' || kind === 'reprotect' ? 'button' : 'span');
    element.dataset.expOwned = '1';
    element.className = `exp-ward-${kind}`;

    if (kind === 'collapse') {
      element.type = 'button';
      element.setAttribute('aria-expanded', 'false');
      element.setAttribute('aria-label', `${text}. Show content`);

      const label = document.createElement('span');
      label.className = 'exp-ward-collapse-label';
      label.textContent = 'Protected by WARD';

      const show = document.createElement('span');
      show.className = 'exp-ward-collapse-action';
      show.textContent = 'Show';

      element.append(label, show);
      element.addEventListener('click', () => reveal(record.id));
    } else if (kind === 'reprotect') {
      element.type = 'button';
      element.textContent = 'Protect again';
      element.setAttribute('aria-label', `Protect ${text} again`);
      element.addEventListener('click', () => endReveal(record.id));
    } else {
      element.textContent = text;
    }

    record.node.insertAdjacentElement('afterend', element);
    record.companion = element;
  }

  function apply(node, proposal) {
    if (isProtectedRoot(node)) {
      EXP.Core.safeError(
        Object.assign(
          new Error('WARD refused an intervention against a protected document root'),
          { code: 'ACTION_ROOT_GUARD' }
        ),
        'ward.actions'
      );
      return null;
    }

    ensureStyles();

    const id = idFor(node);
    const record = records.get(id);
    capture(record);

    const structuralAction = proposal.action === 'hide' || proposal.action === 'collapse';
    const nextAction = structuralAction && proposal.structuralSafe === false ? 'dim' : proposal.action;
    const sameDecision =
      record.action === nextAction &&
      record.patternId === proposal.pattern.id &&
      record.category === proposal.pattern.category &&
      record.confidence === proposal.confidence;

    record.action = nextAction;
    record.patternId = proposal.pattern.id;
    record.category = proposal.pattern.category;
    record.confidence = proposal.confidence;
    record.structuralSafe = proposal.structuralSafe ?? record.structuralSafe;

    if (record.revealed) {
      node.dataset.wardRevealed = '1';
      if (!presentationIntact(record, nextAction)) makeCompanion(record, 'reprotect', proposal.pattern.label);
      return id;
    }

    if (sameDecision && presentationIntact(record, nextAction)) return id;

    clearPresentation(record);
    node.removeAttribute('data-ward-revealed');
    node.dataset.wardAction = record.action;

    if (record.action === 'hide') {
      if (node.contains(document.activeElement)) document.activeElement.blur();
      node.hidden = true;
      node.style.setProperty('display', 'none', 'important');
      node.setAttribute('inert', '');
    } else if (record.action === 'dim') {
      node.classList.add('exp-ward-dimmed');
      node.style.setProperty('opacity', '0.58', 'important');
      node.style.setProperty('filter', 'saturate(0.72)', 'important');
    } else if (record.action === 'collapse') {
      const transferFocus = node.contains(document.activeElement);
      node.hidden = true;
      node.style.setProperty('display', 'none', 'important');
      node.setAttribute('inert', '');
      makeCompanion(record, 'collapse', `Show ${proposal.pattern.label}`);
      if (transferFocus) record.companion.focus();
    } else if (record.action === 'annotate') {
      makeCompanion(record, 'annotation', `WARD: ${proposal.pattern.label}`);
    } else {
      record.action = 'allow';
      node.removeAttribute('data-ward-action');
    }

    if (record.action === 'allow') EXP.Activity.remove(id);
    else EXP.Activity.apply(id, record);

    return id;
  }

  function reveal(id) {
    const record = records.get(id);
    if (!record || record.action === 'allow') return false;
    clearPresentation(record);
    record.revealed = true;
    record.node.dataset.wardRevealed = '1';
    makeCompanion(record, 'reprotect', EXP.Patterns.get(record.patternId)?.label || 'protected content');
    EXP.Activity.reveal(id);
    EXP.Audit?.revealed?.(record.node);
    return true;
  }

  function endReveal(id) {
    const record = records.get(id);
    if (!record?.revealed) return false;
    record.node.removeAttribute('data-ward-revealed');
    record.revealed = false;
    EXP.Activity.conceal(id);
    EXP.Audit?.concealed?.(record.node);
    apply(record.node, {
      action: record.action,
      pattern: {
        id: record.patternId,
        category: record.category,
        label: EXP.Patterns.get(record.patternId)?.label || 'protected content'
      },
      confidence: record.confidence,
      structuralSafe: record.structuralSafe
    });
    return true;
  }

  function restore(id, forget = true) {
    const record = records.get(id);
    if (!record) return false;
    clearPresentation(record);
    record.node.removeAttribute('data-ward-revealed');
    record.node.removeAttribute('data-ward-instance');
    EXP.Activity.remove(id);
    if (forget) {
      records.delete(id);
      byNode.delete(record.node);
    }
    return true;
  }

  function restoreAll() {
    for (const id of [...records.keys()]) restore(id);
  }

  function cleanup() {
    restoreAll();
    style?.remove();
    style = null;
  }

  function snapshot() {
    return [...records.values()].map(
      ({ id, action, patternId, category, confidence, revealed, node }) => ({
        id,
        action,
        patternId,
        category,
        confidence,
        revealed,
        connected: node.isConnected
      })
    );
  }

  function prune() {
    for (const [id, record] of records) {
      if (record.node.isConnected) continue;
      record.companion?.remove();
      records.delete(id);
      byNode.delete(record.node);
      EXP.Activity.remove(id);
    }
  }

  return Object.freeze({ apply, reveal, endReveal, restore, restoreAll, cleanup, snapshot, prune });
})();
