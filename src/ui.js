EXP.UI = (() => {
  const ICON_URL = 'https://raw.githubusercontent.com/ExtraPotions/WARD/main/assets/ward-launcher.svg';
  const BADGE = ICON_URL;
  const LAUNCHER = ICON_URL;

  const UI_THEMES = ExtraPotionsCore.themes({"id":"ward","name":"WARD gem","swatch":"linear-gradient(135deg,#120b05 0 38%,#b66a16 38% 69%,#356f78 69% 100%)","canvas":"#120b05","surface":"#241409","primary":"#b66a16","companion":"#9d3131","counterpoint":"#356f78","interactive":"#d1842a","bg":"#120b05","panel":"#241409","line":"#53321f","text":"#f1dfc9","muted":"#b79e84","accent":"#b66a16","accent2":"#d1842a","skin":"linear-gradient(135deg,#b66a16 0%,#9d3131 52%,#356f78 100%)","skinVertical":"linear-gradient(180deg,#b66a16 0%,#9d3131 52%,#356f78 100%)"});

  let host, shadow, launcher, shell, nav, content, toast, chrome, updateCard;
  let toastTimer, updateTimer, launcherCleanup, escapeHandler, pointerHandler;
  let activeView = '';
  let patternsOpen = false;

  const views = [
    ['page', 'Protection'],
    ['look', 'Appearance'],
    ['tools', 'Amazon'],
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
    ['ai', 'Amazon AI shopping prompts', 'pressure.shopping-assistant']
  ];

  const categoryControls = [
    ['upsell', 'Upsells'],
    ['urgency', 'Urgency'],
    ['scarcity', 'Scarcity'],
    ['subscription', 'Subscriptions'],
    ['sponsored', 'Sponsored placements'],
    ['cross-sell', 'Cross-sell recommendations'],
    ['shopping-assistant', 'Shopping assistants']
  ];

  const css = `
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
    clearTimeout(updateTimer);
    updateTimer = null;
    if (updateCard) updateCard.hidden = true;
    chrome?.layout();
  }

  function showUpdateCard(result = {}, complete = false, previous = '', current = false) {
    if (!updateCard) return;
    const version = complete || current ? EXP.VERSION : result.latest;
    if (!complete && !current && !EXP.Core.claimNotice('ward', `available:${version}`)) return;

    updateCard.className = 'update-notice ward-update-changelog';
    updateCard.innerHTML = '<button type="button" class="update-dismiss" aria-label="Dismiss Update Notice">×</button><div class="update-head"><div class="update-heading"><div class="update-kicker"></div><div class="update-title"></div></div><div class="update-version"></div></div><div class="update-text"></div><ul class="update-list"></ul><div class="update-footer"><a class="update-release" href="https://github.com/ExtraPotions/WARD/releases" target="_blank" rel="noopener noreferrer">GitHub Release</a><a class="update-action" href="https://raw.githubusercontent.com/ExtraPotions/WARD/main/ward.user.js" target="_blank" rel="noopener noreferrer">Install Update</a></div>';
    updateCard.querySelector('.update-dismiss').addEventListener('click', hideUpdateCard);

    updateCard.querySelector('.update-kicker').textContent = current ? 'Current Version' : complete ? 'Update Complete' : 'Update Available';
    updateCard.querySelector('.update-title').textContent = current ? 'WARD Changelog' : complete ? 'WARD Updated' : 'New WARD Version Available';
    updateCard.querySelector('.update-version').textContent = 'v' + version;
    updateCard.querySelector('.update-text').textContent = current
      ? `What's new in v${EXP.VERSION}.`
      : complete
        ? `Updated from v${previous} to v${EXP.VERSION}.`
        : `v${result.latest} is ready to install.`;

    const fallback = ['A newer WARD build is available.', 'Install the latest userscript for the newest fixes and improvements.'];
    const details = (current || complete
      ? EXP.ReleaseNotes.current()
      : Array.isArray(result.details) && result.details.length ? result.details : fallback).slice(0, 4);
    const list = updateCard.querySelector('.update-list');
    for (const detail of details) {
      const li = document.createElement('li');
      li.textContent = detail;
      list.append(li);
    }
    list.hidden = !details.length;
    updateCard.querySelector('.update-action').hidden = complete || current;
    updateCard.dataset.noticeKind = current ? 'current' : complete ? 'complete' : 'available';
    updateCard.dataset.placement = 'menu';
    updateCard.hidden = false;
    chrome?.layout();
    clearTimeout(updateTimer);
    updateTimer = setTimeout(hideUpdateCard, 30000);
  }

  function badge(alt = '') {
    const image = el('img');
    image.src = BADGE;
    image.alt = alt;
    return image;
  }

  function section(title) {
    const box = el('section','section');
    box.append(el('h3','',title));
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
    if (!toast || !EXP.Settings.snapshot().menuNotifications) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.style.top = `${Math.max(8,(launcher?.getBoundingClientRect().top || 60) - 48)}px`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toast) toast.hidden = true;
    }, 3000);
  }

  function applyUiTheme(id) { ExtraPotionsCore.applyTheme(host, id, UI_THEMES); }

  function themeSwatches(value) {
    const line = el('div','theme-row');
    line.append(el('strong','','Menu theme'));
    const dots = el('div','exp-theme-swatches');
    const options = {
      container:dots,
      themes:UI_THEMES,
      value,
      onChange:(uiTheme) => {
        applyUiTheme(uiTheme);
        update({uiTheme},'ui-theme');
      }
    };
    if (ExtraPotionsCore?.createThemeSwatches) {
      ExtraPotionsCore.createThemeSwatches(options);
    } else {
      for (const theme of UI_THEMES) {
        const dot = el('button',`exp-theme-swatch${theme.id === value ? ' is-on' : ''}`);
        dot.type = 'button';
        dot.title = theme.name;
        dot.setAttribute('aria-label',theme.name);
        dot.setAttribute('aria-pressed',String(theme.id === value));
        dot.style.background = theme.swatch;
        dot.addEventListener('click',() => options.onChange(theme.id));
        dots.append(dot);
      }
    }
    line.append(dots);
    return line;
  }

  function update(patch, reason) {
    const next = EXP.Settings.update(patch, reason);
    applyUiTheme(next.uiTheme);
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
    const interventions = EXP.Actions.snapshot().filter((item) => item.connected);
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
          `${item.action}${item.confidence ? ` · ${item.confidence}` : ''}`,
          action(item.revealed ? 'Protect again' : 'Show',() => {
            if (item.revealed) EXP.Actions.endReveal(item.id);
            else EXP.Actions.reveal(item.id);
            refreshActivity();
          })
        ));
      }
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
    general.append(row('Content action','Applies to all protected content. Hide falls back to Dim where needed; purchasing information stays visible.',
      selectControl(settings.contentAction,'Content action',[['automatic','Automatic'],['hide','Hide'],['dim','Dim']],
        value => update({contentAction:value},'content-action'))));
    general.append(row('Amazon adapter','Selector and safety system status.',adapterHealthControl()));

    const summary = el('div');
    summary.setAttribute('data-exp-activity-summary','1');
    renderActivitySummary(summary);
    fragment.append(general,summary);
    return fragment;
  }

  function lookView(settings) {
    const fragment = document.createDocumentFragment();

    const theme = section('Theme');
    theme.append(themeSwatches(settings.uiTheme));
    fragment.append(theme);

    const accessibility = section('Accessibility');
    accessibility.append(
      row('Reduced motion','',
        selectControl(
          settings.reducedMotion,
          'Reduced motion',
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
    const amazon = section('Amazon');

    amazon.append(
      row('Auto-clip coupons','',
        switchControl(
          settings.autoClipCoupons,
          'Auto-clip coupons',
          value => update({autoClipCoupons:value},'coupon-setting')
        ))
    );

    amazon.append(
      row('Compact search','',
        switchControl(
          settings.compactSearch,
          'Compact search',
          value => update({compactSearch:value},'compact-search')
        ))
    );

    amazon.append(
      row('Recommendation cleanup','',
        switchControl(
          settings.recommendationCleanup,
          'Recommendation cleanup',
          value => update({recommendationCleanup:value},'recommendation-cleanup')
        ))
    );

    const couponStatus = el('div');
    couponStatus.setAttribute('data-exp-coupon-status','1');
    renderCouponStatus(couponStatus);
    fragment.append(amazon,couponStatus);
    return fragment;
  }

  function patternsView(settings) {
    const box = section('Amazon patterns');
    box.classList.add('advanced-patterns');
    for (const [,label,id] of sourceToggles) {
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

    const controls = section('Pattern controls');
    controls.append(
      row('Individual patterns','',
        action(patternsOpen ? 'Hide' : 'Customize',() => {
          patternsOpen = !patternsOpen;
          renderView();
        }))
    );
    fragment.append(controls);

    if (settings.protectionLevel === 'custom') fragment.append(customPolicyView(settings));
    if (patternsOpen) fragment.append(patternsView(settings));
    return fragment;
  }

  function systemView() {
    const fragment = document.createDocumentFragment();
    const box = section('Diagnostics');

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

    box.append(transfers);
    fragment.append(box);
    const recovery = section('Recovery');
    recovery.append(row('Reset Amazon settings','Resets WARD Amazon settings and pattern overrides.',action('Reset',resetAmazon,'warn')));
    fragment.append(recovery);
    return fragment;
  }

  function resetAmazon() {
    if (!confirm('Reset WARD Amazon settings and pattern overrides?')) return;
    update(
      {
        amazonEnabled:true,
        autoClipCoupons:true,
        compactSearch:false,
        recommendationCleanup:true,
        categories:{},
        patterns:{}
      },
      'reset-amazon'
    );
    notify('Amazon settings reset.');
  }

  function renderView() {
    if (!nav) return;

    const settings = EXP.Settings.snapshot();
    applyUiTheme(settings.uiTheme);
    host.dataset.expNonColor = settings.nonColorIndicators ? '1' : '0';
    host.dataset.menuWidth = settings.menuWidth;

    for (const button of nav.querySelectorAll(':scope > .tool-panel > .route')) {
      const active = button.dataset.view === activeView;
      const body = button.parentElement.querySelector('.route-body');

      button.setAttribute('aria-current',active ? 'page' : 'false');
      button.setAttribute('aria-expanded',String(active));
      body.hidden = !active;

      if (!active) continue;

      content = body;
      content.replaceChildren();

      const renderer = {
        page:() => pageView(settings),
        look:() => lookView(settings),
        tools:() => toolsView(settings),
        system:() => systemView()
      }[activeView];

      if (renderer) content.append(renderer());
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

    title.append(titleRow,el('small','','Amazon pressure and coupon controls'));
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

    updateCard=el('div','update-notice ward-update-changelog');updateCard.hidden=true;
    toast = el('div','toast');
    toast.hidden = true;

    shadow.append(launcher,shell,updateCard,toast);
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
    launcherCleanup?.();
    chrome?.destroy();
    clearTimeout(toastTimer);
    document.removeEventListener('keydown',escapeHandler);
    document.removeEventListener('pointerdown',pointerHandler,true);
    host?.remove();
    host = shadow = launcher = shell = nav = content = toast = chrome = null;
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
