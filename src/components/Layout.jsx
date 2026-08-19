import { Outlet, useLocation } from 'react-router';
import Navbar from './Navbar';

// Layout is the frame every page shares: navbar on top, page below.
// <Outlet /> is the slot where the matched child route renders.
//
// It takes user and onLogout only to hand them straight down to Navbar. App
// owns that state; Layout just happens to sit in between. authError is shown
// here rather than on one page, because a broken login affects all of them.
export default function Layout({ user, onLogout, authError }) {
  const { pathname } = useLocation();
  const isAppPage = pathname.startsWith('/protected');

  return (
    <div className='flex min-h-screen flex-col text-left'>
      <Navbar user={user} onLogout={onLogout} />
      <main
        className={
          isAppPage
            ? 'flex w-full flex-1 flex-col px-4 pt-4 pb-8'
            : 'mx-auto w-full max-w-3xl flex-1 px-4 py-8'
        }
      >
        {authError && (
          <p
            role='alert'
            className='mb-6 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500'
          >
            {authError}
          </p>
        )}
        <Outlet />
      </main>
    </div>
  );
}
