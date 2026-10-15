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

- The release check counts `setInterval` calls in the readable build. It allows the launcher host protection interval and the two status refresh timers, and nothing else. A new interval fails the release in CI, so run `release:check` locally after any timer change.
- The install stays between 100 and 425 KB.
- README screenshots (`protection.png`, `amazon.png`) match `docs/screenshots.config.cjs`.
