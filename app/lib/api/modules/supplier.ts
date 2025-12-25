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
        columns: ["id", "name", "phone", "address"],
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
            columns: ["commodity_id", "commodity_name", "qty", "price"],
          },
        ],
      },
    });
  },

  create: async ({ req }: any) => {
    const { name, phone, address } = req.body || {};

    if (!name || !phone) {
      return { success: false, message: "Nama dan Telepon wajib diisi" };
    }

    const newSupplier = {
      name,
      phone,
      address,
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
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    const updatedData = {
      ...fields,
      modified_on: new Date().toISOString(),
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
