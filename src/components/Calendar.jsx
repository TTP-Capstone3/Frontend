// middle panel - grid, tags, agenda strip

import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
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
// wrap Calendar once so drag/resize handlers become available
const DnDCalendar = withDragAndDrop(Calendar);

export default function MyCalendar() {
    const [view, setView] = useState('month'); // month/week/day toggle
    const [date, setDate] = useState(new Date()); // currently focused date
    const { scheduleItems, updateItem } = useSchedule();

    // map schedule items -> RBC event shape, skipping items with no date at all
    const events = scheduleItems
        .filter((item) => item.startAt || item.dueAt)
        .map((item) => ({
            id: item.id,
            title: item.title,
            start: new Date(item.startAt || item.dueAt), // fall back to due date if no start
            end: new Date(item.endAt || item.startAt || item.dueAt), // default to a zero-length event
            allDay: item.allDay,
        }));

    // persist new time when an event is dragged to a different slot
    const onEventDrop = ({ event, start, end }) => {
        updateItem(event.id, { startAt: start, endAt: end });
    };

    return (
        <div className="calendar-panel">
            <DnDCalendar
                localizer={localizer}
                events={events}
                onEventDrop={onEventDrop}
                views={['month', 'week', 'day']}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                resizable
                draggableAccessor={() => true} // every event can be dragged
            />
        </div>
    );
}