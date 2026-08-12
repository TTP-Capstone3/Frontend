import format from 'date-fns/format';
import '../styles/schedule_item_popover.css';

function formatDateTime(value) {
    if (!value) {
        return null;
    }
    return format(new Date(value), 'MMM d, yyyy h:mm a');
}

export default function ScheduleItemPopover({item, occurrence, position, popoverRef, onClose, onEdit, onDelete}) {

    return (
        <div
            ref={popoverRef}
            className="schedule-item-popover"
            style={{ top: position.top, left: position.left }}
        >
            <header className="schedule-item-popover-header">
                <div>
                    <span className="schedule-item-popover-type"> {item.itemType} </span>
                    <h3>{item.title}</h3>
                </div>

                <button
                    type="button"
                    className="schedule-item-popover-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>
            </header>

            {item.description && (
                <p className="schedule-item-popover-description">
                    {item.description}
                </p>
            )}

            <div className="schedule-item-popover-details">
                {item.itemType === 'event' && (
                    <>
                        <div>
                            <strong>Start</strong>
                            <span>{formatDateTime(occurrence?.start || item.startAt)}</span>
                        </div>

                        <div>
                            <strong>End</strong>
                            <span>{formatDateTime(occurrence?.end || item.endAt)}</span>
                        </div>
                    </>
                )}

                {item.itemType === 'task' && item.dueAt && (
                    <div>
                        <strong>Due</strong>
                        <span>{formatDateTime(item.dueAt)}</span>
                    </div>
                )}

                {item.itemType === 'reminder' && item.reminderAt && (
                    <div>
                        <strong>Reminder</strong>
                        <span>{formatDateTime(item.reminderAt)}</span>
                    </div>
                )}

                {item.priority && item.priority !== 'none' && (
                    <div>
                        <strong>Priority</strong>

                        <span className="schedule-item-popover-priority">
                            <span
                                className={`priority-dot priority-dot-${item.priority.replace(' ', '-')}`}
                                aria-hidden="true"
                            />

                            <span className="schedule-item-popover-priority-label">
                                {item.priority}
                            </span>
                        </span>
                    </div>
                )}

                {item.location && (
                    <div>
                        <strong>Location</strong>
                        <span>{item.location}</span>
                    </div>
                )}

                {item.estimatedMinutes && (
                    <div>
                        <strong>Duration</strong>
                        <span>{item.estimatedMinutes} minutes</span>
                    </div>
                )}

                {item.recurrenceRule && (
                    <div>
                        <strong>Repeats</strong>
                        <span>Recurring event</span>
                    </div>
                )}
            </div>

            <footer className="schedule-item-popover-actions">
                <button type="button" onClick={() => onEdit(item)}> Edit </button>
                <button type="button" onClick={() => onDelete(item)}> Delete </button>
            </footer>
        </div>
    );
}