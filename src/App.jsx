import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedPage from './pages/ProtectedPage';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { ScheduleProvider } from './context/ScheduleContext';
import { getMe, syncUser, logoutRequest } from './api/auth';

// App does two things:
//   1. maps every URL to a page
//   2. owns the ONE piece of state the whole app cares about: `user`
//
// `user` lives up here because several places need it — the Navbar shows your
// name, ProtectedRoute decides whether to let you through, ProtectedPage shows
// your row. It gets passed DOWN as props. Login and Signup get `setUser` so
// they can report back up after a successful login.
function App() {
  // The user row from OUR database. null = nobody is logged in.
  const [user, setUser] = useState(null);
  // True until our own "am I logged in?" cookie check has answered.
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  // Set if the Auth0 login worked but we couldn't get the matching row from
  // our database. Without this the app would sit on "Checking your session…"
  // forever, waiting for a `user` that is never coming.
  const [authError, setAuthError] = useState(null);

  // Auth0's hook — only for the OAuth half of the app.
  const {
    isAuthenticated: isAuth0User,
    user: auth0User,
    isLoading: isAuth0Loading,
    getAccessTokenSilently,
    logout: auth0Logout,
  } = useAuth0();

  // On a page refresh, THREE things can be in flight at once, and
  // ProtectedRoute must not redirect while any of them is still running —
  // otherwise a logged-in user gets bounced to /login every time they hit F5:
  //
  //   1. our own cookie check (GET /auth/me)
  //   2. Auth0's SDK restoring its session from scratch
  //   3. for Auth0 users, fetching their row from OUR database
  //
  // The third clause is the subtle one. An Auth0 user has no cookie, so step 1
  // finishes almost instantly with user === null. Without waiting for the sync
  // below, there'd be a window where nothing is "loading" but nobody is logged
  // in either — and that window is exactly when the redirect fires.
  const isLoading =
    isCheckingSession ||
    isAuth0Loading ||
    (isAuth0User && !user && !authError);

  // ---------- 1. on page load: are we already logged in? ----------
  // Our JWT lives in an httpOnly cookie. That cookie survives a refresh, but
  // React state does NOT — so on every load we ask the server who we are.
  // GET /auth/me returns the user if the cookie is good, and 401s if it isn't.
  // A 401 here is the normal "not logged in" answer, not a bug.
  useEffect(() => {
    async function checkIfLoggedIn() {
      try {
        const me = await getMe(); // no token argument -> the cookie is used
        setUser(me);
      } catch {
        setUser(null); // no cookie, or it expired
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkIfLoggedIn();
  }, []);

  // ---------- 2. after an Auth0 (OAuth) login ----------
  // Auth0 knows this person, but OUR database might not. POST /auth/auth0 runs
  // findOrCreate on the backend, so the first social login CREATES their row
  // and every login after that just returns it.
  useEffect(() => {
    if (!isAuth0User || !auth0User) return;

    async function saveAuth0User() {
      try {
        const token = await getAccessTokenSilently(); // Auth0's access token
        const dbUser = await syncUser(token, {
          // Auth0 gives us a nickname; fall back to the email's local part.
          // It's only a SUGGESTION — the backend adjusts it if that username
          // is taken or too short, and tells us what it actually used.
          username: auth0User.nickname || auth0User.email?.split('@')[0],
        });
        setUser(dbUser);
        setAuthError(null);
      } catch (error) {
        // Auth0 thinks this person is logged in, but we have no row for them,
        // so the rest of the app can't work. Show it — a console.error here
        // just looks like a broken app that logs you out for no reason.
        setAuthError(
          `Signed in with Auth0, but we couldn't load your account: ${error.message}`,
        );
      }
    }

    saveAuth0User();
  }, [isAuth0User, auth0User, getAccessTokenSilently]);

  // ---------- logging out ----------
  // We can't delete an httpOnly cookie from JavaScript, so logging out HAS to
  // be a request to the server. If the user came in through Auth0, we send
  // them through Auth0's logout too.
  async function handleLogout() {
    try {
      await logoutRequest();
    } catch (error) {
      // Even if the request fails, still drop the user locally — staying
      // "logged in" on screen after clicking Log out is the worse outcome.
      console.error('Logout failed:', error.message);
    }

    setUser(null);
    setAuthError(null);

    if (isAuth0User) {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    }
  }

  return (
    <Routes>
      {/* Every route below renders inside Layout (navbar + page slot). */}
      <Route
        element={
          <Layout user={user} onLogout={handleLogout} authError={authError} />
        }
      >
        <Route path='/' element={<HomePage />} />
        <Route path='/about' element={<AboutPage />} />

        {/* Public on purpose: you can reach these while logged OUT.
            They get setUser so they can report a successful login back up. */}
        <Route path='/login' element={<Login setUser={setUser} />} />
        <Route path='/signup' element={<Signup setUser={setUser} />} />

        {/* Only reachable when logged in — ProtectedRoute redirects otherwise.
            ScheduleProvider is scoped here (not in main.jsx) because the
            calendar's data is only meaningful for a logged-in user. */}
        <Route
          path='/protected'
          element={
            <ProtectedRoute user={user} isLoading={isLoading}>
              <ScheduleProvider>
                <ProtectedPage user={user} />
              </ScheduleProvider>
            </ProtectedRoute>
          }
        />

        {/* '*' matches anything no other route claimed. Keep it LAST. */}
        <Route path='*' element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
