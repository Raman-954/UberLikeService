import { Link, useNavigate } from "react-router-dom";

export default function UberBusiness() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black">
      {/* ================= NAVBAR ================= */}
      <nav className="flex items-center justify-between px-8 py-4 border-b bg-black text-white">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src="/logo.png" alt="Sawaari" className="w-9 h-9" />
          <span className="text-xl font-bold">Sawaari Business</span>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:opacity-80">
            Home
          </Link>
          <button
            onClick={() => navigate("/login")}
            className="rounded-full bg-white px-4 py-2 text-black font-semibold hover:bg-gray-200 transition"
          >
            Login
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="px-8 md:px-24 py-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            The ride platform <br />
            built for business
          </h1>

          <p className="mt-6 text-gray-600 text-lg max-w-xl">
            Manage rides, meals, and employee travel with centralized billing,
            real-time visibility, and enterprise-grade controls.
          </p>

          <div className="mt-8 flex gap-4">
            <button className="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-neutral-900 transition">
              Get started
            </button>
            <button className="border border-black px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition">
              Contact sales
            </button>
          </div>
        </div>

        <div className="w-full">
          <img
            src="/business-hero.png"
            alt="Business dashboard"
            className="w-full rounded-xl shadow-lg object-cover"
          />
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="bg-gray-50 px-8 md:px-24 py-20">
        <h2 className="text-3xl font-bold text-center mb-14">
          Why businesses choose Sawaari
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              title: "Centralized billing",
              desc: "No more reimbursements. One monthly invoice for all trips."
            },
            {
              title: "Spend controls",
              desc: "Set ride policies by team, location, or time."
            },
            {
              title: "Employee safety",
              desc: "Live trip tracking and priority support."
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="px-8 md:px-24 py-20">
        <h2 className="text-3xl font-bold mb-12">
          How Sawaari Business works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              step: "01",
              title: "Create a business account",
              desc: "Add your company details and payment method."
            },
            {
              step: "02",
              title: "Invite employees",
              desc: "Employees ride using company-approved policies."
            },
            {
              step: "03",
              title: "Track & manage",
              desc: "View trips, costs, and reports in one dashboard."
            }
          ].map((item) => (
            <div key={item.step}>
              <span className="text-sm font-bold text-gray-400">
                {item.step}
              </span>
              <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="bg-black text-white px-8 md:px-24 py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to move your business?
          </h2>
          <p className="mt-4 text-gray-300 text-lg">
            Join thousands of companies using Sawaari Business to move smarter.
          </p>

          <div className="mt-8 flex gap-4">
            <button className="bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-gray-200 transition">
              Get started
            </button>
            <button className="border border-white px-6 py-3 rounded-md font-semibold hover:bg-white hover:text-black transition">
              Talk to sales
            </button>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-neutral-900 text-gray-300 px-8 md:px-24 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <h3 className="text-white text-lg font-bold">Sawaari</h3>
            <p className="mt-2 text-sm">
              Smart mobility for modern businesses.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-white font-semibold">Company</span>
              <span>About</span>
              <span>Careers</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-white font-semibold">Support</span>
              <span>Help Center</span>
              <span>Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
