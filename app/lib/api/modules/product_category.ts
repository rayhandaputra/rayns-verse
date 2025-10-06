import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const ProductCategoryAPI = {
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
          table: "product_categories",
          columns: ["id", "name", "decsription"],
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
      const { name, phone, address } = req.body || {};

      if (!name || !phone) {
        return { success: false, message: "Nama dan Telepon wajib diisi" };
      }

      const newCommodity = {
        phone,
        name,
        address,
      };

      try {
        const result = await callApi({
          action: "insert",
          table: "product_categories",
          data: newCommodity,
        });

        return {
          success: true,
          message: "Produk berhasil ditambahkan",
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
          table: "product_categories",
          data: updatedData,
          where: { id },
        });

        return {
          success: true,
          message: "Produk berhasil diperbarui",
          affected: result.affected_rows,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
  }