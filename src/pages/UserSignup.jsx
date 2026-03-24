import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function UserSignup({ setUser }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/signup/user', formData);
      setUser(res.data);
      navigate('/trip');
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        'Signup failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-neutral-900">
      
      {/* LEFT SIDE – IMAGE */}
      <div className="hidden md:block relative bg-black">
        <img
          src="/Signup.png"
          alt="User signup"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* RIGHT SIDE – FORM */}
      <div className="bg-white flex flex-col justify-center px-8">
        <div className="max-w-md w-full mx-auto">

          <h1 className="text-2xl font-bold text-neutral-900">
            Create a user account
          </h1>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg"
          >
            {[
              { label: 'Full name', name: 'name', type: 'text' },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Phone', name: 'phone', type: 'tel', pattern: '[0-9]{10}' },
              { label: 'Password', name: 'password', type: 'password', minLength: 6 }
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-neutral-700">
                  {field.label}
                </label>
                <input
                  {...field}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm focus:border-black focus:bg-white focus:outline-none"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-70"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          {/* FOOTER ACTIONS */}
          <p className="mt-4 flex items-center gap-6 text-xs text-neutral-500">
            <span>
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-neutral-900 hover:underline"
              >
                Sign in
              </Link>
            </span>

            <Link
              to="/"
              className="inline-flex items-center rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
            >
              Home
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default UserSignup;
