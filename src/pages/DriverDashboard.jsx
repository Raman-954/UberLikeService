import { useState, useEffect } from "react";
import api from "../utils/api";
import { useSocket } from "../contexts/SocketContext";
import { Html5QrcodeScanner } from 'html5-qrcode';

function DriverDashboard({ user, onLogout }) {
  const { socket } = useSocket();

  const [dashboardData, setDashboardData] = useState(null);
  const [pendingRides, setPendingRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [newRideRequest, setNewRideRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // PENALTY & SECURITY STATES
  const [penaltyDue, setPenaltyDue] = useState(0);
  const [otpInput, setOtpInput] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // NEW STATE FOR PAYMENT FLOW
  const [isFinishing, setIsFinishing] = useState(false);

  /* ---------------- INITIAL LOAD ---------------- */

  useEffect(() => {
    fetchDashboardData();
    fetchPendingRides();
    checkCurrentRide();
    goOnline();
  }, []);

  /* ---------------- LIVE GPS TRACKING ---------------- */
  useEffect(() => {
    let watchId;
    if (socket && currentRide && (currentRide.status === 'accepted' || currentRide.status === 'started')) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            socket.emit('driver:locationUpdate', { rideId: currentRide._id, location });
          },
          (error) => console.error('GPS Error:', error),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentRide, socket]);

  /* ---------------- SOCKET LISTENERS ---------------- */

  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = ({ ride }) => {
      if (
        dashboardData?.driver?.vehicleType === ride.vehicleType &&
        !currentRide &&
        penaltyDue === 0 // Don't show new rides if penalized
      ) {
        setNewRideRequest(ride);
        setPendingRides((prev) => [ride, ...prev]);
      }
    };

    const handleRideEnded = ({ ride }) => {
      if (currentRide && ride._id === currentRide._id) {
        setCurrentRide(ride);
        setIsFinishing(false); // Reset on end
      }
    };

    const handlePaymentReceived = ({ rideId }) => {
      if (currentRide && rideId === currentRide._id) {
        setCurrentRide((prev) => ({ ...prev, paymentReceived: true }));
      }
    };

    const handleCancelled = (data) => {
      if (currentRide && data.ride._id === currentRide._id && data.cancelledBy === 'user') {
        alert("The user cancelled the ride.");
        setCurrentRide(null);
        setIsFinishing(false);
        fetchDashboardData();
      }
    };

    socket.on("ride:request", handleNewRequest);
    socket.on("ride:ended", handleRideEnded);
    socket.on("payment:received", handlePaymentReceived);
    socket.on("ride:cancelled", handleCancelled);

    return () => {
      socket.off("ride:request", handleNewRequest);
      socket.off("ride:ended", handleRideEnded);
      socket.off("payment:received", handlePaymentReceived);
      socket.off("ride:cancelled", handleCancelled);
    };
  }, [socket, dashboardData, currentRide, penaltyDue]);

  /* ---------------- QR SCANNER SETUP ---------------- */
  useEffect(() => {
    let scanner = null;
    if (showScanner && currentRide) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(
        (decodedText) => {
          if (scanner) scanner.clear();
          setShowScanner(false);
          completeRideWithQR(currentRide._id, decodedText);
        },
        (error) => { /* ignore frame errors */ }
      );
    }
    return () => {
      if (scanner) scanner.clear().catch(e => console.error(e));
    };
  }, [showScanner, currentRide]);

  /* ---------------- API CALLS ---------------- */

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/dashboard/driver");
      setDashboardData(res.data);
      if (res.data?.driver?.penaltyDue) {
        setPenaltyDue(res.data.driver.penaltyDue);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRides = async () => {
    try {
      const res = await api.get("/rides/driver/pending");
      setPendingRides(res.data.rides || []);
    } catch (err) {
      console.error(err);
    }
  };

  const checkCurrentRide = async () => {
    try {
      const res = await api.get("/rides/driver/current");
      setCurrentRide(res.data.ride || null);
    } catch (err) {
      console.error(err);
    }
  };

  const goOnline = async () => {
    await api.post("/rides/driver/availability", { isAvailable: true });
    setIsOnline(true);
  };

  const goOffline = async () => {
    await api.post("/rides/driver/availability", { isAvailable: false });
    setIsOnline(false);
  };

  /* ---------------- ACTIONS ---------------- */

  const acceptRide = async (rideId) => {
    try {
      const res = await api.post(`/rides/${rideId}/accept`);
      setCurrentRide(res.data.ride);
      setPendingRides((prev) => prev.filter((r) => r._id !== rideId));
      setNewRideRequest(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept ride");
    }
  };

  // VERIFY OTP (Starts Ride)
  const verifyAndStartRide = async (rideId) => {
    if (!otpInput || otpInput.length < 4) return alert("Enter valid 4-digit OTP");
    try {
      const res = await api.post(`/rides/${rideId}/verify-otp`, { otp: otpInput });
      setCurrentRide(res.data.ride);
      setOtpInput("");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP. Please check with the user.");
    }
  };

  // COMPLETE RIDE (Scan QR)
  const completeRideWithQR = async (rideId, qrData) => {
    try {
      const res = await api.post(`/rides/${rideId}/complete`, { qrData });
      setCurrentRide(res.data.ride);
      setShowScanner(false);
      setIsFinishing(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to complete ride");
    }
  };

  // CANCEL RIDE
  const cancelRide = async (rideId) => {
    if (!window.confirm("WARNING: Cancelling an accepted ride incurs a ₹100 penalty. Proceed?")) return;
    try {
      const res = await api.post(`/rides/${rideId}/cancel`);
      alert(`Ride cancelled. Penalty applied: ₹${res.data.penalty}`);
      setCurrentRide(null);
      setIsFinishing(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel ride.");
    }
  };

  // PAY PENALTY
  const handlePayPenalty = async () => {
    try {
      await api.post('/rides/pay-penalty');
      setPenaltyDue(0);
      alert('Penalty cleared successfully! You can now accept rides.');
      fetchDashboardData();
    } catch (err) {
      alert('Failed to pay penalty. Please try again.');
    }
  };

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-white">
        Loading dashboard…
      </div>
    );
  }

  // --- PENALTY BLOCKER SCREEN ---
  if (penaltyDue > 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-neutral-900 text-white">
        <div className="max-w-md bg-neutral-800 p-8 rounded-2xl text-center border border-red-500/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Account Restricted</h2>
          <p className="mb-6 text-neutral-300">
            You have a pending cancellation penalty of <span className="font-bold">₹{penaltyDue}</span>.
            You cannot accept new rides until this is cleared.
          </p>
          <button
            onClick={handlePayPenalty}
            className="w-full bg-red-600 text-white py-3 font-semibold rounded-xl hover:bg-red-700 transition"
          >
            Pay ₹{penaltyDue} Now
          </button>
          <button onClick={onLogout} className="mt-4 text-sm text-neutral-400 hover:text-white">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-black/90 backdrop-blur px-6 py-4 text-white shadow-lg">
        <h1 className="text-xl font-bold tracking-wide">Sawari Driver</h1>

        <div className="flex items-center gap-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold
              ${isOnline ? "bg-green-700 text-white animate-pulse" : "bg-red-100 text-red-700"}`}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>

          <button
            onClick={isOnline ? goOffline : goOnline}
            className="rounded-full border border-white/30 px-4 py-1.5 text-xs hover:bg-white hover:text-black transition"
          >
            {isOnline ? "Go Offline" : "Go Online"}
          </button>

          <button
            onClick={onLogout}
            className="rounded-full bg-red-600 px-4 py-1.5 text-xs hover:bg-red-900 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-5xl px-6 py-6">
        <h2 className="text-2xl font-semibold">
          Welcome, {dashboardData?.user?.name}
        </h2>
        <p className="text-sm text-neutral-500">
          {dashboardData?.driver?.vehicleModel} · {dashboardData?.driver?.vehicleNumber}
        </p>

        {/* STATS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Rides", value: dashboardData?.stats?.totalRides || 0 },
            { label: "Total Earnings", value: `₹${dashboardData?.stats?.totalEarnings || 0}` },
            { label: "Status", value: isOnline ? "Online" : "Offline" }
          ].map((item, i) => (
            <div key={i} className="rounded-2xl bg-white p-5 shadow hover:shadow-xl transition">
              <p className="text-xs uppercase tracking-wider text-neutral-400">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-bold">{item.value}</p>
            </div>
          ))}
        </section>

        {/* CURRENT RIDE */}
        {currentRide && (
          <section className="mt-8 rounded-2xl bg-white p-5 shadow-lg border-l-4 border-emerald-500">
            <h3 className="mb-3 text-lg font-semibold">🚗 Current Ride</h3>

            <p><b>Pickup:</b> {currentRide.pickupLocation.address}</p>
            <p><b>Drop:</b> {currentRide.dropLocation.address}</p>
            <p>
              <b>Fare:</b> ₹{currentRide.fare}
              {currentRide.surgeMultiplier > 1 && <span className="text-red-500 text-xs ml-2 font-bold">(SURGE x{currentRide.surgeMultiplier.toFixed(1)})</span>}
            </p>

            <div className="mt-6">
              {/* STEP 1: OTP VERIFICATION */}
              {currentRide.status === "accepted" && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter User's OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    maxLength={4}
                    className="flex-1 rounded-lg border-2 border-neutral-300 px-4 py-2 text-center text-lg font-bold tracking-widest focus:border-black focus:outline-none"
                  />
                  <button
                    onClick={() => verifyAndStartRide(currentRide._id)}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Verify & Start
                  </button>
                </div>
              )}

              {/* STEP 2: COMPLETE RIDE & PAYMENT QR FLOW */}
              {currentRide.status === "started" && (
                <div className="flex flex-col gap-4">
                  {!isFinishing ? (
                    /* INITIAL END TRIP BUTTON */
                    <button
                      onClick={() => setIsFinishing(true)}
                      className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 transition"
                    >
                      🏁 End Trip & Collect ₹{currentRide.fare}
                    </button>
                  ) : (
                    /* PAYMENT QR STEP */
                    <div className="bg-neutral-50 p-6 rounded-2xl border-2 border-dashed border-neutral-300 text-center animate-fadeIn">
                      <h4 className="text-sm font-bold text-neutral-500 uppercase mb-4">Passenger Payment QR</h4>

                      {/* UPI QR Code Generation using public API */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=9540661607@pthdfc&pn=${dashboardData?.user?.name}&am=${currentRide.fare}&cu=INR`} alt="Payment QR"
                        className="mx-auto w-48 h-48 bg-white p-2 rounded-lg shadow-md mb-4"
                      />

                      <p className="text-xl font-black text-black mb-1">₹{currentRide.fare}</p>
                      <p className="text-[10px] text-neutral-400 mb-6 font-bold uppercase tracking-widest">Scan with any UPI app</p>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => completeRideWithQR(currentRide._id, "MANUAL_PAYMENT_CONFIRMED")}
                          className="w-full bg-black text-white py-3 rounded-xl font-bold shadow-xl hover:bg-neutral-800 transition"
                        >
                          ✅ Confirm Payment & Finish
                        </button>

                        {/* OLD SCANNER OPTION (NOT REMOVED) */}
                        <button
                          onClick={() => setShowScanner(true)}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Or Scan User's Confirmation QR
                        </button>

                        <button
                          onClick={() => setIsFinishing(false)}
                          className="text-xs font-bold text-neutral-400 mt-2"
                        >
                          Go Back
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SCANNER UI (KEPT FROM ORIGINAL) */}
                  {showScanner && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                      <div className="w-full max-w-sm rounded-3xl bg-white overflow-hidden shadow-2xl">
                        <div className="p-4 bg-black text-white text-center font-bold">Scan User QR</div>
                        <div id="reader" className="w-full"></div>
                        <button
                          onClick={() => setShowScanner(false)}
                          className="w-full py-4 bg-red-600 text-white font-bold hover:bg-red-700"
                        >
                          Close Scanner
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CANCEL BUTTON (KEPT FROM ORIGINAL) */}
              {(currentRide.status === "accepted" || currentRide.status === "started") && !showScanner && !isFinishing && (
                <button
                  onClick={() => cancelRide(currentRide._id)}
                  className="mt-4 w-full rounded-lg border-2 border-red-500 font-semibold text-red-600 py-2 hover:bg-red-50"
                >
                  Cancel Ride
                </button>
              )}
            </div>
          </section>
        )}

        {/* PENDING RIDES (KEPT FROM ORIGINAL) */}
        {!currentRide && pendingRides.length > 0 && (
          <section className="mt-8 rounded-2xl bg-white p-5 shadow">
            <h3 className="mb-4 text-lg font-semibold">Pending Requests</h3>
            <div className="space-y-3">
              {pendingRides.map((ride) => (
                <div key={ride._id} className="rounded-xl border p-4 hover:shadow-md transition">
                  <p><b>From:</b> {ride.pickupLocation.address}</p>
                  <p><b>To:</b> {ride.dropLocation.address}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold text-emerald-600">
                      ₹{ride.fare}
                      {ride.surgeMultiplier > 1 && <span className="text-red-500 text-xs ml-1">(Surge)</span>}
                    </span>
                    <button
                      onClick={() => acceptRide(ride._id)}
                      className="rounded-lg bg-emerald-600 px-4 py-1.5 text-white font-semibold hover:bg-emerald-700"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* NEW REQUEST FLOATING POPUP (KEPT FROM ORIGINAL) */}
      {newRideRequest && !currentRide && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] rounded-2xl bg-white p-5 shadow-2xl border-t-4 border-emerald-500 animate-slideUp">
          <h3 className="mb-2 text-lg font-semibold">🚕 New Ride Request</h3>
          <p className="text-sm truncate"><b>From:</b> {newRideRequest.pickupLocation.address}</p>
          <p className="text-sm truncate"><b>To:</b> {newRideRequest.dropLocation.address}</p>
          <p className="mt-2 text-lg font-bold text-emerald-600">Fare: ₹{newRideRequest.fare}</p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => acceptRide(newRideRequest._id)}
              className="flex-1 rounded-lg bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-700"
            >
              Accept
            </button>
            <button onClick={() => setNewRideRequest(null)} className="rounded-lg border px-4 py-2 font-semibold hover:bg-neutral-100">
              Ignore
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;