// Optional page colors, independent of WARD's menu theme. No image inversion or DOM rewriting.
// Core supplies the palettes and the scoped style; Obsidian stays WARD's own dark palette.
EXP.SiteTheme = (() => {
  const obsidianTokens = { bg:'#03060a', panel:'#03060a', raised:'#1a2530', inset:'#1a2530', line:'#495a68', text:'#c9d7df', muted:'#899ca7', accent:'#c9d7df', onAccent:'#03060a' };
  const extra = Object.freeze([Object.freeze({ id:'obsidian', name:'Obsidian', dark:obsidianTokens, light:obsidianTokens })]);
  const native = ':not(:where([id^="exp-"],[id^="exp-"] *,[data-exp-owned],[data-exp-owned] *))';
  // Store buttons, badges and key chips paint their own colours, so they keep both their background and their text.
  const painted = ':not(:where([class*="button"],[class*="button"] *,[class*="badge-"],[class*="badge-"] *,[class*="Badge"],[class*="Badge"] *,[class*="promotion"],[class*="promotion"] *,[class*="shortcut-key"]))';
  // Light palettes keep store headers whose logo artwork is white.
  const header = ':not(:where([id^="navbar"],[id^="navbar"] *))';
  // Store pages share no colour variables, so surfaces, text and controls are recoloured directly.
  const css = (p, scope) => {
    const scheme = p.id === 'obsidian' ? 'dark' : p.mode, keep = native + (scheme === 'light' ? header : '');
    return `
${scope}{color-scheme:${scheme};background-color:${p.bg}!important;color:${p.text}!important}
${scope} :where(body,main,header,nav,aside,footer,section,article,div,form,fieldset,dialog,ul,ol,li,table,thead,tbody,tr,td,th)${keep}${painted}{background-color:${p.bg}!important;border-color:${p.line}!important}
${scope} :where(body,body *)${keep}${painted}:not(:where(img,picture,video,canvas,svg,svg *,iframe)){color:${p.text}!important}
${scope} :where(input,textarea,select,button,[role="button"],[role="dialog"],[role="menu"],[role="listbox"])${keep}${painted}{background-color:${p.raised}!important;color:${p.text}!important;border-color:${p.muted}!important;caret-color:${p.text}}
${scope} :where(small,time,[role="note"])${keep}${painted}{color:${p.muted}!important}
${scope} :where(input,textarea)${keep}::placeholder{color:${p.muted}!important;opacity:1}
${scope} :where(a[href])${keep}${painted}{color:${p.id === 'obsidian' ? p.text : p.accent}!important;text-decoration-color:${p.muted}!important}
${scope} :where(button,[role="button"],a[href])${keep}${painted}:hover{background-color:${p.raised}!important}
${scope} :where(:focus-visible)${keep}{outline:2px solid ${p.id === 'obsidian' ? p.text : p.accent}!important;outline-offset:2px}
${scope} ::selection{background:${p.line};color:${p.text}}
`;
  };
  let colors;
  const controller = () => colors ??= ExtraPotionsCore.createSiteColors({ product:'ward', css, extra });
  const choices = () => [['off','Off'], ...[...extra, ...ExtraPotionsCore.sitePalettes].map(p => [p.id, p.name])];
  function clear() { colors?.clear(); }
  function apply(settings = EXP.Settings.snapshot()) {
    const enabled = settings.enabled && settings.siteColors !== 'off' && !settings.safeMode &&
      EXP.Retailer.enabled(settings) && !ExtraPotionsCore.suiteSitePaused();
    if (!enabled) { clear(); return; }
    controller().apply(settings.siteColors);
  }
  return Object.freeze({ apply, clear, choices, ids:() => choices().map(([id]) => id) });
})();
