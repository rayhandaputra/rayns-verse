import { CheckCircle, Layers, Building2, Handshake } from "lucide-react";

interface StatsProps {
  countFinished?: number;
  countItems?: number;
  uniqueClients?: number;
  countSponsors?: number;
}

const fmt = (n: number) => n.toLocaleString("id-ID");

export const Stats = ({
  countFinished,
  countItems,
  uniqueClients,
  countSponsors,
}: StatsProps = {}) => {
  return (
    <section className="py-12 border-y border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Kartu 1: Pesanan Selesai */}
        <div className="p-4 rounded-xl hover:bg-gray-50 transition group text-center">
          <div className="flex items-center justify-center text-blue-600 mb-2 opacity-80 group-hover:scale-110 transition">
            <CheckCircle size={32} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {fmt(578)}
          </div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
            Pesanan Selesai
          </div>
        </div>

        {/* Kartu 2: Produk Dibuat */}
        <div className="p-4 rounded-xl hover:bg-gray-50 transition group text-center">
          <div className="flex items-center justify-center text-purple-600 mb-2 opacity-80 group-hover:scale-110 transition">
            <Layers size={32} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {fmt(5120)}
          </div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
            Produk Dibuat (Pcs)
          </div>
        </div>

        {/* Kartu 3: Instansi / Event */}
        <div className="p-4 rounded-xl hover:bg-gray-50 transition group text-center">
          <div className="flex items-center justify-center text-orange-600 mb-2 opacity-80 group-hover:scale-110 transition">
            <Building2 size={32} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {fmt(346)}
          </div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
            Instansi / Event
          </div>
        </div>

        {/* Kartu 4: Sponsor & Partner */}
        <div className="p-4 rounded-xl hover:bg-gray-50 transition group text-center">
          <div className="flex items-center justify-center text-green-600 mb-2 opacity-80 group-hover:scale-110 transition">
            <Handshake size={32} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {fmt(259)}
          </div>
          <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
            Sponsor & Partner
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
