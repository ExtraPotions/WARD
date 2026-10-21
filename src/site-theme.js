// Optional page colors, independent of WARD's menu theme. No image inversion or DOM rewriting.
EXP.SiteTheme = (() => {
  const attribute = 'data-exp-ward-site-theme';
  let sheet, previous;
  const scope = 'html[data-exp-ward-site-theme="obsidian"]';
  const native = ':not(:where([id^="exp-"],[id^="exp-"] *,[data-exp-owned],[data-exp-owned] *))';
  const css = `
${scope}{color-scheme:dark;background-color:#03060a!important;color:#c9d7df!important}
${scope} :where(body,main,header,nav,aside,footer,section,article,div,form,fieldset,dialog,ul,ol,li,table,thead,tbody,tr,td,th)${native}{background-color:#03060a!important;border-color:#495a68!important}
${scope} :where(body,body *)${native}:not(:where(img,picture,video,canvas,svg,svg *,iframe)){color:#c9d7df!important}
${scope} :where(input,textarea,select,button,[role="button"],[role="dialog"],[role="menu"],[role="listbox"])${native}{background-color:#1a2530!important;color:#c9d7df!important;border-color:#899ca7!important;caret-color:#c9d7df}
${scope} :where(small,time,[role="note"])${native}{color:#899ca7!important}
${scope} :where(input,textarea)${native}::placeholder{color:#899ca7!important;opacity:1}
${scope} :where(a[href])${native}{color:#c9d7df!important;text-decoration-color:#899ca7!important}
${scope} :where(button,[role="button"],a[href])${native}:hover{background-color:#1a2530!important}
${scope} :where(:focus-visible)${native}{outline:2px solid #c9d7df!important;outline-offset:2px}
${scope} ::selection{background:#495a68;color:#c9d7df}
`;
  function clear() {
    sheet?.remove(); sheet = null;
    if (previous !== undefined && document.documentElement.getAttribute(attribute) === 'obsidian') {
      if (previous === null || previous === undefined) document.documentElement.removeAttribute(attribute);
      else document.documentElement.setAttribute(attribute, previous);
    }
    previous = undefined;
  }
  function apply(settings = EXP.Settings.snapshot()) {
    const enabled = settings.enabled && settings.siteDarkMode && !settings.safeMode &&
      EXP.Retailer.enabled(settings) && !ExtraPotionsCore.suiteSitePaused();
    if (!enabled) { clear(); return; }
    if (!sheet?.active()) sheet = EXP.PageStyles.inject(css, { product:'ward', role:'site-theme' });
    if (previous === undefined) previous = document.documentElement.getAttribute(attribute);
    if (document.documentElement.getAttribute(attribute) !== 'obsidian') document.documentElement.setAttribute(attribute, 'obsidian');
  }
  return Object.freeze({ apply, clear });
})();
