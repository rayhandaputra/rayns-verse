import MenuIcon from "~/components/icon/menu-icon";

import React from "react";
import { Plus, MoreVertical, Search } from "lucide-react";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  type LoaderFunction,
} from "react-router";
import { API } from "~/lib/api";
import CardFolder from "~/components/eform/CardFolder";

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
    console.log(order_items?.items);

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
  const { order, order_items, table } = useLoaderData();
  const location = useLocation();

  return (
    <div className="bg-[#f2f4f7]">
      <div className="min-h-screen bg-[#f8f9fd] layout flex flex-col items-center py-4 px-4">
        {/* Header */}
        <header className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MenuIcon className="w-6 h-6 text-black" />
          </div>
          <img src="/kinau-logo.png" alt="Kinau" className="w-24 opacity-80" />
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
          />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};

export default EFormDomainPage;

const SectionProduct = ({ order, order_items, table }: any) => {
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
            className="w-full bg-white rounded-xl py-2 pl-10 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
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

      {/* Recent uploads */}
      <section className="w-full">
        <h2 className="text-md font-medium text-gray-700 mb-3">
          Recent uploads
        </h2>

        {/* Photo uploads */}
        <div className="bg-white rounded-2xl p-3 mb-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">2 photos uploaded</p>
          <div className="flex gap-2">
            <img
              src="https://picsum.photos/id/1003/120/80"
              alt="Upload 1"
              className="w-1/2 rounded-xl object-cover"
            />
            <img
              src="https://picsum.photos/id/1011/120/80"
              alt="Upload 2"
              className="w-1/2 rounded-xl object-cover"
            />
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
