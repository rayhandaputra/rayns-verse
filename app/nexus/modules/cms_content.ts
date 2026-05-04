import { APIProvider } from "..";

export const CmsContentAPI = {
  // ✅ GET CONTENT LIST
  get: async ({ session, req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      type,
      is_active,
    } = req.query || {};

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "select", "cms_contents")
        .Data({
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
            "value",
            "suffix",
            "icon_type",
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
        })
        .Result();

      return result;
    } catch (err: any) {
      console.error("CmsContentAPI.get error:", err);
      return { success: false, message: err.message };
    }
  },

  // ✅ CREATE NEW CONTENT
  create: async ({ session, req }: any) => {
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
      value,
      suffix,
      icon_type,
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
      value: value || null,
      suffix: suffix || null,
      icon_type: icon_type || null,
      created_on: new Date().toISOString(),
    };

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "insert", "cms_contents")
        .Data({ data: newContent })
        .Result();

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
  update: async ({ session, req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID konten wajib diisi" };
    }

    const updatedData = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "update", "cms_contents")
        .Data({
          data: updatedData,
          where: { id },
        })
        .Result();

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
  delete: async ({ session, req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return { success: false, message: "ID konten wajib diisi" };
    }

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "update", "cms_contents")
        .Data({
          data: { deleted: 1, modified_on: new Date().toISOString() },
          where: { id },
        })
        .Result();

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
