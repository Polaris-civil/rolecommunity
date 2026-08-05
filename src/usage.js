const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : 0;
};

export function normalizeTokenUsage(raw = {}, model = '') {
  const promptTokens = numberValue(raw.prompt_tokens ?? raw.input_tokens ?? raw.promptTokens);
  const completionTokens = numberValue(raw.completion_tokens ?? raw.output_tokens ?? raw.completionTokens);
  const totalTokens = numberValue(raw.total_tokens ?? raw.totalTokens) || promptTokens + completionTokens;
  return {
    promptTokens,
    completionTokens,
    totalTokens,
    model: String(model || raw.model || '').trim(),
  };
}

export function emptyUsage() {
  return {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    requests: 0,
    measuredRequests: 0,
    fallbackRequests: 0,
    lastRequestAt: '',
    lastModel: '',
    byModel: {},
  };
}

export function recordTokenUsage(store, usage, context = 'generation') {
  const current = { ...emptyUsage(), ...(store.usage || {}) };
  const normalized = normalizeTokenUsage(usage, usage?.model);
  const model = normalized.model || '未命名模型';
  const modelCurrent = { ...(current.byModel?.[model] || {}) };
  current.totalTokens += normalized.totalTokens;
  current.promptTokens += normalized.promptTokens;
  current.completionTokens += normalized.completionTokens;
  current.requests += 1;
  current.measuredRequests += normalized.totalTokens > 0 ? 1 : 0;
  current.lastRequestAt = new Date().toISOString();
  current.lastModel = model;
  current.byModel = {
    ...current.byModel,
    [model]: {
      model,
      totalTokens: (modelCurrent.totalTokens || 0) + normalized.totalTokens,
      promptTokens: (modelCurrent.promptTokens || 0) + normalized.promptTokens,
      completionTokens: (modelCurrent.completionTokens || 0) + normalized.completionTokens,
      requests: (modelCurrent.requests || 0) + 1,
      lastRequestAt: current.lastRequestAt,
    },
  };
  current.lastContext = context;
  store.usage = current;
  return current;
}

export function recordFallbackUsage(store) {
  const current = { ...emptyUsage(), ...(store.usage || {}) };
  current.fallbackRequests += 1;
  store.usage = current;
  return current;
}

export function summarizeUsage(store) {
  const usage = { ...emptyUsage(), ...(store?.usage || {}) };
  return {
    ...usage,
    models: Object.values(usage.byModel || {}).sort((a, b) => b.totalTokens - a.totalTokens),
  };
}
