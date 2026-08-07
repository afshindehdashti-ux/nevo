export function shouldShowLogoTelemetryOverlay({
  isDev,
  debugEnabled,
  available,
}: {
  isDev: boolean;
  debugEnabled: boolean;
  available: boolean;
}): boolean {
  return isDev && debugEnabled && available;
}
