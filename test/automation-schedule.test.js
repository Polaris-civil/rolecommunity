import assert from 'node:assert/strict';
import test from 'node:test';
import { frequencyLabel, intervalMs, normalizePostFrequency } from '../src/automationSchedule.js';

test('automation schedule supports hourly and daily frequencies', () => {
  const daily = normalizePostFrequency({ postsPerDay: 3 });
  assert.equal(daily.postFrequencyUnit, 'day');
  assert.equal(frequencyLabel(daily), '每天 3 篇');
  assert.equal(intervalMs(daily), 24 * 60 * 60 * 1000 / 3);

  const hourly = normalizePostFrequency({ postFrequencyUnit: 'hour', postsPerHour: 2 });
  assert.equal(frequencyLabel(hourly), '每小时 2 篇');
  assert.equal(intervalMs(hourly), 30 * 60 * 1000);
});
