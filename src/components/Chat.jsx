import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  requestDailyBriefing,
  requestScheduleProposal,
} from '../api/ai';
import {
  loadAiMessages,
  saveAiMessage,
  updateAiMessageItems,
} from '../api/aiConversation';
import { useSchedule } from '../context/ScheduleContext';
import {
  setLastMessageId,
  toChatMessages,
  toSavedItems,
} from '../utils/aiHistoryMessages';
import {
  applyFreeSlot,
  markProposalSaved,
  removeProposal,
  updateProposal,
} from '../utils/aiProposalMessages';
import {
  combineClarificationRequest,
  getAiResponseText,
  hasClarification,
  hasUnresolvedConflict,
} from '../utils/aiClarification';
import AgentaMark from './AgentaMark';
import DailyBriefModal from './DailyBriefModal';
import AiProposalPreview from './AiProposalPreview';
import ScheduleItemModal from './ScheduleItemModal';
import '../styles/chat.css';

// `onDailyBriefStateChange` lets the parent (which hosts the Daily brief
// button next to the calendar's import/export controls) mirror the loading
// state; `ref` exposes `runDailyBrief` so the parent's button can trigger it.
const Chat = forwardRef(function Chat({ onDailyBriefStateChange }, ref) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  //start voice input set mic to rest state - Daniel - this state is when the mic is not on and not recieving Audio.
  const [isListening, setIsListening] = useState(false);
  //SpeechRecognition Object, we're going to use this to have it not re-render everytime.
  const recognitionRef = useRef(null);
  // true when the message about to be sent came from voice mode, so we know to keep listening after the reply
  const voiceReplyRef = useRef(false);
  // dedicated hands-free "voice mode" panel, separate from the mic button on the text box
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const voiceModeActiveRef = useRef(false);
  const voiceRecognitionRef = useRef(null);
  // lets voice mode's onresult hand a "confirm"/"cancel" match to onend without a stale closure
  const voiceCommandRef = useRef(null);
  const messagesRef = useRef([]);
  const [savingItem, setSavingItem] = useState(null);
  const [pendingRequest, setPendingRequest] = useState('');
  const [editingProposal, setEditingProposal] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [isBriefing, setIsBriefing] = useState(false);
  const { addItem } = useSchedule();
  const isSending = useRef(false);
  const isSaving = useRef(false);
  const messageInput = useRef(null);
  // marks the bottom of the message list so we can scroll it into view whenever
  // a new message (or a status line like "Thinking...") shows up
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!messageInput.current) {
      return;
    }

    const defaultHeight = 30;
    const maxHeight = 160;
    const textarea = messageInput.current;
    const shell = textarea.closest('.chat-input-shell');

    textarea.style.height = 'auto';

    if (!message) {
      shell?.classList.remove('is-expanded');
      textarea.style.height = `${defaultHeight}px`;
      textarea.style.overflowY = 'hidden';
      return;
    }

    // Measure in compact mode so the expand/shrink decision is stable.
    shell?.classList.remove('is-expanded');
    textarea.style.height = 'auto';

    const compactScrollHeight = textarea.scrollHeight;
    const shouldExpand = compactScrollHeight > defaultHeight + 4;

    // Apply the layout we actually want before measuring final height.
    shell?.classList.toggle('is-expanded', shouldExpand);
    textarea.style.height = 'auto';

    const finalScrollHeight = textarea.scrollHeight;
    const nextHeight = Math.min(finalScrollHeight, maxHeight);
    textarea.style.height = `${Math.max(nextHeight, defaultHeight)}px`;
    textarea.style.overflowY = finalScrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [message]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Autoscrolls to the newest message whenever the conversation grows or a
  // status line (Thinking..., Creating your daily brief...) appears. Also
  // keyed on voiceStatus so voice mode scrolls down the moment a prompt is
  // sent, not only once the reply message shows up.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, isBriefing, isLoadingHistory, voiceStatus]);

  // Keeps the parent's copy of the daily-brief loading state in sync so its
  // button (next to import/export) can show the right label and disable itself.
  useEffect(() => {
    onDailyBriefStateChange?.({ isBriefing, disabled: isBriefing || isLoadingHistory });
  }, [isBriefing, isLoadingHistory, onDailyBriefStateChange]);

  // Bring the saved conversation back when the chat opens. The cancelled flag
  // keeps the second run React does in development from setting state twice.
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const savedMessages = await loadAiMessages();

        if (!cancelled) {
          setMessages(toChatMessages(savedMessages));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  // Ask the backend to summarize today's schedule and show it in a modal.
  async function handleDailyBrief() {
    if (isBriefing) {
      return;
    }

    setIsBriefing(true);
    setError('');

    try {
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      setBriefing(await requestDailyBriefing(timeZone));
      setMessages((currentMessages) => [...currentMessages, {
        sender: 'ai',
        text: 'Your daily brief has been created.',
      }])
    } catch (briefingError) {
      setError(briefingError.message);
    } finally {
      setIsBriefing(false);
    }
  }

  // Keeps the brief as a note so it is still there after the modal closes.
  async function handleSaveBriefNote(title, description) {
    await addItem({ itemType: 'note', title, description });
  }

  // Lets the Daily brief button living next to the calendar's import/export
  // controls trigger the same flow that lives here alongside the chat state.
  useImperativeHandle(ref, () => ({ runDailyBrief: handleDailyBrief }));

  function handleEdit(messageIndex, itemIndex, proposal) {
    setEditingProposal({ messageIndex, itemIndex, proposal });
  }

  function handleApplySlot(messageIndex, itemIndex, slot) {
    setMessages((currentMessages) =>
      applyFreeSlot(currentMessages, messageIndex, itemIndex, slot),
    );
  }

  // Keeps the saved copy of an AI message in step with what the chat shows, so
  // the same proposals come back after a refresh.
  async function syncMessageItems(updatedMessages, messageIndex) {
    const savedMessage = updatedMessages[messageIndex];

    if (!savedMessage || !savedMessage.id) {
      return;
    }

    await updateAiMessageItems(savedMessage.id, toSavedItems(savedMessage.items));
  }

  async function handleCancel(messageIndex, itemIndex) {
    const updatedMessages = removeProposal(messages, messageIndex, itemIndex);

    setMessages(updatedMessages);
    setPendingRequest('');

    try {
      await syncMessageItems(updatedMessages, messageIndex);
    } catch (historyError) {
      setError(historyError.message);
    }
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
    // without this it auto-stops after the first pause instead of waiting for us to click stop
    recognition.continuous = true;
    // shows the text live as you talk instead of only at the very end
    recognition.interimResults = true;

    // fires repeatedly while you talk, with everything transcribed so far
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setMessage(transcript.trim());
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

  function exitVoiceMode() {
    voiceModeActiveRef.current = false;

    try {
      voiceRecognitionRef.current?.stop();
    } catch {
      // already stopped
    }

    setVoiceMode(false);
    setVoiceStatus('idle');
  }

  // "say confirm" only makes sense when the last thing the ai said is a single
  // event/task waiting on you - finds that proposal, or null if it's ambiguous.
  function findPendingProposal(currentMessages) {
    const lastMessageIndex = currentMessages.length - 1;
    const lastMessage = currentMessages[lastMessageIndex];

    if (!lastMessage || lastMessage.sender !== 'ai' || !Array.isArray(lastMessage.items)) {
      return null;
    }

    const pendingProposals = lastMessage.items
      .map((item, itemIndex) => ({ item, itemIndex }))
      .filter(({ item }) => item.kind === 'proposal' && item.proposal && !item.isSaved);

    if (pendingProposals.length !== 1) {
      return null;
    }

    const { item, itemIndex } = pendingProposals[0];
    return { messageIndex: lastMessageIndex, itemIndex, proposal: item.proposal };
  }

  const VOICE_COMMAND_PHRASES = {
    confirm: ['confirm', 'confirm it', 'confirm that', 'yes confirm', 'save it', 'save that'],
    cancel: ['cancel', 'cancel it', 'cancel that', 'delete', 'delete it', 'delete that', 'no cancel'],
    edit: ['edit', 'edit it', 'edit that', 'change it', 'change that'],
    // does not need a pending proposal to work, unlike the three above
    exit: ['exit', 'exit voice mode', 'stop', 'stop voice mode', 'end voice mode'],
  };

  function matchVoiceCommand(transcript) {
    const cleaned = transcript.toLowerCase().trim();
    return (
      Object.keys(VOICE_COMMAND_PHRASES).find((command) =>
        VOICE_COMMAND_PHRASES[command].includes(cleaned),
      ) || null
    );
  }

  // runs "confirm" hands-free instead of sending it to the ai as a new message
  async function runConfirmVoiceCommand(pending) {
    setVoiceStatus('thinking');
    await handleConfirm(pending.messageIndex, pending.itemIndex, pending.proposal);

    if (voiceModeActiveRef.current) {
      resumeVoiceListening();
    }
  }

  // runs "cancel" hands-free instead of sending it to the ai as a new message
  async function runCancelVoiceCommand(pending) {
    setVoiceStatus('thinking');
    await handleCancel(pending.messageIndex, pending.itemIndex);

    if (voiceModeActiveRef.current) {
      resumeVoiceListening();
    }
  }

  // gives the user a moment to read the reply/card and gather their thoughts
  // instead of the mic jumping back on the instant a reply shows up
  const VOICE_LISTEN_RESUME_DELAY_MS = 1500;
  function resumeVoiceListening() {
    setTimeout(() => {
      if (voiceModeActiveRef.current) {
        startVoiceListening();
      }
    }, VOICE_LISTEN_RESUME_DELAY_MS);
  }

  // "edit" opens the same edit form the button does, which needs typing, so
  // voice mode steps aside instead of trying to keep listening through it.
  function runEditVoiceCommand(pending) {
    handleEdit(pending.messageIndex, pending.itemIndex, pending.proposal);
    exitVoiceMode();
  }

  // listens for one turn, then hands off to handleSubmit through voiceReplyRef.
  // called again after the ai finishes speaking, so the conversation keeps going hands-free.
  function startVoiceListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    // false here on purpose: we want it to stop itself once you pause, that's the "done talking" signal
    recognition.continuous = false;
    recognition.interimResults = false;

    let hadError = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      const command = matchVoiceCommand(transcript);

      if (command === 'exit') {
        voiceCommandRef.current = { type: 'exit' };
        return;
      }

      const pending = command ? findPendingProposal(messagesRef.current) : null;

      if (command && pending) {
        voiceCommandRef.current = { type: command, pending };
        return;
      }

      voiceCommandRef.current = null;
      setMessage(transcript);
    };

    recognition.onerror = (event) => {
      hadError = true;

      // nobody said anything this round, just keep listening
      if (event.error === 'no-speech') {
        return;
      }

      setError(`Voice input error: ${event.error}`);
      exitVoiceMode();
    };

    recognition.onend = () => {
      if (!voiceModeActiveRef.current) {
        return;
      }

      if (hadError) {
        startVoiceListening();
        return;
      }

      const voiceCommand = voiceCommandRef.current;
      voiceCommandRef.current = null;

      if (voiceCommand?.type === 'exit') {
        exitVoiceMode();
        return;
      }

      if (voiceCommand?.type === 'confirm') {
        runConfirmVoiceCommand(voiceCommand.pending);
        return;
      }

      if (voiceCommand?.type === 'cancel') {
        runCancelVoiceCommand(voiceCommand.pending);
        return;
      }

      if (voiceCommand?.type === 'edit') {
        runEditVoiceCommand(voiceCommand.pending);
        return;
      }

      voiceReplyRef.current = true;
      messageInput.current?.form?.requestSubmit();
    };

    voiceRecognitionRef.current = recognition;
    setVoiceStatus('listening');
    recognition.start();
  }

  function enterVoiceMode() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    setVoiceMode(true);
    voiceModeActiveRef.current = true;
    startVoiceListening();
  }

  async function handleSaveProposalEdit(updatedItem) {
    if (!editingProposal) {
      return;
    }

    const { messageIndex, itemIndex, proposal } = editingProposal;
    const updatedProposal = {
      ...updatedItem,
      timeZone: proposal.timeZone,
      source: proposal.source,
      allDay: proposal.allDay ?? false,
    };

    const updatedMessages = updateProposal(
      messages,
      messageIndex,
      itemIndex,
      updatedProposal,
    );

    setMessages(updatedMessages);
    setEditingProposal(null);

    try {
      await syncMessageItems(updatedMessages, messageIndex);
    } catch (historyError) {
      setError(historyError.message);
    }
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

      // Mark it saved before touching history so a second click cannot add the
      // same item to the calendar twice.
      const updatedMessages = markProposalSaved(
        messages,
        messageIndex,
        itemIndex,
      );

      setMessages(updatedMessages);
      setPendingRequest('');

      try {
        await syncMessageItems(updatedMessages, messageIndex);
      } catch {
        setError(
          'Saved to your calendar, but the chat history did not update.',
        );
      }

      return true;
    } catch (saveError) {
      const errorMessage =
        saveError instanceof Error
          ? saveError.message
          : 'Could not save the proposal.';
      setError(errorMessage);
      return false;
    } finally {
      isSaving.current = false;
      setSavingItem(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const isVoiceReply = voiceReplyRef.current;
    voiceReplyRef.current = false;

    const cleanedMessage = message.trim();
    if (!cleanedMessage || isSending.current || isLoadingHistory) {
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

    if (isVoiceReply) {
      setVoiceStatus('thinking');
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { sender: 'user', text: cleanedMessage },
    ]);

    try {
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const result = await requestScheduleProposal(requestMessage, timeZone);

      // a conflicting proposal needs the same "reply with more details" flow
      // as a clarification, so a follow-up like "5 to 5:30 instead" has context
      if (hasClarification(result.items) || hasUnresolvedConflict(result.items)) {
        setPendingRequest(requestMessage);
      } else {
        setPendingRequest('');
      }

      const aiText = getAiResponseText(result.items);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          sender: 'ai',
          text: aiText,
          items: result.items,
        },
      ]);

      // Save only after Gemini replied, so a failed request is never stored and
      // the backend does not see this prompt twice when it builds context.
      try {
        await saveAiMessage({ sender: 'user', text: cleanedMessage });

        const savedAiMessage = await saveAiMessage({
          sender: 'ai',
          text: aiText,
          items: toSavedItems(result.items),
        });

        setMessages((currentMessages) =>
          setLastMessageId(currentMessages, savedAiMessage.id),
        );
      } catch (historyError) {
        setError(historyError.message);
      }

      // reply is shown in the chat as text - just keep listening for the next turn
      if (isVoiceReply && voiceModeActiveRef.current) {
        resumeVoiceListening();
      }
    } catch (requestError) {
      setError(requestError.message);

      if (isVoiceReply && voiceModeActiveRef.current) {
        startVoiceListening();
      }
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
    <>
      <section className="chat-bar">
        <div className="chat-header">
          <h2>Chat</h2>
          <button type="button" className="voice-mode-toggle" onClick={enterVoiceMode}>
            Voice mode
          </button>
        </div>

        <div className="chat-messages" aria-live="polite">
          {messages.map((chatMessage, messageIndex) => (
            <div
              className={`chat-message ${chatMessage.sender}-message`}
              key={`${chatMessage.sender}-${messageIndex}`}
            >
              <strong>{chatMessage.sender === 'user' ? 'You:' : 'AI:'}</strong>
              {chatMessage.text && <p>{chatMessage.text}</p>}

              {chatMessage.items?.map((item, itemIndex) =>
                item.kind === 'clarification' && item.question ? (
                  <p key={`question-${itemIndex}`}>{item.question}</p>
                ) : item.kind === 'proposal' && item.proposal ? (
                  <AiProposalPreview
                    key={`proposal-${itemIndex}`}
                    proposal={item.proposal}
                    conflicts={item.conflicts}
                    freeSlots={item.freeSlots}
                    onConfirm={() =>
                      handleConfirm(messageIndex, itemIndex, item.proposal)
                    }
                    onEdit={() =>
                      handleEdit(messageIndex, itemIndex, item.proposal)
                    }
                    onSelectSlot={(slot) =>
                      handleApplySlot(messageIndex, itemIndex, slot)
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

          {isLoadingHistory && (
            <p className="inline-flex items-center gap-2" role="status">
              <AgentaMark size={18} animated />
              Loading your chat...
            </p>
          )}
          {isLoading && (
            <p className="inline-flex items-center gap-2" role="status">
              <AgentaMark size={18} animated />
              Thinking...
            </p>
          )}
          {isBriefing && (
            <p className="inline-flex items-center gap-2" role="status">
              <AgentaMark size={18} animated />
              Creating your daily brief...
            </p>
          )}
          {error && <p role="alert">{error}</p>}
          <div ref={messagesEndRef} />
        </div>

        {voiceMode && (
          <div className="voice-panel">
            <div className={`voice-orb voice-orb-${voiceStatus}`} />
            <p className="voice-status">
              {voiceStatus === 'listening' && 'Listening...'}
              {voiceStatus === 'thinking' && 'Thinking...'}
              {voiceStatus === 'idle' && 'Starting...'}
            </p>
            <button type="button" className="voice-panel-end" onClick={exitVoiceMode}>
              End voice mode
            </button>
          </div>
        )}

        {/* stays mounted (just hidden) in voice mode so the mic loop can still submit it */}
        <form
          className={`chat-compose${voiceMode ? ' chat-compose-hidden' : ''}`}
          onSubmit={handleSubmit}
        >
          <div className="chat-input-shell">
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

            <div className="chat-input-actions">
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
            </div>
          </div>
        </form>
      </section>
      {briefing && (
        <DailyBriefModal
          briefing={briefing}
          onClose={() => setBriefing(null)}
          onSaveNote={handleSaveBriefNote}
        />
      )}

      {editingProposal && (
        <ScheduleItemModal
          itemToEdit={editingProposal.proposal}
          onSaveDraft={handleSaveProposalEdit}
          onClose={() => setEditingProposal(null)}
        />
      )}
    </>
  );
});

export default Chat;
