import { useEffect, useRef, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import DragAndDropAddon from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import { useSchedule } from '../context/ScheduleContext';

// date-fns adapter required by react-big-calendar
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const withDragAndDrop = DragAndDropAddon.default ?? DragAndDropAddon;
// Wrap Calendar so drag/resize handlers become available.
const DnDCalendar = withDragAndDrop(Calendar);

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

    // Map schedule items to RBC's event shape, skipping items with no date.
    const events = scheduleItems
        .filter((item) => item.startAt || item.dueAt)
        .map((item) => ({
            id: item.id,
            title: item.title,
            start: new Date(item.startAt || item.dueAt),
            end: new Date(item.endAt || item.startAt || item.dueAt),
            allDay: item.allDay,
            scheduleItem: item,
        }));

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
                views={['month', 'week', 'day']}
                view={view}
                onView={handleView}
                onNavigate={handleNavigate}
                date={date}
                messages={{ previous: '←', next: '→' }}
                resizable
                draggableAccessor={() => true} // all events are draggable
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