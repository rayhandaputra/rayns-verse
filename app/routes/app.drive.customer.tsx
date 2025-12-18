// app/routes/app.drive.customer.tsx
import React, { useState, useEffect } from "react";
import { Folder, FileText } from "lucide-react";
import { useLoaderData, useNavigate, type LoaderFunction } from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import { useQueryParams } from "~/hooks/use-query-params";
import type { Order } from "~/types";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LoaderData {
  orders: Order[];
}

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);

  const ordersRes = await API.ORDERS.get({
    session: { user, token },
    req: { query: { size: 100 } },
  });

  return Response.json({ orders: ordersRes.items || [] });
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function DriveCustomerPage() {
  const { orders } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const query = useQueryParams();

  const {
    data: realFolders,
    loading: isLoading,
    reload: reloadRealFolders,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ORDER_UPLOAD")
      .action("get_folder")
      .params({
        page: 0,
        size: 100,
        order_number: "is_not_null",
        ...(query.folder_id && { folder_id: query.folder_id }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: realFiles,
    loading: isLoadingFiles,
    reload: reloadRealFiles,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ORDER_UPLOAD")
      .action("get_file")
      .params({
        page: 0,
        size: 100,
        order_number: "is_not_null",
        ...(query.folder_id
          ? { folder_id: query.folder_id }
          : { folder_id: "null" }),
      })
      .build(),
    autoLoad: true,
  });

  const handleOpenFolder = (folderId: string | number) => {
    navigate(`/app/drive/customer?folder_id=${folderId}`);
  };

  const folders = realFolders?.data?.items ?? [];
  const files = realFiles?.data?.items ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {folders.length === 0 && files.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-300">
          <Folder size={64} className="mb-4 opacity-20" />
          <p>Tidak ada data customer</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Render Folders */}
          {folders.map((folder: any) => (
            <div
              key={folder.id}
              onDoubleClick={() => handleOpenFolder(folder.id)}
              className="group relative p-4 rounded-xl border bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm flex flex-col items-center gap-3 cursor-pointer transition-all"
            >
              <Folder size={48} className="text-blue-400 fill-blue-400" />
              <div className="text-center w-full">
                <div
                  className="text-xs font-medium truncate w-full text-gray-700"
                  title={folder.folder_name}
                >
                  {folder.folder_name}
                </div>
              </div>
            </div>
          ))}

          {/* Render Files */}
          {files.map((file: any) => (
            <div
              key={file.id}
              onDoubleClick={() => window.open(file.file_url, "_blank")}
              className="group relative p-4 rounded-xl border bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm flex flex-col items-center gap-3 cursor-pointer transition-all"
            >
              <FileText size={40} className="text-blue-500" />
              <div className="text-center w-full">
                <div
                  className="text-xs font-medium truncate w-full text-gray-700"
                  title={file.file_name}
                >
                  {file.file_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
