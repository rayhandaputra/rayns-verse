import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const OrderAPI = {
  get: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      id,
      institution_id,
      institution_domain,
      status,
      payment_status,
      order_type,
      start_date,
      end_date,
    } = req.query || {};

    const where: any = {};

    if (id) where.id = id;
    if (institution_id) where.institution_id = institution_id;
    if (institution_domain) where.institution_domain = institution_domain;
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (order_type) where.order_type = order_type;

    // Filter tanggal (opsional)
    if (start_date && end_date) {
      where.created_on = { between: [start_date, end_date] };
    } else if (start_date) {
      where.created_on = { gte: start_date };
    } else if (end_date) {
      where.created_on = { lte: end_date };
    }

    try {
      const result = await callApi({
        action: "select",
        table: "orders",
        columns: [
          "id",
          "uid",
          "order_number",
          "institution_id",
          "institution_name",
          "institution_abbr",
          "institution_domain",
          "order_type",
          "payment_status",
          "payment_method",
          "discount_value",
          "tax_value",
          "shipping_fee",
          "subtotal",
          "total_amount",
          "grand_total",
          "status",
          "deadline",
          "created_on",
        ],
        where,
        search: search
          ? {
              logic: "or",
              fields: [
                "order_number",
                "institution_name",
                "institution_abbr",
                "institution_domain",
              ],
              keyword: search,
            }
          : undefined,
        pagination: pagination === "true",
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
      console.error("❌ Error fetching orders:", err);
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
      institution_abbr_id = null,
      institution_domain = null,
      order_type = "package",
      deadline = null,
      payment_status = "unpaid",
      payment_method = null,
      payment_reference = null,
      payment_due_date = null,
      discount_code = null,
      discount_type = null,
      discount_value = 0,
      tax_percent = 0,
      shipping_fee = 0,
      other_fee = 0,
      notes = null,
      shipping_address = null,
      shipping_contact = null,
      created_by = null,
      items = [],
    } = req.body || {};

    if (!institution_id || !institution_name) {
      return {
        success: false,
        message: "institution_id dan institution_name wajib diisi",
      };
    }

    // 🔹 Generate nomor pesanan unik
    const generateOrderNumber = () => {
      const prefix = "ORD";
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // 20251013
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      return `${prefix}-${datePart}-${randomPart}`;
    };

    const order_number = generateOrderNumber();

    // 🔹 Hitung subtotal, pajak, dan total
    let subtotal = 0;
    let totalTax = 0;
    let discountTotal = 0;

    if (Array.isArray(items) && items.length > 0) {
      items.forEach((item: any) => {
        const itemSubtotal = (item.qty || 0) * (item.unit_price || 0);
        const itemDiscount =
          item.discount_type === "percent"
            ? (itemSubtotal * (item.discount_value || 0)) / 100
            : item.discount_value || 0;
        const itemTax =
          (itemSubtotal - itemDiscount) * ((item.tax_percent || 0) / 100);

        subtotal += itemSubtotal;
        discountTotal += itemDiscount;
        totalTax += itemTax;
      });
    }

    const total_amount = subtotal - discountTotal + totalTax;
    const grand_total = total_amount + (shipping_fee || 0) + (other_fee || 0);

    const newOrder = {
      order_number,
      institution_id,
      institution_name,
      institution_abbr,
      institution_domain,
      order_type,
      payment_status,
      payment_method,
      payment_reference,
      payment_due_date,
      discount_code,
      discount_type,
      discount_value,
      tax_percent,
      tax_value: totalTax,
      shipping_fee,
      other_fee,
      subtotal,
      total_amount,
      grand_total,
      deadline,
      status: "pending",
      notes,
      shipping_address,
      shipping_contact,
      created_by,
      created_on: new Date().toISOString(),
      modified_on: new Date().toISOString(),
    };

    try {
      // 🔹 Insert ke tabel orders
      const result = await callApi({
        action: "insert",
        table: "orders",
        data: newOrder,
      });

      if (institution_abbr && !institution_abbr_id) {
        await callApi({
          action: "insert",
          table: "institution_domains",
          data: {
            domain: institution_abbr,
            institution_id: institution_id,
            created_on: new Date().toISOString(),
          },
        });
      }

      // 🔹 Insert ke tabel order_items (jika ada)
      if (items && items.length > 0) {
        const itemRows = items.map((item: any) => {
          const qty = item.qty || 1;
          const unit_price = item.unit_price || 0;
          const discount_value = item.discount_value || 0;
          const tax_percent = item.tax_percent || 0;

          const subtotal = qty * unit_price;
          const discount_total =
            item.discount_type === "percent"
              ? (subtotal * discount_value) / 100
              : discount_value;
          const tax_value = ((subtotal - discount_total) * tax_percent) / 100;
          const total_after_tax = subtotal - discount_total + tax_value;

          return {
            order_number,
            product_id: item.product_id || null,
            product_name: item.product_name,
            product_type: item.product_type || "single",
            qty,
            unit_price,
            discount_type: item.discount_type || null,
            discount_value,
            tax_percent,
            subtotal,
            discount_total,
            tax_value,
            total_after_tax,
            notes: item.notes || null,
          };
        });

        await callApi({
          action: "bulk_insert",
          table: "order_items",
          updateOnDuplicate: true,
          rows: itemRows,
        });
      }

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
};
