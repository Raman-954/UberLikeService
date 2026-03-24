import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import HelpModal from "../pages/HelpModal";
import FuzzyText from "../components/FuzzyText";
import { motion } from "framer-motion";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const texts = ["Welcome", "आपका स्वागत है", "ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ"];
  const [currentText, setCurrentText] = useState(texts[0]);

  // 2️⃣ Cycle through texts every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText((prev) => {
        const nextIndex = (texts.indexOf(prev) + 1) % texts.length;
        return texts[nextIndex];
      });
    }, 2000); // change every 2 seconds

    return () => clearInterval(interval);
  }, []);


  const handleRideClick = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data?.user) {
        navigate("/TripBooking");
      }
      else {
        navigate("/login");
      }
    }
    catch (error) {
      navigate("/login");
    }
  };


  return (

    <div
      className="w-full min-h-screen bg-white text-black"
      style={{ position: "relative", overflow: "hidden" }}
    >

      {/* NAVBAR */}
      <nav className="flex items-center justify-center px-8 py-4 border-b bg-black text-white max-w-3xl ml-105 mt-5 space-x-10 rounded-4xl ">
        <div className="flex items-center mr-120 space-x-3">
          <img src="./logo.png" alt="Sawaari logo" className="w-10" />
          <h1 className="text-2xl font-bold">Sawaari</h1>
        </div>

        <div className="hidden md:flex gap-6 text-sm font-medium">
          <button onClick={handleRideClick} className="hover:opacity-80">
            Ride
          </button>


        </div>

        <button
          className="bg-white text-black px-4 py-2 rounded-3xl font-bold"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </nav>

      {/* <HelpModal open={showHelp} onClose={() => setShowHelp(false)} /> */}


      {/* HERO SECTION */}
     <section className="flex flex-col md:flex-row items-center justify-between md:px-20 py-20 bg-white mt-10">
        {/* LEFT SIDE TEXT */}
        <div className="md:w-1/2 w-full flex flex-col justify-center max-w-xl ">
          <FuzzyText
            baseIntensity={0.6}
            hoverIntensity={0.3}
            enableHover={true}
            color="#000000"
            className="text-3xl md:text-3xl font-semibold leading-snug"
          >
            {currentText} {/* ✅ This will now rotate correctly */}
          </FuzzyText>
          
        </div>

        {/* RIGHT SIDE VIDEO */}
        <motion.div className="md:w-1/2 w-full mt-8 md:mt-0 h-96 rounded-xl overflow-hidden flex items-center justify-center ml-20 "
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ duration: 4 }}>
          <video
            src="/video1.mp4"
            autoPlay
            muted
            loop
            className="w-full h-full object-cover rounded-xl"
          />
        </motion.div>
      </section>


      {/* HOW IT WORKS */}
      <section className="px-6 md:px-40 py-20 bg-white mt-13">
        <h3 className="text-3xl md:text-4xl font-extrabold mb-12 text-gray-900">
          Why ride with <span className="text-black">Sawaari?</span>
        </h3>

        <div className="grid md:grid-cols-3 gap-10">

          {/* Card 1 */}
          <div className="group bg-gray-50 rounded-3xl p-6 flex justify-between items-center cursor-pointer
                    transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div>
              <h4 className="font-bold text-lg text-gray-900">Fast pickups</h4>
              <p className="text-gray-600 mt-2 leading-relaxed">
                Get picked up by the nearest driver in minutes.
              </p>
              <button className="mt-6 px-5 py-2 text-sm font-medium rounded-full
                           bg-black text-white transition hover:bg-gray-800">
                Details
              </button>
            </div>
            <img
              src="./car.png"
              alt="Fast pickups"
              className="w-24 transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          {/* Card 2 */}
          <div className="group bg-gray-50 rounded-3xl p-6 flex justify-between items-center cursor-pointer
                    transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div>
              <h4 className="font-bold text-lg text-gray-900">Affordable prices</h4>
              <p className="text-gray-600 mt-2 leading-relaxed">
                Transparent pricing, no surprises.
              </p>
              <button className="mt-6 px-5 py-2 text-sm font-medium rounded-full
                           bg-black text-white transition hover:bg-gray-800">
                Details
              </button>
            </div>
            <img
              src="./price.png"
              alt="Affordable prices"
              className="w-24 transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          {/* Card 3 */}
          <div className="group bg-gray-50 rounded-3xl p-6 flex justify-between items-center cursor-pointer
                    transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div>
              <h4 className="font-bold text-lg text-gray-900">Safe rides</h4>
              <p className="text-gray-600 mt-2 leading-relaxed">
                Verified drivers and live ride tracking.
              </p>
              <button className="mt-6 px-5 py-2 text-sm font-medium rounded-full
                           bg-black text-white transition hover:bg-gray-800">
                Details
              </button>
            </div>
            <img
              src="./safe.png"
              alt="Safe rides"
              className="w-24 transition-transform duration-300 group-hover:scale-110"
            />
          </div>

        </div>
      </section>

      <section className="w-full bg-white py-20 ">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-14">
          {/* LEFT CONTENT */}
          <div>
            <h2 className="text-4xl font-semibold text-black leading-snug">
              Log in to see your account details
            </h2>

            <p className="mt-4 text-gray-600 max-w-md">
              View past trips, tailored suggestions, support resources, and
              more.
            </p>

            <div className="mt-8 flex items-center gap-6">
              <button className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-900 transition"
                onClick={() => { navigate('/login') }}>
                Log in to your account
              </button>

              <button className="text-black border-b border-black leading-none hover:opacity-70 transition"
                onClick={() => { navigate('/signup/user') }}>
                Create an account
              </button>
            </div>
          </div>

          {/* RIGHT ILLUSTRATION */}
          <div className="flex justify-center md:justify-end">
            <div className="bg-gray-100 rounded-3xl p-8 w-full max-w-md">
              <img
                src="/login.png" // replace with your image path
                alt="Login illustration"
                className="w-200"
              />
            </div>
          </div>
        </div>
      </section>



      <section className="w-full bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            {/* LEFT IMAGE */}
            <div className="w-full">
              <img
                src="./money.png"
                alt="Business illustration"
                className="w-full h-auto rounded-lg object-cover"
              />
            </div>

            {/* RIGHT CONTENT */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight">
                The Sawaari you know,
                <br />
                reimagined for business
              </h1>

              <p className="mt-6 text-gray-600 text-lg max-w-xl">
                Sawaari for Business is a platform for managing global rides and
                meals, and local deliveries, for companies of any size.
              </p>

              <div className="mt-8 flex items-center gap-6">
                <button className="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-900 transition"
                  onClick={() => { navigate("/business") }}>
                  Know more about Business
                </button>


              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            {/* LEFT CONTENT */}
            <div>
              <h1 className="text-3xl md:text-5xl font-bold text-black leading-tight">
                Facing difficulty in booking rides ?
                <br />

              </h1>

              <p className="mt-6 text-gray-600 text-lg max-w-xl">
                We have us available at your single click 24x7 to ensure
                <div />
                smooth user experience for our customers.

              </p>

              <div className="mt-8 flex items-center gap-6">
                <button className="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-900 transition"
                  onClick={() => { setShowHelp(true) }}>
                  Need Assistance ?
                </button>
              </div>
            </div>
            <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
            {/* RIGHT IMAGE */}
            <div className="w-full">
              <img
                src="./Screenshot 2025-12-10 150624.png"
                alt="Business illustration"
                className="w-full h-auto rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-8 md:px-20 py-10 bg-black text-white">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h4 className="font-bold text-lg">Sawaari</h4>
            <p className="text-gray-400 mt-2 text-sm">
              Move smarter. Ride better.
            </p>
          </div>

          <div className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Company</span>
              <span>About</span>
              <span>Careers</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-semibold">Support</span>
              <span>Help Center</span>
              <span>Terms</span>
            </div>
          </div>
        </div>
      </footer>



    </div>
  );
};

export default LandingPage;
