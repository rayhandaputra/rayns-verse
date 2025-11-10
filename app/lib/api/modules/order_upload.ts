import { APIProvider } from "../client";


export const OrderUploadAPI = {
  // ============================================================
  // ✅ GET FOLDER LIST
  // ============================================================
  get_folder: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      order_number,
    } = req.query || {};

    const where: any = { deleted_on: "null" };
    if (order_number) where.order_number = order_number;

    const searchConfig = search
      ? {
          logic: "or",
          fields: ["folder_name", "order_number"],
          keyword: search,
        }
      : undefined;

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "order_upload_folders",
        action: "select",
        body: {
          columns: ["id", "order_number", "folder_name", "created_by", "created_on"],
          where,
          search: searchConfig,
          pagination: pagination === "true",
          page: Number(page),
          size: Number(size),
          order_by: { id: "asc" },
        },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ Error OrderUploadAPI.get_folder:", err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },

  // ============================================================
  // ✅ GET FILE LIST
  // ============================================================
  get_file: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      order_number,
      folder_id,
    } = req.query || {};

    const where: any = { deleted_on: "null" };
    if (order_number) where.order_number = order_number;
    if (folder_id) where.folder_id = folder_id;

    const searchConfig = search
      ? {
          logic: "or",
          fields: ["file_type", "file_url", "file_name", "order_number"],
          keyword: search,
        }
      : undefined;

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "order_upload_files",
        action: "select",
        body: {
          columns: [
            "id",
            "code",
            "folder_id",
            "folder_name",
            "order_number",
            "file_type",
            "file_url",
            "file_name",
            "created_on",
          ],
          where,
          search: searchConfig,
          pagination: pagination === "true",
          page: Number(page),
          size: Number(size),
          order_by: { id: "asc" },
        },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ Error OrderUploadAPI.get_file:", err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },

  // ============================================================
  // ✅ CREATE OR UPDATE FOLDERS + FILES
  // ============================================================
  create: async ({ req }: any) => {
    const { folders } = req.body || {};

    if (!folders || !Array.isArray(folders) || folders.length === 0) {
      return { success: false, message: "Data folder wajib diisi" };
    }

    try {
      for (const folder of folders) {
        const {
          id,
          order_number,
          folder_name,
          product_id,
          product_name,
          files,
          deleted,
        } = folder;

        if (!order_number || !folder_name) continue;

        const folderData = {
          order_number,
          folder_name,
          product_id,
          product_name,
          ...(+deleted === 1 && { deleted_on: new Date().toISOString() }),
        };

        // -------------------------------------
        // ✅ INSERT / UPDATE FOLDER
        // -------------------------------------
        let folderResult: any = null;

        if (!id || id.toString().includes("KEY")) {
          folderResult = await APIProvider({
            endpoint: "insert",
            table: "order_upload_folders",
            action: "insert",
            method: "POST",
            body: { data: folderData },
          });
        } else {
          folderResult = await APIProvider({
            endpoint: "update",
            table: "order_upload_folders",
            action: "update",
            method: "POST",
            body: {
              data: folderData,
              where: { id },
            },
          });
          // konsisten
          folderResult = { insert_id: id };
        }

        // -------------------------------------
        // ✅ INSERT / UPDATE FILES
        // -------------------------------------
        if (files && files.length > 0) {
          const rows = files.map((v: any) => ({
            id: v?.id || null,
            order_number,
            product_id,
            product_name,
            code: Math.random().toString(36).substring(2, 10).toUpperCase(),
            folder_id: folderResult.insert_id,
            file_type: v?.file_type || null,
            file_url: v?.file_url || null,
            file_name: v?.file_name || null,
            ...((+deleted === 1 || +v?.deleted === 1) && {
              deleted_on: new Date().toISOString(),
            }),
          }));

          await APIProvider({
            endpoint: "bulk_insert",
            table: "order_upload_files",
            action: "bulk_insert",
            method: "POST",
            body: {
              rows,
              updateOnDuplicate: true,
            },
          });
        }
      }

      return {
        success: true,
        message: "Berhasil menyimpan semua folder dan file",
      };
    } catch (err: any) {
      console.error("❌ Error OrderUploadAPI.create:", err);
      return { success: false, message: err.message };
    }
  },
};
