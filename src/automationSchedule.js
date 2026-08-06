const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));

export function normalizePostFrequency(settings = {}) {
  const postFrequencyUnit = settings.postFrequencyUnit === 'hour' ? 'hour' : 'day';
  return {
    ...settings,
    postFrequencyUnit,
    postsPerDay: Math.round(clamp(settings.postsPerDay ?? 3, 1, 24)),
    postsPerHour: Math.round(clamp(settings.postsPerHour ?? 1, 1, 12)),
  };
}

export function intervalMs(settings = {}) {
  const normalized = normalizePostFrequency(settings);
  const count = normalized.postFrequencyUnit === 'hour' ? normalized.postsPerHour : normalized.postsPerDay / 24;
  return (60 * 60 * 1000) / Math.max(1 / 24, count);
}

export function frequencyLabel(settings = {}) {
  const normalized = normalizePostFrequency(settings);
  return normalized.postFrequencyUnit === 'hour'
    ? `每小时 ${normalized.postsPerHour} 篇`
    : `每天 ${normalized.postsPerDay} 篇`;
}
