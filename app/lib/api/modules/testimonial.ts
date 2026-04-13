import { APIProvider } from "../client";

export const TestimonialAPI = {
  // ================================
  // ✅ GET / LIST TESTIMONIALS
  // ================================
  get: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      id,
      order_number,
      status, // default hanya tampilkan yang approved
    } = req.query || {};

    const where: any = {};

    if (id) where.id = id;
    if (order_number) where.order_number = order_number;
    if (status) where.status = status;

    // ✅ SEARCH MULTI FIELD
    const searchConfig = search
      ? {
          logic: "or",
          fields: ["name", "institution_name", "comment"],
          keyword: search,
        }
      : undefined;

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "testimonials",
        action: "select",
        body: {
          columns: [
            "id",
            "order_number",
            "institution_name",
            "name",
            "rating",
            "comment",
            "status",
            "created_on",
          ],
          where,
          search: searchConfig,
          page: Number(page),
          size: Number(size),
          pagination: pagination === "true",
          order_by: { created_on: "desc" },
        },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ ERROR TestimonialAPI.get:", err);

      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },

  // ================================
  // ✅ CREATE TESTIMONIAL
  // ================================
  create: async ({ req }: any) => {
    const {
      order_number,
      institution_name,
      name,
      rating,
      comment,
      status = "pending", // default pending untuk review admin
    } = req.body || {};

    if (!order_number || !name || !rating || !comment) {
      return {
        success: false,
        message: "order_number, name, rating, dan comment wajib diisi",
      };
    }

    if (rating < 1 || rating > 5) {
      return {
        success: false,
        message: "Rating harus antara 1-5",
      };
    }

    const newTestimonial = {
      order_number,
      institution_name: institution_name || null,
      name,
      rating: Number(rating),
      comment,
      status,
      created_on: new Date().toISOString(),
      modified_on: new Date().toISOString(),
    };

    try {
      const result = await APIProvider({
        endpoint: "insert",
        method: "POST",
        table: "testimonials",
        action: "insert",
        body: { data: newTestimonial },
      });

      return {
        success: true,
        message: "Ulasan berhasil dikirim. Terima kasih!",
        testimonial: { id: result.insert_id, ...newTestimonial },
      };
    } catch (err: any) {
      console.error("❌ ERROR TestimonialAPI.create:", err);
      return {
        success: false,
        message: err.message || "Gagal menyimpan ulasan",
      };
    }
  },

  // ================================
  // ✅ UPDATE TESTIMONIAL
  // ================================
  update: async ({ req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return {
        success: false,
        message: "ID testimonial wajib diisi untuk update",
      };
    }

    const updatedTestimonial = {
      ...fields,
      modified_on: new Date().toISOString(),
      ...(fields.deleted === 1 ? { deleted_on: new Date().toISOString() } : {}),
    };

    try {
      const result = await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "testimonials",
        action: "update",
        body: {
          data: updatedTestimonial,
          where: { id },
        },
      });

      return {
        success: true,
        message: "Testimonial berhasil diperbarui",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};
