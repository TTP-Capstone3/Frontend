import { useRef, useState } from 'react';
import { requestScheduleProposal } from '../api/ai';
import { useSchedule } from '../context/ScheduleContext';
import {
  markProposalSaved,
  removeProposal,
} from '../utils/aiProposalMessages';
import {
  combineClarificationRequest,
  getAiResponseText,
  hasClarification,
} from '../utils/aiClarification';
import AiProposalPreview from './AiProposalPreview';
import '../styles/chat.css';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingItem, setSavingItem] = useState(null);
  const [pendingRequest, setPendingRequest] = useState('');
  const { addItem } = useSchedule();
  const isSending = useRef(false);
  const isSaving = useRef(false);

  function handleCancel(messageIndex, itemIndex) {
    setMessages((currentMessages) =>
      removeProposal(currentMessages, messageIndex, itemIndex),
    );
    setPendingRequest('');
  }

  async function handleConfirm(messageIndex, itemIndex, proposal) {
    if (isSaving.current) {
      return;
    }

    const itemKey = `${messageIndex}-${itemIndex}`;
    isSaving.current = true;
    setSavingItem(itemKey);
    setError('');

    try {
      await addItem(proposal);

      setMessages((currentMessages) =>
        markProposalSaved(currentMessages, messageIndex, itemIndex),
      );
      setPendingRequest('');
    } catch (saveError) {
      const errorMessage =
        saveError instanceof Error
          ? saveError.message
          : 'Could not save the proposal.';
      setError(errorMessage);
    } finally {
      isSaving.current = false;
      setSavingItem(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanedMessage = message.trim();
    if (!cleanedMessage || isSending.current) {
      return;
    }

    let requestMessage = cleanedMessage;

    try {
      if (pendingRequest) {
        requestMessage = combineClarificationRequest(
          pendingRequest,
          cleanedMessage,
        );
      }
    } catch (clarificationError) {
      setError(clarificationError.message);
      return;
    }

    // Stops quick double clicks from sending the same message twice.
    isSending.current = true;
    setIsLoading(true);
    setError('');
    setMessage('');
    setMessages((currentMessages) => [
      ...currentMessages,
      { sender: 'user', text: cleanedMessage },
    ]);

    try {
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const result = await requestScheduleProposal(requestMessage, timeZone);

      if (hasClarification(result.items)) {
        setPendingRequest(requestMessage);
      } else {
        setPendingRequest('');
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          sender: 'ai',
          text: getAiResponseText(result.items),
          items: result.items,
        },
      ]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      isSending.current = false;
      setIsLoading(false);
    }
  }

  return (
    <section className="chat-bar">
      <h2>Chat</h2>

      <div className="chat-messages" aria-live="polite">
        {messages.map((chatMessage, messageIndex) => (
          <div
            className={`chat-message ${chatMessage.sender}-message`}
            key={`${chatMessage.sender}-${messageIndex}`}
          >
            <strong>{chatMessage.sender === 'user' ? 'You' : 'AI'}</strong>
            {chatMessage.text && <p>{chatMessage.text}</p>}

            {chatMessage.items?.map((item, itemIndex) =>
              item.kind === 'clarification' && item.question ? (
                <p key={`question-${itemIndex}`}>{item.question}</p>
              ) : item.kind === 'proposal' && item.proposal ? (
                <AiProposalPreview
                  key={`proposal-${itemIndex}`}
                  proposal={item.proposal}
                  onConfirm={() =>
                    handleConfirm(messageIndex, itemIndex, item.proposal)
                  }
                  onCancel={() => handleCancel(messageIndex, itemIndex)}
                  isSaving={savingItem === `${messageIndex}-${itemIndex}`}
                  isSaved={item.isSaved}
                  actionsDisabled={savingItem !== null}
                />
              ) : null,
            )}
          </div>
        ))}

        {isLoading && <p role="status">Thinking...</p>}
        {error && <p role="alert">{error}</p>}
      </div>

      <form className="chat-compose" onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          maxLength={2000}
          aria-label="Message for the AI calendar assistant"
          placeholder="Type a message..."
          onChange={(event) => setMessage(event.target.value)}
        />
        <button type="submit" disabled={isLoading || !message.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  );
}
