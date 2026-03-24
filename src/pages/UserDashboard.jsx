import { useState, useEffect } from 'react';
import api from '../utils/api';

function UserDashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/user');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-sm text-neutral-100">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="flex items-center justify-between bg-black px-6 py-3 text-white">
        <h1 className="text-xl font-semibold tracking-tight">Sawari</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = '/trip')}
            className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black shadow-sm hover:bg-neutral-100"
          >
            Book a ride
          </button>
          <button
            onClick={onLogout}
            className="rounded-full border border-white/30 px-4 py-1.5 text-xs font-medium hover:bg-white hover:text-black"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Welcome, {dashboardData?.user?.name}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {dashboardData?.user?.email}
          </p>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Total rides
            </p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">
              {dashboardData?.stats?.totalRides || 0}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Total spent
            </p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">
              ₹{dashboardData?.stats?.totalSpent || 0}
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-neutral-900">
            Recent rides
          </h3>
          {dashboardData?.recentRides?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentRides.map((ride) => (
                <div
                  key={ride._id}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div className="flex-1">
                    <div className="mb-2 text-sm text-neutral-800">
                      <p>
                        <span className="font-medium">From:</span>{' '}
                        {ride.pickupLocation.address}
                      </p>
                      <p>
                        <span className="font-medium">To:</span>{' '}
                        {ride.dropLocation.address}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
                      <span>Vehicle: {ride.vehicleType}</span>
                      <span>Distance: {ride.distance.toFixed(2)} km</span>
                      <span>Fare: ₹{ride.fare}</span>
                      <span>
                        Date:{' '}
                        {ride.completedAt
                          ? new Date(ride.completedAt).toLocaleDateString()
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {ride.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-white p-6 text-sm text-neutral-500 shadow-sm">
              No rides yet. Book your first ride to see it here.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;

