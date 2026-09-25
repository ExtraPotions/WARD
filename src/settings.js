EXP.Settings = (() => {
  const PREFIX = 'exp:v3:ward';
  const SCHEMA = 1;
  const memory = new Map();
  const defaults = Object.freeze({
    schema: SCHEMA,
    enabled: true,
    amazonEnabled: true,
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
    menuWidth: 'compact',
    uiTheme: 'ward',
    menuAutoClose: true,
    menuNotifications: true,
    shortcut: '',
    categories: {},
    patterns: {}
  });
  let state;
  const listeners = new Set();
  const key = (name) => `${PREFIX}:${name}`;
  function read(name) { try { if (typeof GM_getValue === 'function') return GM_getValue(key(name), undefined); } catch {} try { const value = localStorage.getItem(key(name)); return value === null ? undefined : JSON.parse(value); } catch { return memory.get(key(name)); } }
  function write(name, value) { memory.set(key(name), value); try { if (typeof GM_setValue === 'function') { GM_setValue(key(name), value); return; } } catch {} try { localStorage.setItem(key(name), JSON.stringify(value)); } catch {} }
  function validate(candidate) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw Object.assign(new Error('Settings must be an object'), { code: 'SETTINGS_TYPE' });
    const next = structuredClone(defaults);
	const themeAliases = { warm: 'ember', discord: 'glacier', pine: 'verdant', obsidian: 'contrast' };
	const normalizedUiTheme = themeAliases[candidate.uiTheme] || candidate.uiTheme;
    for (const name of ['enabled', 'amazonEnabled', 'safeMode', 'autoClipCoupons', 'compactSearch', 'recommendationCleanup', 'nonColorIndicators', 'updateNotifications', 'menuAutoClose', 'menuNotifications']) if (typeof candidate[name] === 'boolean') next[name] = candidate[name];
    const enums = { protectionLevel: ['essential', 'balanced', 'custom'], contentAction: ['automatic', 'hide', 'dim'], confidencePolicy: ['confirmed', 'confirmed-supported', 'custom'], defaultAction: ['hide', 'dim', 'collapse', 'annotate', 'allow'], reducedMotion: ['system', 'reduce', 'allow'], explanationDetail: ['concise', 'detailed'], launcherPosition: ['automatic-end-bottom', 'end-top', 'end-bottom', 'start-top', 'start-bottom'], menuWidth: ['full', 'compact', 'narrow'], uiTheme: ['ember', 'midnight', 'glacier', 'contrast', 'verdant', 'pride', 'crimson', 'ward'] };
    for (const [name, values] of Object.entries(enums)) {
	  const value = name === 'uiTheme' ? normalizedUiTheme : candidate[name];
	  if (values.includes(value)) next[name] = value;
	}
    if (typeof candidate.shortcut === 'string' && candidate.shortcut.length <= 40) next.shortcut = candidate.shortcut;
    for (const field of ['categories', 'patterns']) if (candidate[field] && typeof candidate[field] === 'object' && !Array.isArray(candidate[field])) next[field] = Object.fromEntries(Object.entries(candidate[field]).filter(([id, value]) => /^[a-z][a-z0-9.-]+$/.test(id) && ['inherit', 'on', 'off'].includes(value)));
    return next;
  }
  function load() { state = validate(read('settings') || defaults); return snapshot(); }
  function snapshot() { return structuredClone(state || defaults); }
  function replace(value, reason = 'replace') { state = validate(value); write('settings', state); for (const listener of listeners) listener(snapshot(), reason); return snapshot(); }
  function update(patch, reason = 'update') { return replace({ ...snapshot(), ...patch }, reason); }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  function exportData() { return { product: 'ward', generation: 3, schema: SCHEMA, settings: snapshot() }; }
  function prepareImport(payload) { if (!payload || payload.product !== 'ward' || payload.generation !== 3 || payload.schema !== SCHEMA) throw Object.assign(new Error('Unsupported WARD export'), { code: 'IMPORT_SCHEMA' }); return validate(payload.settings); }
  return Object.freeze({ PREFIX, SCHEMA, defaults, validate, load, snapshot, replace, update, subscribe, exportData, prepareImport, hasStored: () => read('settings') !== undefined });
})();
