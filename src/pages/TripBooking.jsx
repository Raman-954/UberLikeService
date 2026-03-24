import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationInput from "../components/LocationInput";
import api from "../utils/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  MapPinIcon,
  FlagIcon,
  TruckIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";


export default function TripBooking() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const map = useRef(null);

  const pickupMarker = useRef(null);
  const dropMarker = useRef(null);

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [vehicleType, setVehicleType] = useState("economy");
  const [penaltyDue, setPenaltyDue] = useState(0);

  /* =====================
     MAP INIT
  ====================== */
useEffect(() => {
  if (!mapRef.current) return;

  map.current = L.map(mapRef.current).setView([28.6139, 77.2090], 12);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution: "&copy; OpenStreetMap & Carto",
    }
  ).addTo(map.current);

  return () => map.current.remove();
}, []);

  /* =====================
     MARKERS
  ====================== */
  useEffect(() => {
  if (!pickup || !map.current) return;

  if (pickupMarker.current) {
    map.current.removeLayer(pickupMarker.current);
  }

  pickupMarker.current = L.marker([
    pickup.center[1],
    pickup.center[0],
  ]).addTo(map.current);

  map.current.setView(
    [pickup.center[1], pickup.center[0]],
    14
  );
}, [pickup]);

  useEffect(() => {
  if (!drop || !map.current) return;

  if (dropMarker.current) {
    map.current.removeLayer(dropMarker.current);
  }

  dropMarker.current = L.marker([
    drop.center[1],
    drop.center[0],
  ]).addTo(map.current);

  map.current.setView(
    [drop.center[1], drop.center[0]],
    15
  );
}, [drop]);

  /* =====================
     ROUTE
  ====================== */
  useEffect(() => {
    if (pickup && drop) drawRoute(pickup.center, drop.center);
  }, [pickup, drop]);

const drawRoute = async (start, end) => {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`
    );

    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      console.error("No route found");
      return;
    }

    const route = data.routes[0];

    setDistance((route.distance / 1000).toFixed(1));
    setDuration(Math.ceil(route.duration / 60));

    // remove old route
    if (map.current.routeLayer) {
      map.current.removeLayer(map.current.routeLayer);
    }

    const coords = route.geometry.coordinates.map(coord => [
      coord[1],
      coord[0],
    ]);

    map.current.routeLayer = L.polyline(coords, {
      color: "black",
      weight: 5,
    }).addTo(map.current);

  } catch (err) {
    console.error("Routing error:", err);
  }
};

  const handleSearchRides = () => {
    if (!pickup || !drop) return;

    navigate("/available-drivers", {
      state: {
        pickup,
        drop,
        distance,
        duration,
        vehicleType,
      },
    });
  };
   useEffect(() => {
    api.get('/dashboard/user').then((res) => {
      if (res.data?.user?.penaltyDue) setPenaltyDue(res.data.user.penaltyDue);
    }).catch(err => console.error(err));
  }, []);

  // Handle payment
  const handlePayPenalty = async () => {
    try {
      await api.post('/rides/pay-penalty');
      setPenaltyDue(0);
      alert('Penalty cleared! You can now book rides.');
    } catch (err) {
      alert('Payment failed.');
    }
  };

  // ADD THIS EARLY RETURN ABOVE THE MAIN RETURN
  if (penaltyDue > 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-neutral-100">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Action Blocked</h2>
          <p className="text-gray-600 mb-6">
            You have a pending cancellation penalty of <span className="font-bold">₹{penaltyDue}</span>. 
            You cannot book a new ride until this is cleared.
          </p>
          <button onClick={handlePayPenalty} className="w-full bg-black text-white py-3 rounded-xl hover:bg-neutral-800">
            Pay ₹{penaltyDue} Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* ================= NAVBAR ================= */}
      <header className="flex items-center justify-between bg-black px-6 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black font-bold">
            S
          </div>
          <span className="text-lg font-semibold tracking-wide">SAWAARI</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-full border border-white/30 px-4 py-1.5 text-sm hover:bg-white hover:text-black transition"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/user/dashboard")}
            className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-neutral-200 transition"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <div className="flex flex-1">
        {/* LEFT PANEL */}
        <div className="w-[420px] border-r bg-white p-6 flex flex-col">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Request a ride
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Choose pickup, drop & vehicle
            </p>
          </div>

          {/* Pickup */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pickup location
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <LocationInput
                placeholder="Enter pickup location"
                onSelect={setPickup}
                className="pl-10"
              />
            </div>
          </div>

          {/* Drop */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Drop location
            </label>
            <div className="relative">
              <FlagIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <LocationInput
                placeholder="Enter drop location"
                onSelect={setDrop}
                className="pl-10"
              />
            </div>
          </div>

          {/* Distance / ETA */}
          {distance && (
            <div className="mb-4 rounded-xl border bg-neutral-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <ArrowsRightLeftIcon className="h-5 w-5" />
                  Distance
                </div>
                <span className="font-semibold text-gray-900">
                  {distance} km
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <ClockIcon className="h-5 w-5" />
                  ETA
                </div>
                <span className="font-semibold text-gray-900">
                  {duration} mins
                </span>
              </div>
            </div>
          )}

          {/* Vehicle */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Vehicle type
            </label>
            <div className="relative">
              <TruckIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full rounded-lg border bg-neutral-50 p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="economy">Uber Go</option>
                <option value="comfort">Comfort</option>
                <option value="premium">Premier</option>
                <option value="xl">XL</option>
              </select>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleSearchRides}
            disabled={!pickup || !drop}
            className="mt-auto w-full rounded-xl bg-black py-3 text-sm font-semibold text-white 
                       hover:bg-neutral-900 transition
                       disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Search rides
          </button>
        </div>

        {/* MAP */}
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}
