import test from 'node:test';
import assert from 'node:assert/strict';
import { getRecurringStarts, MAX_OCCURRENCES } from '../src/utils/recurrence.js';

test('keeps recurring event time consistent across DST', () => {
    const item = {
        id: 1,
        startAt: '2026-10-26T14:00:00.000Z',
        timeZone: 'America/New_York',
        recurrenceRule: 'FREQ=WEEKLY;COUNT=3',
    };

    const occurrences = getRecurringStarts(item,
        new Date('2026-10-25T00:00:00.000Z'),
        new Date('2026-11-10T23:59:59.999Z'),
    );

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: false,
    });

    assert.deepEqual(occurrences.map((date) => formatter.format(date)), ['10', '10', '10']);
});

test('limits recurring occurrences', () => {
    const item = {
        id: 2,
        startAt: '2026-08-01T04:00:00.000Z',
        timeZone: 'America/New_York',
        recurrenceRule: 'FREQ=MINUTELY',
    };

    const occurrences = getRecurringStarts(item,
        new Date('2026-08-01T00:00:00.000Z'),
        new Date('2026-08-02T23:59:59.999Z'),
    );

    assert.equal(occurrences.length, MAX_OCCURRENCES);
});