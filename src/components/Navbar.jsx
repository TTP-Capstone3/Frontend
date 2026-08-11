import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';

// NavLink is like an <a> tag but for client-side routing: it navigates without
// a full page reload, and it tells us when its route is active so we can style it.
//
// Navbar takes `user` and `onLogout` as props from App. It doesn't fetch
// anything or know how you logged in — it just renders what it's handed. A
// component this simple is easy to reason about and easy to reuse.
export default function Navbar({ user, onLogout }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

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
      <nav className='mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-3'>
        <NavLink
          to='/'
          className='mr-auto text-lg font-semibold text-(--text-h)'
        >
          Capstone
        </NavLink>

        {/* `end` makes "Home" active only on "/" exactly, not on every route. */}
        <NavLink to='/' end className={linkClass}>
          Home
        </NavLink>
        <NavLink to='/about' className={linkClass}>
          About
        </NavLink>

        {/* Only show the protected link once someone is logged in. */}
        {user && (
          <NavLink to='/protected' className={linkClass}>
            My Calendar
          </NavLink>
        )}

        <button
          onClick={toggleTheme}
          className='rounded-md px-3 py-2 text-sm font-medium hover:text-(--text-h)'
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Auth controls: your name + Log out, or the Log in / Sign up pair. */}
        {user ? (
          <>
            <span className='px-2 text-sm'>
              {/* Our own users always have a username; Auth0 users may also
                  have a name or email worth falling back to. */}
              {user.username || user.name || user.email}
            </span>
            <button
              onClick={onLogout}
              className='rounded-md px-3 py-2 text-sm font-medium hover:text-(--text-h)'
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
      </nav>
    </header>
  );
}
