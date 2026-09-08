import test from 'node:test';
import assert from 'node:assert/strict';
import { qualification, matchScore, ASTRA_OVERRIDE, type Factor } from '../src/common/domain.ts';
import { scopeSchema, responseSchema, publicUrl } from '../src/common/validation.ts';
const factors = (values: number[]): Factor[] =>
  (['funding', 'competitive', 'history', 'team'] as const).map((key, i) => ({
    key,
    label: key,
    rating: values[i],
    status: values[i] ? 'supported' : 'unknown',
    reason: 'Fixture',
    sourceIds: values[i] ? ['source'] : [],
  }));
test('Astra stays pinned with high reasoning and native web', () => {
  assert.equal(ASTRA_OVERRIDE.model, 'gpt-6-astra');
  assert.equal(ASTRA_OVERRIDE.config.reasoning_effort, 'high');
  assert.deepEqual(ASTRA_OVERRIDE.config.tools, ['web_search']);
});
test('qualification is weighted evidence, not a probability', () => {
  assert.deepEqual(qualification(factors([5, 4, 5, 4])), { score: 0.92, qualified: true });
  assert.deepEqual(qualification(factors([0, 0, 0, 0])), { score: 0, qualified: false });
});
test('one strong signal does not qualify a sponsor', () => {
  assert.equal(qualification(factors([5, 0, 0, 0])).qualified, false);
});
test('unknown or contradicted claims never add qualification points', () => {
  const input = factors([5, 5, 0, 0]);
  input[0].status = 'unknown';
  input[1].status = 'contradicted';
  assert.deepEqual(qualification(input), { score: 0, qualified: false });
});
test('event matching weights audience most strongly', () => {
  assert.equal(
    matchScore({
      city: { rating: 5, reason: '' },
      audience: { rating: 4, reason: '' },
      vertical: { rating: 5, reason: '' },
    }),
    0.92,
  );
});
test('run validation rejects an invalid date, reversed scope, or oversized discovery', () => {
  assert.equal(scopeSchema.safeParse({ from: '2026-99-20' }).success, false);
  assert.equal(scopeSchema.safeParse({ from: '2026-10-10', to: '2026-10-01' }).success, false);
  assert.equal(scopeSchema.safeParse({ newLimit: 6 }).success, false);
});
test('empty CoHost response is valid; non-events and invented date shapes are not', () => {
  assert.equal(responseSchema.safeParse({ count: 0, events: [] }).success, true);
  assert.equal(
    responseSchema.safeParse({ count: 1, events: [{ title: 'Incomplete' }] }).success,
    false,
  );
});
test('research citations cannot use script or private-network URLs', () => {
  assert.throws(() => publicUrl('javascript:alert(1)'));
  assert.throws(() => publicUrl('http://127.0.0.1/a'));
  assert.throws(() => publicUrl('https://service.internal/path'));
  assert.equal(publicUrl('https://example.com/press').hostname, 'example.com');
});
