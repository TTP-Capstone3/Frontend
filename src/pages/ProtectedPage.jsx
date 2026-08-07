import MyCalendar from '../components/Calendar';
import Organizer from '../components/Organizer';
import ScheduleItemModal from '../components/ScheduleItemModal';
import { useState } from 'react';
import '../App.css';

// The main page once logged in. Organizer on the left, calendar filling the
// rest — both share the same schedule data. Stacks on small screens, side by
// side from `md` up.
export default function ProtectedPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <section className="protected-layout">
        <Organizer />

        <MyCalendar />
      </section>

      <div className="planner-main">
        <div className="planner-toolbar">
          <button type="button" onClick={() => setIsCreateModalOpen(true)}>
            + Add item
          </button>
        </div>
      </div>

      {isCreateModalOpen && (
        <ScheduleItemModal onClose={() => setIsCreateModalOpen(false)}/>
      )}

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
