import test from 'node:test';
import assert from 'node:assert/strict';

import {
  setLastMessageId,
  toChatMessages,
  toSavedItems,
} from '../src/utils/aiHistoryMessages.js';

const savedUserMessage = {
  id: 'b1d0f1a2-0000-4000-8000-000000000001',
  conversationId: 'c1d0f1a2-0000-4000-8000-000000000009',
  sender: 'user',
  text: 'Add a study session tomorrow from 6 to 7:30 PM',
  items: [],
  createdAt: '2026-08-17T01:00:00.000Z',
  updatedAt: '2026-08-17T01:00:00.000Z',
};

const savedAiMessage = {
  id: 'b1d0f1a2-0000-4000-8000-000000000002',
  conversationId: 'c1d0f1a2-0000-4000-8000-000000000009',
  sender: 'ai',
  text: 'Review these items:',
  items: [
    {
      kind: 'proposal',
      proposal: { title: 'Study session', itemType: 'event' },
      missingFields: [],
      question: null,
      isSaved: true,
    },
  ],
  createdAt: '2026-08-17T01:00:05.000Z',
  updatedAt: '2026-08-17T01:00:05.000Z',
};

test('keeps the id, sender, text, and items the chat needs', () => {
  const messages = toChatMessages([savedUserMessage, savedAiMessage]);

  assert.equal(messages.length, 2);
  assert.deepEqual(messages[0], {
    id: 'b1d0f1a2-0000-4000-8000-000000000001',
    sender: 'user',
    text: 'Add a study session tomorrow from 6 to 7:30 PM',
    items: [],
  });
  assert.equal(messages[1].id, 'b1d0f1a2-0000-4000-8000-000000000002');
  assert.equal(messages[1].sender, 'ai');
  assert.equal(messages[1].items[0].isSaved, true);
});

test('drops the database fields the chat does not render', () => {
  const [message] = toChatMessages([savedUserMessage]);

  assert.deepEqual(Object.keys(message), ['id', 'sender', 'text', 'items']);
  assert.equal(message.conversationId, undefined);
  assert.equal(message.createdAt, undefined);
});

test('returns an empty list when there is no history', () => {
  assert.deepEqual(toChatMessages([]), []);
  assert.deepEqual(toChatMessages(undefined), []);
  assert.deepEqual(toChatMessages(null), []);
});

test('fills in missing text and items so the chat can render safely', () => {
  const [message] = toChatMessages([
    { id: 'b1d0f1a2-0000-4000-8000-000000000003', sender: 'ai' },
  ]);

  assert.equal(message.text, '');
  assert.deepEqual(message.items, []);
});

test('does not save conflicts or free slots with a proposal', () => {
  const [savedItem] = toSavedItems([
    {
      kind: 'proposal',
      proposal: { title: 'Study session', itemType: 'event' },
      missingFields: [],
      question: null,
      isSaved: false,
      conflicts: [{ id: 7, title: 'Weekly team sync' }],
      freeSlots: [{ start: '2026-08-18T13:00:00.000Z' }],
    },
  ]);

  assert.deepEqual(Object.keys(savedItem), [
    'kind',
    'proposal',
    'missingFields',
    'question',
    'isSaved',
  ]);
  assert.equal(savedItem.conflicts, undefined);
  assert.equal(savedItem.freeSlots, undefined);
  assert.equal(savedItem.proposal.title, 'Study session');
});

test('keeps the question on a clarification and the saved flag on a proposal', () => {
  const items = toSavedItems([
    {
      kind: 'clarification',
      proposal: null,
      missingFields: ['startAt', 'endAt'],
      question: 'What time does soccer practice start and end?',
    },
    {
      kind: 'proposal',
      proposal: { title: 'Gym', itemType: 'event' },
      missingFields: [],
      question: null,
      isSaved: true,
    },
  ]);

  assert.equal(items[0].question, 'What time does soccer practice start and end?');
  assert.deepEqual(items[0].missingFields, ['startAt', 'endAt']);
  assert.equal(items[0].isSaved, false);
  assert.equal(items[1].isSaved, true);
});

test('returns an empty item list when there are no items', () => {
  assert.deepEqual(toSavedItems(undefined), []);
  assert.deepEqual(toSavedItems([]), []);
});

test('puts the saved id on the last message only', () => {
  const messages = [
    { sender: 'user', text: 'Add gym tomorrow at 6' },
    { sender: 'ai', text: 'Review these items:', items: [] },
  ];

  const updated = setLastMessageId(messages, 'aaaa-bbbb');

  assert.equal(updated[0].id, undefined);
  assert.equal(updated[1].id, 'aaaa-bbbb');
  assert.equal(messages[1].id, undefined);
});

test('leaves an empty chat alone', () => {
  assert.deepEqual(setLastMessageId([], 'aaaa-bbbb'), []);
});
