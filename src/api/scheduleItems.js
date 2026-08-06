// Note the route has NO /api prefix: Backend/app.js mounts this router at
// `/schedule-items`, not `/api/schedule-items`.
//
//   Create  ->  POST    /schedule-items         createScheduleItem
//   Read    ->  GET     /schedule-items         getScheduleItems  (all, current user)
//               GET     /schedule-items/:id     getScheduleItem   (one)
//   Update  ->  PATCH   /schedule-items/:id     updateScheduleItem
//   Delete  ->  DELETE  /schedule-items/:id     deleteScheduleItem

// In dev this is your local Express server. In production, set VITE_API_URL to
// your deployed backend URL. Vite only exposes env vars starting with VITE_.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// READ ALL — GET /schedule-items. Requires login; returns every item owned by
// the current user (each with its Category included, if it has one).
export async function getScheduleItems() {
  const res = await fetch(`${BASE_URL}/schedule-items`, {
    // Send our login cookie along — requireAuth on the backend rejects
    // without it.
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  // fetch only rejects on a NETWORK failure (server down, DNS, CORS). A 401 or
  // a 500 is still a "successful" fetch, so we check res.ok ourselves.
  if (!res.ok) {
    // Our backend sends errors as { error: "..." }. Fall back if it didn't.
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Could not load schedule items (${res.status})`);
  }

  return res.json();
}

// READ ONE — GET /schedule-items/:id. Returns a single item, or throws on 404.
export async function getScheduleItem(id) {
  const res = await fetch(`${BASE_URL}/schedule-items/${id}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error || `Could not load schedule item ${id} (${res.status})`,
    );
  }

  return res.json();
}

// CREATE — POST /schedule-items. Returns the item the server created (with its
// new id, and a `conflicts` array of anything on the calendar it overlaps).
// data = { title, itemType, description?, startAt?, endAt?, dueAt?,
//          reminderAt?, allDay?, priority?, estimatedMinutes?, location?,
//          categoryId?, ... } — see Backend's `allowedFields` for the rest.
// `title` and `itemType` are the only two the server requires.
export async function createScheduleItem(data) {
  const res = await fetch(`${BASE_URL}/schedule-items`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    // fetch will not turn an object into JSON for you. Two things have to
    // agree here: JSON.stringify on the body, and the Content-Type header.
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // On a 400 the backend also sends `details`, an array of every validation
    // problem at once — join them so the user sees all of it, not just one.
    throw new Error(
      body.details?.join(' ') || body.error || `Could not create item (${res.status})`,
    );
  }

  return res.json();
}

// UPDATE — PATCH /schedule-items/:id. Returns the updated item (plus its
// fresh `conflicts` list). PATCH changes only the fields you send.
export async function updateScheduleItem(id, data) {
  const res = await fetch(`${BASE_URL}/schedule-items/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.details?.join(' ') ||
      body.error ||
      `Could not update item ${id} (${res.status})`,
    );
  }

  return res.json();
}

// DELETE — DELETE /schedule-items/:id.
export async function deleteScheduleItem(id) {
  const res = await fetch(`${BASE_URL}/schedule-items/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error || `Could not delete item ${id} (${res.status})`,
    );
  }

  // No res.json() here. The backend replies 204 No Content — there is no body
  // to parse, and calling res.json() on an empty body would throw. Nothing
  // useful to hand back, so we return null.
  return null;
}
