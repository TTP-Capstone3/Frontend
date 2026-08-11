import { RRule } from 'rrule';

export const MAX_OCCURRENCES = 250;
const DEFAULT_TIME_ZONE = 'America/New_York';

// Convert the stored date into the event's local clock time for RRule.
function toRRuleDate(value, timeZone) {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        })
        .formatToParts(new Date(value))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    );

    return new Date(Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second),
    ));
}

// Convert the visible calendar range into the date format RRule expects.
function toRRuleBoundary(date) {
    return new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
    ));
}

// Convert RRule's returned date into a normal browser-local Date.
function fromRRuleDate(date) {
    return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
    );
}

export function getRecurringStarts(item, rangeStart, rangeEnd) {
    const timeZone = item.timeZone || DEFAULT_TIME_ZONE;

    const options = RRule.parseString(item.recurrenceRule);
    options.dtstart = toRRuleDate(item.startAt, timeZone);
    options.tzid = timeZone;

    const rule = new RRule(options);

    return rule
        .between(
            toRRuleBoundary(rangeStart),
            toRRuleBoundary(rangeEnd),
            true,
            (_date, index) => index < MAX_OCCURRENCES,
        )
        .map(fromRRuleDate);
}