EXP.Settings = (() => {
  const PREFIX = 'exp:v3:ward';
  const SCHEMA = 1;
  const memory = new Map();
  const defaults = Object.freeze({
    schema: SCHEMA,
    enabled: true,
    retailers: Object.freeze({ amazon: true, walmart: true, ebay: true, etsy: true, target:true, bestbuy:true, shopify:true }),
    protectionReviews: [],
    protectionLevel: 'balanced',
    contentAction: 'automatic',
    confidencePolicy: 'confirmed-supported',
    defaultAction: 'collapse',
    safeMode: false,
    autoClipCoupons: true,
    compactSearch: false,
    siteColors: 'off',
    recommendationCleanup: true,
    sellerClarity: true,
    sellerClaritySearch: true,
    sellerClarityAlways: false,
    trustedBrands: [],
    reducedMotion: 'system',
    nonColorIndicators: true,
    explanationDetail: 'concise',
    updateNotifications: true,
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
  let storageError='',invalidSaved,unsaved=false,readFailed=false;
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function managerWrite(storageKey,value) {
    if(typeof GM_setValue!=='function'||typeof GM_getValue!=='function')throw Error('Manager storage is unavailable. Changes are temporary.');
    GM_setValue(storageKey,ExtraPotionsCore.cloneSettings(value));
    if(!same(GM_getValue(storageKey,undefined),value))throw Error('Settings were not saved. Retry saving.');
  }
  function pageCopy(storageKey){try{return localStorage.getItem(storageKey);}catch{return null;}}
  // Preserve the exact legacy bytes in isolated storage before removing a page-readable copy.
  function archivePageCopy(storageKey) {
    const text=pageCopy(storageKey);if(text===null)return;
    const backup=key('page-settings-backup:'+encodeURIComponent(location.origin||location.hostname));
    const previous=typeof GM_getValue==='function'?GM_getValue(backup,[]):[];
    const copies=Array.isArray(previous)?previous:[];
    managerWrite(backup,copies.includes(text)?copies:[...copies,text]);
    localStorage.removeItem(storageKey);
  }
  function read(name) {
    if(ExtraPotionsCore.productDataResetting?.('ward'))return undefined;
    const storageKey=key(name);
    if(unsaved&&memory.has(storageKey))return memory.get(storageKey);
    readFailed=false;
    try {
      if(typeof GM_getValue==='function'){
        const value=GM_getValue(storageKey,undefined);
        if(value!==undefined)return value;
      }
      const text=pageCopy(storageKey);
      return text===null?memory.get(storageKey):JSON.parse(text);
    } catch {readFailed=true;storageError='Saved data could not be read. Reload or export before retrying.';return memory.get(storageKey);}
  }
  function write(name,value) {
    if(ExtraPotionsCore.productDataResetting?.('ward'))return false;
    const storageKey=key(name);memory.set(storageKey,ExtraPotionsCore.cloneSettings(value));
    try {managerWrite(storageKey,value);unsaved=false;storageError='';
      try{archivePageCopy(storageKey);}catch{storageError='Settings saved. A legacy page copy could not be archived.';}
      return true;
    }catch{unsaved=true;storageError='Settings are temporary. Storage is unavailable; retry saving.';return false;}
  }
  function validate(candidate) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw Object.assign(new Error('Settings must be an object'), { code: 'SETTINGS_TYPE' });
    const next = ExtraPotionsCore.cloneSettings(defaults);
	const themeAliases = { warm: 'ember', discord: 'glacier', pine: 'verdant', obsidian: 'contrast' };
	const normalizedUiTheme = themeAliases[candidate.uiTheme] || candidate.uiTheme;
    for (const name of ['enabled', 'safeMode', 'autoClipCoupons', 'compactSearch', 'recommendationCleanup', 'sellerClarity', 'sellerClaritySearch', 'sellerClarityAlways', 'nonColorIndicators', 'updateNotifications', 'menuAutoClose', 'menuNotifications']) if (typeof candidate[name] === 'boolean') next[name] = candidate[name];
    // Site colors replaced the single Obsidian switch; an enabled switch keeps Obsidian.
    if (['off','obsidian','default','indigo','blue','green','red','gray'].includes(candidate.siteColors)) next.siteColors = candidate.siteColors;
    else if (candidate.siteDarkMode === true) next.siteColors = 'obsidian';
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
    next.trustedBrands=Array.isArray(candidate.trustedBrands)?[...new Set(candidate.trustedBrands.filter(v=>typeof v==='string'&&/^[a-z0-9]{1,60}$/.test(v)))].slice(-200):[];
    next.uiTheme = 'ward';
    return next;
  }
  function load() {
    const stored = read('settings');
    if(unsaved&&state)return snapshot();
    try{state = validate(stored ?? defaults);invalidSaved=undefined;}
    catch{invalidSaved=ExtraPotionsCore.cloneSettings(stored);state=ExtraPotionsCore.cloneSettings(defaults);state.safeMode=true;storageError='Saved settings need recovery. Original data is preserved.';return snapshot();}
    if(readFailed){state.safeMode=true;return snapshot();}
    write('settings', state);
    return snapshot();
  }
  function snapshot() { return ExtraPotionsCore.cloneSettings(state || defaults); }
  function diagnosticSnapshot(value = snapshot()) {
    const { trustedBrands, pageExceptions, ...settings } = value;
    return { ...settings, trustedBrandCount: trustedBrands.length, pageExceptionCount: pageExceptions.length };
  }
  function replace(value,reason='replace') {
    if(ExtraPotionsCore.productDataResetting?.('ward'))return snapshot();
    if(readFailed){storageError='Saved data is unreadable. Retry before changing settings.';return snapshot();}
    const next=validate(value);
    if(invalidSaved!==undefined){
      try{managerWrite(key('recovery:'+Date.now()),invalidSaved);}catch{storageError='Original data could not be backed up. Retry recovery.';return snapshot();}
    }
    state=next;invalidSaved=undefined;write('settings',next);
    for(const listener of listeners)listener(snapshot(),reason);return snapshot();
  }
  function storageStatus(){return {error:storageError,unsaved,recovery:invalidSaved!==undefined};}
  function recoveryData(){return {product:'ward',saved:invalidSaved===undefined?read('settings'):ExtraPotionsCore.cloneSettings(invalidSaved)};}
  function retrySave(){if(readFailed){read('settings');if(readFailed)return snapshot();storageError='';return load();}if(invalidSaved!==undefined)return replace({...defaults,safeMode:true},'recover-settings');write('settings',snapshot());for(const listener of listeners)listener(snapshot(),'retry-save');return snapshot();}
  function update(patch, reason = 'update') { return replace({ ...snapshot(), ...patch }, reason); }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  function exportData() { return { product: 'ward', generation: 3, schema: SCHEMA, settings: snapshot() }; }
  function prepareImport(payload) { if (!payload || payload.product !== 'ward' || payload.generation !== 3 || payload.schema !== SCHEMA) throw Object.assign(new Error('Unsupported WARD export'), { code: 'IMPORT_SCHEMA' }); return validate(payload.settings); }
  function resetAll() {
    ExtraPotionsCore.clearProductData('ward');
    memory.clear();storageError='';invalidSaved=undefined;unsaved=false;state = ExtraPotionsCore.cloneSettings(defaults);
    for (const listener of listeners) listener(snapshot(), 'product-reset');
    return snapshot();
  }
  return Object.freeze({storageStatus,recoveryData,retrySave,resetAll, PREFIX, SCHEMA, defaults, validate, load, snapshot, diagnosticSnapshot, replace, update, subscribe, exportData, prepareImport, hasStored: () => read('settings') !== undefined });
})();
