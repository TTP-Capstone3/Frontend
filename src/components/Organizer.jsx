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

export default function Organizer({ onAddItem }) {
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
            {items.map((item) => (
              <li
                key={item.id}
                className={`organizer-item priority-${(item.priority || 'none').replace(' ', '-')} ${item.status === 'completed' ? 'is-completed' : ''
                  }`}
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
                  <span className="organizer-item-title">{item.title}</span>
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
            ))}
          </ul>
        </section>
      ))}
    </aside>
  );
}
