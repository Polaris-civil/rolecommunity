import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { createSeedData } from '../server/seed.js';
import { createBuiltinKnowledge } from './builtinKnowledge.js';
import { AVATAR_LIBRARY_VERSION, profileForSeed, randomProfile } from './avatarLibrary.js';
import {
  ensureCatchyTitle,
  generateFallbackKnowledgeAnswer,
  generateFallbackQuestion,
  generateFallbackReply,
  mockGeneratePost,
} from './humanGenerator.js';
import { extractKnowledgeLocal, extractPdfText } from './localContent.js';
import { chooseReplyRole, isQuestionComment } from './replyRouting.js';
import {
  buildKnowledgeAnswerSystemPrompt,
  buildKnowledgeAnswerUserPrompt,
  buildPostSystemPrompt,
  buildPostUserPrompt,
  buildReplySystemPrompt,
  buildReplyUserPrompt,
  createVariationBrief,
} from './promptTemplates.js';

const STORE_KEY = 'rolecommunity.mobile.store.v2';
const LEGACY_STORE_KEY = 'rolecommunity.mobile.store.v1';
const LLM_KEY = 'rolecommunity.mobile.llm.v1';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-v4-flash';
const legacyTitlePattern = /项目相关知识点|基础知识点|通用知识点|面经汇总|知识点总结|学习笔记/;
const postTypeKey = (value) => ({ 教程帖: 'tutorial', 面试帖: 'interview', 问题帖: 'question' }[value] || 'discussion');
export const isMobileApp = Capacitor.isNativePlatform();

const clone = (value) => JSON.parse(JSON.stringify(value));
const makeId = (prefix) => {
  const value = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value}`;
};

function storage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function readStore() {
  const saved = storage()?.getItem(STORE_KEY);
  const legacySaved = saved ? null : storage()?.getItem(LEGACY_STORE_KEY);
  if (!saved && !legacySaved) {
    const seeded = refreshLegacyPostTitles(ensureProfiles(seedWithBuiltinKnowledge()));
    storage()?.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(saved || legacySaved);
    if (Array.isArray(parsed.roles) && Array.isArray(parsed.knowledge) && Array.isArray(parsed.posts)) {
      const next = refreshLegacyPostTitles(ensureProfiles(addStarterRoles(addBuiltinKnowledge(parsed))));
      storage()?.setItem(STORE_KEY, JSON.stringify(next));
      return next;
    }
  } catch {
    // Reset a corrupted local store below.
  }
  const seeded = refreshLegacyPostTitles(ensureProfiles(seedWithBuiltinKnowledge()));
  storage()?.setItem(STORE_KEY, JSON.stringify(seeded));
  return seeded;
}

function addBuiltinKnowledge(store) {
  const builtins = createBuiltinKnowledge();
  const existingBuiltins = store.knowledge.filter((item) => item.id.startsWith('builtin-ai-'));
  const nonBuiltinKnowledge = store.knowledge.filter((item) => !item.id.startsWith('builtin-ai-'));
  const knowledgeKey = (item) => `${item.source || ''}\n${String(item.content || '').replace(/\s+/g, '')}`;
  const previousByContent = new Map(existingBuiltins.map((item) => [knowledgeKey(item), item]));
  const mergedBuiltins = builtins.map((item) => {
    const previous = previousByContent.get(knowledgeKey(item));
    return previous
      ? { ...item, id: previous.id, status: previous.status, publishedAt: previous.publishedAt, createdAt: previous.createdAt || item.createdAt }
      : item;
  });
  return { ...store, knowledge: [...mergedBuiltins, ...nonBuiltinKnowledge] };
}

function addStarterRoles(store) {
  const beginnerRole = createSeedData().roles.find((role) => role.id === 'role-beginner');
  if (!beginnerRole || store.roles.some((role) => role.id === beginnerRole.id)) return store;
  return { ...store, roles: [...store.roles, beginnerRole] };
}

function refreshLegacyPostTitles(store) {
  return {
    ...store,
    posts: store.posts.map((post) => {
      if (post.generationSource !== 'demo' || !legacyTitlePattern.test(post.title)) return post;
      const knowledge = store.knowledge.find((item) => item.id === post.knowledgeId);
      const role = store.roles.find((item) => item.id === post.authorId);
      if (!knowledge) return post;
      const title = ensureCatchyTitle({ generated: post, knowledge, role, type: postTypeKey(post.postType), variationSeed: post.id });
      return title === post.title ? post : { ...post, title };
    }),
  };
}

function seedWithBuiltinKnowledge() {
  return addStarterRoles(addBuiltinKnowledge(createSeedData()));
}

function writeStore(store) {
  try {
    storage()?.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    throw new Error('手机存储空间不足，无法保存社区数据');
  }
  return store;
}

function readLlmConfig() {
  const saved = storage()?.getItem(LLM_KEY);
  if (!saved) return { apiKey: '', baseUrl: DEEPSEEK_BASE_URL, model: DEFAULT_MODEL };
  try {
    const parsed = JSON.parse(saved);
    return {
      apiKey: String(parsed.apiKey || ''),
      baseUrl: String(parsed.baseUrl || DEEPSEEK_BASE_URL).replace(/\/$/, ''),
      model: String(parsed.model || DEFAULT_MODEL),
    };
  } catch {
    return { apiKey: '', baseUrl: DEEPSEEK_BASE_URL, model: DEFAULT_MODEL };
  }
}

function writeLlmConfig(config) {
  try {
    storage()?.setItem(LLM_KEY, JSON.stringify(config));
  } catch {
    throw new Error('手机存储空间不足，无法保存模型设置');
  }
}

function maskKey(value) {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 3)}••••••••${value.slice(-4)}`;
}

function publicLlmConfig() {
  const config = readLlmConfig();
  return {
    configured: Boolean(config.apiKey),
    maskedKey: maskKey(config.apiKey),
    baseUrl: config.baseUrl,
    model: config.model,
    source: config.apiKey ? '手机本地存储' : '手机演示生成器',
    storage: 'device',
  };
}

function roleFor(store, post) {
  return store.roles.find((role) => role.id === post.authorId);
}

function withProfile(role, profile) {
  const { id: profileId, ...visualProfile } = profile || {};
  return role ? { ...role, ...visualProfile, profileId } : { ...visualProfile, profileId };
}

function ensureProfiles(store) {
  return {
    ...store,
    posts: store.posts.map((post) => ({
      ...post,
      authorProfile: post.authorProfile?.profileVersion === AVATAR_LIBRARY_VERSION
        ? post.authorProfile
        : profileForSeed(post.id),
      comments: post.comments.map((comment) => (
        comment.authorId && comment.authorProfile?.profileVersion !== AVATAR_LIBRARY_VERSION
          ? { ...comment, authorProfile: profileForSeed(`${post.id}:${comment.id}`) }
          : comment
      )),
    })),
  };
}

function decoratePost(store, post) {
  return { ...post, author: withProfile(roleFor(store, post), post.authorProfile || profileForSeed(post.id)) };
}

function summarize(store) {
  const pending = store.knowledge.filter((item) => item.status === 'pending').length;
  const comments = store.posts.reduce((total, post) => total + post.comments.length, 0);
  const views = store.posts.reduce((total, post) => total + post.views, 0);
  return { posts: store.posts.length, knowledge: store.knowledge.length, pending, roles: store.roles.length, comments, views };
}

function parseJsonObject(value) {
  const match = String(value || '').match(/\{[\s\S]*\}/);
  if (!match) throw new Error('模型未返回 JSON 对象');
  return JSON.parse(match[0]);
}

async function callModel(messages, { json = false, temperature = 0.86 } = {}) {
  const config = readLlmConfig();
  if (!config.apiKey) return '';
  const body = {
    model: config.model,
    temperature,
    messages,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  };
  const headers = { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' };
  let status;
  let payload;
  if (isMobileApp) {
    const response = await CapacitorHttp.request({
      url: `${config.baseUrl}/chat/completions`,
      method: 'POST',
      headers,
      data: body,
      responseType: 'json',
      connectTimeout: 30_000,
      readTimeout: 90_000,
    });
    status = response.status;
    payload = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  } else {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    status = response.status;
    payload = await response.json().catch(() => ({}));
  }
  if (status < 200 || status >= 300) {
    throw new Error(`模型请求失败 (${status})`);
  }
  return payload?.choices?.[0]?.message?.content || '';
}

async function generatePost(knowledge, role, type, recentTitles = []) {
  const variation = createVariationBrief({ recentTitles });
  try {
    const output = await callModel([
      {
        role: 'system',
        content: buildPostSystemPrompt({ role, variation }),
      },
      {
        role: 'user',
        content: buildPostUserPrompt({ knowledge, type, variation }),
      },
    ], { json: true, temperature: 0.92 });
    if (output) {
      const generated = parseJsonObject(output);
      return {
        ...generated,
        title: ensureCatchyTitle({ generated, knowledge, role, type, variationSeed: variation.seed }),
        source: 'llm',
      };
    }
  } catch {
    // Fall back to the local generator so the community remains usable offline.
  }
  return { ...mockGeneratePost({ knowledge, role, type, variationSeed: variation.seed }), source: 'demo' };
}

async function generateReply(post, comment, role, recentReplies = [], knowledge) {
  const variation = createVariationBrief({ kind: 'reply', recentReplies });
  const question = isQuestionComment(comment.content);
  try {
    const output = await callModel([
      { role: 'system', content: buildReplySystemPrompt({ role, variation, isQuestion: question }) },
      { role: 'user', content: buildReplyUserPrompt({ post, comment, knowledge, recentReplies: variation.recentReplies }) },
    ], { temperature: 0.9 });
    if (output) return output.trim();
  } catch {
    // Keep the interaction available when the model is offline or unavailable.
  }
  return generateFallbackReply({ post, comment, role, knowledge, variationSeed: variation.seed });
}

async function generateKnowledgeAnswer(post, knowledge, role) {
  const variation = createVariationBrief({ kind: 'answer' });
  try {
    const output = await callModel([
      {
        role: 'system',
        content: buildKnowledgeAnswerSystemPrompt({ role, variation }),
      },
      {
        role: 'user',
        content: buildKnowledgeAnswerUserPrompt({ post, knowledge }),
      },
    ], { temperature: 0.84 });
    if (output) return output.trim();
  } catch {
    // Keep the required Q&A available when the configured model is unavailable.
  }
  return generateFallbackKnowledgeAnswer({ post, knowledge, role });
}

async function publishKnowledge(store, { knowledgeId, roleId, type = 'discussion' } = {}) {
  const available = store.knowledge.filter((item) => item.status === 'pending');
  const knowledge = knowledgeId ? store.knowledge.find((item) => item.id === knowledgeId) : available[Math.floor(Math.random() * available.length)];
  if (!knowledge || knowledge.status !== 'pending') throw new Error('没有可发布的知识点');
  const matchingRoles = store.roles.filter((role) => role.tags.some((tag) => knowledge.tags.includes(tag) || tag === knowledge.category));
  const role = roleId ? store.roles.find((item) => item.id === roleId) : (matchingRoles.length ? matchingRoles : store.roles)[Math.floor(Math.random() * (matchingRoles.length || store.roles.length))];
  if (!role) throw new Error('请先创建至少一个 AI 角色');
  const effectiveType = role.postMode || type;
  const generated = await generatePost(knowledge, role, effectiveType, store.posts.slice(0, 12).map((post) => `${post.title}：${String(post.body || '').replace(/\s+/g, ' ').slice(0, 90)}`));
  const createdAt = new Date().toISOString();
  const post = {
    id: makeId('post'),
    knowledgeId: knowledge.id,
    authorId: role.id,
    title: generated.title,
    excerpt: generated.excerpt,
    body: generated.body,
    category: generated.category || knowledge.category,
    tags: generated.tags || knowledge.tags,
    createdAt,
    readTime: Math.max(2, Math.round(generated.body.length / 420)),
    views: 0,
    likes: 0,
    comments: [],
    generationSource: generated.source,
    postType: generated.postType || effectiveType,
    qaRequired: Boolean(role.requiresQa),
    authorProfile: randomProfile(),
  };
  if (role.requiresQa) {
    const answerRole = store.roles.find((candidate) => candidate.id !== role.id && !candidate.requiresQa) || role;
    const questionCreatedAt = new Date().toISOString();
    post.comments.push({
      id: makeId('comment'),
      authorId: role.id,
      authorProfile: randomProfile(),
      content: generateFallbackQuestion({ knowledge, variationSeed: post.id }),
      createdAt: questionCreatedAt,
      isAi: true,
      qaType: 'question',
    });
    const answerCreatedAt = new Date().toISOString();
    post.comments.push({
      id: makeId('comment'),
      authorId: answerRole.id,
      authorProfile: randomProfile(),
      content: await generateKnowledgeAnswer(post, knowledge, answerRole),
      createdAt: answerCreatedAt,
      isAi: true,
      qaType: 'answer',
    });
    store.activity.unshift({ id: makeId('activity'), type: 'reply', text: `${answerRole.nickname} 回答了求知帖`, createdAt: answerCreatedAt });
  }
  knowledge.status = 'published';
  knowledge.publishedAt = createdAt;
  store.posts.unshift(post);
  store.settings.lastGeneratedAt = createdAt;
  store.activity.unshift({ id: makeId('activity'), type: 'post', text: `${role.nickname} 发布了“${post.title}”`, createdAt });
  store.activity = store.activity.slice(0, 30);
  return { post, role, generated };
}

async function runDueAutomation(store) {
  if (!store.settings.autoPostEnabled || !store.knowledge.some((item) => item.status === 'pending')) return;
  const interval = (24 * 60 * 60 * 1000) / Math.max(1, Number(store.settings.postsPerDay));
  const elapsed = Date.now() - new Date(store.settings.lastGeneratedAt || 0).getTime();
  if (elapsed >= interval) await publishKnowledge(store, { type: store.settings.defaultPostType });
}

function bootstrap(store) {
  return {
    roles: store.roles,
    posts: store.posts.map((post) => decoratePost(store, post)),
    knowledge: store.knowledge,
    settings: store.settings,
    activity: store.activity,
    stats: summarize(store),
    aiMode: readLlmConfig().apiKey ? 'llm' : 'demo',
    llm: publicLlmConfig(),
    runtime: 'mobile',
  };
}

let bootstrapRequest = null;

async function mobileBootstrap() {
  if (bootstrapRequest) return bootstrapRequest;
  bootstrapRequest = (async () => {
    const store = readStore();
    const before = JSON.stringify(store.settings);
    const postCount = store.posts.length;
    await runDueAutomation(store);
    if (before !== JSON.stringify(store.settings) || postCount !== store.posts.length) writeStore(store);
    return bootstrap(store);
  })();
  try {
    return await bootstrapRequest;
  } finally {
    bootstrapRequest = null;
  }
}

export const mobileApi = {
  bootstrap: mobileBootstrap,
  llmConfig: async () => publicLlmConfig(),
  updateLlmConfig: async ({ apiKey, clearKey = false, baseUrl, model }) => {
    const current = readLlmConfig();
    const next = {
      apiKey: clearKey ? '' : (String(apiKey || '').trim() || current.apiKey),
      baseUrl: String(baseUrl || current.baseUrl || DEEPSEEK_BASE_URL).trim().replace(/\/$/, ''),
      model: String(model || current.model || DEFAULT_MODEL).trim(),
    };
    let protocol;
    try {
      protocol = new URL(next.baseUrl).protocol;
    } catch {
      throw new Error('Base URL 不是有效地址');
    }
    if (!/^https?:$/.test(protocol)) throw new Error('Base URL 仅支持 HTTP 或 HTTPS');
    if (!next.model) throw new Error('模型名称不能为空');
    if (next.apiKey.length > 500) throw new Error('API Key 格式过长');
    writeLlmConfig(next);
    return publicLlmConfig();
  },
  post: async (id) => {
    const store = readStore();
    const post = store.posts.find((item) => item.id === id);
    if (!post) throw new Error('帖子不存在');
    post.views += 1;
    writeStore(store);
    return decoratePost(store, post);
  },
  like: async (id, active) => {
    const store = readStore();
    const post = store.posts.find((item) => item.id === id);
    if (!post) throw new Error('帖子不存在');
    post.likes = Math.max(0, post.likes + (active === false ? -1 : 1));
    writeStore(store);
    return { likes: post.likes };
  },
  comment: async (id, body) => {
    const content = String(body?.content || '').trim();
    if (!content) throw new Error('评论内容不能为空');
    if (content.length > 800) throw new Error('评论不能超过 800 字');
    const store = readStore();
    const post = store.posts.find((item) => item.id === id);
    if (!post) throw new Error('帖子不存在');
    const question = isQuestionComment(content);
    const knowledge = store.knowledge.find((item) => item.id === post.knowledgeId);
    const comment = {
      id: makeId('comment'),
      authorName: String(body?.authorName || '社区访客').slice(0, 24),
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(body?.authorName || '社区访客')}&backgroundColor=dedede`,
      content,
      createdAt: new Date().toISOString(),
      isAi: false,
      isQuestion: question,
      intent: question ? 'question' : 'comment',
    };
    post.comments.push(comment);
    const author = roleFor(store, post);
    const responder = question ? chooseReplyRole(store, post, author) : author;
    let aiReply = null;
    if (responder && (question || Math.random() <= (responder.replyProbability ?? store.settings.replyProbability))) {
      aiReply = {
        id: makeId('comment'),
        authorId: responder.id,
        authorProfile: randomProfile(),
        content: await generateReply(post, comment, responder, post.comments.filter((item) => item.isAi).map((item) => item.content), knowledge),
        createdAt: new Date().toISOString(),
        isAi: true,
        replyType: question ? 'answer' : 'reply',
        replyToCommentId: comment.id,
      };
      post.comments.push(aiReply);
      store.activity.unshift({ id: makeId('activity'), type: 'reply', text: `${responder.nickname} ${question ? '回答了' : '回复了'}社区访客`, createdAt: aiReply.createdAt });
    }
    writeStore(store);
    return { comment, aiReply, author: responder || author, responder: responder || author, isQuestion: question, immediate: question };
  },
  generate: async (body) => {
    const store = readStore();
    const result = await publishKnowledge(store, body || {});
    writeStore(store);
    return { ...result, post: { ...result.post, author: withProfile(result.role, result.post.authorProfile) } };
  },
  importKnowledge: async (formData) => {
    const file = formData.get('file');
    let text = String(formData.get('content') || '');
    let source = String(formData.get('sourceName') || '手动录入');
    if (file && typeof file.text === 'function') {
      source = file.name || source;
      text = /\.pdf$/i.test(source) || file.type === 'application/pdf' ? await extractPdfText(file) : await file.text();
    }
    const entries = extractKnowledgeLocal(text, source);
    if (!entries.length) throw new Error('没有识别到足够完整的知识内容');
    const store = readStore();
    store.knowledge.unshift(...entries);
    store.activity.unshift({ id: makeId('activity'), type: 'import', text: `已从 ${source} 导入 ${entries.length} 条知识`, createdAt: new Date().toISOString() });
    writeStore(store);
    return { count: entries.length, entries };
  },
  createKnowledge: async (body) => {
    const store = readStore();
    const entry = { id: makeId('know'), title: String(body?.title || '').trim(), content: String(body?.content || '').trim(), category: String(body?.category || '通识'), tags: Array.isArray(body?.tags) ? body.tags : [], group: String(body?.category || '通识'), section: String(body?.title || '未分类').trim() || '未分类', status: 'pending', source: '手动录入', createdAt: new Date().toISOString() };
    if (!entry.title || !entry.content) throw new Error('知识点标题和内容不能为空');
    store.knowledge.unshift(entry);
    writeStore(store);
    return entry;
  },
  updateKnowledge: async (id, body) => {
    const store = readStore();
    const entry = store.knowledge.find((item) => item.id === id);
    if (!entry) throw new Error('知识条目不存在');
    for (const key of ['title', 'content', 'category', 'tags', 'status']) if (body?.[key] !== undefined) entry[key] = body[key];
    if (body?.category !== undefined && body?.group === undefined) entry.group = String(body.category || '未分类');
    if (body?.title !== undefined && body?.section === undefined) entry.section = String(body.title || '未分类').trim() || '未分类';
    entry.updatedAt = new Date().toISOString();
    writeStore(store);
    return entry;
  },
  deleteKnowledge: async (id) => {
    const store = readStore();
    const index = store.knowledge.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('知识条目不存在');
    store.knowledge.splice(index, 1);
    writeStore(store);
  },
  createRole: async (body) => {
    const nickname = String(body?.nickname || '').trim();
    const persona = String(body?.persona || '').trim();
    if (!nickname || !persona) throw new Error('昵称和人设不能为空');
    const role = { id: makeId('role'), nickname, handle: String(body?.handle || `@${nickname}`).slice(0, 30), avatar: body?.avatar || `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(nickname)}`, bio: String(body?.bio || ''), persona, postStyle: String(body?.postStyle || '用第一人称自然分享，结构清晰。'), replyStyle: String(body?.replyStyle || '保持友好并回应评论中的具体问题。'), tags: Array.isArray(body?.tags) ? body.tags.slice(0, 6) : [], activeHours: String(body?.activeHours || '09:00-22:00'), replyProbability: Number(body?.replyProbability ?? 0.75), color: body?.color || '#159889' };
    const store = readStore();
    store.roles.push(role);
    writeStore(store);
    return role;
  },
  updateRole: async (id, body) => {
    const store = readStore();
    const role = store.roles.find((item) => item.id === id);
    if (!role) throw new Error('角色不存在');
    for (const key of ['nickname', 'handle', 'avatar', 'bio', 'persona', 'postStyle', 'replyStyle', 'tags', 'activeHours', 'replyProbability', 'color']) if (body?.[key] !== undefined) role[key] = body[key];
    writeStore(store);
    return role;
  },
  deleteRole: async (id) => {
    const store = readStore();
    if (store.posts.some((post) => post.authorId === id)) throw new Error('该角色已经发布过帖子，暂时不能删除');
    const index = store.roles.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('角色不存在');
    store.roles.splice(index, 1);
    writeStore(store);
  },
  updateSettings: async (body) => {
    const store = readStore();
    for (const key of ['autoPostEnabled', 'postsPerDay', 'replyProbability', 'replyDelaySeconds', 'defaultPostType']) if (body?.[key] !== undefined) store.settings[key] = body[key];
    writeStore(store);
    return store.settings;
  },
  runAutomation: async (body = {}) => {
    const store = readStore();
    const result = await publishKnowledge(store, { type: body.type || store.settings.defaultPostType });
    writeStore(store);
    return { ...result, post: { ...result.post, author: withProfile(result.role, result.post.authorProfile) } };
  },
};
