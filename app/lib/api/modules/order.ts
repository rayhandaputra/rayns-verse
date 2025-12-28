import { safeParseArray, safeParseObject } from "~/lib/utils";
import { APIProvider } from "../client";
import moment from "moment";

export const OrderAPI = {
  // ================================
  // ✅ GET / LIST ORDERS
  // ================================
  get: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      id,
      institution_id,
      institution_domain,
      order_number,
      status,
      payment_status,
      order_type,
      start_date,
      is_kkn = "",
      is_portfolio,
      end_date,
      year,
      sort = "",
      deleted_on,
    } = req.query || {};

    let where: any = {};

    if (id) where.id = id;
    if (institution_id) where.institution_id = institution_id;
    if (institution_domain) where.institution_domain = institution_domain;
    if (order_number) where.order_number = order_number;
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (order_type) where.order_type = order_type;
    if (is_kkn?.toString() !== "") where.is_kkn = is_kkn;
    if (is_portfolio) where.is_portfolio = is_portfolio;

    // ✅ FILTER TANGGAL
    if (start_date && end_date) {
      where.created_on = { between: [start_date, end_date] };
    } else if (start_date) {
      where.created_on = { gte: start_date };
    } else if (end_date) {
      where.created_on = { lte: end_date };
    }

    if (year) {
      where = {
        ...where,
        "year:order_date": parseInt(year),
      };
    }
    where.deleted_on = deleted_on || "null";

    // ✅ SEARCH MULTI FIELD (format OR)
    const searchConfig = search
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
      : undefined;

    let sort_by = "created_on";
    let sort_type = "desc";
    if (sort) {
      const [column, type] = sort.split(":");
      sort_by = column;
      sort_type = type;
    }

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            "id",
            "uid",
            "order_number",
            "institution_id",
            "institution_name",
            "institution_abbr",
            "institution_domain",
            "order_type",
            "images",
            "review",
            "rating",
            "payment_status",
            "payment_method",
            "payment_proof",
            "payment_detail",
            "dp_payment_method",
            "dp_payment_proof",
            "dp_payment_detail",
            "discount_value",
            "tax_value",
            "order_date",
            "shipping_fee",
            "subtotal",
            "total_amount",
            "dp_amount",
            "grand_total",
            "is_portfolio",
            "is_sponsor",
            "is_kkn",
            "is_archive",
            "kkn_source",
            "kkn_type",
            "kkn_detail",
            "pic_name",
            "pic_phone",
            "drive_folder_id",
            "status",
            "deadline",
            "created_on",
            "created_by",
            `(SELECT COUNT(id) FROM order_items) AS total_product`,
          ],
          where,
          search: searchConfig,
          page: Number(page),
          size: Number(size),
          pagination: pagination === "true",
          // order_by: { created_on: "desc" },
          orderBy: [sort_by, sort_type],

          include: [
            {
              table: "order_items",
              alias: "order_items",
              foreign_key: "order_number",
              reference_key: "order_number",
              columns: [
                "product_id",
                "product_name",
                "qty",
                "unit_price",
                "subtotal",
                "discount_value",
                "tax_percent",
                "variant_id",
                "variant_name",
                "variant_price",
                "variant_final_price",
                "price_rule_id",
                "price_rule_min_qty",
                "price_rule_value",
                // "total_amount",
              ],
            },
          ],
        },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ ERROR OrderAPI.get:", err);

      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },

  // ================================
  // ✅ CREATE ORDER
  // ================================
  create: async ({ req }: any) => {
    const {
      institution_id = null,
      institution_name = null,
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
      total_amount = 0,
      dp_amount = 0,
      is_sponsor = 0,
      is_kkn = 0,
      is_archive = 0,
      kkn_source = "",
      kkn_type = "",
      kkn_detail = "",
      tax_percent = 0,
      shipping_fee = 0,
      other_fee = 0,
      notes = null,
      shipping_address = null,
      shipping_contact = null,
      order_date = moment().format("YYYY-MM-DD HH:mm:ss"),
      created_by = null,
      status = "pending",
      pic_name = null,
      pic_phone = null,
      items = [],
      images = [],
    } = req.body || {};

    // if (!institution_id || !institution_name) {
    //   return {
    //     success: false,
    //     message: "institution_id dan institution_name wajib diisi",
    //   };
    // }

    // ✅ Generate nomor order
    const generateOrderNumber = () => {
      const prefix = "ORD";
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      return `${prefix}-${datePart}-${randomPart}`;
    };

    const order_number = generateOrderNumber();

    // ✅ Hitung subtotal, discount, tax
    // let subtotal = 0;
    // let discountTotal = 0;
    // let totalTax = 0;

    // items?.forEach((item: any) => {
    //   const itemSubtotal = (item.qty || 0) * (item.unit_price || 0);
    //   const itemDiscount =
    //     item.discount_type === "percent"
    //       ? (itemSubtotal * (item.discount_value || 0)) / 100
    //       : item.discount_value || 0;
    //   const itemTax =
    //     (itemSubtotal - itemDiscount) * ((item.tax_percent || 0) / 100);

    //   subtotal += itemSubtotal;
    //   discountTotal += itemDiscount;
    //   totalTax += itemTax;
    // });

    // const total_amount = subtotal - discountTotal + totalTax;
    // const grand_total = total_amount + (shipping_fee || 0) + (other_fee || 0);

    let newOrder = {
      order_number,
      institution_id,
      institution_name,
      institution_abbr,
      institution_domain,
      pic_name,
      pic_phone,
      order_type,
      order_date,
      payment_status,
      payment_method,
      payment_reference,
      payment_due_date,
      discount_code,
      discount_type,
      discount_value,
      tax_percent,
      // tax_value: totalTax,
      shipping_fee,
      other_fee,
      // subtotal,
      total_amount,
      dp_amount,
      is_sponsor,
      is_kkn,
      is_archive,
      kkn_source,
      kkn_type,
      kkn_detail: kkn_detail ? JSON.stringify(kkn_detail) : null,
      // grand_total,
      deadline,
      status,
      notes,
      shipping_address,
      shipping_contact,
      images: JSON.stringify(images || []),
      created_by: safeParseObject(created_by)
        ? JSON.stringify(created_by)
        : null,
      // created_on: moment().subtract(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
      created_on: moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
      modified_on: null,
    };

    try {
      // ✅ Simpan domain baru jika perlu
      if (institution_name && !(+institution_id > 0)) {
        const result = await APIProvider({
          endpoint: "insert",
          method: "POST",
          table: "institutions",
          action: "insert",
          body: {
            data: {
              name: institution_name,
              created_on: new Date().toISOString(),
            },
          },
        });

        newOrder.institution_id = result?.insert_id;
      }

      if (+is_archive === 0) {
        // CREATE 1 FOLDER DRIVE
        const createFolder = await APIProvider({
          endpoint: "insert",
          method: "POST",
          table: "order_upload_folders",
          action: "insert",
          body: {
            data: {
              order_number,
              folder_name: `${institution_name} - ${order_number}`,
            },
          },
        });
        newOrder.drive_folder_id = createFolder?.insert_id;
      }

      // ✅ Insert ke table orders
      const result = await APIProvider({
        endpoint: "insert",
        method: "POST",
        table: "orders",
        action: "insert",
        body: { data: newOrder },
      });

      // ✅ Insert order_items (bulk)
      if (items?.length > 0) {
        // const itemRows = items.map((item: any) => {
        //   const qty = item.qty || 1;
        //   const unit_price = item.unit_price || 0;
        //   const subtotal = qty * unit_price;
        //   const discount_total =
        //     item.discount_type === "percent"
        //       ? (subtotal * (item.discount_value || 0)) / 100
        //       : item.discount_value || 0;
        //   const tax_value =
        //     ((subtotal - discount_total) * (item.tax_percent || 0)) / 100;

        //   return {
        //     order_number,
        //     product_id: item.product_id || null,
        //     product_name: item.product_name,
        //     product_type: item.product_type || "single",
        //     qty,
        //     unit_price,
        //     discount_type: item.discount_type || null,
        //     discount_value: item.discount_value || 0,
        //     tax_percent: item.tax_percent || 0,
        //     subtotal,
        //     discount_total,
        //     tax_value,
        //     total_after_tax: subtotal - discount_total + tax_value,
        //     notes: item.notes || null,
        //   };
        // });
        const itemRows = items.map((item: any) => {
          const qty = item?.qty || item?.quantity || 1;
          const unit_price = item?.unit_price || item?.price || 0;
          const subtotal = qty * unit_price;
          const discount_total =
            item?.discount_type === "percent"
              ? (subtotal * (item?.discount_value || 0)) / 100
              : item?.discount_value || 0;
          const tax_value =
            ((subtotal - discount_total) * (item?.tax_percent || 0)) / 100;

          return {
            order_number,
            product_id: item?.product_id || item?.productId || null,
            product_name: item?.product_name || item?.productName || null,
            product_type: item?.product_type || "single",
            qty,
            unit_price,
            discount_type: item?.discount_type || null,
            discount_value: item?.discount_value || 0,
            tax_percent: item?.tax_percent || 0,
            subtotal,
            discount_total,
            tax_value,
            total_after_tax: subtotal - discount_total + tax_value,
            notes: item?.notes || null,
            variant_id: item?.variant_id || null,
            variant_name: item?.variant_name || null,
            variant_price: item?.variant_price || null,
            variant_final_price: item?.variant_final_price || null,
            price_rule_id: item?.price_rule_id || null,
            price_rule_min_qty: item?.price_rule_min_qty || null,
            price_rule_value: item?.price_rule_value || null,
          };
        });

        await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "order_items",
          action: "bulk-insert",
          body: {
            rows: itemRows,
            updateOnDuplicate: true,
          },
        });
      }

      if (total_amount > 0 && +is_archive === 1) {
        await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "account_ledger_mutations",
          action: "bulk-insert",
          body: {
            rows: [
              {
                account_code: "4-101",
                account_name: "Pendapatan Usaha",
                credit:
                  payment_status === "down_payment"
                    ? total_amount - dp_amount
                    : total_amount,
                debit: 0,
                notes: order_number,
                trx_code: order_number,
              },
              {
                account_code: "1-102",
                account_name: "Piutang Usaha",
                credit: 0,
                debit:
                  payment_status === "down_payment"
                    ? total_amount - dp_amount
                    : total_amount,
                notes: order_number,
                trx_code: order_number,
              },
            ],
            updateOnDuplicate: true,
          },
        });
      }

      return {
        success: true,
        message: "Order berhasil dibuat",
        order: { id: result.insert_id, ...newOrder },
      };
    } catch (err: any) {
      console.error("❌ ERROR OrderAPI.create:", err);
      return { success: false, message: err.message };
    }
  },

  // ================================
  // ✅ findOrCreate ORDER
  // ================================
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
      // ✅ Jika UID sudah ada → ambil order
      if (uid) {
        const existing = await APIProvider({
          endpoint: "select",
          method: "POST",
          table: "orders",
          action: "select",
          body: {
            columns: ["*"],
            where: { uid },
            size: 1,
          },
        });

        if (existing.items?.length > 0) {
          return {
            success: true,
            message: "Order sudah ada",
            order: existing.items[0],
          };
        }
      }

      // ✅ Jika belum → buat order baru
      const newOrder = {
        uid,
        institution_id,
        institution_name,
        order_type,
        status: status || "pending",
        created_on: new Date().toISOString(),
        modified_on: new Date().toISOString(),
      };

      const result = await APIProvider({
        endpoint: "insert",
        method: "POST",
        table: "orders",
        action: "insert",
        body: { data: newOrder },
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

  // ================================
  // ✅ UPDATE ORDER
  // ================================
  update: async ({ req }: any) => {
    let { id, order, ...fields } = req.body || {};

    const existOrder = order ? safeParseObject(order) : null;
    if (!id) {
      return { success: false, message: "ID order wajib diisi untuk update" };
    }

    const updatedOrder = {
      ...fields,
      ...(fields?.payment_proof && {
        payment_status: "paid",
        status: "done",
      }),
      modified_on: new Date().toISOString(),
      ...(fields.deleted === 1 ? { deleted_on: new Date().toISOString() } : {}),
    };

    // if (+fields.deleted === 1 || fields.deleted_on) {
    //   await APIProvider({
    //     endpoint: "update",
    //     method: "POST",
    //     table: "account_ledger_mutations",
    //     action: "update",
    //     body: {
    //       data: { deleted_on: new Date().toISOString() },
    //       where: { notes: existOrder?.order_number },
    //     },
    //   });
    //   await APIProvider({
    //     endpoint: "update",
    //     method: "POST",
    //     table: "order_items",
    //     action: "update",
    //     body: {
    //       data: { deleted_on: new Date().toISOString() },
    //       where: { order_number: existOrder?.order_number },
    //     },
    //   });
    // }

    try {
      const result = await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "orders",
        action: "update",
        body: {
          data: {
            ...updatedOrder,
            ...(safeParseArray(updatedOrder?.images)?.length > 0
              ? { images: JSON.stringify(updatedOrder?.images) }
              : {}),
            ...(safeParseObject(updatedOrder?.payment_detail)
              ? { payment_detail: JSON.stringify(updatedOrder?.payment_detail) }
              : {}),
            ...(safeParseObject(updatedOrder?.dp_payment_detail)
              ? {
                  dp_payment_detail: JSON.stringify(
                    updatedOrder?.dp_payment_detail
                  ),
                }
              : {}),
          },
          where: { id },
        },
      });

      let accBank = null;
      if (safeParseObject(updatedOrder?.payment_detail)?.account_id) {
        const resBank = await APIProvider({
          endpoint: "select",
          method: "POST",
          table: "accounts",
          action: "select",
          body: {
            columns: ["id", "code", "name"],
            where: {
              id: safeParseObject(updatedOrder?.payment_detail)?.account_id,
            },
            size: Number(1),
          },
        });
        accBank = resBank?.items?.[0] || null;
      }

      if (fields?.dp_payment_proof) {
        // safeParseObject(updatedOrder?.payment_detail)
        await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "account_ledger_mutations",
          action: "bulk-insert",
          body: {
            rows: [
              {
                account_code: "4-101",
                account_name: "Pendapatan Usaha",
                credit: existOrder?.dp_amount,
                debit: 0,
                notes: existOrder?.order_number,
                receipt_url: fields?.dp_payment_proof,
                category: "DP Pesanan",
                trx_code: existOrder?.order_number,
              },
              {
                account_code: accBank?.code || "1-101",
                account_name: accBank?.name || "Kas Utama (Cash on Hand)",
                credit: 0,
                debit: existOrder?.dp_amount,
                notes: existOrder?.order_number,
                receipt_url: fields?.dp_payment_proof,
                category: "DP Pesanan",
                trx_code: existOrder?.order_number,
              },
            ],
            updateOnDuplicate: true,
          },
        });
      }
      if (fields?.payment_proof) {
        const amountMutation =
          existOrder?.payment_status === "down_payment"
            ? existOrder?.total_amount - existOrder?.dp_amount
            : existOrder?.total_amount;
        await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "account_ledger_mutations",
          action: "bulk-insert",
          body: {
            rows: [
              {
                account_code: "4-101",
                account_name: "Pendapatan Usaha",
                credit: amountMutation,
                debit: 0,
                notes: existOrder?.order_number,
                receipt_url: fields?.payment_proof,
                trx_code: existOrder?.order_number,
              },
              {
                account_code: accBank?.code || "1-101",
                account_name: accBank?.name || "Kas Utama (Cash on Hand)",
                credit: 0,
                debit: amountMutation,
                notes: existOrder?.order_number,
                receipt_url: fields?.payment_proof,
                trx_code: existOrder?.order_number,
              },
            ],
            updateOnDuplicate: true,
          },
        });
      }

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
