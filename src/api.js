import { Capacitor } from '@capacitor/core';
import { mobileApi } from './mobileApi.js';

export const isMobileApp = Capacitor.isNativePlatform();

async function request(path, options = {}) {
  const apiBase = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${apiBase}${path}`, {
    cache: 'no-store',
    ...options,
    headers: {
      'Cache-Control': 'no-cache',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `请求失败 (${response.status})`);
  }
  if (response.status === 204) return null;
  return response.json();
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const serverApi = {
  bootstrap: () => request('/api/bootstrap'),
  llmConfig: () => request('/api/llm-config'),
  updateLlmConfig: (body) => request('/api/llm-config', json('PATCH', body)),
  post: (id) => request(`/api/posts/${id}`),
  like: (id, active) => request(`/api/posts/${id}/like`, json('POST', { active })),
  comment: (id, body) => request(`/api/posts/${id}/comments`, json('POST', body)),
  generate: (body) => request('/api/posts/generate', json('POST', body)),
  importKnowledge: (formData) => request('/api/knowledge/import', { method: 'POST', body: formData }),
  createKnowledge: (body) => request('/api/knowledge', json('POST', body)),
  updateKnowledge: (id, body) => request(`/api/knowledge/${id}`, json('PATCH', body)),
  deleteKnowledge: (id) => request(`/api/knowledge/${id}`, { method: 'DELETE' }),
  createRole: (body) => request('/api/roles', json('POST', body)),
  updateRole: (id, body) => request(`/api/roles/${id}`, json('PATCH', body)),
  deleteRole: (id) => request(`/api/roles/${id}`, { method: 'DELETE' }),
  updateSettings: (body) => request('/api/settings', json('PATCH', body)),
  runAutomation: (body = {}) => request('/api/automation/run', json('POST', body)),
};

export const api = isMobileApp ? mobileApi : serverApi;
