## 3.2.9 - 2026-09-25

- Uses the borderless WARD launcher artwork everywhere an icon is shown.
- References the SVG by URL instead of embedding image bytes in the userscript.
- Removes the superseded bordered SVG and raster badge files.

## 3.2.8 - 2026-09-25

- Adds one global Automatic, Hide, or Dim choice for all protected content.
- Extends guarded Amazon ad and upsell coverage across home and order-history pages.
- Adds standardized Page, Technical, Console, and Plugin diagnostics with peer conflict reporting.
- Embeds the canonical WARD badge for userscript managers.

## 3.2.7 - 2026-09-25

- Hides complete Amazon display ads, sponsored product carousels, and sponsored Rufus questions.
- Hides verified sponsored search results instead of leaving them dimmed.
- Preserves purchasing information, temporary reveal, and protection preferences during page updates.

## 3.2.6 - 2026-09-24

- Removes the decorative progress ring from the WARD launcher.
- Keeps the launcher at 48 px with 40 px artwork and the menu badge at 38 px.
- Uses the canonical WARD SVG as the userscript-manager icon.

## 3.2.5 - 2026-09-24

- Uses 48 px launcher buttons with 40 px artwork and an 8 px gap between launchers.
- Expands menu-header badge artwork to 38 px.
- Adds a dedicated 128 px raster badge derivative without changing either SVG source.

## 3.2.4 - 2026-09-24

- Shows a concise, concrete current-release changelog from the WARD version control.
- Includes the same release summary in the update-complete notice after installation.
- Preserves stable current-version and update-complete notice roles whenever a notice is refreshed.

## 3.2.3 - 2026-09-24

- Shows a concise, concrete current-release changelog from the WARD version control.
- Includes the same release summary in the update-complete notice after installation.
- Keeps current-version and update-complete notices independently identifiable under shared Core chrome.

## 3.2.2 - 2026-09-24

- Shows a concise, concrete current-release changelog from the WARD version control.
- Includes the same release summary in the update-complete notice after installation.
- Uses concise GitHub release bullets in update-available notices when provided.

## 3.2.1 - 2026-09-24

- Restores visible dimming with target-level presentation that survives blocked page styles.
- Keeps adapter coverage cumulative for the current route instead of replacing it on each mutation batch.
- Adds current Amazon Business savings and insurance-and-warranty module coverage.

## 3.2.0 - 2026-09-24

- Adds page-wide and per-item controls to reveal content and reapply protection.
- Completes Custom mode with action, confidence, explanation, category, and pattern policies.
- Adds privacy-safe activity explanations, coupon status and recovery, and Amazon adapter health.
- Moves intervention and compact-search styling to a CSP-safe constructed stylesheet service.
- Adds route-specific Amazon fixtures, current generated release notes, a refreshed screenshot capture manifest, and a browser-independent release check.

## 3.1.13 — 2026-09-24

- Limits shared launcher and theme coordination to the active ExtraPotions products.
- Stops shared audits from tracking the archived CLARITY and Mockingbird repositories.
- Pins the bundled Core reference to the verified Dropper 3.2.13 release artifact.

## 3.1.12 — 2026-09-24

- Packs installed product launchers into Dropper's compact progress rail and restores the normal grid when the obstacle closes.

## 3.1.11 — 2026-09-24

- Adds the locked eight-palette system with deep Crimson and a new WARD gem.
- Migrates saved legacy palette names to their closest new direction.

## 3.1.1

- Made repeated interventions idempotent so unchanged protected elements stop triggering WARD's own mutation loop.
- Temporary reveals now persist through ordinary rescans until explicitly restored or navigation changes.
- Essential, Balanced, and Custom now use distinct protection policies instead of silently sharing the hidden default action.
- Recommendation cleanup now runs through the same policy/audit path as every other intervention.
- Audit decisions update when target safety changes, disconnected targets are pruned, and reveal state is kept current.
- Added regressions for settling behavior, reveal persistence, policy levels, audit freshness, stale-target pruning, and recommendation cleanup.

## 3.1.0

- Added a privacy-safe current-page intervention audit ledger.
- Diagnostics now separate detected, acted, downgraded, skipped, revealed, duplicate-target, and structural-safety counts.
- Each audited target reports detector, pattern, confidence, requested action, applied action, structural safety, and decision reason without page text or selectors.
- Added duplicate-detector target reporting and current-route audit reset on rebuild/navigation.
- Added regression coverage for all 11 Amazon detector families, surrounding-content preservation, reveal/restore, policy skips, structural downgrades, SPA navigation, and diagnostics privacy.

## 3.0.9

- Added DOM-safety classification for Amazon structural interventions.
- Dynamic media, follow/creator, Rufus, live-region, and carousel widgets now avoid `hide`/`collapse` mutations.
- Unsafe structural actions downgrade to `dim`, then `annotate`, instead of forcing `hidden`, `display:none`, or `inert`.
- Narrowed recommendation cleanup to verified static recommendation containers.
- Added `structuralCollapseSkipped` and reason counts to diagnostics activity totals.

## 3.0.8

- Reworked collapsed protection replacements into compact `Protected by WARD` reveal strips.
- Reduced visual noise from dimmed and annotated interventions.
- Simplified the main menu to Protection, Appearance, and Amazon.
- Moved individual Amazon pattern switches behind a Customize control.
- Moved diagnostics, settings transfer, and reset tools out of the main navigation.
- Standardized the menu on a compact 260px layout and removed conflicting menu-shell geometry.

## 3.0.7

- Dropdown option text matches other menu label text at 11px.
- Pride header divider matches other menu rainbow dividers (full bar, not a faded hairline).

## 3.0.6

- Pride menu uses a full rainbow border, divider, and accents—not just a pink overlay.
- Keeps helper tips inside the viewport when the launcher sits at the top.
- Trims redundant tips from menu section names.

# Changelog

## 3.0.5 — 2026-09-20

- Four-row ExtraPotions menu: This page, Look, Tools, and Menu.
- Launcher host protection from Amazon overlays.
- Live Amazon pages stay interactive during DOM updates.
- One bundled userscript — no slices or install loader.

## 3.0.4 — 2026-09-20

- Menu stays interactive on live Amazon pages.
- Activity updates in place instead of rebuilding open controls.
- Launcher clicks no longer cancel before a drag starts.

## 3.0.3 — 2026-09-20

- Six-row ExtraPotions menu: This page, Look, Read, Tools, Menu, and Recover.
- Look holds palette; Read holds accessibility; Recover holds Safe Mode and diagnostics.

## 3.0.2 — 2026-09-20

- Four-row menu aligned with SHIFT, CLARITY, and PRISMA.
- Pattern switches in Tools; palette and accessibility in Look.

## 3.0.1 — 2026-09-19

- Removed redundant status cards; diagnostics retained.
- Dropdowns fit all menu widths; transfer actions share a row.
- Recovery controls grouped with a separator above Amazon reset.

## 3.0.0 — Local candidate

- Rebuilt the Amazon predecessor as modular WARD V3 with bundled Core 3 and a clean schema-1 namespace.
- Separated retailer eligibility, Amazon detection, generic patterns, deterministic confidence, safety policy, reversible actions, restoration, activity, layout compatibility, UI, updates, and lifecycle.
- Added distinct Hide, Dim, Collapse, Annotate, Allow, and Temporary Reveal outcomes.
- Preserved all audited Amazon feature families and retained recommendation/compact-search behavior pending no-gap transfer.
- Replaced automatic Prime navigation, media-format selection, transaction selection changes, and commercial-text rewriting with safe presentation behavior.
- Retained automatic coupon clipping as enabled by default with a dedicated eligibility/verification/quarantine contract.
- Added adapter health, Safe Mode, sanitized diagnostics, SPA lifecycle cleanup, accessibility controls, reproducible builds, browser fixtures, and release checks.
- Added the exact supplied WARD SVG reference and 48 px/32 px derivatives.
- Reworked the first rejected menu UX into a WARD-specific warm visual system with grouped task navigation, protection/retailer status summaries, content-fit sizing, consolidated recovery, and corrected modal focus/launcher behavior.

No GitHub release has been created.
## 3.1.8

- Migrated menu chrome, palettes, diagnostics, and launcher placement to the Dropper 3.2.8 Core contract.
- Preserved audited protection policies, reversible interventions, and guarded coupon handling.
- Added browser parity coverage for matte controls, floating notices, and coordinated launchers.
