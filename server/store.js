import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBuiltinKnowledge } from './builtin-knowledge.js';
import { createSeedData } from './seed.js';
import { AVATAR_LIBRARY_VERSION, profileForSeed } from '../src/avatarLibrary.js';
import { ensureCatchyTitle } from '../src/humanGenerator.js';
import { ensureKnowledgeBases } from '../src/knowledgeBases.js';
import { emptyUsage } from '../src/usage.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(serverDir, '../data');
const dataFile = path.join(dataDir, 'store.json');

let writeQueue = Promise.resolve();
let updateQueue = Promise.resolve();
let builtInChecked = false;
const knowledgeKey = (item) => `${item.source || ''}\n${String(item.content || '').replace(/\s+/g, '')}`;
const legacyTitlePattern = /项目相关知识点|基础知识点|通用知识点|面经汇总|知识点总结|学习笔记/;
const postTypeKey = (value) => ({ 教程帖: 'tutorial', 面试帖: 'interview', 问题帖: 'question' }[value] || 'discussion');
const legacyDemoKnowledgeIds = new Set([
  'know-event-loop', 'know-index', 'know-cache', 'know-react-state',
  'know-http-cache', 'know-idempotent', 'know-btree', 'know-rag',
]);
const legacyDemoPostIds = new Set(['post-event-loop', 'post-index', 'post-cache', 'post-react-state']);
const legacyRoleTags = {
  'role-student': ['前端', '算法', '面试'],
  'role-beginner': ['AI', '算法', '面试', '学习'],
  'role-architect': ['架构', '数据库', '后端'],
  'role-interviewer': ['面试', '系统设计', 'JavaScript'],
  'role-product': ['产品', 'AI', '效率'],
};
const cvCategories = new Set([
  '数学与优化', '编程与工程基础', '图像处理与传统视觉', '机器学习基础',
  '深度学习与骨干网络', '目标检测与图像分割', '关键点、跟踪与视频分析', 'OCR 与文档视觉',
  '视觉基础模型与多模态', '生成式视觉', '三维、四维与空间智能', '世界模型、强化学习与具身智能',
  '自动驾驶与多传感器融合', '数据工程、部署与 MLOps', '项目、可信视觉与求职',
]);

function migrateLegacyDemoData(store) {
  const seed = createSeedData();
  let changed = false;
  if (store.knowledge.some((item) => legacyDemoKnowledgeIds.has(item.id)) || store.posts.some((post) => legacyDemoPostIds.has(post.id))) {
    store.knowledge = store.knowledge.filter((item) => !legacyDemoKnowledgeIds.has(item.id));
    store.posts = store.posts.filter((post) => !legacyDemoPostIds.has(post.id));
    for (const item of seed.knowledge) {
      if (!store.knowledge.some((existing) => existing.id === item.id)) store.knowledge.push(item);
    }
    for (const post of seed.posts) {
      if (!store.posts.some((existing) => existing.id === post.id)) store.posts.push(post);
    }
    changed = true;
  }
  for (const canonical of seed.roles) {
    const existing = store.roles.find((role) => role.id === canonical.id);
    if (!existing || JSON.stringify(existing.tags || []) !== JSON.stringify(legacyRoleTags[canonical.id] || [])) continue;
    Object.assign(existing, canonical);
    changed = true;
  }
  const activitySnapshot = JSON.stringify(store.activity);
  store.activity = store.activity
    .filter((item) => !(item.type === 'post' && /项目相关知识点|基础知识点|数据库索引|RAG 检索|自然语言处理|Canny/.test(item.text || '')))
    .map((item) => item.type === 'import' && /AI 应用实践/.test(item.text || '')
      ? { ...item, text: '已整理计算机视觉算法工程师知识路线' }
      : item);
  if (JSON.stringify(store.activity) !== activitySnapshot) changed = true;
  return changed;
}

function removeStaleDemoPosts(store) {
  const validKnowledgeIds = new Set(store.knowledge.map((item) => item.id));
  const retained = store.posts.filter((post) => !(post.generationSource === 'demo'
    && (!validKnowledgeIds.has(post.knowledgeId) || !cvCategories.has(post.category))));
  if (retained.length === store.posts.length) return false;
  store.posts = retained;
  return true;
}

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  try {
    const contents = await readFile(dataFile, 'utf8');
    if (!builtInChecked) {
      const store = JSON.parse(contents);
      const originalStore = JSON.stringify(store);
      ensureKnowledgeBases(store);
      if (!store.usage) store.usage = emptyUsage();
      const builtins = createBuiltinKnowledge();
      const builtinById = new Map(builtins.map((item) => [item.id, item]));
      let changed = migrateLegacyDemoData(store);
      for (const post of store.posts) {
        if (!post.authorProfile || post.authorProfile.profileVersion !== AVATAR_LIBRARY_VERSION) {
          post.authorProfile = profileForSeed(post.id);
          changed = true;
        }
        for (const comment of post.comments || []) {
          if (comment.authorId && (!comment.authorProfile || comment.authorProfile.profileVersion !== AVATAR_LIBRARY_VERSION)) {
            comment.authorProfile = profileForSeed(`${post.id}:${comment.id}`);
            changed = true;
          }
        }
      }
      const beginnerRole = createSeedData().roles.find((role) => role.id === 'role-beginner');
      if (beginnerRole && !store.roles.some((role) => role.id === beginnerRole.id)) {
        store.roles.push(beginnerRole);
        changed = true;
      }
      const existingBuiltins = store.knowledge.filter((item) => item.id.startsWith('builtin-ai-'));
      const nonBuiltinKnowledge = store.knowledge.filter((item) => !item.id.startsWith('builtin-ai-'));
      const existingByKey = new Map(existingBuiltins.map((item) => [knowledgeKey(item), item]));
      const builtinKeys = new Set(builtins.map(knowledgeKey));
      const needsBuiltinRefresh = existingBuiltins.length !== builtins.length
        || existingBuiltins.some((item) => !builtinKeys.has(knowledgeKey(item)));
      if (needsBuiltinRefresh) {
        const mergedBuiltins = builtins.map((item) => {
          const previous = existingByKey.get(knowledgeKey(item));
          return previous
            ? {
              ...item,
              id: previous.id,
              status: previous.status,
              publishedAt: previous.publishedAt,
              createdAt: previous.createdAt || item.createdAt,
            }
            : item;
        });
        store.knowledge = [...mergedBuiltins, ...nonBuiltinKnowledge];
        changed = true;
      } else {
        for (const item of store.knowledge) {
          const canonical = builtinById.get(item.id) || builtins.find((entry) => knowledgeKey(entry) === knowledgeKey(item));
          if (!canonical) continue;
          if (item.title !== canonical.title || item.group !== canonical.group || item.section !== canonical.section || item.part !== canonical.part || item.company !== canonical.company) {
            item.title = canonical.title;
            item.group = canonical.group;
            item.section = canonical.section;
            item.part = canonical.part;
            item.company = canonical.company;
            item.tags = canonical.tags;
            changed = true;
          }
        }
      }
      changed = removeStaleDemoPosts(store) || changed;
      for (const post of store.posts) {
        if (post.generationSource !== 'demo' || !legacyTitlePattern.test(post.title)) continue;
        const knowledge = store.knowledge.find((item) => item.id === post.knowledgeId);
        const role = store.roles.find((item) => item.id === post.authorId);
        if (!knowledge) continue;
        const title = ensureCatchyTitle({ generated: post, knowledge, role, type: postTypeKey(post.postType), variationSeed: post.id });
        if (title !== post.title) {
          post.title = title;
          changed = true;
        }
      }
      ensureKnowledgeBases(store);
      changed = JSON.stringify(store) !== originalStore || changed;
      if (changed) {
        await writeFile(dataFile, JSON.stringify(store, null, 2));
      }
      builtInChecked = true;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const seeded = createSeedData();
    for (const post of seeded.posts) {
      post.authorProfile = profileForSeed(post.id);
      for (const comment of post.comments || []) {
        if (comment.authorId) comment.authorProfile = profileForSeed(`${post.id}:${comment.id}`);
      }
    }
    seeded.knowledge.unshift(...createBuiltinKnowledge());
    ensureKnowledgeBases(seeded);
    seeded.usage = emptyUsage();
    await writeFile(dataFile, JSON.stringify(seeded, null, 2));
    builtInChecked = true;
  }
}

export async function readStore() {
  await ensureStore();
  return JSON.parse(await readFile(dataFile, 'utf8'));
}

export async function writeStore(nextStore) {
  await ensureStore();
  writeQueue = writeQueue.then(async () => {
    const tempFile = `${dataFile}.tmp`;
    await writeFile(tempFile, JSON.stringify(nextStore, null, 2));
    await rename(tempFile, dataFile);
  });
  await writeQueue;
  return nextStore;
}

export function updateStore(updater) {
  const operation = updateQueue.then(async () => {
    const store = await readStore();
    const result = await updater(store);
    await writeStore(store);
    return result;
  });
  updateQueue = operation.catch(() => undefined);
  return operation;
}

export function summarize(store) {
  const pending = store.knowledge.filter((item) => item.status === 'pending').length;
  const comments = store.posts.reduce((total, post) => total + post.comments.length, 0);
  const views = store.posts.reduce((total, post) => total + post.views, 0);
  return {
    posts: store.posts.length,
    knowledge: store.knowledge.length,
    pending,
    roles: store.roles.length,
    comments,
    views,
  };
}

export { dataFile };
