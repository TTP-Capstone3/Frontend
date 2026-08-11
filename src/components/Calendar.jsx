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
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth} from 'date-fns';
import { getRecurringStarts  } from '../utils/recurrence';
import YearView from './YearView';

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

// Colors each event block by its item type (event/task/reminder/note).
function eventPropGetter(event) {
    const itemType = event.scheduleItem?.itemType || 'event';
    return { className: `rbc-event-type-${itemType}` };
}

export default function MyCalendar({ onEditItem }) {
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    const { scheduleItems, updateItem } = useSchedule();

    const [selectedItem, setSelectedItem] = useState(null);
    const calendarRef = useRef(null)

    // This function deselects schedule-items when the mouse clicked anywhere else.
    useEffect(() => {
        function handleClickOutside(event) {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setSelectedItem(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [])

    // Returns the date range currently visible in the calendar.
    // Recurring events are only expanded inside this range so rules without
    // a specified end date do not display an infinite number of occurrences.
    function getVisibleRange(date, view) {
        if (view === 'day') {
            return { start: startOfDay(date), end: endOfDay(date)};
        }
        if (view === 'week') {
            return { start: startOfWeek(date), end: endOfWeek(date)};
        }   
        return { start: startOfWeek(startOfMonth(date)), end: endOfWeek(endOfMonth(date))};
    }

    // Converts one scheduleItem into the event shape required by RBC.
    // Keeps the original scheduleItem attached so selecting the calendar event
    // can still open the original item for editing.
    function makeCalendarEvent(item) {
        return {
            id: item.id,
            title: item.title,
            start: new Date(item.startAt || item.dueAt),
            end: new Date(item.endAt || item.startAt || item.dueAt),
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
        .filter((item) => item.startAt || item.dueAt)
        .flatMap((item) => {
            if (item.itemType === 'event' && item.recurrenceRule) {
                return makeRecurringEvents(item, visibleRange.start, visibleRange.end);
            }
            return [makeCalendarEvent(item)];
    });

    // Save the new time when an event is dragged to a different slot.
    const onEventDrop = ({ event, start, end }) => {
        updateItem(event.id, { startAt: start, endAt: end }).catch((err) =>
            console.error('Could not save the moved event:', err.message),
        );
    };
    
    function handleNavigate(newDate) {
        setDate(newDate);
        setSelectedItem(null);
    }
    
    function handleView(newView) {
        setView(newView);
        setSelectedItem(null);
    }

    return (
        <div ref={calendarRef} className="calendar-panel">
            <DnDCalendar
                localizer={localizer}
                events={events}
                onEventDrop={onEventDrop}
                views={{ year: YearView, month: true, week: true, day: true }}
                view={view}
                onView={handleView}
                onNavigate={handleNavigate}
                date={date}
                messages={{ previous: '←', next: '→', year: 'Year' }}
                resizable
                draggableAccessor={() => true} // all events are draggable
                components={{ event: EventWithPriority }}
                eventPropGetter={eventPropGetter}
                onSelectEvent={(event) => setSelectedItem(event.scheduleItem)}
                onSelectSlot={() => setSelectedItem(null)}
            />

            {selectedItem && (
                <div className="calendar-selection-actions">
                    <span>{selectedItem.title}</span>
                    <button type="button" onClick={() => onEditItem(selectedItem)}> Edit </button>
                </div>
            )}
        </div>
    );
}
