import { useState } from "react";
import { X } from "lucide-react"; // optional: untuk ikon close

const FloatingWhatsApp = () => {
  const [visible, setVisible] = useState(true);

  return (
    <div className="fixed bottom-5 right-5 z-20 flex flex-col items-end md:flex-row md:items-center md:gap-4 space-y-2">
      {visible && (
        <div className="relative opacity-80 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg max-w-[200px] animate-fade-in">
          Hubungi Admin untuk Informasi lebih lanjut!
          <button
            onClick={() => setVisible(false)}
            className="absolute top-1 right-1 text-white hover:text-gray-200"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <a
        href="https://wa.me/6285219337474"
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-16 h-16 bg-green-200 rounded-full border border-gray-300 shadow-lg transition-colors"
      >
        {/* Headset Icon - Latar belakang */}
        <img
          src="/headset-icon.png"
          alt="Headset"
          className="absolute inset-0 w-14 h-14 mx-auto my-auto z-0"
        />

        {/* WhatsApp Icon - Di depan headset */}
        <img
          src="/whatsapp-icon.svg"
          alt="WhatsApp"
          className="absolute inset-0 w-8 h-8 mx-auto my-auto z-10"
        />
      </a>
    </div>
  );
};

export default FloatingWhatsApp;
