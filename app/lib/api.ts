import { db } from "~/config/supabase";
import { getOffset } from "./pagination";

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
    //   get: async ({
    //     session,
    //     req,
    //   }: {
    //     session: any;
    //     req: { query?: any; body?: any; header?: any };
    //   }) => {
    //     const {
    //       pagination = "true",
    //       page = 0,
    //       size = 10,
    //       search,
    //       email,
    //     } = req.query || {};

    //     let query = db.from("users").select("*");

    //     if (email) {
    //       query = query.eq("email", email);
    //     }

    //     if (search) {
    //       query = query.ilike("name", `%${search}%`);
    //     }

    //     if (pagination === "true") {
    //       const { offset } = getOffset(page, size);
    //       const from = offset;
    //       const to = offset + size - 1;
    //       query = query.range(from, to);
    //     }

    //     const { data: response, error } = await query;

    //     return { response, error };
    //   },
    // },
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

      // Base query
      let query = db.from("users").select("*", { count: "exact" });
      query = query.eq("deleted", 0);

      // Filter by email
      if (email) {
        query = query.eq("email", email);
      }

      // Filter by search
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      // Total count (Supabase akan otomatis memberi count jika { count: "exact" })
      let total_items = 0;

      if (pagination === "true") {
        // Pagination logic
        const pageNumber = Number(page) || 0;
        const pageSize = Number(size) || 10;
        const from = pageNumber * pageSize;
        const to = from + pageSize - 1;

        const { data: items, count, error } = await query.range(from, to);

        if (error) {
          return {
            total_items: 0,
            items: [],
            current_page: pageNumber,
            total_pages: 0,
            error,
          };
        }

        total_items = count || 0;
        const total_pages = Math.ceil(total_items / pageSize);

        return {
          total_items,
          items: items || [],
          current_page: pageNumber,
          total_pages,
        };
      } else {
        // No pagination: return all data
        const { data: items, count, error } = await query;

        if (error) {
          return {
            total_items: 0,
            items: [],
            current_page: 0,
            total_pages: 0,
            error,
          };
        }

        return {
          total_items: count || 0,
          items: items || [],
          current_page: 0,
          total_pages: 1,
        };
      }
    },
    create: async ({
      session,
      req,
    }: {
      session: any;
      req: {
        body: {
          fullname: string;
          email: string;
          role?: string;
          is_active?: number;
          deleted?: number;
          session_token?: string;
          session_expired?: string;
        };
      };
    }) => {
      const {
        fullname,
        email,
        role = "customer", // default jika tidak dikirim
        is_active = 1,
        deleted = 0,
        session_token = null,
        session_expired = null,
      } = req.body || {};

      if (!email || !fullname) {
        return {
          success: false,
          message: "Email dan fullname wajib diisi",
        };
      }

      const newUser = {
        fullname,
        email,
        role,
        is_active,
        deleted,
        session_token,
        session_expired,
        created_on: new Date().toISOString(),
        modified_on: new Date().toISOString(),
      };

      const { data, error } = await db
        .from("users")
        .insert(newUser)
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
          error,
        };
      }

      return {
        success: true,
        message: "User berhasil dibuat",
        user: data,
      };
    },
    findOrCreate: async ({
      session,
      req,
    }: {
      session: any;
      req: {
        body: {
          fullname: string;
          email: string;
          role?: string;
          is_active?: number;
          deleted?: number;
          session_token?: string;
          session_expired?: string;
        };
      };
    }) => {
      const {
        fullname,
        email,
        role = "customer", // default jika tidak dikirim
        is_active = 1,
        deleted = 0,
        session_token = null,
        session_expired = null,
      } = req.body || {};

      if (!email || !fullname) {
        return {
          success: false,
          message: "Email dan fullname wajib diisi",
        };
      }

      // 1. Cek apakah email sudah ada
      const { data: existingUser, error: findError } = await db
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (findError) {
        return {
          success: false,
          message: findError.message,
          error: findError,
        };
      }

      // 2. Jika user ditemukan
      if (existingUser) {
        if (existingUser.deleted === 1) {
          // Update user lama (restore + update data baru)
          const { data: updatedUser, error: updateError } = await db
            .from("users")
            .update({
              fullname,
              email,
              role,
              is_active,
              deleted: 0, // restore
              session_token,
              session_expired,
              modified_on: new Date().toISOString(),
            })
            .eq("id", existingUser.id)
            .select("*")
            .single();

          if (updateError) {
            return {
              success: false,
              message: updateError.message,
              error: updateError,
            };
          }

          return {
            success: true,
            message: "User berhasil dipulihkan dan diperbarui",
            user: updatedUser,
          };
        } else {
          // Jika user sudah aktif (deleted = 0)
          return {
            success: false,
            message: "Email sudah terdaftar",
          };
        }
      }

      // 3. Jika user tidak ditemukan → buat baru
      const newUser = {
        fullname,
        email,
        role,
        is_active,
        deleted,
        session_token,
        session_expired,
        created_on: new Date().toISOString(),
        modified_on: new Date().toISOString(),
      };

      const { data, error } = await db
        .from("users")
        .insert(newUser)
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
          error,
        };
      }

      return {
        success: true,
        message: "User baru berhasil dibuat",
        user: data,
      };
    },
    update: async ({
      session,
      req,
    }: {
      session: any;
      req: {
        body: {
          id: string; // id user wajib untuk update
          fullname?: string;
          email?: string;
          role?: string;
          is_active?: number;
          deleted?: number; // soft delete jika dikirim
          session_token?: string | null;
          session_expired?: string | null;
        };
      };
    }) => {
      const {
        id,
        fullname,
        email,
        role,
        is_active,
        deleted,
        session_token,
        session_expired,
      } = req.body || {};

      if (!id) {
        return {
          success: false,
          message: "ID user wajib diisi untuk update",
        };
      }

      // Jika hanya ingin soft delete (deleted = 1)
      if (deleted === 1) {
        const { data, error } = await db
          .from("users")
          .update({
            deleted: 1,
            modified_on: new Date().toISOString(),
          })
          .eq("id", id)
          .select("*")
          .single();

        if (error) {
          return {
            success: false,
            message: error.message,
            error,
          };
        }

        return {
          success: true,
          message: "User berhasil di-soft delete",
          user: data,
        };
      }

      // Update biasa (jika deleted tidak dikirim)
      const updatedUser: Record<string, any> = {
        modified_on: new Date().toISOString(),
      };

      if (fullname !== undefined) updatedUser.fullname = fullname;
      if (email !== undefined) updatedUser.email = email;
      if (role !== undefined) updatedUser.role = role;
      if (is_active !== undefined) updatedUser.is_active = is_active;
      if (deleted !== undefined) updatedUser.deleted = deleted;
      if (session_token !== undefined)
        updatedUser.session_token = session_token;
      if (session_expired !== undefined)
        updatedUser.session_expired = session_expired;

      const { data, error } = await db
        .from("users")
        .update(updatedUser)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
          error,
        };
      }

      return {
        success: true,
        message: "User berhasil diperbarui",
        user: data,
      };
    },
  },
  orders: {
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
        institution_id,
        status,
      } = req.query || {};

      // Base query
      let query = db.from("orders").select("*", { count: "exact" });

      // Filter by institution
      if (institution_id) {
        query = query.eq("institution_id", institution_id);
      }

      // Filter by status
      if (status) {
        query = query.eq("status", status);
      }

      // Search by institution_name
      if (search) {
        query = query.ilike("institution_name", `%${search}%`);
      }

      let total_items = 0;

      if (pagination === "true") {
        const pageNumber = Number(page) || 0;
        const pageSize = Number(size) || 10;
        const from = pageNumber * pageSize;
        const to = from + pageSize - 1;

        const { data: items, count, error } = await query.range(from, to);

        if (error) {
          return {
            total_items: 0,
            items: [],
            current_page: pageNumber,
            total_pages: 0,
            error,
          };
        }

        total_items = count || 0;
        const total_pages = Math.ceil(total_items / pageSize);

        return {
          total_items,
          items: items || [],
          current_page: pageNumber,
          total_pages,
        };
      } else {
        const { data: items, count, error } = await query;

        if (error) {
          return {
            total_items: 0,
            items: [],
            current_page: 0,
            total_pages: 0,
            error,
          };
        }

        return {
          total_items: count || 0,
          items: items || [],
          current_page: 0,
          total_pages: 1,
        };
      }
    },

    create: async ({
      session,
      req,
    }: {
      session: any;
      req: {
        body: {
          institution_id: number;
          institution_name: string;
          institution_abbr?: string;
          institution_domain?: string;
          order_type?: string;
          quantity?: number;
          deadline?: string;
          payment_type?: string;
          status?: string;
        };
      };
    }) => {
      const {
        institution_id,
        institution_name,
        institution_abbr = null,
        institution_domain = null,
        order_type = null,
        quantity = 0,
        deadline = null,
        payment_type = null,
        status = "pending",
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

      const { data, error } = await db
        .from("orders")
        .insert(newOrder)
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
          error,
        };
      }

      return {
        success: true,
        message: "Order berhasil dibuat",
        order: data,
      };
    },

    findOrCreate: async ({
      session,
      req,
    }: {
      session: any;
      req: {
        body: {
          uid?: string;
          institution_id: number;
          institution_name: string;
          order_type?: string;
          status?: string;
        };
      };
    }) => {
      const { uid, institution_id, institution_name, order_type, status } =
        req.body || {};

      if (!institution_id || !institution_name) {
        return {
          success: false,
          message: "institution_id dan institution_name wajib diisi",
        };
      }

      // Cek berdasarkan uid (jika dikirim)
      if (uid) {
        const { data: existingOrder, error: findError } = await db
          .from("orders")
          .select("*")
          .eq("uid", uid)
          .maybeSingle();

        if (findError) {
          return {
            success: false,
            message: findError.message,
            error: findError,
          };
        }

        if (existingOrder) {
          return {
            success: true,
            message: "Order sudah ada",
            order: existingOrder,
          };
        }
      }

      // Jika tidak ada → buat baru
      const newOrder = {
        institution_id,
        institution_name,
        order_type,
        status: status || "pending",
        created_on: new Date().toISOString(),
        modified_on: new Date().toISOString(),
      };

      const { data, error } = await db
        .from("orders")
        .insert(newOrder)
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
          error,
        };
      }

      return {
        success: true,
        message: "Order baru berhasil dibuat",
        order: data,
      };
    },

    update: async ({
      session,
      req,
    }: {
      session: any;
      req: {
        body: {
          id: number;
          institution_name?: string;
          institution_abbr?: string;
          institution_domain?: string;
          order_type?: string;
          quantity?: number;
          deadline?: string;
          payment_type?: string;
          status?: string;
          deleted?: number;
        };
      };
    }) => {
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
        return {
          success: false,
          message: "ID order wajib diisi untuk update",
        };
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

      // Soft delete
      if (deleted === 1) {
        updatedOrder.deleted_on = new Date().toISOString();
      }

      const { data, error } = await db
        .from("orders")
        .update(updatedOrder)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          message: error.message,
          error,
        };
      }

      return {
        success: true,
        message: "Order berhasil diperbarui",
        order: data,
      };
    },
  },
};
