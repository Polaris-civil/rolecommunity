import {
  buildKnowledgeAnswerSystemPrompt,
  buildKnowledgeAnswerUserPrompt,
  buildPostSystemPrompt,
  buildPostUserPrompt,
  buildReplySystemPrompt,
  buildReplyUserPrompt,
  createVariationBrief,
} from '../src/promptTemplates.js';
import { isQuestionComment } from '../src/replyRouting.js';
import {
  ensureCatchyTitle,
  generateFallbackKnowledgeAnswer,
  generateFallbackReply,
  mockGeneratePost,
} from '../src/humanGenerator.js';

export { mockGeneratePost } from '../src/humanGenerator.js';

function parseJsonObject(value) {
  const match = value.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('模型未返回 JSON 对象');
  return JSON.parse(match[0]);
}

async function callModel(messages, { json = false, temperature = 0.86 } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || 'deepseek-v4-flash';
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`模型请求失败 (${response.status}): ${detail.slice(0, 180)}`);
  }

  const payload = await response.json();
  return {
    output: payload.choices?.[0]?.message?.content || '',
    usage: payload.usage || {},
    model,
  };
}

export async function generatePost(input) {
  const variation = input.variation || createVariationBrief({ recentTitles: input.recentTitles || [] });
  const promptInput = { ...input, variation };
  try {
    const result = await callModel([
      {
        role: 'system',
        content: buildPostSystemPrompt(promptInput),
      },
      {
        role: 'user',
        content: buildPostUserPrompt(promptInput),
      },
    ], { json: true, temperature: 0.92 });
    if (result) input.onUsage?.({ ...(result.usage || {}), model: result.model });
    if (!result?.output) {
      input.onFallback?.();
      return { ...mockGeneratePost({ ...input, variationSeed: variation.seed }), source: 'demo' };
    }
    const generated = parseJsonObject(result.output);
    return {
      ...generated,
      title: ensureCatchyTitle({ generated, knowledge: input.knowledge, role: input.role, type: input.type, variationSeed: variation.seed }),
      source: 'llm',
    };
  } catch (error) {
    input.onFallback?.();
    return { ...mockGeneratePost({ ...input, variationSeed: variation.seed }), source: 'demo', fallbackReason: error.message };
  }
}

export async function generateReply({ post, comment, parentComment, role, recentReplies = [], knowledge, isThreadReply = false, onUsage, onFallback }) {
  const variation = createVariationBrief({ kind: 'reply', recentReplies });
  const question = isQuestionComment(comment.content) || Boolean(parentComment);
  try {
    const result = await callModel([
      {
        role: 'system',
        content: buildReplySystemPrompt({ role, variation, isQuestion: question, isThreadReply }),
      },
      {
        role: 'user',
        content: buildReplyUserPrompt({ post, comment, parentComment, knowledge, recentReplies: variation.recentReplies }),
      },
    ], { temperature: 0.9 });
    if (result) onUsage?.({ ...(result.usage || {}), model: result.model });
    if (result?.output) return result.output.trim();
  } catch {
    // The local response keeps the interaction usable if the configured model is unavailable.
  }

  onFallback?.();
  return generateFallbackReply({ post, comment, parentComment, role, knowledge, variationSeed: variation.seed });
}

export async function generateKnowledgeAnswer({ post, knowledge, role, onUsage, onFallback }) {
  const variation = createVariationBrief({ kind: 'answer' });
  try {
    const result = await callModel([
      {
        role: 'system',
        content: buildKnowledgeAnswerSystemPrompt({ role, variation }),
      },
      {
        role: 'user',
        content: buildKnowledgeAnswerUserPrompt({ post, knowledge }),
      },
    ], { temperature: 0.84 });
    if (result) onUsage?.({ ...(result.usage || {}), model: result.model });
    if (result?.output) return result.output.trim();
  } catch {
    // Keep the required Q&A available when the configured model is unavailable.
  }
  onFallback?.();
  return generateFallbackKnowledgeAnswer({ post, knowledge, role });
}
