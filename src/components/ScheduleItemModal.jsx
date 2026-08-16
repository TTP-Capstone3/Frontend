import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { useSchedule } from '../context/ScheduleContext';
import format from 'date-fns/format';
import '../styles/schedule_modal.css';

const PRIORITIES = [
  { value: 'none', label: 'No Priority' },
  { value: 'very low', label: 'Very Low' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very high', label: 'Very High' },
];

// Same colors as the priority dots on the calendar/organizer, keyed by priority value.
const PRIORITY_DOT_COLORS = {
  'very low': '#60a5fa',
  low: '#34d399',
  medium: '#fbbf24',
  high: '#fb923c',
  'very high': '#f87171',
};
const ITEM_TYPES = [
  { value: 'task', label: 'Task' },
  { value: 'event', label: 'Event' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'note', label: 'Note' },
];

// Converts a datetime-local value to an ISO string for the backend.
function toIso(value) {
  return value ? new Date(value).toISOString() : undefined
}
function PriorityDropdown({ value, onChange, labelledBy }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = PRIORITIES.find((option) => option.value === value) || PRIORITIES[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="field-dropdown" ref={containerRef}>
      <button
        type="button"
        className="field-dropdown-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelledBy}
      >
        {PRIORITY_DOT_COLORS[selected.value] && (
          <span
            className="priority-dot"
            style={{ background: PRIORITY_DOT_COLORS[selected.value] }}
            aria-hidden="true"
          />
        )}
        <span>{selected.label}</span>
      </button>

      {open && (
        <ul className="field-dropdown-menu" role="listbox">
          {PRIORITIES.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className="field-dropdown-option"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {PRIORITY_DOT_COLORS[option.value] && (
                <span
                  className="priority-dot"
                  style={{ background: PRIORITY_DOT_COLORS[option.value] }}
                  aria-hidden="true"
                />
              )}
              <span>{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Same as PriorityDropdown but with no color dots — used for the Type field.
function TypeDropdown({ value, onChange, labelledBy }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = ITEM_TYPES.find((option) => option.value === value) || ITEM_TYPES[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="field-dropdown" ref={containerRef}>
      <button
        type="button"
        className="field-dropdown-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelledBy}
      >
        <span>{selected.label}</span>
      </button>

      {open && (
        <ul className="field-dropdown-menu" role="listbox">
          {ITEM_TYPES.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className="field-dropdown-option"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Converts value into date input format.
function toDateTimeInput(value) {
  if (!value) return '';
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

export default function ScheduleItemModal({ onClose, itemToEdit, onSaveDraft }) {
  const { addItem, updateItem } = useSchedule();

  // Common fields
  const [title, setTitle] = useState(itemToEdit?.title || '');
  const [description, setDescription] = useState(itemToEdit?.description || '');
  const [itemType, setItemType] = useState(itemToEdit?.itemType || 'task');
  const [priority, setPriority] = useState(itemToEdit?.priority || 'none');

  // Task fields
  const [dueAt, setDueAt] = useState(toDateTimeInput(itemToEdit?.dueAt));
  const [estimatedMinutes, setEstimatedMinutes] = useState(itemToEdit?.estimatedMinutes || '');

  // Event fields
  const [startAt, setStartAt] = useState(toDateTimeInput(itemToEdit?.startAt));
  const [endAt, setEndAt] = useState(toDateTimeInput(itemToEdit?.endAt));
  const [location, setLocation] = useState(itemToEdit?.location || '');

  // Reminder fields
  const [reminderAt, setReminderAt] = useState(toDateTimeInput(itemToEdit?.reminderAt));

  // Request state
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(itemToEdit);
  const isDraftEditing = (typeof(onSaveDraft) === 'function');

  function validateForm() {
    if (!title.trim()) {
      return 'Title is required.';
    }

    if (itemType === 'event') {
      if (!startAt || !endAt) {
        return 'Events need both a start and an end time.';
      }

      if (new Date(endAt) <= new Date(startAt)) {
        return 'The end time must be after the start time.';
      }
    }

    if (itemType === 'reminder' && !reminderAt) {
      return 'Reminders need a reminder time.';
    }

    if (estimatedMinutes && Number(estimatedMinutes) < 1) {
      return 'Estimated duration must be at least 1 minute.';
    }

    return null;
  }

  function buildScheduleItem() {
    const item = {
      title: title.trim(),
      description: description.trim() || null,
      itemType,
      priority,
    };

    if (itemType === 'task') {
      if (dueAt) {
        item.dueAt = toIso(dueAt);
      }

      if (estimatedMinutes) {
        item.estimatedMinutes = Number(estimatedMinutes);
      }
    }

    if (itemType === 'event') {
      item.startAt = toIso(startAt);
      item.endAt = toIso(endAt);

      if (location.trim()) {
        item.location = location.trim();
      }
    }

    if (itemType === 'reminder') {
      item.reminderAt = toIso(reminderAt);
    }

    return item;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const item = buildScheduleItem();
      if (isDraftEditing) {
        await onSaveDraft(item)
      } else if (isEditing) {
        await updateItem(itemToEdit.id, item);
      } else {
        await addItem(item);
      }

      onClose();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Edit - Schedule Item" : "Add - Schedule item"} onClose={onClose}>
      <form className="schedule-item-form" onSubmit={handleSubmit}>
        {/* Title */}
        <label className="schedule-item-field"> Title

          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you need to do?"
            autoFocus
          />
        </label>

        {/* Description */}
        <label className="schedule-item-field"> Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add more details..."
            rows={3}
          />
        </label>

        {/* Type + priority */}
        <div className="schedule-item-form-row">
          {/* Not a native <label>, since that would re-toggle these dropdowns on click. */}
          <div className="schedule-item-field">
            <span id="type-field-label">Type</span>

            <TypeDropdown
              value={itemType}
              onChange={(nextType) => {
                setItemType(nextType);
                setFormError(null);
              }}
              labelledBy="type-field-label"
            />
          </div>

          <div className="schedule-item-field">
            <span id="priority-field-label">Priority</span>

            <PriorityDropdown
              value={priority}
              onChange={setPriority}
              labelledBy="priority-field-label"
            />
          </div>
        </div>

        {/* Conditional fields start here */}

        {/* Task fields */}
        {itemType === 'task' && (
          <>
            <label className="schedule-item-field"> Due date

              <input
                type="datetime-local"
                className={dueAt ? '' : 'is-empty'}
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </label>

            <label className="schedule-item-field"> Estimated duration
              <div className="schedule-item-duration">
                <input
                  type="number"
                  min="1"
                  value={estimatedMinutes}
                  onChange={(event) => setEstimatedMinutes(event.target.value)}
                  placeholder="60"
                />

                <span>minutes</span>
              </div>
            </label>
          </>
        )}

        {/* Event fields */}
        {itemType === 'event' && (
          <>
            <div className="schedule-item-form-row">
              <label className="schedule-item-field"> Start

                <input
                  type="datetime-local"
                  className={startAt ? '' : 'is-empty'}
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                />
              </label>

              <label className="schedule-item-field"> End

                <input
                  type="datetime-local"
                  className={endAt ? '' : 'is-empty'}
                  value={endAt}
                  onChange={(event) => setEndAt(event.target.value)}
                />
              </label>
            </div>

            <label className="schedule-item-field"> Location

              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Optional"
              />
            </label>
          </>
        )}

        {/* Reminder fields */}
        {itemType === 'reminder' && (
          <label className="schedule-item-field"> Remind me at

            <input
              type="datetime-local"
              className={reminderAt ? '' : 'is-empty'}
              value={reminderAt}
              onChange={(event) => setReminderAt(event.target.value)}
            />
          </label>
        )}

        {/* Notes intentionally have no additional required fields. */}
        {formError && (
          <p className="schedule-item-form-error"> {formError} </p>
        )}

        <footer className="schedule-item-form-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? isEditing ? 'Saving...' : 'Creating...' : isEditing ? 'Save Changes' : 'Create'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}