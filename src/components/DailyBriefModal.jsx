import { useState } from 'react';
import Modal from './Modal';
import { toBriefingText, toBriefingTitle } from '../utils/dailyBriefingText';

// Shows the AI's summary of the day in the middle of the screen. Saving is a
// separate click so nothing is written to the calendar without asking first.
export default function DailyBriefModal({ briefing, onClose, onSaveNote }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  const sections = Array.isArray(briefing.sections) ? briefing.sections : [];

  async function handleSaveNote() {
    if (isSaving || isSaved) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSaveNote(toBriefingTitle(briefing), toBriefingText(briefing));
      setIsSaved(true);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={toBriefingTitle(briefing)} onClose={onClose}>
      <p className='mb-3'>{briefing.summary}</p>

      {sections.map((section) => (
        <div key={section.key} className='mb-3'>
          <strong>{section.title}</strong>
          <ul>
            {section.items.map((item) => (
              <li key={item.key}>{item.title}</li>
            ))}
          </ul>
        </div>
      ))}

      {error && <p role='alert'>{error}</p>}

      <div className='schedule-item-form-actions'>
        <button type='button' onClick={handleSaveNote} disabled={isSaving || isSaved}>
          {isSaved ? 'Saved to Notes' : isSaving ? 'Saving...' : 'Save to Notes'}
        </button>
        <button type='button' onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
