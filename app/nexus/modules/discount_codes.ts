import { generateDiscountCode } from "~/utils/utils";
import { APIProvider } from "..";

export const DiscountAPI = {
  // === GET LIST DISCOUNT CODES ===
  get: async ({ session, req }: any) => {
    const { page = 0, size = 10, search } = req.query || {};

    return await APIProvider(session)
      .Endpoint("POST", "select", "discount_codes")
      .Data({
        columns: [
          "id",
          "code",
          "name",
          "description",
          "discount_type",
          "discount_value",
          "max_discount_amount",
          "min_order_amount",
          "valid_from",
          "valid_until",
          "user_limit",
          "active",
        ],
        where: { deleted_on: "null" },
        search,
        ...search && { searchBy: "name" },
        page,
        size,
      })
      .Result();
  },

  // === CREATE DISCOUNT CODE ===
  create: async ({ session, req }: any) => {
    const {
      code,
      name,
      description,
      discount_type,
      discount_value,
      max_discount_amount,
      min_order_amount,
      valid_from,
      valid_until,
      user_limit,
      active,
    } = req.body || {};

    // AUTO GENERATE CODE jika tidak dikirim
    const finalCode =
      code && code.trim() !== "" ? code : generateDiscountCode();

    // VALIDASI DASAR
    if (!name) {
      return { success: false, message: "Name wajib diisi" };
    }

    if (!discount_type || !discount_value) {
      return { success: false, message: "Discount Type dan Value wajib diisi" };
    }

    const newDiscount = {
      code: finalCode,
      name,
      description,
      discount_type,
      discount_value,
      max_discount_amount,
      min_order_amount,
      valid_from,
      valid_until,
      user_limit: user_limit ?? 0,
      active: active ?? 1,
    };

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "insert", "discount_codes")
        .Data({ data: newDiscount })
        .Result();

      return {
        success: true,
        message: "Kode diskon berhasil ditambahkan",
        discount: { id: result.insert_id, ...newDiscount },
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  // === UPDATE DISCOUNT CODE ===
  update: async ({ session, req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    const updatedData = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "update", "discount_codes")
        .Data({
          data: updatedData,
          where: { id },
        })
        .Result();

      return {
        success: true,
        message: "Kode diskon berhasil diperbarui",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};
