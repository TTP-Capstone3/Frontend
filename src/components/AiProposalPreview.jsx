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

export default function AiProposalPreview({
  proposal,
  onConfirm,
  onCancel,
  isSaving = false,
  isSaved = false,
  actionsDisabled = false,
}) {
  const dates = [
    { label: 'Starts', value: proposal.startAt },
    { label: 'Ends', value: proposal.endAt },
    { label: 'Due', value: proposal.dueAt },
    { label: 'Reminder', value: proposal.reminderAt },
  ];

  return (
    <article className="ai-proposal-preview">
      <h3>{proposal.title}</h3>

      <dl>
        <dt>Type</dt>
        <dd>{proposal.itemType}</dd>

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
            <div key={date.label}>
              <dt>{date.label}</dt>
              <dd>{formattedDate}</dd>
            </div>
          );
        })}

        <dt>Priority</dt>
        <dd>{proposal.priority || 'none'}</dd>

        <dt>Location</dt>
        <dd>{proposal.location || 'Not set'}</dd>
      </dl>

      {isSaved ? (
        <p role="status">Saved to calendar.</p>
      ) : (
        <div className="ai-proposal-actions">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!onConfirm || actionsDisabled}
            aria-label={`Confirm ${proposal.title}`}
          >
            {isSaving ? 'Saving...' : 'Confirm'}
          </button>
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
