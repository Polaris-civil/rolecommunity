export const DEFAULT_KNOWLEDGE_BASE = {
  id: 'kb-cv',
  name: '面试修炼场',
  description: '计算机视觉算法工程师学习路线与面经讨论。',
  color: '#168d7c',
};

const normalizeName = (value) => String(value || '').trim().replace(/\.(md|markdown|txt|pdf)$/i, '').trim();

export function knowledgeBaseIdForName(name) {
  const normalized = normalizeName(name).toLowerCase();
  const slug = normalized
    .replace(/[^\u4e00-\u9fff\w]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);
  return `kb-${slug || 'untitled'}`;
}

function looksLikeComputerVision(entry = {}) {
  const text = `${entry.id || ''} ${entry.source || ''} ${entry.group || ''} ${entry.category || ''}`;
  return entry.id?.startsWith('builtin-ai-')
    || /计算机视觉|AI算法岗|算法岗面经|CV 入门|视觉|面试修炼场/i.test(text);
}

function inferredBase(entry = {}) {
  if (looksLikeComputerVision(entry)) return DEFAULT_KNOWLEDGE_BASE;
  const name = normalizeName(entry.source) || '未命名知识库';
  return {
    id: knowledgeBaseIdForName(name),
    name,
    description: `${name} 的独立知识社区。`,
    color: '#4777c6',
  };
}

export function ensureKnowledgeBases(store) {
  const existing = Array.isArray(store.knowledgeBases) ? store.knowledgeBases : [];
  const byId = new Map(existing.filter((item) => item?.id).map((item) => [item.id, item]));
  if (!byId.has(DEFAULT_KNOWLEDGE_BASE.id)) byId.set(DEFAULT_KNOWLEDGE_BASE.id, { ...DEFAULT_KNOWLEDGE_BASE });

  for (const entry of store.knowledge || []) {
    const fallback = inferredBase(entry);
    const id = entry.knowledgeBaseId || fallback.id;
    const base = byId.get(id) || { ...fallback, id };
    byId.set(id, base);
    entry.knowledgeBaseId = id;
    entry.knowledgeBaseName = entry.knowledgeBaseName || base.name;
  }

  const baseByKnowledgeId = new Map((store.knowledge || []).map((entry) => [entry.id, entry.knowledgeBaseId]));
  for (const post of store.posts || []) {
    const baseId = post.knowledgeBaseId || baseByKnowledgeId.get(post.knowledgeId) || DEFAULT_KNOWLEDGE_BASE.id;
    post.knowledgeBaseId = baseId;
  }

  const bases = [...byId.values()];
  store.knowledgeBases = bases;
  store.settings ||= {};
  if (!bases.some((base) => base.id === store.settings.activeKnowledgeBaseId)) {
    store.settings.activeKnowledgeBaseId = bases[0]?.id || DEFAULT_KNOWLEDGE_BASE.id;
  }
  return store;
}

export function addKnowledgeBase(store, { id, name, description, color } = {}) {
  const normalizedName = normalizeName(name) || '未命名知识库';
  const nextId = String(id || '').trim() || knowledgeBaseIdForName(normalizedName);
  const existing = (store.knowledgeBases || []).find((base) => base.id === nextId || base.name === normalizedName);
  if (existing) return existing;
  const base = {
    id: nextId,
    name: normalizedName,
    description: String(description || `${normalizedName} 的独立知识社区。`).trim(),
    color: color || '#4777c6',
    createdAt: new Date().toISOString(),
  };
  store.knowledgeBases = [...(store.knowledgeBases || []), base];
  return base;
}

export function knowledgeBaseForEntry(store, entry) {
  ensureKnowledgeBases(store);
  return store.knowledgeBases.find((base) => base.id === entry?.knowledgeBaseId) || store.knowledgeBases[0] || DEFAULT_KNOWLEDGE_BASE;
}

export function scopedKnowledgeBase(store, knowledgeBaseId) {
  ensureKnowledgeBases(store);
  const id = String(knowledgeBaseId || store.settings.activeKnowledgeBaseId || DEFAULT_KNOWLEDGE_BASE.id);
  const base = store.knowledgeBases.find((item) => item.id === id) || store.knowledgeBases[0] || DEFAULT_KNOWLEDGE_BASE;
  return {
    base,
    knowledge: (store.knowledge || []).filter((entry) => entry.knowledgeBaseId === base.id),
    posts: (store.posts || []).filter((post) => post.knowledgeBaseId === base.id),
  };
}
