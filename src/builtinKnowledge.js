import sourceEntries from './assets/ai-algorithm-knowledge.json' with { type: 'json' };
import financeEntries from './assets/financial-knowledge.json' with { type: 'json' };

let cached;

export function createBuiltinKnowledge() {
  if (cached) return cached.map((entry) => ({ ...entry, tags: [...entry.tags] }));
  cached = [...sourceEntries, ...financeEntries];
  return cached.map((entry) => ({ ...entry, tags: [...entry.tags] }));
}
