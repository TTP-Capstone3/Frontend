// Turn a daily briefing into the plain text saved as a note. The briefing also
// carries a headline per section, which the note does not need.
export function toBriefingText(briefing) {
  if (!briefing || typeof briefing.summary !== 'string') {
    return '';
  }

  const lines = [briefing.summary];
  const sections = Array.isArray(briefing.sections) ? briefing.sections : [];

  for (const section of sections) {
    const items = Array.isArray(section.items) ? section.items : [];
    const titles = items.map((item) => item.title);

    if (titles.length > 0) {
      lines.push(`${section.title}: ${titles.join(', ')}`);
    }
  }

  return lines.join('\n');
}

// Notes are easier to find later when the date is in the title.
export function toBriefingTitle(briefing) {
  const date = briefing?.date;
  return typeof date === 'string' && date ? `Daily brief ${date}` : 'Daily brief';
}
