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
  const [createItemType, setCreateItemType] = useState('task')
  const [activeTab, setActiveTab] = useState('calendar')
  const [filters, setFilters] = useState({ search: '', types: [], priorities: [] });
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const fileInputRef = useRef(null)
  const chatRef = useRef(null)
  const { scheduleItems, refreshItems } = useSchedule()

  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [icsMessage, setIcsMessage] = useState(null)
  // Mirrors Chat's daily-brief loading state so the button living next to
  // import/export can show the right label without owning the brief logic.
  const [dailyBriefState, setDailyBriefState] = useState({ isBriefing: false, disabled: false })

  function handleSearchChange(value) {
    setFilters((filters) => ({ ...filters, search: value }));
  }

  function handleToggleFilter(name, value) {
    setFilters((filters) => {
      const selected = filters[name];
      const newValues = selected.includes(value)
        ? selected.filter((selectedValue) => selectedValue !== value)
        : [...selected, value];

      return { ...filters, [name]: newValues };
    });
  }

  function clearFilters() {
    setFilters({ search: '', types: [], priorities: [] });
  }

  // Opens the schedule-item modal; `type` pre-selects the item type (e.g. 'note').
  function openCreateModal(type = 'task') {
    setEditingItem(null)
    setCreateItemType(type)
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

  function handleDailyBriefClick() {
    chatRef.current?.runDailyBrief();
  }

  const filteredItems = scheduleItems.filter((item) => {
    const search = filters.search.trim().toLowerCase();
    const matchesSearch = !search || item.title?.toLowerCase().includes(search) || item.description?.toLowerCase().includes(search);
    const matchesType = filters.types.length === 0 || filters.types.includes(item.itemType);
    const matchesPriority = filters.priorities.length === 0 || filters.priorities.includes(item.priority || 'none');
    return matchesSearch && matchesType && matchesPriority;
  });

  const icsToolbar = (
    <div className="ics-toolbar ics-toolbar-hover">
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

      {/* Daily Brief Button */}
      <button
        type="button"
        className="ics-toolbar-button ics-toolbar-button-right"
        onClick={handleDailyBriefClick}
        disabled={dailyBriefState.disabled}
      >
        {dailyBriefState.isBriefing ? 'Loading...' : 'Generate Daily Brief'}
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
        <div className={`side-panel-wrap organizer-panel-wrap${isOrganizerOpen ? '' : ' is-closed'}`}>
          <div className="side-panel" id="organizer-slide">
            <div className="side-panel-content">
              <Organizer
                scheduleItems={filteredItems}
                filters={filters}
                onSearchChange={handleSearchChange}
                onToggleFilter={handleToggleFilter}
                onClearFilters={clearFilters}
                onAddItem={openCreateModal}
                onEditItem={openEditModal}
              />
            </div>
          </div>
          <button
            type="button"
            className="side-panel-toggle"
            onClick={() => setIsOrganizerOpen((open) => !open)}
            aria-expanded={isOrganizerOpen}
            aria-controls="organizer-slide"
            aria-label={isOrganizerOpen ? 'Collapse organizer' : 'Expand organizer'}
          >
            <span className="side-panel-toggle-label">Organizer</span>
            <span className="side-panel-toggle-icon" aria-hidden="true">{isOrganizerOpen ? '‹' : '›'}</span>
          </button>
        </div>

        <MyCalendar
          scheduleItems={filteredItems}
          onEditItem={openEditModal}
          toolbar={icsToolbar}
        />

        <div className={`side-panel-wrap chat-panel-wrap${isChatOpen ? '' : ' is-closed'}`}>
          <button
            type="button"
            className="side-panel-toggle"
            onClick={() => setIsChatOpen((open) => !open)}
            aria-expanded={isChatOpen}
            aria-controls="chat-slide"
            aria-label={isChatOpen ? 'Collapse chat' : 'Expand chat'}
          >
            <span className="side-panel-toggle-label">Chat</span>
            <span className="side-panel-toggle-icon" aria-hidden="true">{isChatOpen ? '›' : '‹'}</span>
          </button>
          <div className="side-panel" id="chat-slide">
            <div className="side-panel-content">
              <Chat ref={chatRef} onDailyBriefStateChange={setDailyBriefState} />
            </div>
          </div>
        </div>
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
          defaultItemType={createItemType}
          onClose={closeModal}
        />
      )}
    </>

  );
}
