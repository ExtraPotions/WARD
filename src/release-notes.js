EXP.VERSION = '3.2.19';

EXP.ReleaseNotes = (() => {
  const notes = Object.freeze({
    '3.2.19': ['Adds layered menu surfaces so protection controls remain distinct at every menu width.','Uses accessible semantic colors for links, focus indicators, and accent text.','Bundles the verified exp-core 3.3.10 artifact without changing Amazon intervention behavior.'],
    '3.2.18': ["Compacts System menus and keeps menu width controls together on one row.","Groups existing menu preferences consistently while preserving saved settings.","Removes automatic Settings Backup and its restore controls.","Adds a Bitcoin donation option with address copying and wallet support."],
    '3.2.17': ["Restores Full, Compact, and Narrow menu-width controls under System.","Applies width changes immediately and remembers the selection after reload.","Keeps wide menus within the available viewport on small screens."],
    '3.2.16': ["Bundles exp-core 3.3.8 with section arrangement and viewport-safe menus.","Preserves remembered page exceptions and intervention explanations.","Refreshes the README and feature screenshots in a horizontal gallery."],
    '3.2.15': ["Adds remembered per-page exceptions for individual protection patterns.","Displays intervention reasons and keeps allowed content out of active protections.","Adds settings backups, rollback, and compatibility details through exp-core 3.3.7."],
    '3.2.14': ["Rebuilds on exp-core 3.3.6 with the shared donation button and launcher menu coordination.","Uses Firefox-safe settings copies and content-context injection.","Preserves existing Amazon protections without affiliate link rewriting."],
    '3.2.13': Object.freeze([
      'Uses the same menu-width notice surface for Current Version, Update Available, and Update Complete, matching Dropper.',
      'Forces a fresh update check for each newly installed WARD version instead of inheriting the previous version\'s 15-minute throttle or stale remote version.',
      'Reports separate progress-card, launcher, launcher-row, menu, and notice geometry, and limits resource-error details to ownership plus asset hostname.'
    ]),
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
