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

//priorities
const PRIORITIES = ['none', 'very low', 'low', 'medium', 'high', 'very high'];

// The most relevant date for an item, used for sorting and display.
function itemDate(item) {
  return item.dueAt || item.startAt || item.reminderAt || item.createdAt;
}

// Converts a datetime-local value to an ISO string for the backend.
function toIso(localDateTimeValue) {
  return localDateTimeValue ? new Date(localDateTimeValue).toISOString() : undefined;
}

export default function Organizer() {
  const { scheduleItems, isLoading, error, addItem, updateItem, removeItem } =
    useSchedule();


  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState('task');
  const [priority, setPriority] = useState('none');
  const [dueAt, setDueAt] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setTitle('');
    setPriority('none');
    setDueAt('');
    setStartAt('');
    setEndAt('');
    setReminderAt('');
    setFormError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Title is required.');
      return;
    }
    if (itemType === 'event' && (!startAt || !endAt)) {
      setFormError('Events need both a start and an end time.');
      return;
    }
    if (itemType === 'event' && new Date(endAt) <= new Date(startAt)) {
      setFormError('The end time has to be after the start time.');
      return;
    }
    if (itemType === 'reminder' && !reminderAt) {
      setFormError('Reminders need a time.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await addItem({
        title: trimmedTitle,
        itemType,
        priority,
        dueAt: toIso(dueAt),
        startAt: toIso(startAt),
        endAt: toIso(endAt),
        reminderAt: toIso(reminderAt),
      });
      resetForm();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

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
      <h2>Organizer</h2>

      <form className="organizer-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task, event, reminder, or note…"
          aria-label="Title"
          className="organizer-input"
        />

        <div className="organizer-form-row">
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            aria-label="Type"
            className="organizer-select"
          >
            {GROUPS.map(({ type, label }) => (
              <option key={type} value={type}>
                {label.slice(0, -1) /* singular */}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label="Priority"
            className="organizer-select"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p === 'none' ? 'No priority' : p}
              </option>
            ))}
          </select>
        </div>

        {/* Show date field(s) for the selected type. */}
        {itemType === 'task' && (
          <label className="organizer-date-field">
            Due
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>
        )}

        {itemType === 'event' && (
          <div className="organizer-form-row">
            <label className="organizer-date-field">
              Start
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </label>
            <label className="organizer-date-field">
              End
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </label>
          </div>
        )}

        {itemType === 'reminder' && (
          <label className="organizer-date-field">
            Remind me at
            <input
              type="datetime-local"
              value={reminderAt}
              onChange={(e) => setReminderAt(e.target.value)}
            />
          </label>
        )}

        {formError && <p className="organizer-form-error">{formError}</p>}

        <button type="submit" disabled={isSubmitting} className="organizer-add-button">
          {isSubmitting ? 'Adding…' : 'Add'}
        </button>
      </form>

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
