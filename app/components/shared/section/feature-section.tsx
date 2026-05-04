import { CalendarDays, CheckCircle, LineChart, Users } from "lucide-react";

const CardFeatureSection = () => {
  return (
    <section className="w-full py-16 bg-white text-gray-800">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Semua Kebutuhan dalam Satu Platform
          </h2>
          <p className="text-gray-600">
            Platform kami menghadirkan solusi lengkap mulai dari pengelolaan
            acara, komunikasi anggota, hingga analitik survei mendalam untuk
            mempermudah pekerjaan Anda dan meningkatkan keterlibatan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white text-gray-800 p-6 rounded-lg border border-gray-300 shadow-sm">
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <CalendarDays className="h-6 w-6 text-info" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Pembuatan Acara</h3>
            <p className="text-gray-600 mb-4">
              Buat dan kelola acara dengan mudah, dilengkapi pelacakan detail,
              tautan khusus, dan pendaftaran anggota.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  Halaman acara yang dapat disesuaikan
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Pelacakan pendaftaran anggota</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Notifikasi otomatis</span>
              </li>
            </ul>
          </div>

          <div className="bg-white text-gray-800 p-6 rounded-lg border border-gray-300 shadow-sm">
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <LineChart className="h-6 w-6 text-info" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analitik Survei</h3>
            <p className="text-gray-600 mb-4">
              Buat survei khusus untuk acara Anda dan dapatkan analisis mendalam
              mengenai respons serta keterlibatan anggota.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Beragam jenis pertanyaan</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Hasil waktu nyata</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Data dapat diekspor</span>
              </li>
            </ul>
          </div>

          <div className="bg-white text-gray-800 p-6 rounded-lg border border-gray-300 shadow-sm">
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-info" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Manajemen Anggota</h3>
            <p className="text-gray-600 mb-4">
              Pantau keanggotaan, partisipasi, dan kumpulkan wawasan berharga
              melalui laporan yang terperinci.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Database anggota</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Pelacakan aktivitas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Segmentasi khusus</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardFeatureSection;
