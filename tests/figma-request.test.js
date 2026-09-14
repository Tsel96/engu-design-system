const { test } = require('node:test');
const assert = require('node:assert/strict');
const { retryFigmaRequest } = require('../scripts/figma-request');

test('Figma rate limit honors Retry-After and retries the same read', async () => {
  let calls = 0; const delays = [];
  const value = await retryFigmaRequest(async () => {
    if (++calls === 1) throw Object.assign(new Error('limited'), { statusCode: 429, retryAfter: '90' });
    return { complete: true };
  }, { sleep: async ms => delays.push(ms), log() {} });
  assert.deepEqual(value, { complete: true });
  assert.equal(calls, 2); assert.deepEqual(delays, [90000]);
});

test('transient failures stop after bounded exponential retries', async () => {
  const delays = []; let calls = 0;
  await assert.rejects(retryFigmaRequest(async () => {
    calls++; throw Object.assign(new Error('unavailable'), { statusCode: 503 });
  }, { maxRetries: 2, sleep: async ms => delays.push(ms), log() {} }), /unavailable/);
  assert.equal(calls, 3); assert.deepEqual(delays, [60000, 120000]);
});

test('expired credentials fail immediately without retrying', async () => {
  let calls = 0;
  await assert.rejects(retryFigmaRequest(async () => {
    calls++; throw Object.assign(new Error('expired'), { statusCode: 401 });
  }, { sleep: async () => assert.fail('must not retry') }), /expired/);
  assert.equal(calls, 1);
});
