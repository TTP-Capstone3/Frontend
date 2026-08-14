import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { signup } from '../api/auth';
import FormField from '../components/FormField';

// Validation lives OUTSIDE the component: it takes the form fields and returns
// an errors object. It touches no state and no props, so you can read it — and
// test it — on its own. An empty object back means "everything is fine".
//
// This is a convenience for the user, NOT security. The backend runs its own
// checks, because anyone can skip this form and POST straight to the API.
const validateForm = (formFields) => {
  const errors = {};

  if (!formFields.username) {
    errors.username = 'Username is required';
  } else if (
    formFields.username.length < 3 ||
    formFields.username.length > 20
  ) {
    errors.username = 'Username must be between 3 and 20 characters';
  }

  if (!formFields.email) {
    errors.email = 'Email is required';
  } else if (!formFields.email.includes('@')) {
    errors.email = 'Enter a valid email address';
  }

  if (!formFields.password) {
    errors.password = 'Password is required';
  } else if (formFields.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
};

// setUser comes down from App. After a successful signup we call it so App —
// and therefore the Navbar and every protected page — knows who just logged in.
function Signup({ setUser }) {
  const navigate = useNavigate();
  const { loginWithRedirect } = useAuth0(); // for the "Continue with Auth0" button

  // Errors start empty — nothing is wrong with a form nobody has touched yet.
  // Each key matches an input's `name`, which is what lets handleChange and
  // FormField find the right error without a separate variable per field.
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  // ONE handler for all three inputs. Every input has a `name` matching a key
  // in formData, so [name]: value updates whichever field changed.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));

    // Clear this field's error as soon as the user starts fixing it — leaving
    // it up while they type feels like the form is nagging them.
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    }
  };

  const handleSubmit = async (event) => {
    // Without this the browser does a full page reload on submit and React
    // never sees the data. The #1 thing to remember about forms in React.
    event.preventDefault();

    const formErrors = validateForm(formData);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setIsLoading(true);

    try {
      // ---- the actual call to the backend ----
      // POST /auth/signup with { username, email, password }.
      // The server hashes the password with bcrypt, saves the user, and
      // replies with a Set-Cookie header holding our JWT. By the time this
      // line finishes, the browser is already holding the login cookie.
      const newUser = await signup(formData);

      // Hand the new user up to App so the rest of the UI updates.
      setUser(newUser);

      navigate('/'); // straight into the app — no second login step
    } catch (error) {
      // Anything the server rejected — "email already exists", "username
      // taken" — or the network being down. `general` isn't a field name, so
      // it renders in the banner above the form rather than under an input.
      setErrors({ general: error.message });
    } finally {
      // Runs on success AND failure, so the button can never get stuck in its
      // disabled "Creating account…" state.
      setIsLoading(false);
    }
  };

  return (
    <section className='mx-auto w-full max-w-md'>
      <div className='rounded-xl border border-(--border) p-6 shadow-(--shadow) sm:p-8'>
        <h1 className='mb-1 text-3xl font-semibold text-(--text-h)'>Sign up</h1>
        <p className='mb-6 text-sm'>Create an account to begin using the app.</p>

        {errors.general && (
          <p
            role='alert'
            className='mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500'
          >
            {errors.general}
          </p>
        )}

        {/* noValidate turns OFF the browser's own popup validation, so our
            messages are the only ones the user sees. */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className='flex flex-col gap-4'
        >
          <FormField
            label='Username'
            name='username'
            placeholder='Enter a username'
            autoComplete='username'
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
          />

          <FormField
            label='Email'
            name='email'
            type='email'
            placeholder='name@example.com'
            autoComplete='email'
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <FormField
            label='Password'
            name='password'
            type='password'
            placeholder='At least 6 characters'
            // Tells a password manager to offer a GENERATED password here
            // rather than autofilling an existing one.
            autoComplete='new-password'
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />

          <button
            type='submit'
            disabled={isLoading}
            className='mt-2 rounded-md bg-(--accent) px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {/* The OAuth alternative. Same destination, completely different route:
            Auth0 collects the credential and we never handle a password. */}
        <div className='my-6 flex items-center gap-3'>
          <span className='h-px flex-1 bg-(--border)' />
          <span className='text-xs tracking-wide uppercase'>or</span>
          <span className='h-px flex-1 bg-(--border)' />
        </div>

        <button
          type='button'
          onClick={() => loginWithRedirect()}
          className='w-full rounded-md border border-(--border) px-4 py-2.5 font-medium transition hover:text-(--text-h)'
        >
          Continue with Auth0
        </button>

        <p className='mt-6 text-center text-sm'>
          Already have an account?{' '}
          <Link
            to='/login'
            className='font-medium text-(--accent) hover:underline'
          >
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Signup;
