EXP.ReleaseNotes = (() => {
  const notes = Object.freeze({
    '3.2.12': Object.freeze([
      'Preserves WARD settings across userscript updates by recovering from browser-local backup storage when manager storage is missing.',
      'Mirrors validated settings to both manager storage and the local fallback, and keeps the saved Full, Compact, or Narrow menu width.'
    ]),
    '3.2.11': Object.freeze([
      'Shows each automatic update notice once for that version instead of on every page load.',
      'Stacks simultaneous notices beside the complete launcher grid.',
      'Moves diagnostics and recovery actions under the final System menu.'
    ]),
    '3.2.10': Object.freeze([
      'Keeps every launcher clickable when multiple ExtraPotions products share the page.',
      'Prevents transparent launcher containers from intercepting pointer input.'
    ]),
    '3.2.9': Object.freeze([
      'Uses the borderless WARD launcher artwork everywhere an icon is shown.',
      'References the SVG by URL instead of embedding image bytes in the userscript.',
      'Removes the superseded bordered SVG and raster badge files.'
    ]),
    '3.2.8': Object.freeze([
      'Adds one global Automatic, Hide, or Dim choice for all protected content.',
      'Extends guarded Amazon ad and upsell coverage across home and order-history pages.',
      'Adds standardized Page, Technical, Console, and Plugin diagnostics with peer conflict reporting.',
      'Embeds the canonical WARD badge for userscript managers.'
    ]),
    '3.2.7': Object.freeze([
      "Hides complete Amazon display ads, sponsored product carousels, and sponsored Rufus questions.",
      "Hides verified sponsored search results instead of leaving them dimmed.",
      "Preserves purchasing information, temporary reveal, and protection preferences during page updates."
    ]),
    '3.2.6': Object.freeze([
      'Removes the decorative progress ring from the WARD launcher.',
      'Keeps the launcher at 48 px with 40 px artwork and the menu badge at 38 px.',
      'Uses the canonical WARD SVG as the userscript-manager icon.'
    ]),
    '3.2.5': Object.freeze([
      'Uses 48 px launcher buttons with 40 px artwork and an 8 px gap between launchers.',
      'Expands menu-header badge artwork to 38 px.',
      'Adds a dedicated 128 px raster badge derivative without changing either SVG source.'
    ]),
    '3.2.4': Object.freeze([
      'Shows concrete current-release changes when the WARD version control is opened.',
      'Includes the same concise changelog after WARD finishes updating.',
      'Keeps current-version and update-complete notices reliable whenever a notice is refreshed.'
    ]),
    '3.2.3': Object.freeze([
      'Shows concrete current-release changes when the WARD version control is opened.',
      'Includes the same concise changelog after WARD finishes updating.',
      'Keeps current-version and update-complete notices reliable under shared Core chrome.'
    ]),
    '3.2.2': Object.freeze([
      'Shows concrete current-release changes when the WARD version control is opened.',
      'Includes the same concise changelog after WARD finishes updating.',
      'Uses the latest release summary in update-available notices when GitHub provides it.'
    ]),
    '3.2.1': Object.freeze([
      'Restores visible dimming with a target-level fallback that survives blocked page styles.',
      'Keeps Amazon detector coverage accurate across incremental page updates.',
      'Protects current Amazon Business savings and insurance-and-warranty modules.'
    ]),
    '3.2.0': Object.freeze([
      'Adds reversible page and per-item protection controls with clear activity explanations.',
      'Completes Custom policy controls for actions, confidence, categories, patterns, and explanation detail.',
      'Adds CSP-safe page styling, Amazon fixture health coverage, coupon recovery, and adapter status reporting.'
    ])
  });
  function current() { return notes[EXP.VERSION] || Object.freeze(['Current WARD improvements and fixes.']); }
  return Object.freeze({ current });
})();
