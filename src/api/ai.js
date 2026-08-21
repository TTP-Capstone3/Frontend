const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080';

export async function requestScheduleProposal(message, timeZone) {
  let response;

  try {
    response = await fetch(`${BASE_URL}/ai/schedule-proposal`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, timeZone }),
    });
  } catch {
    throw new Error('Could not connect to the AI service. Please try again.');
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please log in again to use the AI chat.');
    }

    if (response.status === 503) {
      throw new Error('The AI chat is not available right now.');
    }

    throw new Error('The AI could not answer right now. Please try again.');
  }

  const result = await response.json().catch(() => null);

  if (!result || typeof result.reply !== 'string' || !Array.isArray(result.items)) {
    throw new Error('The AI returned an unexpected response. Please try again.');
  }

  return result;
}

export async function requestDailyBriefing(timeZone) {
  let response;

  try {
    response = await fetch(`${BASE_URL}/ai/daily-briefing`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeZone }),
    });
  } catch {
    throw new Error('Could not connect to the AI service. Please try again.');
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please log in again to use the AI chat.');
    }

    if (response.status === 429) {
      throw new Error(
        'The AI has hit its usage limit. Please try again in a little while.',
      );
    }

    if (response.status === 503) {
      throw new Error('The AI chat is not available right now.');
    }

    throw new Error('Could not build your daily brief. Please try again.');
  }

  const briefing = await response.json().catch(() => null);

  if (!briefing || typeof briefing.summary !== 'string') {
    throw new Error('The AI returned an unexpected response. Please try again.');
  }

  return briefing;
}
