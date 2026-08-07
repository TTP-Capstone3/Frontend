import { useState } from 'react';
import Modal from './Modal';
import { useSchedule } from '../context/ScheduleContext';
import '../styles/schedule_modal.css';

const PRIORITIES = [
  { value: 'none', label: 'No Priority' },
  { value: 'very low', label: 'Very Low' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very high', label: 'Very High' },
];
const ITEM_TYPES = [
  { value: 'task', label: 'Task' },
  { value: 'event', label: 'Event' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'note', label: 'Note' },
];

function toIso(value) {
  return value ? new Date(value).toISOString() : undefined
}

export default function ScheduleItemModal({ onClose }) {
  const { addItem, updateItem } = useSchedule();

  // Common fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState('task');
  const [priority, setPriority] = useState('none');

  // Task fields
  const [dueAt, setDueAt] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');

  // Event fields
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');

  // Reminder fields
  const [reminderAt, setReminderAt] = useState('');

  // Request state
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await addItem(item);

      onClose();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Add - Schedule item" onClose={onClose}>
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

        {/* Category */}
        <label className="schedule-item-field">
            Category
            <select disabled>
                <option> Not implemented yet </option>
            </select>
        </label>

        {/* Type + priority */}
        <div className="schedule-item-form-row">
          <label className="schedule-item-field"> Type

            <select
              value={itemType}
              onChange={(event) => {
                setItemType(event.target.value);
                setFormError(null);
              }}
            >
              {ITEM_TYPES.map((type) => (
                <option key={type.value} value={type.value}> {type.label} </option>
              ))}
            </select>
          </label>

          <label className="schedule-item-field">
            Priority

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              {PRIORITIES.map((priorityOption) => (
                <option key={priorityOption.value} value={priorityOption.value}>
                  {priorityOption.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Conditional fields start here */}

        {/* Task fields */}
        {itemType === 'task' && (
          <>
            <label className="schedule-item-field"> Due date

              <input
                type="datetime-local"
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
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                />
              </label>

              <label className="schedule-item-field"> End

                <input
                  type="datetime-local"
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
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}