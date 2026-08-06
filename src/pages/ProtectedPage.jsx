import MyCalendar from '../components/Calendar';
import Organizer from '../components/Organizer';

// The main page once logged in. Organizer on the left, calendar filling the
// rest — both share the same schedule data. Stacks on small screens, side by
// side from `md` up.
export default function ProtectedPage() {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr] md:items-start">
      <Organizer />
      <MyCalendar />
    </section>
  );
}
