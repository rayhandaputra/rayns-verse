import { APIProvider } from "..";

export const EmployeeAPI = {
  get: async ({ session, req }: any) => {
    const { page = 0, size = 10, search, status } = req.query || {};

    const where: any = { deleted_on: null };

    if (status) {
      where.status = status;
    }

    return APIProvider(session)
      .Endpoint("POST", "select", "employees")
      .Data({
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
      })
      .Result();
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
    const existingCheck = await APIProvider(session)
      .Endpoint("POST", "select", "employees")
      .Data({
        columns: ["id"],
        where: { phone, deleted_on: null },
        size: 1,
      })
      .Result();

    if (existingCheck.items && existingCheck.items.length > 0) {
      return {
        success: false,
        message: "Nomor telepon sudah terdaftar",
      };
    }

    const result = await APIProvider(session)
      .Endpoint("POST", "insert", "employees")
      .Data({
        data: {
          name,
          structural,
          phone,
          status,
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
          deleted_on: null,
        },
      })
      .Result();

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
      const existingCheck = await APIProvider(session)
        .Endpoint("POST", "select", "employees")
        .Data({
          columns: ["id"],
          where: { phone: fields.phone, deleted_on: null },
          size: 1,
        })
        .Result();

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

    const result = await APIProvider(session)
      .Endpoint("POST", "update", "employees")
      .Data({
        data: updatedData,
        where: { id },
      })
      .Result();

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
    const result = await APIProvider(session)
      .Endpoint("POST", "update", "employees")
      .Data({
        data: {
          deleted_on: 1,
          modified_on: new Date().toISOString(),
        },
        where: { id },
      })
      .Result();

    return {
      success: true,
      message: "Pegawai berhasil dihapus",
      affected: result.affected_rows,
    };
  },
};
