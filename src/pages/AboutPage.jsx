import { Link } from 'react-router';

const team = [
  { initials: 'DL', name: 'Daniel L.' },
  { initials: 'JX', name: 'Jordan X.' },
  { initials: 'AV', name: 'Angel V.' },
  { initials: 'DR', name: 'Dylan R.' },
];

const aiFeatures = [
  {
    emoji: '💬',
    title: 'Just type it out',
    description: '"Study for 2 hours tomorrow after 3pm" becomes a real scheduled task, no forms required.',
  },
  {
    emoji: '🗓️',
    title: 'Finds you the time',
    description: 'The AI checks your calendar and slots new tasks into your actual free time.',
  },
  {
    emoji: '⚡',
    title: 'Catches conflicts',
    description: 'Double-booked yourself? The AI flags it and suggests a better time before it becomes a problem.',
  },
];

export default function AboutPage() {
  return (
    <section className='text-center'>
      <h1 className='text-6xl'>Let AI plan your day.</h1>
      <p className='mb-4 text-lg'>
        An AI task manager that turns your to-do list into an actual
        schedule.
      </p>
      <p className='mx-auto mb-10 max-w-md text-sm'>
        Add tasks, events, and reminders in plain English. The AI slots them
        into your day, catches conflicts before they happen, and finds you
        the free time to get it all done.
      </p>

      <div className='mx-auto mb-16 flex max-w-2xl items-end justify-center gap-4'>
        <div className='w-full rounded-lg border border-(--border) bg-(--code-bg) p-3'>
          <div className='mb-3 flex gap-1.5'>
            <span className='h-2.5 w-2.5 rounded-full bg-(--border)' />
            <span className='h-2.5 w-2.5 rounded-full bg-(--border)' />
            <span className='h-2.5 w-2.5 rounded-full bg-(--border)' />
          </div>
          <div className='space-y-2 text-left'>
            <div className='h-4 w-1/3 rounded bg-(--border)' />
            <div className='h-10 rounded border border-(--border) bg-(--bg)' />
            <div className='h-10 rounded border border-(--border) bg-(--bg)' />
            <div className='h-10 w-2/3 rounded border-2 border-(--accent) bg-(--bg)' />
          </div>
        </div>

        <div className='hidden w-28 shrink-0 rounded-2xl border-4 border-(--border) bg-(--code-bg) p-2 sm:block'>
          <div className='space-y-1.5'>
            <div className='h-3 w-2/3 rounded bg-(--border)' />
            <div className='h-6 rounded border border-(--border) bg-(--bg)' />
            <div className='h-6 rounded border-2 border-(--accent) bg-(--bg)' />
          </div>
        </div>
      </div>

      <div className='mx-auto mb-16 grid max-w-2xl gap-8 text-left sm:grid-cols-3'>
        {aiFeatures.map((feature) => (
          <div key={feature.title}>
            <p className='mb-2 text-2xl'>{feature.emoji}</p>
            <p className='mb-1 font-medium text-(--text-h)'>{feature.title}</p>
            <p className='text-sm'>{feature.description}</p>
          </div>
        ))}
      </div>

      <Link
        to='/signup'
        className='inline-block rounded-md bg-(--accent) px-5 py-2.5 font-medium text-white hover:bg-(--accent-border)'
      >
        Get started →
      </Link>

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
