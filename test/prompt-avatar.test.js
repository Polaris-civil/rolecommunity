import assert from 'node:assert/strict';
import test from 'node:test';
import { AVATAR_LIBRARY_VERSION, avatarLibrary, generateNickname, nicknameMaterials, profileForSeed } from '../src/avatarLibrary.js';
import { generateFallbackKnowledgeAnswer, generateFallbackQuestion, generateFallbackReply, mockGeneratePost } from '../src/humanGenerator.js';
import { buildPostSystemPrompt, buildPostUserPrompt, buildReplySystemPrompt, buildReplyUserPrompt, promptPreview } from '../src/promptTemplates.js';
import { chooseReplyRole, isQuestionComment } from '../src/replyRouting.js';
import builtinKnowledge from '../src/assets/ai-algorithm-knowledge.json' with { type: 'json' };

test('avatar library contains 50 local profiles with mixed names', () => {
  assert.equal(avatarLibrary.length, 50);
  assert.equal(new Set(avatarLibrary.map((profile) => profile.avatar)).size, 50);
  assert.ok(avatarLibrary.some((profile) => /[\u4e00-\u9fff]/.test(profile.nickname)));
  assert.ok(avatarLibrary.filter((profile) => /^[\u4e00-\u9fff]+$/.test(profile.nickname)).length >= 25);
  assert.ok(avatarLibrary.every((profile) => profile.profileVersion === AVATAR_LIBRARY_VERSION));
  assert.ok(avatarLibrary.every((profile) => profile.avatar.startsWith('/avatars/')));
  const seededProfiles = Array.from({ length: 80 }, (_, index) => profileForSeed(`post-${index}`));
  assert.ok(new Set(seededProfiles.map((profile) => profile.nickname)).size >= 55);
  assert.ok(seededProfiles.some((profile) => /[\u4e00-\u9fff]/.test(profile.nickname)));
  assert.ok(seededProfiles.every((profile) => /^@[a-z0-9_]+\d{2}$/.test(profile.handle)));
  assert.notEqual(generateNickname(() => 0.01), generateNickname(() => 0.83));
  assert.ok(Object.values(nicknameMaterials).every((items) => items.length >= 5));
  assert.equal(profileForSeed('same-post').nickname, profileForSeed('same-post').nickname);
});

test('generation prompt exposes role, source and math-format constraints', () => {
  const prompt = buildPostSystemPrompt({ role: { persona: 'persona', postStyle: 'style' } });
  assert.match(prompt, /persona/);
  assert.match(prompt, /KaTeX/);
  assert.match(prompt, /真实用户/);
  assert.match(prompt, /不要每次都用/);
  assert.match(prompt, /具体知识点/);
  assert.match(promptPreview.postUser, /新角度/);
  assert.match(promptPreview.postUser, /知识库原文/);
  assert.match(promptPreview.answerSystem, /求知小白/);
  assert.match(promptPreview.answerUser, /求知帖正文/);
  assert.match(buildPostUserPrompt({ knowledge: { title: '标题', category: '分类', tags: [], content: '内容' }, type: 'discussion', variation: { recentTitles: ['上一条帖子'] } }), /上一条帖子/);
  const replyPrompt = buildReplyUserPrompt({ post: { title: '标题', category: '分类', tags: ['网络'], body: '完整的帖子正文上下文' }, knowledge: { title: '关联资料', content: '知识库原文' }, comment: { content: '评论' }, recentReplies: ['已有回复'] });
  assert.match(replyPrompt, /帖子正文[\s\S]*完整的帖子正文上下文/);
  assert.match(replyPrompt, /知识库原文/);
  assert.match(replyPrompt, /已有回复/);
  assert.match(buildReplySystemPrompt({ role: { nickname: '角色', persona: '人设', replyStyle: '具体' }, isQuestion: true }), /知识库原文/);
});

test('fallback generation varies post structure and replies', () => {
  const knowledge = { id: 'variation-knowledge', title: 'HTTP 缓存', content: '强缓存命中时不需要向服务器验证，协商缓存可以返回 304。', category: '网络', tags: ['HTTP'] };
  const role = { id: 'role-architect', nickname: '架构师', persona: '关注边界', postStyle: '像同事交流', replyStyle: '具体回应' };
  const posts = ['a', 'b', 'c', 'd', 'e', 'f'].map((variationSeed) => mockGeneratePost({ knowledge, role, variationSeed, type: 'discussion' }));
  assert.ok(new Set(posts.map((post) => post.title)).size > 1);
  assert.ok(new Set(posts.map((post) => post.body)).size > 1);
  const replies = ['a', 'b', 'c', 'd', 'e', 'f'].map((variationSeed) => generateFallbackReply({ post: { id: 'post-1', title: knowledge.title, body: knowledge.content }, comment: { id: variationSeed, content: '为什么 304 不返回正文？' }, role, variationSeed }));
  assert.ok(new Set(replies).size > 1);
  assert.ok(replies.every((reply) => /强缓存|协商缓存|304/.test(reply)));
  const bodyContextReply = generateFallbackReply({
    post: { id: 'post-2', title: knowledge.title, body: '正文里明确说要先判断缓存条件。' },
    knowledge: { content: '资料里的另一段内容。' },
    comment: { content: '为什么要先判断？' },
    role,
    variationSeed: 'body-context',
  });
  assert.match(bodyContextReply, /正文里明确说要先判断缓存条件/);
  const answer = generateFallbackKnowledgeAnswer({ post: { id: 'post-1', title: knowledge.title }, knowledge, role, variationSeed: 'answer-1' });
  assert.match(answer, /强缓存|协商缓存/);
  const questions = ['a', 'b', 'c', 'd', 'e'].map((variationSeed) => generateFallbackQuestion({ knowledge, variationSeed }));
  assert.ok(new Set(questions).size > 1);
});

test('question comments are routed to a relevant different role', () => {
  assert.equal(isQuestionComment('为什么 304 不返回正文？'), true);
  assert.equal(isQuestionComment('这个例子很清楚，谢谢分享'), false);
  const store = {
    roles: [
      { id: 'author', tags: ['前端'] },
      { id: 'answerer', tags: ['HTTP', '网络'] },
      { id: 'other', tags: ['算法'] },
    ],
  };
  const responder = chooseReplyRole(store, { authorId: 'author', tags: ['HTTP'], category: '网络' }, store.roles[0], () => 0);
  assert.equal(responder.id, 'answerer');
});

test('built-in interview knowledge is preprocessed into organized volumes', () => {
  assert.ok(builtinKnowledge.length > 700);
  assert.deepEqual(new Set(builtinKnowledge.map((entry) => entry.part)), new Set(['上册', '中册', '下册']));
  assert.ok(builtinKnowledge.every((entry) => entry.source && entry.group && entry.section && !['目录'].includes(entry.title)));
  assert.ok(builtinKnowledge.some((entry) => entry.title.includes('·')));
});
