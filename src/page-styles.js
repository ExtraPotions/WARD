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
