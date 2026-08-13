import test from 'node:test';
import assert from 'node:assert/strict';

import { requestScheduleProposal } from '../src/api/ai.js';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('sends the message and time zone to the AI endpoint', async () => {
  let request;
  const responseBody = {
    reply: 'I found two events.',
    items: [{ kind: 'proposal' }, { kind: 'proposal' }],
  };

  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => responseBody,
    };
  };

  const result = await requestScheduleProposal(
    'Add breakfast and a study session',
    'America/New_York',
  );

  assert.equal(request.url, 'http://localhost:8080/ai/schedule-proposal');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.credentials, 'include');
  assert.deepEqual(JSON.parse(request.options.body), {
    message: 'Add breakfast and a study session',
    timeZone: 'America/New_York',
  });
  assert.equal(result.items.length, 2);
});

test('shows a safe message when the AI request fails', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 502 });

  await assert.rejects(
    requestScheduleProposal('Add breakfast', 'America/New_York'),
    /The AI could not answer right now/,
  );
});

test('rejects an unexpected AI response', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ reply: 'Missing the items array.' }),
  });

  await assert.rejects(
    requestScheduleProposal('Add breakfast', 'America/New_York'),
    /unexpected response/,
  );
});
