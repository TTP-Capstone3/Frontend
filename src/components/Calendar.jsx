import { useEffect, useRef, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import DragAndDropAddon from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import { useSchedule } from '../context/ScheduleContext';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { getRecurringStarts } from '../utils/recurrence';
import YearView from './YearView';
import ScheduleItemPopover from './ScheduleItemPopover';

// date-fns adapter required by react-big-calendar
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const withDragAndDrop = DragAndDropAddon.default ?? DragAndDropAddon;
// Wrap Calendar so drag/resize handlers become available.
const DnDCalendar = withDragAndDrop(Calendar);

// Renders a small colored dot before the title, sized by the item's priority.
// No dot when priority is unset ('none' or missing).
function EventWithPriority({ event }) {
    const priority = (event.scheduleItem?.priority || 'none').replace(' ', '-');
    return (
        <span className="rbc-event-inner">
            {priority !== 'none' && (
                <span className={`priority-dot priority-dot-${priority}`} aria-hidden="true" />
            )}
            <span className="rbc-event-inner-title">{event.title}</span>
        </span>
    );
}

// Colors each event block by type, and dims events that have already ended.
function eventPropGetter(event) {
    const itemType = event.scheduleItem?.itemType || 'event';
    const isPast = event.end < new Date();
    const className = `rbc-event-type-${itemType}${isPast ? ' rbc-event-past' : ''}`;
    return { className };
}

export default function MyCalendar({ scheduleItems = [], onEditItem }) {
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    const { updateItem, removeItem } = useSchedule();

    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedOccurrence, setSelectedOccurrence] = useState(null);
    const [popoverPosition, setPopoverPosition] = useState(null)

    const calendarRef = useRef(null)
    const popoverRef = useRef(null)

    function closePopover() {
        setSelectedItem(null);
        setSelectedOccurrence(null);
        setPopoverPosition(null);
    }

    async function handleDeleteItem(item) {
        if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) {
            return;
        }
        try {
            await removeItem(item.id);
            closePopover();
        } catch (err) {
            console.error('Could not delete item:', err.message);
        }
    }

    // When the selected item is no longer in scheduleItems close the popover.
    useEffect(() => {
        if (selectedItem && !scheduleItems.some((item) => item.id === selectedItem.id)) {
            setSelectedItem(null);
            setSelectedOccurrence(null);
            setPopoverPosition(null);
        }
    }, [scheduleItems, selectedItem]);

    // This function deselects schedule-items & popover when the mouse clicked anywhere else.
    useEffect(() => {
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                closePopover()
            }
        }
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [])

    // Returns the date range currently visible in the calendar.
    // Recurring events are only expanded inside this range so rules without
    // a specified end date do not display an infinite number of occurrences.
    function getVisibleRange(date, view) {
        if (view === 'day') {
            return { start: startOfDay(date), end: endOfDay(date) };
        } else if (view === 'week') {
            return { start: startOfWeek(date), end: endOfWeek(date) };
        } else if (view === 'year') {
            return { start: startOfYear(date), end: endOfYear(date) };
        }
        return { start: startOfWeek(startOfMonth(date)), end: endOfWeek(endOfMonth(date)) };
    }

    // Returns the date used to place each schedule item on the calendar.
    function getCalendarStart(item) {
        if (item.itemType === 'event') {
            return item.startAt;
        } else if (item.itemType === 'task') {
            return item.dueAt;
        } else if (item.itemType === 'reminder') {
            return item.reminderAt;
        } else {
            return null;
        }
    }

    // Returns a display end time for react-big-calendar.
    // Tasks and reminders only store one date, so their duration is visual only.
    function getCalendarEnd(item, start) {
        if (item.itemType === 'event' && item.endAt) {
            return new Date(item.endAt);
        }
        const durationMinutes = item.itemType === 'task' && item.estimatedMinutes
            ? item.estimatedMinutes
            : 30;
        return new Date(start.getTime() + durationMinutes * 60 * 1000);
    }

    // Converts one scheduleItem into the event shape required by RBC.
    // Keeps the original scheduleItem attached so selecting the calendar event
    // can still open the original item for editing.
    function makeCalendarEvent(item) {
        const start = new Date(getCalendarStart(item))
        return {
            id: item.id,
            title: item.title,
            start: start,
            end: getCalendarEnd(item, start),
            allDay: item.allDay,
            scheduleItem: item,
            isRecurringOccurrence: false,
        };
    }

    // Expand one recurring scheduleItem into temporary calendar events for the
    // currently visible range. These occurrences are only used for display and
    // the database still stores one single scheduleItem with its recurrenceRule.
    function makeRecurringEvents(item, rangeStart, rangeEnd) {
        if (!item.startAt || !item.recurrenceRule) {
            return [];
        }

        try {
            // Generate occurrences using the event's timezone and stop after
            // a safe maximum so dense recurrence rules cannot freeze the calendar.
            const occurrenceStarts = getRecurringStarts(item, rangeStart, rangeEnd);
            const originalStart = new Date(item.startAt);
            const originalEnd = item.endAt ? new Date(item.endAt) : originalStart;

            // Preserve the original event duration for every generated occurrence.
            const duration = originalEnd.getTime() - originalStart.getTime();

            return occurrenceStarts.map((occurStart) => ({
                id: `${item.id}-${occurStart.toISOString()}`,
                title: item.title,
                start: occurStart,
                end: new Date(occurStart.getTime() + duration),
                allDay: item.allDay,
                scheduleItem: item,
                isRecurringOccurrence: true,
            }),
            );
        } catch (error) {
            console.error(`Could not expand recurrence for item ${item.id}:`, error);
            // Fallback to the original event if an imported RRULE is invalid instead of hiding it.
            return [makeCalendarEvent(item)];
        }
    }

    const visibleRange = getVisibleRange(date, view);

    // Map schedule items to handle both RBC's event shape and recurring events.
    // Normal items create one calendar event while recurring items generate occurences.
    const events = scheduleItems
        .filter((item) => getCalendarStart(item))
        .flatMap((item) => {
            if (item.itemType === 'event' && item.recurrenceRule) {
                return makeRecurringEvents(item, visibleRange.start, visibleRange.end);
            }
            return [makeCalendarEvent(item)];
        });

    // Save the new time when an event is dragged to a different slot.
    const onEventDrop = ({ event, start, end }) => {
        const item = event.scheduleItem;
        if (event.isRecurringOccurrence) {
            return;
        }

        let changes = {};
        if (item.itemType === 'event') {
            changes = {
                startAt: start.toISOString(),
                endAt: end.toISOString(),
            };
        } else if (item.itemType === 'task') {
            changes = {
                dueAt: start.toISOString(),
            };
        } else if (item.itemType === 'reminder') {
            changes = {
                reminderAt: start.toISOString(),
            };
        } else {
            return;
        }

        updateItem(item.id, changes).catch((err) =>
            console.error('Could not save the moved item:', err.message),
        );
    };

    // Handles the resizing of events on the calendar and updates their date and time.
    const onEventResize = ({ event, start, end }) => {
        const item = event.scheduleItem;
        if (item.itemType !== 'event' || event.isRecurringOccurrence) {
            return;
        }

        updateItem(item.id, { startAt: start.toISOString(), endAt: end.toISOString() })
            .catch((err) =>
                console.error('Could not resize the event:', err.message),
            );
    };

    function handleSelectEvent(event, mouseEvent) {
        const eventRect = mouseEvent.currentTarget.getBoundingClientRect();
        const calendarRect = calendarRef.current.getBoundingClientRect();
        const popoverWidth = 280;
        const gap = 8;

        let left = (eventRect.left - calendarRect.left + eventRect.width / 2 - popoverWidth / 2);
        const top = eventRect.bottom - calendarRect.top + gap;
        left = Math.max(gap, left);

        if (left + popoverWidth > calendarRect.width - gap) {
            left = calendarRect.width - popoverWidth - gap;
        }

        setSelectedItem(event.scheduleItem);
        setSelectedOccurrence({ start: event.start, end: event.end });
        setPopoverPosition({ top, left: Math.max(gap, left) });
    }

    function handleCalendarMouseDown(event) {
        if (popoverRef.current && popoverRef.current.contains(event.target)) {
            return;
        }
        closePopover()
    }

    function handleNavigate(newDate) {
        setDate(newDate);
        closePopover();
    }

    function handleView(newView) {
        setView(newView);
        closePopover();
    }

    return (
        <div ref={calendarRef} className="calendar-panel" onMouseDownCapture={handleCalendarMouseDown}>
            <DnDCalendar
                localizer={localizer}
                events={events}
                onEventDrop={onEventDrop}
                onEventResize={onEventResize}
                views={{ year: YearView, month: true, week: true, day: true }}
                view={view}
                onView={handleView}
                onNavigate={handleNavigate}
                date={date}
                messages={{ previous: '←', next: '→', year: 'Year' }}
                dayLayoutAlgorithm="no-overlap"
                showMultiDayTimes
                resizable
                resizableAccessor={(event) => event.scheduleItem?.itemType === 'event' && !event.isRecurringOccurrence}
                draggableAccessor={(event) => !event.isRecurringOccurrence} // all events are draggable except recurring ones (for now)
                components={{ event: EventWithPriority }}
                eventPropGetter={eventPropGetter}
                onSelectEvent={handleSelectEvent}
            />

            {selectedItem && popoverPosition && (
                <ScheduleItemPopover
                    item={selectedItem}
                    occurrence={selectedOccurrence}
                    position={popoverPosition}
                    popoverRef={popoverRef}
                    onClose={closePopover}
                    onEdit={onEditItem}
                    onDelete={handleDeleteItem}
                />
            )}
        </div>
    );
}
