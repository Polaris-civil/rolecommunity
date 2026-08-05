import assert from 'node:assert/strict';
import test from 'node:test';
import { mockGeneratePost } from '../server/generator.js';
import { ensureCatchyTitle } from '../src/humanGenerator.js';

const knowledge = {
  title: 'HTTP 缓存',
  content: '强缓存命中时不需要向服务器验证，协商缓存可以返回 304。',
  category: '网络',
  tags: ['HTTP', '浏览器'],
};

const role = {
  id: 'role-architect',
  nickname: '架构师',
};

test('mock generator creates a complete publishable post', () => {
  const post = mockGeneratePost({ knowledge, role, type: 'tutorial' });
  assert.match(post.title, /HTTP 缓存/);
  assert.match(post.title, /边界|关键|判断|捋清|清单/);
  assert.match(post.body, /强缓存命中/);
  assert.equal(post.category, '网络');
  assert.deepEqual(post.tags, knowledge.tags);
  assert.ok(post.excerpt.length > 10);
});

test('generic knowledge titles are condensed from a concrete source clue', () => {
  const post = mockGeneratePost({
    knowledge: {
      title: '基础知识点',
      content: '- 卡尔曼滤波讲一下？\n- 为什么顺着梯度的负方向更新参数下降最快？',
      category: 'AI',
      tags: ['算法'],
    },
    role,
    type: 'discussion',
    variationSeed: 'generic-title',
  });
  assert.ok(/卡尔曼|梯度|参数/.test(post.title));
  assert.ok(post.title.length <= 54);
});

test('weak model titles are replaced with a knowledge-specific headline', () => {
  const title = ensureCatchyTitle({
    generated: { title: '知识点总结' },
    knowledge,
    role,
    type: 'interview',
    variationSeed: 'weak-title',
  });
  assert.notEqual(title, '知识点总结');
  assert.match(title, /HTTP 缓存|强缓存|协商缓存/);
});

test('student role gets its persona-specific title style', () => {
  const post = mockGeneratePost({ knowledge, role: { ...role, id: 'role-student' }, type: 'discussion' });
  assert.match(post.title, /^救命！/);
});

test('beginner role creates a question post with a Q&A-oriented style', () => {
  const post = mockGeneratePost({ knowledge, role: { ...role, id: 'role-beginner', requiresQa: true, postMode: 'question' }, type: 'discussion' });
  assert.match(post.title, /^求助：/);
  assert.match(post.body, /我卡住的地方/);
  assert.equal(post.postType, '问题帖');
  assert.ok(post.tags.includes('求知帖'));
});
