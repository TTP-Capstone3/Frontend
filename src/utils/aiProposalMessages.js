import { getAiResponseText } from './aiClarification.js';

export function removeProposal(messages, messageIndex, itemIndex) {
  return messages.map((chatMessage, currentMessageIndex) => {
    if (currentMessageIndex !== messageIndex) {
      return chatMessage;
    }

    const items = chatMessage.items.filter(
      (_, currentItemIndex) => currentItemIndex !== itemIndex,
    );

    // Keeps the message text in sync so a cancelled proposal doesn't leave
    // a stale "please review this item" behind - recomputes it for whatever
    // is left, or falls back to a plain cancelled note when nothing is.
    return {
      ...chatMessage,
      items,
      text: getAiResponseText(items) || 'Suggestion canceled.',
    };
  });
}

export function markProposalSaved(messages, messageIndex, itemIndex) {
  return messages.map((chatMessage, currentMessageIndex) => {
    if (currentMessageIndex !== messageIndex) {
      return chatMessage;
    }

    return {
      ...chatMessage,
      items: chatMessage.items.map((item, currentItemIndex) =>
        currentItemIndex === itemIndex ? { ...item, isSaved: true } : item,
      ),
    };
  });
}

export function updateProposal(messages, messageIndex, itemIndex, updatedProposal) {
  return messages.map((chatMessage, currentMessageIndex) => {
    if (currentMessageIndex !== messageIndex) {
      return chatMessage;
    }

    return {
      ...chatMessage,
      items: chatMessage.items.map((item, currentItemIndex) =>
        currentItemIndex === itemIndex ? { ...item, proposal: updatedProposal } : item,
      ),
    };
  });
}

// Moves a proposal to a suggested free slot. The slot came back already
// conflict-free, so we can clear the warning without another round trip.
export function applyFreeSlot(messages, messageIndex, itemIndex, slot) {
  return messages.map((chatMessage, currentMessageIndex) => {
    if (currentMessageIndex !== messageIndex) {
      return chatMessage;
    }

    return {
      ...chatMessage,
      items: chatMessage.items.map((item, currentItemIndex) =>
        currentItemIndex === itemIndex
          ? {
              ...item,
              proposal: { ...item.proposal, startAt: slot.start, endAt: slot.end },
              conflicts: [],
              freeSlots: [],
            }
          : item,
      ),
    };
  });
}