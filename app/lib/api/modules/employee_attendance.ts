import { APIProvider } from "../client";

export const EmployeeAttendanceAPI = {
  get: async ({ session, req }: any) => {
    const {
      page = 0,
      size = 10,
      employee_id,
      presence_date,
      presence_status,
      start_date,
      end_date,
    } = req.query || {};

    const where: any = { deleted_on: null };

    if (employee_id) {
      where.employee_id = employee_id;
    }

    if (presence_date) {
      where.presence_date = presence_date;
    }

    if (presence_status) {
      where.presence_status = presence_status;
    }

    // Date range filter
    const dateFilters: any[] = [];
    if (start_date) {
      dateFilters.push({
        column: "presence_date",
        operator: ">=",
        value: start_date,
      });
    }
    if (end_date) {
      dateFilters.push({
        column: "presence_date",
        operator: "<=",
        value: end_date,
      });
    }

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employee_attendances",
      action: "select",
      body: {
        columns: [
          "id",
          "employee_id",
          "employee_name",
          "presence_date",
          "time_in",
          "time_out",
          "location_lat_in",
          "location_long_in",
          "selfie_path",
          "presence_status",
          "created_on",
          "modified_on",
        ],
        where,
        filters: dateFilters.length > 0 ? dateFilters : undefined,
        page,
        size,
        order: [
          { column: "presence_date", direction: "DESC" },
          { column: "time_in", direction: "DESC" },
        ],
      },
    });
  },

  // Get today's attendance for all employees
  getTodayAttendance: async ({ session, req }: any) => {
    const today = new Date().toISOString().split("T")[0];

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employee_attendances",
      action: "select",
      body: {
        columns: [
          "id",
          "employee_id",
          "employee_name",
          "presence_date",
          "time_in",
          "time_out",
          "location_lat_in",
          "location_long_in",
          "selfie_path",
          "presence_status",
        ],
        where: {
          presence_date: today,
          deleted_on: null,
        },
        size: 1000,
      },
    });
  },

  create: async ({ session, req }: any) => {
    const {
      employee_id,
      employee_name,
      presence_date,
      time_in,
      time_out,
      location_lat_in,
      location_long_in,
      selfie_path,
      presence_status = "present",
    } = req.body || {};

    if (!employee_id || !employee_name || !presence_date) {
      return {
        success: false,
        message: "ID pegawai, nama, dan tanggal kehadiran wajib diisi",
      };
    }

    // Check if attendance already exists for this employee on this date
    const existingCheck = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employee_attendances",
      action: "select",
      body: {
        columns: ["id"],
        where: {
          employee_id,
          presence_date,
          deleted_on: null,
        },
        size: 1,
      },
    });

    if (existingCheck.items && existingCheck.items.length > 0) {
      return {
        success: false,
        message: "Absensi untuk pegawai ini pada tanggal tersebut sudah ada",
      };
    }

    const result = await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "employee_attendances",
      action: "insert",
      body: {
        data: {
          employee_id,
          employee_name,
          presence_date,
          time_in,
          time_out,
          location_lat_in,
          location_long_in,
          selfie_path,
          presence_status,
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
          deleted_on: null,
        },
      },
    });

    return {
      success: true,
      message: "Absensi berhasil dicatat",
      attendance_id: result.insert_id,
    };
  },

  // Clock in - create attendance record
  clockIn: async ({ session, req }: any) => {
    const {
      employee_id,
      employee_name,
      location_lat_in,
      location_long_in,
      selfie_path,
    } = req.body || {};

    if (!employee_id || !employee_name) {
      return {
        success: false,
        message: "ID pegawai dan nama wajib diisi",
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS

    // Check if already clocked in today
    const existingCheck = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employee_attendances",
      action: "select",
      body: {
        columns: ["id"],
        where: {
          employee_id,
          presence_date: today,
          deleted_on: null,
        },
        size: 1,
      },
    });

    if (existingCheck.items && existingCheck.items.length > 0) {
      return {
        success: false,
        message: "Anda sudah melakukan clock in hari ini",
      };
    }

    const result = await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "employee_attendances",
      action: "insert",
      body: {
        data: {
          employee_id,
          employee_name,
          presence_date: today,
          time_in: currentTime,
          location_lat_in,
          location_long_in,
          selfie_path,
          presence_status: "present",
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
          deleted_on: null,
        },
      },
    });

    return {
      success: true,
      message: "Clock in berhasil",
      attendance_id: result.insert_id,
    };
  },

  // Clock out - update attendance record
  clockOut: async ({ session, req }: any) => {
    const { employee_id } = req.body || {};

    if (!employee_id) {
      return {
        success: false,
        message: "ID pegawai wajib diisi",
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS

    // Find today's attendance record
    const attendanceCheck = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "employee_attendances",
      action: "select",
      body: {
        columns: ["id", "time_out"],
        where: {
          employee_id,
          presence_date: today,
          deleted_on: null,
        },
        size: 1,
      },
    });

    if (!attendanceCheck.items || attendanceCheck.items.length === 0) {
      return {
        success: false,
        message: "Anda belum melakukan clock in hari ini",
      };
    }

    const attendance = attendanceCheck.items[0];

    if (attendance.time_out) {
      return {
        success: false,
        message: "Anda sudah melakukan clock out hari ini",
      };
    }

    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employee_attendances",
      action: "update",
      body: {
        data: {
          time_out: currentTime,
          modified_on: new Date().toISOString(),
        },
        where: { id: attendance.id },
      },
    });

    return {
      success: true,
      message: "Clock out berhasil",
      affected: result.affected_rows,
    };
  },

  update: async ({ session, req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID absensi wajib diisi" };
    }

    const updatedData: any = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employee_attendances",
      action: "update",
      body: {
        data: updatedData,
        where: { id },
      },
    });

    return {
      success: true,
      message: "Data absensi berhasil diperbarui",
      affected: result.affected_rows,
    };
  },

  delete: async ({ session, req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return { success: false, message: "ID absensi wajib diisi" };
    }

    // Soft delete
    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "employee_attendances",
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
      message: "Data absensi berhasil dihapus",
      affected: result.affected_rows,
    };
  },
};
