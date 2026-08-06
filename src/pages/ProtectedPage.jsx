import MyCalendar from '../components/Calendar';
import Organizer from '../components/Organizer';
import '../App.css';

// The main page once logged in. Organizer on the left, calendar filling the
// rest — both share the same schedule data. Stacks on small screens, side by
// side from `md` up.
export default function ProtectedPage() {
  return (
    <>
      <section className="protected-layout">
        <Organizer />
        <MyCalendar />
      </section>
      <div className="ics-toolbar">
        <button type="button" className="ics-toolbar-button">
          Import .ics
        </button>
        <button type="button" className="ics-toolbar-button">
          Export .ics
        </button>
      </div>
    </>

  );
}
