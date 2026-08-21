import test from 'node:test';
import assert from 'node:assert/strict';

import {
  markProposalSaved,
  removeProposal,
  updateProposal,
} from '../src/utils/aiProposalMessages.js';

const makeMessages = () => [
  { sender: 'user', text: 'Add breakfast and gym' },
  {
    sender: 'ai',
    text: 'I drafted two events.',
    items: [
      { kind: 'proposal', proposal: { title: 'Breakfast' } },
      { kind: 'proposal', proposal: { title: 'Gym' } },
    ],
  },
];

test('cancel removes only the selected proposal', () => {
  const messages = removeProposal(makeMessages(), 1, 1);

  assert.equal(messages[1].items.length, 1);
  assert.equal(messages[1].items[0].proposal.title, 'Breakfast');
});

test('cancel updates the message text for what is left', () => {
  const messages = removeProposal(makeMessages(), 1, 1);

  assert.equal(messages[1].text, 'Please review this item:');
});

test('cancel leaves a note when the last proposal is cancelled', () => {
  const oneItem = removeProposal(makeMessages(), 1, 1);
  const bothCancelled = removeProposal(oneItem, 1, 0);

  assert.equal(bothCancelled[1].items.length, 0);
  assert.equal(bothCancelled[1].text, 'Suggestion canceled.');
});

test('confirm marks only the selected proposal as saved', () => {
  const messages = markProposalSaved(makeMessages(), 1, 0);

  assert.equal(messages[1].items[0].isSaved, true);
  assert.equal(messages[1].items[1].isSaved, undefined);
  assert.equal(messages[1].items[1].proposal.title, 'Gym');
});

test('edit updates only the selected proposal', () => {
  const updatedProposal = {
    title: 'Evening Gym',
    priority: 'high',
  };

  const messages = updateProposal(makeMessages(), 1, 1, updatedProposal);
  assert.deepEqual(messages[1].items[1].proposal, updatedProposal);
  assert.equal(messages[1].items[0].proposal.title, 'Breakfast');
});

test('edit does not mutate the original messages', () => {
  const originalMessages = makeMessages();
  updateProposal(originalMessages, 1, 1, { title: 'Evening Gym' });
  assert.equal(originalMessages[1].items[1].proposal.title, 'Gym');
});