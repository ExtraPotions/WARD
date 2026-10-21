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
- README screenshots (`protection.png`, `amazon.png`, `look.png`) match `docs/screenshots.config.cjs`.

## Manual checks and publication

`siteDarkMode` defaults off. Look exposes the optional Obsidian page palette (#03060a, #1a2530, #495a68, #899ca7, #c9d7df), separately from the WARD menu theme. Scoped CSS covers the supported retailer adapters and recognized Shopify storefronts, without inversion, image changes, or purchasing-control handlers. Turning it off, Safe Mode, disabling the store or disabling WARD removes the owned stylesheet and root marker. Dynamic content inherits the same CSS. Fixture coverage does not establish live-site or third-party shadow/iframe coverage.

Build the changed product and choose relevant manual tests. `release:check` and `verify:release` remain optional diagnostics, including their legacy published Core-pin checks; neither is a publication prerequisite. Windows test runners use concurrency two.

Both GitHub workflows are manual: Manual tests runs the suite; Publish release uploads the selected commit's existing built assets and SHA256SUMS without rebuilding or testing. Commit generated files before an authorized publication. Publishing requires an explicit user request; commits, pushes and tag pushes do not start it. Existing releases are not overwritten.

Core synchronization is deliberate local work. There is no scheduled sync, automatic product release, pin wait or release-order gate. See the suite guide's Shipping section. Claim and handoff rules remain in workspace AGENTS.md.
