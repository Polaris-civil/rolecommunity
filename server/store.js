import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBuiltinKnowledge } from './builtin-knowledge.js';
import { createSeedData } from './seed.js';
import { AVATAR_LIBRARY_VERSION, profileForSeed } from '../src/avatarLibrary.js';
import { ensureCatchyTitle } from '../src/humanGenerator.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(serverDir, '../data');
const dataFile = path.join(dataDir, 'store.json');

let writeQueue = Promise.resolve();
let updateQueue = Promise.resolve();
let builtInChecked = false;
const knowledgeKey = (item) => `${item.source || ''}\n${String(item.content || '').replace(/\s+/g, '')}`;
const legacyTitlePattern = /项目相关知识点|基础知识点|通用知识点|面经汇总|知识点总结|学习笔记/;
const postTypeKey = (value) => ({ 教程帖: 'tutorial', 面试帖: 'interview', 问题帖: 'question' }[value] || 'discussion');

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  try {
    const contents = await readFile(dataFile, 'utf8');
    if (!builtInChecked) {
      const store = JSON.parse(contents);
      const builtins = createBuiltinKnowledge();
      const builtinById = new Map(builtins.map((item) => [item.id, item]));
      let changed = false;
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
