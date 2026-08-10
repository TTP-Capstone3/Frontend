import MyCalendar from '../components/Calendar';
import Organizer from '../components/Organizer';
import Chat from '../components/Chat';
import ScheduleItemModal from '../components/ScheduleItemModal';
import { useState } from 'react';
import '../App.css';

// The main page once logged in. Organizer on the left, calendar filling the
export default function ProtectedPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <section className="protected-layout">
        <Organizer onAddItem={() => setIsCreateModalOpen(true)}/>

        <MyCalendar />
        <Chat />
      </section>
      
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
