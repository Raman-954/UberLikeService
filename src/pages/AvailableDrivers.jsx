import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../contexts/SocketContext';

export default function AvailableDrivers() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  
  const { pickup, drop, distance, duration, vehicleType } = location.state || {};
  
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!pickup || !drop) {
      navigate('/trip');
      return;
    }

    fetchAvailableDrivers();
  }, [pickup, drop, vehicleType]);

  const fetchAvailableDrivers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rides/available-drivers', {
        params: {
          vehicleType,
          latitude: pickup.center[1],
          longitude: pickup.center[0]
        }
      });
      setDrivers(response.data.drivers || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      alert('Failed to fetch available drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRide = async (driverId) => {
    if (!pickup || !drop) {
      alert('Please select pickup and drop locations first');
      navigate('/trip');
      return;
    }

    try {
      setRequesting(true);
      
      // Create ride request
      const response = await api.post('/rides/request', {
        pickupLocation: {
          address: pickup.place_name || pickup.text || 'Pickup Location',
          coordinates: {
            latitude: pickup.center?.[1] || 31.224,
            longitude: pickup.center?.[0] || 75.7739
          }
        },
        dropLocation: {
          address: drop.place_name || drop.text || 'Drop Location',
          coordinates: {
            latitude: drop.center?.[1] || 31.224,
            longitude: drop.center?.[0] || 75.7739
          }
        },
        vehicleType: vehicleType || 'economy',
        distance: parseFloat(distance) || 5,
        duration: parseInt(duration) || 10
      });

      const ride = response.data.ride;

      // Navigate to ride status page
      navigate('/ride-status', {
        state: {
          rideId: ride._id,
          pickup,
          drop,
          distance,
          duration,
          vehicleType,
          driverId
        }
      });
    } catch (error) {
      console.error('Error requesting ride:', error);
      alert(error.response?.data?.message || 'Failed to request ride');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-sm text-neutral-600">Finding available drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-black px-6 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black font-bold">
            S
          </div>
          <span className="text-lg font-semibold tracking-wide">SAWAARI</span>
        </div>
        <button
          onClick={() => navigate('/trip')}
          className="rounded-full border border-white/30 px-4 py-1.5 text-sm hover:bg-white hover:text-black transition"
        >
          Back
        </button>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
            Available Drivers
          </h1>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm text-neutral-600">
              <span className="font-medium">From:</span> {pickup?.place_name || pickup?.text || 'Pickup location'}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              <span className="font-medium">To:</span> {drop?.place_name || drop?.text || 'Drop location'}
            </p>
            {(distance && duration) && (
              <p className="mt-2 text-xs text-neutral-500">
                Distance: {distance} km · ETA: {duration} mins
              </p>
            )}
          </div>
        </div>

        {drivers.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <p className="text-neutral-600">No drivers available at the moment.</p>
            <button
              onClick={fetchAvailableDrivers}
              className="mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-neutral-900"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className={`rounded-lg border-2 bg-white p-4 shadow-sm transition ${
                  selectedDriver === driver.id
                    ? 'border-black'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                onClick={() => setSelectedDriver(driver.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-lg font-semibold text-neutral-700">
                        {driver.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{driver.name}</h3>
                        <p className="text-xs text-neutral-500">
                          {driver.vehicleModel} · {driver.vehicleNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-600">
                      <span>⭐ {(driver.rating || 0).toFixed(1)}</span>
                      <span>{driver.totalRides || 0} rides</span>
                      <span className="uppercase">{driver.vehicleType}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestRide(driver.id);
                    }}
                    disabled={requesting}
                    className="ml-4 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requesting ? 'Requesting...' : 'Request Ride'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
