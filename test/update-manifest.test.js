import assert from 'node:assert/strict';
import test from 'node:test';
import { APP_ID, APP_VERSION_CODE, compareVersionCodes, isUpdateAvailable, normalizeUpdateManifest } from '../src/updateManifest.js';

test('self-hosted update manifests resolve relative APK URLs and compare version codes', () => {
  const manifest = normalizeUpdateManifest({ appId: APP_ID, version: '0.1.4', versionCode: 5, apkUrl: './RoleCommunity-0.1.4.apk', notes: '离线数据保留' }, 'https://updates.example.com/rolecommunity/update-manifest.json');
  assert.equal(manifest.apkUrl, 'https://updates.example.com/rolecommunity/RoleCommunity-0.1.4.apk');
  assert.equal(isUpdateAvailable(manifest), true);
  assert.equal(compareVersionCodes(APP_VERSION_CODE, manifest.versionCode), 1);
  assert.equal(normalizeUpdateManifest({ appId: APP_ID, version: '0.1.0', versionCode: 1 }, 'https://updates.example.com/update-manifest.json').apkUrl, '');
});

test('update manifests reject another application or invalid version code', () => {
  assert.throws(() => normalizeUpdateManifest({ appId: 'other.app', version: '1.0.0', versionCode: 1, apkUrl: 'https://example.com/a.apk' }));
  assert.throws(() => normalizeUpdateManifest({ appId: APP_ID, version: '1.0.0', versionCode: 0, apkUrl: 'https://example.com/a.apk' }));
});
