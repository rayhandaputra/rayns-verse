import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const OrderUploadAPI = {
  get_folder: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      order_number,
    } = req.query || {};

    const where: any = {
      deleted_on: "null",
    };

    // Filter by order_number
    if (order_number) where.order_number = order_number;

    try {
      const result = await callApi({
        action: "select",
        table: "order_upload_folders",
        columns: [
          "id",
          "order_number",
          "folder_name",
          "created_by",
          "created_on",
        ],
        where,
        search: search
          ? {
              logic: "or",
              fields: ["folder_name", "order_number"],
              keyword: search,
            }
          : undefined,
        pagination: pagination === "true",
        page: +page || 0,
        size: +size || 10,
        order_by: { id: "asc" },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ Error fetching order upload folders:", err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },
  get_file: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      order_number,
      folder_id,
    } = req.query || {};

    const where: any = {
      deleted_on: "null",
    };

    if (order_number) where.order_number = order_number;
    if (folder_id) where.folder_id = folder_id;

    try {
      const result = await callApi({
        action: "select",
        table: "order_upload_files",
        columns: [
          "id",
          "code",
          "folder_id",
          "folder_name",
          "order_number",
          "file_type",
          "file_url",
          "file_name",
          // "uploaded_by",
          "created_on",
        ],
        where,
        search: search
          ? {
              logic: "or",
              fields: ["file_type", "file_url", "file_name", "order_number"],
              keyword: search,
            }
          : undefined,
        pagination: pagination === "true",
        page: +page || 0,
        size: +size || 10,
        order_by: { id: "asc" },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ Error fetching order upload files:", err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },
  create: async ({ req }: any) => {
    const { folders } = req.body || {};

    if (!folders || !Array.isArray(folders) || folders.length === 0) {
      return { success: false, message: "Data folder wajib diisi" };
    }

    try {
      // Loop tiap folder
      for (const folder of folders) {
        const { id, order_number, folder_name, files, deleted } = folder;

        if (!order_number || !folder_name) continue; // skip kalau data penting kosong

        const folderData = {
          order_number,
          folder_name,
          ...(+deleted === 1 && { deleted_on: new Date().toISOString() }),
        };

        let folderResult = null;

        // Insert atau update per folder
        if (!id || id?.toString().includes(`KEY`)) {
          folderResult = await callApi({
            action: "insert",
            table: "order_upload_folders",
            data: folderData,
          });
        } else {
          folderResult = await callApi({
            action: "update",
            table: "order_upload_folders",
            data: folderData,
            where: { id },
          });
          folderResult = { insert_id: id }; // supaya konsisten di bawah
        }

        // Jika ada files, masukkan satu per satu
        if (files && files.length > 0) {
          const rows = files.map((v: any) => ({
            ...(v?.id ? { id: v?.id } : { id: null }),
            order_number,
            code: Math.random().toString(36).substring(2, 10).toUpperCase(), // random 8 char
            folder_id: folderResult.insert_id,
            file_type: v?.file_type || null,
            file_url: v?.file_url || null,
            file_name: v?.file_name || null,
            ...((+deleted === 1 || +v?.deleted === 1) && {
              deleted_on: new Date().toISOString(),
            }),
          }));

          await callApi({
            action: "bulk_insert",
            table: "order_upload_files",
            updateOnDuplicate: true,
            rows,
          });
        }
      }

      return {
        success: true,
        message: "Berhasil menyimpan semua folder dan file",
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },
};
