import sourceEntries from './assets/ai-algorithm-knowledge.json';

let cached;

export function createBuiltinKnowledge() {
  if (cached) return cached.map((entry) => ({ ...entry, tags: [...entry.tags] }));
  cached = sourceEntries;
  return cached.map((entry) => ({ ...entry, tags: [...entry.tags] }));
}
