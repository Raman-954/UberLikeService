import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function Login({ setUser }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      const response = await api.post('/auth/login', formData);
      setUser(response.data);

      const type = response.data.user.userType;
      if (type === 'driver') navigate('/driver/dashboard');
      else if (type === 'admin') navigate('/admin/dashboard');
      else navigate('/trip');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-neutral-900">

      {/* LEFT – IMAGE */}
      <div className="hidden md:block relative bg-black">
        <img
          src="/Signup.png"
          alt="Login"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute bottom-10 left-10 text-white">
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-white/80 mt-2">
            Continue your journey with Sawari.
          </p>
        </div>
      </div>

      {/* RIGHT – FORM */}
      <div className="flex items-center justify-center px-8">
        <div className="w-full max-w-md">

          <h1 className="text-2xl font-bold text-white">
            Sign in to Sawari
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Access your account securely
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-900/40 border border-red-700 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* GLASS FORM */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-white/10 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:opacity-70"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* FOOTER LINKS */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
            <span>Don&apos;t have an account?</span>
            <Link to="/signup/user" className="font-medium text-white hover:underline">
              User signup
            </Link>
            <span>·</span>
            <Link to="/signup/driver" className="font-medium text-white hover:underline">
              Driver signup
            </Link>
            <span>·</span>
            <Link to="/" className="hover:text-white transition">
              Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;
