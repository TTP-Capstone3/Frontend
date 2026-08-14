import MyCalendar from '../components/Calendar';
import Organizer from '../components/Organizer';
import Chat from '../components/Chat';
import ScheduleItemModal from '../components/ScheduleItemModal';
import { importCalendar, exportCalendar } from '../api/ics_import_export';
import { useState, useRef } from 'react';
import '../App.css';
import { useSchedule } from '../context/ScheduleContext';

// The main page once logged in. Organizer on the left, calendar filling the
// Panels shown by the bottom nav once the layout collapses to one at a time.
const TABS = [
  { key: 'organizer', label: 'Organizer' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'chat', label: 'Chat' },
];

export default function ProtectedPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null)
  const [activeTab, setActiveTab] = useState('calendar')
  const [filters, setFilters] = useState({search: '', type: 'all', priority: 'all', status: 'all'});

  const fileInputRef = useRef(null)
  const { scheduleItems, refreshItems } = useSchedule()

  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [icsMessage, setIcsMessage] = useState(null)

  function handleSearchChange(value) {
    setFilters((filters) => ({...filters, search: value}));
  }

  function handleToggleFilter(name, value) {
    setFilters((filters) => {
      const selected = filters[name];
      const newValues = selected.includes(value)
        ? selected.filter((selectedValue) => selectedValue !== value)
        : [...selected, value];

      return {...filters, [name]: newValues};
    });
  }

  function clearFilters() {
    setFilters({search: '', types: [], priorities: []});
  }

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

  const filteredItems = scheduleItems.filter((item) => {
    const search = filters.search.trim().toLowerCase();
    const matchesSearch = !search || item.title?.toLowerCase().includes(search) || item.description?.toLowerCase().includes(search);
    const matchesType = filters.type === 'all' || item.itemType === filters.type;
    const matchesPriority = filters.priority === 'all' || (item.priority || 'none') === filters.priority;
    const matchesStatus = filters.status === 'all' || (item.status || 'active') === filters.status;
    return (matchesSearch && matchesType && matchesPriority && matchesStatus);
  });

  const icsToolbar = (
    <div className="ics-toolbar">
      {/* Import Button */}
      <input className="ics-toolbar-button"
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

      {icsMessage && (
        <p className="ics-message" role="status" aria-live="polite">
          {icsMessage}
        </p>
      )}
    </div>
  );

  return (
    <>
      <section className="protected-layout" data-active-tab={activeTab}>
        <Organizer
          scheduleItems={filteredItems}
          filters={filters}
          onSearchChange={handleSearchChange}
          onToggleFilter={handleToggleFilter}
          onClearFilters={clearFilters}
          onAddItem={openCreateModal}
          onEditItem={openEditModal}
          toolbar={icsToolbar}
        />

        <MyCalendar
          scheduleItems={filteredItems}
          onEditItem={openEditModal}
        />

        <Chat />
      </section>

      <nav className="bottom-nav" aria-label="Panel navigation">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`bottom-nav-button${activeTab === tab.key ? ' is-active' : ''}`}
            aria-current={activeTab === tab.key ? 'page' : undefined}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {isModalOpen && (
        <ScheduleItemModal
          itemToEdit={editingItem}
          onClose={closeModal}
        />
      )}
    </>

  );
}
