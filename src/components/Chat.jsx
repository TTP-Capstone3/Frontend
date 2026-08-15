import { useEffect, useRef, useState } from 'react';
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
  //start voice input set mic to rest state - Daniel - this state is when the mic is not on and not recieving Audio.
  const [isListening, setIsListening] = useState(false);
  //SpeechRecognition Object, we're going to use this to have it not re-render everytime.
  const recognitionRef = useRef(null);
  const [savingItem, setSavingItem] = useState(null);
  const [pendingRequest, setPendingRequest] = useState('');
  const { addItem } = useSchedule();
  const isSending = useRef(false);
  const isSaving = useRef(false);
  const messageInput = useRef(null);

  useEffect(() => {
    if (!messageInput.current) {
      return;
    }

    // Resize the text box when the message changes.
    messageInput.current.style.height = 'auto';
    messageInput.current.style.height = `${messageInput.current.scrollHeight}px`;
  }, [message]);

  function handleCancel(messageIndex, itemIndex) {
    setMessages((currentMessages) =>
      removeProposal(currentMessages, messageIndex, itemIndex),
    );
    setPendingRequest('');
  }
  // this function will turn the mic on and off.
  function toggleListening() {
    // this is the browser-compatibility check for Chrome/Safari
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';

    // fires once the browser finishes transcribing what you said
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage((currentMessage) => `${currentMessage} ${transcript}`.trim());
    };

    // fires when it stops listening, either from us or from silence
    recognition.onend = () => {
      setIsListening(false);
    };

    // fires if something goes wrong, e.g. no-speech, network, not-allowed
    recognition.onerror = (event) => {
      setError(`Voice input error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
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

  function handleMessageKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
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
        <textarea
          ref={messageInput}
          rows={1}
          value={message}
          maxLength={2000}
          aria-label="Message for the AI calendar assistant"
          placeholder="Type a message..."
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleMessageKeyDown}
        />
        {/* mic button, talks to the toggleListening function above */}
        <button
          type="button"
          onClick={toggleListening}
          aria-label={isListening ? 'Stop listening' : 'Speak your message'}
          className={isListening ? 'is-listening' : ''}
        >
          {isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          )}
        </button>
        <button type="submit" disabled={isLoading || !message.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  );
}
