/* Diagnostics reports and controls use the Core-owned shared implementation. */
EXP.Diagnostics = Object.freeze({
  createDiagnosticsReport: (product, details) => ExtraPotionsCore.createDiagnosticsReport(product, details),
  downloadDiagnostics: report => ExtraPotionsCore.downloadDiagnostics(report),
  createDiagnosticsControls: (getReport, notify) => ExtraPotionsCore.createDiagnosticsControls(getReport, notify)
});
