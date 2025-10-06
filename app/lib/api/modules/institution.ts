import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const InstitutionAPI = {
    get: async ({
      session,
      req,
    }: {
      session: any;
      req: { query?: any; body?: any; header?: any };
    }) => {
      const {
        pagination = "true",
        page = 0,
        size = 10,
        search,
        email,
      } = req.query || {};

      const res = await fetch(CONFIG.apiBaseUrl.server_api_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer REPLACE_WITH_STRONG_KEY",
        },
        body: JSON.stringify({
          action: "select",
          table: "institutions",
          columns: ["id", "name", "abbr"],
          where: { deleted_on: "null" },
          search,
          page,
          size,
        }),
      });
      const result = await res.json();
      return result;
    },
    create: async ({ req }: any) => {
      const { name } = req.body || {};

      if (!name) {
        return { success: false, message: "Nama wajib diisi" };
      }

      const newCommodity = {
        name,
      };

      try {
        const result = await callApi({
          action: "insert",
          table: "institutions",
          data: newCommodity,
        });

        return {
          success: true,
          message: "Institusi berhasil ditambahkan",
          user: { id: result.insert_id, ...newCommodity },
        };
      } catch (err: any) {
        console.log(err);
        return { success: false, message: err.message };
      }
    },
    update: async ({ req }: any) => {
      const { id, ...fields } = req.body || {};

      if (!id) {
        return { success: false, message: "ID wajib diisi" };
      }

      const updatedData: Record<string, any> = {
        ...fields,
        modified_on: new Date().toISOString(),
      };

      try {
        const result = await callApi({
          action: "update",
          table: "institutions",
          data: updatedData,
          where: { id },
        });

        return {
          success: true,
          message: "Institusi berhasil diperbarui",
          affected: result.affected_rows,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
  }