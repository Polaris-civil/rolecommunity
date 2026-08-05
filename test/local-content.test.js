import test from 'node:test';
import assert from 'node:assert/strict';
import { extractKnowledgeLocal, inferCategory, inferTags } from '../src/localContent.js';

test('mobile content extraction keeps headings and classifies entries', () => {
  const entries = extractKnowledgeLocal('# TCP 网络\n\nTCP 连接通过握手建立可靠的数据传输。', '网络.md');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].title, 'TCP 网络');
  assert.equal(entries[0].category, '网络');
  assert.equal(entries[0].source, '网络.md');
  assert.equal(entries[0].status, 'pending');
});

test('mobile category and tag inference match technical notes', () => {
  assert.equal(inferCategory('React 与 JavaScript 状态更新'), '前端');
  assert.deepEqual(inferTags('React JavaScript MySQL'), ['JavaScript', 'React', 'MySQL']);
});
