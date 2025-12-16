import { APIProvider } from "../client";

export const EmployeeSalarySlipAPI = {
  get: async ({ session, req }: any) => {
    const {
      page = 0,
      size = 10,
      employee_id,
      period,
      payment_type,
      payment_status,
    } = req.query || {};

    const where: any = { deleted_on: null };

    if (employee_id) {
      where.employee_id = employee_id;
    }

    if (period) {
      where.period = period;
    }

    if (payment_type) {
      where.payment_type = payment_type;
    }

    if (payment_status) {
      where.payment_status = payment_status;
    }

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employee_salary_slips",
      action: "select",
      body: {
        columns: [
          "id",
          "employee_id",
          "employee_name",
          "period",
          "payment_type",
          "work_days_count",
          "paid_base_salary",
          "variable_allowances",
          "deductions",
          "net_salary",
          "payment_status",
          "created_on",
          "modified_on",
        ],
        where,
        page,
        size,
        order: [
          { column: "period", direction: "DESC" },
          { column: "created_on", direction: "DESC" },
        ],
      },
    });
  },

  create: async ({ session, req }: any) => {
    const {
      employee_id,
      employee_name,
      period,
      payment_type = "monthly",
      work_days_count = 0,
      paid_base_salary,
      variable_allowances = 0,
      deductions = 0,
      net_salary,
      payment_status = "pending",
    } = req.body || {};

    if (
      !employee_id ||
      !employee_name ||
      !period ||
      paid_base_salary === undefined
    ) {
      return {
        success: false,
        message: "ID pegawai, nama, periode, dan gaji pokok wajib diisi",
      };
    }

    // Check if slip already exists for this employee in this period
    const existingCheck = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employee_salary_slips",
      action: "select",
      body: {
        columns: ["id"],
        where: {
          employee_id,
          period,
          payment_type,
          deleted_on: null,
        },
        size: 1,
      },
    });

    if (existingCheck.items && existingCheck.items.length > 0) {
      return {
        success: false,
        message: "Slip gaji untuk pegawai ini pada periode tersebut sudah ada",
      };
    }

    // Calculate net_salary if not provided
    const calculatedNetSalary =
      net_salary !== undefined
        ? Number(net_salary)
        : Number(paid_base_salary) +
          Number(variable_allowances) -
          Number(deductions);

    const result = await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "employee_salary_slips",
      action: "insert",
      body: {
        data: {
          employee_id,
          employee_name,
          period,
          payment_type,
          work_days_count: Number(work_days_count),
          paid_base_salary: Number(paid_base_salary),
          variable_allowances: Number(variable_allowances),
          deductions: Number(deductions),
          net_salary: calculatedNetSalary,
          payment_status,
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
          deleted_on: null,
        },
      },
    });

    return {
      success: true,
      message: "Slip gaji berhasil dibuat",
      slip_id: result.insert_id,
    };
  },

  // Generate slip for multiple employees in a period
  generateBulk: async ({ session, req }: any) => {
    const {
      period,
      payment_type = "monthly",
      employees, // Array of { employee_id, employee_name, paid_base_salary, work_days_count, variable_allowances, deductions }
    } = req.body || {};

    if (!period || !employees || employees.length === 0) {
      return {
        success: false,
        message: "Periode dan data pegawai wajib diisi",
      };
    }

    const slipsData = employees.map((emp: any) => {
      const netSalary =
        Number(emp.paid_base_salary || 0) +
        Number(emp.variable_allowances || 0) -
        Number(emp.deductions || 0);

      return {
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
        period,
        payment_type,
        work_days_count: Number(emp.work_days_count || 0),
        paid_base_salary: Number(emp.paid_base_salary || 0),
        variable_allowances: Number(emp.variable_allowances || 0),
        deductions: Number(emp.deductions || 0),
        net_salary: netSalary,
        payment_status: "pending",
        created_on: new Date().toISOString(),
        modified_on: new Date().toISOString(),
        deleted_on: null,
      };
    });

    // Bulk insert
    const result = await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "employee_salary_slips",
      action: "insert",
      body: {
        data: slipsData,
      },
    });

    return {
      success: true,
      message: `${employees.length} slip gaji berhasil dibuat`,
      inserted_count: result.affected_rows,
    };
  },

  update: async ({ session, req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID slip gaji wajib diisi" };
    }

    const updatedData: any = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    // Ensure numeric fields are numbers
    if (updatedData.work_days_count !== undefined) {
      updatedData.work_days_count = Number(updatedData.work_days_count);
    }
    if (updatedData.paid_base_salary !== undefined) {
      updatedData.paid_base_salary = Number(updatedData.paid_base_salary);
    }
    if (updatedData.variable_allowances !== undefined) {
      updatedData.variable_allowances = Number(updatedData.variable_allowances);
    }
    if (updatedData.deductions !== undefined) {
      updatedData.deductions = Number(updatedData.deductions);
    }

    // Recalculate net_salary if component fields changed
    if (
      updatedData.paid_base_salary !== undefined ||
      updatedData.variable_allowances !== undefined ||
      updatedData.deductions !== undefined
    ) {
      // Fetch current values to calculate
      const current = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "employee_salary_slips",
        action: "select",
        body: {
          columns: ["paid_base_salary", "variable_allowances", "deductions"],
          where: { id },
          size: 1,
        },
      });

      if (current.items && current.items.length > 0) {
        const curr = current.items[0];
        const baseSalary =
          updatedData.paid_base_salary ?? curr.paid_base_salary;
        const allowances =
          updatedData.variable_allowances ?? curr.variable_allowances;
        const deduct = updatedData.deductions ?? curr.deductions;

        updatedData.net_salary =
          Number(baseSalary) + Number(allowances) - Number(deduct);
      }
    }

    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employee_salary_slips",
      action: "update",
      body: {
        data: updatedData,
        where: { id },
      },
    });

    return {
      success: true,
      message: "Slip gaji berhasil diperbarui",
      affected: result.affected_rows,
    };
  },

  // Update payment status
  updatePaymentStatus: async ({ session, req }: any) => {
    const { id, payment_status } = req.body || {};

    if (!id || !payment_status) {
      return {
        success: false,
        message: "ID slip dan status pembayaran wajib diisi",
      };
    }

    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employee_salary_slips",
      action: "update",
      body: {
        data: {
          payment_status,
          modified_on: new Date().toISOString(),
        },
        where: { id },
      },
    });

    return {
      success: true,
      message: "Status pembayaran berhasil diupdate",
      affected: result.affected_rows,
    };
  },

  // Bulk update payment status (mark multiple slips as paid)
  bulkUpdatePaymentStatus: async ({ session, req }: any) => {
    const { ids, payment_status } = req.body || {};

    if (!ids || ids.length === 0 || !payment_status) {
      return {
        success: false,
        message: "IDs dan status pembayaran wajib diisi",
      };
    }

    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employee_salary_slips",
      action: "update",
      body: {
        data: {
          payment_status,
          modified_on: new Date().toISOString(),
        },
        where: { id: { in: ids } },
      },
    });

    return {
      success: true,
      message: `${result.affected_rows} slip gaji berhasil diupdate`,
      affected: result.affected_rows,
    };
  },

  delete: async ({ session, req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return { success: false, message: "ID slip gaji wajib diisi" };
    }

    // Soft delete
    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employee_salary_slips",
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
      message: "Slip gaji berhasil dihapus",
      affected: result.affected_rows,
    };
  },
};
