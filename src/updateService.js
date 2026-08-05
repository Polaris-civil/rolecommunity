import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { APP_ID, APP_VERSION, APP_VERSION_CODE, isUpdateAvailable, normalizeUpdateManifest } from './updateManifest.js';

const SETTINGS_KEY = 'rolecommunity.update.v2';
const LEGACY_SETTINGS_KEY = 'rolecommunity.update.v1';
const DEFAULT_MANIFEST_URL = 'https://github.com/Polaris-civil/rolecommunity/releases/latest/download/update-manifest.json';
const nativeUpdater = registerPlugin('SelfHostedUpdater');

function storage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function defaultManifestUrl() {
  const configured = String(import.meta.env.VITE_UPDATE_MANIFEST_URL || '').trim();
  return configured || DEFAULT_MANIFEST_URL;
}

export function readUpdateSettings() {
  const saved = storage()?.getItem(SETTINGS_KEY) || storage()?.getItem(LEGACY_SETTINGS_KEY);
  if (!saved) return { manifestUrl: defaultManifestUrl(), autoCheck: true, lastCheckedAt: '' };
  try {
    const parsed = JSON.parse(saved);
    const autoCheck = parsed.autoCheck !== false;
    return {
      manifestUrl: defaultManifestUrl(),
      autoCheck,
      lastCheckedAt: String(parsed.lastCheckedAt || ''),
    };
  } catch {
    return { manifestUrl: defaultManifestUrl(), autoCheck: true, lastCheckedAt: '' };
  }
}

export function saveUpdateSettings(values) {
  const next = {
    ...readUpdateSettings(),
    manifestUrl: defaultManifestUrl(),
    autoCheck: values?.autoCheck !== false,
  };
  storage()?.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

function persistCheckTime() {
  const next = { ...readUpdateSettings(), lastCheckedAt: new Date().toISOString() };
  storage()?.setItem(SETTINGS_KEY, JSON.stringify(next));
}

async function requestManifest(url) {
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.request({
      url,
      method: 'GET',
      headers: { Accept: 'application/json' },
      connectTimeout: 4500,
      readTimeout: 6500,
    });
    if (response.status < 200 || response.status >= 300) throw new Error(`更新服务返回 ${response.status}`);
    return response.data;
  }
  const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`更新服务返回 ${response.status}`);
  return response.json();
}

export async function checkForUpdate({ manifestUrl } = {}) {
  const url = String(manifestUrl ?? readUpdateSettings().manifestUrl).trim();
  if (!url) return { status: 'not-configured', appId: APP_ID, version: APP_VERSION, versionCode: APP_VERSION_CODE };
  try {
    const raw = await requestManifest(url);
    const manifest = normalizeUpdateManifest(typeof raw === 'string' ? JSON.parse(raw) : raw, url);
    persistCheckTime();
    return {
      status: isUpdateAvailable(manifest) ? 'available' : 'current',
      appId: APP_ID,
      version: APP_VERSION,
      versionCode: APP_VERSION_CODE,
      manifest,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    persistCheckTime();
    return {
      status: 'offline',
      appId: APP_ID,
      version: APP_VERSION,
      versionCode: APP_VERSION_CODE,
      error: error?.message || '暂时无法连接更新服务',
    };
  }
}

export async function downloadAndInstallUpdate(manifest, { onProgress } = {}) {
  if (!manifest?.apkUrl) throw new Error('更新清单没有可下载的 APK');
  if (Capacitor.isNativePlatform()) {
    const queued = await nativeUpdater.downloadAndInstall({
      url: manifest.apkUrl,
      fileName: `RoleCommunity-${manifest.version}.apk`,
    });
    const downloadId = Number(queued?.downloadId);
    onProgress?.({ status: 'pending', progress: 0, downloadId });
    if (!Number.isFinite(downloadId) || typeof nativeUpdater.getDownloadProgress !== 'function') return queued;
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const poll = async () => {
        if (Date.now() - startedAt > 30 * 60 * 1000) {
          reject(new Error('更新下载超时，请稍后重试'));
          return;
        }
        try {
          const progress = await nativeUpdater.getDownloadProgress({ downloadId });
          onProgress?.({ ...progress, downloadId });
          if (progress?.status === 'complete') {
            resolve({ ...queued, ...progress });
            return;
          }
          if (progress?.status === 'failed') {
            reject(new Error('更新下载失败，请检查网络后重试'));
            return;
          }
          globalThis.setTimeout(poll, 400);
        } catch (error) {
          reject(error);
        }
      };
      globalThis.setTimeout(poll, 200);
    });
  }
  onProgress?.({ status: 'complete', progress: 100 });
  globalThis.open(manifest.apkUrl, '_blank', 'noopener,noreferrer');
  return { opened: true };
}

export { APP_ID, APP_VERSION, APP_VERSION_CODE };
