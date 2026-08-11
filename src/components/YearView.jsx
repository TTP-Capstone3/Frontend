import startOfYear from 'date-fns/startOfYear';
import endOfYear from 'date-fns/endOfYear';
import eachMonthOfInterval from 'date-fns/eachMonthOfInterval';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import isSameMonth from 'date-fns/isSameMonth';
import isSameDay from 'date-fns/isSameDay';
import addYears from 'date-fns/addYears';
import subYears from 'date-fns/subYears';
import format from 'date-fns/format';

// one small month box inside the year grid
function MonthMini({ month, events, onSelectDay }) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="year-view-month">
      <p className="year-view-month-title">{format(month, 'MMMM')}</p>
      <div className="year-view-days">
        {days.map((day) => {
          const dayHasEvents = events.some((event) => isSameDay(event.start, day));
          const outsideMonth = !isSameMonth(day, month);

          return (
            <button
              key={day.toString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`year-view-day${outsideMonth ? ' is-outside' : ''}${dayHasEvents ? ' has-events' : ''}`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// shows all 12 months, click a day to jump to that day's view
export default function YearView({ date, events, onNavigate, onView }) {
  const months = eachMonthOfInterval({
    start: startOfYear(date),
    end: endOfYear(date),
  });

  function goToDay(day) {
    onNavigate('DATE', day);
    onView('day');
  }

  return (
    <div className="year-view">
      {months.map((month) => (
        <MonthMini key={month.toString()} month={month} events={events} onSelectDay={goToDay} />
      ))}
    </div>
  );
}

// react-big-calendar needs these to handle the date range, prev/next, and the title
YearView.range = (date) => [startOfYear(date), endOfYear(date)];

YearView.navigate = (date, action) => {
  if (action === 'PREV') return subYears(date, 1);
  if (action === 'NEXT') return addYears(date, 1);
  return date;
};

YearView.title = (date) => format(date, 'yyyy');
