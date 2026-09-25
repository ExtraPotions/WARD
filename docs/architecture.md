# WARD V3 Architecture

WARD follows one processing chain:

```text
Retailer/page eligibility → Amazon adapter evidence → pattern definition
→ deterministic confidence → user policy → essential-information safety
→ reversible action → restoration ledger → local activity
```

## Modules

- `core.js`: bundled lifecycle, filtered DOM scheduler, navigation, launcher coordination, and sanitized diagnostics.
- `settings.js`: clean V3 schema, strict validation, import/export, and defaults.
- `patterns.js`: retailer-neutral retail-pressure concepts and supported presentation actions.
- `amazon-adapter.js`: Amazon page classification, selectors, evidence, exclusions, coupon target verification, and health.
- `activity.js`: deduplicated route/session counts without page content.
- `page-styles.js`: constructed page stylesheets with a managed fallback for CSP-constrained pages.
- `actions.js`: Hide, Dim, Collapse, Annotate, Allow, Temporary Reveal, and exact restoration.
- `layout.js`: retained off-by-default compact search compatibility behavior.
- `engine.js`: confidence/policy/safety resolution, coupon executor and recovery state, route lifecycle, and diagnostics.
- `release-notes.js`: version-keyed current release notes used by the in-app changelog.
- `updates.js`: opt-in bounded release-metadata check.
- `ui.js`: compact three-section menu, activity explanations, adapter health, and control wiring.
- `main.js`: lifecycle composition.

Amazon selectors do not appear in the pattern/action modules. Detectors do not click or mutate retailer content. The sole approved native activation is Auto-clip coupons, which runs through its dedicated engine path and cannot be reused as an unrestricted click helper.

## Confidence and safety

- Confirmed evidence may use a pattern-supported configured action.
- Supported evidence cannot Hide by default.
- Ambiguous or mixed essential-information evidence is Annotated or Allowed.
- Blocked evidence is Allowed.

Essential information includes price, seller, fulfillment, variation, quantity, availability, delivery, coupon/subscription/credit/protection terms, consent, cart, checkout, payment, and order controls.

## State and cleanup

Settings use `exp:v3:ward` schema 1. No predecessor key is read. Interventions are route-scoped and store only WARD-owned presentation state. Disable, Safe Mode, route changes, adapter failure, and cleanup restore WARD changes and cancel queued work. Core-owned History API wrappers are restored only if still owned by this instance.

## Coupon executor

The executor accepts only recognized, connected, enabled, unclaimed native coupon controls outside unsafe checkout/purchase/enrollment contexts. It activates once, verifies checked or recognized claimed state, and counts success only after verification. No confirmation is a failure; unexpected navigation quarantines coupon processing for the route. The Amazon menu reports that state and requires an explicit Resume action before retrying after quarantine.

## Adapter fixtures

Sanitized local fixtures cover Amazon home, search, product, cart, checkout, and dynamic-widget page families. Each fixture declares the detector IDs expected to match, and the browser suite validates the adapter coverage report without collecting retailer text.

## Privacy

Runtime state and diagnostics contain pattern/detector IDs, actions, confidence bands, counts, timing, health, and bounded error codes. They exclude matched text, product/coupon content, price, seller/account data, search/cart contents, full URLs, HTML, and raw error strings.
