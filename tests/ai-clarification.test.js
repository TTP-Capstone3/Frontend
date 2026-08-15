import test from 'node:test';
import assert from 'node:assert/strict';

import {
  combineClarificationRequest,
  getAiResponseText,
  hasClarification,
  MAX_AI_MESSAGE_LENGTH,
} from '../src/utils/aiClarification.js';

test('combines the original request with a follow-up answer', () => {
  const message = combineClarificationRequest(
    '  Add a meeting tomorrow  ',
    '  3 PM to 4 PM  ',
  );

  assert.equal(
    message,
    'Add a meeting tomorrow\nAdditional details: 3 PM to 4 PM',
  );
});

test('keeps earlier answers when another clarification is needed', () => {
  const firstFollowUp = combineClarificationRequest(
    'Add a meeting tomorrow',
    '3 PM to 4 PM',
  );
  const secondFollowUp = combineClarificationRequest(
    firstFollowUp,
    'Use the conference room',
  );

  assert.equal(
    secondFollowUp,
    'Add a meeting tomorrow\nAdditional details: 3 PM to 4 PM\nAdditional details: Use the conference room',
  );
});

test('recognizes a clarification in an AI response', () => {
  const items = [
    { kind: 'proposal' },
    { kind: 'clarification', question: 'What time?' },
  ];

  assert.equal(hasClarification(items), true);
  assert.equal(hasClarification([{ kind: 'proposal' }]), false);
  assert.equal(hasClarification(null), false);
});

test('does not repeat the AI reply when a clarification is shown', () => {
  const items = [
    { kind: 'clarification', question: 'What time is the meeting?' },
  ];

  assert.equal(getAiResponseText(items), '');
});

test('uses a short message for schedule proposals', () => {
  assert.equal(getAiResponseText([{ kind: 'proposal' }]), 'Review this item:');
  assert.equal(
    getAiResponseText([{ kind: 'proposal' }, { kind: 'proposal' }]),
    'Review these 2 items:',
  );
});

test('requires both parts of a clarification request', () => {
  assert.throws(
    () => combineClarificationRequest('Add a meeting tomorrow', '   '),
    /required/,
  );
});

test('rejects a combined message that is too long', () => {
  const longRequest = 'a'.repeat(MAX_AI_MESSAGE_LENGTH);

  assert.throws(
    () => combineClarificationRequest(longRequest, '3 PM'),
    /too long/,
  );
});
