EXP.Settings = (() => {
  const PREFIX = 'exp:v3:ward';
  const SCHEMA = 1;
  const memory = new Map();
  const defaults = Object.freeze({
    schema: SCHEMA,
    enabled: true,
    retailers: Object.freeze({ amazon: true, walmart: true, ebay: true, etsy: true, target:true, bestbuy:true }),
    protectionReviews: [],
    protectionLevel: 'balanced',
    contentAction: 'automatic',
    confidencePolicy: 'confirmed-supported',
    defaultAction: 'collapse',
    safeMode: false,
    autoClipCoupons: true,
    compactSearch: false,
    recommendationCleanup: true,
    reducedMotion: 'system',
    nonColorIndicators: true,
    explanationDetail: 'concise',
    updateNotifications: false,
    launcherPosition: 'automatic-end-bottom',
    uiTheme: 'ward',
    menuAutoClose: true,
    menuNotifications: true,
    shortcut: '',
    categories: {},
    pageExceptions: [],
    patterns: {}
  });
  let state;
  const listeners = new Set();
  const key = (name) => `${PREFIX}:${name}`;
  function read(name) {
    const storageKey = key(name);
    try {
      if (typeof GM_getValue === 'function') {
        const value = GM_getValue(storageKey, undefined);
        if (value !== undefined) return value;
      }
    } catch {}
    try {
      const value = localStorage.getItem(storageKey);
      if (value !== null) {
        const parsed = JSON.parse(value);
        memory.set(storageKey, parsed);
        try { if (typeof GM_setValue === 'function') GM_setValue(storageKey, parsed); } catch {}
        return parsed;
      }
    } catch {}
    return memory.get(storageKey);
  }
  function write(name, value) {
    const storageKey = key(name);
    memory.set(storageKey, value);
    try { if (typeof GM_setValue === 'function') GM_setValue(storageKey, value); } catch {}
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch {}
  }
  function validate(candidate) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw Object.assign(new Error('Settings must be an object'), { code: 'SETTINGS_TYPE' });
    const next = ExtraPotionsCore.cloneSettings(defaults);
	const themeAliases = { warm: 'ember', discord: 'glacier', pine: 'verdant', obsidian: 'contrast' };
	const normalizedUiTheme = themeAliases[candidate.uiTheme] || candidate.uiTheme;
    for (const name of ['enabled', 'safeMode', 'autoClipCoupons', 'compactSearch', 'recommendationCleanup', 'nonColorIndicators', 'updateNotifications', 'menuAutoClose', 'menuNotifications']) if (typeof candidate[name] === 'boolean') next[name] = candidate[name];
    // One switch per store. The earlier single amazonEnabled setting migrates into it.
    const stores = { ...defaults.retailers };
    if (typeof candidate.amazonEnabled === 'boolean') stores.amazon = candidate.amazonEnabled;
    if (candidate.retailers && typeof candidate.retailers === 'object' && !Array.isArray(candidate.retailers)) {
      for (const key of Object.keys(stores)) if (typeof candidate.retailers[key] === 'boolean') stores[key] = candidate.retailers[key];
    }
    next.retailers = stores;
    const enums = { protectionLevel: ['essential', 'balanced', 'custom'], contentAction: ['automatic', 'hide', 'dim'], confidencePolicy: ['confirmed', 'confirmed-supported', 'custom'], defaultAction: ['hide', 'dim', 'collapse', 'annotate', 'allow'], reducedMotion: ['system', 'reduce', 'allow'], explanationDetail: ['concise', 'detailed'], launcherPosition: ['automatic-end-bottom', 'end-top', 'end-bottom', 'start-top', 'start-bottom'], uiTheme: ['ember', 'midnight', 'glacier', 'contrast', 'verdant', 'pride', 'crimson', 'ward'] };
    for (const [name, values] of Object.entries(enums)) {
	  const value = name === 'uiTheme' ? normalizedUiTheme : candidate[name];
	  if (values.includes(value)) next[name] = value;
	}
    if (typeof candidate.shortcut === 'string' && candidate.shortcut.length <= 40) next.shortcut = candidate.shortcut;
    for (const field of ['categories', 'patterns']) if (candidate[field] && typeof candidate[field] === 'object' && !Array.isArray(candidate[field])) next[field] = Object.fromEntries(Object.entries(candidate[field]).filter(([id, value]) => /^[a-z][a-z0-9.-]+$/.test(id) && ['inherit', 'on', 'off'].includes(value)));
    next.pageExceptions=Array.isArray(candidate.pageExceptions)?candidate.pageExceptions.filter(v=>v&&typeof v.path==='string'&&v.path.length<=500&&typeof v.patternId==='string'&&/^[a-z][a-z0-9.-]+$/.test(v.patternId)).slice(0,200).map(v=>({path:v.path,patternId:v.patternId})):[];
    next.protectionReviews=Array.isArray(candidate.protectionReviews)?candidate.protectionReviews.filter(v=>v&&['correct','wrong','missed'].includes(v.verdict)&&/^[a-z][a-z0-9.-]+$/.test(v.patternId)&&Object.keys(stores).includes(v.retailer)).slice(-100).map(v=>({verdict:v.verdict,patternId:v.patternId,retailer:v.retailer,at:Number(v.at)||0})):[];
    next.uiTheme = 'ward';
    return next;
  }
  function load() {
    const stored = read('settings');
    state = validate(stored || defaults);
    write('settings', state);
    return snapshot();
  }
  function snapshot() { return ExtraPotionsCore.cloneSettings(state || defaults); }
  function replace(value, reason = 'replace') { const next=validate(value);state=next;write('settings', state); for (const listener of listeners) listener(snapshot(), reason); return snapshot(); }
  function update(patch, reason = 'update') { return replace({ ...snapshot(), ...patch }, reason); }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  function exportData() { return { product: 'ward', generation: 3, schema: SCHEMA, settings: snapshot() }; }
  function prepareImport(payload) { if (!payload || payload.product !== 'ward' || payload.generation !== 3 || payload.schema !== SCHEMA) throw Object.assign(new Error('Unsupported WARD export'), { code: 'IMPORT_SCHEMA' }); return validate(payload.settings); }
  return Object.freeze({PREFIX, SCHEMA, defaults, validate, load, snapshot, replace, update, subscribe, exportData, prepareImport, hasStored: () => read('settings') !== undefined });
})();
