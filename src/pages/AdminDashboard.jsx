import { useEffect, useState } from 'react';
import api from '../utils/api';

function AdminDashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, driversRes] = await Promise.all([
          api.get('/dashboard/admin'),
          api.get('/dashboard/admin/drivers')
        ]);
        setData(statsRes.data);
        setDrivers(driversRes.data.drivers || []);
      } catch (err) {
        console.error('Admin load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const deleteDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      await api.delete(`/dashboard/admin/drivers/${driverId}`);
      setDrivers(drivers.filter((d) => d.id !== driverId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete driver');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-sm text-neutral-100">
        Loading admin dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="flex items-center justify-between bg-black px-6 py-3 text-white">
        <h1 className="text-xl font-semibold tracking-tight">Admin · Sawari</h1>
        <button
          onClick={onLogout}
          className="rounded-full border border-white/30 px-4 py-1.5 text-xs font-medium hover:bg-white hover:text-black"
        >
          Logout
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Welcome, {data?.admin?.name}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {data?.admin?.email}
          </p>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Total users
            </p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">
              {data?.stats?.totalUsers || 0}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Total drivers
            </p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">
              {data?.stats?.totalDrivers || 0}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Total earnings
            </p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">
              ₹{data?.stats?.totalEarnings || 0}
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-neutral-900">
            All drivers
          </h3>
          <div className="space-y-3">
            {drivers.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex-1">
                  <div className="mb-2 text-sm text-neutral-800">
                    <p>
                      <span className="font-semibold">{d.name}</span>{' '}
                      <span className="text-neutral-500">({d.email})</span>
                    </p>
                    <p className="text-xs text-neutral-500">
                      Phone: {d.phone}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                    <span>
                      Vehicle: {d.vehicleType} · {d.vehicleModel}
                    </span>
                    <span>Number: {d.vehicleNumber}</span>
                    <span>Rides: {d.totalRides}</span>
                    <span>Earnings: ₹{d.totalEarnings}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteDriver(d.id)}
                  className="ml-4 rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
            {drivers.length === 0 && (
              <p className="rounded-2xl bg-white p-6 text-sm text-neutral-500 shadow-sm">
                No drivers found.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;