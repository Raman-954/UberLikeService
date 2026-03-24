import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';  

export default function RideStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  
  const { rideId, pickup, drop, distance, duration, vehicleType } = location.state || {};
  
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('requested'); // requested, accepted, started
  const [cancelMsg, setCancelMsg] = useState('Free cancellation while waiting for driver.');
  
  // MAP REFS
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const driverMarker = useRef(null);

  // --- DEBUGGING: Monitor ride data changes ---
  useEffect(() => {
    if (ride) {
      console.log("Current Ride State Updated:", ride);
      console.log("Current Status:", status);
      console.log("OTP in State:", ride.startOTP);
    }
  }, [ride, status]);

  // --- DYNAMIC CANCELLATION MESSAGE LOGIC ---
  useEffect(() => {
    let interval;
    if (status === 'accepted' && ride?.acceptedAt) {
      interval = setInterval(() => {
        const minsPassed = (new Date() - new Date(ride.acceptedAt)) / 60000;
        if (minsPassed <= 3) {
          const timeLeft = Math.ceil(3 - minsPassed);
          setCancelMsg(`Free cancellation within grace period (${timeLeft} min${timeLeft !== 1 ? 's' : ''} left)`);
        } else {
          setCancelMsg('Cancellation may incur a ₹50 fee (Unless driver is delayed/far)');
        }
      }, 1000);
    } else if (status === 'started') {
      setCancelMsg('Ride started! Cancellation will incur a fee based on distance covered.');
    } else if (status === 'requested') {
      setCancelMsg('Free cancellation while waiting for driver.');
    }

    return () => clearInterval(interval);
  }, [status, ride]);

  // --- SOCKET & DATA FETCHING ---
  useEffect(() => {
    if (!rideId) {
      navigate('/trip');
      return;
    }

    fetchRideStatus();

    if (socket) {
      console.log("Joining ride room:", rideId);
      socket.emit('ride:join', { rideId });

      const handleAccepted = (data) => {
        console.log("SOCKET EVENT: ride:accepted received", data);
        if (data.ride._id === rideId) {
          setStatus('accepted');
          setRide(data.ride);
        }
      };

      const handleStarted = (data) => {
        console.log("SOCKET EVENT: ride:started received", data);
        if (data.ride._id === rideId) {
          setStatus('started');
          setRide(data.ride);
        }
      };

      const handleEnded = (data) => {
        console.log("SOCKET EVENT: ride:ended received", data);
        if (data.ride._id === rideId) {
          setStatus('ended');
          setRide(data.ride);
          navigate('/ride-complete', {
            state: { rideId, fare: data.ride.fare }
          });
        }
      };

      // REAL-TIME DRIVER TRACKING
      const handleDriverLocation = (data) => {
        if (mapInstance.current && driverMarker.current) {
          const { latitude, longitude } = data.location;
          driverMarker.current.setLatLng([latitude, longitude]);
          mapInstance.current.setView([latitude, longitude], 15);
        }
      };

      // LISTEN FOR DRIVER CANCELLATION
      const handleCancelled = (data) => {
        if (data.ride._id === rideId && data.cancelledBy === 'driver') {
          alert("The driver cancelled the ride. Please book a new one.");
          navigate('/trip');
        }
      };

      socket.on('ride:accepted', handleAccepted);
      socket.on('ride:started', handleStarted);
      socket.on('ride:ended', handleEnded);
      socket.on('driver:location', handleDriverLocation);
      socket.on('ride:cancelled', handleCancelled); 

      return () => {
        socket.off('ride:accepted', handleAccepted);
        socket.off('ride:started', handleStarted);
        socket.off('ride:ended', handleEnded);
        socket.off('driver:location', handleDriverLocation);
        socket.off('ride:cancelled', handleCancelled);
      };
    }
  }, [rideId, socket, navigate]);

  // --- MAP INIT EFFECT ---
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || status === 'requested') return;
    
    // Initialize map on pickup location initially
    const initLat = pickup?.center?.[1] || 28.6139;
    const initLng = pickup?.center?.[0] || 77.2090;

    mapInstance.current = L.map(mapRef.current).setView([initLat, initLng], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapInstance.current);

    // Create a moving driver marker (Car Icon)
    const carIcon = L.divIcon({
      html: '<div style="font-size: 24px; text-align: center;">🚕</div>',
      className: '',
      iconSize: [30, 30]
    });

    driverMarker.current = L.marker([initLat, initLng], { icon: carIcon }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [status, pickup]);

  const fetchRideStatus = async () => {
    try {
      const response = await api.get('/rides/user/current');
      const currentRide = response.data.ride;
      console.log("Initial Fetch Ride Status:", currentRide);

      if (currentRide && currentRide._id === rideId) {
        setRide(currentRide);
        setStatus(currentRide.status);
      }
    } catch (error) {
      console.error('Error fetching ride status:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- CANCEL RIDE HANDLER ---
  const handleCancelRide = async () => {
    if (!window.confirm("Are you sure you want to cancel? Any applicable fees are calculated based on driver distance and wait time.")) return;
    
    try {
      const res = await api.post(`/rides/${rideId}/cancel`);
      const penalty = res.data.penalty;
      
      if (penalty > 0) {
        alert(`Ride cancelled. A penalty of ₹${penalty} was applied to your account.`);
      } else {
        alert("Ride cancelled successfully with NO penalty fee.");
      }
      navigate('/trip');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel the ride');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-sm text-neutral-600">Loading ride status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
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
          Home
        </button>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-2xl px-4 py-8 flex-1 flex flex-col">
        
        {/* ==================================
            SECURITY: OTP & QR CODE DISPLAY
        ================================== */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm text-center border-t-4 border-black">
          
          {/* STEP 1: REQUESTED (Waiting for Driver) */}
          {status === 'requested' && (
            <>
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-neutral-300 border-t-black"></div>
              <h2 className="text-xl font-bold text-neutral-900">Waiting for driver...</h2>
              <p className="text-sm text-neutral-500 mt-2">किसी ड्राइवर के स्वीकार करने का इंतज़ार कर रहे हैं।</p>
            </>
          )}

          {/* STEP 2: ACCEPTED (Show OTP) */}
          {(status === 'accepted' || (ride && ride.status === 'accepted')) && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-emerald-600 mb-2">Driver is arriving!</h2>
              <p className="text-sm text-neutral-600 mb-4 font-medium">राइड शुरू करने के लिए ड्राइवर को यह OTP बताएं:</p>
              
              <div className="inline-block bg-neutral-100 rounded-xl px-10 py-4 tracking-[0.5em] text-5xl font-black text-black border-4 border-double border-emerald-500 shadow-inner">
                {ride?.startOTP || "----"}
              </div>

              <div className="mt-4 p-3 bg-emerald-50 rounded-lg inline-block border border-emerald-100">
                 <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                   OTP Security Code
                 </p>
              </div>
            </div>
          )}

          {/* STEP 3: STARTED (Show QR Code) */}
          {status === 'started' && (
            <div className="flex flex-col items-center animate-fadeIn">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">Ride in Progress</h2>
              <p className="text-sm text-neutral-600 mb-4 font-medium">राइड खत्म करने के लिए ड्राइवर को यह QR कोड दिखाएं।</p>
              
              <div className="p-4 bg-white border-4 border-blue-500 rounded-2xl shadow-xl">
                <img 
                  src="/my-qr.png" 
                  alt="Ride QR Code" 
                  className="w-52 h-52 object-contain mx-auto"
                  onError={(e) => { e.target.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + rideId }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ride Details Card */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-neutral-100">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900">Ride Details</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 rounded-full bg-green-500 ring-4 ring-green-100"></div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase text-neutral-400">Pickup</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {pickup?.place_name || pickup?.text || "Pickup Point"}
                </p>
              </div>
            </div>
            
            <div className="ml-1.5 h-6 w-0.5 border-l-2 border-dashed border-neutral-300"></div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 rounded-full bg-red-500 ring-4 ring-red-100"></div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase text-neutral-400">Drop</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {drop?.place_name || drop?.text || "Destination"}
                </p>
              </div>
            </div>
          </div>

          {/* Driver Info Section */}
          {ride?.driverId && (
            <div className="mt-6 border-t border-neutral-100 pt-4 bg-neutral-50 -mx-6 px-6 pb-4">
              <h4 className="mb-3 text-xs font-bold uppercase text-neutral-400 tracking-wider">Driver Information</h4>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-xl font-bold text-white shadow-lg">
                  {ride.driverId.userId?.name?.charAt(0).toUpperCase() || 'D'}
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-neutral-900">
                    {ride.driverId.userId?.name || 'Driver'}
                  </p>
                  <p className="text-sm font-medium text-neutral-600">
                    {ride.driverId.vehicleModel} • <span className="bg-neutral-200 px-1.5 py-0.5 rounded text-black text-xs">{ride.driverId.vehicleNumber}</span>
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-amber-500">★</span>
                    <span className="text-sm font-bold">{ride.driverId.rating?.toFixed(1) || '4.5'}</span>
                  </div>
                </div>
                <div className="text-right">
                   <a href={`tel:${ride.driverId.userId?.phone || ''}`} className="inline-block p-3 bg-emerald-500 text-white rounded-full shadow-md hover:bg-emerald-600 transition">
                      📞
                   </a>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
            <div>
              <p className="text-xs font-bold uppercase text-neutral-400">Distance</p>
              <p className="text-sm font-bold text-neutral-900">{distance} km</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-neutral-400">
                Total Fare 
              </p>
              <p className="text-xl font-black text-neutral-900">
                ₹{ride?.fare || '...'}
                {ride?.surgeMultiplier > 1 && <span className="text-red-500 text-[10px] block font-bold leading-none">SURGE x{ride.surgeMultiplier.toFixed(1)}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Live Map */}
        {status !== 'requested' && (
           <div className="mt-6 h-64 w-full rounded-2xl overflow-hidden shadow-md border-2 border-white ring-1 ring-neutral-200">
             <div ref={mapRef} className="h-full w-full" />
           </div>
        )}

        {/* CANCEL BUTTON */}
        {status !== 'ended' && status !== 'cancelled' && (
          <div className="mt-8 text-center px-4">
            <p className={`text-xs font-bold mb-3 px-4 py-2 rounded-full inline-block ${cancelMsg.includes('Free') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {cancelMsg}
            </p>
            <button 
              onClick={handleCancelRide}
              className="w-full rounded-2xl border-2 border-red-500 text-red-600 py-4 font-bold hover:bg-red-50 transition active:scale-95 shadow-sm"
            >
              Cancel Ride
            </button>
          </div>
        )}
      </div>
    </div>
  );
}