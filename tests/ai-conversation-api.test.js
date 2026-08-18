import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadAiMessages,
  saveAiMessage,
  updateAiMessageItems,
} from '../src/api/aiConversation.js';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function makeResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test('loads saved AI messages for the current user', async () => {
  let request;
  const messages = [
    {
      id: 'message-1',
      sender: 'user',
      text: 'Add soccer practice tomorrow',
      items: [],
    },
  ];

  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return makeResponse({ messages });
  };

  const result = await loadAiMessages();

  assert.equal(request.url, 'http://localhost:8080/ai/conversation/messages');
  assert.equal(request.options.credentials, 'include');
  assert.deepEqual(result, messages);
});

test('saves one AI conversation message', async () => {
  let request;
  const message = {
    sender: 'user',
    text: 'Add soccer practice tomorrow',
    items: [],
  };
  const savedMessage = { id: 'message-1', ...message };

  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return makeResponse(savedMessage, 201);
  };

  const result = await saveAiMessage(message);

  assert.equal(request.url, 'http://localhost:8080/ai/conversation/messages');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.credentials, 'include');
  assert.equal(request.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(request.options.body), message);
  assert.deepEqual(result, savedMessage);
});

test('updates the proposal items in a saved AI message', async () => {
  let request;
  const items = [
    {
      kind: 'proposal',
      proposal: { title: 'Soccer practice' },
      isSaved: true,
    },
  ];
  const updatedMessage = {
    id: 'message-1',
    sender: 'ai',
    text: 'Review this item:',
    items,
  };

  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return makeResponse(updatedMessage);
  };

  const result = await updateAiMessageItems('message-1', items);

  assert.equal(
    request.url,
    'http://localhost:8080/ai/conversation/messages/message-1',
  );
  assert.equal(request.options.method, 'PATCH');
  assert.equal(request.options.credentials, 'include');
  assert.deepEqual(JSON.parse(request.options.body), { items });
  assert.deepEqual(result, updatedMessage);
});

test('shows a login message when the session expired', async () => {
  globalThis.fetch = async () => makeResponse({ error: 'Unauthorized' }, 401);

  await assert.rejects(loadAiMessages(), /Please log in again/);
});

test('shows backend validation details when a message is invalid', async () => {
  globalThis.fetch = async () =>
    makeResponse(
      {
        error: 'Invalid AI message.',
        details: ['Text must be a string.'],
      },
      400,
    );

  await assert.rejects(
    saveAiMessage({ sender: 'user', text: null }),
    /Text must be a string/,
  );
});

test('shows a safe message when the backend cannot be reached', async () => {
  globalThis.fetch = async () => {
    throw new Error('Network failed');
  };

  await assert.rejects(loadAiMessages(), /Could not connect to the AI history/);
});

test('rejects an unexpected history response', async () => {
  globalThis.fetch = async () => makeResponse({ messages: 'not an array' });

  await assert.rejects(loadAiMessages(), /unexpected response/);
});
