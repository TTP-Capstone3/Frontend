import MyCalendar from '../components/Calendar';
import Organizer from '../components/Organizer';
import Chat from '../components/Chat';
import '../App.css';

// The main page once logged in. Organizer on the left, calendar filling the
export default function ProtectedPage() {
  return (
    <>
      <section className="protected-layout">
        <Organizer />
        <MyCalendar />
        <Chat />
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
