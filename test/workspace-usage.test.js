import assert from 'node:assert/strict';
import test from 'node:test';
import { ensureKnowledgeBases, knowledgeBaseIdForName } from '../src/knowledgeBases.js';
import { emptyUsage, recordFallbackUsage, recordTokenUsage, summarizeUsage } from '../src/usage.js';

test('knowledge bases keep CV and imported sources independent', () => {
  const store = {
    knowledge: [
      { id: 'builtin-ai-cv-01', source: '路线', category: '目标检测与图像分割' },
      { id: 'know-cooking', source: '菜谱.md', category: '美食' },
    ],
    posts: [{ id: 'post-1', knowledgeId: 'builtin-ai-cv-01' }],
    settings: {},
  };
  ensureKnowledgeBases(store);
  assert.equal(store.knowledge[0].knowledgeBaseId, 'kb-cv');
  assert.equal(store.posts[0].knowledgeBaseId, 'kb-cv');
  assert.equal(store.knowledge[1].knowledgeBaseId, knowledgeBaseIdForName('菜谱.md'));
  assert.equal(store.settings.activeKnowledgeBaseId, 'kb-cv');
  assert.ok(store.knowledgeBases.some((base) => base.name === '菜谱'));
});

test('token usage accumulates measured model calls and local fallbacks', () => {
  const store = { usage: emptyUsage() };
  recordTokenUsage(store, { prompt_tokens: 120, completion_tokens: 45, model: 'deepseek-v4-flash' }, 'post');
  recordTokenUsage(store, { input_tokens: 10, output_tokens: 5, model: 'deepseek-v4-flash' }, 'reply');
  recordFallbackUsage(store);
  const usage = summarizeUsage(store);
  assert.equal(usage.totalTokens, 180);
  assert.equal(usage.promptTokens, 130);
  assert.equal(usage.completionTokens, 50);
  assert.equal(usage.requests, 2);
  assert.equal(usage.measuredRequests, 2);
  assert.equal(usage.fallbackRequests, 1);
  assert.equal(usage.models[0].requests, 2);
});
