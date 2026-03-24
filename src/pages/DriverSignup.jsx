import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function DriverSignup({ setUser }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicleType: 'economy',
    vehicleModel: '',
    vehicleNumber: '',
    licenseNumber: ''
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
      const res = await api.post('/auth/signup/driver', formData);
      setUser(res.data);
      navigate('/driver/dashboard');
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
      
      {/* LEFT SIDE – VIDEO */}
      <div className="hidden md:block relative bg-black">
  <img
    src="/Signup.png"
    alt="Driver signup"
    className="h-190 w-200 object-cover"
  />

  {/* Black overlay for depth */}
  <div className="absolute inset-0 bg-black/40" />

  
</div>


      {/* RIGHT SIDE – FORM */}
      <div className="bg-white flex flex-col justify-center px-8 ">
        <div className="max-w-md w-full mx-auto">
          
          <p className="text-2xl text-black mt-1 font-bold">
            Create a driver account
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {[
              { label: 'Full name', name: 'name', type: 'text' },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Phone', name: 'phone', type: 'tel', pattern: '[0-9]{10}' },
              { label: 'Password', name: 'password', type: 'password', minLength: 6 },
              { label: 'Vehicle model', name: 'vehicleModel', type: 'text' },
              { label: 'Vehicle number', name: 'vehicleNumber', type: 'text' },
              { label: 'License number', name: 'licenseNumber', type: 'text' }
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
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Vehicle type
              </label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="economy">Economy</option>
                <option value="comfort">Comfort</option>
                <option value="premium">Premium</option>
                <option value="xl">XL</option>
                <option value="suv">SUV</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black py-2.5 text-white font-semibold hover:bg-neutral-900 disabled:opacity-70"
            >
              {loading ? 'Creating account…' : 'Sign up as driver'}
            </button>
          </form>

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

export default DriverSignup;
