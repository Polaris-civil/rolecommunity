import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(rootDir, '.env.local');

function parseEnv(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function envValue(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/"/g, '\\"');
}

function maskKey(value) {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 3)}••••••••${value.slice(-4)}`;
}

export async function loadRuntimeConfig() {
  try {
    const contents = await readFile(envFile, 'utf8');
    const values = parseEnv(contents);
    for (const key of ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_MODEL']) {
      if (values[key] !== undefined) process.env[key] = values[key];
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export function publicRuntimeConfig() {
  return {
    configured: Boolean(process.env.OPENAI_API_KEY),
    maskedKey: maskKey(process.env.OPENAI_API_KEY),
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
    model: process.env.OPENAI_MODEL || 'deepseek-v4-flash',
    source: process.env.OPENAI_API_KEY ? '.env.local / process environment' : '演示生成器',
  };
}

export async function saveRuntimeConfig({ apiKey, clearKey = false, baseUrl, model }) {
  const nextKey = clearKey ? '' : (apiKey?.trim() || process.env.OPENAI_API_KEY || '');
  const nextBaseUrl = (baseUrl?.trim() || process.env.OPENAI_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  const nextModel = model?.trim() || process.env.OPENAI_MODEL || 'deepseek-v4-flash';

  let parsedUrl;
  try {
    parsedUrl = new URL(nextBaseUrl);
  } catch {
    throw Object.assign(new Error('Base URL 不是有效地址'), { status: 400 });
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw Object.assign(new Error('Base URL 仅支持 HTTP 或 HTTPS'), { status: 400 });
  }
  if (!nextModel || nextModel.length > 120) {
    throw Object.assign(new Error('模型名称不能为空且不能超过 120 个字符'), { status: 400 });
  }
  if (nextKey.length > 500) {
    throw Object.assign(new Error('API Key 格式过长'), { status: 400 });
  }

  const contents = [
    '# RoleCommunity local model configuration',
    `OPENAI_API_KEY="${envValue(nextKey)}"`,
    `OPENAI_BASE_URL="${envValue(nextBaseUrl)}"`,
    `OPENAI_MODEL="${envValue(nextModel)}"`,
    '',
  ].join('\n');
  await writeFile(envFile, contents, { mode: 0o600 });
  process.env.OPENAI_API_KEY = nextKey;
  process.env.OPENAI_BASE_URL = nextBaseUrl;
  process.env.OPENAI_MODEL = nextModel;
  return publicRuntimeConfig();
}
