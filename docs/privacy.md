# WARD Privacy

WARD performs retailer detection, pattern decisions, page interventions, coupon verification, activity counting, and diagnostics locally in the browser.

WARD does not collect or transmit:

- page or matched text;
- product names, prices, sellers, availability, or delivery details;
- account, payment, address, cart, checkout, or order data;
- search terms, browsing history, coupon text, or coupon values;
- copied DOM/HTML or full page URLs.

Activity contains local category/action/count/status/reason records only. Diagnostics contain bounded product/Core/adapter versions, page-type and detector/pattern IDs, confidence/action/safety states, coupon execution status, processing counts, and sanitized error codes.

Update notifications are off by default. If enabled, WARD requests only bounded release metadata from the configured ExtraPotions GitHub endpoint. No page, activity, coupon, or settings data is included.

WARD loads no remote executable code, selector lists, fonts, images, analytics, or telemetry.
