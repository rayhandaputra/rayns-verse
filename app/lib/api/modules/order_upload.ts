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
      folder_id,
      level,
      id,
    } = req.query || {};

    const where: any = { deleted_on: "null" };
    if (order_number !== undefined) {
      // Allow filtering by null order_number for admin drive
      where.order_number = order_number === null ? "null" : order_number;
    }
    if (folder_id !== undefined) {
      where.parent_id = folder_id === null ? "null" : folder_id;
    }
    if (level !== undefined) {
      where.level = level === null ? "null" : level;
    }
    if (id) where.id = id;

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
          columns: [
            "id",
            "uid",
            "order_number",
            "folder_name",
            "parent_id",
            "level",
            "product_id",
            "product_name",
            "created_by",
            "created_on",
            "modified_on",
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
    if (order_number !== undefined) {
      // Allow filtering by null order_number for admin drive
      where.order_number = order_number === null ? "null" : order_number;
    }
    if (folder_id !== undefined) {
      where.folder_id = folder_id === null ? "null" : folder_id;
    }

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
            "product_id",
            "product_name",
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
          parent_id,
          product_id,
          product_name,
          files,
          deleted,
        } = folder;

        if (!folder_name) continue;

        const folderData: any = {
          folder_name,
          parent_id: parent_id || null,
          product_id: product_id || null,
          product_name: product_name || null,
          ...(+deleted === 1 && { deleted_on: new Date().toISOString() }),
        };

        // Only add order_number if it's provided (not null/undefined)
        if (order_number !== undefined && order_number !== null) {
          folderData.order_number = order_number;
        }

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
            order_number: order_number || null,
            product_id: product_id || null,
            product_name: product_name || null,
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
            endpoint: "bulk-insert",
            table: "order_upload_files",
            action: "bulk-insert",
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
  // ============================================================
  // ✅ CREATE SINGLE FOLDER
  // ============================================================
  create_single_folder: async ({ req }: any) => {
    const {
      id,
      order_number,
      folder_name,
      parent_id,
      product_id,
      product_name,
    } = req.body || {};

    if (!folder_name) {
      return {
        success: false,
        message: "folder_name wajib diisi",
      };
    }

    try {
      const folderData: any = {
        ...(parent_id && { parent_id: parent_id }),
        ...(order_number && { order_number: order_number }),
        ...(product_id && { product_id: product_id }),
        ...(product_name && { product_name: product_name }),
        folder_name,
      };

      // generate code baru jika insert
      if (!id) {
        const insertResult = await APIProvider({
          endpoint: "insert",
          table: "order_upload_folders",
          action: "insert",
          method: "POST",
          body: { data: folderData },
        });

        return {
          success: true,
          message: "Berhasil menambahkan folder",
          insert_id: insertResult.insert_id,
        };
      }

      // update
      await APIProvider({
        endpoint: "update",
        table: "order_upload_folders",
        action: "update",
        method: "POST",
        body: {
          data: folderData,
          where: { id },
        },
      });

      return {
        success: true,
        message: "Berhasil mengupdate folder",
        id,
      };
    } catch (err: any) {
      console.error("❌ Error create_single_folder:", err);
      return { success: false, message: err.message };
    }
  },
  // ============================================================
  // ✅ CREATE SINGLE FILE
  // ============================================================
  create_single_file: async ({ req }: any) => {
    const {
      id,
      folder_id,
      order_number,
      product_id,
      product_name,
      file_type,
      file_url,
      file_name,
      deleted,
    } = req.body || {};

    if (!file_name) {
      return {
        success: false,
        message: "file_name wajib diisi",
      };
    }

    try {
      const fileData: any = {
        folder_id: folder_id || null,
        order_number: order_number || null,
        product_id: product_id || null,
        product_name: product_name || null,
        file_type: file_type || null,
        file_url: file_url || null,
        file_name,
      };

      // soft delete
      if (+deleted === 1) {
        fileData.deleted_on = new Date().toISOString();
      }

      // generate code baru jika insert
      if (!id || id.toString().includes("KEY")) {
        fileData.code = Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();

        const insertResult = await APIProvider({
          endpoint: "insert",
          table: "order_upload_files",
          action: "insert",
          method: "POST",
          body: { data: fileData },
        });

        return {
          success: true,
          message: "Berhasil menambahkan file",
          insert_id: insertResult.insert_id,
        };
      }

      // update
      await APIProvider({
        endpoint: "update",
        table: "order_upload_files",
        action: "update",
        method: "POST",
        body: {
          data: fileData,
          where: { id },
        },
      });

      return {
        success: true,
        message: "Berhasil mengupdate file",
        id,
      };
    } catch (err: any) {
      console.error("❌ Error create_single_file:", err);
      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // ✅ DELETE FOLDER (Soft Delete)
  // ============================================================
  delete_folder: async ({ req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return {
        success: false,
        message: "ID folder wajib diisi",
      };
    }

    try {
      await APIProvider({
        endpoint: "update",
        table: "order_upload_folders",
        action: "update",
        method: "POST",
        body: {
          data: {
            deleted_on: new Date().toISOString(),
          },
          where: { id },
        },
      });

      return {
        success: true,
        message: "Berhasil menghapus folder",
      };
    } catch (err: any) {
      console.error("❌ Error delete_folder:", err);
      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // ✅ DELETE FILE (Soft Delete)
  // ============================================================
  delete_file: async ({ req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return {
        success: false,
        message: "ID file wajib diisi",
      };
    }

    try {
      await APIProvider({
        endpoint: "update",
        table: "order_upload_files",
        action: "update",
        method: "POST",
        body: {
          data: {
            deleted_on: new Date().toISOString(),
          },
          where: { id },
        },
      });

      return {
        success: true,
        message: "Berhasil menghapus file",
      };
    } catch (err: any) {
      console.error("❌ Error delete_file:", err);
      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // ✅ BULK DELETE FOLDERS (Soft Delete)
  // ============================================================
  bulk_delete_folders: async ({ req }: any) => {
    const { ids } = req.body || {};

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return {
        success: false,
        message: "IDs folder wajib diisi",
      };
    }

    try {
      // Delete all folders with the given IDs
      for (const id of ids) {
        await APIProvider({
          endpoint: "update",
          table: "order_upload_folders",
          action: "update",
          method: "POST",
          body: {
            data: {
              deleted_on: new Date().toISOString(),
            },
            where: { id },
          },
        });
      }

      return {
        success: true,
        message: `Berhasil menghapus ${ids.length} folder`,
      };
    } catch (err: any) {
      console.error("❌ Error bulk_delete_folders:", err);
      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // ✅ BULK DELETE FILES (Soft Delete)
  // ============================================================
  bulk_delete_files: async ({ req }: any) => {
    const { ids } = req.body || {};

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return {
        success: false,
        message: "IDs file wajib diisi",
      };
    }

    try {
      // Delete all files with the given IDs
      for (const id of ids) {
        await APIProvider({
          endpoint: "update",
          table: "order_upload_files",
          action: "update",
          method: "POST",
          body: {
            data: {
              deleted_on: new Date().toISOString(),
            },
            where: { id },
          },
        });
      }

      return {
        success: true,
        message: `Berhasil menghapus ${ids.length} file`,
      };
    } catch (err: any) {
      console.error("❌ Error bulk_delete_files:", err);
      return { success: false, message: err.message };
    }
  },
};
