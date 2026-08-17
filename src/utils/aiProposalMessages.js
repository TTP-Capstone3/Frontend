export function removeProposal(messages, messageIndex, itemIndex) {
  return messages.map((chatMessage, currentMessageIndex) => {
    if (currentMessageIndex !== messageIndex) {
      return chatMessage;
    }

    return {
      ...chatMessage,
      items: chatMessage.items.filter(
        (_, currentItemIndex) => currentItemIndex !== itemIndex,
      ),
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