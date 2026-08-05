import { postTypeLabels } from './promptTemplates.js';
import { isQuestionComment } from './replyRouting.js';

function hashSeed(value) {
  let hash = 0;
  for (const char of String(value || 'rolecommunity')) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

function choose(items, seed, offset = 0) {
  return items[hashSeed(`${seed}:${offset}`) % items.length];
}

function cleanTitle(value) {
  return String(value || '')
    .replace(/[？?。！!]/g, '')
    .replace(/^[#>*\-\s]+/, '')
    .replace(/^\d+(?:\.\d+)*[.、)）]?\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function clip(value, length = 68) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function plainText(value) {
  return String(value || '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function headlineCandidates(content) {
  return String(content || '')
    .split(/\n+/)
    .flatMap((line) => plainText(line).split(/[。！？!?；;]+/))
    .map((line) => line.replace(/^\d+(?:\.\d+)*[.、)）]?\s*/, '').trim())
    .filter((line) => line.length >= 7)
    .filter((line) => !/^(目录|来源|整理|网页链接|点击进入|招聘岗位|面经汇总)/.test(line))
    .map((line) => clip(line, 30));
}

function isGenericTitle(title) {
  return !title || title.length < 5 || /面经汇总|基础知识点|项目相关知识点|数据结构与算法分析|编程高频问题|其他方面|综合题库/.test(title);
}

function deriveHeadline({ knowledge, seed }) {
  const title = cleanTitle(knowledge?.title);
  const candidates = headlineCandidates(knowledge?.content);
  const topic = isGenericTitle(title)
    ? choose(candidates.length ? candidates : [title || '这个知识点'], seed, 2)
    : title.replace(/^.*·\s*/, '').trim();
  const cue = choose(candidates.filter((candidate) => candidate !== topic), seed, 3) || topic;
  const compactTopic = topic.replace(/(?:通用|相关)?知识点$/g, '').replace(/方面$/g, '').trim() || topic;
  const compactCue = cue.split(/[，,。:：?？；;]/)[0].trim() || cue;
  return { topic: clip(compactTopic, 28), cue: clip(compactCue, 18) };
}

function finishHeadline(value) {
  return clip(String(value || '').replace(/\s+/g, ' ').trim(), 54);
}

export function createCatchyTitle({ knowledge, role, type = 'discussion', variationSeed } = {}) {
  const sourceTitle = cleanTitle(knowledge?.title);
  const seed = variationSeed || `${knowledge?.id || sourceTitle}:${role?.id || role?.nickname || 'role'}:${type}`;
  const headline = deriveHeadline({ knowledge, seed });
  const isBeginner = role?.postMode === 'question' || role?.requiresQa;
  if (isBeginner) return finishHeadline(choose(beginnerTitleVariants, seed)(headline));
  const variants = titleVariants[type] || titleVariants.discussion;
  const titleBuilder = role?.id === 'role-student' ? choose(studentTitleVariants, seed) : choose(variants, seed);
  return finishHeadline(titleBuilder(headline));
}

export function ensureCatchyTitle({ generated, knowledge, role, type = 'discussion', variationSeed } = {}) {
  const candidate = finishHeadline(generated?.title);
  const sourceTitle = cleanTitle(knowledge?.title);
  const weak = !candidate
    || candidate === sourceTitle
    || candidate.length < 10
    || /知识点总结|学习笔记|面经汇总|基础知识点|项目相关知识点|通用知识点|资料整理|未命名/.test(candidate);
  return weak ? createCatchyTitle({ knowledge, role, type, variationSeed }) : candidate;
}

const titleVariants = {
  discussion: [
    ({ topic, cue }) => `我差点把「${topic}」答反了，关键在${cue}`,
    ({ topic }) => `「${topic}」只背定义不够，我现在先问这一个问题`,
    ({ topic }) => `为什么「${topic}」一换场景就容易错？`,
    ({ topic }) => `面试追问「${topic}」时，我不会先背答案了`,
    ({ topic }) => `别急着背「${topic}」，真正拉开差距的是边界`,
    ({ topic, cue }) => `我用「${cue}」这个角度，终于把「${topic}」讲明白了`,
  ],
  tutorial: [
    ({ topic }) => `把「${topic}」讲人话：先判断什么，再决定怎么答`,
    ({ topic, cue }) => `「${topic}」的关键不在结论，答案藏在${cue}`,
    ({ topic }) => `「${topic}」怎么落地？关键是按执行顺序拆一遍`,
    ({ topic }) => `一张判断清单：遇到「${topic}」先看哪里`,
    ({ topic, cue }) => `从「${cue}」出发，重新捋清「${topic}」`,
  ],
  interview: [
    ({ topic }) => `面试官追问「${topic}」时，我先确认这一点`,
    ({ topic }) => `「${topic}」这题，真正难的是追问不是定义`,
    ({ topic }) => `如果只会背「${topic}」，这一步很容易答偏`,
    ({ topic }) => `我把「${topic}」按面试现场重新走了一遍`,
    ({ topic, cue }) => `从「${cue}」开始，面试里怎么讲清「${topic}」`,
  ],
  question: [
    ({ topic }) => `求助：「${topic}」这里到底先看什么？`,
    ({ topic }) => `「${topic}」的结论怎么来的？我想补上中间一步`,
    ({ topic }) => `我是不是把「${topic}」理解得太绝对了？`,
    ({ topic }) => `关于「${topic}」，谁能帮我检查一下这条思路？`,
  ],
};

const studentTitleVariants = [
  ({ topic }) => `救命！「${topic}」换个问法我就不会了`,
  ({ topic }) => `救命！我终于发现「${topic}」最容易错的地方`,
  ({ topic }) => `救命！面试追问「${topic}」，我卡在这一句`,
  ({ topic }) => `救命！「${topic}」不是背熟就会，我被反例绊住了`,
];

const beginnerTitleVariants = [
  ({ topic }) => `求助：「${topic}」这里到底先看什么？`,
  ({ topic }) => `求助：我在「${topic}」这一步卡住了`,
  ({ topic }) => `求助：是不是我把「${topic}」想复杂了？`,
  ({ topic }) => `求助：第一次遇到「${topic}」，应该先看哪儿？`,
];

const discussionBodies = [
  ({ title, content }) => `我最近重新整理“${title}”时，发现自己以前记住的只是一个名词。真正让我停下来的是：资料里的这段话其实在提醒我，前提和结果不能混着背。

${content}

我现在会先把它拆成两步：第一步确认条件，第二步再看结论能不能成立。这样遇到换个问法的题，至少不会只剩下关键词。

我还在验证一个边界：如果前提发生变化，原来的判断还要不要跟着变？这可能比把定义再背一遍更值得花时间。`,
  ({ title, content }) => `这条知识点我看过很多次，直到今天才意识到自己一直把“是什么”和“什么时候用”混在一起。

## 我原来怎么想的

我下意识会把“${title}”当成一句固定结论，看到相关题目就想直接套进去。

## 重新捋一遍

${content}

现在回头看，关键不是多记一个术语，而是先问：它解决的到底是哪一类问题？这个问题想清楚，后面的细节才有位置放。`,
  ({ title, content }) => `记录一个今天差点被自己绕进去的地方：我以为“${title}”只要会复述就算掌握，结果一换到具体场景就说不清了。

资料里的核心内容是：

${content}

我会把它留成一个小检查单：先看输入和前提，再沿着实际过程走一遍，最后找一个反例确认自己没有把范围说大。读到这里的你，如果只能补充一个容易误用的场景，会选哪个？`,
  ({ title, content }) => `如果有人只给我一分钟解释“${title}”，我现在不会从定义开始背了。我会先说它为什么值得被单独拿出来讨论，再补上最容易漏掉的限制。

${content}

这次整理给我的感觉是，知识点难的不是字面，而是知道什么时候不能照搬。我的理解还没有完全定型，尤其想再确认资料里的边界应该怎么落到实际判断里。`,
  ({ title, content }) => `把“${title}”放进自己的学习记录里，先留一个不那么标准的版本：我目前能讲清主线，但细节一多还是会乱。

${content}

我准备下一次复习时只做一件事：不看原文，先把判断顺序写出来，再回来对照哪里漏了。比从头到尾再读一遍更容易发现问题。`,
];

const beginnerBodies = [
  ({ title, content }) => `我刚开始碰“${title}”，先把目前能看懂的部分贴出来，免得自己越想越乱：

${content}

## 我卡住的地方

我不确定这里的前提和结论应该怎么对应。资料里的话我能复述，但如果换一个具体场景，我就不知道第一步该看什么。有人能用自己的话帮我走一遍吗？`,
  ({ title, content }) => `小白来留个问题。我看到“${title}”时，以为它只是一个需要记住的结论，读下去才发现前后还有条件。

## 我目前的理解

${content}

## 我卡住的地方

到底应该先判断条件，还是先套这个结论？我怕自己背会了句子，却没有真的会用，想请大家指出我漏掉的那一步。`,
  ({ title, content }) => `这道题我真的有点绕进去，先发出来求确认：

${content}

## 我卡住的地方

我现在说不清“${title}”和相邻概念的区别，也不知道资料里的边界在题目里怎么体现。回答不用太长，能告诉我应该从哪个判断开始就很有帮助了。`,
  ({ title, content }) => `第一次认真看“${title}”，我的理解可能不太对，先把疑问写下来。

## 我目前的理解

${content}

## 我卡住的地方

这里如果换一种问法，结论还成立吗？我不想只抄答案，想知道大家遇到这类题时会先检查哪个条件。`,
];

const beginnerQuestions = [
  ({ title }) => `我先问一个最基础的：${title} 里这个结论成立的前提是什么？我现在能背出来，但不知道题目换个场景后该从哪里判断。`,
  ({ title }) => `我卡在${title}的“为什么”上了。资料里的结论我看懂了，可中间那一步总觉得跳得太快，有人能按自己的思路补一下吗？`,
  ({ title }) => `如果只给出一个具体场景，${title}应该先看哪个条件？我怕自己把相邻概念混在一起，想确认一下判断顺序。`,
  ({ title }) => `我是不是把${title}理解得太绝对了？什么时候它不能直接套用，资料里这部分我还没有完全想明白。`,
  ({ title }) => `有没有人愿意帮我检查一下${title}的思路？我知道最后的结论，但还说不清每一步为什么这样走。`,
];

export function mockGeneratePost({ knowledge, role, type = 'discussion', variationSeed } = {}) {
  const title = cleanTitle(knowledge.title);
  const seed = variationSeed || `${knowledge.id || title}:${role.id || role.nickname}:${type}:${Date.now()}:${Math.random()}`;
  const isBeginner = role.postMode === 'question' || role.requiresQa;
  if (isBeginner) {
    const bodyBuilder = choose(beginnerBodies, seed, 1);
    const body = bodyBuilder({ title, content: knowledge.content });
    return {
      title: createCatchyTitle({ knowledge, role, type, variationSeed: seed }),
      body,
      excerpt: clip(body.split('\n').find((line) => line.trim()) || `刚开始学“${title}”，我有一个具体疑问想请教大家。`, 100),
      category: knowledge.category,
      tags: [...new Set([...(knowledge.tags || []), '求知帖'])],
      postType: postTypeLabels.question,
    };
  }

  const bodyBuilder = choose(discussionBodies, seed, 1);
  const body = bodyBuilder({ title, content: knowledge.content });
  return {
    title: createCatchyTitle({ knowledge, role, type, variationSeed: seed }),
    body,
    excerpt: clip(body.split('\n').find((line) => line.trim()) || knowledge.content, 100),
    category: knowledge.category,
    tags: [...(knowledge.tags || [])],
    postType: postTypeLabels[type] || postTypeLabels.discussion,
  };
}

export function generateFallbackQuestion({ knowledge, variationSeed } = {}) {
  const seed = variationSeed || `${knowledge.id || knowledge.title}:${Date.now()}:${Math.random()}`;
  return choose(beginnerQuestions, seed)({ title: cleanTitle(knowledge.title) });
}

const communityCommentVariants = {
  explain: [
    ({ topic, source }) => `补一个我踩过的坑：${topic}真正容易混的不是定义，而是前提。帖子里这段“${source}”放回实际流程里看，会更容易判断什么时候能直接用。`,
    ({ topic, source }) => `我会把${topic}记成一个小检查顺序：先看输入和条件，再看中间过程，最后核对结果。你这里提到的“${source}”正好是最容易漏掉的一步。`,
  ],
  question: [
    ({ topic }) => `想请教一下：如果${topic}的输入条件发生变化，原来的结论还成立吗？我现在能跟着正文走，但换个场景就不太确定了。`,
    ({ topic }) => `我也在学${topic}，有个小疑问：实际排查时应该先看哪个信号？如果有人有一套判断顺序，想跟着练一遍。`,
  ],
  extend: [
    ({ topic }) => `顺着这个思路再往前一步，我会把${topic}和线上监控、数据分布一起看。离线指标漂亮，不代表换了输入或延迟约束后仍然成立。`,
    ({ topic }) => `这个角度还可以延伸到工程取舍：${topic}的结论落地时，通常还要同时考虑成本、稳定性和失败后的降级路径。`,
  ],
};

export function generateCommunityComment({ post, knowledge, kind = 'explain', variationSeed } = {}) {
  const seed = variationSeed || `${post?.id || post?.title}:${knowledge?.id || knowledge?.title}:${kind}`;
  const topic = clip(cleanTitle(post?.title || knowledge?.title).replace(/[「」]/g, ''), 24);
  const source = clip(plainText(knowledge?.content || post?.body || post?.excerpt), 34);
  const variants = communityCommentVariants[kind] || communityCommentVariants.explain;
  return choose(variants, seed)({ topic: topic || '这个知识点', source: source || '正文里的关键条件' });
}

const replyVariants = [
  ({ topic, quote }) => `你提到“${quote}”很关键。我会先把它放回${topic}的前提里看，再判断这个结论能不能直接套用。`,
  ({ topic, quote }) => `我也被“${quote}”这一步绕过。把${topic}按执行顺序写出来，前后关系会清楚很多。`,
  ({ topic, quote }) => `这个理解基本对，不过要补一个边界：别把${topic}的结论当成所有场景都成立。`,
  ({ topic, quote }) => `如果只背这类题的定义，确实容易混。可以先说清它解决的问题，再回头看细节。`,
  ({ topic, quote }) => `我会换个角度看：你说的“${quote}”更像结果，真正要追的是它前面的条件。`,
  ({ topic, quote }) => `你这个追问让我想到一个小练习：把${topic}的过程逐步写出来，哪一步不确定就从那里查。`,
];

const questionReplyVariants = [
  ({ topic, quote, context }) => `你问的“${quote}”得回到帖子正文里的这句：“${context}”。先确认这里的前提，再判断${topic}的结论能不能直接套用。`,
  ({ topic, quote, context }) => `结合正文提到的“${context}”，你卡住的地方其实在判断顺序：先看条件是否满足，再看${topic}最后会落到什么结果。`,
  ({ topic, quote, context }) => `这个问题不能只背结论。帖子里“${context}”已经给了一个线索，你可以先沿着它检查前提，再处理“${quote}”这一步。`,
  ({ topic, quote, context }) => `我会这样拆“${quote}”：正文先说明了“${context}”，所以第一步不是直接套答案，而是确认当前场景是否满足这个条件。`,
];

export function generateFallbackReply({ post, comment, role, knowledge, variationSeed } = {}) {
  const seed = variationSeed || `${post.id || post.title}:${comment.id || comment.content}:${role.id || role.nickname}`;
  const quote = clip(comment.content, 24).replace(/[“”"']/g, '');
  const topic = post.category ? `${post.category}这块` : cleanTitle(post.title).split(/[：:，,?？]/)[0].slice(0, 20);
  const context = clip(plainText([post.body || post.excerpt, knowledge?.content].filter(Boolean).join(' 资料补充：')), 120);
  if (isQuestionComment(comment.content) && context) {
    return choose(questionReplyVariants, seed)({ topic, quote, context });
  }
  return choose(replyVariants, seed)({ topic, quote });
}

const answerOpeners = [
  '我先把它说成一句人话：',
  '按资料里的逻辑，这里可以先抓住一个核心：',
  '你卡住的地方应该在“前提”这一步，简单拆开就是：',
  '我理解你的疑问，先不要急着背定义，可以这样看：',
  '这题我会先回答结论，再补原因：',
];

const answerClosers = [
  '真正容易错的是把这个范围说大，遇到变体时记得回头检查条件。',
  '所以先确认条件，再往下推，比直接背一句话更稳。',
  '如果你愿意继续练，可以拿一个具体例子按这个顺序走一遍。',
  '你可以先用自己的话复述一次，看看是哪一步还接不上。',
  '这也是为什么资料里要把它单独拎出来讲。',
];

export function generateFallbackKnowledgeAnswer({ post, knowledge, role, variationSeed } = {}) {
  const seed = variationSeed || `${post.id || post.title}:${knowledge.id || knowledge.title}:${role.id || role.nickname}`;
  const source = clip(plainText(knowledge.content), 158);
  const answer = `${choose(answerOpeners, seed)}${source}${source.endsWith('。') ? '' : '。'}${choose(answerClosers, seed, 1)}`;
  return answer.length > 240 ? `${answer.slice(0, 237)}…` : answer;
}
