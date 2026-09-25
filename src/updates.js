EXP.Updates = ExtraPotionsCore.createReleaseUpdateChecker({
  productId: 'ward',
  repository: 'ExtraPotions/WARD',
  endpoint: 'https://api.github.com/repos/ExtraPotions/WARD/releases/latest',
  currentVersion: EXP.VERSION,
  enabled: () => EXP.Settings.snapshot().updateNotifications,
  onError: error => EXP.Core.safeError(Object.assign(error, { code: 'UPDATE_CHECK' }), 'ward.updates'),
});
