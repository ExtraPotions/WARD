EXP.VERSION = '3.2.8';
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
    if (!settings.enabled || !settings.amazonEnabled) {
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
