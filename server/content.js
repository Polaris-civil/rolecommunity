import { randomUUID } from 'node:crypto';

const stripNoise = (value) =>
  value
    .replace(/\r/g, '')
    .replace(/[\t\u00a0]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function splitKnowledgeSections(cleaned) {
  const units = [];
  let current = { path: [], lines: [] };
  let path = [];
  const flush = () => {
    if (current.lines.join('\n').trim()) units.push(current);
  };

  for (const line of cleaned.split('\n')) {
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flush();
      const level = heading[1].length;
      path = path.slice(0, level - 1);
      path.push(heading[2].trim());
      current = { path: [...path], lines: [line] };
    } else {
      current.lines.push(line);
    }
  }
  flush();

  return units.flatMap((unit) => {
    const raw = unit.lines.join('\n').trim();
    const chunks = raw.length <= 900 ? [raw] : raw.split(/\n{2,}/).reduce((result, paragraph) => {
      const last = result.at(-1);
      if (last && `${last}\n\n${paragraph}`.length <= 900) result[result.length - 1] = `${last}\n\n${paragraph}`;
      else result.push(paragraph);
      return result;
    }, []);
    return chunks.map((text, index) => ({ text: stripNoise(text), path: unit.path, continuation: index > 0 }));
  });
}

export function extractKnowledge(text, source = '手动录入') {
  const cleaned = stripNoise(text);
  if (!cleaned) return [];

  const sections = splitKnowledgeSections(cleaned)
    .filter(({ text: section }) => section.replace(/^#{1,4}\s+.+(?:\n|$)/, '').replace(/[-*#>\s]/g, '').length >= 8);

  return sections.map(({ text: section, path, continuation }, index) => {
    const heading = path.at(-1) || section.match(/^#{1,4}\s+(.+)$/m)?.[1];
    const firstSentence = section.split(/[。！？!?\n]/)[0].replace(/^\s*[-*]\s*/, '').replace(/^\d+[.、]\s*/, '').trim();
    const baseTitle = (heading || firstSentence || `知识点 ${index + 1}`).slice(0, 48);
    const title = continuation ? `${baseTitle}（续）` : baseTitle;
    const content = section.replace(/^#{1,4}\s+.+(?:\n|$)/, '').trim();

    return {
      id: `know-${randomUUID()}`,
      title,
      content,
      category: inferCategory(`${title} ${content}`),
      tags: inferTags(`${title} ${content}`),
      group: path.length > 1 ? path[1] : (path[0] || '未分类'),
      section: path.join(' / ') || '未分类',
      status: 'pending',
      source,
      createdAt: new Date().toISOString(),
    };
  });
}

export function inferCategory(text) {
  const categories = [
    ['前端', /JavaScript|TypeScript|React|Vue|CSS|浏览器|DOM|前端/i],
    ['数据库', /MySQL|PostgreSQL|数据库|SQL|索引|事务/i],
    ['架构', /Redis|缓存|分布式|微服务|并发|架构|消息队列/i],
    ['网络', /HTTP|TCP|网络|DNS|协议/i],
    ['AI', /AI|大模型|LLM|RAG|提示词|向量/i],
    ['算法', /算法|复杂度|动态规划|二叉树|链表/i],
  ];
  return categories.find(([, pattern]) => pattern.test(text))?.[0] || '通识';
}

export function inferTags(text) {
  const candidates = ['JavaScript', 'TypeScript', 'React', 'Vue', 'MySQL', 'Redis', 'HTTP', 'TCP', 'RAG', '大模型', '算法', '面试', '系统设计'];
  const tags = candidates.filter((tag) => text.toLowerCase().includes(tag.toLowerCase())).slice(0, 3);
  return tags.length ? tags : [inferCategory(text)];
}
