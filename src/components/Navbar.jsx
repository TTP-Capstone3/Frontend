import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import AgentaLockup from './AgentaLockup';

// NavLink is like an <a> tag but for client-side routing: it navigates without
// a full page reload, and it tells us when its route is active so we can style it.
//
// Navbar takes `user` and `onLogout` as props from App. It doesn't fetch
// anything or know how you logged in — it just renders what it's handed. A
// component this simple is easy to reason about and easy to reuse.
export default function Navbar({ user, onLogout }) {
  // Use whatever the user picked last time, or fall back to the browser's setting.
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Applies the theme to the page and remembers it for next time.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-(--accent)' : 'hover:text-(--text-h)'
    }`;

  return (
    <header className='border-b border-(--border)'>
      <nav className='flex w-full flex-wrap items-center justify-between gap-2 px-6 py-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <NavLink
            to='/'
            className='mr-2 text-lg font-semibold text-(--text-h)'
            aria-label='agenta home'
          >
            <AgentaLockup animated />
          </NavLink>

          {/* `end` makes "Home" active only on "/" exactly, not on every route. */}
          <NavLink to='/' end className={linkClass}>
            Home
          </NavLink>

          {/* Only show the protected link once someone is logged in. */}
          {user && (
            <NavLink to='/protected' className={linkClass}>
              My Calendar
            </NavLink>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-1 px-1 py-1'>
          {/* Switches the site between light and dark mode. */}
          <button onClick={toggleTheme} className='rounded-md px-3 py-2.5 text-(--text) hover:text-(--text-h)'>
            {theme === 'light' ? (
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-4 w-4'>
                <path d='M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z' />
              </svg>
            ) : (
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' />
              </svg>
            )}
          </button>

          {/* Auth controls: your name + Log out, or the Log in / Sign up pair. */}
          {user ? (
            <>
              <span className='px-3 py-2.5 text-sm max-[550px]:hidden'>
                {/* Our own users always have a username; Auth0 users may also
                    have a name or email worth falling back to. */}
                {user.username || user.name || user.email}
              </span>
              <button
                onClick={onLogout}
                className='rounded-md px-3 py-2.5 text-sm font-medium hover:text-(--text-h)'
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to='/login' className={linkClass}>
                Log in
              </NavLink>
              <NavLink
                to='/signup'
                className='rounded-md bg-(--accent) px-3 py-2 text-sm font-medium text-white'
              >
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
