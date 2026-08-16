export const MAX_AI_MESSAGE_LENGTH = 2000;

export function hasClarification(items) {
  return (
    Array.isArray(items) &&
    items.some((item) => item?.kind === 'clarification')
  );
}

export function getAiResponseText(items) {
  // The question already contains the details the user needs.
  if (hasClarification(items)) {
    return '';
  }

  const proposalCount = Array.isArray(items)
    ? items.filter((item) => item?.kind === 'proposal').length
    : 0;

  if (proposalCount === 1) {
    return 'Please review this item:';
  }

  if (proposalCount > 1) {
    return `Please review these ${proposalCount} items:`;
  }

  return '';
}

export function combineClarificationRequest(originalRequest, answer) {
  const cleanedRequest = originalRequest?.trim();
  const cleanedAnswer = answer?.trim();

  if (!cleanedRequest || !cleanedAnswer) {
    throw new Error('The original request and follow-up answer are required.');
  }

  const combinedMessage = `${cleanedRequest}\nAdditional details: ${cleanedAnswer}`;

  if (combinedMessage.length > MAX_AI_MESSAGE_LENGTH) {
    throw new Error('Your follow-up is too long. Please shorten it and try again.');
  }

  return combinedMessage;
}
