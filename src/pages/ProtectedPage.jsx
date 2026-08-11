import MyCalendar from '../components/Calendar';
import Organizer from '../components/Organizer';
import Chat from '../components/Chat';
import ScheduleItemModal from '../components/ScheduleItemModal';
import { importCalendar, exportCalendar } from '../api/ics_import_export';
import { useState, useRef } from 'react';
import '../App.css';
import { useSchedule } from '../context/ScheduleContext';

// The main page once logged in. Organizer on the left, calendar filling the
export default function ProtectedPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null)

  const fileInputRef = useRef(null)
  const { refreshItems } = useSchedule()

  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [icsMessage, setIcsMessage] = useState(null)

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
  
  async function handleImport(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsImporting(true);
      setIcsMessage(null);

      const result = await importCalendar(file);
      await refreshItems();

      setIcsMessage(`Imported ${result.importedCount} event(s). ` + `${result.skippedCount} skipped.`);
    } catch (error) {
      setIcsMessage(error.message);
    } finally {
      setIsImporting(false);
      // Allows selecting the same file again later.
      input.value = '';
    }
  }

  async function handleExport() {
    try {
      setIsExporting(true);
      setIcsMessage(null);

      const blob = await exportCalendar();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = 'calendar.ics';

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(downloadUrl);

      setIcsMessage('Calendar exported successfully.');
    } catch (error) {
      setIcsMessage(error.message);
    } finally {
      setIsExporting(false);
    }
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
        {/* Import Button */}
        <input type="button" className="ics-toolbar-button"
          ref={fileInputRef}
          type="file"
          accept=".ics,text/calendar"
          hidden
          onChange={handleImport}
        />

        <button
          type="button"
          className="ics-toolbar-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? 'Importing...' : 'Import .ics'}
        </button> 


        {/* Export Button */}
        <button
          type="button"
          className="ics-toolbar-button"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export .ics'}
        </button>
      </div>
    </>

  );
}
