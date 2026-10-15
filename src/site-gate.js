// WARD is listed for every https page because Shopify storefronts share no domain. Nothing of WARD or its Core
// runs until this gate passes: on the stores named in the metadata it passes at once, and on any other page only
// when the parsed page is a Shopify storefront. Shopify checkout and embedded frames never pass.
const wardGate = (storeHosts, run) => {
  if (storeHosts.includes(location.hostname)) { run(); return; }
  if (window.top !== window.self || /\/checkouts?\//.test(location.pathname)) return;
  const check = () => { if (document.querySelector('#shopify-features,meta[name="shopify-digital-wallet"],meta[name="shopify-checkout-api-token"]')) run(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check, { once: true });
  else check();
};
