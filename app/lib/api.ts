import { db } from "~/config/supabase";
import { getOffset } from "./pagination";
import { CONFIG } from "~/config";

export const generateHeader: any = (session: any) => ({
  "Content-Type": "application/json",
  "x-auth-token": session?.session?.auth_session || "",
  "x-auth-role": session?.role || "",
});

interface IApi {
  session: any;
  method: "POST" | "PATCH" | "DELETE" | "GET";
  body?: any;
  url: string;
  headers?: any;
}

export const API_URL = CONFIG.apiBaseUrl.server_api_url; // ganti dengan lokasi file PHP
export const API_KEY = "REPLACE_WITH_STRONG_KEY"; // harus sama dgn $API_KEY di PHP

async function callApi(payload: any) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error: ${res.status} ${err}`);
  }

  return res.json();
}

export const API = {
  FETCH: async ({ session, method, url, headers, body }: IApi) => {
    const res = await fetch(url, {
      method: method || "GET",
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: {
        ...generateHeader(session),
        ...(headers || {}),
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (data?.status === "error") throw data;

    return data;
  },
  USER: {
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
          table: "users",
          columns: ["id", "fullname", "email", "role"],
          where: { deleted: 0 },
          search,
          page: 0,
          size: 10,
        }),
      });
      const result = await res.json();
      return result;
    },
    create: async ({ req }: any) => {
      const {
        fullname,
        email,
        role = "customer",
        is_active = 1,
        deleted = 0,
      } = req.body || {};

      if (!fullname || !email) {
        return { success: false, message: "Email dan fullname wajib diisi" };
      }

      const newUser = {
        fullname,
        email,
        role,
        // is_active,
        // deleted,
        // created_on: new Date().toISOString(),
        // modified_on: new Date().toISOString(),
      };

      try {
        const result = await callApi({
          action: "insert",
          table: "users",
          data: newUser,
        });

        return {
          success: true,
          message: "User berhasil dibuat",
          user: { id: result.insert_id, ...newUser },
        };
      } catch (err: any) {
        console.log(err);
        return { success: false, message: err.message };
      }
    },
    findOrCreate: async ({ req }: any) => {
      const {
        fullname,
        email,
        role = "customer",
        is_active = 1,
        deleted = 0,
      } = req.body || {};

      if (!fullname || !email) {
        return { success: false, message: "Email dan fullname wajib diisi" };
      }

      try {
        // cek existing
        const existing = await callApi({
          action: "select",
          table: "users",
          columns: ["*"],
          where: { email },
          size: 1,
        });

        if (existing.items.length > 0) {
          const user = existing.items[0];
          if (user.deleted === 1) {
            // restore + update
            const updated = await callApi({
              action: "update",
              table: "users",
              data: {
                fullname,
                email,
                role,
                is_active,
                deleted: 0,
                modified_on: new Date().toISOString(),
              },
              where: { id: user.id },
            });

            return {
              success: true,
              message: "User berhasil dipulihkan dan diperbarui",
              user: { ...user, ...updated },
            };
          }
          return { success: false, message: "Email sudah terdaftar" };
        }

        // jika belum ada → insert baru
        const newUser = {
          fullname,
          email,
          role,
          is_active,
          deleted,
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
        };

        const result = await callApi({
          action: "insert",
          table: "users",
          data: newUser,
        });

        return {
          success: true,
          message: "User baru berhasil dibuat",
          user: { id: result.insert_id, ...newUser },
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
    update: async ({ req }: any) => {
      const { id, ...fields } = req.body || {};

      if (!id) {
        return { success: false, message: "ID user wajib diisi" };
      }

      const updatedData: Record<string, any> = {
        ...fields,
        modified_on: new Date().toISOString(),
      };

      try {
        const result = await callApi({
          action: "update",
          table: "users",
          data: updatedData,
          where: { id },
        });

        return {
          success: true,
          message: "User berhasil diperbarui",
          affected: result.affected_rows,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
  },
  orders: {
    get: async ({ req }: any) => {
      const {
        pagination = "true",
        page = 0,
        size = 10,
        search,
        institution_id,
        status,
      } = req.query || {};

      const where: any = {};
      // if (institution_id) where.institution_id = institution_id;
      if (status) where.status = status;

      try {
        const result = await callApi({
          action: "select",
          table: "orders",
          columns: [
            "id",
            "institution_id",
            "institution_name",
            "institution_abbr",
            "institution_domain",
            "order_type",
            "quantity",
            "deadline",
            "payment_type",
            "status",
          ],
          where,
          search: search
            ? { field: "institution_name", keyword: search }
            : undefined,
          pagination,
          page: +page || 0,
          size: +size || 10,
          order_by: { created_on: "desc" },
        });

        return {
          total_items: result.total_items || 0,
          items: result.items || [],
          current_page: Number(page),
          total_pages: result.total_pages || 1,
        };
      } catch (err: any) {
        console.log(err);
        return {
          total_items: 0,
          items: [],
          current_page: Number(page),
          total_pages: 0,
          error: err.message,
        };
      }
    },

    create: async ({ req }: any) => {
      const {
        institution_id,
        institution_name,
        institution_abbr = null,
        institution_domain = null,
        order_type = "package",
        quantity = 0,
        deadline = null,
        payment_type = "down_payment",
        status = "ordered",
      } = req.body || {};

      if (!institution_id || !institution_name) {
        return {
          success: false,
          message: "institution_id dan institution_name wajib diisi",
        };
      }

      const newOrder = {
        institution_id,
        institution_name,
        institution_abbr,
        institution_domain,
        order_type,
        quantity,
        deadline,
        payment_type,
        status,
        created_on: new Date().toISOString(),
        modified_on: new Date().toISOString(),
      };

      try {
        const result = await callApi({
          action: "insert",
          table: "orders",
          data: newOrder,
        });

        return {
          success: true,
          message: "Order berhasil dibuat",
          order: { id: result.insert_id, ...newOrder },
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },

    findOrCreate: async ({ req }: any) => {
      const { uid, institution_id, institution_name, order_type, status } =
        req.body || {};

      if (!institution_id || !institution_name) {
        return {
          success: false,
          message: "institution_id dan institution_name wajib diisi",
        };
      }

      try {
        if (uid) {
          const existing = await callApi({
            action: "select",
            table: "orders",
            columns: ["*"],
            where: { uid },
            size: 1,
          });

          if (existing.items && existing.items.length > 0) {
            return {
              success: true,
              message: "Order sudah ada",
              order: existing.items[0],
            };
          }
        }

        const newOrder = {
          uid,
          institution_id,
          institution_name,
          order_type,
          status: status || "pending",
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
        };

        const result = await callApi({
          action: "insert",
          table: "orders",
          data: newOrder,
        });

        return {
          success: true,
          message: "Order baru berhasil dibuat",
          order: { id: result.insert_id, ...newOrder },
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },

    update: async ({ req }: any) => {
      const {
        id,
        institution_name,
        institution_abbr,
        institution_domain,
        order_type,
        quantity,
        deadline,
        payment_type,
        status,
        deleted,
      } = req.body || {};

      if (!id) {
        return { success: false, message: "ID order wajib diisi untuk update" };
      }

      const updatedOrder: Record<string, any> = {
        modified_on: new Date().toISOString(),
      };

      if (institution_name !== undefined)
        updatedOrder.institution_name = institution_name;
      if (institution_abbr !== undefined)
        updatedOrder.institution_abbr = institution_abbr;
      if (institution_domain !== undefined)
        updatedOrder.institution_domain = institution_domain;
      if (order_type !== undefined) updatedOrder.order_type = order_type;
      if (quantity !== undefined) updatedOrder.quantity = quantity;
      if (deadline !== undefined) updatedOrder.deadline = deadline;
      if (payment_type !== undefined) updatedOrder.payment_type = payment_type;
      if (status !== undefined) updatedOrder.status = status;
      if (deleted === 1) updatedOrder.deleted_on = new Date().toISOString();

      try {
        const result = await callApi({
          action: "update",
          table: "orders",
          data: updatedOrder,
          where: { id },
        });

        return {
          success: true,
          message: "Order berhasil diperbarui",
          affected: result.affected_rows,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
  },
  commodity: {
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
          table: "commodities",
          columns: ["id", "code", "name", "unit"],
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
      const { code, name, unit = "pcs", deleted = 0 } = req.body || {};

      if (!code || !name) {
        return { success: false, message: "Kode dan Nama wajib diisi" };
      }

      const newCommodity = {
        code,
        name,
        unit,
      };

      try {
        const result = await callApi({
          action: "insert",
          table: "commodities",
          data: newCommodity,
        });

        return {
          success: true,
          message: "Komponen berhasil dibuat",
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
          table: "commodities",
          data: updatedData,
          where: { id },
        });

        return {
          success: true,
          message: "Komponen berhasil diperbarui",
          affected: result.affected_rows,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
  },
  commodity_stock: {
    // === GET STOCK LIST ===
    get: async ({ req }: any) => {
      const { page = 0, size = 10, search } = req.query || {};

      try {
        const result = await callApi({
          table: "commodities",
          action: "get_stock", // pakai endpoint custom di PHP
          page: +page || 0,
          size: +size || 10,
          search: search || null,
        });

        return {
          total_items: result.total_items || result.items?.length || 0,
          items: result.items || [],
          current_page: Number(page),
          total_pages: result.total_pages || 1,
        };
      } catch (err: any) {
        console.error(err);
        return {
          total_items: 0,
          items: [],
          current_page: Number(page),
          total_pages: 0,
          error: err.message,
        };
      }
    },

    // === RESTOCK ITEM ===
    restock: async ({ req }: any) => {
      const { supplier_id, commodity_id, qty } = req.body || {};

      if (!supplier_id || !commodity_id || !qty) {
        return {
          success: false,
          message: "supplier_id, commodity_id, dan qty wajib diisi",
        };
      }

      try {
        const result = await callApi({
          action: "restock",
          supplier_id,
          commodity_id,
          qty,
        });

        return {
          success: true,
          message: "Restock berhasil",
          restock_id: result.restock_id,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },

    // === CONSUME STOCK (Produksi) ===
    consume: async ({ req }: any) => {
      const { commodity_id, qty } = req.body || {};

      if (!commodity_id || !qty) {
        return {
          success: false,
          message: "commodity_id dan qty wajib diisi",
        };
      }

      try {
        const result = await callApi({
          action: "consume",
          commodity_id,
          qty,
        });

        return {
          success: true,
          message: "Stok berhasil dikurangi",
          consumed_id: result.consumed_id,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },

    // === GET LOGS ===
    logs: async ({ req }: any) => {
      const { commodity_id, supplier_id } = req.query || {};

      try {
        const result = await callApi({
          action: "get_logs",
          commodity_id,
          supplier_id,
        });

        return {
          success: true,
          items: result.items || [],
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },

    // === CREATE ITEM (Commodity) ===
    createCommodity: async ({ req }: any) => {
      const { code, name, unit } = req.body || {};

      if (!code || !name || !unit) {
        return {
          success: false,
          message: "code, name, dan unit wajib diisi",
        };
      }

      const newCommodity = {
        code,
        name,
        unit,
        created_on: new Date().toISOString(),
      };

      try {
        const result = await callApi({
          action: "insert",
          table: "commodities",
          data: newCommodity,
        });

        return {
          success: true,
          message: "Commodity berhasil dibuat",
          commodity: { id: result.insert_id, ...newCommodity },
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },

    // === UPDATE ITEM (Commodity) ===
    updateCommodity: async ({ req }: any) => {
      const { id, code, name, unit } = req.body || {};

      if (!id) {
        return { success: false, message: "id wajib diisi" };
      }

      const updateData: any = {};
      if (code) updateData.code = code;
      if (name) updateData.name = name;
      if (unit) updateData.unit = unit;
      updateData.modified_on = new Date().toISOString();

      try {
        await callApi({
          action: "update",
          table: "commodities",
          data: updateData,
          where: { id },
        });

        return { success: true, message: "Commodity berhasil diupdate" };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
  },
  supplier: {
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
          table: "suppliers",
          columns: ["id", "name", "phone", "address"],
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
          table: "suppliers",
          data: newCommodity,
        });

        return {
          success: true,
          message: "Toko berhasil ditambahkan",
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
          table: "suppliers",
          data: updatedData,
          where: { id },
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
  },
  supplier_commodity: {
    get: async ({ req }: any) => {
      const { page = 0, size = 10, search } = req.query || {};

      try {
        const result = await callApi({
          table: "supplier_commodities",
          action: "select", // pakai endpoint custom di PHP
          columns: [
            "id",
            "supplier_id",
            "commodity_id",
            "commodity_name",
            "qty",
          ],
          where: { deleted_on: "null" },
          page: +page || 0,
          size: +size || 10,
          search: search || null,
        });

        return {
          total_items: result.total_items || result.items?.length || 0,
          items: result.items || [],
          current_page: Number(page),
          total_pages: result.total_pages || 1,
        };
      } catch (err: any) {
        console.error(err);
        return {
          total_items: 0,
          items: [],
          current_page: Number(page),
          total_pages: 0,
          error: err.message,
        };
      }
    },
  },
  institution: {
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
  },
  asset: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(CONFIG.apiBaseUrl.server_api_url, {
        method: "POST",
        headers: {
          Authorization: "Bearer REPLACE_WITH_STRONG_KEY",
        },
        body: formData,
      });

      const data = await res.json();
      return data;
      // data.url => link publik gambar
    },
  },
};
