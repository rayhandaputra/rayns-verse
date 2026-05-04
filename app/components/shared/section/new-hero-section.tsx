import { Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="w-full bg-white py-28">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 gap-10">
        {/* Left Content */}
        <div className="flex-1 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Kelola Produksi <br />
            Event Tanpa Ribet <br />
            dengan <span className="text-blue-600">KINAU ID</span>
          </h1>

          <p className="text-gray-600 mb-8">
            Satu dashboard untuk mengatur data, desain, dan produksi berbagai
            kebutuhan event — dari{" "}
            <span className="font-semibold">ID Card</span>,{" "}
            <span className="font-semibold">Lanyard</span>, hingga{" "}
            <span className="font-semibold">Kaos</span>. Cukup kirimkan link
            e-form, biarkan panitia mengisi datanya sendiri.
          </p>

          <div className="flex items-center gap-4">
            <button className="bg-yellow-400 text-gray-900 font-medium px-6 py-3 rounded-full shadow hover:bg-yellow-500 transition">
              Pesan Sekarang
            </button>
            <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
              <div className="p-2 rounded-full border border-gray-300">
                <Play size={18} />
              </div>
              Pelajari Fitur
            </button>
          </div>
        </div>

        {/* Right Visual */}
        <div className="flex-1 mt-12 md:mt-0 flex justify-center">
          <div className="relative w-[300px] md:w-[360px]">
            {/* Mock Phone UI */}
            <div className="bg-blue-50 rounded-[2rem] shadow-lg p-5">
              <div className="bg-blue-600 text-white rounded-xl p-4 mb-4">
                <p className="text-sm opacity-80">Balance</p>
                <h3 className="text-2xl font-semibold">$56,271.68</h3>
                <p className="text-sm opacity-70">+5.23% ↑</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-gray-800 font-medium mb-2">Challenge 01</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full w-3/4"></div>
                </div>
                <p className="text-right text-sm mt-2 text-blue-500 font-semibold">
                  75%
                </p>
              </div>
            </div>

            {/* Decorative small cards */}
            <div className="absolute -top-10 -right-10 bg-white rounded-xl shadow-lg p-3 w-32">
              <div className="flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/40"
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Mark Philips
                  </p>
                  <p className="text-xs text-gray-500">423 followers</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -left-8 bg-white rounded-xl shadow-md p-3 w-36">
              <img
                src="https://placehold.co/120x60/EEE/AAA?text=Chart"
                alt="Chart"
                className="rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
