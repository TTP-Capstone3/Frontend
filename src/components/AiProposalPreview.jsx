function formatDate(dateValue, timeZone, allDay) {
  if (!dateValue) {
    return null;
  }

  const options = {
    dateStyle: 'medium',
    timeZone,
  };

  if (!allDay) {
    options.timeStyle = 'short';
  }

  return new Intl.DateTimeFormat(undefined, options).format(
    new Date(dateValue),
  );
}

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

export default function AiProposalPreview({
  proposal,
  conflicts = [],
  onConfirm,
  onEdit,
  onCancel,
  isSaving = false,
  isSaved = false,
  actionsDisabled = false,
}) {
  const hasConflicts = conflicts.length > 0;
  const dates = [
    { label: 'Starts', value: proposal.startAt },
    { label: 'Ends', value: proposal.endAt },
    { label: 'Due', value: proposal.dueAt },
    { label: 'Reminder', value: proposal.reminderAt },
  ];

  const priorityOption = PRIORITIES.find((priority) => priority.value === proposal.priority);
  const itemTypeOption = ITEM_TYPES.find((type) => type.value === proposal.itemType);

  // Skip default values so the preview only shows useful details.
  const showPriority = proposal.priority && proposal.priority !== 'none';
  const showLocation = Boolean(proposal.location);

  return (
    <article className="ai-proposal-preview">
      <h3>{proposal.title}</h3>

      {hasConflicts && (
        <div className="ai-proposal-conflict-warning" role="alert">
          <p>This overlaps with something already on your calendar:</p>
          <ul>
            {conflicts.map((conflict) => (
              <li key={conflict.id}>{conflict.title}</li>
            ))}
          </ul>
        </div>
      )}

      <dl>
        <div className="ai-proposal-detail">
          <dt>Type</dt>
          <dd>{itemTypeOption?.label || proposal.itemType}</dd>
        </div>
        {dates.map((date) => {
          const formattedDate = formatDate(
            date.value,
            proposal.timeZone,
            proposal.allDay,
          );
          if (!formattedDate) {
            return null;
          }

          return (
            <div className="ai-proposal-detail" key={date.label}>
              <dt>{date.label}</dt>
              <dd>{formattedDate}</dd>
            </div>
          );
        })}

        {showPriority && (
          <div className="ai-proposal-detail">
            <dt>Priority</dt>
            <dd className="ai-proposal-priority">
              <span
                className="ai-proposal-priority-dot"
                style={{ background: PRIORITY_DOT_COLORS[proposal.priority] }}
                aria-hidden="true"
              />
              {priorityOption?.label || proposal.priority}
            </dd>
          </div>
        )}

        {showLocation && (
          <div className="ai-proposal-detail">
            <dt>Location</dt>
            <dd>{proposal.location}</dd>
          </div>
        )}
      </dl>

      {isSaved ? (
        <p role="status">Saved to calendar.</p>
      ) : (
        <div className="ai-proposal-actions">
          {/* Confirmation button, calls out the conflict if there is one */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={!onConfirm || actionsDisabled}
            aria-label={`Confirm ${proposal.title}`}
            className={hasConflicts ? 'ai-proposal-confirm-warning' : ''}
          >
            {isSaving ? 'Saving...' : hasConflicts ? 'Confirm anyway' : 'Confirm'}
          </button>

          {/* Edit button */}
          <button
            type="button"
            onClick={onEdit}
            disabled={actionsDisabled}
            aria-label={`Edit ${proposal.title}`}
          >
            Edit
          </button>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onCancel}
            disabled={actionsDisabled}
            aria-label={`Cancel ${proposal.title}`}
          >
            Cancel
          </button>
        </div>
      )}
    </article>
  );
}
