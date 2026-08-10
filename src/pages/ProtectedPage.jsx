import MyCalendar from '../components/Calendar';
import Organizer from '../components/Organizer';
import Chat from '../components/Chat';
import ScheduleItemModal from '../components/ScheduleItemModal';
import { useState } from 'react';
import '../App.css';

// The main page once logged in. Organizer on the left, calendar filling the
export default function ProtectedPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null)

  // Opens the schedule-item modal for adding a new schedule item.
  function openCreateModal() {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  // Opens the schedule-item modal when an item is already selected prefilling its fields.
  function openEditModal(item) {
    setEditingItem(item)
    setIsModalOpen(true)
  }
  
  // Closes the modal.
  function closeModal() {
    setEditingItem(null)
    setIsModalOpen(false)
  }

  return (
    <>
      <section className="protected-layout">
        <Organizer 
          onAddItem={openCreateModal}
          onEditItem={openEditModal}
        />

        <MyCalendar 
          onEditItem={openEditModal}
        />

        <Chat />
      </section>
      
      {isModalOpen && (
        <ScheduleItemModal 
          itemToEdit={editingItem}
          onClose={closeModal}
        />
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
