import { useRef, useState } from 'react';
import { requestScheduleProposal } from '../api/ai';
import '../styles/chat.css';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isSending = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanedMessage = message.trim();
    if (!cleanedMessage || isSending.current) {
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
      const result = await requestScheduleProposal(cleanedMessage, timeZone);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          sender: 'ai',
          text: result.reply,
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
            <p>{chatMessage.text}</p>

            {chatMessage.items?.map((item, itemIndex) =>
              item.kind === 'clarification' && item.question ? (
                <p key={`question-${itemIndex}`}>{item.question}</p>
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
