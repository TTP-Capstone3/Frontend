const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080';

function isSavedMessage(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.id === 'string' &&
    ['user', 'ai'].includes(value.sender) &&
    typeof value.text === 'string' &&
    Array.isArray(value.items)
  );
}

async function sendHistoryRequest(path, options = {}, fallbackError) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
    });
  } catch {
    throw new Error('Could not connect to the AI history. Please try again.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    if (response.status === 401) {
      throw new Error('Please log in again to use the AI chat.');
    }

    const details = Array.isArray(body?.details)
      ? body.details.filter((detail) => typeof detail === 'string').join(' ')
      : '';
    const backendError =
      typeof body?.error === 'string' ? body.error : fallbackError;

    throw new Error(details || backendError);
  }

  const body = await response.json().catch(() => null);

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('The AI history returned an unexpected response.');
  }

  return body;
}

// Load the current user's saved messages.
export async function loadAiMessages() {
  const body = await sendHistoryRequest(
    '/ai/conversation/messages',
    {},
    'Could not load the AI history.',
  );

  if (!Array.isArray(body.messages) || !body.messages.every(isSavedMessage)) {
    throw new Error('The AI history returned an unexpected response.');
  }

  return body.messages;
}

// Save one user or AI message.
export async function saveAiMessage(message) {
  const body = await sendHistoryRequest(
    '/ai/conversation/messages',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    },
    'Could not save the AI message.',
  );

  if (!isSavedMessage(body)) {
    throw new Error('The AI history returned an unexpected response.');
  }

  return body;
}

// Update the proposal items stored in an AI message.
export async function updateAiMessageItems(messageId, items) {
  if (typeof messageId !== 'string' || !messageId.trim()) {
    throw new Error('A saved AI message ID is required.');
  }

  if (!Array.isArray(items)) {
    throw new Error('AI message items must be an array.');
  }

  const safeMessageId = encodeURIComponent(messageId.trim());
  const body = await sendHistoryRequest(
    `/ai/conversation/messages/${safeMessageId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    },
    'Could not update the AI message.',
  );

  if (!isSavedMessage(body)) {
    throw new Error('The AI history returned an unexpected response.');
  }

  return body;
}
