import { Link } from "react-router";

const Footer = () => {
  return (
    <footer className="bg-white border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">EventSurveyNexus</h3>
            <p className="text-gray-500 text-sm">
              Buat, kelola, dan analisis acara serta survei dalam satu platform
              terpadu.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-800">Produk</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/products"
                  className="text-gray-500 text-sm hover:text-info"
                >
                  Lihat Semua
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=featured"
                  className="text-gray-500 text-sm hover:text-info"
                >
                  Unggulan
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=new"
                  className="text-gray-500 text-sm hover:text-info"
                >
                  Produk Terbaru
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-800">
              Acara & Survei
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard/events"
                  className="text-gray-500 text-sm hover:text-info"
                >
                  Buat Acara
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/surveys"
                  className="text-gray-500 text-sm hover:text-info"
                >
                  Survei Saya
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/members"
                  className="text-gray-500 text-sm hover:text-info"
                >
                  Kelola Anggota
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-800">
              Perusahaan
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-gray-500 text-sm hover:text-info"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-500 text-sm hover:text-info"
                >
                  Kontak
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-500 text-sm hover:text-info"
                >
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-500 text-sm hover:text-info"
                >
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-xs mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} KINAU ID. Hak cipta dilindungi.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Facebook</span>
              {/* Ikon tetap sama */}
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Instagram</span>
              {/* Ikon tetap sama */}
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Twitter</span>
              {/* Ikon tetap sama */}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
