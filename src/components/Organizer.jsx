// Left panel — tasks, events, notes, grouped into two folder tabs: Organizer and Notes.

import { useState } from 'react';
import format from 'date-fns/format';
import { useSchedule } from '../context/ScheduleContext';
import OrganizerFilter from "./OrganizerFilter"
import Modal from './Modal';
import '../styles/organizer.css';

// Group order and labels. A group with no items is hidden.
const GROUPS = [
  { type: 'task', label: 'Tasks' },
  { type: 'event', label: 'Events' },
  { type: 'reminder', label: 'Reminders' },
  { type: 'note', label: 'Notes' },
];

// The two folder tabs, and which item types each one shows.
const TABS = [
  { key: 'organizer', label: 'Organizer', types: ['task', 'event', 'reminder'] },
  { key: 'notes', label: 'Notes', types: ['note'] },
];

// The most relevant date for an item, used for sorting and display.
function itemDate(item) {
  return item.dueAt || item.startAt || item.reminderAt || item.createdAt;
}

// True once an event's end (or start, if no end) has passed.
function isEnded(item) {
  if (item.itemType !== 'event') return false;
  const end = item.endAt || item.startAt;
  return Boolean(end) && new Date(end) < new Date();
}

// Keep items dated today or later (events use isEnded); undated items are kept.
function isTodayOrFuture(item) {
  if (item.itemType === 'event') return !isEnded(item);
  const date = itemDate(item);
  if (!date) return true;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(date) >= startOfToday;
}

// Finished is just the inverse of active.
function isFinished(item) {
  return !isTodayOrFuture(item);
}

// A small pencil icon for the edit button — sized/colored via CSS (currentColor).
function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export default function Organizer({ scheduleItems, filters, onSearchChange, onToggleFilter, onClearFilters, onAddItem, onEditItem, toolbar }) {
  const { isLoading, error, updateItem, removeItem } = useSchedule();
  const [activeSection, setActiveSection] = useState('organizer');
  const activeTab = TABS.find((tab) => tab.key === activeSection);
  // The note currently open in the view card, or null when none is open.
  const [viewingNote, setViewingNote] = useState(null);

  // The tasks have a checkbox the others dont
  async function toggleComplete(item) {
    try {
      await updateItem(item.id, {
        status: item.status === 'completed' ? 'active' : 'completed',
      });
    } catch (err) {
      console.error('Could not update task:', err.message);
    }
  }

  // Confirm before deleting and prompt it can't be undone.
  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) {
      return;
    }
    try {
      await removeItem(item.id);
    } catch (err) {
      console.error('Could not delete item:', err.message);
    }
  }

  // Only the items belonging to the active tab (Organizer: task/event/reminder, Notes: note).
  const tabItems = scheduleItems.filter((item) => activeTab.types.includes(item.itemType));

  const groups = GROUPS.map(({ type, label }) => ({
    type,
    label,
    items: tabItems
      .filter((item) => item.itemType === type)
      .filter(isTodayOrFuture)
      .sort((a, b) => new Date(itemDate(a)) - new Date(itemDate(b))),
  })).filter((group) => group.items.length > 0);

  // All past items in the active tab, grouped together and most-recent-first.
  const finishedItems = tabItems
    .filter(isFinished)
    .sort((a, b) => new Date(itemDate(b)) - new Date(itemDate(a)));

  // Same past items, but split into per-type dropdowns (same order/labels as the active groups).
  const finishedGroups = GROUPS.map(({ type, label }) => ({
    type,
    label,
    items: finishedItems.filter((item) => item.itemType === type),
  })).filter((group) => group.items.length > 0);

  // Shared row markup so the type groups and the finished group render identically.
  function renderItem(item) {
    const priorityClass = (item.priority || 'none').replace(' ', '-');
    const isNote = item.itemType === 'note';
    return (
      <li
        key={item.id}
        className={`organizer-item type-${item.itemType} priority-${priorityClass} ${item.status === 'completed' ? 'is-completed' : ''
          } ${isEnded(item) ? 'is-ended' : ''}`}
        // Notes open a read-only view card; other item types don't respond to a row click.
        onClick={isNote ? () => setViewingNote(item) : undefined}
      >
        {item.itemType === 'task' && (
          <input
            type="checkbox"
            checked={item.status === 'completed'}
            onChange={() => toggleComplete(item)}
            aria-label={`Mark "${item.title}" as ${item.status === 'completed' ? 'not done' : 'done'
              }`}
          />
        )}
        <div className="organizer-item-body">
          <span className="organizer-item-title">
            {priorityClass !== 'none' && (
              <span className={`priority-dot priority-dot-${priorityClass}`} aria-hidden="true" />
            )}
            <span className="organizer-item-title-text">{item.title}</span>
          </span>
          {itemDate(item) && (
            <span className="organizer-item-date">
              {format(new Date(itemDate(item)), 'MMM d, h:mm a')}
            </span>
          )}
        </div>
        <button
          type="button"
          className="organizer-item-edit"
          onClick={(event) => {
            event.stopPropagation();
            onEditItem(item);
          }}
          aria-label={`Edit "${item.title}"`}
        >
          <EditIcon />
        </button>
        <button
          type="button"
          className="organizer-item-delete"
          onClick={(event) => {
            event.stopPropagation();
            handleDelete(item);
          }}
          aria-label={`Delete "${item.title}"`}
        >
          ×
        </button>
      </li>
    );
  }

  return (
    <aside className="organizer-panel">
      {toolbar}

      <div className="organizer-header">
        <div className="organizer-tabs" role="tablist" aria-label="Organizer sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`organizer-tab-${tab.key}`}
              aria-selected={activeSection === tab.key}
              aria-controls="organizer-folder"
              className={`organizer-tab${activeSection === tab.key ? ' is-active' : ''}`}
              onClick={() => setActiveSection(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="organizer-add-button"
          onClick={() => onAddItem(activeSection === 'notes' ? 'note' : 'task')}
          aria-label={`Add ${activeSection === 'notes' ? 'note' : 'item'}`}
          title={`Add ${activeSection === 'notes' ? 'note' : 'item'}`}
        >
          +
        </button>
      </div>

      <div className="organizer-folder" id="organizer-folder" role="tabpanel" aria-labelledby={`organizer-tab-${activeSection}`}>
        <OrganizerFilter
          filters={filters}
          onSearchChange={onSearchChange}
          onToggleFilter={onToggleFilter}
          onClearFilters={onClearFilters}
        />

        <div className="organizer-body">
          {isLoading && <p className="organizer-status">Loading your schedule…</p>}

          {error && (
            <p className="organizer-status organizer-status-error">
              Couldn't load your schedule: {error}
            </p>
          )}

          {!isLoading && !error && groups.length === 0 && finishedItems.length === 0 && (
            <p className="organizer-status">
              {activeSection === 'notes' ? 'No notes yet.' : 'No schedule items to display.'}
            </p>
          )}

          {groups.map(({ type, label, items }) => (
            <section key={type} className="organizer-group">
              <h3>
                {label} <span className="organizer-group-count">{items.length}</span>
              </h3>
              <ul className="organizer-item-list">
                {items.map(renderItem)}
              </ul>
            </section>
          ))}

          {finishedGroups.length > 0 && (
            <details className="organizer-group organizer-group-finished">
              <summary>
                Archived <span className="organizer-group-count">{finishedItems.length}</span>
              </summary>
              {finishedGroups.map(({ type, label, items }) => (
                <details key={type} className="organizer-group organizer-group-finished-sub">
                  <summary>
                    {label} <span className="organizer-group-count">{items.length}</span>
                  </summary>
                  <ul className="organizer-item-list">
                    {items.map(renderItem)}
                  </ul>
                </details>
              ))}
            </details>
          )}
        </div>
      </div>

      {viewingNote && (
        <Modal title={viewingNote.title} onClose={() => setViewingNote(null)}>
          <div className="note-view">
            {viewingNote.description ? (
              <p className="note-view-description">{viewingNote.description}</p>
            ) : (
              <p className="note-view-description note-view-empty">No additional details.</p>
            )}

            {itemDate(viewingNote) && (
              <p className="note-view-date">
                {format(new Date(itemDate(viewingNote)), 'MMM d, yyyy h:mm a')}
              </p>
            )}

            <div className="note-view-actions">
              <button
                type="button"
                onClick={() => {
                  setViewingNote(null);
                  onEditItem(viewingNote);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewingNote(null);
                  handleDelete(viewingNote);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </aside>
  );
}
