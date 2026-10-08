EXP.VERSION = '3.4.13';

EXP.ReleaseNotes = (() => {
  const notes = Object.freeze({
    '3.4.13': ["Gives each menu category a distinct, meaningful icon.","Tightens typography and reduces panel width and spacing while preserving every control and setting.","Keeps readable text, menu-size preferences, compact tabs, and each product color."],
    '3.4.12': ["Matches the approved Lean menu proportions, header, flat surfaces, section navigation, compact tabs, controls, and footer.","Preserves every existing control and setting, each product color, readable menu sizes, and System last."],
    '3.4.11': ["Gives menus a lighter layout with subtle section dividers and softly filled tabs.","Keeps every existing control, setting, and product color, with consistent spacing and readable text."],
    '3.4.10': ["Organizes related menu settings into compact tabs, with System last.","Keeps your selected tab during menu refreshes and supports keyboard navigation."],
    '3.4.9': ["Adds Amazon Seller Clarity notes, optional search brand labels and an always-visible seller summary option.","Trust a brand to quiet brand and seller hints while keeping rating hints.","Keeps notes readable alongside SHIFT and removes outdated notes when listings change.","Keeps trusted-brand names out of diagnostics."],
    '3.4.8': ["Makes menu labels and captions easier to read at every size.","Aligns dropdowns, toggles, buttons, and section headings with consistent spacing.","Gives menus more room while keeping each product's signature colors."],
    '3.4.7': ["The standalone install is smaller while keeping all features bundled.","Existing shopping cleanup and recovery controls remain available."],
    '3.4.6': ["Keep Status open in System with its reason, recovery action, and recent activity.","Group Copy Diagnostics, Show Diagnostics, and Report a Problem under Support; reports include the current status.","Confirm Reset with a second tap inside the menu instead of browser dialogs.","Move Menu Preferences to the end of Appearance."],
    '3.4.5': ['Updates the shared foundation to exp-core 3.7.0.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.4.4': ["Simplify System to Product Timeline, Show and Copy Diagnostics, issue reporting, Menu Preferences, and Reset All Settings.","Open GitHub Issues with a prefilled product and version template.","Require two confirmations before clearing this product settings and stored data."],
    '3.4.3': ["Keep WARD's signature menu colors alongside other ExtraPotions products.","Show a clear System status with safe retry for a suspended protection scan.","Choose Standard, Large, or Extra Large menus on each site.","Show retailer coverage for supported complete units, conservative detection, and uncovered categories."],
    '3.4.2': ["Use product names without the retired V3 integration label in settings prompts and import messages.","Keep existing saved settings and settings exports compatible."],
    '3.4.1': ["Make small menu text easier to read, including captions, version badges, notices, and diagnostic details.","Use consistent sizes for labels and controls across the menu."],
    '3.4.0': ["Adds dedicated Target and Best Buy modules alongside Amazon, eBay, Etsy, and Walmart.","Review protection decisions, allow an unwanted intervention on this page, and record missed protection locally.","Adds a Calm Shopping preset and shared System > Site control."],
    '3.3.11': ['Updates the shared foundation to exp-core 3.4.13.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.3.10': ['Updates the shared foundation to exp-core 3.4.12.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.3.9': ["Removes retired menu-width preferences from stored settings without resetting other preferences.","Keeps the existing shared menu size and tests rendered layout instead of obsolete width-mode labels."],
    '3.3.8': ['Updates the shared foundation to exp-core 3.4.11.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.3.7': ['Updates the shared foundation to exp-core 3.4.10.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.3.6': ["Updates to exp-core 3.4.9.","Install Update now always installs the latest published release, never unreleased code.","Closing the menu on outside clicks now comes from exp-core, shared with the rest of the suite."],
    '3.3.5': ['Updates the shared foundation to exp-core 3.4.8.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.3.4': ["Stops running on smile.amazon.com, which Amazon retired in 2023 and which only redirects to www.amazon.com now.","Amazon shopping on www.amazon.com works exactly as before."],
    '3.3.3': ['Updates the shared foundation to exp-core 3.4.7.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.3.2': ['Updates the shared foundation to exp-core 3.4.6.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.3.1': ['Updates the shared foundation to exp-core 3.4.5.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.3.0': ["WARD now protects Walmart, eBay and Etsy as well as Amazon, each with its own on/off switch in the menu.","Popularity claims such as \"100+ bought since yesterday\" or \"In 20+ carts\" are dimmed, and store membership, financing and sponsored listings are collapsed.","Struck-through reference prices are labelled as not verified, never hidden or changed.","Buy, add-to-cart and checkout controls are never touched."],
    '3.2.31': ['Updates the shared foundation to exp-core 3.4.4.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.2.30': ['Updates the shared foundation to exp-core 3.4.3.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.2.29': ["Adds a Check for updates button that works without turning on update notifications.","Checks GitHub release information only when you press it and never installs anything.","Reports whether an update is available, the script is current, or the check failed.","Leaves everything else in the product unchanged."],
    '3.2.28': ['Updates the shared foundation to exp-core 3.4.2.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.2.27': ['Updates the shared foundation to exp-core 3.4.1.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.2.26': ['Updates the shared foundation to exp-core 3.4.0.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.2.25': ['Updates the shared foundation to exp-core 3.3.17.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.2.24': ['Updates the shared foundation to exp-core 3.3.16.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.2.23': ['Updates the shared foundation to exp-core 3.3.15.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.2.22': ['Updates the shared foundation to exp-core 3.3.13.','Rebuilds shared UI, launcher, diagnostics, notices, and coordination from the pinned Core release.','Leaves WARD product-specific engine behavior unchanged.'],
    '3.2.21': ['Adds the shared themed outer menu border across the ExtraPotions suite.','Keeps current Amazon protection behavior unchanged.','Retains the existing verified exp-core bundle while publishing the pending WARD shell update.'],
    '3.2.20': ['Lets every launcher move left, right, up, or down within the shared grid.','Persists launcher order and supports Alt+Arrow keyboard reordering.','Bundles exp-core 3.3.11 without changing Amazon protection behavior.'],
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
