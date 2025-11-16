const CardTestimoniSection = () => {
  return (
    <section className="w-full py-16 bg-gray-50">
      <div className="container max-w-7xl mx-auto text-gray-800 px-4 md:px-6">
        {/* <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">Apa Kata Pengguna Kami</h2>
          <p className="text-gray-600">
            Dengarkan pengalaman mereka yang telah merasakan kemudahan dalam
            mengelola acara dan meningkatkan keterlibatan anggota.
          </p>
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 fill-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-gray-600 mb-4">
              "Platform ini benar-benar mengubah cara kami menyelenggarakan
              acara komunitas. Fitur surveinya memberi kami wawasan yang
              sebelumnya tidak pernah kami miliki."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="font-medium">Sarah Johnson</div>
                <div className="text-sm text-gray-500">
                  Penyelenggara Komunitas
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 fill-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-gray-600 mb-4">
              "Dashboard-nya memudahkan saya melihat semua acara dan hasil
              survei dalam satu tempat. Belum pernah ada alat yang menggabungkan
              semuanya dengan begitu mulus."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="font-medium">Michael Torres</div>
                <div className="text-sm text-gray-500">Koordinator Acara</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 fill-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-gray-600 mb-4">
              "Sebagai admin, saya akhirnya bisa memantau semua pelanggan dan
              aktivitas mereka di satu tempat. Fitur laporannya sangat sesuai
              dengan kebutuhan bisnis saya."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="font-medium">Lisa Chang</div>
                <div className="text-sm text-gray-500">Pemilik Usaha</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardTestimoniSection;
