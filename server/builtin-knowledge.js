import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourcePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/assets/ai-algorithm-knowledge.json');
const financePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/assets/financial-knowledge.json');
let cached;

export function createBuiltinKnowledge() {
  if (cached) return cached.map((entry) => ({ ...entry, tags: [...entry.tags] }));
  cached = [...JSON.parse(readFileSync(sourcePath, 'utf8')), ...JSON.parse(readFileSync(financePath, 'utf8'))];
  return cached.map((entry) => ({ ...entry, tags: [...entry.tags] }));
}
