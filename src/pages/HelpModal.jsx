import React from "react";
import { X } from "lucide-react";

export default function HelpModal({ open, onClose }) {
  if (!open) return null;

  const creators = [
    {
      name: "Aniket Kumar",
      image: "/creators/aniket.jpg",
      phone: "+91 98765 43210",
      email: "aniket@sawaari.com"
    },
    {
      name: "Rahul Sharma",
      image: "/creators/rahul.jpg",
      phone: "+91 91234 56789",
      email: "rahul@sawaari.com"
    },
    {
      name: "Priya Singh",
      image: "/creators/priya.jpg",
      phone: "+91 99887 66554",
      email: "priya@sawaari.com"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* MODAL */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl">
        
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 hover:bg-gray-100 transition"
        >
          <X size={20} />
        </button>

        {/* HEADER */}
        <h2 className="text-2xl font-bold text-neutral-900">
          Need help?
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Reach out to the creators of Sawaari
        </p>

        {/* CREATORS */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {creators.map((c) => (
            <div
              key={c.email}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-center hover:shadow-md transition"
            >
              <img
                src={c.image}
                alt={c.name}
                className="mx-auto h-24 w-24 rounded-full object-cover"
              />

              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                {c.name}
              </h3>

              <p className="mt-2 text-sm text-neutral-600">
                📞 {c.phone}
              </p>

              <p className="mt-1 text-sm text-neutral-600 break-all">
                ✉️ {c.email}
              </p>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-neutral-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
