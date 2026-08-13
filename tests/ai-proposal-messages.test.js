import test from 'node:test';
import assert from 'node:assert/strict';

import {
  markProposalSaved,
  removeProposal,
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

test('confirm marks only the selected proposal as saved', () => {
  const messages = markProposalSaved(makeMessages(), 1, 0);

  assert.equal(messages[1].items[0].isSaved, true);
  assert.equal(messages[1].items[1].isSaved, undefined);
  assert.equal(messages[1].items[1].proposal.title, 'Gym');
});
