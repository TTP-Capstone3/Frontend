const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function readResponse(response, fallbackMessage) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || fallbackMessage);
  }

  return response.json();
}

// Get all the categories a user has created.
export async function getCategories() {
  const response = await fetch(`${BASE_URL}/categories`, {
    credentials: 'include',
  });

  return readResponse(response, 'Could not load categories.');
}

// Create a new category for this user.
export async function createCategory(data) {
  const response = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return readResponse(response, 'Could not create category.');
}