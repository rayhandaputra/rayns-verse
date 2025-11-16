import { APIProvider } from "../client";

export const CmsContentAPI = {
  // ✅ GET CONTENT LIST
  get: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      type,
      is_active,
    } = req.query || {};

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "cms_contents",
        body: {
          columns: [
            "id",
            "title",
            "slug",
            "image",
            "image_gallery",
            "total_order",
            "description",
            "promotion_type",
            "link",
            "type",
            "seq",
            "is_active",
            "created_on",
            "modified_on",
          ],
          where: {
            deleted: 0,
            ...(type ? { type } : {}),
            ...(is_active ? { is_active } : {}),
          },
          search,
          page: Number(page),
          size: Number(size),
          order_by: [{ column: "seq", order: "ASC" }],
        },
      });

      return result;
    } catch (err: any) {
      console.error("CmsContentAPI.get error:", err);
      return { success: false, message: err.message };
    }
  },

  // ✅ CREATE NEW CONTENT
  create: async ({ req }: any) => {
    const {
      title,
      image,
      description,
      link,
      type,
      seq,
      is_active,
      image_gallery,
      promotion_type,
      total_order,
    } = req.body || {};

    if (!title || !type) {
      return { success: false, message: "Title dan Type wajib diisi" };
    }

    const newContent = {
      title,
      image,
      image_gallery,
      promotion_type,
      total_order,
      description,
      link,
      type,
      seq: seq ?? 0,
      is_active: is_active ?? 1,
      created_on: new Date().toISOString(),
    };

    try {
      const result = await APIProvider({
        endpoint: "insert",
        method: "POST",
        table: "cms_contents",
        body: { data: newContent },
      });

      return {
        success: true,
        message: "Konten berhasil ditambahkan",
        content: { id: result.insert_id, ...newContent },
      };
    } catch (err: any) {
      console.error("CmsContentAPI.create error:", err);
      return { success: false, message: err.message };
    }
  },

  // ✅ UPDATE CONTENT
  update: async ({ req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID konten wajib diisi" };
    }

    const updatedData = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    try {
      const result = await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "cms_contents",
        body: {
          data: updatedData,
          where: { id },
        },
      });

      return {
        success: true,
        message: "Konten berhasil diperbarui",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      console.error("CmsContentAPI.update error:", err);
      return { success: false, message: err.message };
    }
  },

  // ✅ SOFT DELETE CONTENT
  delete: async ({ req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return { success: false, message: "ID konten wajib diisi" };
    }

    try {
      const result = await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "cms_contents",
        body: {
          data: { deleted: 1, modified_on: new Date().toISOString() },
          where: { id },
        },
      });

      return {
        success: true,
        message: "Konten berhasil dihapus (soft delete)",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      console.error("CmsContentAPI.delete error:", err);
      return { success: false, message: err.message };
    }
  },
};
