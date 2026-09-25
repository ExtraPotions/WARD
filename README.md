<p align="center">
  <img src="assets/ward-launcher.svg" width="128" height="128" alt="WARD icon">
</p>

<h1 align="center">WARD</h1>

<p align="center"><strong>Retail Pressure Protection</strong></p>

<p align="center">
  A privacy-first shopping companion for reducing supported retail pressure, upsells, urgency, sponsorships, and promotional distractions.
</p>

<p align="center">
  <img alt="Violentmonkey Supported" src="https://img.shields.io/badge/Violentmonkey-Supported-7C3AED?style=flat-square">
  <img alt="Tampermonkey Supported" src="https://img.shields.io/badge/Tampermonkey-Supported-00A67E?style=flat-square">
  <img alt="Chrome Supported" src="https://img.shields.io/badge/Chrome-Supported-F9AB00?style=flat-square&logo=googlechrome&logoColor=000000">
  <img alt="Firefox Supported" src="https://img.shields.io/badge/Firefox-Supported-FF7139?style=flat-square&logo=firefoxbrowser&logoColor=white">
  <img alt="PolyForm Noncommercial 1.0.0" src="https://img.shields.io/badge/Code-PolyForm%20NC%201.0.0-6B7280?style=flat-square">
  <img alt="CC BY-NC-SA 4.0" src="https://img.shields.io/badge/Assets-CC%20BY--NC--SA%204.0-1769AA?style=flat-square">
</p>

## Install

<p>
  <a href="https://raw.githubusercontent.com/ExtraPotions/WARD/main/ward.user.js?v=3.2.12">
    <img alt="Install WARD" src="https://img.shields.io/badge/Install-WARD-7A1F2B?style=flat-square">
  </a>
  <img alt="Version 3.2.12" src="https://img.shields.io/badge/version-3.2.12-22C55E?style=flat-square">
  <a href="https://github.com/ExtraPotions/WARD/releases">
    <img alt="GitHub Downloads" src="https://img.shields.io/github/downloads/ExtraPotions/WARD/total?style=flat-square&label=Downloads">
  </a>
</p>

## What WARD Does

- Identifies supported Amazon pressure, upsell, urgency, sponsorship, and recommendation patterns.
- Applies reversible Allow, Dim, Collapse, Hide, Annotate, and Temporary Reveal actions.
- Protects essential purchasing controls by downgrading unsafe structural actions.
- Can auto-clip eligible coupons with visible status, quarantine, and recovery controls.
- Explains intervention decisions without collecting page text, form values, selectors, URLs, or markup.
- Provides Essential, Balanced, and Custom protection with adapter health and activity diagnostics.

### Amazon ad coverage

Complete sponsored search results, Amazon display-ad placements, sponsored product-detail carousels, and sponsored Rufus questions are hidden under the default Balanced policy. Ad disclosures are hidden with their placement. Product details, purchasing controls, reviews, and ordinary recommendations remain available; mixed purchasing content retains the essential-information safeguards. Custom actions, disabled categories, temporary reveal, and restoration still apply.

### Choose Hide or Dim

Open **Protection → Content action** and choose **Hide** or **Dim** for all protected content. The choice applies immediately, is remembered across reloads, and takes precedence over recommendation cleanup and the protection-level defaults. **Automatic** restores the selected protection level's behavior. Hide falls back to Dim for unsupported or structurally unsafe content; essential purchasing information remains visible. Disabled categories and patterns stay disabled. In Custom mode, Default action applies when Content action is Automatic.

## Screenshots

<table>
  <tr><th width="20%">Overview</th><th width="20%">WARD</th><th width="20%">Pride</th><th width="20%">High contrast</th><th width="20%">Fixture</th></tr>
  <tr><td align="center"><img src="docs/screenshots/menu-overview.png" width="180" alt="WARD menu overview"></td><td align="center"><img src="docs/screenshots/ward-gem.png" width="180" alt="WARD menu in the WARD theme"></td><td align="center"><img src="docs/screenshots/pride.png" width="180" alt="WARD menu in the Pride theme"></td><td align="center"><img src="docs/screenshots/high-contrast.png" width="180" alt="WARD menu in the High Contrast theme"></td><td align="center"><img src="docs/screenshots/current-fixture.png" width="180" alt="WARD on a controlled Amazon fixture"></td></tr>
</table>

## Diagnostics and product compatibility

Use **Show Diagnostics** / **Hide Diagnostics**, then **Copy Diagnostics** when troubleshooting. Reports include **Page**, **Technical**, **Console**, and **Plugin** sections, identify active ExtraPotions products and visible conflicts on the current page, and are never uploaded automatically.

## License

**Code:** [PolyForm Noncommercial License 1.0.0](LICENSE-CODE.md)<br>
**Artwork and documentation:** [CC BY-NC-SA 4.0](LICENSE-ASSETS.md)

See [NOTICE.md](NOTICE.md) for the split-license notice.

## Disclaimer

WARD is an independent project and is not affiliated with or endorsed by Amazon.
