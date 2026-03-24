import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import UserSignup from "./pages/UserSignup";
import DriverSignup from "./pages/DriverSignup";
import TripBooking from "./pages/TripBooking";
import UserDashboard from "./pages/UserDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LandingPage from "./pages/LandingPage";
import UberBusiness from "./pages/UberBusiness";
import AvailableDrivers from "./pages/AvailableDrivers";
import RideStatus from "./pages/RideStatus";
import RidePayment from "./pages/RidePayment";

import { SocketProvider } from "./contexts/SocketContext";
import api from "./utils/api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <SocketProvider>
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/business" element={<UberBusiness />} />
        

        {/* AUTH */}
        <Route
          path="/login"
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/trip" />}
        />

        <Route
          path="/signup/user"
          element={!user ? <UserSignup setUser={setUser} /> : <Navigate to="/trip" />}
        />

        <Route
          path="/signup/driver"
          element={!user ? <DriverSignup setUser={setUser} /> : <Navigate to="/driver/dashboard" />}
        />

        {/* USER */}
        <Route
          path="/trip"
          element={
            user?.user?.userType === "user"
              ? <TripBooking />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/available-drivers"
          element={
            user?.user?.userType === "user"
              ? <AvailableDrivers />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/ride-status"
          element={
            user?.user?.userType === "user"
              ? <RideStatus />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/ride-complete"
          element={
            user?.user?.userType === "user"
              ? <RidePayment />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/user/dashboard"
          element={
            user?.user?.userType === "user"
              ? <UserDashboard user={user} onLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />

        {/* DRIVER */}
        <Route
          path="/driver/dashboard"
          element={
            user?.user?.userType === "driver"
              ? <DriverDashboard user={user} onLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin/dashboard"
          element={
            user?.user?.userType === "admin"
              ? <AdminDashboard onLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
    </SocketProvider>
  );
}

export default App;
