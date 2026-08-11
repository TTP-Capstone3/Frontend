// Left panel — tasks, events, notes, grouped.

import { useState } from 'react';
import format from 'date-fns/format';
import { useSchedule } from '../context/ScheduleContext';
import '../styles/organizer.css';

// Group order and labels. A group with no items is hidden.
const GROUPS = [
  { type: 'task', label: 'Tasks' },
  { type: 'event', label: 'Events' },
  { type: 'reminder', label: 'Reminders' },
  { type: 'note', label: 'Notes' },
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

// Keep items dated today or later; items with no date are kept (can't judge them).
function isTodayOrFuture(item) {
  const date = itemDate(item);
  if (!date) return true;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(date) >= startOfToday;
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

export default function Organizer({ onAddItem, onEditItem }) {
  const { scheduleItems, isLoading, error, addItem, updateItem, removeItem } = useSchedule();

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

  const groups = GROUPS.map(({ type, label }) => ({
    type,
    label,
    items: scheduleItems
      .filter((item) => item.itemType === type)
      .filter(isTodayOrFuture)
      .sort((a, b) => new Date(itemDate(a)) - new Date(itemDate(b))),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="organizer-panel">
      <div className="organizer-header">
        <h2>Organizer</h2>

        <button type="button" className="organizer-add-button" onClick={onAddItem}>
          + Add item
        </button>
      </div>

      {isLoading && <p className="organizer-status">Loading your schedule…</p>}

      {error && (
        <p className="organizer-status organizer-status-error">
          Couldn't load your schedule: {error}
        </p>
      )}

      {!isLoading && !error && groups.length === 0 && (
        <p className="organizer-status">
          Nothing here yet — add your first task, event, reminder, or note above.
        </p>
      )}

      {groups.map(({ type, label, items }) => (
        <section key={type} className="organizer-group">
          <h3>
            {label} <span className="organizer-group-count">{items.length}</span>
          </h3>
          <ul className="organizer-item-list">
            {items.map((item) => {
              const priorityClass = (item.priority || 'none').replace(' ', '-');
              return (
              <li
                key={item.id}
                className={`organizer-item type-${item.itemType} priority-${priorityClass} ${item.status === 'completed' ? 'is-completed' : ''
                  } ${isEnded(item) ? 'is-ended' : ''}`}
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
                    {item.title}
                    <button
                      type="button"
                      className="organizer-item-edit"
                      onClick={() => onEditItem(item)}
                      aria-label={`Edit "${item.title}"`}
                    >
                      <EditIcon />
                    </button>
                  </span>
                  {itemDate(item) && (
                    <span className="organizer-item-date">
                      {format(new Date(itemDate(item)), 'MMM d, h:mm a')}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="organizer-item-delete"
                  onClick={() => handleDelete(item)}
                  aria-label={`Delete "${item.title}"`}
                >
                  ×
                </button>
              </li>
              );
            })}
          </ul>
        </section>
      ))}
    </aside>
  );
}
