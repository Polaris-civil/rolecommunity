import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractKnowledge } from '../server/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceFiles = [
  { file: 'src/assets/ai-algorithm-interviews-vol1.md', part: '上册', source: 'AI算法岗面经-武林秘籍上册.md' },
  { file: 'src/assets/ai-algorithm-interviews.md', part: '中册', source: 'AI算法岗面经-武林秘籍中册.md' },
  { file: 'src/assets/ai-algorithm-interviews-vol3.md', part: '下册', source: 'AI算法岗面经-武林秘籍下册.md' },
];

const genericTitles = new Set([
  '面经汇总资料',
  '基础知识点',
  '项目相关知识点',
  '数据结构与算法分析',
  '编程高频问题',
  '操作系统与数据库',
  '技术产品及开放性问题',
]);

function clip(value, limit = 42) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function normalizeContent(value) {
  const lines = String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/[\t\u00a0]+/g, ' ').replace(/ {2,}/g, ' ').trimEnd());
  const output = [];
  for (const line of lines) {
    if (!line.trim()) {
      if (output.at(-1) !== '') output.push('');
      continue;
    }
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    const previous = output.at(-1) || '';
    if (bullet && /^\s*[-*+]\s+/.test(previous) && bullet[1].length <= 14 && !/[。！？!?；;]$/.test(bullet[1])) {
      output[output.length - 1] = `${previous}${bullet[1]}`;
    } else if (previous && previous !== '' && !/^\s*(?:[-*+]\s+|#{1,6}\s|>|```|\|)/.test(line) && !/^\s*(?:[-*+]\s+|#{1,6}\s|>|```|\|)/.test(previous)) {
      output[output.length - 1] = `${previous} ${line.trim()}`;
    } else {
      output.push(line.trim());
    }
  }
  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function firstUsefulLine(content) {
  return content
    .split('\n')
    .map((line) => line.replace(/^\s*>\s*/, '').replace(/^\s*[-*+]\s*/, '').replace(/^\s*\d+[.、)]\s*/, '').replace(/[*_`]/g, '').trim())
    .find((line) => line && !/^来源|整理|点击进入|网页链接/.test(line)) || '';
}

const entries = [];
for (const source of sourceFiles) {
  const text = await readFile(path.join(root, source.file), 'utf8');
  const extracted = extractKnowledge(text, source.source);
  for (const entry of extracted) {
    const content = normalizeContent(entry.content);
    const title = String(entry.title || '').trim();
    if (!content || title === '目录' || title.startsWith('AI算法岗面经武林秘籍')) continue;
    if (content.replace(/[-*#>\s]/g, '').length < 18) continue;

    const sectionParts = String(entry.section || '').split(' / ').filter(Boolean);
    const company = sectionParts[1] || entry.group || '综合题库';
    const section = sectionParts.slice(2).join(' / ') || sectionParts.at(-1) || '综合';
    const baseTitle = title.replace(/（续）$/, '').trim();
    const needsContextTitle = genericTitles.has(baseTitle) || title.endsWith('（续）');
    const displayTitle = needsContextTitle
      ? `${baseTitle} · ${clip(firstUsefulLine(content), 34) || '重点整理'}`
      : baseTitle;
    const stableIndex = String(entries.length + 1).padStart(4, '0');
    const item = {
      id: `builtin-ai-v2-${stableIndex}`,
      title: displayTitle,
      content,
      category: 'AI',
      tags: [...new Set(['AI算法岗', '面试', ...(entry.tags || [])])].slice(0, 6),
      group: company,
      section,
      company,
      part: source.part,
      source: source.source,
      status: 'pending',
      createdAt: '2026-08-01T00:00:00.000Z',
    };
    entries.push(item);
  }
}

await writeFile(path.join(root, 'src/assets/ai-algorithm-knowledge.json'), `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Built ${entries.length} knowledge entries from ${sourceFiles.length} volumes.`);
