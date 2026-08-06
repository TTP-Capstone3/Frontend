import { createContext, useContext, useEffect, useState } from 'react';
import {
  getScheduleItems,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
} from '../api/scheduleItems';

// Shared schedule items list, used by both MyCalendar and Organizer.
//`/schedule-items`
const ScheduleContext = createContext(undefined);

// item shape: { id, title, itemType: 'task'|'event'|'reminder'|'note',
// description?, startAt?, endAt?, dueAt?, reminderAt?, allDay?, priority?,
// status?, categoryId?, ... }
export function ScheduleProvider({ children }) {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the user's schedule once on mount.
  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      try {
        const items = await getScheduleItems();
        if (!cancelled) setScheduleItems(items);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadItems();
    // Skip setting state if we unmount before the fetch finishes.
    return () => {
      cancelled = true;
    };
  }, []);

  // Create on the server first, then add locally with the real id.
  async function addItem(item) {
    const created = await createScheduleItem(item);
    setScheduleItems((items) => [created, ...items]);
    return created;
  }

  // Save to the server first, then apply its response locally.
  async function updateItem(id, changes) {
    const updated = await updateScheduleItem(id, changes);
    setScheduleItems((items) =>
      items.map((item) => (item.id === id ? updated : item)),
    );
    return updated;
  }

  async function removeItem(id) {
    await deleteScheduleItem(id);
    setScheduleItems((items) => items.filter((item) => item.id !== id));
  }

  return (
    <ScheduleContext.Provider
      value={{
        scheduleItems,
        isLoading,
        error,
        addItem,
        updateItem,
        removeItem,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

// Throws if used outside a ScheduleProvider.
// eslint-disable-next-line react-refresh/only-export-components
export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}
