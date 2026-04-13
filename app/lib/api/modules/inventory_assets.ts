import { APIProvider } from "../client";

export const InventoryAssetAPI = {
  get: async ({ session, req }: any) => {
    const { page = 0, size = 10, search, category, status } = req.query || {};

    const where: any = { deleted_on: null };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "assets",
      action: "select",
      body: {
        columns: [
          "id",
          "asset_name",
          "category",
          "purchase_date",
          "location",
          "status",
          "total_value",
          "total_unit",
          "created_on",
          // "modified_on",
        ],
        where,
        search,
        // search: search
        //   ? { columns: ["asset_name", "location"], value: search }
        //   : undefined,
        page,
        size,
        // order: [{ column: "created_on", direction: "DESC" }],
      },
    });
  },

  create: async ({ session, req }: any) => {
    const {
      asset_name,
      category,
      purchase_date,
      location,
      status = "Good",
      total_value,
      total_unit = 1,
    } = req.body || {};

    if (
      !asset_name ||
      !category ||
      !purchase_date ||
      !location ||
      total_value === undefined
    ) {
      return {
        success: false,
        message:
          "Nama aset, kategori, tanggal beli, lokasi, dan nilai wajib diisi",
      };
    }

    const result = await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "assets",
      action: "insert",
      body: {
        data: {
          asset_name,
          category,
          purchase_date,
          location,
          status,
          total_value: Number(total_value),
          total_unit: Number(total_unit),
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
          deleted_on: null,
        },
      },
    });

    return {
      success: true,
      message: "Aset berhasil ditambahkan",
      asset_id: result.insert_id,
    };
  },

  update: async ({ session, req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID aset wajib diisi" };
    }

    const updatedData: any = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    // Ensure numeric fields are numbers
    if (updatedData.total_value !== undefined) {
      updatedData.total_value = Number(updatedData.total_value);
    }
    if (updatedData.total_unit !== undefined) {
      updatedData.total_unit = Number(updatedData.total_unit);
    }

    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "assets",
      action: "update",
      body: {
        data: updatedData,
        where: { id },
      },
    });

    return {
      success: true,
      message: "Aset berhasil diperbarui",
      affected: result.affected_rows,
    };
  },

  delete: async ({ session, req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return { success: false, message: "ID aset wajib diisi" };
    }

    // Soft delete
    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "assets",
      action: "update",
      body: {
        data: {
          deleted_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
        },
        where: { id },
      },
    });

    return {
      success: true,
      message: "Aset berhasil dihapus",
      affected: result.affected_rows,
    };
  },
};
