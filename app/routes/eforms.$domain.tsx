import MenuIcon from "~/components/icon/menu-icon";

import React from "react";
import {
  Plus,
  MoreVertical,
  Search,
  MessageCircle,
  FileText,
} from "lucide-react";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  type LoaderFunction,
} from "react-router";
import { API } from "~/lib/api";
import CardFolder from "~/components/eform/CardFolder";
import { Button } from "~/components/ui/button";

export const loader: LoaderFunction = async ({ request, params }) => {
  try {
    // console.log(params.domain);
    const order = await API.ORDERS.get({
      session: {},
      req: {
        query: {
          pagination: "true",
          institution_domain: `kinau.id/eforms/${params.domain}`,
          page: 0,
          size: 1,
        },
      } as any,
    });
    const order_items = await API.ORDER_ITEMS.get({
      session: {},
      req: {
        query: {
          pagination: "true",
          order_number: order?.items?.[0]?.order_number,
          page: 0,
          size: 50,
        },
      } as any,
    });
    // console.log(order_items?.items);

    // console.log(order?.items?.[0]?.order_number);
    const folders = await API.ORDER_UPLOAD.get_folder({
      session: {},
      req: {
        query: {
          order_number: order?.items?.[0]?.order_number,
        },
      } as any,
    });
    const files = await API.ORDER_UPLOAD.get_file({
      session: {},
      req: {
        query: {
          order_number: order?.items?.[0]?.order_number,
          size: 100,
        },
      } as any,
    });

    return {
      order: order?.items?.[0] ?? null,
      order_items: order_items?.items ?? [],
      folders:
        folders?.items?.map((v: any) => ({
          ...v,
          files: files?.items?.filter((j: any) => +j.folder_id === +v?.id),
        })) ?? [],
      table: {
        link: `eforms/${params.domain}`,
      },
    };
  } catch (err) {
    console.log(err);
  }
};

const EFormDomainPage: React.FC = () => {
  const { order, order_items, folders, table } = useLoaderData();
  const location = useLocation();
  const navigate = useNavigate();
  // console.log(folders);

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-100 to-sky-300 text-center px-6">
        <img
          src="/kinau-logo.png"
          alt="Kinau"
          className="mb-6 h-12 opacity-80"
        />
        <h1 className="text-2xl font-bold text-sky-900 mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-slate-700 max-w-md mb-6">
          Maaf, pesanan tidak ditemukan. Silakan buat pesanan terlebih dahulu.
        </p>
        <a
          href="https://wa.me/6285219337474?text=Halo%20Admin%2C%20saya%20ingin%20membuat%20pesanan%20baru."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-2 text-white font-medium shadow-md hover:bg-green-600"
        >
          <MessageCircle size={18} /> Hubungi Admin
        </a>
      </div>
    );
  }

  return (
    <div className="bg-[#f2f4f7]">
      <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] to-[#f8f9fd] layout flex flex-col items-center p-4">
        {/* Header */}
        <header className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MenuIcon className="w-6 h-6 text-black" />
          </div>
          <img
            src="/kinau-logo.png"
            onClick={() => navigate("/")}
            alt="Kinau"
            className="w-24 opacity-80"
          />
          <img
            src="https://i.pravatar.cc/40"
            alt="User"
            className="w-9 h-9 rounded-full border border-gray-200"
          />
        </header>

        {location.pathname.endsWith(table.link) ? (
          <SectionProduct
            order={order}
            order_items={order_items}
            table={table}
            folders={folders}
          />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};

export default EFormDomainPage;

const SectionProduct = ({ order, order_items, table, folders }: any) => {
  const navigate = useNavigate();
  return (
    <>
      {/* Search bar */}
      <div className="w-full mb-5">
        <div className="flex justify-between items-end gap-2 mb-4">
          <h1 className="text-2xl font-semibold text-gray-700">Order Files</h1>
          <span className="text-sm font-semibold text-gray-500">
            {order?.order_number}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-gray-100 text-gray-600 placeholder:text-gray-400 placeholder:font-medium rounded-full py-2.5 pl-10 pr-4 shadow-sm focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* Favorites */}
      <section className="w-full mb-6">
        <h2 className="text-md font-medium text-gray-700 mb-2">
          Produk dipesan
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {order_items.map((item: any, index: number) => (
            <CardFolder
              key={index}
              label={item?.product_name}
              onClick={() => {
                navigate(`/${table?.link}/detail/${item?.id}`);
              }}
            />
          ))}
        </div>
      </section>

      {/* E-Receipt */}
      <section className="w-full mb-6">
        <h2 className="text-md font-medium text-gray-700 mb-2">Nota Digital</h2>
        <Button
          onClick={() => navigate(`/${table.link}/receipt`)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl flex items-center gap-2 px-4 shadow-md"
        >
          <FileText className="w-4 h-4" />
          Lihat Nota
        </Button>
      </section>

      {/* Recent uploads */}
      <section className="w-full">
        <h2 className="text-md font-medium text-gray-700 mb-3">
          Unggahan terbaru
        </h2>

        {/* Photo uploads */}
        <div className="bg-white rounded-2xl p-3 mb-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">
            {folders?.[0]?.files?.length ?? 0} unggahan
          </p>
          <div className="flex gap-2 overflow-x-scroll no-scrollbar">
            {folders?.[0]?.files?.map((file: any, index: number) => (
              <img
                key={index}
                src={file.file_url}
                alt={file.file_name}
                className="w-1/2 rounded-xl object-cover"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Floating action button */}
      {/* <button className="fixed bottom-6 right-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-4 shadow-lg transition">
        <Plus className="w-6 h-6" />
      </button> */}
    </>
  );
};
