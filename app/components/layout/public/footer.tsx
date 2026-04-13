"use client";

import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Instagram,
} from "lucide-react";

export default function FooterSection() {
  return (
    <footer className="bg-neutral-900 text-gray-300 py-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Section */}
        <div>
          {/* <h2 className="text-white text-xl font-semibold mb-2">KINAU ID</h2>
          <p className="text-sm mb-4">
            Dipercaya oleh ratusan kampus, organisasi, dan event organizer di
            seluruh Indonesia
          </p> */}

          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
              <span>Lokasi: Korpri Raya, Sukarame, Bandar Lampun</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Kontak: (+62) 852-1933-7474</span>
            </li>
            <li className="flex items-start gap-2">
              <Instagram className="w-4 h-4 text-blue-500 mt-0.5" />
              <span>@kinau.id</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-blue-500 mt-0.5" />
              <span>admin@kinau.id</span>
            </li>
            {/* <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
              <span>Jam Kerja: Senin–Sabtu | 9 AM – 8 PM</span>
            </li> */}
          </ul>

          {/* Social Icons */}
          <div className="flex gap-4 mt-5 text-gray-400">
            <a href="#" className="hover:text-white transition">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="hover:text-white transition">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="hover:text-white transition">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="hover:text-white transition">
              <i className="fab fa-x-twitter"></i>
            </a>
          </div>
        </div>

        {/* Right Section */}
        {/* <div>
          <h3 className="text-white text-lg font-semibold mb-4">
            Tautan Pendukung
          </h3>
          <ul className="space-y-2 text-sm">
            {["FAQ", "Contact Us", "Book", "Info"].map((link, i) => (
              <li key={i}>
                <a
                  href="#"
                  className="flex items-center gap-2 hover:text-white transition"
                >
                  <ChevronRight className="w-4 h-4" /> {link}
                </a>
              </li>
            ))}
          </ul>
        </div> */}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-700 mt-10 pt-6 text-center text-xs text-gray-500">
        {/* © {new Date().getFullYear()} Rader Family Farm. All rights reserved. */}
        &copy; {new Date().getFullYear()} PT KINAU DIGITAL KREATIF. Hak cipta
        dilindungi.
      </div>
    </footer>
  );
}
