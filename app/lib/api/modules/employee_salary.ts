import { APIProvider } from "../client";

export const EmployeeSalaryAPI = {
  get: async ({ session, req }: any) => {
    const { page = 0, size = 10, employee_id, payment_type } = req.query || {};

    const where: any = { deleted_on: null };

    if (employee_id) {
      where.employee_id = employee_id;
    }

    if (payment_type) {
      where.payment_type = payment_type;
    }

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employee_salaries",
      action: "select",
      body: {
        columns: [
          "id",
          "employee_id",
          "employee_name",
          "base_salary",
          "allowances",
          "payment_type",
          "created_on",
          "modified_on",
        ],
        where,
        page,
        size,
        order: [{ column: "created_on", direction: "DESC" }],
      },
    });
  },

  create: async ({ session, req }: any) => {
    const {
      employee_id,
      employee_name,
      base_salary,
      allowances = 0,
      payment_type = "monthly",
    } = req.body || {};

    if (!employee_id || !employee_name || base_salary === undefined) {
      return {
        success: false,
        message: "ID pegawai, nama, dan gaji pokok wajib diisi",
      };
    }

    // Check if salary record already exists for this employee
    const existingCheck = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employee_salaries",
      action: "select",
      body: {
        columns: ["id"],
        where: {
          employee_id,
          deleted_on: null,
        },
        size: 1,
      },
    });

    if (existingCheck.items && existingCheck.items.length > 0) {
      return {
        success: false,
        message:
          "Data gaji untuk pegawai ini sudah ada. Gunakan update untuk mengubah.",
      };
    }

    const result = await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "employee_salaries",
      action: "insert",
      body: {
        data: {
          employee_id,
          employee_name,
          base_salary: Number(base_salary),
          allowances: Number(allowances),
          payment_type,
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
          deleted_on: null,
        },
      },
    });

    return {
      success: true,
      message: "Data gaji berhasil ditambahkan",
      salary_id: result.insert_id,
    };
  },

  // Upsert: create if not exists, update if exists
  upsert: async ({ session, req }: any) => {
    const {
      employee_id,
      employee_name,
      base_salary,
      allowances = 0,
      payment_type = "monthly",
    } = req.body || {};

    if (!employee_id || !employee_name || base_salary === undefined) {
      return {
        success: false,
        message: "ID pegawai, nama, dan gaji pokok wajib diisi",
      };
    }

    // Check if exists
    const existingCheck = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employee_salaries",
      action: "select",
      body: {
        columns: ["id"],
        where: {
          employee_id,
          deleted_on: null,
        },
        size: 1,
      },
    });

    if (existingCheck.items && existingCheck.items.length > 0) {
      // Update existing
      const result = await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "employee_salaries",
        action: "update",
        body: {
          data: {
            employee_name,
            base_salary: Number(base_salary),
            allowances: Number(allowances),
            payment_type,
            modified_on: new Date().toISOString(),
          },
          where: { id: existingCheck.items[0].id },
        },
      });

      return {
        success: true,
        message: "Data gaji berhasil diperbarui",
        salary_id: existingCheck.items[0].id,
      };
    } else {
      // Create new
      const result = await APIProvider({
        endpoint: "insert",
        method: "POST",
        table: "employee_salaries",
        action: "insert",
        body: {
          data: {
            employee_id,
            employee_name,
            base_salary: Number(base_salary),
            allowances: Number(allowances),
            payment_type,
            created_on: new Date().toISOString(),
            modified_on: new Date().toISOString(),
            deleted_on: null,
          },
        },
      });

      return {
        success: true,
        message: "Data gaji berhasil ditambahkan",
        salary_id: result.insert_id,
      };
    }
  },

  update: async ({ session, req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID data gaji wajib diisi" };
    }

    const updatedData: any = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    // Ensure numeric fields are numbers
    if (updatedData.base_salary !== undefined) {
      updatedData.base_salary = Number(updatedData.base_salary);
    }
    if (updatedData.allowances !== undefined) {
      updatedData.allowances = Number(updatedData.allowances);
    }

    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employee_salaries",
      action: "update",
      body: {
        data: updatedData,
        where: { id },
      },
    });

    return {
      success: true,
      message: "Data gaji berhasil diperbarui",
      affected: result.affected_rows,
    };
  },

  // Update by employee_id
  updateByEmployeeId: async ({ session, req }: any) => {
    const { employee_id, ...fields } = req.body || {};

    if (!employee_id) {
      return { success: false, message: "ID pegawai wajib diisi" };
    }

    const updatedData: any = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    // Ensure numeric fields are numbers
    if (updatedData.base_salary !== undefined) {
      updatedData.base_salary = Number(updatedData.base_salary);
    }
    if (updatedData.allowances !== undefined) {
      updatedData.allowances = Number(updatedData.allowances);
    }

    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employee_salaries",
      action: "update",
      body: {
        data: updatedData,
        where: { employee_id, deleted_on: null },
      },
    });

    return {
      success: true,
      message: "Data gaji berhasil diperbarui",
      affected: result.affected_rows,
    };
  },

  delete: async ({ session, req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return { success: false, message: "ID data gaji wajib diisi" };
    }

    // Soft delete
    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employee_salaries",
      action: "update",
      body: {
        data: {
          deleted: 1,
          modified_on: new Date().toISOString(),
        },
        where: { id },
      },
    });

    return {
      success: true,
      message: "Data gaji berhasil dihapus",
      affected: result.affected_rows,
    };
  },
};
