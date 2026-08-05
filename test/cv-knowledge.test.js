import assert from 'node:assert/strict';
import test from 'node:test';
import knowledge from '../src/assets/ai-algorithm-knowledge.json' with { type: 'json' };
import roadmap from '../src/assets/computer-vision-roadmap.json' with { type: 'json' };
import resources from '../src/assets/github-computer-vision-resources.json' with { type: 'json' };
import { classifyCvEntry } from '../scripts/cv-knowledge.mjs';

test('CV roadmap covers the requested learning path in order', () => {
  assert.equal(roadmap.length, 34);
  assert.deepEqual(roadmap.map((entry) => entry.order), Array.from({ length: 34 }, (_, index) => index + 1));
  assert.match(roadmap.at(-1).content, /Python\/C\+\+.*TensorRT/);
  assert.ok(roadmap.some((entry) => /世界模型/.test(entry.title)));
  assert.ok(roadmap.some((entry) => /VLA/.test(entry.content)));
});

test('GitHub resource index points to curated repositories with license notes', () => {
  assert.ok(resources.length >= 20);
  assert.ok(resources.every((entry) => entry.url.startsWith('https://github.com/')));
  assert.ok(resources.every((entry) => entry.license && entry.content.includes('仓库')));
  assert.ok(resources.some((entry) => /AGPL-3.0/.test(entry.license)));
  assert.ok(resources.some((entry) => /TensorRT/.test(entry.title)));
});

test('source entries are classified into CV categories and exclude obvious pure off-topic items', () => {
  const sourceEntries = knowledge.filter((entry) => entry.kind === 'source');
  assert.ok(sourceEntries.length >= 300);
  assert.ok(sourceEntries.every((entry) => classifyCvEntry(entry).relevant));
  const pureOffTopic = sourceEntries.filter((entry) => {
    const text = `${entry.title}\n${entry.content}`;
    return /(推荐系统|广告算法|数据库方面|产品方面)/.test(text)
      && !/(图像|视觉|视频|检测|分割|点云|三维|OpenCV|卷积|PyTorch|多模态|自动驾驶|神经网络|深度学习|GAN|强化学习|生成式模型|人工智能)/i.test(text);
  });
  assert.equal(pureOffTopic.length, 0);
  assert.ok(new Set(sourceEntries.map((entry) => entry.category)).size >= 7);
});
