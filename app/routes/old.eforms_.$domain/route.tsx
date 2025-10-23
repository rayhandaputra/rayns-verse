import MenuIcon from "~/components/icon/menu-icon";

import React from "react";
import { Plus, MoreVertical, Search } from "lucide-react";
import {
  Link,
  Outlet,
  useLoaderData,
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
  const navigate = useNavigate();
  return (
    <div className="bg-[#f2f4f7]">
      <div className="min-h-screen bg-[#f8f9fd] layout flex flex-col items-center py-4 px-4"></div>
    </div>
  );
};

export default EFormDomainPage;
