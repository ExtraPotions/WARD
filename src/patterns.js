EXP.Patterns = (() => {
  const definitions = [
    { id: 'upsell.membership.prime', category: 'upsell', label: 'Prime membership promotion', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'pressure.urgency', category: 'urgency', label: 'Urgency message', defaultAction: 'dim', allowedActions: ['dim', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'pressure.scarcity', category: 'scarcity', label: 'Scarcity message', defaultAction: 'annotate', allowedActions: ['dim', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'pressure.subscription', category: 'subscription', label: 'Subscription promotion', defaultAction: 'collapse', allowedActions: ['dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'upsell.financial-product', category: 'upsell', label: 'Credit or installment promotion', defaultAction: 'collapse', allowedActions: ['dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'upsell.protection-plan', category: 'upsell', label: 'Protection-plan promotion', defaultAction: 'collapse', allowedActions: ['dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'upsell.business-membership', category: 'upsell', label: 'Amazon Business promotion', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'sponsorship.placement', category: 'sponsored', label: 'Sponsored placement', defaultAction: 'hide', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'complete-placement-only' },
    { id: 'cross-sell.recommendation', category: 'cross-sell', label: 'Cross-sell recommendation', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'complete-placement-only' },
    { id: 'upsell.amazon-service', category: 'upsell', label: 'Amazon service promotion', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'pressure.shopping-assistant', category: 'shopping-assistant', label: 'AI shopping assistant prompt', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'complete-placement-only' }
  ].map((item) => Object.freeze({ ...item }));
  const byId = new Map(definitions.map((item) => [item.id, item]));
  function validate() {
    if (byId.size !== definitions.length) throw Object.assign(new Error('Duplicate pattern ID'), { code: 'PATTERN_DUPLICATE' });
    for (const item of definitions) if (!item.allowedActions.includes(item.defaultAction) || !item.essentialPolicy) throw Object.assign(new Error('Invalid pattern definition'), { code: 'PATTERN_INVALID' });
    return true;
  }
  validate();
  return Object.freeze({ all: () => definitions.slice(), get: (id) => byId.get(id), has: (id) => byId.has(id), validate });
})();
