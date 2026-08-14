import { useEffect, useRef, useState } from 'react';

const ITEM_TYPES = [
  { value: 'task', label: 'Tasks' },
  { value: 'event', label: 'Events' },
  { value: 'reminder', label: 'Reminders' },
  { value: 'note', label: 'Notes' },
];

const PRIORITIES = [
  { value: 'none', label: 'No priority' },
  { value: 'very low', label: 'Very low' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very high', label: 'Very high' },
];

export default function OrganizerFilter({ filters, onSearchChange, onToggleFilter, onClearFilters }) {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef(null);

  // Close the filter popover when clicking somewhere else.
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="organizer-filter-controls" ref={filterRef}>
      <div className="organizer-search-row">
        <input
          type="search"
          className="organizer-search-input"
          placeholder="Search schedule..."
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search schedule items"
        />

        <button
          type="button"
          className="organizer-filter-button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls="organizer-filter-popover"
        >
          Filter By:
        </button>
      </div>

      {isOpen && (
        <div className="organizer-filter-popover" >
        <fieldset className="organizer-filter-section">
            <legend>Type</legend>

            <div className="organizer-filter-options">
            {ITEM_TYPES.map((type) => (
                <label key={type.value} className="organizer-filter-option">
                <input
                    type="checkbox"
                    checked={filters.types.includes(type.value)}
                    onChange={() => onToggleFilter('types', type.value)}
                />
                {type.label}
                </label>
            ))}
            </div>
        </fieldset>

        <fieldset className="organizer-filter-section">
            <legend>Priority</legend>

            <div className="organizer-filter-options">
            {PRIORITIES.map((priority) => (
                <label key={priority.value} className="organizer-filter-option">
                <input
                    type="checkbox"
                    checked={filters.priorities.includes(priority.value)}
                    onChange={() =>
                    onToggleFilter('priorities', priority.value)
                    }
                />
                {priority.label}
                </label>
            ))}
            </div>
        </fieldset>

        <button
            type="button"
            className="organizer-filter-clear"
            onClick={onClearFilters}
        >
            Clear filters
        </button>
        </div>
    )}
    </div>
  );
}