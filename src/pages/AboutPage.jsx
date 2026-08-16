import { Link } from 'react-router';
import calendarScreenshot from '../assets/calendar-screenshot.jpg';

// Shown in the "Built by" section at the bottom of the page.
const team = [
  { initials: 'DL', name: 'Daniel L.' },
  { initials: 'JX', name: 'Jordan X.' },
  { initials: 'AV', name: 'Angel V.' },
  { initials: 'DR', name: 'Dylan R.' },
];

// The three feature cards shown below the mockup.
const aiFeatures = [
  {
    emoji: '💬',
    title: 'Just type it out',
    description: '"Study for 2 hours tomorrow after 3pm" becomes a real scheduled task, less inputs required.',
  },
  {
    emoji: '🗓️',
    title: 'Finds you the time',
    description: 'The AI checks your calendar and proposes new tasks into your actual free time.',
  },
  {
    emoji: '⚡',
    title: 'Detects conflicts',
    description: 'Double-booked yourself? The AI can detect it and suggest a better time before it becomes a problem.',
  },
];

export default function AboutPage({ user }) {
  return (
    <section className='text-center'>
      <h1 className='text-6xl'>Plan your schedule with AI assistance.</h1>
      <p className='mb-4 text-lg'>
        A task manager that utlizies AI to turn your to-do list into an actual
        schedule.
      </p>
      <p className='mx-auto mb-10 max-w-md text-sm'>
        Add your list of tasks, events, and reminders in plain English. The AI translates them into schedule items and
        slots them into your schedule, catches conflicts before they happen, and finds you
        the free time to get it all done.
      </p>

      {/* Real screenshot of the calendar and AI chat. */}
      <div className='mx-auto mb-16 max-w-3xl overflow-hidden rounded-lg border border-(--border)'>
        <img src={calendarScreenshot} alt='The calendar and AI chat' className='w-full' />
      </div>

      {/* One card per item in aiFeatures. */}
      <div className='mx-auto mb-16 grid max-w-2xl gap-8 text-left sm:grid-cols-3'>
        {aiFeatures.map((feature) => (
          <div key={feature.title}>
            <p className='mb-2 text-2xl'>{feature.emoji}</p>
            <p className='mb-1 font-medium text-(--text-h)'>{feature.title}</p>
            <p className='text-sm'>{feature.description}</p>
          </div>
        ))}
      </div>

      {/* If not logged in link to signup otherwise link to the calendar */}
      <Link
        to={user ? '/protected' : '/signup'}
        className='inline-block rounded-md bg-(--accent) px-5 py-2.5 font-medium text-white hover:bg-(--accent-border)'
      >
        Get started →
      </Link>

      {/* One circle per person in the team array. */}
      <div className='mt-20 border-t border-(--border) pt-6'>
        <p className='mb-3 text-sm'>Built by</p>
        <div className='flex justify-center gap-4'>
          {team.map((member) => (
            <div key={member.initials} className='flex flex-col items-center gap-1.5'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-(--accent) text-xs font-medium text-white'>
                {member.initials}
              </div>
              <p className='text-xs'>{member.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
