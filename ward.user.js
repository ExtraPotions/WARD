// ==UserScript==
// @name         WARD
// @namespace    https://github.com/ExtraPotions
// @version      3.2.31
// @description  Local retail-pressure protection, initially for Amazon.
// @icon         https://raw.githubusercontent.com/ExtraPotions/WARD/main/assets/ward-launcher.svg
// @tag          shopping
// @tag          dark-patterns
// @tag          privacy
// @author       ExtraPotions
// @license      PolyForm-Noncommercial-1.0.0
// @homepageURL  https://github.com/ExtraPotions/WARD
// @supportURL   https://github.com/ExtraPotions/WARD/issues
// @updateURL    https://github.com/ExtraPotions/WARD/releases/latest/download/ward.user.js
// @downloadURL  https://github.com/ExtraPotions/WARD/releases/latest/download/ward.user.js
// @match        https://www.amazon.com/*
// @match        https://smile.amazon.com/*
// @match        https://www.walmart.com/*
// @match        https://www.ebay.com/*
// @match        https://cart.ebay.com/*
// @match        https://pay.ebay.com/*
// @match        https://www.etsy.com/*
// @run-at       document-start
// @inject-into  content
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// ==/UserScript==
// WARD Manager Metadata
// Description: Local retail-pressure protection, initially for Amazon.
// Tags: shopping, dark-patterns, privacy

(() => {
'use strict';
const EXP = Object.create(null);

// Native exp-core foundation. Shared UI primitives are owned and maintained here.
const CoreFoundation = (() => {
const LAUNCHER_ORDER_KEY = "exp:v3:launcher-order";
const LAUNCHER_GRID_DELTA_KEY = "exp:v3:launcher-grid-delta";
const PRIDE_RAINBOW = "linear-gradient(90deg,#c84e66,#d07840,#be9f37,#3b8a5f,#3d79a6,#7455a4)";

const PRIDE_RAINBOW_VERTICAL = "linear-gradient(180deg,#c84e66,#d07840,#be9f37,#3b8a5f,#3d79a6,#7455a4)";

const CRIMSON_THEME = Object.freeze({ id:"crimson", name:"Crimson", swatch:"linear-gradient(135deg,#0c0508 0 38%,#941f2f 38% 69%,#2f746e 69% 100%)", canvas:"#0c0508", surface:"#1d090f", primary:"#941f2f", companion:"#5e2144", counterpoint:"#2f746e", interactive:"#b63243", bg:"#0c0508", panel:"#1d090f", line:"#4a1b28", text:"#e5d2d7", muted:"#ae8b94", accent:"#941f2f", accent2:"#b63243", skin:"linear-gradient(135deg,#941f2f 0%,#5e2144 52%,#2f746e 100%)", skinVertical:"linear-gradient(180deg,#941f2f 0%,#5e2144 52%,#2f746e 100%)" });

const UI_THEMES = Object.freeze([
    { id:"ember", name:"Ember", swatch:"linear-gradient(135deg,#120807 0 38%,#c9512c 38% 69%,#b68a32 69% 100%)", canvas:"#120807", surface:"#24100c", primary:"#c9512c", companion:"#8f2d3f", counterpoint:"#b68a32", interactive:"#e16a3b", bg:"#120807", panel:"#24100c", line:"#4e2a22", text:"#f1ddd2", muted:"#b99787", accent:"#c9512c", accent2:"#e16a3b", skin:"linear-gradient(135deg,#c9512c 0%,#8f2d3f 52%,#b68a32 100%)", skinVertical:"linear-gradient(180deg,#c9512c 0%,#8f2d3f 52%,#b68a32 100%)" },
    { id:"midnight", name:"Midnight", swatch:"linear-gradient(135deg,#050a12 0 38%,#3563a3 38% 69%,#348f8b 69% 100%)", canvas:"#050a12", surface:"#0c1726", primary:"#3563a3", companion:"#65558f", counterpoint:"#348f8b", interactive:"#477abd", bg:"#050a12", panel:"#0c1726", line:"#26364b", text:"#d4deeb", muted:"#91a2b7", accent:"#3563a3", accent2:"#477abd", skin:"linear-gradient(135deg,#3563a3 0%,#65558f 52%,#348f8b 100%)", skinVertical:"linear-gradient(180deg,#3563a3 0%,#65558f 52%,#348f8b 100%)" },
    { id:"glacier", name:"Glacier", swatch:"linear-gradient(135deg,#061216 0 38%,#4a9eaa 38% 69%,#92b85b 69% 100%)", canvas:"#061216", surface:"#0d252a", primary:"#4a9eaa", companion:"#5c76a4", counterpoint:"#92b85b", interactive:"#67b7c1", bg:"#061216", panel:"#0d252a", line:"#29464b", text:"#d8ebee", muted:"#8fa9ae", accent:"#4a9eaa", accent2:"#67b7c1", skin:"linear-gradient(135deg,#4a9eaa 0%,#5c76a4 52%,#92b85b 100%)", skinVertical:"linear-gradient(180deg,#4a9eaa 0%,#5c76a4 52%,#92b85b 100%)" },
    { id:"contrast", name:"High contrast", swatch:"linear-gradient(135deg,#000000 0 48%,#ffffff 48% 78%,#ffd400 78% 100%)", canvas:"#000000", surface:"#0a0a0a", primary:"#ffffff", companion:"#bfbfbf", counterpoint:"#ffd400", interactive:"#ffd400", bg:"#000000", panel:"#0a0a0a", line:"#ffffff", text:"#ffffff", muted:"#e0e0e0", accent:"#ffffff", accent2:"#ffd400", skin:"linear-gradient(135deg,#ffffff 0%,#bfbfbf 55%,#ffd400 100%)", skinVertical:"linear-gradient(180deg,#ffffff 0%,#bfbfbf 55%,#ffd400 100%)" },
    { id:"verdant", name:"Verdant", swatch:"linear-gradient(135deg,#06110d 0 38%,#318c61 38% 69%,#2f7f86 69% 100%)", canvas:"#06110d", surface:"#0d2218", primary:"#318c61", companion:"#667c3c", counterpoint:"#2f7f86", interactive:"#49a879", bg:"#06110d", panel:"#0d2218", line:"#28483a", text:"#d7e9df", muted:"#93aa9e", accent:"#318c61", accent2:"#49a879", skin:"linear-gradient(135deg,#318c61 0%,#667c3c 52%,#2f7f86 100%)", skinVertical:"linear-gradient(180deg,#318c61 0%,#667c3c 52%,#2f7f86 100%)" },
    { id:"pride", name:"Pride", swatch:"linear-gradient(135deg,#c84e66 0%,#d07840 16.6%,#be9f37 33.3%,#3b8a5f 50%,#3d79a6 66.6%,#7455a4 100%)", canvas:"#100a12", surface:"#1d1222", primary:"#c34f7d", companion:"#7555a6", counterpoint:"#328c82", interactive:"#dd6793", bg:"#100a12", panel:"#1d1222", line:"#4a2b50", text:"#f0ddea", muted:"#b89db4", accent:"#c34f7d", accent2:"#dd6793", skin:PRIDE_RAINBOW, skinVertical:PRIDE_RAINBOW_VERTICAL },
    { id:"twitch", name:"Twitch", swatch:"linear-gradient(135deg,#18181b 0 48%,#9147ff 48% 78%,#bf94ff 78% 100%)", canvas:"#111114", surface:"#19191e", primary:"#9147ff", companion:"#772ce8", counterpoint:"#bf94ff", interactive:"#bf94ff", bg:"#111114", panel:"#19191e", line:"#34343b", text:"#efeff1", muted:"#adadb8", accent:"#9147ff", accent2:"#bf94ff", skin:"linear-gradient(135deg,#9147ff,#bf94ff)", skinVertical:"linear-gradient(180deg,#9147ff,#bf94ff)", skinMode:"flat" },
    { id:"dropper", name:"Dropper gem", swatch:"linear-gradient(135deg,#0b0713 0 38%,#7a46c8 38% 69%,#2a8c9b 69% 100%)", canvas:"#0b0713", surface:"#171025", primary:"#7a46c8", companion:"#b14589", counterpoint:"#2a8c9b", interactive:"#9864dc", bg:"#0b0713", panel:"#171025", line:"#3c2850", text:"#e8ddf2", muted:"#aa98bb", accent:"#7a46c8", accent2:"#9864dc", skin:"linear-gradient(135deg,#7a46c8 0%,#b14589 52%,#2a8c9b 100%)", skinVertical:"linear-gradient(180deg,#7a46c8 0%,#b14589 52%,#2a8c9b 100%)" }
  ]);
const SHARED_UI_THEMES = Object.freeze(UI_THEMES.slice(0, 6));

function css() {
    return `
      :host { all: initial; }
      * { box-sizing: border-box; }
      .exp-core-theme {
        position: fixed; right: 12px; z-index: 2147483600;
        display: flex; flex-direction: column-reverse; align-items: flex-end;
        width: max-content; max-width: calc(100vw - 24px); gap: 8px;
        --theme-bg:#111114; --theme-panel:#19191e; --theme-raised:#2a2a31; --theme-inset:#0e0e10; --theme-line:#34343b; --theme-text:#efeff1; --theme-muted:#adadb8; --theme-accent:#9147ff; --theme-accent2:#bf94ff; --theme-link:#c6a4ff; --theme-focus:#bf94ff; --theme-onAccent:#111114; --theme-skin:linear-gradient(135deg,#d9b5ff,#9b5af9,#7428e8); --theme-skin-vertical:linear-gradient(180deg,#d9b5ff,#9b5af9,#7428e8); --exp-ui-opacity:1; --exp-menu-width:312px;
        font: 13px/1.42 ui-sans-serif, system-ui, "Segoe UI", sans-serif; color: var(--theme-text);
      }
      .exp-core-theme.open-up { flex-direction: column; }
      [data-exp-part="dock"],
      .update-notice {
        opacity:var(--exp-ui-opacity,1);
        transition:opacity .15s ease;
      }
      .exp-core-theme[data-panel-width="compact"] [data-exp-part="dock"],
      .exp-core-theme[data-panel-width="compact"] > .update-notice[data-placement="menu"] {
        width:min(260px, calc(100vw - 24px));
      }
      .exp-core-theme[data-panel-width="narrow"] [data-exp-part="dock"],
      .exp-core-theme[data-panel-width="narrow"] > .update-notice[data-placement="menu"] {
        width:min(220px, calc(100vw - 24px));
      }
      .exp-core-theme[data-panel-width="full"] [data-exp-part="dock"],
      .exp-core-theme[data-panel-width="full"] > .update-notice[data-placement="menu"] {
        width:min(var(--exp-menu-width,312px), calc(100vw - 24px));
      }
      .progress-age { color:#a7a7b0; }
      .progress-age.warn { color:#f59e0b; }
      .progress-age.bad { color:#ef4444; font-weight:800; }
      /* 3.2.0 progress panel */
      .exp-core-theme{pointer-events:none!important}
      .exp-core-theme :is([data-exp-part="dock"],.update-notice,[data-exp-part="launcher"]){pointer-events:auto!important}
      .exp-core-theme .badge-row{position:fixed!important;min-height:112px!important;height:auto!important;justify-content:flex-end!important;align-items:center!important;pointer-events:none!important}

      .badge-row {display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:8px!important;width:100%!important;min-height:112px!important;height:auto!important;position:relative!important}

      [data-exp-part="launcher"] {
        position:relative; width:48px; min-width:48px; height:48px; min-height:48px; align-self:flex-end; padding:0; margin:0;
        display:grid; place-items:center; border:1px solid color-mix(in srgb,var(--theme-accent) 30%,transparent); border-radius:10px;
        background:var(--theme-panel,#18181b); box-shadow:0 6px 22px #0006; cursor:grab; touch-action:none; user-select:none;
        transition:.14s border-color,.14s box-shadow,.14s background,.14s transform;
      }
      .action-separator{grid-column:1/-1;width:100%;border:0;border-top:1px solid var(--theme-line,#34343b);margin:8px 0 0}
      .stream-subsection-label{grid-column:1/-1;min-width:0;margin:1px 0 2px;color:var(--theme-accent2);font-size:8px;font-weight:900;line-height:1.2;letter-spacing:.08em;text-transform:uppercase}
      .stream-subsection-label.with-divider{margin-top:7px;padding-top:8px;border-top:1px solid var(--theme-line,#34343b)}
      .queue-switches{display:grid;grid-template-columns:minmax(58px,.7fr) minmax(0,1.3fr);column-gap:10px;row-gap:0;min-width:0;margin:6px 0;padding:2px 0;border:0;align-items:stretch}
      .queue-switches-label{grid-column:1;grid-row:1/span 3;display:flex;align-items:center;min-width:0;font-size:11px;font-weight:700;line-height:1.2;color:var(--theme-text,#efeff1)}
      .queue-switches>.fl-switch{grid-column:2;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:10px;min-width:0;padding:5px 0!important;text-align:left!important}
      .queue-switches>.fl-switch>span:first-child{display:block;flex:1 1 auto;width:auto!important;min-width:0!important;min-height:0!important;white-space:normal!important;word-break:normal!important;overflow-wrap:normal!important;line-height:1.25;text-align:left}
      .queue-switches>.fl-switch>.toggleSwitch{flex:0 0 34px;margin-left:auto}
      .appearance-separator{grid-column:1/-1;width:100%;border:0;border-top:1px solid var(--theme-line,#34343b);margin:3px 0 1px}
      .opacity-row{grid-column:1/-1;display:grid;grid-template-columns:auto minmax(72px,1fr) auto;align-items:center;gap:6px;min-width:0;padding:4px 0;border-top:1px solid #26262b}
      .opacity-row[hidden]{display:none!important}
      .opacity-row>span{font-size:11px;line-height:1.25;white-space:nowrap}
      [data-exp-part="opacity-range"]{width:100%;min-width:0;accent-color:var(--theme-accent)}
      [data-exp-part="opacity-value"]{min-width:34px;text-align:right;font-size:10px;font-weight:800;color:var(--theme-muted)}
      .exp-core-theme[data-panel-width="narrow"] .opacity-row{grid-template-columns:1fr auto}
      .exp-core-theme[data-panel-width="narrow"] [data-exp-part="opacity-range"]{grid-column:1/-1}
      [data-exp-part="launcher"]:hover {
        border-color:color-mix(in srgb,var(--theme-accent) 58%,transparent);
        background:color-mix(in srgb,var(--theme-panel,#18181b) 96%,var(--theme-accent) 4%);
        box-shadow:0 8px 24px #0007; transform:scale(1.015);
      }
      [data-exp-part="launcher"][aria-expanded="true"] {
        border-color:color-mix(in srgb,var(--theme-accent) 72%,transparent);
        background:var(--theme-panel,#18181b);
        box-shadow:0 0 0 1px color-mix(in srgb,var(--theme-accent) 22%,transparent),0 8px 26px #0008;
        transform:scale(1.01);
      }
      [data-exp-part="launcher"].is-dragging {
        cursor:grabbing; transform:scale(1.03); box-shadow:0 10px 28px #0009;
      }
      [data-exp-part="launcher"].update-available::after {
        content:"↑"; position:absolute; top:-4px; right:-4px; width:14px; height:14px; display:grid; place-items:center;
        border:2px solid var(--theme-panel,#18181b); border-radius:4px; background:#f59e0b; color:#111114; font-size:8px; font-weight:950;
        box-shadow:0 2px 6px #0007; z-index:4; pointer-events:none;
      }
      [data-exp-part="launcher"] .ring { position:absolute; top:50%; left:50%; width:44px; height:44px; pointer-events:none; transform:translate(-50%,-50%); }
      [data-exp-part="launcher"] .track { fill:none; stroke:color-mix(in srgb,var(--theme-line,#34343b) 72%,transparent); stroke-width:2.5; }
      [data-exp-part="launcher"] .fill { fill:none; stroke:var(--theme-accent,#9147ff); stroke-width:2.5; stroke-linecap:round; transition:.2s stroke; }
      [data-exp-part="launcher"] .icon { position:absolute; top:50%; left:50%; width:40px; height:40px; pointer-events:none; z-index:1; transform:translate(-50%,-50%); }
      [data-exp-part="dock"] {
        position:fixed; right:12px; top:auto; bottom:auto;
        display:none; width:min(var(--exp-menu-width,312px), calc(100vw - 24px)); max-width:calc(100vw - 24px);
        height:max-content; min-height:0; max-height:none; overflow-x:hidden; overflow-y:auto; overscroll-behavior:contain; flex:0 0 auto;
        transition:.15s width;
        padding:9px 9px 4px; background:var(--theme-bg); border:1px solid var(--theme-line); border-radius:14px; box-shadow:0 18px 50px #0008; color-scheme:dark;
      }
      [data-exp-part="dock"].fl-rail-open { display:block; height:max-content; min-height:0; max-height:none; }
      [data-exp-part="dock"]:focus { outline:none; }
      [data-exp-part="dock"] :is(.fl-tool-body,.row,.group,.section,.fl-tool-title) { min-width:0; max-width:100%; overflow-wrap:anywhere; }
      [data-exp-part="dock"] :is(input,select,textarea) { min-width:0; max-width:100%; }
      .menu-head {
        position:relative;
        display:grid; grid-template-columns:minmax(0,1fr) auto;
        align-items:start; gap:8px; width:100%;
      }
      .header-actions { display:flex; align-items:flex-start; gap:5px; position:static; }
      .support-wrap { position:static; }
      .support-button,
      [data-exp-part="close"] {
        width:30px; height:30px; min-width:30px; padding:0;
        border:1px solid #3a3a42; border-radius:8px; background:#151519; color:#b8b8c0;
        cursor:pointer;
      }
      .support-button { display:grid; place-items:center; }
      .support-button svg { width:15px; height:15px; fill:currentColor; }
      .support-button:hover,
      .support-button:focus-visible {
        border-color:var(--theme-accent); color:var(--theme-accent2); background:#211b2b; outline:none;
      }
      .support-popover {
        position:absolute; z-index:14; top:35px; right:0;
        width:min(190px,100%); max-width:100%;
        box-sizing:border-box; padding:8px 9px;
        border:1px solid color-mix(in srgb,var(--theme-accent) 46%,var(--theme-line));
        border-radius:9px; background:var(--theme-panel); color:var(--theme-text);
        box-shadow:0 10px 28px #0009;
      }
      .support-popover[hidden] { display:none; }
      .support-popover strong { display:block; margin-bottom:3px; font-size:10px; }
      .support-popover span { display:block; color:var(--theme-muted); font-size:8px; line-height:1.35; }
      .support-popover a {
        display:flex; align-items:center; justify-content:center; min-height:26px; margin-top:7px; padding:0 9px;
        border:1px solid color-mix(in srgb,var(--theme-accent) 58%,var(--theme-line));
        border-radius:7px; background:color-mix(in srgb,var(--theme-panel) 76%,var(--theme-accent) 24%);
        color:var(--theme-text); text-decoration:none; font-size:9px; font-weight:800;
      }
      .support-popover a:hover,
      .support-popover a:focus-visible {
        border-color:var(--theme-accent2); outline:none;
        background:color-mix(in srgb,var(--theme-panel) 66%,var(--theme-accent) 34%);
      }
      .header-brand {
        display:grid; grid-template-columns:38px minmax(0,1fr);
        align-items:center; gap:8px; min-width:0; width:100%;
      }
      .header-icon {
        box-sizing:border-box; width:38px; height:38px; display:grid; place-items:center;
        border:1px solid color-mix(in srgb,var(--theme-accent) 48%,var(--theme-line));
        border-radius:9px; background:var(--theme-panel);
        box-shadow:inset 0 0 0 1px color-mix(in srgb,#000 22%,transparent);
      }
      .header-icon .menu-icon { width:38px; height:38px; display:block; }
      .header-copy { min-width:0; overflow:hidden; }
      .header-title-row { display:flex; align-items:center; gap:6px; min-width:0; flex-wrap:wrap; }
      [data-exp-part="title"] { margin:0; font-size:15px; font-weight:800; line-height:1.1; }
      [data-exp-part="version"] {
        min-height:18px; padding:1px 6px; border:1px solid #4a3b61; border-radius:5px;
        background:#1b1721; color:#c9a7ff; cursor:pointer; font:800 8px/1 ui-sans-serif,system-ui,sans-serif;
        white-space:nowrap;
      }
      [data-exp-part="version"]:hover,
      [data-exp-part="version"]:focus-visible {
        border-color:#9147ff; background:#251d31; color:#fff; outline:none;
      }
      [data-exp-part="subtitle"] {
        margin-top:2px; font-size:9px; line-height:1.2; color:#adadb8;
        white-space:normal; overflow-wrap:anywhere;
      }
      [data-exp-part="close"] { font:18px/1 Arial,sans-serif; }
      [data-exp-part="close"]:hover,
      [data-exp-part="close"]:focus-visible { border-color:#9147ff; color:#fff; background:#211b2b; outline:none; }
      .header-divider { height:1px; width:100%; margin:5px 0; background:linear-gradient(90deg,transparent,#9147ff88 50%,transparent); }
      .update-notice {
        position:fixed; display:block; width:100%; max-width:calc(100vw - 24px); margin:0; padding:10px;
        box-sizing:border-box;
        border:1px solid color-mix(in srgb,var(--theme-accent) 62%,var(--theme-line)); border-radius:10px;
        background:
          linear-gradient(
            180deg,
            color-mix(in srgb,var(--theme-panel) 88%,var(--theme-accent) 12%),
            var(--theme-bg) 76%
          );
        color:var(--theme-text);
        box-shadow:0 10px 28px #0008; z-index:12;
      }
      .update-notice[hidden] { display:none; }
      .update-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; padding-right:22px; }
      .update-heading { min-width:0; }
      .update-kicker { margin-bottom:2px; color:var(--theme-accent2); font-size:8px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
      .update-title { font-size:12px; line-height:1.25; font-weight:850; color:var(--theme-text); }
      .update-version {
        flex:none; padding:2px 6px;
        border:1px solid color-mix(in srgb,var(--theme-accent) 62%,var(--theme-line));
        border-radius:5px;
        background:color-mix(in srgb,var(--theme-panel) 82%,var(--theme-accent) 18%);
        color:var(--theme-text);
        font-size:8px; font-weight:800; white-space:nowrap;
      }
      .update-text { margin-top:6px; font-size:9px; line-height:1.45; color:var(--theme-muted); white-space:normal; overflow:visible; }
      .update-list { margin:7px 0 0; padding:0 0 0 15px; max-height:86px; overflow:auto; color:var(--theme-text); font-size:9px; line-height:1.4; scrollbar-width:thin; }
      .update-list li::marker { color:var(--theme-accent); }
      .update-list li + li { margin-top:3px; }
      .update-footer { display:flex; justify-content:flex-end; gap:6px; margin-top:8px; padding-top:7px; border-top:1px solid var(--theme-line); }
      .update-action,
      .update-release,
      .update-dismiss,
      .life-btn {
        border:1px solid var(--theme-line); border-radius:7px;
        background:var(--theme-bg); color:var(--theme-text); cursor:pointer;
      }
      .update-action,
      .update-release { min-height:27px; padding:0 10px; font-size:9px; font-weight:800; }
      .update-action { display:inline-flex; align-items:center; justify-content:center; text-decoration:none; }
      .update-action[hidden],
      .update-release[hidden] { display:none; }
      .update-action {
        border-color:var(--theme-accent);
        background:color-mix(in srgb,var(--theme-panel) 68%,var(--theme-accent) 32%);
        color:var(--theme-text);
      }
      .update-release {
        border-color:color-mix(in srgb,var(--theme-line) 78%,var(--theme-accent) 22%);
        background:var(--theme-panel);
        color:var(--theme-text);
      }
      .update-dismiss {
        position:absolute; top:7px; right:7px; width:23px; height:23px; padding:0;
        border-color:transparent; background:transparent; color:var(--theme-muted); font-size:15px; line-height:1;
      }
      .update-action:hover,
      .update-action:focus-visible,
      .update-release:hover,
      .update-release:focus-visible,
      .update-dismiss:hover,
      .update-dismiss:focus-visible,
      .life-btn:hover {
        border-color:var(--theme-accent);
        color:var(--theme-text);
        outline:none;
      }
      .update-action:hover,
      .update-action:focus-visible {
        background:color-mix(in srgb,var(--theme-panel) 55%,var(--theme-accent) 45%);
      }
      .update-release:hover,
      .update-release:focus-visible {
        background:color-mix(in srgb,var(--theme-panel) 88%,var(--theme-accent) 12%);
      }
            .exp-core-theme[data-theme-skin="gradient"] .update-notice {
        border:1px solid transparent;
        background-image:linear-gradient(var(--theme-panel),var(--theme-panel)),var(--theme-skin);
        background-origin:border-box;
        background-clip:padding-box,border-box;
      }
      .exp-core-theme[data-theme-skin="gradient"] .update-version,
      .exp-core-theme[data-theme-skin="gradient"] .update-action {
        border-color:transparent;
        background-image:linear-gradient(var(--theme-panel),var(--theme-panel)),var(--theme-skin);
        background-origin:border-box;
        background-clip:padding-box,border-box;
      }
      .toast { margin-bottom:7px; padding:6px 8px; border:1px solid #34343b; border-radius:8px; background:#18181b; color:#efeff1; font-size:9px; box-shadow:0 8px 24px #0006; }
      .toast[hidden] { display:none; }
      .fl-tool-panel { position:relative; margin-top:5px; border:1px solid #27272d; background:#19191e; border-radius:9px; overflow:visible; }
      .fl-tool-header { display:flex; justify-content:space-between; align-items:flex-start; height:auto; min-height:0; padding:7px 8px; cursor:pointer; border-radius:8px; }
      .fl-tool-header:hover { background:#9147ff18; }
      .fl-tool-header.last-opened { box-shadow:inset 3px 0 0 #b783ff; }
      .fl-tool-title { min-width:0; flex:1; font-size:12px; font-weight:700; white-space:normal; overflow-wrap:anywhere; }
      .fl-tool-chevron { background:none; border:0; color:#adadb8; cursor:pointer; }
      .fl-tool-body { padding:0 10px 8px; }
      .fl-tool-body:not(.fl-tool-hidden) { display:grid; height:auto; min-height:0; max-height:none; overflow:visible; grid-template-columns:repeat(2,minmax(0,1fr)); align-items:stretch; column-gap:8px; }
      .exp-core-theme[data-panel-width="compact"] .fl-tool-body:not(.fl-tool-hidden),
      .exp-core-theme[data-panel-width="narrow"] .fl-tool-body:not(.fl-tool-hidden) { grid-template-columns:minmax(0,1fr); }
      .exp-core-theme[data-panel-width="compact"] .fl-tool-body:not(.fl-tool-hidden) > *,
      .exp-core-theme[data-panel-width="narrow"] .fl-tool-body:not(.fl-tool-hidden) > * { grid-column:1/-1; }
      .fl-tool-body > :is(.fl-switch,.mini-row,.life-btn) { min-width:0; }
      .fl-tool-body > :is(.diag) { grid-column:1/-1; }
      .fl-tool-hidden { display:none !important; }
      .fl-switch,
      .mini-row { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; height:auto; min-height:0; padding:6px 0; }
      .fl-switch + .fl-switch,
      .mini-row + .mini-row { border-top:1px solid #26262b; }
      .fl-switch-text,
      .mini-row > span {
        min-width:0;
        font-size:11px;
        line-height:1.25;
        white-space:normal;
        word-break:normal;
        overflow-wrap:break-word;
        hyphens:none;
      }
      .toggleSwitch {
        position:relative; box-sizing:border-box; flex:none; width:34px; height:20px;
        border:1px solid color-mix(in srgb,var(--theme-line) 88%,var(--theme-muted) 12%);
        border-radius:6px;
        background:color-mix(in srgb,var(--theme-bg) 84%,var(--theme-panel) 16%);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018);
        cursor:pointer;
        transition:.15s background,.15s border-color;
      }
      .toggleSwitch::after {
        content:""; position:absolute; top:2px; left:2px; width:14px; height:14px;
        box-sizing:border-box; border:0; border-radius:4px;
        background:color-mix(in srgb,var(--theme-muted) 82%,var(--theme-text) 18%);
        box-shadow:none;
        transition:.15s transform,.15s background;
      }
      .toggleSwitch[aria-checked="true"] {
        border-color:color-mix(in srgb,var(--theme-line) 52%,var(--theme-accent) 48%);
        background:color-mix(in srgb,var(--theme-panel) 72%,var(--theme-accent) 28%);
      }
      .toggleSwitch[aria-checked="true"]::after {
        transform:translateX(14px);
        background:var(--theme-text);
      }
      .life-btn { width:100%; min-height:28px; margin-top:6px; font-size:11px; }
      .life-btn.last-opened { box-shadow:inset 3px 0 0 #b783ff; }
      .select-lite { min-width:0; max-width:72px; background:#111114; color:#efeff1; border:1px solid #34343b; border-radius:6px; padding:4px 6px; font-size:11px; }
      .auth-required {
        grid-column:1/-1;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin-top:6px;
        padding:7px 8px;
        border:1px solid color-mix(in srgb,#f59e0b 46%,var(--theme-line));
        border-radius:7px;
        background:color-mix(in srgb,var(--theme-panel) 84%,#f59e0b 16%);
        color:#ffe5a8;
        font-size:10px;
        font-weight:800;
      }
      .auth-required[hidden] { display:none !important; }
      .auth-required .life-btn {
        width:auto;
        min-width:112px;
        margin:0;
        flex:0 0 auto;
      }
      .auth-advanced { margin-top:2px; border:1px solid var(--theme-line); border-radius:7px; background:var(--theme-inset); padding:6px 8px; }
      .auth-advanced > summary { cursor:pointer; list-style:none; color:var(--theme-muted); font-size:11px; font-weight:600; user-select:none; }
      .auth-advanced > summary::-webkit-details-marker { display:none; }
      .auth-advanced[open] > summary { margin-bottom:6px; color:var(--theme-text); }
      .auth-advanced-body { display:flex; flex-direction:column; gap:6px; }
      .auth-hint { color:var(--theme-muted); font-size:10px; line-height:1.35; }
      .auth-input { width:100%; min-height:30px; border:1px solid var(--theme-line); border-radius:6px; background:var(--theme-inset); color:var(--theme-text); padding:6px 8px; font-size:11px; }
      .auth-input:focus { outline:2px solid var(--theme-focus); outline-offset:2px; border-color:var(--theme-focus); }
      .theme-row { grid-column:1/-1; display:flex; align-items:center; justify-content:space-between; gap:10px; min-height:28px; padding:6px 0; font-size:11px; }
      .exp-theme-swatch{box-sizing:border-box!important;flex:0 0 22px!important;width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important;max-width:22px!important;max-height:22px!important;padding:0!important;border-radius:5px!important}
      .exp-theme-swatches { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
      .exp-theme-swatch { appearance:none; width:18px; height:18px; min-width:18px; padding:0; border:2px solid var(--theme-line); border-radius:4px; box-sizing:border-box; cursor:pointer; }
      .exp-theme-swatch.is-on { border-color:var(--theme-text); box-shadow:0 0 0 2px var(--theme-accent); }
      .fl-tool-panel { border-color:var(--theme-line); background:var(--theme-panel); }
      .fl-tool-body { border-color:var(--theme-line); background:var(--theme-bg); color:var(--theme-text); }
      .select-lite,
      .life-btn { border-color:var(--theme-line); background:var(--theme-raised); color:var(--theme-text); }
      .exp-core-theme a { color:var(--theme-link); }
      .fl-tool-chevron,
      [data-exp-part="subtitle"] { color:var(--theme-muted); }
      .exp-core-theme[data-ui-theme="contrast"] .toggleSwitch { border:2px solid #fff; background:#050505; }
      .exp-core-theme[data-ui-theme="contrast"] .toggleSwitch::after { top:0; left:0; border:1px solid #050505; background:#fff; }
      .exp-core-theme[data-ui-theme="contrast"] .toggleSwitch[aria-checked="true"] { background:#fff; border-color:#fff; }
      .exp-core-theme[data-ui-theme="contrast"] .toggleSwitch[aria-checked="true"]::after { background:#050505; border-color:#fff; transform:translateX(14px); }
      @media (forced-colors: active) {
        .toggleSwitch { forced-color-adjust:none; border:1px solid CanvasText; background:Canvas; }
        .toggleSwitch::after { border-color:CanvasText; background:CanvasText; }
        .toggleSwitch[aria-checked="true"] { border-color:Highlight; background:Highlight; }
        .toggleSwitch[aria-checked="true"]::after { border-color:HighlightText; background:HighlightText; }
      }
            .exp-core-theme[data-theme-skin="gradient"] [data-exp-part="dock"] {
        border:1px solid transparent !important;
        background-origin:border-box !important;
        background-clip:padding-box, border-box !important;
        background-image:linear-gradient(var(--theme-bg),var(--theme-bg)),var(--theme-skin) !important;
      }
      .exp-core-theme[data-theme-skin="gradient"] [data-exp-part="launcher"] {
        border-color:color-mix(in srgb,var(--theme-accent) 30%,transparent) !important;
        background:var(--theme-panel) !important;
        background-image:none !important;
      }
      .exp-core-theme[data-theme-skin="gradient"] [data-exp-part="launcher"]:hover {
        border-color:color-mix(in srgb,var(--theme-accent) 58%,transparent) !important;
        background:color-mix(in srgb,var(--theme-panel) 96%,var(--theme-accent) 4%) !important;
        background-image:none !important;
      }
      .exp-core-theme[data-theme-skin="gradient"] [data-exp-part="launcher"][aria-expanded="true"] {
        border:1px solid transparent !important;
        background-image:linear-gradient(var(--theme-panel),var(--theme-panel)),var(--theme-skin) !important;
        background-origin:border-box !important;
        background-clip:padding-box,border-box !important;
      }
      .exp-core-theme[data-theme-skin="gradient"] [data-exp-part="version"] {
        border:1px solid var(--theme-line);
        background:var(--theme-bg);
        color:var(--theme-text);
        border-radius:6px;
      }
      .exp-core-theme[data-theme-skin="gradient"] [data-exp-part="version"]:hover,
      .exp-core-theme[data-theme-skin="gradient"] [data-exp-part="version"]:focus-visible {
        border-color:transparent;
        background-image:linear-gradient(var(--theme-panel),var(--theme-panel)),var(--theme-skin);
        background-origin:border-box;
        background-clip:padding-box,border-box;
      }
      .exp-core-theme[data-theme-skin="gradient"] .header-divider {
        height:2px;
        border-radius:2px;
        opacity:.9;
        background:var(--theme-skin);
        -webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 16%,#000 84%,transparent 100%);
        mask-image:linear-gradient(90deg,transparent 0%,#000 16%,#000 84%,transparent 100%);
      }
      .exp-core-theme[data-theme-skin="gradient"]:not([data-ui-theme="contrast"]) .toggleSwitch[aria-checked="true"] {
        border-color:color-mix(in srgb,var(--theme-line) 52%,var(--theme-accent) 48%);
        background:color-mix(in srgb,var(--theme-panel) 72%,var(--theme-accent) 28%);
      }
      .exp-core-theme[data-theme-skin="gradient"] .exp-theme-swatch.is-on {
        border-color:var(--theme-text);
        box-shadow:0 0 0 2px var(--theme-accent2);
      }
      .exp-core-theme[data-theme-skin="gradient"] :is(.fl-tool-header,.life-btn).last-opened {
        box-shadow:none;
        position:relative;
      }
      .exp-core-theme[data-theme-skin="gradient"] :is(.fl-tool-header,.life-btn).last-opened::before {
        content:"";
        position:absolute;
        left:0;
        top:4px;
        bottom:4px;
        width:2px;
        border-radius:2px;
        background:var(--theme-skin-vertical);
      }
      .exp-core-theme[data-theme-skin="gradient"] .fl-tool-header:hover,
      .exp-core-theme[data-theme-skin="gradient"] .fl-tool-header:focus-visible,
      .exp-core-theme[data-theme-skin="gradient"] .fl-tool-header[aria-expanded="true"] {
        background:color-mix(in srgb,var(--theme-panel) 88%,var(--theme-accent) 12%);
      }
      .exp-core-theme[data-theme-skin="gradient"] :is(.life-btn,.select-lite,.auth-input):focus-visible {
        outline:2px solid transparent !important;
        border-color:transparent !important;
        background-origin:border-box !important;
        background-clip:padding-box,border-box !important;
        background-image:linear-gradient(var(--theme-bg),var(--theme-bg)),var(--theme-skin) !important;
      }
      .exp-core-theme[data-ui-theme="warm"] [data-exp-part="dock"] {
        border:1px solid color-mix(in srgb,var(--theme-line) 84%,var(--theme-accent) 16%) !important;
        background-image:
          radial-gradient(120% 65% at 50% -18%,color-mix(in srgb,var(--theme-accent) 9%,transparent),transparent 72%),
          linear-gradient(180deg,color-mix(in srgb,var(--theme-panel) 42%,var(--theme-bg) 58%),var(--theme-bg) 44%) !important;
        background-clip:padding-box !important;
        box-shadow:0 18px 50px #0009,inset 0 1px 0 #ffedcf12;
      }
      .exp-core-theme[data-ui-theme="warm"] .header-icon {
        background:linear-gradient(155deg,color-mix(in srgb,var(--theme-accent) 13%,var(--theme-panel)),var(--theme-panel) 70%);
        box-shadow:inset 0 1px 0 #ffedcf20,0 2px 9px #0005;
      }
      .exp-core-theme[data-ui-theme="warm"] [data-exp-part="version"] {
        border-color:color-mix(in srgb,var(--theme-line) 66%,var(--theme-accent) 34%);
        background:color-mix(in srgb,var(--theme-panel) 88%,var(--theme-accent) 12%);
        color:var(--theme-accent2);
      }
      .exp-core-theme[data-ui-theme="warm"] [data-exp-part="close"] {
        border-color:var(--theme-line);background:var(--theme-panel);color:var(--theme-muted);
      }
      .exp-core-theme[data-ui-theme="warm"] .header-divider {
        background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--theme-accent) 55%,transparent) 50%,transparent);
      }
      .exp-core-theme[data-ui-theme="warm"] :is(.fl-tool-header,.life-btn):not(.last-opened) {
        box-shadow:inset 0 1px 0 #ffedcf0a;
      }
      .exp-core-theme[data-ui-theme="contrast"] .toggleSwitch[aria-checked="true"] {
        background:#fff;
        border-color:#fff;
      }
      .exp-core-theme[data-ui-theme="contrast"] .toggleSwitch[aria-checked="true"]::after {
        background:#050505;
        border-color:#fff;
      }
      .campaign-manager-title { min-width:0; font-size:11px; font-weight:800; color:var(--theme-text); }
      .campaign-manager-summary { flex:0 0 auto; font-size:8px; font-weight:700; color:var(--theme-muted); }
      .campaign-manager-note { padding:6px 8px 3px; font-size:8px; line-height:1.35; color:var(--theme-muted); }
      .diag { display:none; box-sizing:border-box;width:100%;min-width:0;height:160px;max-height:160px;overflow:auto;overscroll-behavior:contain;overflow-wrap:anywhere;box-shadow:inset 0 2px 6px #0006; margin-top:6px; padding:7px; border:1px solid #2b2b31; border-radius:7px; background:#101014; font:9px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace; color:#b8b8c0; white-space:pre-wrap; }
      .diag.open { display:block; }
      .has-tooltip { position:relative; }
      .has-tooltip::after { content:attr(data-tip); position:absolute; left:0; top:calc(100% + 4px); width:min(190px, calc(100vw - 48px)); max-width:100%; padding:6px 8px; border:1px solid #3b3b44; border-radius:7px; background:#0e0e10; color:#efeff1; box-shadow:0 6px 18px #0007; box-sizing:border-box; font-size:10px; line-height:1.35; white-space:normal; overflow-wrap:anywhere; opacity:0; pointer-events:none; z-index:999; transform:translateY(-2px); transition:.12s opacity,.12s transform; }
      .has-tooltip:hover::after,
      .has-tooltip:focus-visible::after { opacity:1; transform:translateY(0); }
      .reduce-motion *,
      .reduce-motion *::before,
      .reduce-motion *::after { animation:none !important; transition:none !important; }
      @media (max-width:700px) {
        .badge-row { width:100%; }
      }
    `;
  }

function protectLauncherHost(host) {
    host = host?.getRootNode?.().host || host;
    if (!host || host.nodeType !== 1) return () => {};
    host.dataset.expOwned = '1';
    const shadow = host.shadowRoot;
    const hostCss = `:host{all:initial!important;position:fixed!important;top:0!important;left:0!important;right:auto!important;bottom:auto!important;display:block!important;width:0!important;height:0!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;overflow:visible!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;z-index:2147483647!important;isolation:isolate!important;transform:none!important;filter:none!important;clip:auto!important;clip-path:none!important;contain:none!important;content-visibility:visible!important;mix-blend-mode:normal!important}`;
    let protectionSheet = null;
    let protectionStyle = null;
    let repairing = false;
    const installHostCss = () => {
      if (!shadow) return;
      try {
        const current = shadow.adoptedStyleSheets;
        if (protectionSheet && current?.includes?.(protectionSheet)) return;
        const view = host.ownerDocument?.defaultView || window;
        const Sheet = view.CSSStyleSheet || (typeof CSSStyleSheet === 'function' ? CSSStyleSheet : null);
        if (typeof Sheet === 'function' && Sheet.prototype?.replaceSync && current && typeof current[Symbol.iterator] === 'function') {
          if (!protectionSheet) {
            protectionSheet = new Sheet();
            protectionSheet.replaceSync(hostCss);
          }
          if (![...current].includes(protectionSheet)) shadow.adoptedStyleSheets = [...current, protectionSheet];
          return;
        }
      } catch {}
      if (!protectionStyle) {
        protectionStyle = document.createElement('style');
        protectionStyle.dataset.expHostProtection = '1';
        protectionStyle.textContent = hostCss;
      }
      if (!protectionStyle.isConnected) {
        try { shadow.prepend(protectionStyle); } catch {}
      }
    };
    const ensure = () => {
      if (repairing) return;
      repairing = true;
      try {
        const root = document.documentElement;
        if (root && host.parentNode !== root) root.append(host);
        if (host.hidden) host.hidden = false;
        host.removeAttribute('hidden');
        host.removeAttribute('inert');
        if (host.getAttribute('aria-hidden') === 'true') host.removeAttribute('aria-hidden');
        installHostCss();
        if (typeof host.showPopover === 'function') {
          if (host.getAttribute('popover') !== 'manual') host.setAttribute('popover', 'manual');
          let open = false;
          try { open = host.matches(':popover-open'); } catch {}
          if (!open) { try { host.showPopover(); } catch {} }
        }
      } catch {}
      repairing = false;
    };
    ensure();
    const hostObserver = new MutationObserver(() => queueMicrotask(ensure));
    hostObserver.observe(host, { attributes: true, attributeFilter: ['hidden', 'inert', 'aria-hidden', 'popover'] });
    const rootObserver = new MutationObserver(() => {
      if (host.parentNode !== document.documentElement) queueMicrotask(ensure);
    });
    rootObserver.observe(document.documentElement, { childList: true });
    const timer = setInterval(ensure, 2000);
    const onToggle = () => queueMicrotask(ensure);
    host.addEventListener('toggle', onToggle);
    return () => {
      hostObserver.disconnect();
      rootObserver.disconnect();
      clearInterval(timer);
      host.removeEventListener('toggle', onToggle);
      if (protectionSheet && shadow?.adoptedStyleSheets) {
        try { shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets].filter((sheet) => sheet !== protectionSheet); } catch {}
      }
      try { protectionStyle?.remove(); } catch {}
    };
  }

function compareVersions(a, b) {
    const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) { const diff = (pa[i] || 0) - (pb[i] || 0); if (diff) return diff; }
    return 0;
  }
return Object.freeze({ PRIDE_RAINBOW, PRIDE_RAINBOW_VERTICAL, CRIMSON_THEME, UI_THEMES, SHARED_UI_THEMES, css, protectLauncherHost, compareVersions });
})();

/* Local diagnostic capture shared at build time by ExtraPotions products. */
const ExtraPotionsDiagnostics = (() => {
  const LIMIT = 100;
  const supportedProducts = ["dropper","shift","ward","prisma"];
  const protocol = 'exp-core-coordination-v1';
  const entries = [], hooks = [], registrations = new Map();
  const startedAt = new Date().toISOString();
  let omitted = 0, recording = false, active = true;
  const redact = value => String(value)
    .replace(/https?:\/\/[^\s"<>]+/gi, '[url]')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
    .replace(/\b(Bearer|OAuth)\s+\S+/gi, '$1 [redacted]')
    .replace(/\b(token|password|secret|authorization|cookie)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/\b\d{3}-\d{7}-\d{7}\b/g, '[order-id]')
    .replace(/\b[A-Za-z0-9_-]{40,}\b/g, '[opaque-id]')
    .slice(0, 2000);
  function clean(value, depth = 0, seen = new WeakSet()) {
    if (depth > 8) return '[depth limit]';
    if (typeof value === 'string') return redact(value);
    if (typeof value === 'bigint') return String(value);
    if (typeof value === 'function' || typeof value === 'symbol') return undefined;
    if (!value || typeof value !== 'object') return value;
    if (value instanceof Node || value === window) return undefined;
    if (seen.has(value)) return '[circular]';
    seen.add(value);
    try {
      if (value instanceof Error) return { name: redact(value.name), message: redact(value.message), stack: redact(value.stack || '') };
      if (Array.isArray(value)) return value.slice(0, 100).map(item => clean(item, depth + 1, seen));
      const result = {};
      for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value)).slice(0, 150)) {
        if (/token|cookie|authorization|password|secret|pageText|innerHTML|outerHTML|formValue|matchText|__proto__|constructor|prototype/i.test(key)) continue;
        if (!('value' in descriptor)) continue;
        const item = clean(descriptor.value, depth + 1, seen);
        if (item !== undefined) result[key] = item;
      }
      return result;
    } catch { return '[unavailable]'; } finally { seen.delete(value); }
  }
  function record(level, kind, values) {
    if (recording || !active) return;
    recording = true;
    try {
      entries.push({ at: new Date().toISOString(), level, kind, values: clean(values.slice(0, 10)) });
      if (entries.length > LIMIT) { entries.shift(); omitted += 1; }
    } catch {} finally { recording = false; }
  }
  for (const level of ['debug', 'log', 'info', 'warn', 'error']) {
    try {
      const original = console[level];
      if (typeof original !== 'function') continue;
      const wrapped = function(...args) { record(level, 'console', args); return Reflect.apply(original, this, args); };
      console[level] = wrapped;
      if (console[level] === wrapped) hooks.push({ level, original, wrapped });
    } catch {}
  }
  function resourceErrorDetails(target) {
    const element = target?.tagName || 'unknown';
    const root = target?.getRootNode?.();
    const host = root?.host || null;
    const productId = host?.dataset?.productId || host?.dataset?.expDiagnosticsProduct || null;
    const owned = Boolean(
      productId ||
      host?.dataset?.expOwned === '1' ||
      target?.dataset?.expOwned === '1'
    );
    let assetHost = null;
    try {
      const raw = target?.currentSrc || target?.src || target?.href || '';
      assetHost = raw ? new URL(raw, location.href).hostname : null;
    } catch {}
    return {
      element,
      owner: owned ? (productId || 'extrapotions') : 'page',
      assetHost,
    };
  }
  const onError = event => record('error', event.target === window ? 'runtime-error' : 'resource-error',
    event.target === window
      ? [event.error || event.message, { line: event.lineno, column: event.colno }]
      : [resourceErrorDetails(event.target)]);
  const onRejection = event => record('error', 'unhandled-rejection', [event.reason]);
  addEventListener('error', onError, true);
  addEventListener('unhandledrejection', onRejection);

  function registerProduct(id, version, host) {
    id = String(id).toLowerCase();
    if (!supportedProducts.includes(id)) return null;
    let marker = registrations.get(id);
    if (!marker) {
      marker = document.createElement('meta');
      marker.dataset.expOwned = '1';
      marker.dataset.expDiagnosticsProduct = id;
      marker.dataset.expProductVersion = String(version || 'unknown').slice(0, 40);
      marker.dataset.expCoordinationProtocol = protocol;
      marker.dataset.expDiagnosticsInstance = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      registrations.set(id, marker);
    }
    if (!marker.isConnected) (document.head || document.documentElement)?.append(marker);
    if (host) host.dataset.expDiagnosticsInstance = marker.dataset.expDiagnosticsInstance;
    return marker;
  }
  addEventListener('DOMContentLoaded', () => { for (const marker of registrations.values()) if (!marker.isConnected) (document.head || document.documentElement)?.append(marker); }, { once: true });
  function compatibility() {
    const markers = [...document.querySelectorAll('meta[data-exp-diagnostics-product]')];
    const hosts = [...document.querySelectorAll('[data-exp-product-launcher="1"][data-product-id]')];
    const conflicts = [];
    const products = supportedProducts.map(id => {
      const records = markers.filter(n => n.dataset.expDiagnosticsProduct === id);
      const launchers = hosts.filter(n => n.dataset.productId === id);
      const versions = [...new Set(records.map(n => redact(n.dataset.expProductVersion || 'unknown')))];
      const protocols = [...new Set(records.map(n => redact(n.dataset.expCoordinationProtocol || 'unknown')))];
      if (records.length > 1 || launchers.length > 1) conflicts.push({ type: 'duplicate-product', products: [id], instances: Math.max(records.length, launchers.length) });
      if (protocols.some(p => p !== protocol && p !== 'unknown')) conflicts.push({ type: 'protocol-mismatch', products: [id], protocols });
      return { id, status: records.length || launchers.length ? 'observed' : 'not-observed', versions, protocols, instances: Math.max(records.length, launchers.length), launchers: launchers.length };
    });
    const boxes = hosts.map(host => {
      // An inaccessible shadow or unknown box is not evidence of a collision.
      const launcher = host.shadowRoot?.querySelector('[data-exp-part="launcher"]');
      if (!launcher || !launcher.getClientRects().length || getComputedStyle(launcher).visibility === 'hidden') return null;
      return { id: host.dataset.productId, box: launcher.getBoundingClientRect() };
    }).filter(x => x && supportedProducts.includes(x.id));
    for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
      const x = boxes[a], y = boxes[b];
      if (Math.min(x.box.right, y.box.right) - Math.max(x.box.left, y.box.left) > 2 && Math.min(x.box.bottom, y.box.bottom) - Math.max(x.box.top, y.box.top) > 2)
        conflicts.push({ type: 'launcher-overlap', products: [x.id, y.id] });
    }
    return { scope: 'current-page', installationInventory: 'unavailable', products, conflicts,
      status: conflicts.length ? 'conflicts-detected' : 'no-conflicts-observed',
      limitations: ['Disabled products and products outside their match rules cannot be enumerated.', 'Only reported registrations, protocol mismatches, duplicate instances and observable launcher overlap are checked.'] };
  }
  function createReport(product, details = {}, core = {}) {
    const { host, shadow: suppliedShadow, ...rest } = details;
    const shadow = suppliedShadow || host?.shadowRoot;
    const id = String(product || 'ExtraPotions').toLowerCase();
    const registration = registerProduct(id, details.product?.version || details.version, host);
    const data = clean(rest);
    const count = selector => document.querySelectorAll(selector).length;
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const byType = {};
    for (const entry of resources) {
      const summary = byType[entry.initiatorType || 'other'] ||= { count: 0, durationMs: 0, transferBytes: 0 };
      summary.count++; summary.durationMs += Math.round(entry.duration); summary.transferBytes += entry.transferSize || 0;
    }
    const page = { origin: location.origin, protocol: location.protocol, readyState: document.readyState, contentType: document.contentType, characterSet: document.characterSet, compatibilityMode: document.compatMode, language: document.documentElement?.lang || null, direction: document.documentElement?.dir || 'auto',
      structure: { elements: count('*'), headings: count('h1,h2,h3,h4,h5,h6'), links: count('a[href]'), forms: count('form'), inputs: count('input,select,textarea'), buttons: count('button,[role="button"]'), images: count('img'), videos: count('video'), audio: count('audio'), frames: count('iframe'), scripts: count('script'), stylesheets: document.styleSheets.length },
      layout: { documentWidth: document.documentElement?.scrollWidth || 0, documentHeight: document.documentElement?.scrollHeight || 0, scrollX, scrollY, horizontalOverflow: (document.documentElement?.scrollWidth || 0) > innerWidth },
      preferences: { reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, darkColorScheme: matchMedia('(prefers-color-scheme: dark)').matches, forcedColors: matchMedia('(forced-colors: active)').matches },
      performance: { navigation: navigation ? { type: navigation.type, durationMs: Math.round(navigation.duration), responseMs: Math.round(navigation.responseEnd), domInteractiveMs: Math.round(navigation.domInteractive), domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd), loadMs: Math.round(navigation.loadEventEnd), redirectCount: navigation.redirectCount } : null, resources: { count: resources.length, byType }, paint: performance.getEntriesByType('paint').map(e => ({ name: e.name, startMs: Math.round(e.startTime) })) },
      privacy: { pageText: 'excluded', formValues: 'excluded', urlPathsAndQueries: 'excluded', resourceUrls: 'excluded', cookiesAndStorage: 'excluded; sanitized plugin state supplied separately' } };
    const environment = { hostname: location.hostname, topLevelContext: window.top === window.self, visibility: document.visibilityState, online: navigator.onLine, language: navigator.language, userAgent: navigator.userAgent, viewport: { width: innerWidth, height: innerHeight, pixelRatio: devicePixelRatio } };
    const rect = n => { const b = n.getBoundingClientRect(); return { width: b.width, height: b.height, x: b.x, y: b.y, visible: !!n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden' }; };
    const first = selector => shadow?.querySelector(selector) || null;
    const visibleFirst = selector => [...(shadow?.querySelectorAll(selector) || [])].find(n => !n.hidden && n.getClientRects().length) || first(selector);
    const progressCard = first('[data-exp-part="progress-card"]');
    const launcher = first('[data-exp-part="launcher"]');
    const launcherRow = first('[data-exp-part="launcher-row"]');
    const menu = first('[data-exp-part="dock"]');
    const notice = visibleFirst('[data-exp-update-notice],.update-notice,.changelog');
    const uiGeometry = {
      progressCardRect: progressCard ? rect(progressCard) : null,
      launcherRect: launcher ? rect(launcher) : null,
      launcherRowRect: launcherRow ? rect(launcherRow) : null,
      menuRect: menu ? rect(menu) : null,
      noticeRect: notice ? rect(notice) : null,
    };
    const ui = {
      mounted: !!host?.isConnected,
      menuWidthMode: host?.dataset.menuWidth || null,
      uiGeometry,
      progressPanelWidth: progressCard ? Math.round(progressCard.getBoundingClientRect().width) : null,
      launcherRowWidth: launcherRow ? Math.round(launcherRow.getBoundingClientRect().width) : null,
      menuWidth: menu ? Math.round(menu.getBoundingClientRect().width) : null,
      noticeWidth: notice && !notice.hidden ? Math.round(notice.getBoundingClientRect().width) : null,
      surfaces: [...(shadow?.querySelectorAll('[data-exp-part="dock"]') || [])].map(rect),
      categories: [...(shadow?.querySelectorAll('.route,.nav-item,.fl-tool-header') || [])].map(n => ({ name: redact(n.textContent.trim()), expanded: n.getAttribute('aria-expanded') })),
      swatches: [...(shadow?.querySelectorAll('.exp-theme-swatch') || [])].map(n => ({ name: n.getAttribute('aria-label'), selected: n.getAttribute('aria-pressed'), ...rect(n) })),
    };
    let manager = null;
    try { if (typeof GM_info === 'object') manager = { name: GM_info.scriptHandler || null, version: GM_info.version || null, injectInto: GM_info.injectInto || null }; } catch {}
    return { ...data, report: `${product} Diagnostics`, schemaVersion: 3, generatedAt: new Date().toISOString(), page,
      technical: { environment, manager, core: clean(core), ui, capabilities: { mutationObserver: typeof MutationObserver === 'function', constructedStylesheets: typeof CSSStyleSheet === 'function' && 'replaceSync' in CSSStyleSheet.prototype, clipboard: !!navigator.clipboard, trustedTypes: !!globalThis.trustedTypes } },
      console: { startedAt, scope: 'accessible-userscript-realm-and-window-events', limit: LIMIT, omitted, hooks: hooks.map(h => ({ level: h.level, installed: console[h.level] === h.wrapped })), entries: clean(entries), limitations: ['No DevTools history, browser-internal logs, or inaccessible isolated-world console messages.', 'Messages are redacted and bounded; attribution to another script is not inferred.'] },
      plugin: { id, version: data.product?.version || data.version || registration?.dataset.expProductVersion || null, state: data, compatibility: compatibility() },
      environment, ui, core: data.core || clean(core) };
  }
  function dispose() {
    active = false;
    for (const {level, original, wrapped} of hooks) if (console[level] === wrapped) console[level] = original;
    removeEventListener('error', onError, true); removeEventListener('unhandledrejection', onRejection);
    for (const marker of registrations.values()) marker.remove();
  }
  // Core owns the shared diagnostics interaction contract: Show/Hide first, Copy second,
  // transient Diagnostics Copied / Copy Failed feedback, and fresh reports per action.
  function bindControls({ show, copy, output, getReport, notify = () => {}, onShow = () => {}, onCopy = () => {} }) {
    let timer, generation = 0;
    output.hidden = true; output.setAttribute('role', 'region');
    output.setAttribute('aria-label', 'Page, technical, console, and plugin diagnostics'); output.tabIndex = 0;
    show.setAttribute('aria-expanded', 'false');
    const showClick = async () => {
      const opening = output.hidden, ticket = ++generation;
      output.hidden = !opening; output.classList.toggle('open', opening);
      show.textContent = opening ? 'Hide Diagnostics' : 'Show Diagnostics';
      show.setAttribute('aria-expanded', String(opening)); show.classList.toggle('last-opened', opening);
      if (opening) {
        try { const report = await getReport(); if (ticket === generation) output.textContent = JSON.stringify(report, null, 2); }
        catch { if (ticket === generation) output.textContent = 'Diagnostics unavailable.'; notify('Could not generate diagnostics.'); }
      }
      onShow(opening);
    };
    const copyClick = async () => {
      copy.disabled = true; clearTimeout(timer);
      try {
        await navigator.clipboard.writeText(JSON.stringify(await getReport(), null, 2));
        copy.textContent = 'Diagnostics Copied'; onCopy();
      } catch { copy.textContent = 'Copy Failed'; notify('Could not copy diagnostics. Use Show Diagnostics.'); }
      finally { copy.disabled = false; timer = setTimeout(() => { copy.textContent = 'Copy Diagnostics'; }, 1600); }
    };
    show.addEventListener('click', showClick); copy.addEventListener('click', copyClick);
    return () => { ++generation; clearTimeout(timer); show.removeEventListener('click', showClick); copy.removeEventListener('click', copyClick); };
  }
  function createControls(getReport, notify) {
    const wrapper = document.createElement('div'); wrapper.className = 'diagnostics-controls';
    const actions = document.createElement('div'); actions.className = 'action-pair';
    const show = document.createElement('button'), copy = document.createElement('button'), output = document.createElement('pre');
    for (const button of [show, copy]) { button.type = 'button'; button.className = 'life-btn action'; }
    show.textContent = 'Show Diagnostics'; copy.textContent = 'Copy Diagnostics'; output.className = 'diag';
    bindControls({ show, copy, output, getReport, notify });
    actions.append(show, copy); wrapper.append(actions, output); return wrapper;
  }
  return Object.freeze({ createReport, registerProduct, compatibility, bindControls, createControls, dispose });
})();

/* Canonical ExtraPotions shared lifecycle runtime. */
function createProductLifecycle(shared) {
  const VERSION = shared.version;
  const PROTOCOL = 'exp-core-coordination-v1';
  const CAPABILITIES = new Set(['lifecycle', 'settings', 'diagnostics', 'dom-scheduler', 'navigation', 'launcher', 'ui']);
  const products = new Map();
  const cleanups = new Set();
  const errors = [];
  const metrics = { batches: 0, roots: 0, startedAt: Date.now() };
  let coordinator;
  const navigationSubscribers = new Set();
  let stopNavigationHooks;

  function compareVersions(left, right) {
    const a = String(left).split(/[.-]/).slice(0, 3).map((part) => Number(part) || 0);
    const b = String(right).split(/[.-]/).slice(0, 3).map((part) => Number(part) || 0);
    for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
    return 0;
  }

  function negotiate(peerVersion, peerProtocol = PROTOCOL) {
    if (peerProtocol !== PROTOCOL || !/^\d+\.\d+\.\d+/.test(peerVersion || '')) return { compatible: false, selection: 'isolated', reason: 'PROTOCOL_INCOMPATIBLE' };
    const comparison = compareVersions(VERSION, peerVersion);
    return { compatible: true, selection: comparison < 0 ? 'peer-newer' : comparison > 0 ? 'local-newer' : 'equal', reason: 'COMPATIBLE' };
  }

  const safeError = (error, source = 'core') => {
    const message = String(error && error.message || error || 'Unknown error').replace(/https?:\/\/\S+/g, '[url]').slice(0, 180);
    errors.push({ source, code: error && error.code || 'UNEXPECTED', message, at: Date.now() });
    if (errors.length > 12) errors.shift();
  };

  function ensureCoordinator() {
    if (!document.documentElement) return null;
    coordinator = document.querySelector('[data-exp-core-coordinator="1"]');
    if (!coordinator) {
      coordinator = document.createElement('meta');
      coordinator.dataset.expCoreCoordinator = '1';
      coordinator.dataset.protocol = PROTOCOL;
      coordinator.dataset.protocolVersion = '1';
      document.documentElement.append(coordinator);
    }
    const selected = coordinator.dataset.activeCoreVersion;
    if (!selected || compareVersions(VERSION, selected) > 0) coordinator.dataset.activeCoreVersion = VERSION;
    return coordinator;
  }

  function announce(type, detail = {}) {
    const node = ensureCoordinator();
    if (!node) return;
    const payload = { protocol: PROTOCOL, protocolVersion: 1, coreVersion: VERSION, type, ...detail };
    document.dispatchEvent(new CustomEvent('exp-core:coordination', { detail: payload }));
  }

  function publishProduct(manifest, state) {
    const node = ensureCoordinator();
    if (!node) return;
    const key = `product${manifest.id.replace(/[^a-z0-9]/gi, '')}`;
    node.dataset[key] = JSON.stringify({ id: manifest.id, version: manifest.version, state, capabilities: manifest.capabilities });
    announce('product-state', { productId: manifest.id, productVersion: manifest.version, state });
  }

  function validateManifest(manifest) {
    if (!manifest || !/^[a-z][a-z0-9-]+$/.test(manifest.id || '')) throw Object.assign(new Error('Invalid product ID'), { code: 'MANIFEST_ID' });
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version || '')) throw Object.assign(new Error('Invalid product version'), { code: 'MANIFEST_VERSION' });
    if (!Array.isArray(manifest.capabilities)) throw Object.assign(new Error('Capabilities must be an array'), { code: 'MANIFEST_CAPABILITIES' });
    const missing = manifest.capabilities.filter((item) => !CAPABILITIES.has(item));
    if (missing.length) throw Object.assign(new Error(`Missing Core capability: ${missing.join(', ')}`), { code: 'CAPABILITY_MISSING' });
  }

  function register(manifest, hooks) {
    validateManifest(manifest);
    if (products.has(manifest.id)) return products.get(manifest.id).public;
    const record = { manifest: Object.freeze({ ...manifest }), hooks, state: 'registered', queue: Promise.resolve() };
    const transition = (allowed, next, action) => {
      record.queue = record.queue.catch(() => {}).then(async () => {
        if (!allowed.includes(record.state)) return;
        try {
          await action?.();
          record.state = next;
          publishProduct(record.manifest, next);
        } catch (error) {
          record.state = 'failed';
          safeError(error, manifest.id);
          publishProduct(record.manifest, 'failed');
          throw error;
        }
      });
      return record.queue;
    };
    record.public = Object.freeze({
      manifest: record.manifest,
      get state() { return record.state; },
      initialize: () => transition(['registered', 'failed'], 'initialized', hooks.initialize),
      enable: () => transition(['initialized', 'disabled'], 'enabled', hooks.enable),
      disable: () => transition(['enabled'], 'disabled', hooks.disable),
      cleanup: () => transition(['registered', 'initialized', 'enabled', 'disabled', 'failed'], 'cleaned', hooks.cleanup)
    });
    products.set(manifest.id, record);
    publishProduct(record.manifest, 'registered');
    return record.public;
  }

  function createScheduler(callback, options = {}) {
    let observer;
    let sharedObserverCleanup;
    let frame = 0;
    let active = false;
    const roots = new Set();
    const flush = () => {
      frame = 0;
      if (!active || !roots.size) return;
      const batch = [...roots];
      roots.clear();
      metrics.batches += 1;
      metrics.roots += batch.length;
      try { callback(batch); } catch (error) { safeError(error, options.source || 'scheduler'); }
    };
    const queueRoot = (root) => {
      if (!active || !root || root.closest?.('[data-exp-owned="1"]')) return false;
      const target = root.nodeType === Node.TEXT_NODE ? root.parentElement : root;
      if (!target) return false;
      roots.add(target);
      return true;
    };
    const schedule = (root) => {
      if (!queueRoot(root)) return;
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const startDedicatedObserver = () => {
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const target = mutation.target?.nodeType === Node.TEXT_NODE ? mutation.target.parentElement : mutation.target;
          if (!target) continue;
          if (target.closest?.('[data-exp-owned="1"]')) continue;
          if (mutation.type === 'childList') {
            const changed = [...mutation.addedNodes, ...mutation.removedNodes];
            if (changed.length && changed.every((node) => node.nodeType === 1 && (node.matches?.('[data-exp-owned="1"]') || node.closest?.('[data-exp-owned="1"]')))) continue;
          }
          schedule(target);
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: Boolean(options.attributes),
        characterData: Boolean(options.characterData),
        attributeFilter: options.attributeFilter
      });
    };
    return Object.freeze({
      start() {
        if (active) return;
        active = true;
        if (!options.attributes && typeof shared.observePageBatch === 'function') {
          const productId = options.source || 'scheduler';
          const phase = options.phase || shared.suiteContract?.(productId)?.presentationPhases?.[0] || 'observe';
          sharedObserverCleanup = shared.observePageBatch((batch, batchRoots, details) => {
            for (let index = 0; index < batchRoots.length; index += 1) {
              const types = Array.isArray(details?.[index]?.types) ? details[index].types : [];
              if (!options.characterData && types.length && types.every(type => type === 'characterData')) continue;
              queueRoot(batchRoots[index]);
            }
            if (roots.size) {
              if (frame) { cancelAnimationFrame(frame); frame = 0; }
              flush();
            }
          }, { productId, phase });
        } else if (!options.attributes && typeof shared.observePage === 'function') {
          sharedObserverCleanup = shared.observePage((batch, root) => {
            const types = Array.isArray(batch?.types) ? batch.types : [];
            if (!options.characterData && types.length && types.every(type => type === 'characterData')) return;
            schedule(root);
          }, { productId: options.source || 'scheduler' });
        } else {
          startDedicatedObserver();
        }
        schedule(document.documentElement);
      },
      stop() {
        active = false;
        sharedObserverCleanup?.();
        sharedObserverCleanup = null;
        observer?.disconnect();
        observer = null;
        roots.clear();
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      },
      schedule,
      flush
    });
  }

  function onNavigation(callback) {
    if (typeof callback !== 'function') throw new TypeError('Navigation callback must be a function');
    if (typeof shared.observeNavigation === 'function') {
      let disposed = false;
      const stop = shared.observeNavigation(event => callback({
        href: event.href,
        kind: event.kind,
        epoch: event.epoch,
      }), { owner: 'lifecycle' });
      const cleanup = () => {
        if (disposed) return;
        disposed = true;
        stop();
        cleanups.delete(cleanup);
      };
      cleanups.add(cleanup);
      return cleanup;
    }
    let previous=location.href;
    const subscriber=({href})=>{if(href!==previous){previous=href;callback({href});}};
    if (!stopNavigationHooks) {
      const originals={},wrappers={};
      const check=()=>{const href=location.href;for(const notify of [...navigationSubscribers])notify({href});};
      for(const name of ['pushState','replaceState']){const original=history[name];originals[name]=original;const wrapped=function(...args){const result=Reflect.apply(original,this,args);check();return result;};wrappers[name]=wrapped;history[name]=wrapped;}
      addEventListener('popstate',check);addEventListener('hashchange',check);globalThis.navigation?.addEventListener('currententrychange',check);
      stopNavigationHooks=()=>{for(const name of Object.keys(wrappers))if(history[name]===wrappers[name])history[name]=originals[name];removeEventListener('popstate',check);removeEventListener('hashchange',check);globalThis.navigation?.removeEventListener('currententrychange',check);stopNavigationHooks=null;};
    }
    navigationSubscribers.add(subscriber);
    let disposed=false;
    const cleanup=()=>{if(disposed)return;disposed=true;navigationSubscribers.delete(subscriber);cleanups.delete(cleanup);if(!navigationSubscribers.size)stopNavigationHooks?.();};
    cleanups.add(cleanup);return cleanup;
  }


  function protectLauncherHost(host) { return shared.reference.protectLauncherHost(host); }

  function registerLauncher(host, options) { const cleanup = shared.registerLauncher(host, options); cleanups.add(cleanup); return cleanup; }

  function pageView() {
    try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow?.document) return unsafeWindow; } catch {}
    return window;
  }

  function isShadowRoot(node) {
    return Boolean(node && node.nodeType === 11 && node.host);
  }

  // Every stylesheet Core injects begins with an empty marker rule. A constructed sheet
  // has no owner node, and a tool such as SHIFT cannot see a JavaScript flag across
  // userscript sandboxes, but it can always read the first rule through the CSSOM.
  const OWNED_SHEET_MARKER = '.exp-owned-sheet-marker{}';
  const ensureMarker = (text) => { const value = String(text || ''); return value.startsWith(OWNED_SHEET_MARKER) ? value : OWNED_SHEET_MARKER + value; };

  function appendShadowStyle(root, css, data) {
    const node = document.createElement('style');
    try { node.textContent = ensureMarker(css); } catch (error) { safeError(error, 'core.style'); }
    node.dataset.expOwned = '1';
    for (const [key, value] of Object.entries(data || {})) node.dataset[key] = String(value);
    root.append(node);
    return node;
  }

  function paintToken() {
    return `expink${Math.random().toString(36).slice(2, 10)}`;
  }

  function withPaintProbe(css, token) {
    css = ensureMarker(css);
    return `${css}\n[data-${token}]{color:rgb(1, 2, 3)!important}`;
  }

  function isConnectedNode(node) {
    try { return Boolean(node && (node.isConnected || node.host?.isConnected)); } catch { return false; }
  }

  function sheetHasRules(sheet) {
    try { return sheet.cssRules.length > 0; } catch { return null; }
  }

  function sawPaint(token, parent) {
    if (!parent || !isConnectedNode(parent)) return false;
    const probe = document.createElement('span');
    probe.setAttribute(`data-${token}`, '');
    parent.append(probe);
    let painted = false;
    try { painted = getComputedStyle(probe).color === 'rgb(1, 2, 3)'; } catch {}
    try { probe.remove(); } catch { probe.parentNode?.removeChild(probe); }
    return painted;
  }

  function writeSheet(sheet, text, view) {
    const source = ensureMarker(text);
    try { sheet.replaceSync(source); return; } catch {}
    view.Function('sheet', 'css', 'sheet.replaceSync(css)')(sheet, source);
  }

  function setAdopted(host, sheets) {
    try { host.adoptedStyleSheets = sheets; return; } catch {}
    const view = pageView();
    const proto = isShadowRoot(host) ? (view.ShadowRoot || ShadowRoot).prototype : (view.Document || Document).prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'adoptedStyleSheets');
    if (!desc?.set) throw new Error('adoptedStyleSheets unavailable');
    desc.set.call(host, sheets);
  }

  function adoptConstructable(host, css, shadow) {
    const view = pageView();
    const Ctor = view.CSSStyleSheet || (typeof CSSStyleSheet === 'function' ? CSSStyleSheet : null);
    if (typeof Ctor !== 'function' || !Ctor.prototype.replaceSync) return null;
    const current = host.adoptedStyleSheets;
    if (!current || typeof current[Symbol.iterator] !== 'function') return null;
    const sheet = new Ctor();
    const token = paintToken();
    writeSheet(sheet, withPaintProbe(css, token), view);
    const before = current.length;
    setAdopted(host, [...current, sheet]);
    const sample = shadow || host.documentElement || host;
    if (host.adoptedStyleSheets.length !== before + 1) {
      try { setAdopted(host, [...host.adoptedStyleSheets].filter((item) => item !== sheet)); } catch {}
      throw new Error('adoptedStyleSheets ignored');
    }
    const painted = isConnectedNode(sample) ? sawPaint(token, sample) : sheetHasRules(sheet) !== false;
    if (!painted) {
      try { setAdopted(host, [...host.adoptedStyleSheets].filter((item) => item !== sheet)); } catch {}
      throw new Error('adoptedStyleSheets did not paint');
    }
    writeSheet(sheet, css, view);
    return {
      sheet,
      write: (text) => writeSheet(sheet, text, view),
      detach() {
        try { setAdopted(host, [...host.adoptedStyleSheets].filter((item) => item !== sheet)); } catch {}
      }
    };
  }

  function injectShadowStyle(root, css, data) {
    const mark = (node) => {
      node.dataset.expOwned = '1';
      for (const [key, value] of Object.entries(data || {})) node.dataset[key] = String(value);
      return node;
    };
    const fail = (error) => safeError(Object.assign(error || new Error('Style injection failed'), { code: 'STYLE_INJECTION' }), 'core.style');
    // Adopted sheets stay inside the shadow and still apply when the page CSP
    // blocks <style>. GM_addElement / GM_addStyle are not used here: managers
    // attach those to the document and leak header/nav/button/* onto the site.
    try {
      const adopted = adoptConstructable(root, css, root);
      if (adopted) {
        const node = document.createElement('style');
        let current = css;
        Object.defineProperty(node, 'textContent', {
          configurable: true,
          enumerable: true,
          get() { return current; },
          set(value) {
            current = String(value || '');
            try { adopted.write(current); } catch (error) { fail(error); }
          }
        });
        node.remove = () => {
          try { adopted.detach(); } catch {}
          if (node.parentNode) node.parentNode.removeChild(node);
        };
        try { root.append(node); } catch {}
        return mark(node);
      }
    } catch (error) { fail(error); }
    return appendShadowStyle(root, css, data);
  }

  function injectStyle(root, cssText, data = {}) {
    const css = String(cssText || '');
    if (isShadowRoot(root)) return injectShadowStyle(root, css, data);
    const isShadow = false;
    const view = pageView();
    const doc = view.document || document;
    const parent = isShadow ? root : (doc.documentElement || doc.head || doc.body);
    const host = isShadow ? root : doc;
    const sample = isShadow ? root : (doc.body || doc.documentElement);
    const mark = (node) => {
      node.dataset.expOwned = '1';
      for (const [key, value] of Object.entries(data || {})) node.dataset[key] = String(value);
      return node;
    };
    const fail = (error) => safeError(Object.assign(error || new Error('Style injection failed'), { code: 'STYLE_INJECTION' }), 'core.style');
    const handle = (write, detach) => {
      const node = document.createElement('style');
      let current = css;
      Object.defineProperty(node, 'textContent', {
        configurable: true,
        enumerable: true,
        get() { return current; },
        set(value) {
          current = String(value || '');
          try { write(current); } catch (error) { fail(error); }
        }
      });
      node.remove = () => {
        try { detach(); } catch {}
        if (node.parentNode) node.parentNode.removeChild(node);
      };
      parent.append(node);
      return mark(node);
    };
    try {
      if (typeof GM_addElement === 'function') {
        const token = paintToken();
        let live = GM_addElement(parent, 'style', { textContent: withPaintProbe(css, token) });
        if (live && sawPaint(token, sample)) {
          try { live.textContent = ensureMarker(css); } catch {}
          return handle(
            (text) => {
              try { live.textContent = ensureMarker(text); } catch {
                const next = GM_addElement(parent, 'style', { textContent: ensureMarker(text) });
                try { live.remove(); } catch {}
                live = next;
              }
            },
            () => { try { live.remove(); } catch {} }
          );
        }
        try { live?.remove(); } catch {}
      }
    } catch (error) { fail(error); }
    try {
      if (!isShadow && typeof GM_addStyle === 'function') {
        const token = paintToken();
        let live = GM_addStyle(withPaintProbe(css, token));
        if (live && sawPaint(token, sample)) {
          try { live.textContent = ensureMarker(css); } catch {}
          return handle(
            (text) => {
              try { live.textContent = ensureMarker(text); } catch { live = GM_addStyle(ensureMarker(text)); }
            },
            () => { try { live.remove(); } catch {} }
          );
        }
        try { live?.remove(); } catch {}
      }
    } catch (error) { fail(error); }
    try {
      const adopted = adoptConstructable(host, css, sample);
      if (adopted) return handle((text) => adopted.write(text), () => adopted.detach());
    } catch (error) { fail(error); }
    const node = document.createElement('style');
    try { node.textContent = ensureMarker(css); } catch (error) { fail(error); }
    parent.append(node);
    return mark(node);
  }

  function diagnosticSnapshot() {
    return {
      core: { version: VERSION, protocol: PROTOCOL, capabilities: [...CAPABILITIES] },
      products: [...products.values()].map(({ manifest, state }) => ({ id: manifest.id, version: manifest.version, state })),
      metrics: { ...metrics, uptimeMs: Date.now() - metrics.startedAt },
      errors: errors.map(({ source, code, message }) => ({ source, code, message }))
    };
  }

  function focusMenuSurface(surface) { if (!(surface instanceof HTMLElement)) return false; if (!surface.hasAttribute('tabindex')) surface.setAttribute('tabindex', '-1'); surface.style.outline='none'; surface.focus({ preventScroll: true }); return true; }

  addEventListener('pagehide', () => { for (const cleanup of cleanups) { try { cleanup(); } catch {} } }, { once: true });
  return Object.freeze({
    VERSION, PROTOCOL, register, createScheduler, onNavigation, registerLauncher, announce, negotiate, safeError,
    diagnosticSnapshot, diagnostics: diagnosticSnapshot, focusMenuSurface, injectStyle,
    registerFloatingNotice: shared.registerFloatingNotice,
    layoutFloatingNotices: shared.layoutFloatingNotices,
    claimNotice: shared.claimNotice,
    consumeVersionChange: shared.consumeVersionChange,
  });
}

// Shared, local-only compatibility controls.
const ExtraPotionsTools = (() => {
  const PRODUCT_ROOT_IDS = {"dropper":"tdh-root","shift":"exp-shift-root","ward":"exp-ward-root","prisma":"exp-prisma-root"};
  function placeDonationPanel(panel, trigger){
    trigger.closest('.menu-head,header')?.after(panel);
    panel.style.cssText='position:static!important;width:100%!important;max-width:100%!important;margin:7px 0;box-shadow:none';
  }
  function createBitcoinDonation(){
    const address='bc1qg4xq63mwu63qc5dnqugk3qtxvulv5p3frjayna8ey8tu8ey4wpxsg92hv3';
    const details=document.createElement('details');details.className='exp-bitcoin-donation';details.style.cssText='margin-top:7px;min-width:0';
    const summary=document.createElement('summary');summary.textContent='₿ Bitcoin';summary.style.cssText='cursor:pointer;font-weight:700;padding:6px;border:1px solid var(--theme-line);border-radius:7px';
    const code=document.createElement('code');code.textContent=address;code.setAttribute('aria-label','Bitcoin donation address');code.style.cssText='display:block;overflow-wrap:anywhere;word-break:break-all;user-select:all;margin:7px 0;font-size:11px;line-height:1.4';
    const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='margin:5px 0 0;font-size:10px';
    const copy=button('Copy Bitcoin address',async()=>{try{await navigator.clipboard.writeText(address);status.textContent='Bitcoin address copied.';}catch{status.textContent='Select and copy the address above.';}});copy.style.cssText='width:100%;min-width:0;white-space:normal;border-radius:7px';
    const wallet=document.createElement('a');wallet.href='bitcoin:'+address;wallet.textContent='Open Bitcoin wallet';
    details.append(summary,code,copy,wallet,status);return details;
  }
  function compatibilitySnapshot(){
    const rows=[];const warnings=[];const versions=new Set();
    for(const [id,rootId] of Object.entries(PRODUCT_ROOT_IDS)){
      const markers=[...document.querySelectorAll('[data-exp-diagnostics-product]')].filter(n=>n.dataset.expDiagnosticsProduct===id);
      if(!markers.length)continue;
      const productVersions=[...new Set(markers.map(n=>n.dataset.expProductVersion||'unknown'))];
      const host=document.getElementById(rootId);
      const core=host?.dataset.coreVersion||null;if(core)versions.add(core);
      rows.push({id,versions:productVersions,core,instances:markers.length});
      if(markers.length>1)warnings.push(`More than one ${id.toUpperCase()} instance is active.`);
    }
    if(versions.size>1)warnings.push('Different core versions are active. Update the products and reload this page.');
    return {products:rows,warnings};
  }
  const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='life-btn action';b.textContent=label;b.addEventListener('click',fn);return b;};
  function card(title){const d=document.createElement('details');d.className='exp-tools-card';d.style.cssText='border:1px solid var(--theme-line,var(--line,#777));border-radius:7px;padding:7px;margin-top:8px';const s=document.createElement('summary');s.textContent=title;d.append(s);return d;}
  function createCompatibilityControls(){const d=card('Product compatibility'),out=document.createElement('div');out.setAttribute('aria-live','polite');function refresh(){out.replaceChildren();const value=compatibilitySnapshot();for(const p of value.products){const line=document.createElement('p');line.textContent=`${p.id.toUpperCase()} ${p.versions.join(', ')} · ${p.core?'core '+p.core:'native product UI'}`;out.append(line);}const status=document.createElement('p');status.textContent=value.warnings.join(' ')||'No mixed core versions or duplicate instances detected on this page.';out.append(status);const note=document.createElement('small');note.textContent='Only products running on this page are visible. This is not an online update check.';out.append(note);}d.addEventListener('toggle',()=>{if(d.open)refresh();});d.append(out,button('Refresh compatibility',refresh));return d;}
  return Object.freeze({placeDonationPanel,createBitcoinDonation,compatibilitySnapshot,createCompatibilityControls});
})();

// Shared ExtraPotions menu categories, submenu behavior, reordering, and visibility.
const ExpMenuArrangement = (() => {
  const CATEGORY_ORDER = Object.freeze(['main', 'appearance', 'advanced', 'system']);
  const CATEGORY_META = Object.freeze({
    main: Object.freeze({ id: 'main', label: 'Main', order: 0 }),
    appearance: Object.freeze({ id: 'appearance', label: 'Appearance', order: 1 }),
    advanced: Object.freeze({ id: 'advanced', label: 'Advanced', order: 2 }),
    system: Object.freeze({ id: 'system', label: 'System', order: 3 }),
  });
  const PRODUCT_SECTIONS = {"dropper":{"main":["drops","streams"],"appearance":["appearance"],"advanced":["advanced"],"system":["system"]},"shift":{"appearance":["appearance","readability"],"advanced":["effects","effects-integrations","profiles","profiles-sites"],"system":["system"]},"ward":{"main":["protection","amazon","tools"],"appearance":["appearance"],"advanced":["advanced","patterns","advanced-amazon"],"system":["system"]},"prisma":{"main":["page","highlights"],"appearance":["style","highlight-style","look","appearance"],"advanced":["tools","language","sites"],"system":["system"]}};
  const GENERIC_SECTIONS = Object.freeze({
    appearance: Object.freeze(['appearance', 'readability', 'style', 'highlight-style', 'look', 'theme', 'themes']),
    advanced: Object.freeze(['advanced', 'effects', 'integrations', 'profiles', 'sites', 'language', 'patterns', 'routing', 'playback']),
    system: Object.freeze(['system', 'settings', 'diagnostics', 'maintenance', 'recovery']),
  });
  const slug = value => String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const categoryList = Object.freeze(CATEGORY_ORDER.map(id => CATEGORY_META[id]));

  function categoryFor(productId, section = {}, index = 0) {
    const product = slug(productId);
    const key = slug(section.key || section.id || section.route);
    const label = slug(section.label || section.name || section.title);
    const tokens = new Set([key, label].filter(Boolean));
    const profile = PRODUCT_SECTIONS[product] || {};
    for (const category of CATEGORY_ORDER) {
      const aliases = profile[category] || [];
      if (aliases.some(alias => tokens.has(slug(alias)))) return category;
    }
    for (const category of ['system', 'appearance', 'advanced']) {
      if (GENERIC_SECTIONS[category].some(alias => tokens.has(slug(alias)))) return category;
    }
    if (index === 0) return 'main';
    return 'main';
  }

  function describe(productId, sections = []) {
    const groups = new Map(CATEGORY_ORDER.map(id => [id, {
      ...CATEGORY_META[id],
      sections: [],
    }]));
    sections.forEach((section, index) => {
      const category = categoryFor(productId, section, index);
      groups.get(category).sections.push(section);
    });
    return CATEGORY_ORDER.map(id => groups.get(id)).filter(group => group.sections.length);
  }

  function createDisclosure({ document, label, category = 'advanced', key = '', contents = [], className = 'exp-system-card' } = {}) {
    if (!document?.createElement) throw new Error('Menu disclosure requires a document');
    const details = document.createElement('details');
    details.className = className;
    details.dataset.expMenuSubmenu = '1';
    details.dataset.expMenuCategory = CATEGORY_META[category] ? category : 'advanced';
    if (key) details.dataset.expMenuKey = slug(key);
    details.open = false;
    // Core created this submenu in its canonical collapsed state. Mark it initialized
    // immediately so a later arrangement refresh cannot re-collapse a user-opened
    // disclosure during the same interaction.
    details.dataset.expMenuInitialized = '1';
    const summary = document.createElement('summary');
    summary.textContent = String(label || CATEGORY_META[category]?.label || 'Advanced');
    details.append(summary, ...contents);
    return details;
  }

  function collapseSubmenus(root) {
    if (!root?.querySelectorAll) return;
    for (const details of root.querySelectorAll('details[data-exp-menu-submenu]')) {
      if (details.dataset.expMenuInitialized === '1') continue;
      details.open = false;
      details.dataset.expMenuInitialized = '1';
    }
  }

  const css = `
    [data-exp-menu-submenu]{box-sizing:border-box;min-width:0;max-width:100%;overflow-wrap:anywhere}
    [data-exp-menu-submenu]>summary{cursor:pointer}
  `;

  // Tags each menu section with its category and keeps sections in category
  // order (Main, Appearance, Advanced, System). Sections keep their own order
  // inside a category; there is nothing for the user to arrange or hide.
  function mount({ panel, id, onChange = () => {} }) {
    const document = panel.ownerDocument, view = document.defaultView;
    collapseSubmenus(panel);
    const entries = [...panel.querySelectorAll(':scope .fl-tool-panel')].filter(section => section.parentElement === panel || section.parentElement?.closest('.fl-tool-panel') === null).map(section => {
      const header = section.querySelector(':scope>.fl-tool-header');
      const body = section.querySelector(':scope>.fl-tool-body');
      if (!header || !body) return null;
      const label = (header.querySelector('.fl-tool-title') || header).textContent.replace(/[▸▾›]/g, '').trim();
      const key = header.dataset.route || header.dataset.section || header.dataset.panel || body.id;
      return { section, header, body, label, key };
    }).filter(entry => entry?.key);
    const none = { update() { collapseSubmenus(panel); }, describe: () => [], destroy() {} };
    if (entries.length < 2) return none;
    const parent = entries[0].section.parentElement;
    if (entries.some(entry => entry.section.parentElement !== parent)) return none;
    entries.forEach((entry, index) => {
      entry.category = categoryFor(id, entry, index);
      entry.section.dataset.expMenuCategory = entry.category;
    });
    const style = document.createElement('style'); style.textContent = css;
    const styleRoot = panel.getRootNode();
    (styleRoot instanceof view.ShadowRoot ? styleRoot : (document.head || document.documentElement)).append(style);
    const rank = entry => CATEGORY_ORDER.indexOf(entry.category);
    const desired = [...entries].sort((a, b) => rank(a) - rank(b));
    function apply() {
      const present = entries.filter(entry => entry.section.parentElement === parent);
      const wanted = desired.filter(entry => present.includes(entry));
      const current = [...parent.children].filter(node => wanted.some(entry => entry.section === node));
      const after = current.length ? current.at(-1).nextSibling : null;
      for (const entry of wanted) parent.insertBefore(entry.section, after);
      onChange();
    }
    apply();
    return {
      update() { collapseSubmenus(panel); },
      describe: () => describe(id, entries.map(({ key, label, category }) => ({ key, label, category }))),
      destroy() {
        style.remove();
        entries.forEach(entry => { delete entry.section.dataset.expMenuCategory; });
      }
    };
  }

  return Object.freeze({
    categories: categoryList,
    categoryFor,
    describe,
    createDisclosure,
    collapseSubmenus,
    mount,
  });
})();

// Product-neutral shared runtime. Product engines own their settings, content, and actions.
// exp-core owns shared UI, launcher, diagnostics, update, and coordination behavior.
const ExtraPotionsCore = (() => {
  'use strict';
  const version = '3.4.4';
  const sourceVersion = version; // Backward-compatible alias for Core's own foundation version.
  const SUPPORT_URL = 'https://ko-fi.com/expdare';
  const protocol = 'exp-core-coordination-v1';
  const gridProtocol = 'exp-launcher-grid-v3';
  const GRID_ORDER = 'exp:v3:launcher-order';
  const GRID_DELTA = 'exp:v3:launcher-grid-delta';
  // Product importance, launcher placement, and theme ownership are separate
  // coordination policies backed by the same canonical suite manifest.
  const freezeSuiteContract = values => Object.freeze(Object.fromEntries(
    Object.entries(values || {}).map(([id, value]) => [id, Object.freeze({
      role: String(value?.role || 'product'),
      repository: String(value?.repository || ''),
      rootId: String(value?.rootId || ''),
      priority: Number(value?.priority || 0),
      launcherPriority: Number(value?.launcherPriority || 0),
      themePriority: Number(value?.themePriority || 0),
      capabilities: Object.freeze([...(value?.capabilities || [])]),
      presentationPhases: Object.freeze([...(value?.presentationPhases || [])]),
      menuSections: Object.freeze(Object.fromEntries(
        Object.entries(value?.menuSections || {}).map(([category, sections]) => [category, Object.freeze([...(sections || [])])])
      )),
      state: value?.state ? Object.freeze({
        type: String(value.state.type || ''),
        fields: Object.freeze({ ...(value.state.fields || {}) }),
      }) : null,
    })])
  ));
  const SUITE_PRODUCTS = freezeSuiteContract({"dropper":{"role":"flagship","priority":4,"launcherPriority":110,"themePriority":4,"capabilities":["twitch.drops","twitch.campaigns","twitch.progress","twitch.claims","twitch.stream-management"],"presentationPhases":[],"state":{"type":"dropper.state-changed","fields":{"activeReward":"boolean","progressPercent":"percent-nullable","routingState":"token"}},"menuSections":{"main":["drops","streams"],"appearance":["appearance"],"advanced":["advanced"],"system":["system"]},"repository":"Dropper","rootId":"tdh-root"},"shift":{"role":"product","priority":3,"launcherPriority":100,"themePriority":3,"capabilities":["appearance.theme","appearance.readability","appearance.site-profile"],"presentationPhases":["theme"],"state":{"type":"shift.state-changed","fields":{"active":"boolean","theme":"token","safeMode":"boolean","excluded":"boolean"}},"menuSections":{"appearance":["appearance","readability"],"advanced":["effects","effects-integrations","profiles","profiles-sites"],"system":["system"]},"repository":"SHIFT","rootId":"exp-shift-root"},"ward":{"role":"product","priority":2,"launcherPriority":60,"themePriority":1,"capabilities":["retail.classification","retail.cleanup","retail.coupons"],"presentationPhases":["classify","visibility"],"state":{"type":"ward.state-changed","fields":{"active":"boolean","pageType":"token","interventions":"count","hide":"count","dim":"count","collapse":"count","annotate":"count"}},"menuSections":{"main":["protection","amazon","tools"],"appearance":["appearance"],"advanced":["advanced","patterns","advanced-amazon"],"system":["system"]},"repository":"WARD","rootId":"exp-ward-root"},"prisma":{"role":"product","priority":1,"launcherPriority":40,"themePriority":2,"capabilities":["text.identity-detection","text.identity-highlighting","identity.catalog"],"presentationPhases":["annotate"],"state":{"type":"prisma.state-changed","fields":{"status":"token","total":"count","temporarilyHidden":"boolean"}},"menuSections":{"main":["page","highlights"],"appearance":["style","highlight-style","look","appearance"],"advanced":["tools","language","sites"],"system":["system"]},"repository":"PRISMA","rootId":"exp-prisma-root"}});
  const SUITE_PRIORITY = Object.freeze(Object.fromEntries(
    Object.entries(SUITE_PRODUCTS).map(([id, value]) => [id, value.priority])
  ));
  const LAUNCHER_PRIORITY = Object.freeze(Object.fromEntries(
    Object.entries(SUITE_PRODUCTS).map(([id, value]) => [id, value.launcherPriority])
  ));
  const THEME_PRIORITY = Object.freeze(Object.fromEntries(
    Object.entries(SUITE_PRODUCTS).map(([id, value]) => [id, value.themePriority])
  ));
  const SUITE_EVENT = 'exp-core:suite';
  // Suite events/state cross userscript realms through shared DOM metadata.
  // They are advisory coordination signals, never an authorization boundary.
  const SUITE_TRUST = 'shared-dom-advisory';
  const PAGE_BATCH_EVENT = 'exp-core:page-batch';
  const NAVIGATION_EVENT = 'exp-core:navigation';
  const NAVIGATION_CONTROL_EVENT = 'exp-core:navigation-control';
  const PAGE_PHASE_EVENT = 'exp-core:page-phase';
  const PAGE_PHASE_END_EVENT = 'exp-core:page-phase-end';
  const PRESENTATION_STATE_EVENT = 'exp-core:presentation-state';
  const PRESENTATION_PHASES = Object.freeze({
    observe: 10,
    classify: 20,
    visibility: 30,
    theme: 40,
    annotate: 50,
    ui: 60,
  });
  const PRESENTATION_CHANNELS = Object.freeze(['classification', 'visibility', 'surface', 'annotation']);
  const suiteStateFingerprints = new Map();
  const registrations = new WeakMap();
  const floatingNoticeRegistrations = new WeakMap();
  const controllers = new WeakMap();
  const baseTokenNames = ['bg', 'panel', 'line', 'text', 'muted', 'accent', 'accent2'];
  const tokenNames = [...baseTokenNames, 'raised', 'inset', 'link', 'focus', 'onAccent'];
  const hex = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000';
  const rgb = value => [1, 3, 5].map(index => parseInt(hex(value).slice(index, index + 2), 16));
  const blend = (from, to, amount) => '#' + rgb(from).map((part, index) => Math.round(part + (rgb(to)[index] - part) * amount).toString(16).padStart(2, '0')).join('');
  const luminance = value => {
    const parts = rgb(value).map(part => { const channel = part / 255; return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; });
    return .2126 * parts[0] + .7152 * parts[1] + .0722 * parts[2];
  };
  const contrast = (one, two) => { const [light, dark] = [luminance(one), luminance(two)].sort((a, b) => b - a); return (light + .05) / (dark + .05); };
  function readable(candidate, background, fallback) {
    if (contrast(candidate, background) >= 4.5) return candidate;
    for (let amount = .15; amount <= 1; amount += .05) {
      const lighter = blend(candidate, '#ffffff', amount);
      if (contrast(lighter, background) >= 4.5) return lighter;
      const darker = blend(candidate, '#000000', amount);
      if (contrast(darker, background) >= 4.5) return darker;
    }
    return fallback;
  }
  function semanticTheme(theme = {}) {
    const panel = hex(theme.panel);
    const background = hex(theme.bg);
    const onAccent = [hex(theme.text), background, '#ffffff', '#000000'].sort((a, b) => contrast(b, theme.accent) - contrast(a, theme.accent))[0];
    return {
      ...theme,
      raised: hex(theme.raised) !== '#000000' || theme.raised === '#000000' ? theme.raised : blend(panel, theme.text, .08),
      inset: hex(theme.inset) !== '#000000' || theme.inset === '#000000' ? theme.inset : blend(background, '#000000', .18),
      link: theme.link && contrast(theme.link, panel) >= 4.5 ? theme.link : readable(theme.accent2, panel, theme.text),
      focus: theme.focus && contrast(theme.focus, panel) >= 3 ? theme.focus : readable(theme.accent2, panel, theme.text),
      onAccent: theme.onAccent && contrast(theme.onAccent, theme.accent) >= 4.5 ? theme.onAccent : onAccent,
    };
  }
  // Callers own foreground, accessibility fallbacks, and removing these inline properties.
  // Settings use the persisted JSON schema. Parse in the caller's userscript realm
  // instead of returning a native structuredClone page-realm Xray wrapper.
  function cloneSettings(value) { return JSON.parse(JSON.stringify(value)); }
  function applyTextGradient(element, backgroundImage) {
    const properties = {'background-color':'transparent','background-image':backgroundImage,'background-clip':'text','-webkit-background-clip':'text','background-size':'auto','background-position':'0% 0%','background-repeat':'repeat'};
    for (const [property,value] of Object.entries(properties)) element.style.setProperty(property,value,'important');
  }
  function replaceMenuContent(container, content) {
    const summary = node => node.querySelector(':scope > summary')?.textContent.trim();
    const expanded = new Set([...container.querySelectorAll('details[open]')].map(summary));
    container.replaceChildren(content);
    for (const node of container.querySelectorAll('details')) if (expanded.has(summary(node))) node.open = true;
  }
  function createDisclosure(label, ...contents) {
    return ExpMenuArrangement.createDisclosure({
      document,
      label,
      category: 'advanced',
      contents,
      className: 'exp-system-card',
    });
  }
  function createSystemGrid(...contents) {
    const grid = document.createElement('div'); grid.dataset.expSystemTools = '1';
    grid.append(...contents); return grid;
  }
  function menuWidthForMode(mode = 'compact', fullWidth = 312) {
    if (mode === 'narrow') return 220;
    if (mode === 'compact') return 260;
    const full = Number(fullWidth);
    return Number.isFinite(full) ? Math.max(280, Math.min(full, 340)) : 312;
  }
  const canonicalCss = CoreFoundation.css();
  const compositionCss = `
    [data-exp-part="dock"]{box-sizing:border-box;overflow-x:hidden;overscroll-behavior:contain}
    [data-exp-part="dock"] :is(.row,.group,.section,.fl-tool-body,.route-body,.fl-tool-title){min-width:0;max-width:100%;overflow-wrap:anywhere!important}
    [data-exp-part="dock"] :is(input,select,textarea){min-width:0;max-width:100%}
    .update-notice,.changelog{max-height:calc(100vh - 24px)!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain;overflow-wrap:anywhere}

    [data-exp-system-tools]{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;align-items:stretch;grid-column:1/-1!important;min-width:0}
    [data-exp-system-tools]>details{box-sizing:border-box;min-width:0;margin:0!important;padding:7px!important;border:1px solid var(--theme-line);border-radius:7px;grid-column:auto!important;overflow-wrap:anywhere}
    [data-exp-system-tools]>details[open]{grid-column:1/-1!important}
    [data-exp-system-tools]>details>summary{cursor:pointer;font-weight:600}
    .exp-system-card>summary{cursor:pointer}
    .exp-system-card>summary+*{margin-top:6px}
    [data-exp-part="dock"] .row:has(>select[aria-label="Menu width"]){display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,104px)!important;align-items:center;gap:8px!important}
    [data-exp-part="dock"] .row>select[aria-label="Menu width"]{box-sizing:border-box;width:100%!important;max-width:104px!important;min-width:0!important;margin:0!important}
    :host{color-scheme:dark}
    [data-exp-part="launcher"]{box-sizing:border-box!important;width:48px!important;min-width:48px!important;max-width:48px!important;height:48px!important;min-height:48px!important;max-height:48px!important}
    [data-exp-part="launcher"] .launcher-icon{width:40px!important;height:40px!important}
    .header-icon{width:38px!important;height:38px!important}
    .header-icon .menu-icon{width:38px!important;height:38px!important}
    :host([data-exp-theme-deprioritized="1"]) .theme-row:has(.exp-theme-swatches),:host([data-exp-theme-deprioritized="1"]) #mb-theme-dots{display:none!important}
    :host([data-exp-theme-deprioritized="1"]) #mb-cluster{--mb-bg:var(--theme-bg)!important;--mb-surface:var(--theme-panel)!important;--mb-chip:var(--theme-raised)!important;--mb-ink:var(--theme-text)!important;--mb-muted:var(--theme-muted)!important;--mb-line:var(--theme-line)!important;--mb-brand:var(--theme-accent)!important;--mb-brand-ink:var(--theme-onAccent)!important;--mb-hover:var(--theme-raised)!important;--mb-track:var(--theme-line)!important}
    [hidden]{display:none!important}
    .exp-core-theme{position:static;display:contents;color:var(--theme-text);font:13px/1.42 ui-sans-serif,system-ui,"Segoe UI",sans-serif}
    [data-exp-part="dock"],[data-exp-part="launcher"]{position:fixed}
    [data-exp-part="dock"]{color:var(--theme-text);scrollbar-width:thin}
    [data-exp-part="dock"] [data-exp-part="title"]{color:var(--theme-text)}
    .exp-core-theme a{color:var(--theme-link)}
    button,input,select,textarea{font-family:inherit}
    button{color:inherit}
    button:disabled{opacity:.5;cursor:not-allowed}
    button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--theme-focus);outline-offset:2px}
    button.fl-tool-header{width:100%;border:0;background:transparent;color:var(--theme-text);text-align:left;font:inherit}
    .fl-tool-header .fl-tool-chevron{font:11px/1.42 system-ui}
    .fl-tool-body[hidden]{display:none!important}
    .fl-tool-body>.group,.fl-tool-body>.section,.fl-tool-body>.flat-group{grid-column:1/-1;min-width:0}
    .fl-tool-body :is(.group,.section,.flat-group){display:grid!important;grid-template-columns:minmax(0,1fr)!important}
    .fl-tool-body :is(.group,.section,.flat-group)>*{grid-column:1/-1!important;min-width:0}
    .group,.section,.flat-group{margin:0;padding:0;border:0;background:transparent}
    .group>h3,.section>h3,.section>h2{margin:8px 0 3px;font-size:10px;font-weight:800;color:var(--theme-muted)}
    .group:first-child>h3,.section:first-child>h3{margin-top:6px}
    .group>.row,.section>.row,.flat-group>.row{min-width:0}
    .row>.copy,.row>.row-copy,.row>.setting-label,.row>div:first-child{min-width:0;flex:1}
    .label,.copy>strong,.row-copy>strong,.setting-label{font-size:11px;font-weight:500;line-height:1.25}
    .copy>.help,.row-copy>small,.help,.empty,.note,.meta{font-size:9px;line-height:1.4;color:var(--theme-muted)}
    .copy>.help,.row-copy>small{display:block;margin-top:3px}
    .toggleSwitch{padding:0;min-width:34px;max-width:34px;min-height:20px;max-height:20px}
    .toggleSwitch>span{display:none}
    .row>.life-btn,.mini-row>.life-btn{width:auto;min-width:50px;margin:0;padding:3px 7px}
    .row>select,.mini-row>select{max-width:55%}
    .button-grid,.actions,.profile-actions,.menu-footer,.diagnostics-controls>div,.rules-transfer{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;min-width:0}
    .button-grid>*{min-width:0}
    .life-btn.warn{border-color:#cb6868!important;background:#402020!important;color:#ffd7d7!important}
    input:not([type=file]),textarea{box-sizing:border-box;max-width:100%;min-width:0;border:1px solid var(--theme-line);border-radius:6px;background:var(--theme-inset);color:var(--theme-text);padding:5px 6px;font-size:11px}
    input[type=search],textarea{width:100%}
    .identity{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--theme-line)}
    .identity>.copy{flex:1;min-width:0}
    .identity-actions{display:flex;gap:6px;align-items:center}
    .identity-actions>.life-btn{width:auto;margin:0;padding:3px 6px}
    .theme-row{flex-wrap:wrap}
    .exp-theme-swatches{min-width:0}
    .appearance-group,.auth-advanced,.rule-card,.stat-card{grid-column:1/-1;min-width:0;border:1px solid var(--theme-line);border-radius:7px;margin-top:6px;padding:6px;background:var(--theme-inset)}
    summary{cursor:pointer;font-size:11px}
    .feature-pair,.category-grid{display:block}
    .status-value,output{font-size:10px;color:var(--theme-muted)}
    .live,.sr-only,.status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
    .toast{position:fixed;z-index:2147483647;right:12px;max-width:calc(100vw - 24px)}
    .update-notice{position:fixed;z-index:2147483647}
    .diag{margin:6px 0 0}
    .diag[hidden]{display:none!important}
    .diag:not([hidden]){display:block}
    .utility-grid,.stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
    .workspace-actions{grid-column:1/-1}
    .setting-arrow,.step-btn{width:25px;min-height:25px;border:1px solid var(--theme-line);border-radius:6px;background:var(--theme-raised);color:var(--theme-text)}
    .step-value{flex:1;text-align:center;font-size:10px}
    .stepper{display:flex;align-items:center;gap:5px}
  `;
  const TOGGLE = ':is(.toggleSwitch,.switch,[role="switch"])';
  const TOGGLE_BG = 'var(--theme-bg,var(--bg,#111114))';
  const TOGGLE_PANEL = 'var(--theme-panel,var(--panel,var(--surface,#18181d)))';
  const TOGGLE_LINE = 'var(--theme-line,var(--line,var(--border,#41434d)))';
  const TOGGLE_MUTED = 'var(--theme-muted,var(--muted,#9aa0a6))';
  const TOGGLE_TEXT = 'var(--theme-text,var(--text,#f4f4f6))';
  const TOGGLE_ACCENT = 'var(--theme-accent,var(--accent,var(--teal,#8b5cf6)))';
  const MATTE_TOGGLE_CHROME_CSS = `${TOGGLE}{position:relative!important;box-sizing:border-box!important;flex:none!important;width:34px!important;height:20px!important;min-width:34px!important;min-height:20px!important;padding:0!important;border:1px solid color-mix(in srgb,${TOGGLE_LINE} 88%,${TOGGLE_MUTED} 12%)!important;border-radius:6px!important;background:color-mix(in srgb,${TOGGLE_BG} 84%,${TOGGLE_PANEL} 16%)!important;background-image:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.018)!important;cursor:pointer!important}${TOGGLE}:not(:has(> span))::after{content:""!important;position:absolute!important;top:2px!important;left:2px!important;width:14px!important;height:14px!important;box-sizing:border-box!important;border:0!important;border-radius:4px!important;background:color-mix(in srgb,${TOGGLE_MUTED} 82%,${TOGGLE_TEXT} 18%)!important;box-shadow:none!important}${TOGGLE}>span{display:block!important;position:absolute!important;top:2px!important;left:2px!important;width:14px!important;height:14px!important;box-sizing:border-box!important;border:0!important;border-radius:4px!important;background:color-mix(in srgb,${TOGGLE_MUTED} 82%,${TOGGLE_TEXT} 18%)!important;box-shadow:none!important}${TOGGLE}[aria-checked="true"]{border-color:color-mix(in srgb,${TOGGLE_LINE} 52%,${TOGGLE_ACCENT} 48%)!important;background:color-mix(in srgb,${TOGGLE_PANEL} 72%,${TOGGLE_ACCENT} 28%)!important;background-image:none!important}${TOGGLE}[aria-checked="true"]:not(:has(> span))::after{transform:translateX(14px)!important;background:${TOGGLE_TEXT}!important}${TOGGLE}[aria-checked="true"]>span{transform:translateX(14px)!important;background:${TOGGLE_TEXT}!important}:host([data-ui-theme="pride"]) ${TOGGLE}[aria-checked="true"],.exp-core-theme[data-ui-theme="pride"] ${TOGGLE}[aria-checked="true"],:host([data-theme-skin="gradient"]) ${TOGGLE}[aria-checked="true"],.exp-core-theme[data-theme-skin="gradient"]:not([data-ui-theme="contrast"]) ${TOGGLE}[aria-checked="true"]{background-image:none!important;border-color:color-mix(in srgb,${TOGGLE_LINE} 52%,${TOGGLE_ACCENT} 48%)!important;background:color-mix(in srgb,${TOGGLE_PANEL} 72%,${TOGGLE_ACCENT} 28%)!important}:host([data-ui-theme="contrast"]) ${TOGGLE},:host([data-ui-theme="obsidian"]) ${TOGGLE},.exp-core-theme[data-ui-theme="contrast"] ${TOGGLE},.exp-core-theme[data-ui-theme="obsidian"] ${TOGGLE}{border:2px solid #fff!important;background:#050505!important;background-image:none!important}:host([data-ui-theme="contrast"]) ${TOGGLE}:not(:has(> span))::after,:host([data-ui-theme="obsidian"]) ${TOGGLE}:not(:has(> span))::after,.exp-core-theme[data-ui-theme="contrast"] ${TOGGLE}:not(:has(> span))::after,.exp-core-theme[data-ui-theme="obsidian"] ${TOGGLE}:not(:has(> span))::after{top:0!important;left:0!important;border:1px solid #050505!important;background:#fff!important}:host([data-ui-theme="contrast"]) ${TOGGLE}>span,:host([data-ui-theme="obsidian"]) ${TOGGLE}>span,.exp-core-theme[data-ui-theme="contrast"] ${TOGGLE}>span,.exp-core-theme[data-ui-theme="obsidian"] ${TOGGLE}>span{top:0!important;left:0!important;border:1px solid #050505!important;background:#fff!important}:host([data-ui-theme="contrast"]) ${TOGGLE}[aria-checked="true"],:host([data-ui-theme="obsidian"]) ${TOGGLE}[aria-checked="true"],.exp-core-theme[data-ui-theme="contrast"] ${TOGGLE}[aria-checked="true"],.exp-core-theme[data-ui-theme="obsidian"] ${TOGGLE}[aria-checked="true"]{background:#fff!important;border-color:#fff!important;background-image:none!important}:host([data-ui-theme="contrast"]) ${TOGGLE}[aria-checked="true"]:not(:has(> span))::after,:host([data-ui-theme="obsidian"]) ${TOGGLE}[aria-checked="true"]:not(:has(> span))::after,.exp-core-theme[data-ui-theme="contrast"] ${TOGGLE}[aria-checked="true"]:not(:has(> span))::after,.exp-core-theme[data-ui-theme="obsidian"] ${TOGGLE}[aria-checked="true"]:not(:has(> span))::after{background:#050505!important;border-color:#fff!important;transform:translateX(14px)!important}:host([data-ui-theme="contrast"]) ${TOGGLE}[aria-checked="true"]>span,:host([data-ui-theme="obsidian"]) ${TOGGLE}[aria-checked="true"]>span,.exp-core-theme[data-ui-theme="contrast"] ${TOGGLE}[aria-checked="true"]>span,.exp-core-theme[data-ui-theme="obsidian"] ${TOGGLE}[aria-checked="true"]>span{background:#050505!important;border-color:#fff!important;transform:translateX(14px)!important}@media (forced-colors: active){${TOGGLE}{forced-color-adjust:none;border:1px solid CanvasText!important;background:Canvas!important;background-image:none!important}${TOGGLE}:not(:has(> span))::after{border-color:CanvasText!important;background:CanvasText!important}${TOGGLE}>span{border-color:CanvasText!important;background:CanvasText!important}${TOGGLE}[aria-checked="true"]{border-color:Highlight!important;background:Highlight!important;background-image:none!important}${TOGGLE}[aria-checked="true"]:not(:has(> span))::after{border-color:HighlightText!important;background:HighlightText!important}${TOGGLE}[aria-checked="true"]>span{border-color:HighlightText!important;background:HighlightText!important}}`;
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const emit = (type, productId) => document.dispatchEvent(new CustomEvent('exp-core:coordination', { detail: { protocol, type, productId } }));

  function normalizeSuiteCapabilities(values = []) {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.map(value => String(value || '').trim().toLowerCase()).filter(value => /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(value)))];
  }

  function suiteContract(productId) {
    const id = String(productId || '').toLowerCase();
    const known = SUITE_PRODUCTS[id];
    if (!known) return null;
    return Object.freeze({
      id,
      role: known.role || 'product',
      repository: known.repository || '',
      rootId: known.rootId || '',
      priority: Number(known.priority || SUITE_PRIORITY[id] || 0),
      launcherPriority: Number(known.launcherPriority || LAUNCHER_PRIORITY[id] || 0),
      themePriority: Number(known.themePriority || THEME_PRIORITY[id] || 0),
      capabilities: Object.freeze(normalizeSuiteCapabilities(known.capabilities)),
      presentationPhases: Object.freeze(normalizePresentationPhases(known.presentationPhases || [])),
      menuSections: Object.freeze(Object.fromEntries(
        Object.entries(known.menuSections || {}).map(([category, sections]) => [category, Object.freeze([...sections])])
      )),
      state: known.state ? Object.freeze({
        type: known.state.type,
        fields: Object.freeze({ ...known.state.fields }),
      }) : null,
    });
  }

  function suiteProductNode(productId) {
    const id = String(productId || '').toLowerCase();
    if (!/^[a-z][a-z0-9-]+$/.test(id)) return null;
    return [...document.querySelectorAll('[data-exp-suite-product]')]
      .find(node => node.dataset.expSuiteProduct === id) || null;
  }

  function registerSuiteProduct(options = {}) {
    const id = String(options.id || options.productId || '').toLowerCase();
    const productVersion = String(options.version || options.productVersion || 'unknown');
    if (!/^[a-z][a-z0-9-]+$/.test(id)) throw new Error('Invalid suite product ID');
    const contract = suiteContract(id);
    const capabilities = normalizeSuiteCapabilities(contract ? contract.capabilities : options.capabilities);
    const priority = Number(contract?.priority ?? options.priority ?? 0);
    const role = String(contract?.role ?? options.role ?? 'product');
    let node = suiteProductNode(id);
    const previous = node ? JSON.stringify({
      version: node.dataset.expSuiteVersion || '',
      coreVersion: node.dataset.expSuiteCoreVersion || '',
      role: node.dataset.expSuiteRole || '',
      priority: node.dataset.expSuitePriority || '',
      capabilities: node.dataset.expSuiteCapabilities || '[]',
    }) : null;
    if (!node) {
      node = document.createElement('meta');
      node.dataset.expSuiteProduct = id;
      (document.documentElement || document.head || document.body)?.append(node);
    }
    node.dataset.expSuiteVersion = productVersion;
    node.dataset.expSuiteCoreVersion = version;
    node.dataset.expSuiteRole = role;
    node.dataset.expSuitePriority = String(Number.isFinite(priority) ? priority : 0);
    node.dataset.expSuiteCapabilities = JSON.stringify(capabilities);
    const current = JSON.stringify({
      version: node.dataset.expSuiteVersion,
      coreVersion: node.dataset.expSuiteCoreVersion,
      role: node.dataset.expSuiteRole,
      priority: node.dataset.expSuitePriority,
      capabilities: node.dataset.expSuiteCapabilities,
    });
    if (previous !== current) emitSuiteEvent(id, 'product.registered', { capabilities, role, version: productVersion });
    return Object.freeze({
      id,
      update(next = {}) { return registerSuiteProduct({ id, version: productVersion, role, priority, capabilities, ...next }); },
      dispose() {
        const current = suiteProductNode(id);
        if (current === node) current.remove();
        emitSuiteEvent(id, 'product.unregistered', {});
      },
    });
  }

  function suiteSnapshot() {
    const products = [...document.querySelectorAll('[data-exp-suite-product]')].map(node => {
      let capabilities = [];
      try { capabilities = normalizeSuiteCapabilities(JSON.parse(node.dataset.expSuiteCapabilities || '[]')); } catch {}
      return Object.freeze({
        id: node.dataset.expSuiteProduct,
        version: node.dataset.expSuiteVersion || 'unknown',
        coreVersion: node.dataset.expSuiteCoreVersion || 'unknown',
        role: node.dataset.expSuiteRole || 'product',
        priority: Number(node.dataset.expSuitePriority || 0),
        capabilities: Object.freeze(capabilities),
      });
    }).filter(product => product.id)
      .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));
    return Object.freeze({
      protocol: 'exp-suite-interoperability-v1',
      coreVersion: version,
      trust: SUITE_TRUST,
      products: Object.freeze(products),
    });
  }

  function capabilityProviders(capability) {
    const name = String(capability || '').trim().toLowerCase();
    return Object.freeze(suiteSnapshot().products.filter(product => product.capabilities.includes(name)));
  }

  function hasProductCapability(capability) {
    return capabilityProviders(capability).length > 0;
  }

  function pageContext() {
    return Object.freeze({
      href: location.href,
      origin: location.origin,
      hostname: location.hostname,
      pathname: location.pathname,
      topLevel: window.top === window.self,
    });
  }

  function navigationObserverMarker() {
    return document.querySelector('meta[data-exp-navigation-observer]');
  }

  function ensureSharedNavigationObserver(owner = 'core') {
    let marker = navigationObserverMarker();
    if (marker) return Object.freeze({ leader: false, owner: marker.dataset.expNavigationObserver || 'unknown' });
    marker = document.createElement('meta');
    marker.dataset.expOwned = '1';
    marker.dataset.expNavigationObserver = String(owner || 'core').toLowerCase();
    marker.dataset.expNavigationProtocol = 'exp-navigation-observer-v1';
    marker.dataset.expNavigationEpoch = '0';
    marker.dataset.expNavigationSubscribers = '0';
    (document.head || document.documentElement || document.body)?.append(marker);

    let previous = location.href;
    let epoch = 0;
    let pendingHistoryKind = '';
    let disposed = false;
    const publish = kind => {
      if (disposed) return false;
      const href = location.href;
      if (href === previous) return false;
      previous = href;
      epoch += 1;
      marker.dataset.expNavigationEpoch = String(epoch);
      const payload = JSON.stringify({
        protocol: 'exp-navigation-observer-v1',
        owner: marker.dataset.expNavigationObserver,
        epoch,
        kind: String(kind || 'navigation'),
        href,
        at: Date.now(),
      });
      document.dispatchEvent(new CustomEvent(NAVIGATION_EVENT, { detail: payload }));
      return true;
    };
    const originals = {};
    const wrappers = {};
    for (const name of ['pushState', 'replaceState']) {
      const original = history[name];
      originals[name] = original;
      const wrapped = function (...args) {
        const priorKind = pendingHistoryKind;
        pendingHistoryKind = name;
        try {
          const result = Reflect.apply(original, this, args);
          publish(name);
          return result;
        } finally {
          pendingHistoryKind = priorKind;
        }
      };
      wrappers[name] = wrapped;
      history[name] = wrapped;
    }
    const onPopState = () => publish('popstate');
    const onHashChange = () => publish('hashchange');
    const onCurrentEntryChange = () => publish(pendingHistoryKind || 'currententrychange');
    addEventListener('popstate', onPopState);
    addEventListener('hashchange', onHashChange);
    globalThis.navigation?.addEventListener('currententrychange', onCurrentEntryChange);
    const teardown = () => {
      if (disposed || Number(marker.dataset.expNavigationSubscribers || 0) > 0) return false;
      disposed = true;
      for (const name of Object.keys(wrappers)) if (history[name] === wrappers[name]) history[name] = originals[name];
      removeEventListener('popstate', onPopState);
      removeEventListener('hashchange', onHashChange);
      globalThis.navigation?.removeEventListener('currententrychange', onCurrentEntryChange);
      document.removeEventListener(NAVIGATION_CONTROL_EVENT, onControl);
      if (marker.isConnected) marker.remove();
      return true;
    };
    const onControl = event => {
      let payload;
      try { payload = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail; } catch { return; }
      if (!payload || payload.protocol !== 'exp-navigation-observer-v1' || payload.type !== 'release-if-idle') return;
      teardown();
    };
    document.addEventListener(NAVIGATION_CONTROL_EVENT, onControl);
    return Object.freeze({ leader: true, owner: marker.dataset.expNavigationObserver });
  }

  function observeNavigation(callback, options = {}) {
    if (typeof callback !== 'function') throw new TypeError('Navigation callback must be a function');
    ensureSharedNavigationObserver(options.productId || options.owner || 'core');
    let marker = navigationObserverMarker();
    if (marker) marker.dataset.expNavigationSubscribers = String(Number(marker.dataset.expNavigationSubscribers || 0) + 1);
    const listener = event => {
      let payload;
      try { payload = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail; } catch { return; }
      if (!payload || payload.protocol !== 'exp-navigation-observer-v1') return;
      callback(Object.freeze({ ...payload }));
    };
    document.addEventListener(NAVIGATION_EVENT, listener);
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      document.removeEventListener(NAVIGATION_EVENT, listener);
      marker = navigationObserverMarker();
      if (!marker) return;
      const next = Math.max(0, Number(marker.dataset.expNavigationSubscribers || 0) - 1);
      marker.dataset.expNavigationSubscribers = String(next);
      if (!next) document.dispatchEvent(new CustomEvent(NAVIGATION_CONTROL_EVENT, {
        detail: JSON.stringify({ protocol: 'exp-navigation-observer-v1', type: 'release-if-idle' }),
      }));
    };
  }

  function navigationObserverState() {
    const marker = navigationObserverMarker();
    return Object.freeze({
      active: Boolean(marker),
      owner: marker?.dataset.expNavigationObserver || null,
      protocol: marker?.dataset.expNavigationProtocol || null,
      epoch: Number(marker?.dataset.expNavigationEpoch || 0),
      subscribers: Number(marker?.dataset.expNavigationSubscribers || 0),
    });
  }

  function emitSuiteEvent(productId, type, detail = {}) {
    const source = String(productId || 'core').toLowerCase();
    const eventType = String(type || '').trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(eventType)) throw new Error('Invalid suite event type');
    let safeDetail = {};
    try { safeDetail = JSON.parse(JSON.stringify(detail || {})); } catch {}
    const payload = JSON.stringify({
      protocol: 'exp-suite-interoperability-v1',
      coreVersion: version,
      trust: SUITE_TRUST,
      source,
      type: eventType,
      detail: safeDetail,
      at: Date.now(),
    });
    document.dispatchEvent(new CustomEvent(SUITE_EVENT, { detail: payload }));
  }

  function stableSuiteValue(value) {
    if (Array.isArray(value)) return value.map(stableSuiteValue);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableSuiteValue(value[key])]));
  }

  function normalizeSuiteStateForContract(productId, type, state = {}) {
    const source = String(productId || '').toLowerCase();
    const eventType = String(type || '').trim().toLowerCase();
    const contract = suiteContract(source);
    const schema = contract?.state;
    const input = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
    if (!schema || schema.type !== eventType) return stableSuiteValue(input);
    const keys = Object.keys(input);
    const expected = Object.keys(schema.fields);
    const unknown = keys.filter(key => !Object.hasOwn(schema.fields, key));
    if (unknown.length) throw new Error(`Unknown suite state field: ${unknown[0]}`);
    const missing = expected.filter(key => !Object.hasOwn(input, key));
    if (missing.length) throw new Error(`Missing suite state field: ${missing[0]}`);
    const output = {};
    for (const [key, kind] of Object.entries(schema.fields)) {
      const value = input[key];
      if (kind === 'boolean') {
        if (typeof value !== 'boolean') throw new Error(`Invalid boolean suite state field: ${key}`);
        output[key] = value;
      } else if (kind === 'token') {
        const token = String(value ?? '').trim().toLowerCase();
        if (!/^[a-z0-9][a-z0-9._:-]{0,79}$/.test(token)) throw new Error(`Invalid token suite state field: ${key}`);
        output[key] = token;
      } else if (kind === 'count') {
        const count = Number(value);
        if (!Number.isSafeInteger(count) || count < 0) throw new Error(`Invalid count suite state field: ${key}`);
        output[key] = count;
      } else if (kind === 'percent-nullable') {
        if (value === null) output[key] = null;
        else {
          const percent = Number(value);
          if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error(`Invalid percent suite state field: ${key}`);
          output[key] = percent;
        }
      } else {
        throw new Error(`Unsupported suite state schema kind: ${kind}`);
      }
    }
    return stableSuiteValue(output);
  }

  function suiteStateNode(productId, type) {
    const source = String(productId || '').toLowerCase();
    const eventType = String(type || '').trim().toLowerCase();
    return [...document.querySelectorAll('meta[data-exp-suite-state-product][data-exp-suite-state-type]')]
      .find(node => node.dataset.expSuiteStateProduct === source && node.dataset.expSuiteStateType === eventType) || null;
  }

  function readSuiteStateNode(node) {
    if (!(node instanceof Element)) return null;
    let state = {};
    try { state = JSON.parse(node.dataset.expSuiteStatePayload || '{}'); } catch {}
    return Object.freeze({
      productId: node.dataset.expSuiteStateProduct || '',
      type: node.dataset.expSuiteStateType || '',
      coreVersion: node.dataset.expSuiteStateCoreVersion || 'unknown',
      trust: node.dataset.expSuiteStateTrust || SUITE_TRUST,
      at: Number(node.dataset.expSuiteStateAt || 0),
      state: Object.freeze(stableSuiteValue(state && typeof state === 'object' ? state : {})),
    });
  }

  function suiteStateSnapshot(productId = '') {
    const source = String(productId || '').toLowerCase();
    return Object.freeze(
      [...document.querySelectorAll('meta[data-exp-suite-state-product][data-exp-suite-state-type]')]
        .filter(node => !source || node.dataset.expSuiteStateProduct === source)
        .map(readSuiteStateNode)
        .filter(Boolean)
        .sort((left, right) => left.productId.localeCompare(right.productId) || left.type.localeCompare(right.type))
    );
  }

  function latestSuiteState(productId, type = '') {
    const source = String(productId || '').toLowerCase();
    const eventType = String(type || '').trim().toLowerCase();
    const states = suiteStateSnapshot(source).filter(entry => !eventType || entry.type === eventType);
    return states.sort((left, right) => right.at - left.at)[0] || null;
  }

  function publishSuiteState(productId, type, state = {}) {
    const source = String(productId || '').toLowerCase();
    const eventType = String(type || '').trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]+$/.test(source)) throw new Error('Invalid suite state product ID');
    if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(eventType)) throw new Error('Invalid suite state event type');
    let safeState = {};
    try {
      safeState = normalizeSuiteStateForContract(source, eventType, JSON.parse(JSON.stringify(state || {})));
    } catch (error) {
      throw error;
    }
    const serialized = JSON.stringify(safeState);
    if (serialized.length > 4096) throw new Error('Suite state payload exceeds 4096 bytes');
    const key = `${source}:${eventType}`;
    let node = suiteStateNode(source, eventType);
    const sharedFingerprint = node?.dataset.expSuiteStatePayload || '';
    if (sharedFingerprint === serialized || suiteStateFingerprints.get(key) === serialized) return false;
    suiteStateFingerprints.set(key, serialized);
    if (!node) {
      node = document.createElement('meta');
      node.dataset.expOwned = '1';
      node.dataset.expSuiteStateProduct = source;
      node.dataset.expSuiteStateType = eventType;
      (document.head || document.documentElement || document.body)?.append(node);
    }
    node.dataset.expSuiteStatePayload = serialized;
    node.dataset.expSuiteStateCoreVersion = version;
    node.dataset.expSuiteStateTrust = SUITE_TRUST;
    node.dataset.expSuiteStateAt = String(Date.now());
    emitSuiteEvent(source, eventType, safeState);
    return true;
  }

  function onSuiteEvent(callback, options = {}) {
    if (typeof callback !== 'function') throw new TypeError('Suite event callback must be a function');
    const expectedType = options.type ? String(options.type).toLowerCase() : null;
    const listener = event => {
      let payload;
      try { payload = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail; } catch { return; }
      if (!payload || payload.protocol !== 'exp-suite-interoperability-v1') return;
      if (expectedType && payload.type !== expectedType) return;
      callback(payload);
    };
    document.addEventListener(SUITE_EVENT, listener);
    return () => document.removeEventListener(SUITE_EVENT, listener);
  }

  function subscribeSuiteState(productId, callback, options = {}) {
    if (typeof callback !== 'function') throw new TypeError('Suite state callback must be a function');
    const source = String(productId || '').toLowerCase();
    if (!/^[a-z][a-z0-9-]+$/.test(source)) throw new Error('Invalid suite state product ID');
    const contractType = suiteContract(source)?.state?.type || '';
    const eventType = String(options.type || contractType).trim().toLowerCase();
    if (eventType && !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(eventType)) throw new Error('Invalid suite state event type');
    let disposed = false;
    const deliver = entry => {
      if (disposed || !entry) return;
      callback(Object.freeze({ ...entry, state: Object.freeze(stableSuiteValue(entry.state || {})) }));
    };
    if (options.immediate !== false) deliver(latestSuiteState(source, eventType));
    const stop = onSuiteEvent(event => {
      if (event.source !== source) return;
      if (eventType && event.type !== eventType) return;
      deliver(latestSuiteState(source, eventType));
    }, eventType ? { type: eventType } : {});
    return () => {
      if (disposed) return;
      disposed = true;
      stop();
    };
  }

  function normalizePresentationPhases(values = []) {
    const list = Array.isArray(values) ? values : [values];
    return [...new Set(list.map(value => String(value || '').trim().toLowerCase()).filter(value => PRESENTATION_PHASES[value]))]
      .sort((left, right) => PRESENTATION_PHASES[left] - PRESENTATION_PHASES[right]);
  }

  function presentationProviderNode(productId) {
    const id = String(productId || '').toLowerCase();
    if (!/^[a-z][a-z0-9-]+$/.test(id)) return null;
    return [...document.querySelectorAll('[data-exp-presentation-provider]')]
      .find(node => node.dataset.expPresentationProvider === id) || null;
  }

  function registerPresentationProvider(options = {}) {
    const id = String(options.id || options.productId || '').toLowerCase();
    if (!/^[a-z][a-z0-9-]+$/.test(id)) throw new Error('Invalid presentation product ID');
    const contract = suiteContract(id);
    if (contract && !contract.presentationPhases.length) throw new Error('Presentation provider is not declared for this suite product');
    const phases = normalizePresentationPhases(contract ? contract.presentationPhases : options.phases || options.phase);
    if (!phases.length) throw new Error('Presentation provider requires at least one valid phase');
    let node = presentationProviderNode(id);
    const previous = node ? JSON.stringify({
      phases: node.dataset.expPresentationPhases || '[]',
      priority: node.dataset.expPresentationPriority || '',
    }) : null;
    if (!node) {
      node = document.createElement('meta');
      node.dataset.expPresentationProvider = id;
      (document.documentElement || document.head || document.body)?.append(node);
    }
    node.dataset.expPresentationPhases = JSON.stringify(phases);
    node.dataset.expPresentationPriority = String(Number(contract?.priority ?? options.priority ?? 0) || 0);
    const current = JSON.stringify({
      phases: node.dataset.expPresentationPhases,
      priority: node.dataset.expPresentationPriority,
    });
    if (previous !== current) emitSuiteEvent(id, 'presentation.provider-registered', { phases });
    return Object.freeze({
      id,
      phases: Object.freeze([...phases]),
      dispose() {
        const current = presentationProviderNode(id);
        if (current === node) current.remove();
        emitSuiteEvent(id, 'presentation.provider-unregistered', {});
      },
    });
  }

  function presentationProviders() {
    return Object.freeze([...document.querySelectorAll('[data-exp-presentation-provider]')].map(node => {
      let phases = [];
      try { phases = normalizePresentationPhases(JSON.parse(node.dataset.expPresentationPhases || '[]')); } catch {}
      return Object.freeze({
        id: node.dataset.expPresentationProvider,
        phases: Object.freeze(phases),
        priority: Number(node.dataset.expPresentationPriority || 0),
      });
    }).filter(provider => provider.id)
      .sort((left, right) => {
        const leftPhase = Math.min(...left.phases.map(phase => PRESENTATION_PHASES[phase]));
        const rightPhase = Math.min(...right.phases.map(phase => PRESENTATION_PHASES[phase]));
        return leftPhase - rightPhase || right.priority - left.priority || left.id.localeCompare(right.id);
      }));
  }

  function suiteHealth() {
    const suite = suiteSnapshot();
    const providers = presentationProviders();
    const providerMap = new Map(providers.map(provider => [provider.id, provider]));
    const conflicts = [];
    const sameList = (left = [], right = []) => left.length === right.length && left.every((value, index) => value === right[index]);
    const products = suite.products.map(product => {
      const contract = suiteContract(product.id);
      if (!contract) {
        conflicts.push({ type: 'unknown-suite-product', products: [product.id] });
        return Object.freeze({ id: product.id, status: 'unknown-product' });
      }
      const expectedCapabilities = [...contract.capabilities].sort();
      const actualCapabilities = [...product.capabilities].sort();
      const provider = providerMap.get(product.id) || null;
      const expectedPhases = [...contract.presentationPhases];
      const actualPhases = provider ? [...provider.phases] : [];
      if (product.role !== contract.role) conflicts.push({ type: 'suite-role-mismatch', products: [product.id], expected: contract.role, actual: product.role });
      if (product.priority !== contract.priority) conflicts.push({ type: 'suite-priority-mismatch', products: [product.id], expected: contract.priority, actual: product.priority });
      if (!sameList(actualCapabilities, expectedCapabilities)) conflicts.push({ type: 'suite-capability-mismatch', products: [product.id], expected: expectedCapabilities, actual: actualCapabilities });
      if (expectedPhases.length && !provider) conflicts.push({ type: 'missing-presentation-provider', products: [product.id], expected: expectedPhases });
      if (!expectedPhases.length && provider) conflicts.push({ type: 'unexpected-presentation-provider', products: [product.id], actual: actualPhases });
      if (provider && !sameList(actualPhases, expectedPhases)) conflicts.push({ type: 'presentation-phase-mismatch', products: [product.id], expected: expectedPhases, actual: actualPhases });
      const latestState = latestSuiteState(product.id);
      return Object.freeze({
        id: product.id,
        status: conflicts.some(conflict => conflict.products?.includes(product.id)) ? 'conflict' : 'healthy',
        coreVersion: product.coreVersion,
        capabilities: Object.freeze(actualCapabilities),
        presentationPhases: Object.freeze(actualPhases),
        stateType: latestState?.type || null,
        stateAt: latestState?.at || 0,
        stateAgeMs: latestState?.at ? Math.max(0, Date.now() - latestState.at) : null,
        state: latestState?.state || null,
      });
    });
    const coreVersions = [...new Set(
      [...document.querySelectorAll('meta[data-exp-diagnostics-product]')]
        .map(node => node.dataset.expCoreVersion)
        .filter(Boolean)
    )].sort();
    if (coreVersions.length > 1) conflicts.push({ type: 'mixed-core-versions', coreVersions });
    const observerCount = document.querySelectorAll('meta[data-exp-page-observer]').length;
    if (observerCount > 1) conflicts.push({ type: 'duplicate-page-observer', instances: observerCount });
    return Object.freeze({
      status: conflicts.length ? 'conflicts-detected' : 'healthy',
      coreVersions: Object.freeze(coreVersions),
      observerCount,
      products: Object.freeze(products),
      conflicts: Object.freeze(conflicts.map(conflict => Object.freeze({ ...conflict }))),
    });
  }

  function readPresentationState(target) {
    if (!(target instanceof Element)) return Object.freeze({});
    try {
      const value = JSON.parse(target.getAttribute('data-exp-presentation-state') || '{}');
      if (!value || typeof value !== 'object' || Array.isArray(value)) return Object.freeze({});
      return Object.freeze(Object.fromEntries(Object.entries(value).map(([productId, state]) => [
        productId,
        Object.freeze({ ...(state && typeof state === 'object' && !Array.isArray(state) ? state : {}) }),
      ])));
    } catch {
      return Object.freeze({});
    }
  }

  function setPresentationState(target, productId, patch = {}) {
    if (!(target instanceof Element)) throw new TypeError('Presentation target must be an Element');
    const id = String(productId || '').toLowerCase();
    if (!/^[a-z][a-z0-9-]+$/.test(id)) throw new Error('Invalid presentation product ID');
    const previous = target.getAttribute('data-exp-presentation-state') || '';
    const current = JSON.parse(JSON.stringify(readPresentationState(target)));
    const next = { ...(current[id] || {}) };
    for (const [channel, raw] of Object.entries(patch || {})) {
      if (!PRESENTATION_CHANNELS.includes(channel)) continue;
      if (raw === null || raw === undefined || raw === '') delete next[channel];
      else {
        const value = String(raw).trim().toLowerCase();
        if (!/^[a-z0-9][a-z0-9._:-]{0,79}$/.test(value)) throw new Error('Invalid presentation state value');
        next[channel] = value;
      }
    }
    if (Object.keys(next).length) current[id] = next;
    else delete current[id];
    const serialized = Object.keys(current).length ? JSON.stringify(current) : '';
    if (serialized === previous) return readPresentationState(target);
    if (serialized) target.setAttribute('data-exp-presentation-state', serialized);
    else target.removeAttribute('data-exp-presentation-state');
    const phase = pageObserverMarker()?.dataset.expPageObserverPhase || null;
    const detail = JSON.stringify({
      protocol: 'exp-presentation-state-v1',
      source: id,
      channels: Object.keys(next),
      phase,
      at: Date.now(),
    });
    target.dispatchEvent(new CustomEvent(PRESENTATION_STATE_EVENT, {
      bubbles: true,
      composed: true,
      detail,
    }));
    emitSuiteEvent(id, 'presentation.state-changed', { channels: Object.keys(next), phase });
    return readPresentationState(target);
  }

  function clearPresentationState(target, productId) {
    return setPresentationState(target, productId, Object.fromEntries(PRESENTATION_CHANNELS.map(channel => [channel, null])));
  }

  function presentationStateChain(target) {
    const chain = [];
    let node = target instanceof Element ? target : target?.parentElement;
    while (node instanceof Element) {
      const state = readPresentationState(node);
      if (Object.keys(state).length) chain.push(Object.freeze({ node, state }));
      node = node.parentElement;
    }
    return Object.freeze(chain);
  }

  function isPresentationSuppressed(target) {
    for (const entry of presentationStateChain(target)) {
      for (const state of Object.values(entry.state)) {
        if (state?.visibility === 'hide' || state?.visibility === 'collapse') return true;
      }
    }
    return false;
  }

  function pageObserverMarker() {
    return document.querySelector('meta[data-exp-page-observer]');
  }

  function ensureSharedPageObserver(owner = 'core', options = {}) {
    let marker = pageObserverMarker();
    if (marker) return Object.freeze({ leader: false, owner: marker.dataset.expPageObserver || 'unknown' });
    marker = document.createElement('meta');
    marker.dataset.expPageObserver = String(owner || 'core').toLowerCase();
    marker.dataset.expPageObserverProtocol = 'exp-page-observer-v1';
    marker.dataset.expPageObserverEpoch = '0';
    (document.documentElement || document.head || document.body)?.append(marker);

    const delay = Math.max(16, Math.min(500, Number(options.delayMs || 60) || 60));
    let timer = 0;
    let epoch = 0;
    const pending = new Map();
    const queue = (target, record) => {
      if (!(target instanceof Element)) return;
      if (target.closest?.('[data-exp-owned="1"]')) return;
      const state = pending.get(target) || { types: new Set(), added: 0, removed: 0 };
      state.types.add(record.type);
      state.added += record.addedNodes?.length || 0;
      state.removed += record.removedNodes?.length || 0;
      pending.set(target, state);
    };
    const flush = () => {
      timer = 0;
      const entries = [...pending.entries()].filter(([target]) => target.isConnected);
      pending.clear();
      if (!entries.length) return;
      epoch += 1;
      marker.dataset.expPageObserverEpoch = String(epoch);
      const payloads = entries.map(([target, state], index) => [target, JSON.stringify({
        protocol: 'exp-page-observer-v1',
        owner: marker.dataset.expPageObserver,
        epoch,
        rootIndex: index,
        rootCount: entries.length,
        types: [...state.types].sort(),
        added: state.added,
        removed: state.removed,
        href: location.href,
        at: Date.now(),
      })]);
      payloads.forEach(([target, payload]) => {
        target.dispatchEvent(new CustomEvent(PAGE_BATCH_EVENT, { bubbles: true, composed: true, detail: payload }));
      });
      for (const phase of Object.keys(PRESENTATION_PHASES).sort((left, right) => PRESENTATION_PHASES[left] - PRESENTATION_PHASES[right])) {
        marker.dataset.expPageObserverPhase = phase;
        for (const [target, payload] of payloads) {
          target.dispatchEvent(new CustomEvent(`${PAGE_PHASE_EVENT}:${phase}`, { bubbles: true, composed: true, detail: payload }));
        }
        document.dispatchEvent(new CustomEvent(`${PAGE_PHASE_END_EVENT}:${phase}`, {
          detail: JSON.stringify({
            protocol: 'exp-page-observer-v1',
            owner: marker.dataset.expPageObserver,
            epoch,
            phase,
            rootCount: entries.length,
            href: location.href,
            at: Date.now(),
          }),
        }));
        delete marker.dataset.expPageObserverPhase;
      }
    };
    const observer = new MutationObserver(records => {
      for (const record of records) {
        const target = record.target?.nodeType === Node.TEXT_NODE ? record.target.parentElement : record.target;
        queue(target, record);
      }
      if (!timer && pending.size) timer = setTimeout(flush, delay);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    return Object.freeze({ leader: true, owner: marker.dataset.expPageObserver });
  }

  function observePage(callback, options = {}) {
    if (typeof callback !== 'function') throw new TypeError('Page observer callback must be a function');
    ensureSharedPageObserver(options.productId || options.owner || 'core', options);
    const listener = event => {
      let payload;
      try { payload = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail; } catch { return; }
      if (!payload || payload.protocol !== 'exp-page-observer-v1') return;
      callback(payload, event.target instanceof Element ? event.target : document.documentElement);
    };
    document.addEventListener(PAGE_BATCH_EVENT, listener);
    return () => document.removeEventListener(PAGE_BATCH_EVENT, listener);
  }

  function observePageBatch(callback, options = {}) {
    if (typeof callback !== 'function') throw new TypeError('Page batch callback must be a function');
    const productId = String(options.productId || options.owner || 'core').toLowerCase();
    const contract = suiteContract(productId);
    const requested = options.phase || contract?.presentationPhases?.[0] || 'observe';
    const phase = normalizePresentationPhases([requested])[0] || 'observe';
    ensureSharedPageObserver(productId, options);
    const roots = new Map();
    const rootEvent = `${PAGE_PHASE_EVENT}:${phase}`;
    const endEvent = `${PAGE_PHASE_END_EVENT}:${phase}`;
    const onRoot = event => {
      let payload;
      try { payload = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail; } catch { return; }
      if (!payload || payload.protocol !== 'exp-page-observer-v1') return;
      const root = event.target instanceof Element ? event.target : null;
      if (root) roots.set(root, payload);
    };
    const onEnd = event => {
      let payload;
      try { payload = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail; } catch { return; }
      if (!payload || payload.protocol !== 'exp-page-observer-v1' || payload.phase !== phase) return;
      const entries = [...roots.entries()];
      roots.clear();
      callback(
        Object.freeze({ ...payload }),
        Object.freeze(entries.map(([root]) => root)),
        Object.freeze(entries.map(([, detail]) => Object.freeze({ ...detail }))),
      );
    };
    document.addEventListener(rootEvent, onRoot);
    document.addEventListener(endEvent, onEnd);
    return () => {
      document.removeEventListener(rootEvent, onRoot);
      document.removeEventListener(endEvent, onEnd);
      roots.clear();
    };
  }

  function observePresentationState(callback, options = {}) {
    if (typeof callback !== 'function') throw new TypeError('Presentation state callback must be a function');
    const source = options.source ? String(options.source).toLowerCase() : '';
    const channel = options.channel ? String(options.channel).toLowerCase() : '';
    const listener = event => {
      let payload;
      try { payload = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail; } catch { return; }
      if (!payload || payload.protocol !== 'exp-presentation-state-v1') return;
      if (source && payload.source !== source) return;
      if (channel && !payload.channels?.includes(channel)) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target) callback(Object.freeze({ ...payload }), target);
    };
    document.addEventListener(PRESENTATION_STATE_EVENT, listener);
    return () => document.removeEventListener(PRESENTATION_STATE_EVENT, listener);
  }

  function pageObserverState() {
    const marker = pageObserverMarker();
    return Object.freeze({
      active: Boolean(marker),
      owner: marker?.dataset.expPageObserver || null,
      protocol: marker?.dataset.expPageObserverProtocol || null,
      epoch: Number(marker?.dataset.expPageObserverEpoch || 0),
      phase: marker?.dataset.expPageObserverPhase || null,
    });
  }

  function registerDiagnosticsProduct(productId, productVersion, host) {
    const result = ExtraPotionsDiagnostics.registerProduct(productId, productVersion, host);
    if (result) result.dataset.expCoreVersion = version;
    const contract = suiteContract(productId);
    registerSuiteProduct({ productId, productVersion });
    if (contract?.presentationPhases?.length) registerPresentationProvider({ productId });
    return result;
  }
  function menuThemeOwner() {
    return [...document.querySelectorAll('[data-exp-product-launcher="1"][data-product-id]')]
      .filter(node => node.isConnected && THEME_PRIORITY[node.dataset.productId])
      .sort((a,b) => THEME_PRIORITY[b.dataset.productId] - THEME_PRIORITY[a.dataset.productId])[0] || null;
  }
  function menuPalette(host) {
    try {
      const value = JSON.parse(host.dataset.expMenuPalette || 'null');
      if (!value || !baseTokenNames.every(key => /^#[0-9a-f]{3,8}$/i.test(value[key]))) return null;
      if (value.skin && (/url\(|var\(|;|\/\*/i.test(value.skin) || value.skin.length > 300)) return null;
      return semanticTheme(value);
    } catch { return null; }
  }
  function publishMenuPalette(host, theme) {
    if (!host || !theme) return;
    const palette = Object.fromEntries([...tokenNames,'id','skin','skinVertical','skinMode'].map(key => [key, theme[key]]));
    const serialized = JSON.stringify(palette);
    if (host.dataset.expMenuPalette === serialized) return;
    host.dataset.expMenuPalette = serialized;
    emit('menu-theme', host.dataset.productId);
  }
  // Every stylesheet Core injects is marked as owned by ExtraPotions so theming tools
  // such as SHIFT leave it alone. A <style> node carries data-exp-owned; a constructed
  // sheet has no node, so it starts with an empty marker rule that any script on the
  // page can read through the CSSOM.
  const OWNED_SHEET_MARKER = '.exp-owned-sheet-marker{}';
  function isOwnedSheet(sheet) {
    try { return sheet?.ownerNode?.dataset?.expOwned === '1' || sheet?.cssRules?.[0]?.selectorText === '.exp-owned-sheet-marker'; } catch { return false; }
  }
  function injectStyle(shadow, css, data = {}) {
    const node = document.createElement('style');
    Object.assign(node.dataset, data);
    node.dataset.expOwned = '1';
    node.textContent = css;
    shadow.append(node);
    // Constructed sheets survive pages that block style elements. Keep the style
    // node as a fallback and as the editable public handle used by product code.
    let sheet;
    try { sheet = new CSSStyleSheet(); sheet.replaceSync(OWNED_SHEET_MARKER + css); shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet]; } catch {}
    const observe = new MutationObserver(() => { if (sheet) { try { sheet.replaceSync(OWNED_SHEET_MARKER + node.textContent); } catch {} } });
    observe.observe(node, { childList: true, characterData: true, subtree: true });
    node.dispose = () => { observe.disconnect(); if (sheet) shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets].filter(s => s !== sheet); node.remove(); };
    return node;
  }
  function resolveShadowRoot(target) {
    if (target instanceof ShadowRoot) return target;
    if (target instanceof Element) {
      if (target.shadowRoot instanceof ShadowRoot) return target.shadowRoot;
      const root = target.getRootNode?.();
      if (root instanceof ShadowRoot) return root;
    }
    return null;
  }
  function applyMatteToggleChrome(target) {
    const shadow = resolveShadowRoot(target);
    if (!shadow) return false;
    if (shadow.querySelector('style[data-exp-matte-toggle-chrome]')) return true;
    injectStyle(shadow, MATTE_TOGGLE_CHROME_CSS, { expMatteToggleChrome: '1' });
    return true;
  }
  function applyTwoColumnSettingsGrid(container) {
    if (!(container instanceof HTMLElement)) return false;
    const root = resolveShadowRoot(container);
    if (root && !root.querySelector('style[data-exp-settings-grid]')) {
      injectStyle(root, '[data-exp-settings-grid="two-column"]{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:stretch!important;column-gap:0!important}[data-exp-settings-grid="two-column"]>*{grid-column:1/-1!important;min-width:0!important}[data-exp-settings-grid="two-column"]>[data-exp-grid-cell="compact"]{grid-column:1/-1!important}', { expSettingsGrid: '1' });
    }
    container.dataset.expSettingsGrid = 'two-column';
    if (root) applyMatteToggleChrome(root);
    return true;
  }
  function applyContentDrivenMenuLayout(shadow) {
    if (!(shadow instanceof ShadowRoot)) return false;
    shadow.host.dataset.expContentDrivenMenu = '1';
    if (!shadow.querySelector('style[data-exp-content-driven-menu]')) {
      injectStyle(shadow, '.fl-tool-body .action.warn{border-color:#cb6868!important;background:#402020!important;color:#ffd7d7!important}.fl-tool-body .action.warn:hover{background:#582828!important;color:#fff!important}:host([data-exp-content-driven-menu="1"]) :is(.panel,#mb-dock,[data-exp-part="dock"]){height:auto!important;min-height:0!important}:host([data-exp-content-driven-menu="1"]) :is(.fl-tool-body,.panel-body,.route-body){height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important}:host([data-exp-content-driven-menu="1"]) :is(.fl-tool-header,.panel-head,.route,.nav-item,.group>summary){height:auto!important;min-height:0!important;white-space:normal!important}:host([data-exp-content-driven-menu="1"]) :is(.fl-tool-title,.label,.setting-label,.setting-value,.copy strong,.copy .label){overflow:visible!important;text-overflow:clip!important;white-space:normal!important;word-break:normal!important;overflow-wrap:anywhere!important}:host([data-exp-content-driven-menu="1"]) :is(.row,.mini-row,.setting-row){height:auto!important;min-height:0!important;align-items:center!important}:host([data-exp-content-driven-menu="1"]) :is(.group,.section,.panel-body:not(.hidden)){grid-template-columns:minmax(0,1fr)!important}:host([data-exp-content-driven-menu="1"]) :is(.group,.section,.panel-body:not(.hidden))>*{grid-column:1/-1!important}.fl-tool-body .row:has(>select){display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)!important;min-width:0!important}.fl-tool-body .row>select{width:100%!important;min-width:0!important;max-width:100%!important}', { expContentDrivenMenu: '1' });
    }
    applyMatteToggleChrome(shadow);
    return true;
  }
  function layoutGrid() {
    const order = read(GRID_ORDER, []);
    const sorted = [...document.querySelectorAll('[data-exp-product-launcher="1"]')].sort((a,b) => {
      const ai = Array.isArray(order) ? order.indexOf(a.dataset.productId) : -1;
      const bi = Array.isArray(order) ? order.indexOf(b.dataset.productId) : -1;
      if (ai !== bi) return ai < 0 ? 1 : bi < 0 ? -1 : ai - bi;
      const ap = Number(a.dataset.launcherPriority || 0);
      const bp = Number(b.dataset.launcherPriority || 0);
      return bp - ap || a.dataset.productId.localeCompare(b.dataset.productId);
    });
    const assign = (node, slot, span = 1) => {
      const row = Math.floor(slot / 3), column = slot % 3;
      Object.assign(node.dataset, { launcherSlot:String(slot), launcherRow:String(row), launcherColumn:String(column), launcherSpan:String(span) });
      node.style.setProperty('--exp-launcher-x', column * 56 + 'px');
      node.style.setProperty('--exp-launcher-y', row * 56 + 'px');
      node.style.setProperty('--exp-launcher-offset', row * 56 + 'px');
    };
    sorted.forEach((node, index) => assign(node, index));
    const ids = sorted.map(node => node.dataset.productId);
    const known = new Set(Object.keys(SUITE_PRODUCTS));
    const completeSuite = ids.filter(id => known.has(id)).length === known.size;
    // Do not turn userscript injection timing into a saved preference. A fresh
    // install stays priority-sorted until either the complete suite is present
    // or the user explicitly reorders the visible launchers.
    if ((Array.isArray(order) && order.length) || completeSuite) write(GRID_ORDER, ids);
  }
  function interactionGridOrder() {
    let order = read(GRID_ORDER, []);
    if (!Array.isArray(order)) order = [];
    const visible = [...document.querySelectorAll('[data-exp-product-launcher="1"]')]
      .sort((a,b) => Number(a.dataset.launcherSlot || 0) - Number(b.dataset.launcherSlot || 0))
      .map(node => node.dataset.productId);
    if (!order.length) return visible;
    const seen = new Set(order);
    return [...order, ...visible.filter(id => !seen.has(id))];
  }
  function storageRead(key, fallback = null) {
    try { if (typeof GM_getValue === 'function') return GM_getValue(key, fallback); } catch {}
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function storageWrite(key, value) {
    try { if (typeof GM_setValue === 'function') { GM_setValue(key, value); return; } } catch {}
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  function claimNotice(productId, changeId) {
    const key = `exp:v3:${String(productId || 'product')}:notice:${String(changeId || 'change')}`;
    if (storageRead(key, false) === true) return false;
    storageWrite(key, true);
    return true;
  }
  function consumeVersionChange(productId, currentVersion, legacyKey = '') {
    const key = `exp:v3:${String(productId || 'product')}:installed-version`;
    let previous = String(storageRead(key, '') || '');
    if (!previous && legacyKey) { try { previous = String(localStorage.getItem(legacyKey) || ''); } catch {} }
    storageWrite(key, String(currentVersion || ''));
    return previous && previous !== currentVersion && claimNotice(productId, `updated:${currentVersion}`) ? previous : '';
  }
  function visibleFloatingNotices() {
    return [...document.querySelectorAll('[data-exp-product-launcher="1"][data-product-id]')]
      .flatMap(host => [...(host.shadowRoot?.querySelectorAll('[data-exp-floating-notice="1"]') || [])].map(notice => ({ host, notice })))
      .filter(({ notice }) => !notice.hidden && notice.getClientRects().length)
      .sort((a,b) => Number(a.host.dataset.launcherSlot || 0) - Number(b.host.dataset.launcherSlot || 0) || a.host.dataset.productId.localeCompare(b.host.dataset.productId));
  }
  function layoutFloatingNotices() {
    const launchers = [...document.querySelectorAll('[data-exp-product-launcher="1"][data-product-id]')]
      .map(host => host.shadowRoot?.querySelector('[data-exp-part="launcher"]'))
      .filter(Boolean).map(node => node.getBoundingClientRect()).filter(box => box.width && box.height);
    const notices = visibleFloatingNotices();
    if (!launchers.length || !notices.length) return;
    const anchor = document.documentElement.dataset.expLauncherAnchor === 'top' ? 'top' : 'bottom';
    const gridTop = Math.min(...launchers.map(box => box.top));
    const gridBottom = Math.max(...launchers.map(box => box.bottom));
    const gridRight = Math.max(...launchers.map(box => box.right));
    let cursor = anchor === 'top' ? gridBottom + 8 : gridTop - 8;
    for (const { notice } of notices) {
      const width = Math.min(notice.offsetWidth || notice.scrollWidth || 260, Math.max(0, innerWidth - 24));
      const height = notice.offsetHeight || notice.scrollHeight || 72;
      const top = anchor === 'top' ? cursor : cursor - height;
      notice.style.setProperty('width', `${width}px`, 'important');
      notice.style.setProperty('left', `${Math.max(8, Math.min(innerWidth - width - 8, gridRight - width))}px`, 'important');
      notice.style.setProperty('right', 'auto', 'important');
      notice.style.setProperty('top', `${Math.max(8, Math.min(innerHeight - height - 8, top))}px`, 'important');
      notice.style.setProperty('bottom', 'auto', 'important');
      cursor = anchor === 'top' ? top + height + 8 : top - 8;
    }
  }
  function registerFloatingNotice(host, notice) {
    if (!(host instanceof Element) || !(notice instanceof Element)) return () => {};
    if (floatingNoticeRegistrations.has(notice)) return floatingNoticeRegistrations.get(notice);
    notice.dataset.expFloatingNotice = '1';
    const refresh = () => requestAnimationFrame(layoutFloatingNotices);
    const mutation = new MutationObserver(refresh); mutation.observe(notice, { attributes:true, attributeFilter:['hidden','class'] });
    const resize = new ResizeObserver(refresh); resize.observe(notice);
    addEventListener('resize', refresh, { passive:true }); document.addEventListener('exp-core:coordination', refresh);
    const dispose = () => { mutation.disconnect(); resize.disconnect(); removeEventListener('resize', refresh); document.removeEventListener('exp-core:coordination', refresh); floatingNoticeRegistrations.delete(notice); };
    floatingNoticeRegistrations.set(notice, dispose); refresh(); return dispose;
  }
  function registerLauncher(host, options = {}) {
    if (registrations.has(host)) return registrations.get(host);
    const id = options.productId || options.id || host.dataset.productId;
    const contract = suiteContract(id);
    const launcherPriority = contract ? contract.launcherPriority : options.priority ?? 0;
    Object.assign(host.dataset, { expProductLauncher:'1', productId:id, launcherPriority:String(launcherPriority) });
    applyMatteToggleChrome(host);
    // The launcher is non-modal: site-wide dialog backdrop styles must never
    // paint over the page when the reference opens its manual popover.
    const backdropStyle = host.shadowRoot ? injectStyle(host.shadowRoot,
      ':host::backdrop{all:initial!important;display:none!important;background:transparent!important;pointer-events:none!important}',
      { expLauncherBackdrop: '1' }) : null;
    const stopProtect = CoreFoundation.protectLauncherHost(host);
    let frame = 0;
    const refresh = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; layoutGrid(); controllers.get(host)?.layout(); }); };
    document.addEventListener('exp-core:coordination', refresh);
    addEventListener('resize', refresh);
    layoutGrid(); emit('launcher-added', id);
    const dispose = () => { stopProtect(); backdropStyle?.dispose(); cancelAnimationFrame(frame); document.removeEventListener('exp-core:coordination', refresh); removeEventListener('resize', refresh); delete host.dataset.expProductLauncher; registrations.delete(host); layoutGrid(); emit('launcher-removed', id); };
    registrations.set(host, dispose);
    return dispose;
  }
  function themes(productTheme) {
    const common = CoreFoundation.SHARED_UI_THEMES;
    return Object.freeze([...common, CoreFoundation.CRIMSON_THEME, ...(productTheme ? [productTheme] : [CoreFoundation.UI_THEMES.at(-1)])].map(t => { const theme = semanticTheme(t); return Object.freeze({ ...theme, vars: Object.fromEntries(tokenNames.map(k => [k, theme[k]])) }); }));
  }
  function createThemeSwatches({ container, themes: choices, value, onChange = () => {} }) {
    const root = resolveShadowRoot(container);
    if (root && !root.querySelector('style[data-exp-theme-swatches]')) {
      injectStyle(root, '.exp-theme-swatches{display:flex;align-items:center;gap:6px;min-height:28px;flex-wrap:wrap}.exp-theme-swatch{appearance:none;box-sizing:border-box!important;flex:0 0 22px!important;width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important;max-width:22px!important;max-height:22px!important;padding:0!important;border:2px solid var(--theme-line,var(--line,#41434d));border-radius:5px!important;cursor:pointer}.exp-theme-swatch:hover,.exp-theme-swatch:focus-visible{outline:2px solid var(--theme-accent,var(--accent,#8b5cf6));outline-offset:2px}.exp-theme-swatch.is-on{border-color:var(--theme-text,var(--text,#fff));box-shadow:0 0 0 2px var(--theme-accent,var(--accent,#8b5cf6))}', { expThemeSwatches: '1' });
      applyMatteToggleChrome(root);
    }
    container.classList.add('exp-theme-swatches'); container.setAttribute('role', 'radiogroup'); container.setAttribute('aria-label', 'Menu Theme');
    const buttons = choices.map(theme => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'exp-theme-swatch';
      for (const property of ['width','height','min-width','min-height','max-width','max-height']) button.style.setProperty(property, '22px', 'important');
      button.style.setProperty('border-radius', '5px', 'important');
      button.style.setProperty('padding', '0', 'important');
      button.style.setProperty('box-sizing', 'border-box', 'important');
      button.style.setProperty('flex', '0 0 22px', 'important');
      button.setAttribute('role', 'radio'); button.setAttribute('aria-label', theme.name); button.title = theme.name;
      button.dataset.theme = button.dataset.swatch = theme.id; button.style.background = theme.swatch;
      button.addEventListener('click', () => { paint(theme.id); onChange(theme.id); }); container.append(button); return button;
    });
    function paint(next) { value = next; buttons.forEach((b,i) => { const on = choices[i].id === value; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(on)); b.setAttribute('aria-pressed', String(on)); b.tabIndex = on || !choices.some(t => t.id === value) && i === 0 ? 0 : -1; }); }
    const keyboard = event => { const current = buttons.indexOf(event.target); if (current < 0 || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1) + buttons.length) % buttons.length; buttons[next].click(); buttons[next].focus(); };
    container.addEventListener('keydown', keyboard); paint(value);
    return { setValue: paint, destroy() { container.removeEventListener('keydown', keyboard); buttons.forEach(b => b.remove()); } };
  }
  function focusMenuSurface(panel) { if (!(panel instanceof HTMLElement)) return false; panel.tabIndex = -1; panel.style.outline = 'none'; panel.focus({ preventScroll: true }); return true; }
  const FLOATING_NOTICE_CSS = '.exp-floating-update{position:fixed;z-index:2147483647;box-sizing:border-box;width:min(312px,calc(100vw - 24px));max-width:calc(100vw - 24px);margin:0;padding:10px 32px 10px 10px;border:1px solid var(--exp-notice-border,#6f42b4);border-radius:10px;background:linear-gradient(180deg,var(--exp-notice-top,#251a35),var(--exp-notice-bottom,#18181d) 70%);color:var(--exp-notice-text,#f4f4f6);box-shadow:0 10px 28px #0008;font:500 9px/1.45 system-ui,sans-serif}.exp-floating-update[hidden]{display:none!important}.exp-floating-update-dismiss{position:absolute;top:7px;right:7px;width:23px;height:23px;padding:0;border:1px solid transparent;border-radius:7px;background:transparent;color:inherit;cursor:pointer;font:15px/1 Arial,sans-serif}.exp-floating-update-dismiss:hover,.exp-floating-update-dismiss:focus-visible{border-color:var(--exp-notice-border,#6f42b4);outline:none}';
  function ensureFloatingNoticeStyle(shadow) {
    if (!shadow.querySelector('style[data-exp-floating-notice]')) {
      injectStyle(shadow, FLOATING_NOTICE_CSS, { expFloatingNotice: '1' });
    }
  }
  function syncNoticeTheme(notice, themeSource) {
    const theme = getComputedStyle(themeSource);
    const first = (names, fallback) => names.map(name => theme.getPropertyValue(name).trim()).find(Boolean) || fallback;
    notice.style.setProperty('--exp-notice-border', first(['--exp-notice-border','--theme-accent','--accent','--accent2','--teal','--mb-brand'], theme.borderTopColor || '#6f42b4'));
    notice.style.setProperty('--exp-notice-top', first(['--exp-notice-top','--theme-panel','--surface','--panel','--raised','--mb-surface','--bg','--mb-bg'], theme.backgroundColor || '#251a35'));
    notice.style.setProperty('--exp-notice-bottom', first(['--exp-notice-bottom','--theme-bg','--bg','--mb-bg','--surface','--mb-surface'], theme.backgroundColor || '#18181d'));
    notice.style.setProperty('--exp-notice-text', first(['--exp-notice-text','--theme-text','--text','--mb-ink'], theme.color || '#f4f4f6'));
  }
  function createFloatingNotice(options = {}) {
    const { shadow, panel, notice, versionButton = null } = options;
    const host = options.host || shadow?.host;
    if (!(shadow instanceof ShadowRoot) || !(panel instanceof Element) || !(notice instanceof Element)) return Object.freeze({ show() {}, hide() {}, toggle() {}, layout() {}, setMenuOpen() {}, destroy() {} });
    const durationMs = Math.max(0, Number(options.durationMs ?? 30000));
    const manageVersion = options.manageVersion !== false;
    let timer = 0, menuOpen = false, destroyed = false;
    ensureFloatingNoticeStyle(shadow);
    applyMatteToggleChrome(shadow);
    notice.classList.add('update-notice','exp-floating-update'); notice.setAttribute('role','status');
    let dismiss = notice.querySelector(':scope > .exp-floating-update-dismiss');
    if (!dismiss) { dismiss=document.createElement('button'); dismiss.type='button'; dismiss.className='exp-floating-update-dismiss'; dismiss.setAttribute('aria-label','Dismiss changelog'); dismiss.textContent='×'; notice.prepend(dismiss); }
    shadow.append(notice); const unregisterNotice = registerFloatingNotice(host, notice);
    const themeSource = options.themeSource instanceof Element ? options.themeSource : panel;
    const syncTheme = () => syncNoticeTheme(notice, themeSource);
    const clearTimer=()=>{clearTimeout(timer);timer=0;};
    function layout(){if(destroyed||notice.hidden)return;syncTheme();layoutFloatingNotices();}
    function hide(){clearTimer();notice.hidden=true;versionButton?.setAttribute('aria-expanded','false');layoutFloatingNotices();}
    function show(){notice.hidden=false;versionButton?.setAttribute('aria-expanded','true');clearTimer();if(durationMs)timer=setTimeout(hide,durationMs);requestAnimationFrame(layoutFloatingNotices);}
    function toggle(){if(notice.hidden)show();else hide();}
    function versionClick(){if(manageVersion)toggle();else if(!notice.hidden)show();}
    function setMenuOpen(value){menuOpen=Boolean(value);if(!menuOpen)hide();else requestAnimationFrame(layout);}
    const coordination=()=>requestAnimationFrame(layout);
    dismiss.addEventListener('click',hide);versionButton?.addEventListener('click',versionClick);addEventListener('resize',layout,{passive:true});document.addEventListener('exp-core:coordination',coordination);
    return Object.freeze({show,hide,toggle,layout,setMenuOpen,destroy(){destroyed=true;clearTimer();unregisterNotice();dismiss.removeEventListener('click',hide);versionButton?.removeEventListener('click',versionClick);removeEventListener('resize',layout);document.removeEventListener('exp-core:coordination',coordination);}});
  }
  // Core-owned update and changelog cards use the canonical menu-width notice
  // geometry. The legacy floating-notice coordinator remains exported
  // for compatibility, but it no longer owns these product notices.
  function createMenuNotice(options = {}) {
    const { shadow, panel, notice, versionButton = null } = options;
    const host = options.host || shadow?.host;
    if (!(shadow instanceof ShadowRoot) || !(panel instanceof Element) || !(notice instanceof Element)) {
      return Object.freeze({ show() {}, hide() {}, toggle() {}, layout() {}, setMenuOpen() {}, destroy() {} });
    }
    const durationMs = Math.max(0, Number(options.durationMs ?? 30000));
    const manageVersion = options.manageVersion !== false;
    let timer = 0, menuOpen = false, destroyed = false, frame = 0;

    ensureFloatingNoticeStyle(shadow);
    applyMatteToggleChrome(shadow);
    notice.classList.add('update-notice', 'exp-floating-update');
    notice.dataset.placement = 'menu';
    delete notice.dataset.expFloatingNotice;
    notice.setAttribute('role', 'status');

    let dismiss = notice.querySelector(':scope > .exp-floating-update-dismiss,.update-dismiss');
    if (!dismiss) {
      dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'exp-floating-update-dismiss';
      dismiss.setAttribute('aria-label', 'Dismiss changelog');
      dismiss.textContent = '×';
      notice.prepend(dismiss);
    }

    const themeSource = options.themeSource instanceof Element ? options.themeSource : panel;
    const syncTheme = () => syncNoticeTheme(notice, themeSource);
    function widthForMode() {
      return menuWidthForMode(host?.dataset.menuWidth || 'compact');
    }
    function clearTimer() { clearTimeout(timer); timer = 0; }
    function queueLayout() {
      if (destroyed || frame) return;
      frame = requestAnimationFrame(() => { frame = 0; layout(); });
    }
    function layout() {
      if (destroyed || notice.hidden) return;
      syncTheme();
      const width = Math.min(widthForMode(), Math.max(0, innerWidth - 24));
      notice.style.setProperty('width', width + 'px', 'important');

      const panelBox = menuOpen && !panel.hidden && panel.getClientRects().length ? panel.getBoundingClientRect() : null;
      const launcher = shadow.querySelector('[data-exp-part="launcher"]');
      const launcherBox = launcher?.getBoundingClientRect?.();
      const anchorBox = panelBox?.width && panelBox?.height ? panelBox : launcherBox;
      if (!anchorBox?.width || !anchorBox?.height) return;

      const height = notice.offsetHeight || notice.scrollHeight || 72;
      const anchor = document.documentElement.dataset.expLauncherAnchor === 'top' ? 'top' : 'bottom';
      let top;
      if (panelBox?.width && panelBox?.height) {
        const above = panelBox.top - height - 8;
        top = above >= 8 ? above : Math.min(innerHeight - height - 8, panelBox.bottom + 8);
      } else if (anchor === 'top') {
        top = Math.min(innerHeight - height - 8, anchorBox.bottom + 8);
      } else {
        top = Math.max(8, anchorBox.top - height - 8);
      }
      const left = Math.max(8, Math.min(innerWidth - width - 8, anchorBox.right - width));
      notice.style.setProperty('left', left + 'px', 'important');
      notice.style.setProperty('right', 'auto', 'important');
      notice.style.setProperty('top', Math.max(8, top) + 'px', 'important');
      notice.style.setProperty('bottom', 'auto', 'important');
    }
    function hide() {
      clearTimer();
      notice.hidden = true;
      versionButton?.setAttribute('aria-expanded', 'false');
    }
    function show() {
      notice.hidden = false;
      versionButton?.setAttribute('aria-expanded', 'true');
      clearTimer();
      if (durationMs) timer = setTimeout(hide, durationMs);
      queueLayout();
    }
    function toggle() { if (notice.hidden) show(); else hide(); }
    function versionClick() { if (manageVersion) toggle(); else if (!notice.hidden) show(); }
    function setMenuOpen(value) { menuOpen = Boolean(value); queueLayout(); }

    const resize = new ResizeObserver(queueLayout);
    resize.observe(panel);
    resize.observe(notice);
    const mutation = new MutationObserver(queueLayout);
    mutation.observe(notice, { attributes:true, attributeFilter:['hidden'], childList:true, subtree:true });
    const coordination = () => queueLayout();
    dismiss.addEventListener('click', hide);
    versionButton?.addEventListener('click', versionClick);
    addEventListener('resize', queueLayout, { passive:true });
    document.addEventListener('exp-core:coordination', coordination);

    return Object.freeze({
      show, hide, toggle, layout, setMenuOpen,
      destroy() {
        destroyed = true;
        cancelAnimationFrame(frame);
        clearTimer();
        resize.disconnect();
        mutation.disconnect();
        dismiss.removeEventListener('click', hide);
        versionButton?.removeEventListener('click', versionClick);
        removeEventListener('resize', queueLayout);
        document.removeEventListener('exp-core:coordination', coordination);
      },
    });
  }

  function applyTheme(host, value, choices) {
    const controller = controllers.get(host); if (!controller) return;
    controller.setTheme(value, choices);
  }
  function normalizeControls(panel) {
    panel.querySelectorAll('button[role="switch"],button.toggle').forEach(button => {
      button.classList.add('toggleSwitch'); button.setAttribute('role', 'switch');
      if (!button.hasAttribute('aria-checked')) button.setAttribute('aria-checked', 'false');
      const row = button.closest('.row,.mini-row,.fl-switch,.setting-row');
      if (row) { row.classList.add('fl-switch'); const label = row.querySelector('.label,.copy>strong,.row-copy>strong,.setting-label,span'); if (label) label.classList.add('fl-switch-text'); if (!button.hasAttribute('aria-label') && !button.hasAttribute('aria-labelledby')) button.setAttribute('aria-label', label?.textContent || row.textContent.trim()); }
    });
    panel.querySelectorAll('.row,.mini-row,.setting-row').forEach(row => { if (!row.classList.contains('fl-switch')) row.classList.add('mini-row'); });
    panel.querySelectorAll('select').forEach(node => node.classList.add('select-lite'));
    panel.querySelectorAll('button.action,button.secondary,button.primary,button.compact,.diagnostics-controls button,.button-grid button,.menu-footer button').forEach(node => { if (!node.dataset.expPart) node.classList.add('life-btn'); });
    panel.querySelectorAll('.route-body').forEach(body => body.classList.toggle('fl-tool-hidden', body.hidden));
    const active = panel.querySelector('.fl-tool-header[aria-expanded="true"]');
    panel.querySelectorAll('.fl-tool-header').forEach(header => { if (active) header.classList.toggle('last-opened', header === active); const chevron = header.querySelector('.fl-tool-chevron'); if (chevron) { const text = header.getAttribute('aria-expanded') === 'true' ? '▾' : '▸'; if (chevron.textContent !== text) chevron.textContent = text; } });
  }
  function normalizeHeader(panel) {
    const head = panel.querySelector('.menu-head,header,.head'); if (!head) return;
    head.classList.add('menu-head');
    const brand = head.querySelector('.header-brand,.identity,.brand'); if (!brand) return;
    brand.classList.add('header-brand');
    let icon = brand.firstElementChild;
    if (icon?.tagName === 'IMG' || icon?.tagName.toLowerCase() === 'svg') { const frame = document.createElement('div'); frame.className = 'header-icon'; icon.before(frame); frame.append(icon); icon.classList.add('menu-icon'); icon = frame; }
    if (icon) { icon.classList.add('header-icon'); icon.querySelector('img,svg')?.classList.add('menu-icon'); }
    const copy = brand.children[1]; if (copy) copy.classList.add('header-copy');
    const row = copy?.firstElementChild; row?.classList.add('header-title-row');
    const title = row?.querySelector('h1,h2,h3,strong,.menu-title'); if (title) title.dataset.expPart = 'title';
    const ver = head.querySelector('.version,.header-version,[id$="header-version"]'); if (ver) ver.dataset.expPart = 'version';
    const subtitle = copy?.querySelector('small,.subtitle,.menu-subtitle,[id$="subtitle"]'); if (subtitle) subtitle.dataset.expPart = 'subtitle';
    const close = head.querySelector('.close,.menu-close,[id$="rail-close"]'); if (close) close.dataset.expPart = 'close';
    panel.querySelector('.divider')?.classList.add('header-divider');
    for (const section of panel.querySelectorAll('nav>.tool-panel,nav>section')) {
      section.classList.add('fl-tool-panel'); const control = section.querySelector(':scope>button'); const body = section.querySelector(':scope>div'); if (!control || !body) continue;
      control.classList.add('fl-tool-header'); body.classList.add('fl-tool-body');
      if (!control.querySelector('.fl-tool-title')) { let title = control.querySelector('span:not(.chevron)'); if (!title) { title = document.createElement('span'); title.textContent = control.textContent; control.replaceChildren(title); } title.classList.add('fl-tool-title'); }
      let chevron = control.querySelector('.chevron,.fl-tool-chevron'); if (!chevron) { chevron = document.createElement('span'); chevron.textContent = '▸'; control.append(chevron); } chevron.classList.add('fl-tool-chevron');
    }
  }
  function makeLauncher(launcher, launcherSrc) {
    if (launcher.dataset.expCoreLauncher) return;
    const image = launcher.querySelector('img,.launcher-gem svg,.icon,svg:not(.launcher-ring):not(.ring)');
    if (!image) throw new Error('Core launcher requires the product launcher artwork');
    const mark = image.cloneNode(true); mark.removeAttribute('style'); mark.removeAttribute('id'); mark.setAttribute('class','icon launcher-icon');
    if (launcherSrc && mark.tagName === 'IMG') mark.src = launcherSrc;
    launcher.replaceChildren(mark); launcher.dataset.expCoreLauncher = '1'; launcher.dataset.expPart = 'launcher';
    launcher.removeAttribute('data-help');
  }
  function create(options) {
    const { id, host, shadow, launcher, panel, getSettings = () => ({}), setOpen, shortcutKey = '', productTheme, launcherSrc } = options;
    if (controllers.has(host)) return controllers.get(host);
    // All styling comes from the reference and the composition adapter. Remove
    // product copies and their constructed sheets before mounting the canonical UI.
    shadow.querySelectorAll('style').forEach(node => node.dispose ? node.dispose() : node.remove());
    try { shadow.adoptedStyleSheets = []; } catch {}
    const styles = injectStyle(shadow, canonicalCss + compositionCss, { expCoreStyle:version });
    const themeRoot = document.createElement('div'); themeRoot.className = 'exp-core-theme';
    [...shadow.childNodes].filter(node => node !== styles).forEach(node => themeRoot.append(node)); shadow.append(themeRoot);
    panel.dataset.expPart = 'dock'; panel.classList.add('exp-menu-surface'); makeLauncher(launcher,launcherSrc); normalizeHeader(panel); normalizeControls(panel);
    let defaultSupport = null;
    const header = panel.querySelector('.menu-head');
    if (header && !header.querySelector('.support-wrap') && options.supportUrl !== '') {
      defaultSupport = createSupportControl({url:options.supportUrl || SUPPORT_URL,label:'Support '+id.toUpperCase()});
      let actions = header.querySelector('.header-actions');
      if (!actions) { actions=document.createElement('div');actions.className='header-actions';const close=header.querySelector('[data-exp-part="close"]');if(close)actions.append(close);header.append(actions); }
      actions.prepend(defaultSupport.element);
    }
    applyContentDrivenMenuLayout(shadow);
    applyMatteToggleChrome(shadow);
    const versionButton=panel.querySelector('.version,[data-exp-part="version"]');
    const menuNotices=[...themeRoot.querySelectorAll('.update-notice,.changelog')].map(notice=>createMenuNotice({host,shadow,panel,notice,versionButton:notice.classList.contains('changelog')?versionButton:null,manageVersion:false,durationMs:30000}));
    if (launcherSrc) panel.querySelectorAll('.header-icon img').forEach(image => image.src = launcherSrc);
    host.dataset.coreVersion = version; host.dataset.coreSource = 'exp-core';
    let choices = themes(productTheme), selected = choices.at(-1), open = false, destroyed = false, timer = 0, deadline = 0, frame = 0;
    const removers = [];
    const on = (node,type,fn,opts) => { node.addEventListener(type,fn,opts); removers.push(() => node.removeEventListener(type,fn,opts)); };
    let localTheme = null;
    function paintTheme(theme) {
      selected = theme;
      for (const key of tokenNames) { themeRoot.style.setProperty('--theme-' + key, selected[key]); host.style.setProperty('--' + key, selected[key]); }
      themeRoot.style.setProperty('--theme-skin', selected.skin || selected.swatch || selected.accent);
      themeRoot.style.setProperty('--theme-skin-vertical', selected.skinVertical || selected.skin || selected.swatch || selected.accent);
      Object.assign(themeRoot.dataset, { uiTheme:selected.id, themeSkin:selected.skinMode === 'flat' ? 'flat' : 'gradient' });
      host.dataset.uiTheme = selected.id;
    }
    function syncThemeOwner() {
      const owner = menuThemeOwner();
      const deprioritized = Boolean(owner && owner !== host);
      host.dataset.expThemeDeprioritized = deprioritized ? '1' : '0';
      host.dataset.expThemeOwner = owner?.dataset.productId || id;
      paintTheme(deprioritized && menuPalette(owner) || localTheme);
    }
    function setTheme(value, supplied) {
      if (supplied) choices = supplied.map(t => semanticTheme({ ...t, ...t.vars, skin:t.skin || t.swatch, skinVertical:t.skinVertical || t.skin || t.swatch }));
      const alias = ({warm:'ember',discord:'glacier',pine:'verdant',obsidian:'contrast'})[value] || value;
      localTheme = choices.find(t => t.id === alias) || choices.at(-1);
      publishMenuPalette(host, localTheme);
      syncThemeOwner();
    }
    function clearTimer() { clearTimeout(timer); timer = 0; deadline = 0; }
    function scheduleDismiss() { clearTimer(); if (!open || getSettings().menuAutoClose === false) return; deadline = Date.now()+15000; timer = setTimeout(() => { if (open && Date.now() >= deadline) setOpen(false,false); },15020); }
    function layout() {
      if (destroyed || !launcher.isConnected) return;
      const state = getSettings(); const width = 'compact';
      host.dataset.menuWidth = width; themeRoot.dataset.panelWidth = width;
      themeRoot.classList.toggle('reduce-motion', state.reduceMotion === true || state.reduceMotion === 'on' || state.reducedMotion === 'reduce' || (state.reduceMotion === 'system' || state.reducedMotion === 'system') && matchMedia('(prefers-reduced-motion:reduce)').matches);
      const opacityValue = Number(state.opacityPercent);
      const opacity = state.customOpacity ? (Number.isFinite(opacityValue) ? Math.max(40, Math.min(100, Math.round(opacityValue / 5) * 5)) : 85)/100 : 1;
      themeRoot.style.setProperty('--exp-ui-opacity',String(opacity));
      const offset = parseFloat(getComputedStyle(host).getPropertyValue('--exp-launcher-offset')) || 0;
      const x = parseFloat(getComputedStyle(host).getPropertyValue('--exp-launcher-x')) || 0;
      const delta = Math.max(8-(innerHeight-60), Math.min(4, Number(read(GRID_DELTA,0)) || 0));
      const origin = innerHeight-60+delta, anchor = origin <= (innerHeight-48)/2 ? 'top':'bottom';
      document.documentElement.dataset.expLauncherAnchor = anchor;
      let top = anchor === 'top' ? origin+offset : origin-offset;

      top = Math.max(8,Math.min(innerHeight-56,top));
      Object.assign(launcher.style,{top:top+'px',right:(12+x)+'px',bottom:'auto',left:'auto',zIndex:open?'2147483647':'2147483600'});
      panel.dataset.expMenuWidth = width;
      const maxWidth = Math.max(0,innerWidth-24), panelWidth = Math.min(menuWidthForMode(width),maxWidth);
      Object.assign(panel.style,{width:panelWidth+'px',maxHeight:Math.max(0,innerHeight-80)+'px',overflowY:'auto',overflowX:'hidden',overscrollBehavior:'contain',right:'12px',left:'auto',bottom:'auto',zIndex:open?'2147483647':'2147483599'});
      if (!open) return;
      const h = panel.offsetHeight, below = innerHeight-top-56, above = top-8;
      const up = below < h+12 && above >= below;
      host.dataset.openDirection = up?'up':'down';
      panel.style.top = Math.max(8, up ? top-h-8 : Math.min(innerHeight-h-8,top+56))+'px';
      menuNotices.forEach(notice=>notice.layout());
    }
    const arrangement = ExpMenuArrangement.mount({ panel, id, onChange: queueLayout, resetLaunchers() { write(GRID_ORDER,[]);write(GRID_DELTA,0);layoutGrid();emit('launcher-grid-moved',id);queueLayout(); } });
    function queueLayout() { if (!frame && !destroyed) frame = requestAnimationFrame(() => { frame = 0; normalizeControls(panel); arrangement.update(); layout(); }); }
    let startX=0,startY=0,pointer=null,dragged=false,axis='',order=[];
    launcher.title = launcher.title || 'Drag left, right, up, or down to reorder. Alt+Arrow keys also reorder.';
    on(launcher,'pointerdown',e=>{if(e.button!==0)return;pointer=e.pointerId;startX=e.clientX;startY=e.clientY;order=interactionGridOrder();if(!order.includes(id))order.push(id);dragged=false;axis='';e.preventDefault();});
    on(document,'pointermove',e=>{if(e.pointerId!==pointer)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(!axis&&Math.max(Math.abs(dx),Math.abs(dy))>4)axis='order';if(!axis)return;dragged=true;e.preventDefault();launcher.classList.add('is-dragging');const from=order.indexOf(id),offset=Math.abs(dx)>Math.abs(dy)?Math.round(-dx/56):Math.round(dy/56)*3,to=Math.max(0,Math.min(order.length-1,from+offset)),next=[...order];next.splice(from,1);next.splice(to,0,id);write(GRID_ORDER,next);layoutGrid();emit('launcher-grid-moved',id);layout();},{passive:false});
    const end=e=>{if(e.pointerId===pointer){pointer=null;launcher.classList.remove('is-dragging');}};
    on(document,'pointerup',end);on(document,'pointercancel',end);
    on(launcher,'click',e=>{if(dragged){e.preventDefault();e.stopImmediatePropagation();dragged=false;}},true);
    on(launcher,'keydown',e=>{if(!e.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();let next=interactionGridOrder();if(!next.includes(id))next.push(id);const from=next.indexOf(id),offset={ArrowLeft:1,ArrowRight:-1,ArrowUp:-3,ArrowDown:3}[e.key],to=Math.max(0,Math.min(next.length-1,from+offset));next=[...next];next.splice(from,1);next.splice(to,0,id);write(GRID_ORDER,next);layoutGrid();emit('launcher-grid-moved',id);layout();launcher.focus();});
    for(const type of ['pointerdown','click','wheel','keydown','input','change'])on(panel,type,scheduleDismiss,{passive:type==='wheel'});
    on(window,'keydown',e=>{if(shortcutKey&&e.altKey&&e.shiftKey&&e.key.toLowerCase()===shortcutKey.toLowerCase()&&!e.repeat){e.preventDefault();setOpen(!open,true);} });
    on(window,'resize',queueLayout);on(document,'exp-core:coordination',queueLayout);
    on(document,'exp-core:coordination',syncThemeOwner);
    on(document,'exp-core:menu-open',()=>{if(open && document.documentElement.getAttribute('data-exp-open-menu')!==id)setOpen(false,false);});
    const resize = new ResizeObserver(queueLayout); resize.observe(panel);
    const mutation = new MutationObserver(records=>{if(records.some(r=>r.type==='childList'||r.attributeName==='hidden'))queueLayout();}); mutation.observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    const controller = {
      layout, setTheme,
      state(value) {open=Boolean(value);if(open){document.documentElement.setAttribute('data-exp-open-menu',id);document.dispatchEvent(new Event('exp-core:menu-open'));}panel.classList.toggle('fl-rail-open',open);menuNotices.forEach(notice=>notice.setMenuOpen(open));if(open)scheduleDismiss();else clearTimer();queueLayout();},
      update(){normalizeControls(panel);queueLayout();},
      get dismissAt(){return deadline;},
      destroy(){destroyed=true;arrangement.destroy();defaultSupport?.destroy();clearTimer();cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect();menuNotices.forEach(notice=>notice.destroy());removers.forEach(f=>f());styles.dispose();controllers.delete(host);}
    };
    controllers.set(host,controller);setTheme(id);
    queueLayout();return controller;
  }
  function createReleaseUpdateChecker(options = {}) {
    const productId = String(options.productId || '').toLowerCase();
    const repository = String(options.repository || '');
    const resolveCurrentVersion = typeof options.currentVersion === 'function'
      ? () => String(options.currentVersion() || '')
      : () => String(options.currentVersion || '');
    const enabled = typeof options.enabled === 'function' ? options.enabled : () => true;
    const onError = typeof options.onError === 'function' ? options.onError : () => {};
    if (!productId || !repository) throw new Error('Incomplete update checker configuration');
    function getCurrentVersion() {
      const currentVersion = resolveCurrentVersion();
      if (!currentVersion) throw new Error('Update checker current version unavailable');
      return currentVersion;
    }

    const ENDPOINT = String(options.endpoint || ('https://api.github.com/repos/' + repository + '/releases/latest'));
    const CACHE_KEY = 'exp:v3:' + productId + ':update-cache';
    const CHECK_INTERVAL = 15 * 60 * 1000;
    const CHECK_LEASE = 30 * 1000;
    let memory = {};

    function readState() {
      try {
        if (typeof GM_getValue === 'function') {
          const value = GM_getValue(CACHE_KEY, null);
          if (value && typeof value === 'object' && !Array.isArray(value)) return { ...value };
        }
      } catch {}
      try {
        const value = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (value && typeof value === 'object' && !Array.isArray(value)) return { ...value };
      } catch {}
      return { ...memory };
    }
    function writeState(value) {
      memory = { ...(value || {}) };
      try { if (typeof GM_setValue === 'function') GM_setValue(CACHE_KEY, memory); } catch {}
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(memory)); } catch {}
    }
    function releaseDetails(body) {
      const details = [];
      let section = false;
      for (const line of String(body || '').split(/\r?\n/)) {
        if (/^##\s+/.test(line)) { if (section) break; section = true; continue; }
        if (!section) continue;
        const match = line.match(/^\s*[-*]\s+(.+)/);
        if (!match) continue;
        const detail = match[1].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*_]/g, '').trim();
        if (detail) details.push(detail.slice(0, 220));
        if (details.length === 4) break;
      }
      return details;
    }
    function normalize(state) {
      const next = { ...(state || {}) };
      if (!Object.hasOwn(next, 'lastCheckAt') && next.checkedAt) next.lastCheckAt = Number(next.checkedAt) || 0;
      if (!Object.hasOwn(next, 'lastRemoteVersion') && next.latest) next.lastRemoteVersion = String(next.latest || '');
      if (!Array.isArray(next.details)) next.details = [];
      return next;
    }
    function snapshot(state, stateName) {
      const currentVersion = getCurrentVersion();
      const next = normalize(state);
      const latest = String(next.lastRemoteVersion || '');
      return {
        checkedAt: Number(next.lastCheckAt || 0),
        latest: latest || null,
        state: stateName || next.state || 'idle',
        current: currentVersion,
        available: Boolean(latest && CoreFoundation.compareVersions(latest, currentVersion) > 0),
        details: next.details.slice(0, 4),
        checkedForVersion: next.checkedForVersion || null,
        lastRemoteVersion: latest || null,
        lastHttpStatus: Number(next.lastHttpStatus || 0),
        lastError: String(next.lastError || ''),
      };
    }
    function request() {
      return new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== 'function') return reject(Object.assign(new Error('Update request capability unavailable'), { code:'UPDATE_CAPABILITY' }));
        GM_xmlhttpRequest({
          method:'GET',
          url:ENDPOINT,
          timeout:10000,
          headers:{ Accept:'application/vnd.github+json', 'Cache-Control':'no-cache', Pragma:'no-cache' },
          onload(response) {
            if (response.status >= 200 && response.status < 300) return resolve(response);
            reject(Object.assign(new Error('Update metadata request failed'), { code:'UPDATE_HTTP_' + response.status, status:response.status }));
          },
          onerror:() => reject(Object.assign(new Error('Update metadata request failed'), { code:'UPDATE_NETWORK' })),
          ontimeout:() => reject(Object.assign(new Error('Update metadata request timed out'), { code:'UPDATE_TIMEOUT' })),
        });
      });
    }
    async function check(force = false) {
      const currentVersion = getCurrentVersion();
      let state = normalize(readState());
      if (!enabled() && !force) return snapshot(state, 'disabled');

      const now = Date.now();
      const checkedForCurrentVersion = state.checkedForVersion === currentVersion;
      if (!checkedForCurrentVersion) {
        state.checkedForVersion = currentVersion;
        state.lastCheckAt = 0;
        state.checkLeaseUntil = 0;
        state.lastRemoteVersion = '';
        state.lastHttpStatus = 0;
        state.lastError = '';
        state.details = [];
        state.availableVersion = '';
        state.availableAt = 0;
      }
      writeState(state);

      if (!force && Number(state.checkLeaseUntil || 0) > now) return snapshot(state, 'checking');
      if (!force && checkedForCurrentVersion && now - Number(state.lastCheckAt || 0) < CHECK_INTERVAL) return snapshot(state, 'cached');

      state.checkedForVersion = currentVersion;
      state.lastCheckAt = now;
      state.checkLeaseUntil = now + CHECK_LEASE;
      state.lastError = '';
      state.state = 'checking';
      writeState(state);

      try {
        const response = await request();
        const payload = JSON.parse(String(response.responseText || '{}'));
        const latest = String(payload.tag_name || '').replace(/^v/, '');
        if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(latest)) throw Object.assign(new Error('Invalid update metadata'), { code:'UPDATE_METADATA' });

        state = normalize(readState());
        state.checkedForVersion = currentVersion;
        state.lastCheckAt = Date.now();
        state.checkLeaseUntil = 0;
        state.lastRemoteVersion = latest;
        state.lastHttpStatus = Number(response.status || 0);
        state.lastError = '';
        state.details = releaseDetails(payload.body);
        state.state = 'checked';
        if (CoreFoundation.compareVersions(latest, currentVersion) > 0) {
          state.availableVersion = latest;
          state.availableAt = Date.now();
        } else {
          state.availableVersion = '';
          state.availableAt = 0;
        }
        writeState(state);
        return snapshot(state, 'checked');
      } catch (error) {
        state = normalize(readState());
        state.checkedForVersion = currentVersion;
        state.lastCheckAt = Date.now();
        state.checkLeaseUntil = 0;
        state.lastError = String(error?.message || 'Update check failed');
        state.state = 'failed';
        writeState(state);
        try { onError(error); } catch {}
        return snapshot(state, 'failed');
      }
    }
    function status() { return snapshot(readState()); }
    return Object.freeze({
      get CURRENT_VERSION() { return getCurrentVersion(); },
      ENDPOINT,
      CHECK_INTERVAL,
      check,
      status,
      compare: CoreFoundation.compareVersions,
    });
  }

  function createSupportControl({ url, label = 'Support' } = {}) {
    if (!url) return null;
    const wrapper = document.createElement('div');
    wrapper.className = 'support-wrap';
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'exp-support-button';
    button.className = 'support-button';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'exp-support-popover');
    button.title = label;
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.2-4.35-9.55-8.45C.42 9.02 2.3 5 6.25 5c2.15 0 3.56 1.21 4.33 2.3C11.36 6.21 12.77 5 14.92 5c3.95 0 5.83 4.02 3.8 7.55C16.36 16.65 12 21 12 21Z"/></svg>';
    const popover = document.createElement('div');
    popover.id = 'exp-support-popover';
    popover.className = 'support-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', label);
    popover.hidden = true;
    const strong = document.createElement('strong');
    strong.textContent = label;
    const copy = document.createElement('span');
    copy.textContent = 'Donations are optional. All features stay free.';
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = 'Open Ko-fi';
    popover.append(strong, copy, anchor, ExtraPotionsTools.createBitcoinDonation());
    wrapper.append(button, popover);
    const toggle = event => {
      event?.stopPropagation?.();
      ExtraPotionsTools.placeDonationPanel(popover,button);
      popover.hidden = !popover.hidden;
      button.setAttribute('aria-expanded', String(!popover.hidden));
    };
    const outside = event => {
      if (popover.hidden || event.composedPath().includes(wrapper) || event.composedPath().includes(popover)) return;
      popover.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    };
    button.addEventListener('click', toggle);
    document.addEventListener('pointerdown', outside, true);
    return Object.freeze({
      element: wrapper,
      button,
      popover,
      hide() { popover.hidden = true; button.setAttribute('aria-expanded', 'false'); },
      destroy() { button.removeEventListener('click', toggle); document.removeEventListener('pointerdown', outside, true); popover.remove(); wrapper.remove(); },
    });
  }

  function createProductNotice(options = {}) {
    const { host, shadow, panel, versionButton = null } = options;
    if (!(host instanceof Element) || !(shadow instanceof ShadowRoot) || !(panel instanceof Element)) {
      throw new Error('Product notice requires a mounted Core product');
    }
    const notice = document.createElement('div');
    notice.className = 'update-notice';
    notice.dataset.expUpdateNotice = '1';
    notice.hidden = true;
    notice.innerHTML = '<button type="button" class="update-dismiss" aria-label="Dismiss Update Notice">×</button><div class="update-head"><div class="update-heading"><div class="update-kicker">What\'s New</div><div class="update-title"></div></div><div class="update-version"></div></div><div class="update-text"></div><ul class="update-list"></ul><div class="update-footer"><a class="update-release" target="_blank" rel="noopener noreferrer">GitHub Release</a><a class="update-action" target="_blank" rel="noopener noreferrer">Install Update</a></div>';
    (shadow.querySelector('.exp-core-theme') || shadow).append(notice);
    const controller = createMenuNotice({
      host,
      shadow,
      panel,
      notice,
      versionButton: null,
      manageVersion: false,
      durationMs: options.durationMs ?? 30000,
    });
    function show(state = {}) {
      notice.querySelector('.update-kicker').textContent = state.kicker || "What's New";
      notice.querySelector('.update-title').textContent = state.title || '';
      notice.querySelector('.update-version').textContent = state.version ? 'v' + state.version : '';
      notice.querySelector('.update-text').textContent = state.text || '';
      const list = notice.querySelector('.update-list');
      list.replaceChildren();
      const details = Array.isArray(state.details) ? state.details.slice(0, 4) : [];
      for (const detail of details) {
        const item = document.createElement('li');
        item.textContent = detail;
        list.append(item);
      }
      list.hidden = !details.length;
      const release = notice.querySelector('.update-release');
      const releaseUrl = state.releaseUrl || options.releaseUrl || '';
      release.hidden = !releaseUrl;
      if (releaseUrl) release.href = releaseUrl;
      const action = notice.querySelector('.update-action');
      const actionUrl = state.actionUrl || options.installUrl || '';
      action.hidden = !actionUrl || state.showAction === false;
      if (actionUrl) action.href = actionUrl;
      action.textContent = state.actionText || 'Install Update';
      notice.dataset.noticeKind = state.kind || 'current';
      controller.setMenuOpen(!panel.hidden);
      controller.show();
    }
    const versionClick = () => {
      if (typeof options.onVersion === 'function') options.onVersion();
      else controller.toggle();
    };
    versionButton?.addEventListener('click', versionClick);
    return Object.freeze({
      element: notice,
      show,
      hide: controller.hide,
      toggle: controller.toggle,
      layout: controller.layout,
      setMenuOpen: controller.setMenuOpen,
      destroy() {
        versionButton?.removeEventListener('click', versionClick);
        controller.destroy();
        notice.remove();
      },
    });
  }

  function productCompatibilityReport() {
    const base = ExtraPotionsDiagnostics.compatibility();
    const interoperability = suiteHealth();
    const conflicts = [
      ...(Array.isArray(base.conflicts) ? base.conflicts : []),
      ...interoperability.conflicts,
    ];
    return Object.freeze({
      ...base,
      conflicts: Object.freeze(conflicts.map(conflict => Object.freeze({ ...conflict }))),
      status: conflicts.length ? 'conflicts-detected' : 'no-conflicts-observed',
      interoperability,
    });
  }

  function createSuiteCompatibilityControls() {
    const details = document.createElement('details');
    details.className = 'exp-tools-card';
    details.style.cssText = 'border:1px solid var(--theme-line,var(--line,#777));border-radius:7px;padding:7px;margin-top:8px';
    const summary = document.createElement('summary');
    summary.textContent = 'Product compatibility';
    const output = document.createElement('div');
    output.setAttribute('aria-live', 'polite');
    const refreshButton = document.createElement('button');
    refreshButton.type = 'button';
    refreshButton.className = 'life-btn action';
    refreshButton.textContent = 'Refresh compatibility';

    const refresh = () => {
      output.replaceChildren();
      const report = productCompatibilityReport();
      const suite = suiteSnapshot();
      const healthById = new Map(report.interoperability.products.map(product => [product.id, product]));
      if (!suite.products.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No ExtraPotions products are registered on this page yet.';
        output.append(empty);
      }
      for (const product of suite.products) {
        const health = healthById.get(product.id);
        const line = document.createElement('p');
        const stateAge = health?.stateAgeMs == null ? '' : ` · state ${Math.max(0, Math.round(health.stateAgeMs / 1000))}s ago`;
        line.textContent = `${product.id.toUpperCase()} ${product.version} · Core ${product.coreVersion} · ${health?.status === 'healthy' ? 'Healthy' : 'Check compatibility'}${stateAge}`;
        output.append(line);
      }

      const observers = document.createElement('p');
      const page = pageObserverState();
      const navigation = navigationObserverState();
      observers.textContent = `Shared observers · DOM: ${page.active ? page.owner || 'active' : 'idle'} · Navigation: ${navigation.active ? navigation.owner || 'active' : 'idle'}`;
      output.append(observers);

      const status = document.createElement('p');
      status.textContent = report.conflicts.length
        ? report.conflicts.map(conflict => conflict.type).join(', ')
        : 'No interoperability conflicts detected on this page.';
      output.append(status);

      const note = document.createElement('small');
      note.textContent = 'Only products running on this page are shown. Shared suite state is advisory coordination data, not an authorization signal.';
      output.append(note);
    };

    details.addEventListener('toggle', () => { if (details.open) refresh(); });
    refreshButton.addEventListener('click', refresh);
    details.append(summary, output, refreshButton);
    return details;
  }

  function createDiagnosticsReport(product, details = {}) {
    const report = ExtraPotionsDiagnostics.createReport(product, details, { version, source: 'exp-core', sourceVersion });
    return {
      ...report,
      interoperability: {
        suite: suiteSnapshot(),
        presentation: {
          phases: { ...PRESENTATION_PHASES },
          providers: presentationProviders(),
        },
        pageObserver: pageObserverState(),
        navigationObserver: navigationObserverState(),
        states: suiteStateSnapshot(),
        health: suiteHealth(),
      },
    };
  }
  function downloadDiagnostics(report) {
    const name=`${String(report.report||'Diagnostics').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return; } catch {}
    const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px';document.documentElement.append(area);area.select();const success=document.execCommand('copy');area.remove();if(!success)throw new Error('Clipboard unavailable');
  }
  function createDiagnosticsControls(getReport, notify = () => {}) { return ExtraPotionsDiagnostics.createControls(getReport, notify); }
  function createProduct({id,name,version:productVersion,subtitle='',artwork,theme,sections=[],getSettings,onSettings=()=>{},priority,supportUrl=SUPPORT_URL}) {
    const host=document.createElement('div');host.id='exp-'+id+'-root';host.dataset.expOwned='1';const shadow=host.attachShadow({mode:'open'});const panel=document.createElement('aside');panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label',name+' settings');
    const header=document.createElement('header');header.className='menu-head';const brand=document.createElement('div');brand.className='header-brand';const image=document.createElement('img');image.src=artwork;image.alt='';const copy=document.createElement('div');const titleRow=document.createElement('div');const title=document.createElement('strong');title.textContent=name;const v=document.createElement('button');v.type='button';v.className='version';v.textContent='v'+productVersion;titleRow.append(title,v);const sub=document.createElement('small');sub.textContent=subtitle;copy.append(titleRow,sub);brand.append(image,copy);const close=document.createElement('button');close.className='close';close.textContent='×';close.setAttribute('aria-label','Close '+name);const actions=document.createElement('div');actions.className='header-actions';const support=createSupportControl({url:supportUrl,label:'Support '+name});if(support)actions.append(support.element);actions.append(close);header.append(brand,actions);const divider=document.createElement('div');divider.className='header-divider';const nav=document.createElement('nav');
    let isOpen=false, activeId='';let chrome;
    const sectionMap=new Map();
    function renderSection(section,body){const content=section.render({core:api,onSettings});replaceMenuContent(body,content);chrome?.update();}
    function renderActive(){if(!activeId)return false;const entry=sectionMap.get(activeId);if(!entry||entry.body.hidden)return false;renderSection(entry.section,entry.body);return true;}
    function setOpen(value,focus=true){isOpen=Boolean(value);panel.hidden=!isOpen;launcher.setAttribute('aria-expanded',String(isOpen));if(isOpen){activeId='';nav.querySelectorAll('.route-body').forEach(n=>n.hidden=true);nav.querySelectorAll('button[data-section]').forEach(n=>n.setAttribute('aria-expanded','false'));}chrome.state(isOpen);if(focus)(isOpen?focusMenuSurface(panel):launcher.focus());}
    for(const section of sections){const group=document.createElement('section');group.className='tool-panel';const button=document.createElement('button');button.type='button';button.textContent=section.label;button.dataset.section=section.id;const body=document.createElement('div');body.className='route-body';body.hidden=true;sectionMap.set(section.id,{section,body,button});button.addEventListener('click',()=>{const opening=body.hidden;nav.querySelectorAll('.route-body').forEach(n=>n.hidden=true);nav.querySelectorAll('button[data-section]').forEach(n=>{n.classList.toggle('last-opened',n===button);n.setAttribute('aria-expanded',String(opening&&n===button));});body.hidden=!opening;activeId=opening?section.id:'';if(opening)renderSection(section,body);chrome.update();});group.append(button,body);nav.append(group);}
    const launcher=document.createElement('button');launcher.className='launcher';launcher.type='button';launcher.setAttribute('aria-label','Open '+name);const mark=image.cloneNode(true);launcher.append(mark);launcher.addEventListener('click',()=>setOpen(!isOpen));close.addEventListener('click',()=>setOpen(false));panel.append(header,divider,nav);shadow.append(panel,launcher);document.documentElement.append(host);chrome=create({id,host,shadow,panel,launcher,getSettings,setOpen,productTheme:theme,supportUrl});const unregister=registerLauncher(host,{productId:id,priority});
    const key=e=>{if(e.key==='Escape'&&isOpen)setOpen(false);};document.addEventListener('keydown',key);
    return {host,shadow,panel,launcher,versionButton:v,open:()=>setOpen(true),close:()=>setOpen(false),toggle:()=>setOpen(!isOpen),refresh:()=>chrome.update(),renderActive,get isOpen(){return isOpen;},destroy(){document.removeEventListener('keydown',key);support?.destroy();chrome.destroy();unregister();host.remove();}};
  }
  let gridFrame=0;
  const scheduleGrid=()=>{if(!gridFrame)gridFrame=requestAnimationFrame(()=>{gridFrame=0;layoutGrid();});};
  const gridObserver=new MutationObserver(scheduleGrid);
  const startGrid=()=>{if(!document.documentElement)return;gridObserver.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-exp-product-launcher','data-product-id','data-launcher-priority','data-launcher-reserved-rows']});scheduleGrid();};
  if(document.documentElement)startGrid();else addEventListener('DOMContentLoaded',startGrid,{once:true});
  document.addEventListener('exp-core:coordination',scheduleGrid);
  addEventListener('resize',scheduleGrid,{passive:true});
  // Core-owned product bootstrap for downstream consumers.
  function createProductServices(options = {}) {
    const productId = String(options.productId || '').toLowerCase();
    const repository = String(options.repository || '');
    const currentVersion = options.currentVersion;
    if (!productId || !repository || (typeof currentVersion !== 'function' && !String(currentVersion || ''))) {
      throw new Error('Incomplete product services configuration');
    }
    const lifecycle = createProductLifecycle(api);
    const diagnostics = Object.freeze({
      createDiagnosticsReport,
      downloadDiagnostics,
      createDiagnosticsControls,
    });
    const updates = createReleaseUpdateChecker({
      productId,
      repository,
      currentVersion,
      endpoint: options.endpoint,
      enabled: options.enabled,
      onError: options.onError,
    });
    return Object.freeze({ lifecycle, diagnostics, updates });
  }

  const api = Object.freeze({...ExtraPotionsTools,version,sourceVersion,protocol,gridProtocol,reference:CoreFoundation,css:canonicalCss,themes,create,createProduct,createSupportControl,createProductNotice,createLifecycle:()=>createProductLifecycle(api),createProductServices,registerLauncher,layout:layoutGrid,replaceMenuContent,createDisclosure,createSystemGrid,isOwnedSheet,menuWidthForMode,cloneSettings,applyTextGradient,injectStyle,applyTheme,applyMatteToggleChrome,applyTwoColumnSettingsGrid,applyContentDrivenMenuLayout,createThemeSwatches,publishMenuPalette,createFloatingNotice,createMenuNotice,createReleaseUpdateChecker,registerFloatingNotice,layoutFloatingNotices,claimNotice,consumeVersionChange,focusMenuSurface,registerDiagnosticsProduct,registerSuiteProduct,suiteContract,suiteSnapshot,hasProductCapability,capabilityProviders,emitSuiteEvent,publishSuiteState,suiteStateSnapshot,latestSuiteState,subscribeSuiteState,onSuiteEvent,pageContext,observeNavigation,navigationObserverState,suiteTrust:SUITE_TRUST,registerPresentationProvider,presentationProviders,suiteHealth,readPresentationState,setPresentationState,clearPresentationState,presentationStateChain,isPresentationSuppressed,presentationPhases:PRESENTATION_PHASES,presentationChannels:PRESENTATION_CHANNELS,observePresentationState,observePage,observePageBatch,pageObserverState,suiteProducts:SUITE_PRODUCTS,suitePriority:SUITE_PRIORITY,productCompatibility:productCompatibilityReport,createCompatibilityControls:createSuiteCompatibilityControls,bindDiagnosticsControls:ExtraPotionsDiagnostics.bindControls,createDiagnosticsReport,downloadDiagnostics,createDiagnosticsControls,mountMenuArrangement:ExpMenuArrangement.mount,menuCategories:ExpMenuArrangement.categories,categorizeMenuSections:ExpMenuArrangement.describe,createMenuCategoryDisclosure:(label,category,...contents)=>ExpMenuArrangement.createDisclosure({document,label,category,contents}),collapseMenuSubmenus:ExpMenuArrangement.collapseSubmenus,compareVersions:CoreFoundation.compareVersions});
  return api;
})();

const services = ExtraPotionsCore.createProductServices({
  productId: 'ward',
  repository: 'ExtraPotions/WARD',
  currentVersion: () => EXP.VERSION,
  enabled: () => EXP.Settings.snapshot().updateNotifications,
  onError: error => EXP.Core.safeError(Object.assign(error, { code: 'UPDATE_CHECK' }), 'ward.updates'),
});
EXP.Core = services.lifecycle;
EXP.Diagnostics = services.diagnostics;
EXP.Updates = services.updates;

EXP.Settings = (() => {
  const PREFIX = 'exp:v3:ward';
  const SCHEMA = 1;
  const memory = new Map();
  const defaults = Object.freeze({
    schema: SCHEMA,
    enabled: true,
    retailers: Object.freeze({ amazon: true, walmart: true, ebay: true, etsy: true }),
    protectionLevel: 'balanced',
    contentAction: 'automatic',
    confidencePolicy: 'confirmed-supported',
    defaultAction: 'collapse',
    safeMode: false,
    autoClipCoupons: true,
    compactSearch: false,
    recommendationCleanup: true,
    reducedMotion: 'system',
    nonColorIndicators: true,
    explanationDetail: 'concise',
    updateNotifications: false,
    launcherPosition: 'automatic-end-bottom',
    menuWidth: 'compact',
    uiTheme: 'ward',
    menuAutoClose: true,
    menuNotifications: true,
    shortcut: '',
    categories: {},
    pageExceptions: [],
    patterns: {}
  });
  let state;
  const listeners = new Set();
  const key = (name) => `${PREFIX}:${name}`;
  function read(name) {
    const storageKey = key(name);
    try {
      if (typeof GM_getValue === 'function') {
        const value = GM_getValue(storageKey, undefined);
        if (value !== undefined) return value;
      }
    } catch {}
    try {
      const value = localStorage.getItem(storageKey);
      if (value !== null) {
        const parsed = JSON.parse(value);
        memory.set(storageKey, parsed);
        try { if (typeof GM_setValue === 'function') GM_setValue(storageKey, parsed); } catch {}
        return parsed;
      }
    } catch {}
    return memory.get(storageKey);
  }
  function write(name, value) {
    const storageKey = key(name);
    memory.set(storageKey, value);
    try { if (typeof GM_setValue === 'function') GM_setValue(storageKey, value); } catch {}
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch {}
  }
  function validate(candidate) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw Object.assign(new Error('Settings must be an object'), { code: 'SETTINGS_TYPE' });
    const next = ExtraPotionsCore.cloneSettings(defaults);
	const themeAliases = { warm: 'ember', discord: 'glacier', pine: 'verdant', obsidian: 'contrast' };
	const normalizedUiTheme = themeAliases[candidate.uiTheme] || candidate.uiTheme;
    for (const name of ['enabled', 'safeMode', 'autoClipCoupons', 'compactSearch', 'recommendationCleanup', 'nonColorIndicators', 'updateNotifications', 'menuAutoClose', 'menuNotifications']) if (typeof candidate[name] === 'boolean') next[name] = candidate[name];
    // One switch per store. The earlier single amazonEnabled setting migrates into it.
    const stores = { ...defaults.retailers };
    if (typeof candidate.amazonEnabled === 'boolean') stores.amazon = candidate.amazonEnabled;
    if (candidate.retailers && typeof candidate.retailers === 'object' && !Array.isArray(candidate.retailers)) {
      for (const key of Object.keys(stores)) if (typeof candidate.retailers[key] === 'boolean') stores[key] = candidate.retailers[key];
    }
    next.retailers = stores;
    const enums = { protectionLevel: ['essential', 'balanced', 'custom'], contentAction: ['automatic', 'hide', 'dim'], confidencePolicy: ['confirmed', 'confirmed-supported', 'custom'], defaultAction: ['hide', 'dim', 'collapse', 'annotate', 'allow'], reducedMotion: ['system', 'reduce', 'allow'], explanationDetail: ['concise', 'detailed'], launcherPosition: ['automatic-end-bottom', 'end-top', 'end-bottom', 'start-top', 'start-bottom'], menuWidth: ['full', 'compact', 'narrow'], uiTheme: ['ember', 'midnight', 'glacier', 'contrast', 'verdant', 'pride', 'crimson', 'ward'] };
    for (const [name, values] of Object.entries(enums)) {
	  const value = name === 'uiTheme' ? normalizedUiTheme : candidate[name];
	  if (values.includes(value)) next[name] = value;
	}
    if (typeof candidate.shortcut === 'string' && candidate.shortcut.length <= 40) next.shortcut = candidate.shortcut;
    for (const field of ['categories', 'patterns']) if (candidate[field] && typeof candidate[field] === 'object' && !Array.isArray(candidate[field])) next[field] = Object.fromEntries(Object.entries(candidate[field]).filter(([id, value]) => /^[a-z][a-z0-9.-]+$/.test(id) && ['inherit', 'on', 'off'].includes(value)));
    next.pageExceptions=Array.isArray(candidate.pageExceptions)?candidate.pageExceptions.filter(v=>v&&typeof v.path==='string'&&v.path.length<=500&&typeof v.patternId==='string'&&/^[a-z][a-z0-9.-]+$/.test(v.patternId)).slice(0,200).map(v=>({path:v.path,patternId:v.patternId})):[];
    return next;
  }
  function load() {
    const stored = read('settings');
    state = validate(stored || defaults);
    write('settings', state);
    return snapshot();
  }
  function snapshot() { return ExtraPotionsCore.cloneSettings(state || defaults); }
  function replace(value, reason = 'replace') { const next=validate(value);state=next;write('settings', state); for (const listener of listeners) listener(snapshot(), reason); return snapshot(); }
  function update(patch, reason = 'update') { return replace({ ...snapshot(), ...patch }, reason); }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  function exportData() { return { product: 'ward', generation: 3, schema: SCHEMA, settings: snapshot() }; }
  function prepareImport(payload) { if (!payload || payload.product !== 'ward' || payload.generation !== 3 || payload.schema !== SCHEMA) throw Object.assign(new Error('Unsupported WARD export'), { code: 'IMPORT_SCHEMA' }); return validate(payload.settings); }
  return Object.freeze({PREFIX, SCHEMA, defaults, validate, load, snapshot, replace, update, subscribe, exportData, prepareImport, hasStored: () => read('settings') !== undefined });
})();

EXP.Patterns = (() => {
  const definitions = [
    { id: 'upsell.membership.prime', category: 'upsell', label: 'Prime membership promotion', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'pressure.urgency', category: 'urgency', label: 'Urgency message', defaultAction: 'dim', allowedActions: ['dim', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'pressure.scarcity', category: 'scarcity', label: 'Scarcity message', defaultAction: 'annotate', allowedActions: ['dim', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'pressure.subscription', category: 'subscription', label: 'Subscription promotion', defaultAction: 'collapse', allowedActions: ['dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'upsell.financial-product', category: 'upsell', label: 'Credit or installment promotion', defaultAction: 'collapse', allowedActions: ['dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'upsell.protection-plan', category: 'upsell', label: 'Protection-plan promotion', defaultAction: 'collapse', allowedActions: ['dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'upsell.business-membership', category: 'upsell', label: 'Amazon Business promotion', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'sponsorship.placement', category: 'sponsored', label: 'Sponsored placement', defaultAction: 'hide', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'complete-placement-only' },
    { id: 'cross-sell.recommendation', category: 'cross-sell', label: 'Cross-sell recommendation', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'complete-placement-only' },
    { id: 'upsell.amazon-service', category: 'upsell', label: 'Amazon service promotion', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'pressure.shopping-assistant', category: 'shopping-assistant', label: 'AI shopping assistant prompt', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'complete-placement-only' },
    { id: 'pressure.social-proof', category: 'social-proof', label: 'Popularity claim', defaultAction: 'dim', allowedActions: ['dim', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'upsell.store-membership', category: 'upsell', label: 'Store membership promotion', defaultAction: 'collapse', allowedActions: ['hide', 'dim', 'collapse', 'annotate', 'allow'], essentialPolicy: 'mixed-annotate' },
    { id: 'pricing.reference-price', category: 'pricing', label: 'Reference price, not verified', defaultAction: 'annotate', allowedActions: ['annotate', 'allow'], essentialPolicy: 'mixed-annotate' }
  ].map((item) => Object.freeze({ ...item }));
  const byId = new Map(definitions.map((item) => [item.id, item]));
  function validate() {
    if (byId.size !== definitions.length) throw Object.assign(new Error('Duplicate pattern ID'), { code: 'PATTERN_DUPLICATE' });
    for (const item of definitions) if (!item.allowedActions.includes(item.defaultAction) || !item.essentialPolicy) throw Object.assign(new Error('Invalid pattern definition'), { code: 'PATTERN_INVALID' });
    return true;
  }
  validate();
  return Object.freeze({ all: () => definitions.slice(), get: (id) => byId.get(id), has: (id) => byId.has(id), validate });
})();

EXP.Audit = (() => {
  let sequence = 0;
  let nodeIds = new WeakMap();
  let detections = new Set();
  let decisions = new Set();
  let revealedTargets = new Set();
  const targets = new Map();

  function idFor(node) {
    let id = nodeIds.get(node);
    if (!id) {
      id = `target-${++sequence}`;
      nodeIds.set(node, id);
    }
    return id;
  }

  function targetFor(node) {
    const targetId = idFor(node);
    let target = targets.get(targetId);
    if (!target) {
      target = {
        targetId,
        node,
        detections: new Map(),
        decisions: new Map(),
        requestedAction: null,
        appliedAction: null,
        confidence: null,
        structuralSafe: null,
        reason: null,
        revealed: false
      };
      targets.set(targetId, target);
    }
    return target;
  }

  function detected(node, data = {}) {
    if (!(node instanceof Element)) return;
    const target = targetFor(node);
    const detectorId = String(data.detectorId || 'unknown');
    const patternId = String(data.patternId || 'unknown');
    const key = `${target.targetId}|${detectorId}|${patternId}`;
    detections.add(key);
    target.detections.set(`${detectorId}|${patternId}`, {
      detectorId,
      patternId,
      confidence: String(data.confidence || 'unknown'),
      structuralSafe: data.structuralSafe === true,
      structuralReason: data.structuralReason ? String(data.structuralReason) : null
    });
  }

  function decision(node, data = {}) {
    if (!(node instanceof Element)) return;
    const target = targetFor(node);
    const detectorId = String(data.detectorId || 'unknown');
    const patternId = String(data.patternId || 'unknown');
    const key = `${target.targetId}|${detectorId}|${patternId}`;
    decisions.add(key);
    const current = {
      detectorId,
      patternId,
      requestedAction: String(data.requestedAction || 'allow'),
      appliedAction: String(data.appliedAction || 'allow'),
      confidence: String(data.confidence || 'unknown'),
      structuralSafe: data.structuralSafe === true,
      reason: data.reason ? String(data.reason) : null
    };
    target.decisions.set(`${detectorId}|${patternId}`, current);
    target.requestedAction = current.requestedAction;
    target.appliedAction = current.appliedAction;
    target.confidence = current.confidence;
    target.structuralSafe = current.structuralSafe;
    target.reason = current.reason;
  }

  function revealed(node) {
    if (!(node instanceof Element)) return;
    const target = targetFor(node);
    revealedTargets.add(target.targetId);
    target.revealed = true;
  }

  function concealed(node) {
    if (!(node instanceof Element)) return;
    const targetId = nodeIds.get(node);
    if (!targetId) return;
    revealedTargets.delete(targetId);
    const target = targets.get(targetId);
    if (target) target.revealed = false;
  }

  function prune() {
    for (const [targetId, target] of targets) {
      if (target.node?.isConnected) continue;
      targets.delete(targetId);
      revealedTargets.delete(targetId);
      for (const key of [...detections]) if (key.startsWith(`${targetId}|`)) detections.delete(key);
      for (const key of [...decisions]) if (key.startsWith(`${targetId}|`)) decisions.delete(key);
    }
  }

  function snapshot() {
    const rows = [...targets.values()].map((target) => {
      const detectionsList = [...target.detections.values()];
      return {
        targetId: target.targetId,
        duplicate: detectionsList.length > 1,
        detections: detectionsList,
        decisions: [...target.decisions.values()],
        confidence: target.confidence,
        requestedAction: target.requestedAction,
        appliedAction: target.appliedAction,
        structuralSafe: target.structuralSafe,
        reason: target.reason,
        revealed: target.revealed
      };
    });

    const decided = rows.filter((item) => item.appliedAction !== null);
    const counts = {
      detected: detections.size,
      acted: decided.filter((item) => item.appliedAction !== 'allow').length,
      downgraded: decided.filter((item) => item.requestedAction !== item.appliedAction).length,
      skipped: decided.filter((item) => item.appliedAction === 'allow').length,
      revealed: revealedTargets.size,
      duplicateTargets: rows.filter((item) => item.duplicate).length,
      structuralCollapseSkipped: decided.filter((item) =>
        (item.requestedAction === 'hide' || item.requestedAction === 'collapse') &&
        item.appliedAction !== item.requestedAction &&
        item.structuralSafe === false
      ).length
    };

    return {
      schemaVersion: 1,
      privacy: 'Detector and action metadata only. Page text, form values, selectors, URLs, and DOM markup are excluded.',
      counts,
      targets: rows
    };
  }

  function resetRoute() {
    sequence = 0;
    nodeIds = new WeakMap();
    detections = new Set();
    decisions = new Set();
    revealedTargets = new Set();
    targets.clear();
  }

  return Object.freeze({ detected, decision, revealed, concealed, prune, snapshot, resetRoute });
})();

// Store adapters register here. The engine, settings and menu talk to EXP.Retailer,
// which forwards to whichever registered adapter matches the current site, so
// supporting another store means adding an adapter and registering it.
//
// An adapter provides: key, label, patternIds, features, eligible(), classify(),
// detect(roots), structuralSafety(node), diagnose(), nextEpoch(), cleanup().
// Optional: couponCandidates(roots), verifyCouponTarget(control),
// cosmeticRecommendationCandidates(roots).
EXP.Retailers = (() => {
  const adapters = new Map();
  const REQUIRED = ['eligible', 'classify', 'detect', 'structuralSafety', 'diagnose', 'nextEpoch', 'cleanup'];

  function register(adapter) {
    if (!adapter || typeof adapter.key !== 'string' || !/^[a-z][a-z0-9-]*$/.test(adapter.key)) {
      throw Object.assign(new Error('Retailer adapter needs a lowercase key'), { code: 'RETAILER_KEY' });
    }
    if (adapters.has(adapter.key)) throw Object.assign(new Error(`Duplicate retailer adapter: ${adapter.key}`), { code: 'RETAILER_DUPLICATE' });
    for (const name of REQUIRED) {
      if (typeof adapter[name] !== 'function') throw Object.assign(new Error(`Retailer adapter ${adapter.key} is missing ${name}()`), { code: 'RETAILER_INTERFACE' });
    }
    adapters.set(adapter.key, adapter);
    return adapter;
  }

  function all() { return [...adapters.values()]; }
  function get(key) { return adapters.get(key) || null; }
  function keys() { return [...adapters.keys()]; }
  // The adapter for the page being viewed, or null on an unsupported site.
  function current() {
    for (const adapter of adapters.values()) {
      try { if (adapter.eligible()) return adapter; } catch { /* a broken adapter never claims a page */ }
    }
    return null;
  }

  return Object.freeze({ register, all, get, keys, current });
})();

// What the engine and menu call. Everything falls back to a safe answer on a page
// that no adapter supports.
EXP.Retailer = (() => {
  const idle = Object.freeze({ id: 'none', key: 'none', label: 'Store', health: 'inactive', eligible: false, pageType: 'unsupported' });
  const none = () => [];
  function adapter() { return EXP.Retailers.current(); }
  function optional(name, fallback) {
    return (...args) => {
      const active = adapter();
      return active && typeof active[name] === 'function' ? active[name](...args) : fallback(...args);
    };
  }

  return Object.freeze({
    key: () => adapter()?.key || 'none',
    label: () => adapter()?.label || 'Store',
    features: () => adapter()?.features || Object.freeze({}),
    patternIds: () => new Set(adapter()?.patternIds || []),
    eligible: () => Boolean(adapter()),
    // WARD acts on this page only if the master switch and this store's own switch are on.
    enabled: (settings) => Boolean(settings?.enabled) && Boolean(adapter()) && settings.retailers?.[adapter().key] !== false,
    classify: optional('classify', () => 'other'),
    detect: optional('detect', none),
    couponCandidates: optional('couponCandidates', none),
    verifyCouponTarget: optional('verifyCouponTarget', () => ({ eligible: false, reason: 'unsupported-store' })),
    cosmeticRecommendationCandidates: optional('cosmeticRecommendationCandidates', none),
    structuralSafety: optional('structuralSafety', () => ({ safe: false, reason: 'unsupported-store' })),
    diagnose: () => adapter()?.diagnose() || idle,
    nextEpoch: () => { for (const item of EXP.Retailers.all()) item.nextEpoch(); },
    cleanup: () => { for (const item of EXP.Retailers.all()) item.cleanup(); },
  });
})();

EXP.AmazonAdapter = (() => {
  const ID = 'ward.retailer.amazon';
  const VERSION = '3';
  const errors = [];
  let health = 'inactive';
  let epoch = 0;
  let lastScan = null;
  let routeMatchedTargets = new WeakSet();
  let routeMatchedTargetCount = 0;
  const routeMatchedDetectors = new Set();
  const supportedHosts = new Set(['www.amazon.com', 'smile.amazon.com']);
  // These identify complete ad units, not arbitrary containers with ad text.
  // Their iframe/carousel children belong to the ad and can hide with the unit.
  const sponsoredWrapperSelector = 'div.ape-wrapper[id^="ape_"][id$="_wrapper"]';
  const completeSponsoredSelectors = [
    '[data-component-type="s-sponsored-result"]',
    sponsoredWrapperSelector,
    'div.ape-placement[id^="ape_"][id$="_placement"]',
    'div.a-carousel-container[id^="sp_detail"][data-a-carousel-options]',
    'li.dpx-smidget-desktop-pill-list-item:has(button[data-action-id^="related_questions_sponsored_related_question_"])'
  ];
  const completeSponsoredSelector = completeSponsoredSelectors.join(',');
  const primePlanPromotion = '.mobile-gateway-strategic_prime-retention-plan-switch-homepage-wd-widget-cx';
  const ordersBusinessPromotion = '[data-card-metrics-id^="abxs-yo-dsk-dynamic-upsell_"]';
  const essentialSelector = ['.order-card', '.js-order-card', '#searchOrdersInput', '#time-filter', 'form[action^="/your-orders/"]', '[data-buybox-component]', '#buybox', '#desktop_buybox', '#price', '#corePrice_feature_div', '#availability', '#deliveryBlockMessage', '#mir-layout-DELIVERY_BLOCK', '#addToCart', '#buyNow', '#checkout', '[name="placeYourOrder1"]', '[data-testid*="checkout"]'].join(',');
  const structuralCollapseSelector = [primePlanPromotion, ordersBusinessPromotion, '#sims-fbt','#buyItWith','[data-feature-name="sims-fbt"]','#primeDPUpsellStaticContainerNPA','#primeDPUpsellStaticContainer','#businessPrimeDPUpsellStaticContainer','#businessSavings_feature_div','[data-feature-name="businessSavings"]','[data-csa-c-content-id*="business-savings" i]','#primeSavingsUpsellAccordionRow','#attach-warranty-pane','#protectionPlan_feature_div','#insuranceAndWarranty_feature_div','[data-feature-name="insuranceAndWarranty"]','[data-csa-c-content-id*="insurance-and-warranty" i]','#snsAccordionRowMiddle','#subscribeAndSaveAccordionRow','#creditCard_feature_div','#installmentCalculator_feature_div','#audible-promo'].join(',');
  const structuralRiskSelector = ['#rufus-container','video','audio','iframe','.a-carousel','.a-carousel-container','[role="slider"]','[aria-live]','[data-testid*="rufus" i]','[data-testid*="video" i]','[data-testid*="follow" i]','[data-feature-name*="video" i]','[data-feature-name*="creator" i]','[data-feature-name*="follow" i]','[data-cel-widget*="video" i]','[data-cel-widget*="media" i]'].join(',');
  const detectors = Object.freeze([
    { id: 'amazon.prime.product', patternId: 'upsell.membership.prime', pages: ['product', 'search', 'cart', 'checkout', 'home', 'orders', 'other'], selectors: [primePlanPromotion, '[data-feature-name="desktop-dp-ilm"]', '#primeDPUpsellStaticContainerNPA', '#primeDPUpsellStaticContainer', '#nav-join-prime', '#osu-prime-recommendations', '#prime-spc-stripe-recommendations', '.isoa-wrapper-radio', '.udm-primary-delivery-message:has(.prime-signup-ingress)', 'span[data-csa-c-owner="PromotionsDiscovery"]:has(label[id^="greenBadge"])', '#businessPrimeDPUpsellStaticContainer', '#primeSavingsUpsellAccordionRow', '#pep_feature_div'] },
    { id: 'amazon.urgency.deal', patternId: 'pressure.urgency', pages: ['product', 'search', 'cart'], selectors: ['.a-badge[data-a-badge-type="deal"]', '#dealBadge_feature_div', '#dealProgress_feature_div', '.sc-delight-pricing', '#delightPricingBadge_feature_div'] },
    { id: 'amazon.scarcity.stock', patternId: 'pressure.scarcity', pages: ['product', 'search', 'cart'], selectors: ['.sc-product-scarcity', '[class*="_scarcityMessage_"]', 'span[aria-label*="left in stock" i]'] },
    { id: 'amazon.subscription.sns', patternId: 'pressure.subscription', pages: ['product', 'cart'], selectors: ['.sc-subscribe-and-save-upsell-message', '#snsAccordionRowMiddle', '#subscribeAndSaveAccordionRow'] },
    { id: 'amazon.financial.credit', patternId: 'upsell.financial-product', pages: ['product', 'cart', 'checkout', 'search'], selectors: ['#creditCard_feature_div', '#installmentCalculator_feature_div', '[data-feature-name*="creditCard" i]', '[data-csa-c-content-id*="credit" i]'] },
    { id: 'amazon.plan.protection', patternId: 'upsell.protection-plan', pages: ['product', 'cart'], selectors: ['#attach-warranty-pane', '#protectionPlan_feature_div', '#insuranceAndWarranty_feature_div', '[data-feature-name*="protectionPlan" i]', '[data-feature-name="insuranceAndWarranty"]', '[data-csa-c-content-id*="insurance-and-warranty" i]'] },
    { id: 'amazon.business.promo', patternId: 'upsell.business-membership', pages: ['product', 'search', 'cart', 'home', 'orders'], selectors: [ordersBusinessPromotion, '#businessPrimeDPUpsellStaticContainer', '#businessSavings_feature_div', '[data-feature-name="businessSavings"]', '[data-feature-name*="business" i][class*="promo" i]', '[data-csa-c-content-id*="business-savings" i]'] },
    { id: 'amazon.sponsored.placement', patternId: 'sponsorship.placement', pages: ['product', 'search', 'home', 'orders'], selectors: [...completeSponsoredSelectors, '[data-ad-details]', '#sp_detail', '[data-cel-widget^="sp_"]'] },
    { id: 'amazon.cross-sell.recommendation', patternId: 'cross-sell.recommendation', pages: ['product', 'cart', 'home'], selectors: ['#sims-fbt', '#desktop-dp-sims_session-similarities-sims-feature', '#buyItWith', '[data-feature-name="sims-fbt"]'] },
    { id: 'amazon.service.promo', patternId: 'upsell.amazon-service', pages: ['product', 'home', 'orders', 'other'], selectors: ['#audible-promo', '[data-feature-name*="audible" i][class*="promo" i]', '[data-feature-name*="music" i][class*="promo" i]'] },
    { id: 'amazon.ai.rufus', patternId: 'pressure.shopping-assistant', pages: ['product', 'search', 'home'], selectors: ['#rufus-container', '[data-testid*="rufus" i]'] }
  ]);

  function classify(pathname = location.pathname) {
    if (/^\/(?:your-orders\/(?:orders|search)|gp\/(?:your-account|css)\/order-history)(?:\/|$)/.test(pathname)) return 'orders';
    if (/\/dp\/|\/gp\/product\//.test(pathname)) return 'product';
    if (/\/s(?:\/|$)/.test(pathname)) return 'search';
    if (/\/cart|\/gp\/cart/.test(pathname)) return 'cart';
    if (/\/checkout|\/gp\/buy/.test(pathname)) return 'checkout';
    if (pathname === '/' || pathname === '') return 'home';
    return 'other';
  }

  function eligible() { return supportedHosts.has(location.hostname); }
  function isProtectedPageRoot(node) {
    return !node ||
      node === document.documentElement ||
      node === document.head ||
      node === document.body ||
      node === document.scrollingElement ||
      node.matches?.('#a-page, #pageContent, main, [role~="main"]') ||
      Boolean(node.querySelector?.('#a-page, #pageContent, main, [role~="main"], [data-exp-owned="1"]'));
  }
  function safeQueryAll(root, selector) { try { return [...root.querySelectorAll(selector)]; } catch (error) { record(error, 'DETECTOR_SELECTOR'); return []; } }
  function essentialOverlap(node) { return Boolean(node.matches?.(essentialSelector) || node.closest?.(essentialSelector) || safeQueryAll(node, essentialSelector).length); }
  function structuralSafety(node) {
    if (!node?.isConnected) return { safe: false, reason: 'detached' };
    if (isProtectedPageRoot(node) || node.closest?.('[data-exp-owned="1"]')) return { safe: false, reason: 'protected-root' };
    if (node.matches?.(completeSponsoredSelector) && !essentialOverlap(node)) return { safe: true, reason: 'complete-sponsored-placement' };
    const risky = node.matches?.(structuralRiskSelector) || node.closest?.(structuralRiskSelector) || safeQueryAll(node, structuralRiskSelector).length;
    if (risky) return { safe: false, reason: 'dynamic-widget' };
    if (node.matches?.(structuralCollapseSelector)) return { safe: true, reason: 'known-static' };
    return { safe: false, reason: 'unverified-container' };
  }
  function record(error, code) { errors.push({ code, at: Date.now() }); if (errors.length > 8) errors.shift(); health = 'degraded'; EXP.Core.safeError(Object.assign(error || new Error(code), { code }), ID); }
  function resetCoverage() {
    lastScan = null;
    routeMatchedTargets = new WeakSet();
    routeMatchedTargetCount = 0;
    routeMatchedDetectors.clear();
  }

  function detect(roots = [document]) {
    if (!eligible()) { health = 'inactive'; lastScan = null; return []; }
    const pageType = classify();
    if (lastScan && lastScan.pageType !== pageType) resetCoverage();
    const found = new Map();
    const eligibleDetectors = detectors.filter((detector) => detector.pages.includes(pageType));
    health = 'healthy';
    for (const detector of eligibleDetectors) {
      try {
        for (const root of roots) for (const selector of detector.selectors) for (const match of [...(root.matches?.(selector) ? [root] : []), ...safeQueryAll(root, selector)]) {
          // Light ads put the disclosure beside the creative inside a wrapper.
          // Treat that whole unit once, including on incremental child scans.
          const node = detector.id === 'amazon.sponsored.placement' ? match.closest(sponsoredWrapperSelector) || match : match;
          if (!node.isConnected || isProtectedPageRoot(node) || node.closest('[data-exp-owned="1"]')) continue;
          routeMatchedDetectors.add(detector.id);
          if (!routeMatchedTargets.has(node)) {
            routeMatchedTargets.add(node);
            routeMatchedTargetCount += 1;
          }
          const essential = essentialOverlap(node);
          const structural = structuralSafety(node);
          const confidence = essential ? 'ambiguous' : 'confirmed';
          EXP.Audit?.detected?.(node, { detectorId: detector.id, patternId: detector.patternId, confidence, structuralSafe: structural.safe, structuralReason: structural.reason });
          const key = `${detector.id}:${selector}:${node.dataset.wardInstance || ''}`;
          if (!found.has(node)) found.set(node, Object.freeze({ evidenceId: key, detectorId: detector.id, patternId: detector.patternId, pageType, node, signals: ['adapter-selector'], exclusions: essential ? ['essential-overlap'] : [], essentialOverlap: essential, structuralSafe: structural.safe, structuralReason: structural.reason, confidence, epoch }));
        }
      } catch (error) { record(error, 'DETECTOR_FAILURE'); }
    }
    lastScan = {
      pageType,
      eligibleDetectors: eligibleDetectors.map(({ id }) => id),
      matchedDetectors: [...routeMatchedDetectors],
      matchedTargets: routeMatchedTargetCount
    };
    return [...found.values()];
  }

  function couponCandidates(roots = [document]) {
    if (!eligible()) return [];
    const selector = '[data-component-type="s-coupon-component"] .s-coupon-tile.unclaimed input[type="checkbox"]:not(:checked), .ct-coupon-tile.unclaimed input[type="checkbox"]:not(:checked)';
    return roots.flatMap((root) => safeQueryAll(root, selector)).filter((node, index, all) => all.indexOf(node) === index);
  }

  function cosmeticRecommendationCandidates(roots = [document]) {
    if (!eligible()) return [];
    const selector = '#sims-fbt, #buyItWith, [data-feature-name="sims-fbt"]';
    return roots.flatMap((root) => safeQueryAll(root, selector)).filter((node, index, all) => all.indexOf(node) === index && !essentialOverlap(node) && structuralSafety(node).safe);
  }

  function verifyCouponTarget(control) {
    if (!control?.isConnected || control.disabled || control.checked || control.hidden || control.dataset.wardCouponAttempted === '1') return { eligible: false, reason: 'not-unclaimed' };
    const component = control.closest('[data-component-type="s-coupon-component"], .ct-coupon-tile');
    if (!component) return { eligible: false, reason: 'ambiguous-control' };
    if (component.closest('#addToCart, #buyNow, #checkout, [name="placeYourOrder1"], [data-testid*="checkout"]')) return { eligible: false, reason: 'unsafe-context' };
    return { eligible: true, component };
  }

  function diagnose() { return { id: ID, version: VERSION, health, eligible: eligible(), pageType: eligible() ? classify() : 'unsupported', detectorCount: detectors.length, coverage: lastScan ? { ...lastScan, eligibleDetectors:lastScan.eligibleDetectors.slice(), matchedDetectors:lastScan.matchedDetectors.slice() } : null, errors: errors.map(({ code }) => ({ code })) }; }
  function nextEpoch() { epoch += 1; health = eligible() ? 'healthy' : 'inactive'; resetCoverage(); return epoch; }
  function cleanup() { epoch += 1; health = 'inactive'; resetCoverage(); errors.length = 0; }
  const patternIds = Object.freeze([...new Set(detectors.map((detector) => detector.patternId))]);
  return Object.freeze({ key: 'amazon', label: 'Amazon', features: Object.freeze({ coupons: true, compactSearch: true, recommendationCleanup: true }), patternIds, ID, VERSION, classify, eligible, detect, couponCandidates, cosmeticRecommendationCandidates, structuralSafety, verifyCouponTarget, diagnose, nextEpoch, cleanup, patterns: () => detectors.map(({ id, patternId, pages }) => ({ id, patternId, pages: pages.slice() })) });
})();
EXP.Retailers.register(EXP.AmazonAdapter);

// Walmart's class names are hashed and change often, so this adapter leans on the
// stable data-testid hooks the pages expose. Its badges share one testid and are
// told apart by their wording, which is why detectors here may carry a text test.
EXP.WalmartAdapter = (() => {
  const ID = 'ward.retailer.walmart';
  const VERSION = '1';
  const errors = [];
  let health = 'inactive';
  let epoch = 0;
  let lastScan = null;
  const supportedHosts = new Set(['www.walmart.com', 'walmart.com']);
  const badge = '[data-testid="badgeTagComponent"]';
  const essentialSelector = ['[data-testid*="add-to-cart" i]', '[data-testid="ugpp-main-price"]', '[data-testid="product-title"]', '[data-testid*="checkout" i]', '[data-testid*="fulfillment" i]', 'form[action*="cart" i]', 'button[type="submit"]'].join(',');
  const knownStaticSelector = '[data-testid="item-addon-services-new"], [data-testid="oneDebitCardBannerLink"], [data-testid="save-with-walmart-plus-badge"], [data-testid="wplus-opt-out-banner"], [data-testid="more-ways-to-pay-component-wrapper"]';
  const protectedRootSelector = '[data-testid="maincontent"], [data-testid="main-content-container"], [data-testid="layout-container"], [data-testid="item-stack"], main, [role~="main"]';
  const detectors = Object.freeze([
    { id: 'walmart.social-proof.badge', patternId: 'pressure.social-proof', pages: ['search', 'product', 'home', 'cart'], selectors: [badge], text: /\bbought since\b|\bin [\d.,]+k?\+? people'?s carts?\b|\bpeople (?:are )?(?:viewing|looking)\b|\b[\d.,]+k?\+? (?:viewed|bought)\b/i },
    { id: 'walmart.scarcity.badge', patternId: 'pressure.scarcity', pages: ['search', 'product', 'cart'], selectors: [badge], text: /\blow stock\b|\bonly \d+ left\b|\balmost gone\b/i },
    { id: 'walmart.urgency.badge', patternId: 'pressure.urgency', pages: ['search', 'product'], selectors: [badge], text: /^(?:deal|flash deal|ends (?:in|soon).*)$/i },
    { id: 'walmart.membership.badge', patternId: 'upsell.store-membership', pages: ['search', 'product', 'cart', 'home'], selectors: [badge], text: /^save with$|walmart\s?\+/i },
    { id: 'walmart.membership.cart-badge', patternId: 'upsell.store-membership', pages: ['cart', 'search', 'product'], selectors: ['[data-testid="save-with-walmart-plus-badge"]'] },
    { id: 'walmart.membership.checkout-banner', patternId: 'upsell.store-membership', pages: ['checkout'], selectors: ['[data-testid="wplus-opt-out-banner"]'] },
    { id: 'walmart.financial.more-ways-to-pay', patternId: 'upsell.financial-product', pages: ['checkout'], selectors: ['[data-testid="more-ways-to-pay-component-wrapper"]'] },
    { id: 'walmart.membership.cart-banner', patternId: 'upsell.store-membership', pages: ['cart'], selectors: ['[data-testid="wplus-banner-title-cart"]'], unit: 'section' },
    { id: 'walmart.plan.protection', patternId: 'upsell.protection-plan', pages: ['product', 'cart'], selectors: ['[data-testid="item-addon-services-new"]'] },
    { id: 'walmart.financial.card', patternId: 'upsell.financial-product', pages: ['product', 'cart', 'checkout', 'home'], selectors: ['[data-testid="oneDebitCardBannerLink"]'] },
    { id: 'walmart.sponsored.placement', patternId: 'sponsorship.placement', pages: ['search', 'product', 'home'], selectors: ['[data-testid="skyline-ad"]', '[data-testid="brand-box-ad"]', '[data-testid="sp"]', '[data-testid="sb-container"]', '[data-ad-component-type]'] },
    { id: 'walmart.reference-price', patternId: 'pricing.reference-price', pages: ['search', 'product'], selectors: ['[data-testid="ugpp-was-price"]'] }
  ]);

  function classify(pathname = location.pathname) {
    if (/^\/ip\//.test(pathname)) return 'product';
    if (/^\/(?:search|browse|shop|cp)(?:\/|$)/.test(pathname)) return 'search';
    if (/^\/cart(?:\/|$)/.test(pathname)) return 'cart';
    if (/^\/checkout(?:\/|$)/.test(pathname)) return 'checkout';
    if (/^\/(?:orders|account|purchase-history)(?:\/|$)/.test(pathname)) return 'orders';
    if (pathname === '/' || pathname === '') return 'home';
    return 'other';
  }

  function eligible() { return supportedHosts.has(location.hostname); }
  function record(error, code) { errors.push({ code, at: Date.now() }); if (errors.length > 8) errors.shift(); health = 'degraded'; EXP.Core.safeError(Object.assign(error || new Error(code), { code }), ID); }
  function safeQueryAll(root, selector) { try { return [...root.querySelectorAll(selector)]; } catch (error) { record(error, 'DETECTOR_SELECTOR'); return []; } }
  function isProtectedPageRoot(node) {
    return !node || node === document.documentElement || node === document.head || node === document.body ||
      Boolean(node.matches?.(protectedRootSelector)) || Boolean(node.querySelector?.(`${protectedRootSelector}, [data-exp-owned="1"]`));
  }
  const purchaseWording = /check ?out|place (?:your )?order|add to cart|buy now|continue/i;
  function hasPurchaseControl(node) { return [...(node.querySelectorAll?.('button, a, input[type="submit"]') || [])].some((control) => purchaseWording.test(control.textContent || control.value || control.getAttribute('aria-label') || '')); }
  function essentialOverlap(node) { return hasPurchaseControl(node) || Boolean(node.matches?.(essentialSelector) || node.closest?.(essentialSelector) || safeQueryAll(node, essentialSelector).length); }
  // Only whole badges and complete ad units are known to be self-contained.
  function structuralSafety(node) {
    if (!node?.isConnected) return { safe: false, reason: 'detached' };
    if (isProtectedPageRoot(node) || node.closest?.('[data-exp-owned="1"]')) return { safe: false, reason: 'protected-root' };
    if (essentialOverlap(node)) return { safe: false, reason: 'essential-overlap' };
    if (node.matches?.(badge)) return { safe: true, reason: 'known-badge' };
    if (node.matches?.('section') && node.querySelector('[data-testid="wplus-banner-title-cart"]')) return { safe: true, reason: 'membership-banner' };
    if (node.matches?.(knownStaticSelector)) return { safe: true, reason: 'known-static' };
    if (node.matches?.('[data-testid="skyline-ad"], [data-testid="brand-box-ad"], [data-testid="sp"], [data-testid="sb-container"]')) return { safe: true, reason: 'complete-sponsored-placement' };
    return { safe: false, reason: 'unverified-container' };
  }

  function detect(roots = [document]) {
    if (!eligible()) { health = 'inactive'; lastScan = null; return []; }
    const pageType = classify();
    const found = new Map();
    const eligibleDetectors = detectors.filter((detector) => detector.pages.includes(pageType));
    const matchedDetectors = new Set();
    let matchedTargets = 0;
    health = 'healthy';
    for (const detector of eligibleDetectors) {
      try {
        for (const root of roots) for (const selector of detector.selectors) for (const match of [...(root.matches?.(selector) ? [root] : []), ...safeQueryAll(root, selector)]) {
          const unit = detector.unit ? match.closest(detector.unit) : null;
          const node = unit && !hasPurchaseControl(unit) ? unit : match;
          if (!node.isConnected || isProtectedPageRoot(node) || node.closest('[data-exp-owned="1"]')) continue;
          if (detector.text && !detector.text.test((node.textContent || '').trim())) continue;
          matchedDetectors.add(detector.id);
          matchedTargets += 1;
          const essential = essentialOverlap(node);
          const structural = structuralSafety(node);
          const confidence = essential ? 'ambiguous' : 'confirmed';
          EXP.Audit?.detected?.(node, { detectorId: detector.id, patternId: detector.patternId, confidence, structuralSafe: structural.safe, structuralReason: structural.reason });
          if (!found.has(node)) found.set(node, Object.freeze({ evidenceId: `${detector.id}:${selector}`, detectorId: detector.id, patternId: detector.patternId, pageType, node, signals: ['adapter-selector'], exclusions: essential ? ['essential-overlap'] : [], essentialOverlap: essential, structuralSafe: structural.safe, structuralReason: structural.reason, confidence, epoch }));
        }
      } catch (error) { record(error, 'DETECTOR_FAILURE'); }
    }
    lastScan = { pageType, eligibleDetectors: eligibleDetectors.map(({ id }) => id), matchedDetectors: [...matchedDetectors], matchedTargets };
    return [...found.values()];
  }

  function diagnose() { return { id: ID, version: VERSION, health, eligible: eligible(), pageType: eligible() ? classify() : 'unsupported', detectorCount: detectors.length, coverage: lastScan, errors: errors.slice() }; }
  function nextEpoch() { epoch += 1; health = eligible() ? 'healthy' : 'inactive'; lastScan = null; return epoch; }
  function cleanup() { epoch += 1; health = 'inactive'; lastScan = null; errors.length = 0; }
  const patternIds = Object.freeze([...new Set(detectors.map((detector) => detector.patternId))]);
  return Object.freeze({ key: 'walmart', label: 'Walmart', features: Object.freeze({ coupons: false, compactSearch: false, recommendationCleanup: false }), patternIds, ID, VERSION, classify, eligible, detect, structuralSafety, diagnose, nextEpoch, cleanup });
})();
EXP.Retailers.register(EXP.WalmartAdapter);

// eBay's markup uses readable class names (s-card, su-styled-text, x-ebay-signal),
// but its pressure cues are plain text spans inside shared containers, so most
// detectors here match a container and then test the wording.
EXP.EbayAdapter = (() => {
  const ID = 'ward.retailer.ebay';
  const VERSION = '1';
  const errors = [];
  let health = 'inactive';
  let epoch = 0;
  let lastScan = null;
  const supportedHosts = new Set(['www.ebay.com', 'ebay.com', 'cart.ebay.com', 'pay.ebay.com']);
  const cardBadge = '.s-card__attribute-row .su-styled-text';
  const itemSignal = '.x-ebay-signal .ux-textspans, #qtyAvailability .ux-textspans';
  const recommendationModule = '.srp-river-answer--ITEMS_CAROUSEL_WITH_COLOR';
  // On the cart, "These are for you" is a headed section wrapping a carousel of other
  // listings; it never contains the cart's own bucket.
  const cartRecommendationModule = 'section:has(h2):has(.carousel):not(:has([data-test-id="cart-bucket"]))';
  const moduleSelector = `${recommendationModule}, ${cartRecommendationModule}`;
  const financing = '[data-testid="PAYMENTS_PROMOTIONS"]';
  const essentialSelector = ['[data-testid="TOTAL"]', '[data-testid="SUB_TOTAL"]', '[data-testid="PAYMENT_METHODS"]', '[data-testid="KLARNA_BUTTON"]', '[data-testid="CTA_MESSAGE_WRAPPER"]', '#binBtn_btn', '#isCartBtn_btn', '#atcBtn_btn', '.x-bin-action', '.x-atc-action', '.x-msku', '.x-quantity__input', '#qtyTextBox', '[data-testid*="checkout" i]', 'form[action*="checkout" i]', 'button[type="submit"]'].join(',');
  const protectedRootSelector = '#mainContent, #CenterPanel, #RightSummaryPanel, .srp-main, .srp-river, ul.srp-results, main, [role~="main"]';
  const purchaseWording = /buy it now|place bid|add to cart|check ?out|make offer|confirm and pay|pay now|continue/i;
  const detectors = Object.freeze([
    { id: 'ebay.social-proof.card', patternId: 'pressure.social-proof', pages: ['search'], selectors: [cardBadge], text: /^[\d,.]+k?\+? (?:sold|watchers?|watching)$/i },
    { id: 'ebay.social-proof.item', patternId: 'pressure.social-proof', pages: ['product'], selectors: [itemSignal], text: /^(?:in [\d,.]+k?\+? carts?|[\d,.]+k?\+? (?:sold|watchers?|watching)|[\d,.]+k?\+? (?:people|viewers?) .*)$/i },
    { id: 'ebay.scarcity.card', patternId: 'pressure.scarcity', pages: ['search'], selectors: [cardBadge], text: /^(?:last one|only [\d,]+ left|[\d,]+ left)$/i },
    { id: 'ebay.scarcity.item', patternId: 'pressure.scarcity', pages: ['product'], selectors: [itemSignal], text: /^(?:last one|only [\d,]+ (?:left|available)|limited quantity)$/i },
    { id: 'ebay.financial.checkout', patternId: 'upsell.financial-product', pages: ['checkout'], selectors: [financing] },
    { id: 'ebay.recommendation.cart', patternId: 'cross-sell.recommendation', pages: ['cart'], selectors: [cartRecommendationModule] },
    { id: 'ebay.recommendation.module', patternId: 'cross-sell.recommendation', pages: ['search'], selectors: [recommendationModule] },
    { id: 'ebay.sponsored.card', patternId: 'sponsorship.placement', pages: ['search'], selectors: ['li.s-card'], text: /(?:^|\n)\s*sponsored\s*(?:\n|$)/i, sponsoredOnly: true }
  ]);

  function classify(pathname = location.pathname) {
    if (location.hostname === 'pay.ebay.com') return 'checkout';
    if (/^\/itm\//.test(pathname)) return 'product';
    if (/^\/(?:sch|b)\//.test(pathname)) return 'search';
    if (location.hostname === 'cart.ebay.com' || /^\/(?:cart|sc)(?:\/|$)/.test(pathname)) return 'cart';
    if (/^\/(?:checkout|pay)(?:\/|$)/.test(pathname)) return 'checkout';
    if (/^\/mye\//.test(pathname)) return 'orders';
    if (pathname === '/' || pathname === '') return 'home';
    return 'other';
  }

  function eligible() { return supportedHosts.has(location.hostname); }
  function record(error, code) { errors.push({ code, at: Date.now() }); if (errors.length > 8) errors.shift(); health = 'degraded'; EXP.Core.safeError(Object.assign(error || new Error(code), { code }), ID); }
  function safeQueryAll(root, selector) { try { return [...root.querySelectorAll(selector)]; } catch (error) { record(error, 'DETECTOR_SELECTOR'); return []; } }
  function isProtectedPageRoot(node) {
    return !node || node === document.documentElement || node === document.head || node === document.body ||
      Boolean(node.matches?.(protectedRootSelector)) || Boolean(node.querySelector?.(`${protectedRootSelector}, [data-exp-owned="1"]`));
  }
  function hasPurchaseControl(node) { return [...(node.querySelectorAll?.('button, a, input[type="submit"]') || [])].some((control) => purchaseWording.test(control.textContent || control.value || control.getAttribute('aria-label') || '')); }
  function essentialOverlap(node) {
    // Recommendation modules carry their own per-listing links; only the page's real controls count.
    if (node.matches?.(moduleSelector)) return Boolean(safeQueryAll(node, essentialSelector).length);
    return hasPurchaseControl(node) || Boolean(node.matches?.(essentialSelector) || node.closest?.(essentialSelector) || safeQueryAll(node, essentialSelector).length);
  }
  // Text spans and complete result modules are self-contained; nothing else is known to be.
  function structuralSafety(node) {
    if (!node?.isConnected) return { safe: false, reason: 'detached' };
    if (isProtectedPageRoot(node) || node.closest?.('[data-exp-owned="1"]')) return { safe: false, reason: 'protected-root' };
    if (essentialOverlap(node)) return { safe: false, reason: 'essential-overlap' };
    if (node.matches?.(`${cardBadge}, ${itemSignal}`)) return { safe: true, reason: 'known-text-signal' };
    if (node.matches?.(moduleSelector)) return { safe: true, reason: 'complete-module' };
    if (node.matches?.(financing)) return { safe: true, reason: 'known-static' };
    if (node.matches?.('li.s-card')) return { safe: true, reason: 'complete-sponsored-placement' };
    return { safe: false, reason: 'unverified-container' };
  }

  // eBay draws its "Sponsored" tag as a background image on a heading that points
  // at a hidden label (aria-labelledby), so the word itself is never inside the card.
  // A card counts only when one of those labels reads exactly "Sponsored".
  function readsSponsored(id) { return /^sponsored$/i.test((document.getElementById(id)?.textContent || '').trim()); }
  function carriesSponsoredLabel(card) {
    return [...card.querySelectorAll('[aria-labelledby]')].some((label) => label.getAttribute('aria-labelledby').split(/\s+/).some(readsSponsored)) ||
      [...card.querySelectorAll('span, div')].some((label) => !label.childElementCount && /^sponsored$/i.test((label.textContent || '').trim()));
  }

  function detect(roots = [document]) {
    if (!eligible()) { health = 'inactive'; lastScan = null; return []; }
    const pageType = classify();
    const found = new Map();
    const eligibleDetectors = detectors.filter((detector) => detector.pages.includes(pageType));
    const matchedDetectors = new Set();
    let matchedTargets = 0;
    health = 'healthy';
    for (const detector of eligibleDetectors) {
      try {
        for (const root of roots) for (const selector of detector.selectors) for (const node of [...(root.matches?.(selector) ? [root] : []), ...safeQueryAll(root, selector)]) {
          if (!node.isConnected || isProtectedPageRoot(node) || node.closest('[data-exp-owned="1"]')) continue;
          if (detector.sponsoredOnly) { if (!carriesSponsoredLabel(node)) continue; }
          else if (detector.text && !detector.text.test((node.textContent || '').trim())) continue;
          matchedDetectors.add(detector.id);
          matchedTargets += 1;
          const essential = essentialOverlap(node);
          const structural = structuralSafety(node);
          const confidence = essential ? 'ambiguous' : 'confirmed';
          EXP.Audit?.detected?.(node, { detectorId: detector.id, patternId: detector.patternId, confidence, structuralSafe: structural.safe, structuralReason: structural.reason });
          if (!found.has(node)) found.set(node, Object.freeze({ evidenceId: `${detector.id}:${selector}`, detectorId: detector.id, patternId: detector.patternId, pageType, node, signals: ['adapter-selector'], exclusions: essential ? ['essential-overlap'] : [], essentialOverlap: essential, structuralSafe: structural.safe, structuralReason: structural.reason, confidence, epoch }));
        }
      } catch (error) { record(error, 'DETECTOR_FAILURE'); }
    }
    lastScan = { pageType, eligibleDetectors: eligibleDetectors.map(({ id }) => id), matchedDetectors: [...matchedDetectors], matchedTargets };
    return [...found.values()];
  }

  function diagnose() { return { id: ID, version: VERSION, health, eligible: eligible(), pageType: eligible() ? classify() : 'unsupported', detectorCount: detectors.length, coverage: lastScan, errors: errors.slice() }; }
  function nextEpoch() { epoch += 1; health = eligible() ? 'healthy' : 'inactive'; lastScan = null; return epoch; }
  function cleanup() { epoch += 1; health = 'inactive'; lastScan = null; errors.length = 0; }
  const patternIds = Object.freeze([...new Set(detectors.map((detector) => detector.patternId))]);
  return Object.freeze({ key: 'ebay', label: 'eBay', features: Object.freeze({ coupons: false, compactSearch: false, recommendationCleanup: false }), patternIds, ID, VERSION, classify, eligible, detect, structuralSafety, diagnose, nextEpoch, cleanup });
})();
EXP.Retailers.register(EXP.EbayAdapter);

// Etsy tags many page sections with data-appears-component-name, which is the most
// stable hook it offers. Search cards are v2-listing-card units; an ad is a card
// whose caption reads "Ad by Etsy seller" or "Ad・By <shop>".
EXP.EtsyAdapter = (() => {
  const ID = 'ward.retailer.etsy';
  const VERSION = '1';
  const errors = [];
  let health = 'inactive';
  let epoch = 0;
  let lastScan = null;
  const supportedHosts = new Set(['www.etsy.com', 'etsy.com']);
  const component = (name) => `[data-appears-component-name="${name}"]`;
  const urgencySignal = component('Etsy-Modules-ListingPage-UrgencySignal-RecsRankingApiSpec');
  const financing = component('klarna_osm_messaging');
  const listingCard = '.v2-listing-card';
  const gridCell = 'li.wt-block-grid__item, li.wt-list-unstyled';
  const strikethrough = '.wt-text-strikethrough';
  // Whole recommendation modules carry their own per-item Add to cart links; those
  // are not the shopper's purchase controls, so only the page's real ones count.
  const recommendationModules = [component('Cart_Recommendations_ApiSpec_List'), component('promoted_picks_for_you')].join(', ');
  const essentialSelector = [component('add_to_cart_form'), component('express_checkout_button'), component('variations'), component('price'), 'form[action*="cart" i]', '[data-add-to-cart-button]', '[data-buy-box-region]', 'button[type="submit"]'].join(',');
  const protectedRootSelector = 'main, [role~="main"], #content, #gnav-header-inner, ul.wt-grid, ol.wt-grid';
  const purchaseWording = /add to cart|buy it now|check ?out|proceed to|place order|continue/i;
  const adCaption = /^ad(?: by etsy seller|\s?・\s?by\b.*|\s?from shop\b.*)$/i;
  const detectors = Object.freeze([
    { id: 'etsy.sponsored.listing', patternId: 'sponsorship.placement', pages: ['search'], selectors: [listingCard], adCard: true },
    { id: 'etsy.reference-price.card', patternId: 'pricing.reference-price', pages: ['search'], selectors: [`${listingCard} ${strikethrough}`] },
    { id: 'etsy.reference-price.item', patternId: 'pricing.reference-price', pages: ['product'], selectors: [`${component('price')} ${strikethrough}`] },
    { id: 'etsy.social-proof.item', patternId: 'pressure.social-proof', pages: ['product'], selectors: [urgencySignal], text: /\bcarts?\b|\bpeople\b|\bviewing\b|\bbought\b|\bpopular now\b|\bbestseller\b/i },
    { id: 'etsy.scarcity.item', patternId: 'pressure.scarcity', pages: ['product'], selectors: [urgencySignal], text: /\bonly \d+ left\b|\blow in stock\b|\balmost gone\b|\bselling fast\b/i },
    { id: 'etsy.recommendation.module', patternId: 'cross-sell.recommendation', pages: ['cart'], selectors: [recommendationModules] },
    { id: 'etsy.financial.klarna', patternId: 'upsell.financial-product', pages: ['product', 'cart'], selectors: [financing] }
  ]);

  function classify(pathname = location.pathname) {
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?listing\//.test(pathname)) return 'product';
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:search|c|market|featured)(?:\/|$)/.test(pathname)) return 'search';
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?cart(?:\/|$)/.test(pathname)) return 'cart';
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:checkout|cart\/checkout)(?:\/|$)/.test(pathname)) return 'checkout';
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?your\/(?:purchases|orders)/.test(pathname)) return 'orders';
    if (pathname === '/' || pathname === '') return 'home';
    return 'other';
  }

  function eligible() { return supportedHosts.has(location.hostname); }
  function record(error, code) { errors.push({ code, at: Date.now() }); if (errors.length > 8) errors.shift(); health = 'degraded'; EXP.Core.safeError(Object.assign(error || new Error(code), { code }), ID); }
  function safeQueryAll(root, selector) { try { return [...root.querySelectorAll(selector)]; } catch (error) { record(error, 'DETECTOR_SELECTOR'); return []; } }
  function isProtectedPageRoot(node) {
    return !node || node === document.documentElement || node === document.head || node === document.body ||
      Boolean(node.matches?.(protectedRootSelector)) || Boolean(node.querySelector?.(`${protectedRootSelector}, [data-exp-owned="1"]`));
  }
  function hasPurchaseControl(node) { return [...(node.querySelectorAll?.('button, a, input[type="submit"]') || [])].some((control) => purchaseWording.test(control.textContent || control.value || control.getAttribute('aria-label') || '')); }
  function essentialOverlap(node) {
    if (node.matches?.(recommendationModules)) return Boolean(safeQueryAll(node, essentialSelector).length);
    return hasPurchaseControl(node) || Boolean(node.matches?.(essentialSelector) || node.closest?.(essentialSelector) || safeQueryAll(node, essentialSelector).length);
  }
  function structuralSafety(node) {
    if (!node?.isConnected) return { safe: false, reason: 'detached' };
    if (isProtectedPageRoot(node) || node.closest?.('[data-exp-owned="1"]')) return { safe: false, reason: 'protected-root' };
    if (essentialOverlap(node)) return { safe: false, reason: 'essential-overlap' };
    if (node.matches?.(`${urgencySignal}, ${financing}`)) return { safe: true, reason: 'known-static' };
    if (node.matches?.(recommendationModules)) return { safe: true, reason: 'complete-module' };
    if (node.matches?.(gridCell) || node.matches?.(listingCard)) return { safe: true, reason: 'complete-sponsored-placement' };
    if (node.matches?.(strikethrough)) return { safe: true, reason: 'price-text' };
    return { safe: false, reason: 'unverified-container' };
  }

  function carriesAdCaption(card) {
    return [...card.querySelectorAll('span, p')].some((label) => !label.childElementCount && adCaption.test((label.textContent || '').trim()));
  }

  function detect(roots = [document]) {
    if (!eligible()) { health = 'inactive'; lastScan = null; return []; }
    const pageType = classify();
    const found = new Map();
    const eligibleDetectors = detectors.filter((detector) => detector.pages.includes(pageType));
    const matchedDetectors = new Set();
    let matchedTargets = 0;
    health = 'healthy';
    for (const detector of eligibleDetectors) {
      try {
        for (const root of roots) for (const selector of detector.selectors) for (const match of [...(root.matches?.(selector) ? [root] : []), ...safeQueryAll(root, selector)]) {
          if (detector.adCard && !carriesAdCaption(match)) continue;
          // Hide the whole grid cell so no empty gap is left, but only when it holds just this card.
          const cell = detector.adCard ? match.closest(gridCell) : null;
          const node = cell && cell.querySelectorAll(listingCard).length === 1 ? cell : match;
          if (!node.isConnected || isProtectedPageRoot(node) || node.closest('[data-exp-owned="1"]')) continue;
          if (detector.text && !detector.text.test((node.textContent || '').trim())) continue;
          matchedDetectors.add(detector.id);
          matchedTargets += 1;
          const essential = essentialOverlap(node);
          const structural = structuralSafety(node);
          const confidence = essential ? 'ambiguous' : 'confirmed';
          EXP.Audit?.detected?.(node, { detectorId: detector.id, patternId: detector.patternId, confidence, structuralSafe: structural.safe, structuralReason: structural.reason });
          if (!found.has(node)) found.set(node, Object.freeze({ evidenceId: `${detector.id}:${selector}`, detectorId: detector.id, patternId: detector.patternId, pageType, node, signals: ['adapter-selector'], exclusions: essential ? ['essential-overlap'] : [], essentialOverlap: essential, structuralSafe: structural.safe, structuralReason: structural.reason, confidence, epoch }));
        }
      } catch (error) { record(error, 'DETECTOR_FAILURE'); }
    }
    lastScan = { pageType, eligibleDetectors: eligibleDetectors.map(({ id }) => id), matchedDetectors: [...matchedDetectors], matchedTargets };
    return [...found.values()];
  }

  function diagnose() { return { id: ID, version: VERSION, health, eligible: eligible(), pageType: eligible() ? classify() : 'unsupported', detectorCount: detectors.length, coverage: lastScan, errors: errors.slice() }; }
  function nextEpoch() { epoch += 1; health = eligible() ? 'healthy' : 'inactive'; lastScan = null; return epoch; }
  function cleanup() { epoch += 1; health = 'inactive'; lastScan = null; errors.length = 0; }
  const patternIds = Object.freeze([...new Set(detectors.map((detector) => detector.patternId))]);
  return Object.freeze({ key: 'etsy', label: 'Etsy', features: Object.freeze({ coupons: false, compactSearch: false, recommendationCleanup: false }), patternIds, ID, VERSION, classify, eligible, detect, structuralSafety, diagnose, nextEpoch, cleanup });
})();
EXP.Retailers.register(EXP.EtsyAdapter);

EXP.Activity = (() => {
  const active = new Map();
  const totals = { interventions: 0, couponsConfirmed: 0, couponsSkipped: 0, couponsFailed: 0, structuralCollapseSkipped: 0 };
  const reveals = [];
  const structuralSkipReasons = {};
  let structuralSkippedNodes = new WeakSet();
  function apply(id, data) { const existing = active.get(id); active.set(id, { patternId: data.patternId, category: data.category, action: data.action, confidence: data.confidence, revealed: false }); if (!existing) totals.interventions += 1; }
  function remove(id) { active.delete(id); }
  function reveal(id) { const item = active.get(id); if (!item || item.revealed) return; item.revealed = true; reveals.push({ patternId: item.patternId, action: item.action, at: Date.now() }); if (reveals.length > 20) reveals.shift(); }
  function conceal(id) { const item = active.get(id); if (item) item.revealed = false; }
  function coupon(result) { if (result === 'confirmed') totals.couponsConfirmed += 1; else if (result === 'skipped') totals.couponsSkipped += 1; else totals.couponsFailed += 1; }
  function structuralSkip(node, reason = 'unsafe-structural-target') { if (node && structuralSkippedNodes.has(node)) return; if (node) structuralSkippedNodes.add(node); totals.structuralCollapseSkipped += 1; structuralSkipReasons[reason] = (structuralSkipReasons[reason] || 0) + 1; }
  function snapshot() { const breakdown = {}; for (const item of active.values()) { const key = `${item.category}:${item.action}`; breakdown[key] = (breakdown[key] || 0) + 1; } return { active: active.size, breakdown, totals: { ...totals }, structuralSkipsByReason: { ...structuralSkipReasons }, reveals: reveals.map((item) => ({ ...item })) }; }
  function resetRoute() { active.clear(); structuralSkippedNodes = new WeakSet(); }
  function clearSession() { active.clear(); totals.interventions = 0; totals.couponsConfirmed = 0; totals.couponsSkipped = 0; totals.couponsFailed = 0; totals.structuralCollapseSkipped = 0; for (const key of Object.keys(structuralSkipReasons)) delete structuralSkipReasons[key]; structuralSkippedNodes = new WeakSet(); reveals.length = 0; }
  return Object.freeze({ apply, remove, reveal, conceal, coupon, structuralSkip, snapshot, resetRoute, clearSession });
})();

EXP.PageStyles = (() => {
  const handles = new Set();

  function inject(cssText, data = {}) {
    let css = String(cssText || '');
    let disposed = false;
    const node = EXP.Core.injectStyle(document, css, data);

    const handle = {
      get textContent() { return css; },
      set textContent(value) {
        css = String(value || '');
        try { node.textContent = css; } catch (error) { EXP.Core.safeError(Object.assign(error, { code:'STYLE_UPDATE' }), 'ward.styles'); }
      },
      active() {
        return !disposed && Boolean(node?.isConnected);
      },
      remove() {
        if (disposed) return;
        disposed = true;
        try { node?.remove(); } catch {}
        handles.delete(handle);
      }
    };
    handles.add(handle);
    return handle;
  }

  function cleanup() {
    for (const handle of [...handles]) handle.remove();
  }

  return Object.freeze({ inject, cleanup });
})();

EXP.Actions = (() => {
  const records = new Map();
  const byNode = new WeakMap();
  let sequence = 0;
  let style;

  function isProtectedRoot(node) {
    return !(node instanceof Element) ||
      node === document.documentElement ||
      node === document.head ||
      node === document.body ||
      node === document.scrollingElement;
  }

  function ensureStyles() {
    if (style?.active()) return;
    style = EXP.PageStyles.inject(`
      .exp-ward-dimmed{
        opacity:.58!important;
        filter:saturate(.72)!important;
        transition:opacity .12s ease,filter .12s ease!important
      }
      .exp-ward-collapse,.exp-ward-reprotect{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
        width:100%!important;
        min-height:28px!important;
        margin:4px 0!important;
        padding:5px 8px!important;
        border:1px solid rgba(183,91,0,.38)!important;
        border-radius:6px!important;
        background:rgba(255,244,199,.72)!important;
        color:#4a3518!important;
        box-shadow:none!important;
        font:600 11px/1.25 system-ui,sans-serif!important;
        cursor:pointer!important;
        text-align:left!important
      }
      .exp-ward-collapse:hover,.exp-ward-reprotect:hover{
        background:rgba(255,244,199,.9)!important;
        border-color:rgba(183,91,0,.6)!important
      }
      .exp-ward-collapse:focus-visible,.exp-ward-reprotect:focus-visible{
        outline:2px solid #1b70c9!important;
        outline-offset:2px!important
      }
      .exp-ward-collapse-label{
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
        opacity:.82!important
      }
      .exp-ward-collapse-action{
        flex:0 0 auto!important;
        font-weight:800!important
      }
      .exp-ward-annotation{
        display:inline-block!important;
        margin:2px 4px!important;
        padding:2px 5px!important;
        border:1px solid rgba(183,91,0,.32)!important;
        border-radius:5px!important;
        background:rgba(255,244,199,.65)!important;
        color:#5a421f!important;
        font:700 9px/1.2 system-ui,sans-serif!important
      }
      .exp-ward-reprotect{
        width:auto!important;
        margin:4px 0 4px auto!important;
        color:#4a3518!important
      }
    `, { wardActions:'1' });
  }

  function idFor(node) {
    const existing = byNode.get(node);
    if (existing && records.get(existing.id) === existing) return existing.id;
    if (existing) byNode.delete(node);
    const id = `ward-${++sequence}`;
    const record = {
      id,
      node,
      action: 'allow',
      patternId: '',
      category: '',
      confidence: '',
      structuralSafe: null,
      original: null,
      companion: null,
      revealed: false
    };
    records.set(id, record);
    byNode.set(node, record);
    node.dataset.wardInstance = id;
    return id;
  }

  function capture(record) {
    if (record.original) return;
    const node = record.node;
    record.original = {
      hidden: node.hidden,
      ariaHidden: node.getAttribute('aria-hidden'),
      inert: node.hasAttribute('inert'),
      display: node.style.getPropertyValue('display'),
      displayPriority: node.style.getPropertyPriority('display'),
      opacity: node.style.getPropertyValue('opacity'),
      opacityPriority: node.style.getPropertyPriority('opacity'),
      filter: node.style.getPropertyValue('filter'),
      filterPriority: node.style.getPropertyPriority('filter'),
      position: node.style.position
    };
  }

  function clearPresentation(record) {
    const { node, original } = record;
    record.companion?.remove();
    record.companion = null;
    node.classList.remove('exp-ward-dimmed');

    if (original) {
      node.hidden = original.hidden;
      original.ariaHidden === null
        ? node.removeAttribute('aria-hidden')
        : node.setAttribute('aria-hidden', original.ariaHidden);
      original.inert ? node.setAttribute('inert', '') : node.removeAttribute('inert');
      if (original.display) node.style.setProperty('display', original.display, original.displayPriority);
      else node.style.removeProperty('display');
      if (original.opacity) node.style.setProperty('opacity', original.opacity, original.opacityPriority);
      else node.style.removeProperty('opacity');
      if (original.filter) node.style.setProperty('filter', original.filter, original.filterPriority);
      else node.style.removeProperty('filter');
      node.style.position = original.position;
    }

    node.removeAttribute('data-ward-action');
    globalThis.ExtraPotionsCore?.clearPresentationState?.(node, 'ward');
  }

  function publishPresentation(record) {
    if (record.action === 'hide' || record.action === 'collapse' || record.action === 'dim') {
      globalThis.ExtraPotionsCore?.setPresentationState?.(record.node, 'ward', { visibility: record.action });
    } else {
      globalThis.ExtraPotionsCore?.clearPresentationState?.(record.node, 'ward');
    }
  }

  function presentationIntact(record, action) {
    const node = record.node;
    if (record.revealed) return node.dataset.wardRevealed === '1' && record.companion?.isConnected && record.companion.classList.contains('exp-ward-reprotect');
    if (action === 'allow') return !node.hasAttribute('data-ward-action') && !record.companion && !node.classList.contains('exp-ward-dimmed');
    if (action === 'dim') return node.dataset.wardAction === 'dim' && node.classList.contains('exp-ward-dimmed') && node.style.getPropertyValue('opacity') === '0.58' && node.style.getPropertyPriority('opacity') === 'important' && !record.companion;
    if (action === 'annotate') return node.dataset.wardAction === 'annotate' && record.companion?.isConnected && record.companion.classList.contains('exp-ward-annotation');
    if (action === 'collapse') return node.dataset.wardAction === 'collapse' && node.hidden && node.hasAttribute('inert') && node.style.getPropertyValue('display') === 'none' && node.style.getPropertyPriority('display') === 'important' && record.companion?.isConnected && record.companion.classList.contains('exp-ward-collapse');
    if (action === 'hide') return node.dataset.wardAction === 'hide' && node.hidden && node.hasAttribute('inert') && node.style.getPropertyValue('display') === 'none' && node.style.getPropertyPriority('display') === 'important';
    return false;
  }

  function makeCompanion(record, kind, text) {
    const element = document.createElement(kind === 'collapse' || kind === 'reprotect' ? 'button' : 'span');
    element.dataset.expOwned = '1';
    element.className = `exp-ward-${kind}`;

    if (kind === 'collapse') {
      element.type = 'button';
      element.setAttribute('aria-expanded', 'false');
      element.setAttribute('aria-label', `${text}. Show content`);

      const label = document.createElement('span');
      label.className = 'exp-ward-collapse-label';
      label.textContent = 'Protected by WARD';

      const show = document.createElement('span');
      show.className = 'exp-ward-collapse-action';
      show.textContent = 'Show';

      element.append(label, show);
      element.addEventListener('click', () => reveal(record.id));
    } else if (kind === 'reprotect') {
      element.type = 'button';
      element.textContent = 'Protect again';
      element.setAttribute('aria-label', `Protect ${text} again`);
      element.addEventListener('click', () => endReveal(record.id));
    } else {
      element.textContent = text;
    }

    record.node.insertAdjacentElement('afterend', element);
    record.companion = element;
  }

  function apply(node, proposal) {
    if (isProtectedRoot(node)) {
      EXP.Core.safeError(
        Object.assign(
          new Error('WARD refused an intervention against a protected document root'),
          { code: 'ACTION_ROOT_GUARD' }
        ),
        'ward.actions'
      );
      return null;
    }

    ensureStyles();

    const id = idFor(node);
    const record = records.get(id);
    capture(record);

    const structuralAction = proposal.action === 'hide' || proposal.action === 'collapse';
    const nextAction = structuralAction && proposal.structuralSafe === false ? 'dim' : proposal.action;
    const sameDecision =
      record.action === nextAction &&
      record.patternId === proposal.pattern.id &&
      record.category === proposal.pattern.category &&
      record.confidence === proposal.confidence;

    record.action = nextAction;
    record.patternId = proposal.pattern.id;
    record.category = proposal.pattern.category;
    record.confidence = proposal.confidence;
    record.reason = proposal.reason || 'protection-policy';
    record.structuralSafe = proposal.structuralSafe ?? record.structuralSafe;

    if (record.revealed) {
      node.dataset.wardRevealed = '1';
      if (!presentationIntact(record, nextAction)) makeCompanion(record, 'reprotect', proposal.pattern.label);
      return id;
    }

    if (sameDecision && presentationIntact(record, nextAction)) return id;

    clearPresentation(record);
    node.removeAttribute('data-ward-revealed');
    node.dataset.wardAction = record.action;

    if (record.action === 'hide') {
      if (node.contains(document.activeElement)) document.activeElement.blur();
      node.hidden = true;
      node.style.setProperty('display', 'none', 'important');
      node.setAttribute('inert', '');
    } else if (record.action === 'dim') {
      node.classList.add('exp-ward-dimmed');
      node.style.setProperty('opacity', '0.58', 'important');
      node.style.setProperty('filter', 'saturate(0.72)', 'important');
    } else if (record.action === 'collapse') {
      const transferFocus = node.contains(document.activeElement);
      node.hidden = true;
      node.style.setProperty('display', 'none', 'important');
      node.setAttribute('inert', '');
      makeCompanion(record, 'collapse', `Show ${proposal.pattern.label}`);
      if (transferFocus) record.companion.focus();
    } else if (record.action === 'annotate') {
      makeCompanion(record, 'annotation', `WARD: ${proposal.pattern.label}`);
    } else {
      record.action = 'allow';
      node.removeAttribute('data-ward-action');
    }

    publishPresentation(record);
    if (record.action === 'allow') EXP.Activity.remove(id);
    else EXP.Activity.apply(id, record);

    return id;
  }

  function reveal(id) {
    const record = records.get(id);
    if (!record || record.action === 'allow') return false;
    clearPresentation(record);
    record.revealed = true;
    record.node.dataset.wardRevealed = '1';
    makeCompanion(record, 'reprotect', EXP.Patterns.get(record.patternId)?.label || 'protected content');
    EXP.Activity.reveal(id);
    EXP.Audit?.revealed?.(record.node);
    return true;
  }

  function endReveal(id) {
    const record = records.get(id);
    if (!record?.revealed) return false;
    record.node.removeAttribute('data-ward-revealed');
    record.revealed = false;
    EXP.Activity.conceal(id);
    EXP.Audit?.concealed?.(record.node);
    apply(record.node, {
      action: record.action,
      pattern: {
        id: record.patternId,
        category: record.category,
        label: EXP.Patterns.get(record.patternId)?.label || 'protected content'
      },
      confidence: record.confidence,
      structuralSafe: record.structuralSafe
    });
    return true;
  }

  function restore(id, forget = true) {
    const record = records.get(id);
    if (!record) return false;
    clearPresentation(record);
    record.node.removeAttribute('data-ward-revealed');
    record.node.removeAttribute('data-ward-instance');
    EXP.Activity.remove(id);
    if (forget) {
      records.delete(id);
      byNode.delete(record.node);
    }
    return true;
  }

  function restoreAll() {
    for (const id of [...records.keys()]) restore(id);
  }

  function cleanup() {
    restoreAll();
    style?.remove();
    style = null;
  }

  function snapshot() {
    return [...records.values()].map(
      ({ id, action, patternId, category, confidence, reason, revealed, node }) => ({
        id,
        action,
        patternId,
        category,
        confidence,
        reason,
        revealed,
        connected: node.isConnected
      })
    );
  }

  function prune() {
    for (const [id, record] of records) {
      if (record.node.isConnected) continue;
      record.companion?.remove();
      records.delete(id);
      byNode.delete(record.node);
      EXP.Activity.remove(id);
    }
  }

  return Object.freeze({ apply, reveal, endReveal, restore, restoreAll, cleanup, snapshot, prune });
})();

EXP.Layout = (() => {
  let style;
  function apply(settings, pageType) {
    const enabled = EXP.Retailer.enabled(settings) && EXP.Retailer.features().compactSearch && !settings.safeMode && settings.compactSearch && pageType === 'search';
    if (!enabled) { style?.remove(); style = null; return; }
    if (style?.active()) return;
    style = EXP.PageStyles.inject(`
      [data-component-type="s-search-result"]{margin-block:4px!important;padding-block:6px!important}
      [data-component-type="s-search-result"] .a-section{margin-bottom:4px!important}
    `, { wardLayout:'compact-search' });
  }
  function cleanup() { style?.remove(); style = null; }
  return Object.freeze({ apply, cleanup, active: () => Boolean(style?.active()) });
})();

EXP.Engine = (() => {
  let active = false;
  let routeEpoch = 0;
  let couponQuarantined = false;
  let couponStatus = { state:'ready', reason:'not-run', lastResult:null };
  let lastActivityDigest = '';
  const couponPending = new Set();

  function activityDigest() {
    const data = EXP.Activity.snapshot();
    const adapter = EXP.Retailer.diagnose();
    return JSON.stringify({ active: data.active, totals: data.totals, breakdown: data.breakdown, adapter:adapter.health, coupon:couponStatus, quarantined:couponQuarantined });
  }

  function syncActivityUi() {
    const digest = activityDigest();
    if (digest === lastActivityDigest) return;
    lastActivityDigest = digest;
    EXP.UI?.refreshActivity?.();
  }

  function structuralDowngrade(action, evidence, pattern) {
    if ((action !== 'hide' && action !== 'collapse') || evidence.structuralSafe !== false) return action;
    EXP.Activity.structuralSkip(evidence.node, evidence.structuralReason || 'unsafe-structural-target');
    if (pattern.allowedActions.includes('dim')) return 'dim';
    if (pattern.allowedActions.includes('annotate')) return 'annotate';
    return 'allow';
  }

  function requestedDecision(evidence, pattern, settings) {
    if (!EXP.Retailer.enabled(settings) || settings.safeMode) return { action: 'allow', reason: 'protection-disabled' };
    if(settings.pageExceptions?.some(v=>v.path===location.hostname+location.pathname&&v.patternId===pattern.id))return {action:'allow',reason:'remembered-page-exception'};
    const patternMode = settings.patterns[pattern.id] || 'inherit';
    const categoryMode = settings.categories[pattern.category] || 'inherit';
    if (patternMode === 'off') return { action: 'allow', reason: 'pattern-disabled' };
    if (patternMode === 'inherit' && categoryMode === 'off') return { action: 'allow', reason: 'category-disabled' };
    if (evidence.confidence === 'blocked') return { action: 'allow', reason: 'blocked-confidence' };
    if (evidence.essentialOverlap) return { action: pattern.allowedActions.includes('annotate') ? 'annotate' : 'allow', reason: 'essential-overlap' };
    if (evidence.confidence === 'ambiguous') return { action: pattern.allowedActions.includes('annotate') ? 'annotate' : 'allow', reason: 'ambiguous-confidence' };
    if (evidence.confidence === 'supported' && settings.confidencePolicy === 'confirmed') return { action: 'allow', reason: 'confidence-policy' };

    if (settings.contentAction === 'automatic' && settings.protectionLevel !== 'custom' && pattern.id === 'cross-sell.recommendation' && settings.recommendationCleanup && evidence.structuralSafe === true) {
      return { action: 'collapse', reason: 'recommendation-cleanup' };
    }

    let action;
    let reason;
    if (settings.contentAction === 'hide' || settings.contentAction === 'dim') {
      action = pattern.allowedActions.includes(settings.contentAction) ? settings.contentAction : 'dim';
      reason = 'content-action';
    } else if (settings.protectionLevel === 'essential') {
      if (pattern.essentialPolicy === 'complete-placement-only' && evidence.structuralSafe === true) {
        action = pattern.defaultAction;
        reason = 'essential-complete-placement';
      } else if (pattern.defaultAction === 'annotate' && pattern.allowedActions.includes('annotate')) {
        action = 'annotate';
        reason = 'essential-annotate';
      } else if (pattern.allowedActions.includes('dim')) {
        action = 'dim';
        reason = 'essential-dim';
      } else if (pattern.allowedActions.includes('annotate')) {
        action = 'annotate';
        reason = 'essential-annotate';
      } else {
        action = 'allow';
        reason = 'essential-allow';
      }
    } else if (settings.protectionLevel === 'custom') {
      action = pattern.allowedActions.includes(settings.defaultAction) ? settings.defaultAction : pattern.defaultAction;
      reason = 'custom-policy';
    } else {
      action = pattern.defaultAction;
      reason = 'balanced-pattern-policy';
    }

    if (evidence.confidence === 'supported' && action === 'hide') {
      action = pattern.allowedActions.includes('collapse') ? 'collapse' : 'annotate';
      reason = 'supported-safe-action';
    }
    return { action, reason };
  }

  function processEvidence(evidence, settings) {
    const pattern = EXP.Patterns.get(evidence.patternId);
    if (!pattern) return;
    const requested = requestedDecision(evidence, pattern, settings);
    const appliedAction = structuralDowngrade(requested.action, evidence, pattern);
    const reason = requested.action !== appliedAction
      ? (evidence.structuralReason || 'unsafe-structural-target')
      : requested.reason;
    EXP.Audit?.decision?.(evidence.node, {
      detectorId: evidence.detectorId,
      patternId: evidence.patternId,
      confidence: evidence.confidence,
      requestedAction: requested.action,
      appliedAction,
      structuralSafe: evidence.structuralSafe,
      reason
    });
    EXP.Actions.apply(evidence.node, { action: appliedAction, pattern, confidence: evidence.confidence, structuralSafe: evidence.structuralSafe, reason });
  }

  function verifyCoupon(control, component, epoch, href) {
    setTimeout(() => {
      couponPending.delete(control);
      if (epoch !== routeEpoch || !active) return;
      if (location.href !== href) { couponQuarantined = true; couponStatus = { state:'quarantined', reason:'unexpected-navigation', lastResult:'failed' }; EXP.Activity.coupon('failed'); control.dataset.wardCouponFailure = 'unexpected-navigation'; syncActivityUi(); return; }
      const claimed = control.checked || (component.isConnected && (!component.classList.contains('unclaimed') || component.matches('.claimed, [data-claimed="true"]')));
      if (claimed) { EXP.Activity.coupon('confirmed'); couponStatus = { state:'confirmed', reason:'coupon-confirmed', lastResult:'confirmed' }; }
      else { const reason = component.isConnected ? 'no-confirmation' : 'detached'; EXP.Activity.coupon('failed'); control.dataset.wardCouponFailure = reason; couponStatus = { state:'attention', reason, lastResult:'failed' }; }
      syncActivityUi();
    }, 300);
  }

  function processCoupons(roots, settings) {
    if (!EXP.Retailer.enabled(settings) || settings.safeMode || !settings.autoClipCoupons || !EXP.Retailer.features().coupons) { couponStatus = { state:'disabled', reason:'coupon-setting', lastResult:couponStatus.lastResult }; return; }
    if (couponQuarantined) { couponStatus = { state:'quarantined', reason:couponStatus.reason || 'coupon-quarantine', lastResult:couponStatus.lastResult }; return; }
    const candidates = EXP.Retailer.couponCandidates(roots);
    if (!candidates.length && couponStatus.state === 'ready') couponStatus = { state:'idle', reason:'no-eligible-coupon', lastResult:null };
    for (const control of candidates) {
      const check = EXP.Retailer.verifyCouponTarget(control);
      if (!check.eligible) { if (!control.dataset.wardCouponSkipped) { control.dataset.wardCouponSkipped = check.reason; EXP.Activity.coupon('skipped'); couponStatus = { state:'attention', reason:check.reason, lastResult:'skipped' }; } continue; }
      if (couponPending.has(control)) continue;
      couponStatus = { state:'checking', reason:'awaiting-confirmation', lastResult:couponStatus.lastResult };
      control.dataset.wardCouponAttempted = '1'; couponPending.add(control);
      try { const href = location.href; control.click(); verifyCoupon(control, check.component, routeEpoch, href); }
      catch (error) { couponPending.delete(control); couponQuarantined = true; couponStatus = { state:'quarantined', reason:'activation-error', lastResult:'failed' }; EXP.Activity.coupon('failed'); EXP.Core.safeError(Object.assign(error, { code: 'COUPON_ACTIVATION' }), 'ward.amazon.coupon'); }
    }
  }

  function resumeCoupons() {
    couponQuarantined = false;
    couponPending.clear();
    couponStatus = { state:'ready', reason:'manual-resume', lastResult:couponStatus.lastResult };
    for (const control of document.querySelectorAll('[data-ward-coupon-attempted],[data-ward-coupon-failure],[data-ward-coupon-skipped]')) {
      delete control.dataset.wardCouponAttempted;
      delete control.dataset.wardCouponFailure;
      delete control.dataset.wardCouponSkipped;
    }
    if (active) processBatch([document]);
    syncActivityUi();
    return true;
  }

  function publishSuiteState(pageType = 'unknown') {
    const records = EXP.Actions.snapshot();
    const counts = { hide: 0, dim: 0, collapse: 0, annotate: 0 };
    for (const record of records) if (Object.hasOwn(counts, record.action)) counts[record.action] += 1;
    globalThis.ExtraPotionsCore?.publishSuiteState?.('ward', 'ward.state-changed', {
      active: Boolean(active),
      pageType: String(pageType || 'unknown'),
      interventions: records.length,
      hide: counts.hide,
      dim: counts.dim,
      collapse: counts.collapse,
      annotate: counts.annotate,
    });
  }

  function processBatch(roots = [document]) {
    if (!active) return;
    const settings = EXP.Settings.snapshot();
    if (!EXP.Retailer.enabled(settings) || settings.safeMode) { EXP.Actions.restoreAll(); EXP.UI?.restack?.(); syncActivityUi(); publishSuiteState('inactive'); return; }
    const pageType = EXP.Retailer.classify();
    EXP.Layout.apply(settings, pageType);
    const evidenceList = EXP.Retailer.detect(roots);
    const seenNodes = new Set();
    for (const evidence of evidenceList) {
      seenNodes.add(evidence.node);
      processEvidence(evidence, settings);
    }
    if (settings.recommendationCleanup && EXP.Retailer.features().recommendationCleanup) {
      for (const node of EXP.Retailer.cosmeticRecommendationCandidates(roots)) {
        if (seenNodes.has(node)) continue;
        const structural = EXP.Retailer.structuralSafety(node);
        const evidence = {
          detectorId: `${EXP.Retailer.key()}.cross-sell.recommendation`,
          patternId: 'cross-sell.recommendation',
          pageType,
          node,
          signals: ['recommendation-cleanup'],
          exclusions: [],
          essentialOverlap: false,
          structuralSafe: structural.safe,
          structuralReason: structural.reason,
          confidence: 'confirmed'
        };
        EXP.Audit?.detected?.(node, {
          detectorId: evidence.detectorId,
          patternId: evidence.patternId,
          confidence: evidence.confidence,
          structuralSafe: evidence.structuralSafe,
          structuralReason: evidence.structuralReason
        });
        processEvidence(evidence, settings);
      }
    }
    processCoupons(roots, settings);
    EXP.Actions.prune();
    EXP.Audit?.prune?.();
    EXP.UI?.restack?.();
    syncActivityUi();
    publishSuiteState(pageType);
  }

  function rebuild() { EXP.Actions.restoreAll(); EXP.Layout.cleanup(); EXP.Audit?.resetRoute?.(); if (active) processBatch([document]); }
  function navigation() { routeEpoch += 1; couponQuarantined = false; couponStatus = { state:'ready', reason:'navigation', lastResult:null }; couponPending.clear(); EXP.Retailer.nextEpoch(); EXP.Actions.restoreAll(); EXP.Layout.cleanup(); EXP.Activity.resetRoute(); EXP.Audit?.resetRoute?.(); if (active) processBatch([document]); }
  function start() { if (active) return; active = true; routeEpoch += 1; couponQuarantined = false; couponStatus = { state:'ready', reason:'start', lastResult:null }; EXP.Retailer.nextEpoch(); EXP.Audit?.resetRoute?.(); processBatch([document]); }
  function stop() { active = false; couponPending.clear(); couponStatus = { state:'disabled', reason:'engine-stopped', lastResult:couponStatus.lastResult }; EXP.Actions.restoreAll(); EXP.Layout.cleanup(); publishSuiteState('inactive'); }
  function cleanup() { stop(); EXP.Actions.cleanup(); EXP.PageStyles.cleanup(); EXP.Retailer.cleanup(); EXP.Activity.resetRoute(); EXP.Audit?.resetRoute?.(); }
  function diagnostics() { return { product: { id: 'ward', version: EXP.VERSION, active }, adapter: EXP.Retailer.diagnose(), coupon: { ...couponStatus, quarantined:couponQuarantined, pending:couponPending.size }, activity: EXP.Activity.snapshot(), audit: EXP.Audit?.snapshot?.() || null, interventions: EXP.Actions.snapshot(), core: EXP.Core.diagnosticSnapshot() }; }
  return Object.freeze({ start, stop, cleanup, navigation, rebuild, processBatch, resumeCoupons, diagnostics, get active() { return active; }, get couponQuarantined() { return couponQuarantined; } });
})();

EXP.VERSION = '3.2.31';

EXP.ReleaseNotes = (() => {
  const notes = Object.freeze({
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

// exp-core owns the canonical shared UI; WARD-specific color stays declarative.
EXP.MenuChrome = Object.freeze({ create: options => ExtraPotionsCore.create({ ...options, launcherSrc: 'https://raw.githubusercontent.com/ExtraPotions/WARD/main/assets/ward-launcher.svg', productTheme: {"id":"ward","name":"WARD gem","swatch":"linear-gradient(135deg,#fff58a 0 34%,#ffad25 34% 67%,#ee4450 67%)","bg":"#101014","panel":"#19191e","line":"#3a3532","text":"#fffaf3","muted":"#b9afa7","accent":"#ffb000","accent2":"#ff4a35","skin":"linear-gradient(135deg,#fff58a 0 34%,#ffad25 34% 67%,#ee4450 67%)","skinVertical":"linear-gradient(180deg,#fff58a 0 34%,#ffad25 34% 67%,#ee4450 67%)"} }) });

EXP.UI = (() => {
  const ICON_URL = 'https://raw.githubusercontent.com/ExtraPotions/WARD/main/assets/ward-launcher.svg';
  const BADGE = ICON_URL;
  const LAUNCHER = ICON_URL;

  const UI_THEMES = ExtraPotionsCore.themes({"id":"ward","name":"WARD gem","swatch":"linear-gradient(135deg,#120b05 0 38%,#b66a16 38% 69%,#356f78 69% 100%)","canvas":"#120b05","surface":"#241409","primary":"#b66a16","companion":"#9d3131","counterpoint":"#356f78","interactive":"#d1842a","bg":"#120b05","panel":"#241409","line":"#53321f","text":"#f1dfc9","muted":"#b79e84","accent":"#b66a16","accent2":"#d1842a","skin":"linear-gradient(135deg,#b66a16 0%,#9d3131 52%,#356f78 100%)","skinVertical":"linear-gradient(180deg,#b66a16 0%,#9d3131 52%,#356f78 100%)"});

  let host, shadow, launcher, shell, nav, content, toast, chrome, updateCard, noticeController;
  let toastTimer, launcherCleanup, escapeHandler, pointerHandler;
  let activeView = '';
  let patternsOpen = false;

  const views = [
    ['page', 'Protection'],
    ['look', 'Appearance'],
    ['tools', EXP.Retailer.label()],
    ['system', 'System']
  ];

  const sourceToggles = [
    ['prime', 'Prime upsells', 'upsell.membership.prime'],
    ['urgency', 'Urgency messages', 'pressure.urgency'],
    ['scarcity', 'Scarcity messages', 'pressure.scarcity'],
    ['subscription', 'Subscribe & Save pressure', 'pressure.subscription'],
    ['credit', 'Credit and installment promotions', 'upsell.financial-product'],
    ['protection-plan', 'Protection plans', 'upsell.protection-plan'],
    ['business', 'Amazon Business promotions', 'upsell.business-membership'],
    ['sponsored', 'Sponsored placements', 'sponsorship.placement'],
    ['recommendations', 'Cross-sell recommendations', 'cross-sell.recommendation'],
    ['services', 'Amazon service promotions', 'upsell.amazon-service'],
    ['ai', 'Amazon AI shopping prompts', 'pressure.shopping-assistant'],
    ['social-proof', 'Popularity claims', 'pressure.social-proof'],
    ['store-membership', 'Store membership promotions', 'upsell.store-membership'],
    ['reference-price', 'Reference prices', 'pricing.reference-price']
  ];

  const categoryControls = [
    ['upsell', 'Upsells'],
    ['urgency', 'Urgency'],
    ['scarcity', 'Scarcity'],
    ['subscription', 'Subscriptions'],
    ['sponsored', 'Sponsored placements'],
    ['cross-sell', 'Cross-sell recommendations'],
    ['shopping-assistant', 'Shopping assistants'],
    ['social-proof', 'Popularity claims'],
    ['pricing', 'Reference prices']
  ];

  const css = `
    .ward-shell{display:contents}
    .row-help{display:block;margin-top:2px;color:var(--muted);font:500 8px/1.3 system-ui,sans-serif}
    .activity-breakdown{display:flex;flex-wrap:wrap;gap:5px;padding:6px 0}
    .activity-reasons,.current-protections{display:grid;gap:4px;margin-top:6px}
    .health-healthy,.coupon-confirmed{color:#95e6ae!important}
    .health-attention,.coupon-attention,.coupon-quarantined{color:#ffd17a!important}
    .health-inactive,.coupon-disabled{color:var(--muted)!important}
    :host([data-exp-non-color="1"]) .health-healthy::before{content:'✓ ';font-weight:900}
    :host([data-exp-non-color="1"]) :is(.health-attention,.coupon-attention,.coupon-quarantined)::before{content:'! ';font-weight:900}
    :host([data-exp-non-color="1"]) .health-inactive::before{content:'– ';font-weight:900}
  `;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function hideUpdateCard() {
    noticeController?.hide();
    chrome?.layout();
  }

  function showUpdateCard(result = {}, complete = false, previous = '', current = false) {
    if (!noticeController) return;
    const version = complete || current ? EXP.VERSION : result.latest;
    if (!complete && !current && !EXP.Core.claimNotice('ward', `available:${version}`)) return;

    const fallback = ['A newer WARD build is available.', 'Install the latest userscript for the newest fixes and improvements.'];
    const details = (current || complete
      ? EXP.ReleaseNotes.current()
      : Array.isArray(result.details) && result.details.length ? result.details : fallback).slice(0, 4);

    noticeController.show({
      kicker: current ? 'Current Version' : complete ? 'Update Complete' : 'Update Available',
      title: current ? 'WARD Changelog' : complete ? 'WARD Updated' : 'New WARD Version Available',
      version,
      text: current
        ? `What's new in v${EXP.VERSION}.`
        : complete
          ? `Updated from v${previous} to v${EXP.VERSION}.`
          : `v${result.latest} is ready to install.`,
      details,
      releaseUrl: 'https://github.com/ExtraPotions/WARD/releases',
      actionUrl: 'https://raw.githubusercontent.com/ExtraPotions/WARD/main/ward.user.js',
      showAction: !(complete || current),
      kind: current ? 'current' : complete ? 'complete' : 'available',
    });
    chrome?.layout();
  }

  function badge(alt = '') {
    const image = el('img');
    image.src = BADGE;
    image.alt = alt;
    return image;
  }

  function section(title) {
    const box = el('section','section');
    if (title) box.append(el('h3','',title));
    return box;
  }

  function row(label, _help, control) {
    const line = el('div','row');
    const copy = el('div','row-copy');
    copy.append(el('strong','',label));
    if (_help) copy.append(el('small','row-help',_help));
    line.append(copy, control);
    return line;
  }

  function switchControl(value, label, handler) {
    const button = el('button','switch');
    button.type = 'button';
    button.setAttribute('role','switch');
    button.setAttribute('aria-label',label);
    button.setAttribute('aria-checked',String(Boolean(value)));
    button.addEventListener('click', () => handler(button.getAttribute('aria-checked') !== 'true'));
    return button;
  }

  function selectControl(value, label, choices, handler) {
    const select = el('select','select');
    select.setAttribute('aria-label',label);
    for (const [optionValue, optionLabel] of choices) {
      const option = el('option','',optionLabel);
      option.value = optionValue;
      option.selected = optionValue === value;
      select.append(option);
    }
    select.addEventListener('change', () => handler(select.value));
    return select;
  }

  function action(label, handler, kind = '') {
    const button = el('button',`action ${kind}`.trim(),label);
    button.type = 'button';
    button.addEventListener('click',handler);
    return button;
  }

  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.style.top = `${Math.max(8,(launcher?.getBoundingClientRect().top || 60) - 48)}px`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toast) toast.hidden = true;
    }, 3000);
  }

  function applyUiTheme(id) { ExtraPotionsCore.applyTheme(host, id, UI_THEMES); }

  function update(patch, reason) {
    const next = EXP.Settings.update(patch, reason);
    
    if (shell?.classList.contains('open')) renderView();
    else chrome?.update();
    return next;
  }

  function overrideMode(record, id) {
    return record[id] || 'inherit';
  }

  function updatePatternMode(id, mode) {
    const settings = EXP.Settings.snapshot();
    update(
      { patterns:{...settings.patterns,[id]:mode} },
      `pattern:${id}`
    );
  }

  function updateCategoryMode(id, mode) {
    const settings = EXP.Settings.snapshot();
    update(
      { categories:{...settings.categories,[id]:mode} },
      `category:${id}`
    );
  }

  function adapterHealthState() {
    const diagnostics = EXP.Engine.diagnostics();
    if (diagnostics.adapter.health === 'degraded' || diagnostics.coupon.quarantined) return { id:'attention', label:'Attention' };
    if (diagnostics.adapter.health === 'inactive') return { id:'inactive', label:'Inactive' };
    return { id:'healthy', label:'Healthy' };
  }

  function adapterHealthControl() {
    const state = adapterHealthState();
    const tag = el('span',`tag health-${state.id}`,state.label);
    tag.setAttribute('data-exp-adapter-health',state.id);
    return tag;
  }

  function reasonLabel(reason) {
    return ({
      'balanced-pattern-policy':'Balanced policy',
      'custom-policy':'Custom policy',
      'content-action':'Content action preference',
      'essential-complete-placement':'Essential policy',
      'essential-annotate':'Essential policy',
      'essential-dim':'Essential policy',
      'recommendation-cleanup':'Recommendation cleanup',
      'dynamic-widget':'Dynamic widget safety',
      'unverified-container':'Container safety',
      'essential-overlap':'Purchase-control safety',
      'ambiguous-confidence':'Ambiguous detection'
    })[reason] || 'Protection policy';
  }

  function renderActivitySummary(container) {
    if (!container) return;
    const settings = EXP.Settings.snapshot();
    const activity = EXP.Activity.snapshot();
    const audit = EXP.Audit.snapshot();
    const interventions = EXP.Actions.snapshot().filter((item) => item.connected && item.action !== 'allow');
    const revealed = interventions.filter((item) => item.revealed);
    const box = section('Activity');
    box.append(
      row('Active protections','Current protected elements on this page.',el('span','tag',String(activity.active))),
      row('Temporarily revealed','Content currently shown until protection is reapplied.',el('span','tag',String(revealed.length)))
    );

    const actionCounts = Object.entries(activity.breakdown).sort(([a],[b]) => a.localeCompare(b));
    if (actionCounts.length) {
      const summary = el('div','activity-breakdown');
      for (const [key, count] of actionCounts) {
        const [, actionName] = key.split(':');
        summary.append(el('span','tag',`${count} ${actionName}`));
      }
      box.append(summary);
    }

    const reasonCounts = new Map();
    for (const target of audit.targets) {
      if (!target.appliedAction || target.appliedAction === 'allow') continue;
      const label = reasonLabel(target.reason);
      reasonCounts.set(label,(reasonCounts.get(label) || 0) + 1);
    }
    if (settings.explanationDetail === 'detailed' && reasonCounts.size) {
      const reasons = el('div','activity-reasons');
      for (const [label, count] of reasonCounts) reasons.append(row(label,'Why WARD acted.',el('span','tag',String(count))));
      box.append(reasons);
    }

    const pageActions = el('div','settings-transfer');
    pageActions.append(
      action('Reveal this page',() => {
        for (const item of EXP.Actions.snapshot()) EXP.Actions.reveal(item.id);
        refreshActivity();
      },'primary'),
      action('Reapply protection',() => {
        for (const item of EXP.Actions.snapshot()) EXP.Actions.endReveal(item.id);
        refreshActivity();
      })
    );
    box.append(pageActions);

    if (interventions.length) {
      const current = el('div','current-protections');
      for (const item of interventions.slice(0,8)) {
        const pattern = EXP.Patterns.get(item.patternId);
        current.append(row(
          pattern?.label || 'Protected content',
          `${item.action}${item.confidence ? ` · ${item.confidence}` : ''} · ${reasonLabel(item.reason)}`,
          action(item.revealed ? 'Protect again' : 'Show',() => {
            if (item.revealed) EXP.Actions.endReveal(item.id);
            else EXP.Actions.reveal(item.id);
            refreshActivity();
          })
        ));
      }
      const explain=el('p','','Show temporarily restores the content. Allow here remembers this protection type for this page only.');current.prepend(explain);
      for(const item of interventions.slice(0,8))current.append(action('Allow '+(EXP.Patterns.get(item.patternId)?.label||'content')+' here',()=>{const state=EXP.Settings.snapshot();const path=location.hostname+location.pathname;const pageExceptions=[...(state.pageExceptions||[]).filter(v=>v.path!==path||v.patternId!==item.patternId),{path,patternId:item.patternId}];update({pageExceptions},'page-exception');notify('This protection type is now allowed on this page.');refreshActivity();}));
      box.append(current);
    }
    container.replaceChildren(box);
  }

  function couponStateLabel(coupon) {
    return ({ ready:'Ready', idle:'Ready', checking:'Checking', confirmed:'Confirmed', attention:'Attention', quarantined:'Paused', disabled:'Off' })[coupon.state] || 'Ready';
  }

  function renderCouponStatus(container) {
    if (!container) return;
    const coupon = EXP.Engine.diagnostics().coupon;
    const box = section('Coupon activity');
    box.append(row('Coupon status',coupon.reason.replaceAll('-',' '),el('span',`tag coupon-${coupon.state}`,couponStateLabel(coupon))));
    if (coupon.quarantined) box.append(row('Safety pause','Coupon automation stopped after an unsafe result.',action('Resume coupon clipping',() => { EXP.Engine.resumeCoupons(); refreshActivity(); })));
    container.replaceChildren(box);
  }

  function pageView(settings) {
    const fragment = document.createDocumentFragment();
    const general = section('Protection');

    general.append(
      row('WARD protection','',
        switchControl(settings.enabled,'WARD protection',
          value => update({enabled:value},'enabled')))
    );

    general.append(
      row('Protection level','',
        selectControl(
          settings.protectionLevel,
          'Protection level',
          [['essential','Essential'],['balanced','Balanced'],['custom','Custom']],
          value => update({protectionLevel:value},'level')
        ))
    );
    general.append(row('Content action','Hide or dim matched content; purchase controls remain visible.',
      selectControl(settings.contentAction,'Content action',[['automatic','Automatic'],['hide','Hide'],['dim','Dim']],
        value => update({contentAction:value},'content-action'))));
    general.append(row(`${EXP.Retailer.label()} adapter`,'Selector and safety system status.',adapterHealthControl()));

    const summary = el('div');
    summary.setAttribute('data-exp-activity-summary','1');
    renderActivitySummary(summary);
    fragment.append(general,ExtraPotionsCore.createDisclosure('Page activity',summary));
    return fragment;
  }

  function lookView(settings) {
    const fragment = document.createDocumentFragment();


    const accessibility = section('Accessibility');
    accessibility.append(
      row('Reduce motion','',
        selectControl(
          settings.reducedMotion,
          'Reduce motion',
          [['system','Follow system'],['reduce','Reduce'],['allow','Allow']],
          value => update({reducedMotion:value},'reduced-motion')
        ))
    );
    accessibility.append(
      row('Non-color indicators','',
        switchControl(
          settings.nonColorIndicators,
          'Non-color indicators',
          value => update({nonColorIndicators:value},'non-color')
        ))
    );
    fragment.append(accessibility);

    return fragment;
  }

  function amazonView(settings) {
    const fragment = document.createDocumentFragment();
    const amazon = section(EXP.Retailer.label());
    const features = EXP.Retailer.features();
    const storeKey = EXP.Retailer.key();

    amazon.append(
      row(`Protect ${EXP.Retailer.label()}`,'',
        switchControl(
          settings.retailers?.[storeKey] !== false,
          `Protect ${EXP.Retailer.label()}`,
          value => update({retailers:{...settings.retailers,[storeKey]:value}},'store-setting')
        ))
    );

    if (features.coupons) amazon.append(
      row('Auto-clip coupons','',
        switchControl(
          settings.autoClipCoupons,
          'Auto-clip coupons',
          value => update({autoClipCoupons:value},'coupon-setting')
        ))
    );

    if (features.compactSearch) amazon.append(
      row('Compact search','',
        switchControl(
          settings.compactSearch,
          'Compact search',
          value => update({compactSearch:value},'compact-search')
        ))
    );

    if (features.recommendationCleanup) amazon.append(
      row('Recommendation cleanup','',
        switchControl(
          settings.recommendationCleanup,
          'Recommendation cleanup',
          value => update({recommendationCleanup:value},'recommendation-cleanup')
        ))
    );

    fragment.append(amazon);
    if (features.coupons) {
      const couponStatus = el('div');
      couponStatus.setAttribute('data-exp-coupon-status','1');
      renderCouponStatus(couponStatus);
      fragment.append(couponStatus);
    }
    return fragment;
  }

  function patternsView(settings) {
    const box = section(`${EXP.Retailer.label()} patterns`);
    box.classList.add('advanced-patterns');
    const available = EXP.Retailer.patternIds();
    for (const [,label,id] of sourceToggles) {
      if (!available.has(id)) continue;
      box.append(
        row(label,'',
          selectControl(
            overrideMode(settings.patterns,id),
            label,
            [['inherit','Inherit'],['on','On'],['off','Off']],
            value => updatePatternMode(id,value)
          ))
      );
    }
    return box;
  }

  function customPolicyView(settings) {
    const fragment = document.createDocumentFragment();
    const policy = section('Custom policy');
    policy.append(
      row('Default action','Used when Content action is Automatic and the pattern supports it.',selectControl(settings.defaultAction,'Default action', [['hide','Hide'],['dim','Dim'],['collapse','Collapse'],['annotate','Annotate'],['allow','Allow']], value => update({defaultAction:value},'default-action'))),
      row('Confidence policy','Controls whether supported detections may be acted on.',selectControl(settings.confidencePolicy,'Confidence policy', [['confirmed','Confirmed only'],['confirmed-supported','Confirmed + supported'],['custom','Custom overrides']], value => update({confidencePolicy:value},'confidence-policy'))),
      row('Explanation detail','Controls how much decision context appears in Activity.',selectControl(settings.explanationDetail,'Explanation detail', [['concise','Concise'],['detailed','Detailed']], value => update({explanationDetail:value},'explanation-detail')))
    );
    const categories = section('Category controls');
    for (const [id,label] of categoryControls) categories.append(row(label,'',selectControl(overrideMode(settings.categories,id),label,[['inherit','Inherit'],['on','On'],['off','Off']],value => updateCategoryMode(id,value))));
    fragment.append(policy,categories);
    return fragment;
  }

  function toolsView(settings) {
    const fragment = document.createDocumentFragment();
    fragment.append(amazonView(settings));

    const advanced = ExtraPotionsCore.createDisclosure(`Advanced ${EXP.Retailer.label()}`);
    const controls = section('Pattern controls');
    controls.append(
      row('Individual patterns','',
        action(patternsOpen ? 'Hide' : 'Customize',() => {
          patternsOpen = !patternsOpen;
          renderView();
        }))
    );
    advanced.append(controls);
    if (settings.protectionLevel === 'custom') advanced.append(customPolicyView(settings));
    if (patternsOpen) advanced.append(patternsView(settings));
    fragment.append(advanced);
    return fragment;
  }

  function systemView() {
    const fragment = document.createDocumentFragment();
    const settings = EXP.Settings.snapshot();
    const box = section();
    const preferences = ExtraPotionsCore.createDisclosure('Menu preferences');
    for (const [key,label] of [['menuAutoClose','Auto-close menu'],['updateNotifications','Update notifications']]) {
      preferences.append(row(label,'',switchControl(settings[key],label,value=>{
        update({[key]:value},key);
        if(key==='updateNotifications' && value) EXP.Updates.check(true).then(result=>notify(result.available?'A WARD update is available.':'WARD update check complete.'));
      })));
    }
    box.append(
      EXP.Diagnostics.createDiagnosticsControls(
        () => EXP.Diagnostics.createDiagnosticsReport(
          'WARD',
          {host,settings:EXP.Settings.snapshot(),...EXP.Engine.diagnostics()}
        ),
        notify
      )
    );

    const transfers = el('div','settings-transfer');
    transfers.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:6px 0';

    transfers.append(
      action('Export settings',async () => {
        try {
          await navigator.clipboard.writeText(JSON.stringify(EXP.Settings.exportData(),null,2));
          notify('WARD settings copied.');
        } catch (error) {
          EXP.Core.safeError(Object.assign(error,{code:'EXPORT_COPY'}),'ward.ui');
          notify('Copy failed.');
        }
      })
    );

    transfers.append(
      action('Import settings',() => {
        const raw = prompt('Paste a WARD V3 settings export');
        if (raw === null) return;
        try {
          const prepared = EXP.Settings.prepareImport(JSON.parse(raw));
          EXP.Settings.replace(prepared,'import');
          notify('WARD settings imported.');
          renderView();
        } catch (error) {
          EXP.Core.safeError(error,'ward.import');
          alert('WARD could not import that settings file.');
        }
      })
    );

    const data = ExtraPotionsCore.createDisclosure('Settings',transfers);
    fragment.append(box);
    preferences.append(row('Check for updates now','',action('Check now',() => EXP.Updates.check(true).then(result => notify(result.available ? 'A WARD update is available.' : result.state === 'failed' ? 'Update check failed quietly.' : 'WARD is up to date.')))));
    const tools = ExtraPotionsCore.createSystemGrid(preferences,data);
    const safeMode = switchControl(settings.safeMode,'Safe Mode',value=>update({safeMode:value},'safe-mode'));
    safeMode.title='Pause protection and coupon actions without changing saved preferences.';
    box.append(row('Safe Mode','',safeMode));
    const recovery = ExtraPotionsCore.createDisclosure('Page exceptions');
    for(const exception of EXP.Settings.snapshot().pageExceptions||[])recovery.append(row(exception.path,exception.patternId,action('Remove exception',()=>{update({pageExceptions:EXP.Settings.snapshot().pageExceptions.filter(v=>v.path!==exception.path||v.patternId!==exception.patternId)},'remove-page-exception');renderView();})));

    tools.append(ExtraPotionsCore.createCompatibilityControls());
    data.append(row(`Reset ${EXP.Retailer.label()} settings`,`Resets WARD ${EXP.Retailer.label()} settings and pattern overrides.`,action('Reset',resetAmazon,'warn')));
    if ((EXP.Settings.snapshot().pageExceptions || []).length) tools.append(recovery);
    fragment.append(tools);
    return fragment;
  }

  function resetAmazon() {
    const storeKey = EXP.Retailer.key();
    if (!confirm(`Reset WARD ${EXP.Retailer.label()} settings and pattern overrides?`)) return;
    update(
      {
        retailers:{...EXP.Settings.snapshot().retailers,[storeKey]:true},
        autoClipCoupons:true,
        compactSearch:false,
        recommendationCleanup:true,
        categories:{},
        patterns:{}
      },
      'reset-amazon'
    );
    notify(`${EXP.Retailer.label()} settings reset.`);
  }

  function renderView() {
    if (!nav) return;

    const settings = EXP.Settings.snapshot();
    applyUiTheme('ward');
    host.dataset.expNonColor = settings.nonColorIndicators ? '1' : '0';

    for (const button of nav.querySelectorAll(':scope > .tool-panel > .route')) {
      const active = button.dataset.view === activeView;
      const body = button.parentElement.querySelector('.route-body');

      button.setAttribute('aria-current',active ? 'page' : 'false');
      button.setAttribute('aria-expanded',String(active));
      body.hidden = !active;

      if (!active) continue;

      content = body;

      const renderer = {
        page:() => pageView(settings),
        look:() => lookView(settings),
        tools:() => toolsView(settings),
        system:() => systemView()
      }[activeView];

      if (renderer) ExtraPotionsCore.replaceMenuContent(content,renderer());
    }

    chrome?.update();
  }

  function refreshActivity() {
    if (!shell?.classList.contains('open') || !content) return;
    renderActivitySummary(content.querySelector('[data-exp-activity-summary]'));
    renderCouponStatus(content.querySelector('[data-exp-coupon-status]'));
    const health = content.querySelector('[data-exp-adapter-health]');
    if (health) health.replaceWith(adapterHealthControl());
    chrome?.layout();
  }

  function restack() {
    if (!host || host.parentNode !== document.documentElement || !host.nextSibling) return;
    if (shadow?.activeElement) return;
    document.documentElement.append(host);
  }

  function refresh() {
    if (shell?.classList.contains('open')) renderView();
  }

  function setOpen(value, focus = true) {
    if (value) {
      activeView = '';
      shell.classList.add('open');
      shell.setAttribute('aria-hidden','false');
      launcher.setAttribute('aria-expanded','true');
      renderView();
      if (focus) EXP.Core.focusMenuSurface(shell);
    } else {
      shell.classList.remove('open');
      shell.setAttribute('aria-hidden','true');
      launcher.setAttribute('aria-expanded','false');
      if (focus) launcher.focus();
    }
    chrome?.state(Boolean(value));
  }

  function open() { setOpen(true); }
  function close() { setOpen(false); }

  function standardizeLauncher() {}

  function init() {
    if (window.top !== window.self || host) return;

    host = el('div');
    host.dataset.expOwned = '1';
    host.id = 'exp-ward-root';

    shadow = host.attachShadow({mode:'open'});
    ExtraPotionsCore.injectStyle(shadow,css,{wardUiStyle:'1'});

    launcher = el('button','ward-launcher');
    launcher.append(badge(''));
    launcher.type = 'button';
    launcher.dataset.help = 'Drag To Move · Click To Open WARD';
    launcher.setAttribute('aria-label','Open WARD');
    launcher.setAttribute('aria-haspopup','dialog');
    launcher.setAttribute('aria-expanded','false');
    launcher.addEventListener('click',() => shell.classList.contains('open') ? close() : open());

    shell = el('aside','ward');
    shell.setAttribute('role','dialog');
    shell.setAttribute('aria-modal','true');
    shell.setAttribute('aria-label','WARD menu');
    shell.setAttribute('aria-hidden','true');

    const frame = el('div','ward-shell');
    const header = el('header','ward-header');
    const brand = el('div','brand');
    const mark = el('div','brand-mark');
    mark.append(badge(''));

    const title = el('div');
    const titleRow = el('div');
    titleRow.append(el('strong','','WARD'));

    titleRow.append(
      action(`v${EXP.VERSION}`,() => { if (updateCard?.hidden !== false || updateCard.dataset.noticeKind !== 'current') showUpdateCard({}, false, '', true); else hideUpdateCard(); },'version')
    );

    title.append(titleRow,el('small','','Calmer shopping'));
    brand.append(mark,title);

    const closeButton = el('button','close','×');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label','Close WARD');
    closeButton.addEventListener('click',close);
    header.append(brand,closeButton);

    nav = el('nav','ward-nav');
    nav.setAttribute('aria-label','WARD sections');

    for (const [id,label] of views) {
      const panel = el('section','tool-panel');
      const button = el('button','route',label);
      button.type = 'button';
      button.dataset.view = id;
      button.setAttribute('aria-controls',`exp-ward-view-${id}`);
      button.addEventListener('click',() => {
        activeView = activeView === id ? '' : id;
        renderView();
      });

      const body = el('div','route-body');
      body.id = `exp-ward-view-${id}`;
      body.hidden = true;

      panel.append(button,body);
      nav.append(panel);
    }

    frame.append(
      header,
      el('div','header-divider'),
      nav
    );
    shell.append(frame);

    toast = el('div','toast');
    toast.hidden = true;

    shadow.append(launcher,shell,toast);
    document.documentElement.append(host);

    launcherCleanup = EXP.Core.registerLauncher(host,{productId:'ward'});
    chrome = EXP.MenuChrome.create({
      id:'ward',
      host,
      shadow,
      launcher,
      panel:shell,
      getSettings:() => EXP.Settings.snapshot(),
      setOpen,
      shortcutKey:'w'
    });
    noticeController = ExtraPotionsCore.createProductNotice({
      host,
      shadow,
      panel:shell,
      durationMs:30000,
      releaseUrl:'https://github.com/ExtraPotions/WARD/releases',
      installUrl:'https://raw.githubusercontent.com/ExtraPotions/WARD/main/ward.user.js'
    });
    updateCard = noticeController.element;
    const previous=EXP.Core.consumeVersionChange('ward',EXP.VERSION,'exp:v3:ward:last-version-v2');
    if(previous)showUpdateCard({},true,previous);
    if(EXP.Settings.snapshot().updateNotifications)EXP.Updates.check(false).then(r=>{if(r.available)showUpdateCard(r);});

    escapeHandler = event => {
      if (!shell.classList.contains('open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = [
        ...shell.querySelectorAll(
          'button:not(:disabled),select:not(:disabled),input:not(:disabled),[tabindex]:not([tabindex="-1"])'
        )
      ].filter(node => !node.hidden && node.getClientRects().length);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable.at(-1);
      const active = shadow.activeElement;

      if (active === shell) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    pointerHandler = event => {
      if (!event.isTrusted) return;
      if (!shell.classList.contains('open')) return;
      if (event.composedPath().includes(host)) return;

      const active = shadow.activeElement;
      if (active instanceof HTMLSelectElement) return;
      if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLOptionElement) return;

      close();
    };

    document.addEventListener('keydown',escapeHandler);
    document.addEventListener('pointerdown',pointerHandler,true);
    renderView();
  }

  function cleanup() {
    noticeController?.destroy();
    launcherCleanup?.();
    chrome?.destroy();
    clearTimeout(toastTimer);
    document.removeEventListener('keydown',escapeHandler);
    document.removeEventListener('pointerdown',pointerHandler,true);
    host?.remove();
    host = shadow = launcher = shell = nav = content = toast = chrome = updateCard = noticeController = null;
  }

  return Object.freeze({
    init:() => {
      init();
      standardizeLauncher();
    },
    cleanup,
    open,
    close,
    refresh,
    refreshActivity,
    restack
  });
})();

EXP.VERSION = '3.2.31';
ExtraPotionsCore.registerDiagnosticsProduct('ward', EXP.VERSION);
EXP.App = (() => {
  let scheduler, navigationCleanup, settingsCleanup, lifecycle;
  const ready = () => document.body
    ? Promise.resolve()
    : new Promise(resolve => addEventListener('DOMContentLoaded', resolve, { once:true }));

  async function initialize() {
    EXP.Settings.load();
    await ready();
    scheduler = EXP.Core.createScheduler(
      roots => EXP.Engine.processBatch(roots),
      { source:'ward' }
    );
    navigationCleanup = EXP.Core.onNavigation(() => EXP.Engine.navigation());
    settingsCleanup = EXP.Settings.subscribe(() => EXP.Engine.rebuild());
    try { EXP.UI.init(); } catch (error) { error.code = error.code || 'UI_INIT_FAILED'; throw error; }
  }

  async function enable() {
    const settings = EXP.Settings.snapshot();
    if (!EXP.Retailer.enabled(settings)) {
      scheduler.stop();
      EXP.Engine.stop();
      EXP.UI.refresh();
      return;
    }
    try { EXP.Engine.start(); } catch (error) { error.code = error.code || 'ENGINE_START_FAILED'; throw error; }
    scheduler.start();
    if (settings.updateNotifications) EXP.Updates.check();
    EXP.UI.refresh();
  }

  async function disable() {
    scheduler.stop();
    EXP.Engine.stop();
    EXP.UI.refresh();
  }

  async function cleanup() {
    scheduler?.stop();
    settingsCleanup?.();
    navigationCleanup?.();
    EXP.UI.cleanup();
    EXP.Engine.cleanup();
  }

  function start() {
    lifecycle = EXP.Core.register(
      {
        id:'ward',
        version:EXP.VERSION,
        capabilities:[
          'lifecycle',
          'settings',
          'diagnostics',
          'dom-scheduler',
          'navigation',
          'launcher',
          'ui'
        ]
      },
      { initialize, enable, disable, cleanup }
    );
    lifecycle.initialize()
      .then(() => lifecycle.enable())
      .catch(error => EXP.Core.safeError(error,'ward'));
    return lifecycle;
  }

  return Object.freeze({
    start,
    get lifecycle() { return lifecycle; }
  });
})();
EXP.App.start();
})();
