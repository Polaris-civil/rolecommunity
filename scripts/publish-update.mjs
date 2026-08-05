import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const gradleText = await readFile(path.join(root, 'android/app/build.gradle'), 'utf8');
const declaredVersionCode = Number(gradleText.match(/\bversionCode\s+(\d+)/)?.[1] || 0);
const runtimeManifestText = await readFile(path.join(root, 'src/updateManifest.js'), 'utf8');
const declaredVersion = runtimeManifestText.match(/APP_VERSION\s*=\s*'([^']+)'/)?.[1] || '';
const declaredRuntimeVersionCode = Number(runtimeManifestText.match(/APP_VERSION_CODE\s*=\s*(\d+)/)?.[1] || 0);
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || ''];
}));
const outputDir = path.resolve(root, args.get('dir') || 'update-server');
const apkPath = path.resolve(root, args.get('apk') || 'android/app/build/outputs/apk/debug/app-debug.apk');
const publicUrl = String(args.get('url') || '').replace(/\/$/, '');
const notes = args.get('notes') || 'RoleCommunity 更新';
const versionCode = Number(args.get('versionCode') || declaredVersionCode || 1);

if (!Number.isInteger(versionCode) || versionCode < 1) throw new Error('--versionCode 必须是正整数');
if (declaredVersionCode && versionCode !== declaredVersionCode) {
  throw new Error(`--versionCode=${versionCode} 必须与 android/app/build.gradle 的 versionCode=${declaredVersionCode} 一致`);
}
if (declaredVersion && packageJson.version !== declaredVersion) {
  throw new Error(`package.json version=${packageJson.version} 必须与 src/updateManifest.js 的 APP_VERSION=${declaredVersion} 一致`);
}
if (declaredRuntimeVersionCode && declaredVersionCode && declaredRuntimeVersionCode !== declaredVersionCode) {
  throw new Error(`src/updateManifest.js 的 APP_VERSION_CODE=${declaredRuntimeVersionCode} 必须与 Gradle versionCode=${declaredVersionCode} 一致`);
}
const apkInfo = await stat(apkPath);
const apkName = `RoleCommunity-${packageJson.version}-${versionCode}.apk`;
const apkTarget = path.join(outputDir, apkName);
await mkdir(outputDir, { recursive: true });
await copyFile(apkPath, apkTarget);
const hash = crypto.createHash('sha256');
hash.update(await readFile(apkTarget));
const apkUrl = publicUrl ? `${publicUrl}/${apkName}` : apkName;
const manifest = {
  appId: 'com.rolecommunity.app',
  version: packageJson.version,
  versionCode,
  apkUrl,
  notes,
  publishedAt: new Date().toISOString(),
  sha256: hash.digest('hex'),
  sizeBytes: apkInfo.size,
};
await writeFile(path.join(outputDir, 'update-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Published ${apkName}`);
console.log(`Manifest: ${path.join(outputDir, 'update-manifest.json')}`);
console.log(`APK SHA-256: ${manifest.sha256}`);
