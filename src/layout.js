EXP.Layout = (() => {
  let style;
  function apply(settings, pageType) {
    const enabled = settings.enabled && settings.amazonEnabled && !settings.safeMode && settings.compactSearch && pageType === 'search';
    if (!enabled) { style?.remove(); style = null; return; }
    if (style?.active()) return;
    style = EXP.PageStyles.inject(`
      [data-component-type="s-search-result"]{margin-block:4px!important;padding-block:6px!important}
      [data-component-type="s-search-result"] .a-section{margin-bottom:4px!important}
    `, { wardLayout:'compact-search' });
  }
  function cleanup() { style?.remove(); style = null; }
  return Object.freeze({ apply, cleanup, active: () => Boolean(style?.active()) });
})();
