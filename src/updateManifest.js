export const APP_ID = 'com.rolecommunity.app';
export const APP_VERSION = '0.1.5';
export const APP_VERSION_CODE = 6;

export function compareVersionCodes(currentCode, latestCode) {
  const current = Number.isFinite(Number(currentCode)) ? Number(currentCode) : 0;
  const latest = Number.isFinite(Number(latestCode)) ? Number(latestCode) : 0;
  return latest - current;
}

export function isUpdateAvailable(manifest, currentCode = APP_VERSION_CODE) {
  return Boolean(manifest?.apkUrl) && compareVersionCodes(currentCode, manifest.versionCode) > 0;
}

export function normalizeUpdateManifest(raw, sourceUrl = '') {
  if (!raw || typeof raw !== 'object') throw new Error('更新清单不是有效 JSON');
  if (raw.appId && raw.appId !== APP_ID) throw new Error('更新清单不属于 RoleCommunity');
  const versionCode = Number(raw.versionCode);
  const version = String(raw.version || '').trim();
  const apkUrl = String(raw.apkUrl || '').trim();
  if (!version || !Number.isInteger(versionCode) || versionCode < 1) {
    throw new Error('更新清单缺少有效版本号');
  }
  let resolvedApkUrl = '';
  if (apkUrl) {
    try {
      resolvedApkUrl = new URL(apkUrl, sourceUrl || undefined).toString();
    } catch {
      throw new Error('APK 地址格式不正确');
    }
  }
  return {
    appId: APP_ID,
    version,
    versionCode,
    apkUrl: resolvedApkUrl,
    notes: String(raw.notes || raw.releaseNotes || '').trim(),
    publishedAt: String(raw.publishedAt || '').trim(),
    sha256: String(raw.sha256 || '').trim().toLowerCase(),
    sizeBytes: Number.isFinite(Number(raw.sizeBytes)) ? Number(raw.sizeBytes) : 0,
  };
}
