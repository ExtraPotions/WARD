# WARD development

Suite-wide steps (shared Core changes, release order, screenshots, adding a product) are in [exp-core's maintainer guide](https://github.com/ExtraPotions/exp-core/blob/main/docs/development.md). This page covers what is specific to WARD.

## Source layout

- `src/` holds the modules. `scripts/build.cjs` lists them in load order and wraps them, with the vendored Core, into `ward.user.js`. Add a new module to that list.
- Each store has an adapter (`amazon-adapter.js`, `walmart-adapter.js` and so on) registered through `src/retailers.js`. The comment at the top of that file lists what an adapter must provide. Supporting another store means writing an adapter, registering it, adding it to the build list and adding its fixtures.
- `src/release-notes.js` holds the in-app release notes and `QUIET_RELEASES`.
- `vendor/exp-core/` is the bundled Core. Change it only by syncing from exp-core.
- [architecture.md](architecture.md) explains the processing chain and safety rules; [privacy.md](privacy.md) lists what WARD stores.

## Commands

WARD's tests live in `tests-v3/`, not `tests/`.

| Task | Command |
|---|---|
| Build | `npm run build` |
| Check the build is current | `npm run build:check` |
| Full suite | `npm test`, or after a build `node --test --test-concurrency=2 tests-v3/*.test.cjs` |
| Release check | `npm run release:check` |
| Fallback check | `npm run test:fallback` |
| README screenshots | `npm run screenshots` (exp-core must sit beside WARD) |
| Feature release | `RELEASE_NOTES_JSON='["…","…"]' npm run prepare:release:feature` (add `RELEASE_QUIET=1` for a quiet one) |

## Things the checks hold fixed

- The release check counts `setInterval` calls in the readable build. It allows the launcher host protection interval and the two status refresh timers, and nothing else. Run this optional check when reviewing timer changes.
- The install stays between 100 and 425 KB.
- README screenshots (`protection.gif`, `amazon.png`, `look.png`) match `docs/screenshots.config.cjs`.

## Manual checks and publication

`siteColors` defaults to `off`. Look exposes a Site colors select, separately from the WARD menu theme: WARD's own Obsidian palette (#03060a, #1a2530, #495a68, #899ca7, #c9d7df) plus the six shared Core palettes, which follow the system light/dark preference. A saved `siteDarkMode: true` migrates to `obsidian`. Settings validation keeps a static id list so it does not depend on load order.

Site colors uses the suite's existing role-aware color math in src/site-color.js, with a WARD-scoped computed-paint renderer in src/site-theme.js. Neutral surfaces, controls and foregrounds are paired; semantic purchase/status fills retain readable native colors. Transparent layers stay transparent. Gradient color stops, including element and pseudo-element review fades, are converted without changing stop alpha or URL image payloads. Media overlays pin their native text colors instead of inheriting unrelated page text. Actual photo rectangles retain native backplates while multiply compositing is normalized; large gallery/card wrappers remain themed. Image sources and filters are unchanged. Small monochrome SVG control backgrounds follow the selected palette.

The renderer batches native reads before scoped writes, processes the viewport and a buffer, and revisits content on scroll, resize, focus/hover, stylesheet/image load and class/style/control-state changes. It uses Core's lifecycle injector with GM_addElement/GM_addStyle grants. Inline-important paint uses scoped variables whose fallback is the site's original declaration; Off, Safe Mode, retailer disable and WARD disable remove paint and restore owned declarations/markers without resetting unrelated styles. No new purchase handlers or third-party runtime dependency are added. All seven adapters and palettes have light/dark coverage, including CSP fallback, alpha fades, contrast, dynamic inline-important controls, cleanup and rendered photo RGB checks. Live-page evidence remains separate from fixture and installed-manager/iPad acceptance.


Light neutral shadow colors are transformed without changing geometry or alpha, including Amazon's viewport-sized backdrop shadow. Amazon video-card headers preserve the native artwork text choice. Repeating root-page textures blend with the palette while retaining their URLs, and do not exempt descendants from theming. Interactive controls over media use their own paired colors; small SVG controls resolve currentColor against the themed surface. Amazon's monochrome Share/dropdown/popover sprite controls invert on dark parents, and neutral pseudo-element borders follow the palette. Scoped per-node rules override retailer utility selectors without changing controls or layout.

Build the changed product and choose relevant manual tests. `release:check` and `verify:release` remain optional diagnostics, including their legacy published Core-pin checks; neither is a publication prerequisite. Windows test runners use concurrency two.

Both GitHub workflows are manual: Manual tests runs the suite; Publish release uploads the selected commit's existing built assets and SHA256SUMS without rebuilding or testing. Commit generated files before an authorized publication. Publishing requires an explicit user request; commits, pushes and tag pushes do not start it. Existing releases are not overwritten.

Core synchronization is deliberate local work. There is no scheduled sync, automatic product release, pin wait or release-order gate. See the suite guide's Shipping section. Claim and handoff rules remain in workspace AGENTS.md.

Settings persist in isolated userscript-manager storage. Existing page-storage copies are archived and verified in manager storage before removal; originals are retained if archival fails. Failed writes stay temporary with a retry action. Malformed settings enter safe recovery without overwriting saved data. Recovery exports and an explicit safe-defaults action remain available.
