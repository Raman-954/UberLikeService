import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';

export default function RidePayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();

  const { rideId, fare } = location.state || {};

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
   const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // ADD RATING HANDLER
  const handleRating = async (stars) => {
    try {
      await api.post(`/rides/${rideId}/rate`, { rating: stars });
      setRating(stars);
      setRatingSubmitted(true);
    } catch (err) {
      console.error('Rating failed:', err);
    }
  };

  useEffect(() => {
    if (!rideId) {
      navigate('/trip');
      return;
    }

    if (socket) {
      socket.emit('ride:join', { rideId });

      const handlePaymentReceived = (data) => {
        if (data.rideId === rideId) {
          setPaymentConfirmed(true);
        }
      };

      socket.on('payment:received', handlePaymentReceived);

      return () => {
        socket.off('payment:received', handlePaymentReceived);
      };
    }
  }, [socket, rideId, navigate]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="flex items-center justify-between bg-black px-6 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black font-bold">
            S
          </div>
          <span className="text-lg font-semibold tracking-wide">SAWAARI</span>
        </div>
        <button
          onClick={() => navigate('/user/dashboard')}
          className="rounded-full border border-white/30 px-4 py-1.5 text-sm hover:bg-white hover:text-black transition"
        >
          Dashboard
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
            {paymentConfirmed ? 'Payment Confirmed' : 'Thank you for riding with Sawari'}
          </h1>
          {!paymentConfirmed && (
            <>
              <p className="text-sm text-neutral-600 mb-6">
                Please pay <span className="font-semibold text-neutral-900">₹{fare}</span> to the driver in cash or via your preferred method.
              </p>
              <p className="text-xs text-neutral-500">
                Once the driver confirms receiving the amount, this ride will be marked as paid.
              </p>
            </>
          )}

          {paymentConfirmed && (
            <>
              <p className="text-sm text-neutral-600 mb-6">
                Your driver has confirmed the payment. We hope to see you again soon.
              </p>
               <div className="mb-6 border-t pt-6 border-neutral-100">
                <h3 className="text-sm font-medium mb-3">
                  {ratingSubmitted ? 'Thank you for rating!' : 'Rate your driver'}
                </h3>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={ratingSubmitted}
                      onClick={() => handleRating(star)}
                      className={`text-3xl transition ${
                        (rating || 0) >= star ? 'text-yellow-400' : 'text-neutral-200 hover:text-yellow-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate('/trip')}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-medium text-white hover:bg-neutral-900 transition"
              >
                Book another ride
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}


