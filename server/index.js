import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import { randomProfile } from '../src/avatarLibrary.js';
import { generateFallbackQuestion } from '../src/humanGenerator.js';
import { chooseReplyRole, isQuestionComment } from '../src/replyRouting.js';
import { extractKnowledge } from './content.js';
import { generateKnowledgeAnswer, generatePost, generateReply } from './generator.js';
import { loadRuntimeConfig, publicRuntimeConfig, saveRuntimeConfig } from './runtime-config.js';
import { readStore, summarize, updateStore } from './store.js';

await loadRuntimeConfig();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const withErrorHandling = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const roleFor = (store, post) => store.roles.find((role) => role.id === post.authorId);
const withProfile = (role, profile) => {
  const { id: profileId, ...visualProfile } = profile || {};
  return role ? { ...role, ...visualProfile, profileId } : { ...visualProfile, profileId };
};
const decoratePost = (store, post) => ({ ...post, author: withProfile(roleFor(store, post), post.authorProfile) });

async function publishKnowledge(store, { knowledgeId, roleId, type = 'discussion' } = {}) {
  const available = store.knowledge.filter((item) => item.status === 'pending');
  const knowledge = knowledgeId
    ? store.knowledge.find((item) => item.id === knowledgeId)
    : available[Math.floor(Math.random() * available.length)];
  if (!knowledge) throw Object.assign(new Error('没有可发布的知识点'), { status: 409 });

  const matchingRoles = store.roles.filter((role) =>
    role.tags.some((tag) => knowledge.tags.includes(tag) || tag === knowledge.category),
  );
  const role = roleId
    ? store.roles.find((item) => item.id === roleId)
    : (matchingRoles.length ? matchingRoles : store.roles)[Math.floor(Math.random() * (matchingRoles.length || store.roles.length))];
  if (!role) throw Object.assign(new Error('请先创建至少一个 AI 角色'), { status: 409 });

  const effectiveType = role.postMode || type;
  const generated = await generatePost({
    knowledge,
    role,
    type: effectiveType,
    recentTitles: store.posts.slice(0, 12).map((post) => `${post.title}：${String(post.body || '').replace(/\s+/g, ' ').slice(0, 90)}`),
  });
  const post = {
    id: `post-${randomUUID()}`,
    knowledgeId: knowledge.id,
    authorId: role.id,
    title: generated.title,
    excerpt: generated.excerpt,
    body: generated.body,
    category: generated.category || knowledge.category,
    tags: generated.tags || knowledge.tags,
    createdAt: new Date().toISOString(),
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
      id: `comment-${randomUUID()}`,
      authorId: role.id,
      authorProfile: randomProfile(),
      content: generateFallbackQuestion({ knowledge, variationSeed: post.id }),
      createdAt: questionCreatedAt,
      isAi: true,
      qaType: 'question',
    });
    const answerCreatedAt = new Date().toISOString();
    post.comments.push({
      id: `comment-${randomUUID()}`,
      authorId: answerRole.id,
      authorProfile: randomProfile(),
      content: await generateKnowledgeAnswer({ post, knowledge, role: answerRole }),
      createdAt: answerCreatedAt,
      isAi: true,
      qaType: 'answer',
    });
    store.activity.unshift({
      id: `activity-${randomUUID()}`,
      type: 'reply',
      text: `${answerRole.nickname} 回答了求知帖`,
      createdAt: answerCreatedAt,
    });
  }
  knowledge.status = 'published';
  knowledge.publishedAt = post.createdAt;
  store.posts.unshift(post);
  store.settings.lastGeneratedAt = post.createdAt;
  store.activity.unshift({
    id: `activity-${randomUUID()}`,
    type: 'post',
    text: `${role.nickname} 发布了“${post.title}”`,
    createdAt: post.createdAt,
  });
  store.activity = store.activity.slice(0, 30);
  return { post, role, generated };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: process.env.OPENAI_API_KEY ? 'llm' : 'demo' });
});

app.get('/api/llm-config', (req, res) => {
  res.json(publicRuntimeConfig());
});

app.get('/api/bootstrap', withErrorHandling(async (req, res) => {
  const store = await readStore();
  res.json({
    roles: store.roles,
    posts: store.posts.map((post) => decoratePost(store, post)),
    knowledge: store.knowledge,
    settings: store.settings,
    activity: store.activity,
    stats: summarize(store),
    aiMode: process.env.OPENAI_API_KEY ? 'llm' : 'demo',
    llm: publicRuntimeConfig(),
  });
}));

app.patch('/api/llm-config', withErrorHandling(async (req, res) => {
  const config = await saveRuntimeConfig({
    apiKey: typeof req.body?.apiKey === 'string' ? req.body.apiKey : undefined,
    clearKey: req.body?.clearKey === true,
    baseUrl: typeof req.body?.baseUrl === 'string' ? req.body.baseUrl : undefined,
    model: typeof req.body?.model === 'string' ? req.body.model : undefined,
  });
  res.json(config);
}));

app.get('/api/posts', withErrorHandling(async (req, res) => {
  const store = await readStore();
  const query = String(req.query.query || '').trim().toLowerCase();
  const category = String(req.query.category || '全部');
  const posts = store.posts.filter((post) => {
    const matchesCategory = category === '全部' || post.category === category;
    const haystack = `${post.title} ${post.excerpt} ${(post.tags || []).join(' ')}`.toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });
  res.json(posts.map((post) => decoratePost(store, post)));
}));

app.get('/api/posts/:id', withErrorHandling(async (req, res) => {
  const result = await updateStore((store) => {
    const post = store.posts.find((item) => item.id === req.params.id);
    if (!post) throw Object.assign(new Error('帖子不存在'), { status: 404 });
    post.views += 1;
    return decoratePost(store, post);
  });
  res.json(result);
}));

app.post('/api/posts/:id/like', withErrorHandling(async (req, res) => {
  const result = await updateStore((store) => {
    const post = store.posts.find((item) => item.id === req.params.id);
    if (!post) throw Object.assign(new Error('帖子不存在'), { status: 404 });
    post.likes += req.body?.active === false ? -1 : 1;
    post.likes = Math.max(0, post.likes);
    return { likes: post.likes };
  });
  res.json(result);
}));

app.post('/api/posts/:id/comments', withErrorHandling(async (req, res) => {
  const content = String(req.body?.content || '').trim();
  if (!content) throw Object.assign(new Error('评论内容不能为空'), { status: 400 });
  if (content.length > 800) throw Object.assign(new Error('评论不能超过 800 字'), { status: 400 });

  const result = await updateStore(async (store) => {
    const post = store.posts.find((item) => item.id === req.params.id);
    if (!post) throw Object.assign(new Error('帖子不存在'), { status: 404 });
    const question = isQuestionComment(content);
    const knowledge = store.knowledge.find((item) => item.id === post.knowledgeId);
    const comment = {
      id: `comment-${randomUUID()}`,
      authorName: String(req.body?.authorName || '社区访客').slice(0, 24),
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(req.body?.authorName || '社区访客')}&backgroundColor=dedede`,
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
    const probability = responder?.replyProbability ?? store.settings.replyProbability;
    if (responder && (question || Math.random() <= probability)) {
      aiReply = {
        id: `comment-${randomUUID()}`,
        authorId: responder.id,
        authorProfile: randomProfile(),
        content: await generateReply({
          post,
          comment,
          role: responder,
          knowledge,
          recentReplies: post.comments.filter((item) => item.isAi).map((item) => item.content),
        }),
        createdAt: new Date().toISOString(),
        isAi: true,
        replyType: question ? 'answer' : 'reply',
        replyToCommentId: comment.id,
      };
      post.comments.push(aiReply);
      store.activity.unshift({
        id: `activity-${randomUUID()}`,
        type: 'reply',
        text: `${responder.nickname} ${question ? '回答了' : '回复了'}社区访客`,
        createdAt: aiReply.createdAt,
      });
    }
    return { comment, aiReply, author: responder || author, responder: responder || author, isQuestion: question, immediate: question };
  });
  res.status(201).json(result);
}));

app.post('/api/posts/generate', withErrorHandling(async (req, res) => {
  const result = await updateStore((store) => publishKnowledge(store, req.body || {}));
  res.status(201).json({ ...result, post: { ...result.post, author: withProfile(result.role, result.post.authorProfile) } });
}));

app.post('/api/knowledge/import', upload.single('file'), withErrorHandling(async (req, res) => {
  let text = String(req.body?.content || '');
  let source = String(req.body?.sourceName || '手动录入');
  if (req.file) {
    source = req.file.originalname;
    if (req.file.mimetype === 'application/pdf' || source.toLowerCase().endsWith('.pdf')) {
      const parsed = await pdf(req.file.buffer);
      text = parsed.text;
    } else {
      text = req.file.buffer.toString('utf8');
    }
  }
  const entries = extractKnowledge(text, source);
  if (!entries.length) throw Object.assign(new Error('没有识别到足够完整的知识内容'), { status: 400 });
  await updateStore((store) => {
    store.knowledge.unshift(...entries);
    store.activity.unshift({
      id: `activity-${randomUUID()}`,
      type: 'import',
      text: `已从 ${source} 导入 ${entries.length} 条知识`,
      createdAt: new Date().toISOString(),
    });
  });
  res.status(201).json({ count: entries.length, entries });
}));

app.post('/api/knowledge', withErrorHandling(async (req, res) => {
  const title = String(req.body?.title || '').trim();
  const content = String(req.body?.content || '').trim();
  if (!title || !content) throw Object.assign(new Error('标题和内容不能为空'), { status: 400 });
  const entry = {
    id: `know-${randomUUID()}`,
    title,
    content,
    category: String(req.body?.category || '通识'),
    tags: Array.isArray(req.body?.tags) ? req.body.tags.slice(0, 5) : [],
    group: String(req.body?.category || '通识'),
    section: title,
    status: 'pending',
    source: String(req.body?.source || '手动录入'),
    createdAt: new Date().toISOString(),
  };
  await updateStore((store) => store.knowledge.unshift(entry));
  res.status(201).json(entry);
}));

app.patch('/api/knowledge/:id', withErrorHandling(async (req, res) => {
  const entry = await updateStore((store) => {
    const current = store.knowledge.find((item) => item.id === req.params.id);
    if (!current) throw Object.assign(new Error('知识条目不存在'), { status: 404 });
    for (const key of ['title', 'content', 'category', 'tags', 'status']) {
      if (req.body?.[key] !== undefined) current[key] = req.body[key];
    }
    if (req.body?.category !== undefined && req.body?.group === undefined) current.group = String(req.body.category || '未分类');
    if (req.body?.title !== undefined && req.body?.section === undefined) current.section = String(req.body.title || '未分类').trim() || '未分类';
    current.updatedAt = new Date().toISOString();
    return current;
  });
  res.json(entry);
}));

app.delete('/api/knowledge/:id', withErrorHandling(async (req, res) => {
  await updateStore((store) => {
    const index = store.knowledge.findIndex((item) => item.id === req.params.id);
    if (index < 0) throw Object.assign(new Error('知识条目不存在'), { status: 404 });
    store.knowledge.splice(index, 1);
  });
  res.status(204).end();
}));

app.post('/api/roles', withErrorHandling(async (req, res) => {
  const nickname = String(req.body?.nickname || '').trim();
  const persona = String(req.body?.persona || '').trim();
  if (!nickname || !persona) throw Object.assign(new Error('昵称和人设不能为空'), { status: 400 });
  const role = {
    id: `role-${randomUUID()}`,
    nickname,
    handle: String(req.body?.handle || `@${nickname}`).slice(0, 30),
    avatar: req.body?.avatar || `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(nickname)}`,
    bio: String(req.body?.bio || ''),
    persona,
    postStyle: String(req.body?.postStyle || '用第一人称自然分享，结构清晰。'),
    replyStyle: String(req.body?.replyStyle || '保持友好并回应评论中的具体问题。'),
    tags: Array.isArray(req.body?.tags) ? req.body.tags.slice(0, 6) : [],
    activeHours: String(req.body?.activeHours || '09:00-22:00'),
    replyProbability: Number(req.body?.replyProbability ?? 0.75),
    color: req.body?.color || '#159889',
  };
  await updateStore((store) => store.roles.push(role));
  res.status(201).json(role);
}));

app.patch('/api/roles/:id', withErrorHandling(async (req, res) => {
  const role = await updateStore((store) => {
    const current = store.roles.find((item) => item.id === req.params.id);
    if (!current) throw Object.assign(new Error('角色不存在'), { status: 404 });
    for (const key of ['nickname', 'handle', 'avatar', 'bio', 'persona', 'postStyle', 'replyStyle', 'tags', 'activeHours', 'replyProbability', 'color']) {
      if (req.body?.[key] !== undefined) current[key] = req.body[key];
    }
    return current;
  });
  res.json(role);
}));

app.delete('/api/roles/:id', withErrorHandling(async (req, res) => {
  await updateStore((store) => {
    if (store.posts.some((post) => post.authorId === req.params.id)) {
      throw Object.assign(new Error('该角色已经发布过帖子，暂时不能删除'), { status: 409 });
    }
    const index = store.roles.findIndex((item) => item.id === req.params.id);
    if (index < 0) throw Object.assign(new Error('角色不存在'), { status: 404 });
    store.roles.splice(index, 1);
  });
  res.status(204).end();
}));

app.patch('/api/settings', withErrorHandling(async (req, res) => {
  const settings = await updateStore((store) => {
    const allowed = ['autoPostEnabled', 'postsPerDay', 'replyProbability', 'replyDelaySeconds', 'defaultPostType'];
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) store.settings[key] = req.body[key];
    }
    return store.settings;
  });
  res.json(settings);
}));

app.post('/api/automation/run', withErrorHandling(async (req, res) => {
  const result = await updateStore((store) => publishKnowledge(store, {
    type: req.body?.type || store.settings.defaultPostType,
  }));
  res.status(201).json({ ...result, post: { ...result.post, author: withProfile(result.role, result.post.authorProfile) } });
}));

setInterval(async () => {
  try {
    await updateStore(async (store) => {
      if (!store.settings.autoPostEnabled) return;
      const interval = (24 * 60 * 60 * 1000) / Math.max(1, Number(store.settings.postsPerDay));
      const elapsed = Date.now() - new Date(store.settings.lastGeneratedAt || 0).getTime();
      if (elapsed >= interval && store.knowledge.some((item) => item.status === 'pending')) {
        await publishKnowledge(store, { type: store.settings.defaultPostType });
      }
    });
  } catch (error) {
    console.error('Automation tick failed:', error.message);
  }
}, 60_000).unref();

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(rootDir, 'dist')));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(rootDir, 'dist', 'index.html'));
  });
}

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? '文件不能超过 15MB' : error.message });
  }
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || '服务器内部错误' });
});

app.listen(port, host, () => {
  console.log(`RoleCommunity API running at http://${host}:${port}`);
});
