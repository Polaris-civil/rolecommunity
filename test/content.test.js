import assert from 'node:assert/strict';
import test from 'node:test';
import { extractKnowledge, inferCategory, inferTags } from '../server/content.js';

test('extractKnowledge splits markdown headings into pending entries', () => {
  const entries = extractKnowledge(`# 事件循环

Promise 回调进入微任务队列，定时器回调进入宏任务队列。

# 联合索引

MySQL 联合索引按照定义顺序排列，查询需要考虑最左匹配。`, '面试题.md');

  assert.equal(entries.length, 2);
  assert.equal(entries[0].title, '事件循环');
  assert.equal(entries[0].status, 'pending');
  assert.equal(entries[0].source, '面试题.md');
  assert.equal(entries[1].category, '数据库');
});

test('category and tag inference recognize common technical topics', () => {
  assert.equal(inferCategory('浏览器中的 JavaScript 和 React 渲染'), '前端');
  assert.equal(inferCategory('MySQL 事务与联合索引'), '数据库');
  assert.deepEqual(inferTags('React 与 JavaScript 面试题'), ['JavaScript', 'React', '面试']);
});

test('extractKnowledge drops heading-only sections and keeps section hierarchy', () => {
  const entries = extractKnowledge('# 总目录\n\n## 事件循环\n\nPromise 回调属于微任务。', '资料.md');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].group, '事件循环');
  assert.equal(entries[0].section, '总目录 / 事件循环');
  assert.equal(entries[0].content, 'Promise 回调属于微任务。');
});
