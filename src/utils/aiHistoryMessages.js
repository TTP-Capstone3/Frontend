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
