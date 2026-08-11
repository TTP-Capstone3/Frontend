const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function importCalendar(file) {
  const calendarText = await file.text();
  const res = await fetch(`${BASE_URL}/calendar/import`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'text/calendar',
    },
    body: calendarText,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Could not import calendar (${res.status})`);
  }

  return res.json();
}

export async function exportCalendar() {
  const res = await fetch(`${BASE_URL}/calendar/export`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Could not export calendar (${res.status})`);
  }

  return res.blob();
}