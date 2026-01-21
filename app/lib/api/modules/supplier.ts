import { APIProvider } from "../client";

export const SupplierAPI = {
  get: async ({ req }: any) => {
    const { id = "", page = 0, size = 10, search } = req.query || {};

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "suppliers",
      action: "select",
      body: {
        columns: [
          "id",
          "name",
          "phone",
          "address",
          "type",
          "category",
          "location",
          "external_link",
        ],
        where: { deleted_on: "null", ...(id ? { id } : {}) },
        search,
        page,
        size,
        orderBy: ["name", "asc"],
        include: [
          {
            table: "supplier_commodities",
            alias: "supplier_commodities",
            foreign_key: "supplier_id",
            reference_key: "id",
            where: { deleted_on: "null", parent_id: "null" },
            columns: [
              "id",
              "commodity_id",
              "commodity_name",
              "is_package",
              "qty",
              "price",
              "unit",
              "unit_price",
            ],
          },
          {
            table: "supplier_commodities",
            alias: "sub_components",
            foreign_key: "supplier_id",
            reference_key: "id",
            where: { deleted_on: "null", parent_id: "is_not_null" },
            columns: [
              "commodity_id",
              "commodity_name",
              "parent_id",
              "is_package",
              "qty",
              "price",
            ],
          },
        ],
      },
    });
  },

  create: async ({ req }: any) => {
    const { name, phone, address, type, category, location, external_link } =
      req.body || {};

    if (!name || !phone) {
      return { success: false, message: "Nama dan Telepon wajib diisi" };
    }

    const newSupplier = {
      name,
      phone,
      address,
      type,
      category,
      location,
      external_link,
    };

    try {
      const result = await APIProvider({
        endpoint: "insert",
        method: "POST",
        table: "suppliers",
        action: "insert",
        body: { data: newSupplier },
      });

      return {
        success: true,
        message: "Toko berhasil ditambahkan",
        supplier: { id: result.insert_id, ...newSupplier },
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  update: async ({ req }: any) => {
    const { id, deleted, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    const updatedData = {
      ...fields,
      modified_on: new Date().toISOString(),
      ...(deleted === 1 && {
        deleted_on: new Date().toISOString(),
      }),
    };

    try {
      const result = await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "suppliers",
        action: "update",
        body: {
          data: updatedData,
          where: { id },
        },
      });

      return {
        success: true,
        message: "Toko berhasil diperbarui",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};
