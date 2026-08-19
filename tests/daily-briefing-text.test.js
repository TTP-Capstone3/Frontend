import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toBriefingText,
  toBriefingTitle,
} from '../src/utils/dailyBriefingText.js';

const briefing = {
  date: '2026-08-19',
  timeZone: 'America/New_York',
  counts: { overdue: 1, today: 2, upcoming: 0 },
  summary: 'You have one overdue task and two events today.',
  sections: [
    {
      key: 'overdue',
      title: 'Needs attention',
      headline: 'Lab report is late',
      items: [{ title: 'Turn in lab report' }],
    },
    {
      key: 'today',
      title: 'Today',
      headline: 'Busy afternoon',
      items: [{ title: 'Go running' }, { title: 'Pickleball' }],
    },
  ],
};

test('starts with the summary and lists each section', () => {
  assert.equal(
    toBriefingText(briefing),
    [
      'You have one overdue task and two events today.',
      'Needs attention: Turn in lab report',
      'Today: Go running, Pickleball',
    ].join('\n'),
  );
});

test('leaves out sections that have no items', () => {
  const text = toBriefingText({
    summary: 'Nothing is overdue.',
    sections: [
      { key: 'overdue', title: 'Needs attention', items: [] },
      { key: 'today', title: 'Today', items: [{ title: 'Dinner' }] },
    ],
  });

  assert.equal(text, 'Nothing is overdue.\nToday: Dinner');
});

test('shows just the summary when nothing is scheduled', () => {
  assert.equal(
    toBriefingText({ summary: 'You have nothing scheduled right now.', sections: [] }),
    'You have nothing scheduled right now.',
  );
});

test('returns an empty string for an unexpected response', () => {
  assert.equal(toBriefingText(null), '');
  assert.equal(toBriefingText(undefined), '');
  assert.equal(toBriefingText({}), '');
});

test('puts the date in the note title', () => {
  assert.equal(toBriefingTitle(briefing), 'Daily brief 2026-08-19');
});

test('falls back to a plain title when there is no date', () => {
  assert.equal(toBriefingTitle({}), 'Daily brief');
  assert.equal(toBriefingTitle(null), 'Daily brief');
});
