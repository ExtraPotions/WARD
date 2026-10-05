// Seller Clarity reads brand, seller, fulfillment and rating facts that the store
// already shows and adds a short note when they deserve a second look. Everything is
// read from the current page, nothing is sent anywhere, and diagnostics keep only
// signal IDs and counts. Store adapters supply the facts; this module stays
// store-neutral and never clicks, hides or changes store content.
EXP.SellerClarity = (() => {
  const OWNER = 'seller-clarity';
  // Short all-caps names that are established brands rather than generated ones.
  const ESTABLISHED = new Set(['SCHWINN', 'STRYKER', 'KRYPTONITE', 'BRITA', 'NZXT', 'SKLZ', 'TRXTRAINING', 'DEWALT', 'RYOBI', 'ZAGG', 'OTTERBOX', 'NETGEAR', 'SKULLCANDY', 'CRKT', 'KRK', 'SHURE', 'BLACKWING', 'VTECH']);
  const SIGNALS = Object.freeze({
    'seller.not-brand': { kind: 'hint', text: 'Sold by a third-party seller that is not the brand or the store.' },
    'brand.generated-name': { kind: 'hint', text: 'Brand name looks machine-generated, a pattern common to rebadged generic products.' },
    'ratings.polarized': { kind: 'hint', text: 'Ratings are split between many 5-star and many 1-star reviews.' },
    'ratings.thin-high': { kind: 'hint', text: 'A very high score from only a few ratings.' }
  });
  let style;
  let notes = new Set();
  let counts = Object.create(null);

  function normalize(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  function generatedBrandName(raw) {
    const name = String(raw || '').trim();
    if (!/^[A-Z]{5,10}$/.test(name) || ESTABLISHED.has(name)) return false;
    const runs = name.split(/[AEIOUY]/).map((part) => part.length);
    if (!/[AEIOUY]/.test(name)) return true;
    return Math.max(...runs) >= 4;
  }

  function sellerIsBrand(seller, brand) {
    const a = normalize(seller), b = normalize(brand);
    if (!a || !b) return false;
    return a.includes(b) || b.includes(a);
  }

  function trusted(brand, settings) {
    const key = normalize(brand);
    return Boolean(key) && (settings.trustedBrands || []).includes(key);
  }

  // facts: { brand, seller, firstParty, shipsFrom, rating, ratingCount, distribution:{1..5 percent} }
  function signalsFor(facts, settings) {
    const found = [];
    if (!facts) return found;
    const brandTrusted = trusted(facts.brand, settings);
    if (facts.seller && !facts.firstParty && facts.brand && !sellerIsBrand(facts.seller, facts.brand) && !brandTrusted) found.push('seller.not-brand');
    if (facts.brand && !brandTrusted && generatedBrandName(facts.brand)) found.push('brand.generated-name');
    const share = facts.distribution || {};
    if (Number(share[5]) >= 55 && Number(share[1]) >= 15) found.push('ratings.polarized');
    if (Number(facts.ratingCount) > 0 && Number(facts.ratingCount) < 25 && Number(facts.rating) >= 4.7) found.push('ratings.thin-high');
    return found;
  }

  function ensureStyles() {
    if (style?.active()) return;
    style = EXP.PageStyles.inject(`
      .exp-ward-clarity{
        display:block!important;
        box-sizing:border-box!important;
        max-width:560px!important;
        margin:8px 0!important;
        padding:8px 10px!important;
        border:1px solid rgba(40,92,150,.35)!important;
        border-radius:6px!important;
        background:rgba(232,242,255,.8)!important;
        color:#1d3550!important;
        font:500 12px/1.4 system-ui,sans-serif!important;
        text-align:left!important
      }
      .exp-ward-clarity-title{display:block!important;margin:0 0 4px!important;font-weight:800!important}
      .exp-ward-clarity-facts{display:block!important;margin:0 0 4px!important;opacity:.85!important}
      .exp-ward-clarity-list{margin:0 0 6px!important;padding:0 0 0 16px!important;list-style:disc!important}
      .exp-ward-clarity-list li{margin:2px 0!important}
      .exp-ward-clarity-trust{
        display:inline-block!important;
        padding:3px 8px!important;
        border:1px solid rgba(40,92,150,.45)!important;
        border-radius:5px!important;
        background:#fff!important;
        color:#1d3550!important;
        font:700 11px/1.25 system-ui,sans-serif!important;
        cursor:pointer!important
      }
      .exp-ward-clarity-trust:focus-visible{outline:2px solid #1b70c9!important;outline-offset:2px!important}
      .exp-ward-clarity-chip{
        display:inline-block!important;
        margin:2px 4px!important;
        padding:2px 5px!important;
        border:1px solid rgba(40,92,150,.35)!important;
        border-radius:5px!important;
        background:rgba(232,242,255,.8)!important;
        color:#1d3550!important;
        font:700 10px/1.2 system-ui,sans-serif!important
      }
    `, { wardSellerClarity: '1' });
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function own(node) {
    node.dataset.expOwned = '1';
    node.dataset.wardOwner = OWNER;
    notes.add(node);
    return node;
  }

  function count(id) { counts[id] = (counts[id] || 0) + 1; }

  function trustBrand(brand) {
    const key = normalize(brand);
    if (!key) return;
    const current = EXP.Settings.snapshot().trustedBrands || [];
    if (current.includes(key)) return;
    EXP.Settings.update({ trustedBrands: [...current, key] }, 'trusted-brand');
  }

  function renderProduct(facts, signals, settings) {
    const showAll = settings.sellerClarityAlways === true;
    if (!signals.length && !showAll) return;
    const anchor = facts.anchor;
    if (!anchor?.isConnected) return;
    const digest = JSON.stringify([signals, facts.brand, facts.seller, facts.shipsFrom]);
    const existing = anchor.nextElementSibling;
    if (existing?.dataset?.wardOwner === OWNER && existing.dataset.wardDigest === digest) return;
    if (existing?.dataset?.wardOwner === OWNER) { notes.delete(existing); existing.remove(); }
    ensureStyles();
    const note = own(element('div', 'exp-ward-clarity'));
    note.dataset.wardDigest = digest;
    note.setAttribute('role', 'note');
    note.setAttribute('aria-label', 'WARD seller clarity');
    note.append(element('strong', 'exp-ward-clarity-title', signals.length ? 'Seller clarity: worth a second look' : 'Seller clarity'));
    const summary = [
      facts.brand ? `Brand: ${facts.brand}` : '',
      facts.seller ? `Sold by: ${facts.seller}` : '',
      facts.shipsFrom ? `Ships from: ${facts.shipsFrom}` : ''
    ].filter(Boolean);
    if (summary.length) note.append(element('span', 'exp-ward-clarity-facts', summary.join(' · ')));
    if (signals.length) {
      const list = element('ul', 'exp-ward-clarity-list');
      for (const id of signals) { const item = element('li', '', SIGNALS[id].text); item.dataset.wardSignal = id; list.append(item); }
      note.append(list);
    }
    if (facts.brand && signals.some((id) => id === 'seller.not-brand' || id === 'brand.generated-name')) {
      const button = element('button', 'exp-ward-clarity-trust', `Trust ${facts.brand}`);
      button.type = 'button';
      button.addEventListener('click', () => trustBrand(facts.brand));
      note.append(button);
    }
    anchor.after(note);
    for (const id of signals) count(id);
  }

  function renderListing(listing, settings) {
    if (!listing?.brandNode?.isConnected || trusted(listing.brand, settings) || !generatedBrandName(listing.brand)) return;
    const next = listing.brandNode.nextElementSibling;
    if (next?.dataset?.wardOwner === OWNER) return;
    ensureStyles();
    const chip = own(element('span', 'exp-ward-clarity-chip', 'Generated-style brand'));
    chip.title = SIGNALS['brand.generated-name'].text;
    chip.dataset.wardSignal = 'brand.generated-name';
    listing.brandNode.after(chip);
    count('brand.generated-name');
  }

  function active(settings) {
    return EXP.Retailer.enabled(settings) && !settings.safeMode && settings.sellerClarity !== false && EXP.Retailer.supportsSellerClarity();
  }

  function process(roots, settings, pageType) {
    if (!active(settings)) { clear(); return; }
    if (pageType === 'product') {
      const facts = EXP.Retailer.sellerFacts(document);
      if (facts) renderProduct(facts, signalsFor(facts, settings), settings);
    } else if (pageType === 'search' && settings.sellerClaritySearch !== false) {
      for (const listing of EXP.Retailer.listingBrands(roots)) renderListing(listing, settings);
    }
    for (const node of [...notes]) if (!node.isConnected) notes.delete(node);
  }

  function clear() {
    for (const node of notes) node.remove();
    for (const node of document.querySelectorAll(`[data-ward-owner="${OWNER}"]`)) node.remove();
    notes = new Set();
    counts = Object.create(null);
  }

  function cleanup() { clear(); style?.remove(); style = null; }

  function snapshot() { return { notes: notes.size, signals: { ...counts } }; }

  return Object.freeze({ SIGNALS, generatedBrandName, sellerIsBrand, signalsFor, process, clear, cleanup, snapshot, normalize });
})();
