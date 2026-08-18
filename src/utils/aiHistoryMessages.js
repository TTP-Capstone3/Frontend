// Saved messages come back with database fields the chat does not use, so keep
// only what the chat renders plus the id we need for later updates.
export function toChatMessages(savedMessages) {
  if (!Array.isArray(savedMessages)) {
    return [];
  }

  return savedMessages.map((savedMessage) => ({
    id: savedMessage.id,
    sender: savedMessage.sender,
    text: typeof savedMessage.text === 'string' ? savedMessage.text : '',
    items: Array.isArray(savedMessage.items) ? savedMessage.items : [],
  }));
}

// Conflicts and free slots are worked out again on every request, so storing
// them would leave stale warnings in the history. Keep only the saved fields.
export function toSavedItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    kind: item.kind,
    proposal: item.proposal ?? null,
    missingFields: Array.isArray(item.missingFields) ? item.missingFields : [],
    question: item.question ?? null,
    isSaved: item.isSaved === true,
  }));
}

// The saved AI message comes back with an id, and it belongs to the message we
// just added to the end of the chat.
export function setLastMessageId(messages, id) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return messages;
  }

  const lastIndex = messages.length - 1;

  return messages.map((chatMessage, index) =>
    index === lastIndex ? { ...chatMessage, id } : chatMessage,
  );
}
