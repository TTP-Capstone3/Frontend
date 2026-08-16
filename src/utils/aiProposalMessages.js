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