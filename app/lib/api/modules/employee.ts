import { APIProvider } from "../client";

export const EmployeeAPI = {
  get: async ({ session, req }: any) => {
    const { page = 0, size = 10, search, status } = req.query || {};

    const where: any = { deleted_on: null };

    if (status) {
      where.status = status;
    }

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employees",
      action: "select",
      body: {
        columns: [
          "id",
          "name",
          "structural",
          "phone",
          "status",
          "created_on",
          "modified_on",
        ],
        where,
        search: search
          ? { columns: ["name", "phone", "structural"], value: search }
          : undefined,
        page,
        size,
        order: [{ column: "created_on", direction: "DESC" }],
      },
    });
  },

  create: async ({ session, req }: any) => {
    const { name, structural, phone, status = "active" } = req.body || {};

    if (!name || !structural || !phone) {
      return {
        success: false,
        message: "Nama, jabatan, dan nomor telepon wajib diisi",
      };
    }

    // Check if phone already exists
    const existingCheck = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employees",
      action: "select",
      body: {
        columns: ["id"],
        where: { phone, deleted_on: null },
        size: 1,
      },
    });

    if (existingCheck.items && existingCheck.items.length > 0) {
      return {
        success: false,
        message: "Nomor telepon sudah terdaftar",
      };
    }

    const result = await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "employees",
      action: "insert",
      body: {
        data: {
          name,
          structural,
          phone,
          status,
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
          deleted_on: null,
        },
      },
    });

    return {
      success: true,
      message: "Pegawai berhasil ditambahkan",
      employee_id: result.insert_id,
    };
  },

  update: async ({ session, req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID pegawai wajib diisi" };
    }

    // If phone is being updated, check uniqueness
    if (fields.phone) {
      const existingCheck = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "employees",
        action: "select",
        body: {
          columns: ["id"],
          where: { phone: fields.phone, deleted_on: null },
          size: 1,
        },
      });

      if (
        existingCheck.items &&
        existingCheck.items.length > 0 &&
        existingCheck.items[0].id !== id
      ) {
        return {
          success: false,
          message: "Nomor telepon sudah digunakan oleh pegawai lain",
        };
      }
    }

    const updatedData: any = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employees",
      action: "update",
      body: {
        data: updatedData,
        where: { id },
      },
    });

    return {
      success: true,
      message: "Data pegawai berhasil diperbarui",
      affected: result.affected_rows,
    };
  },

  delete: async ({ session, req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return { success: false, message: "ID pegawai wajib diisi" };
    }

    // Soft delete
    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employees",
      action: "update",
      body: {
        data: {
          deleted_on: 1,
          modified_on: new Date().toISOString(),
        },
        where: { id },
      },
    });

    return {
      success: true,
      message: "Pegawai berhasil dihapus",
      affected: result.affected_rows,
    };
  },
};
