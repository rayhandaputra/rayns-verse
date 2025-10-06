import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const OrderAPI = {
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
  }
