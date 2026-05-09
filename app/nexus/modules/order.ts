import { safeParseArray, safeParseObject } from "~/utils/utils";
import { APIProvider } from "..";
import moment from "moment";

const generateJournalCode = () =>
  `JRNL${moment().add(7, "hours").format("YYYYMMDDHHmmss")}`;
const createMutation = async (
  session: any,
  mutations: any[],
  journal_code?: string
) => {
  if (journal_code) {
    await APIProvider(session)
      .Endpoint("POST", "update", "account_ledger_mutations")
      .Data({
        data: {
          deleted_on: moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
        },
        where: {
          journal_code,
        },
      })
      .Result();
  }
  await APIProvider(session)
    .Endpoint("POST", "bulk-insert", "account_ledger_mutations")
    .Data({
      rows: mutations?.map((mutation: any) => ({
        ...mutation,
        journal_code,
      })),
      updateOnDuplicate: true,
    })
    .Result();
};

export const OrderAPI = {
  // ================================
  // ✅ GET / LIST ORDERS
  // ================================
  get: async ({ session, req }: any) => {
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
      status_printed,
      is_kkn = "",
      is_portfolio,
      kkn_period = "",
      exclude_order_stock = "",
      check_product_item = "",
      end_date,
      year,
      sort = "",
      deleted_on,
      with_folders = false,
      filter_folder = "id_card_front,id_card_back",
    } = req.query || {};

    const where: any = {};

    if (id) where.id = id;
    if (institution_id) where.institution_id = institution_id;
    if (institution_domain) where.institution_domain = institution_domain;
    if (order_number) where.order_number = order_number;
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (order_type) where.order_type = order_type;
    if (is_kkn?.toString() !== "") where.is_kkn = is_kkn;
    if (is_portfolio) where.is_portfolio = is_portfolio;
    if (kkn_period) where.kkn_period = kkn_period;

    if (exclude_order_stock) {
      where["not_exists:stock_logs"] = {
        "foreign_key": "order_trx_code",
        "reference_key": "order_number"
      }
    }
    if (check_product_item) {
      where["exists:order_items"] = {
        "foreign_key": "order_number",
        "reference_key": "order_number",
        "where": {
          "product_name": "like:" + check_product_item
        }
      }
    }

    // ✅ FILTER TANGGAL
    if (start_date && end_date) {
      where.created_on = { between: [start_date, end_date] };
    } else if (start_date) {
      where.created_on = { gte: start_date };
    } else if (end_date) {
      where.created_on = { lte: end_date };
    } else if (status_printed) {
      where.status_printed = status_printed;
    }

    if (year) {
      where["year:order_date"] = parseInt(year);
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
      const columns = [
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
        "payment_proof_uploaded_on",
        "payment_detail",
        "payment_journal_code",
        "dp_payment_method",
        "dp_payment_proof",
        "dp_payment_proof_uploaded_on",
        "dp_payment_detail",
        "dp_payment_journal_code",
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
        "kkn_period",
        "kkn_year",
        "is_personal",
        "pic_name",
        "pic_phone",
        "drive_folder_id",
        "status",
        "status_printed",
        "deadline",
        "created_on",
        "created_by",
        `(SELECT COUNT(id) FROM order_items) AS total_product`,
        `
        (
          SELECT 1 
          FROM order_items 
          WHERE order_number = orders.order_number 
            AND deleted_on IS NULL 
            AND (product_name LIKE '%card%' OR product_name LIKE '%lanyard%')
          LIMIT 1
        ) AS is_idcard_lanyard
        `,
        `
        (
          SELECT 1 
          FROM order_items 
          WHERE order_number = orders.order_number 
            AND deleted_on IS NULL 
            AND (product_name LIKE '%cotton%')
          LIMIT 1
        ) AS is_order_shirt
        `,
      ];
      // if (extraColumns) columns.push(extraColumns);
      const result = await APIProvider(session)
        .Endpoint("POST", "select", "orders")
        .Data({
          columns,
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
              where: { deleted_on: "null" },
              columns: [
                "id",
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
            ...(with_folders
              ? [
                {
                  table: "order_upload_folders",
                  alias: "order_upload_folders",
                  foreign_key: "order_number",
                  reference_key: "order_number",
                  where: {
                    deleted_on: "null",
                    purpose: filter_folder,
                  },
                  columns: ["id", "folder_name", "purpose", "order_number"],
                },
              ]
              : []),
          ],
        })
        .Result();

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
  create: async ({ session, req }: any) => {
    const body = req.body || {};
    let {
      institution_id = null,
      institution_name = null,
      institution_abbr = null,
    } = body;
    const {
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
      kkn_source = "kkn_itera",
      kkn_type = "",
      kkn_detail = "",
      kkn_period = "",
      kkn_year = "",
      is_personal = 0,
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
    } = body;

    // if (!institution_id || !institution_name) {
    //   return {
    //     success: false,
    //     message: "institution_id dan institution_name wajib diisi",
    //   };
    // }

    const formatKknSource = (source: string): string => {
      if (!source) return "";

      // Menghapus underscore, menggantinya dengan spasi, lalu mengubah ke Huruf Kapital Semua
      return source.replace(/_/g, " ").toUpperCase();
    };

    if (+is_kkn > 0 && kkn_source) {
      const kkn = await APIProvider(session)
        .Endpoint("POST", "select", "institutions")
        .Data({
          columns: ["id", "name", "abbr"],
          where: {
            abbr: kkn_source,
          },
        })
        .Result();
      institution_id = !kkn?.items?.[0] ? null : kkn?.items?.[0]?.id;
      institution_name = !kkn?.items?.[0]
        ? formatKknSource(kkn_source)
        : kkn?.items?.[0]?.name;
      institution_abbr = !kkn?.items?.[0] ? kkn_source : kkn?.items?.[0]?.abbr;
    }

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

    const jrnlCode = generateJournalCode();

    // ✅ Server-side: Compute subtotal from items, then derive total_amount
    let computedSubtotal = 0;
    if (items?.length > 0) {
      items.forEach((item: any) => {
        const itemFinalPrice = Number(item?.variant_final_price) || 0;
        if (itemFinalPrice > 0) {
          computedSubtotal += itemFinalPrice;
        } else {
          // Fallback: qty * unit_price
          const qty = Number(item?.qty || item?.quantity) || 0;
          const unitPrice = Number(item?.unit_price || item?.price) || 0;
          computedSubtotal += qty * unitPrice;
        }
      });
    }

    // Apply discount to get total_amount
    let computedDiscount = 0;
    if (discount_type === "percent") {
      computedDiscount = computedSubtotal * (Number(discount_value) / 100);
    } else {
      computedDiscount = Number(discount_value) || 0;
    }
    computedDiscount = Math.min(computedDiscount, computedSubtotal);
    const computedTotalAmount = computedSubtotal - computedDiscount;

    // Use server-computed values, fallback to client value only if no items
    const finalSubtotal = items?.length > 0 ? computedSubtotal : (total_amount + computedDiscount);
    const finalTotalAmount = items?.length > 0 ? computedTotalAmount : total_amount;

    const newOrder: any = {
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
      discount_value: computedDiscount,
      tax_percent,
      shipping_fee,
      other_fee,
      subtotal: finalSubtotal,
      total_amount: finalTotalAmount,
      dp_amount,
      is_sponsor,
      is_kkn,
      is_archive,
      kkn_source,
      kkn_type,
      kkn_detail: kkn_detail ? JSON.stringify(kkn_detail) : null,
      kkn_period,
      kkn_year,
      is_personal,
      grand_total: finalTotalAmount,
      deadline,
      status,
      status_printed: "waiting",
      notes,
      shipping_address,
      shipping_contact,
      images: JSON.stringify(images || []),
      created_by: safeParseObject(created_by)
        ? JSON.stringify(created_by)
        : null,
      created_on: moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
      modified_on: null,
      ...(finalTotalAmount > 0 &&
        +is_archive === 1 && {
        ...(payment_status === "down_payment"
          ? {
            dp_payment_journal_code: jrnlCode,
          }
          : {
            payment_journal_code: jrnlCode,
          }),
      }),
    };

    try {
      // ✅ Simpan domain baru jika perlu
      if (institution_name && !(+institution_id > 0)) {
        const result = await APIProvider(session)
          .Endpoint("POST", "insert", "institutions")
          .Data({
            data: {
              name: institution_name,
              abbr: institution_abbr,
              created_on: new Date().toISOString(),
            },
          })
          .Result();

        newOrder.institution_id = result?.insert_id;
      }

      const products = await APIProvider(session)
        .Endpoint("POST", "select", "products")
        .Data({
          columns: ["id", "name", "category_id"],
          where: {
            id: items?.map((v: any) => +v?.productId)?.join(","),
          },
        })
        .Result();

      if (+is_archive === 0) {

        // CREATE 1 FOLDER DRIVE
        const createFolder = await APIProvider(session)
          .Endpoint("POST", "insert", "order_upload_folders")
          .Data({
            data: {
              order_number,
              folder_name: `${institution_name} - ${order_number}`,
            },
          })
          .Result();

        newOrder.drive_folder_id = createFolder?.insert_id;
        if (createFolder?.insert_id) {
          const categories = await APIProvider(session)
            .Endpoint("POST", "select", "product_categories")
            .Data({
              columns: ["id", "name", "default_drive_folders"],
              where: {
                id: products?.items?.map((v: any) => +v?.category_id)?.join(","),
              },
            })
            .Result();

          const checkPurpose = (folder: any) => {
            if (folder?.is_card_front) return "id_card_front";
            if (folder?.is_card_back) return "id_card_back";
            if (folder?.is_lanyard) return "lanyard";
            if (folder?.is_sablon_depan) return "sablon_depan";
            if (folder?.is_sablon_belakang) return "sablon_belakang";
            return "other";
          }

          const folderRows = categories?.items?.flatMap((v: any) => {
            // Pastikan folders adalah array. 
            // Jika di database disimpan sebagai string JSON, gunakan JSON.parse(v.default_drive_folders)
            const folders = v.default_drive_folders
              ? safeParseArray(v.default_drive_folders)
              : [];

            return folders.map((folderName: any) => ({
              order_number,
              parent_id: createFolder?.insert_id,
              folder_name: typeof folderName === 'string' ? folderName : folderName?.name, // sesuaikan jika folder adalah object atau string
              purpose: checkPurpose(folderName), // tetap mengambil nama kategori sebagai purpose
            }));
          });

          if (folderRows.length > 0) {
            await APIProvider(session)
              .Endpoint("POST", "bulk-insert", "order_upload_folders")
              .Data({
                rows: folderRows,
                updateOnDuplicate: true,
              })
              .Result();
          }

        }
      }

      // ✅ Insert ke table orders
      const result = await APIProvider(session)
        .Endpoint("POST", "insert", "orders")
        .Data({ data: newOrder })
        .Result();

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
        // Tambahkan await Promise.all di sini
        const itemRows = await Promise.all(
          items.map(async (item: any) => {
            const qty = Number(item?.qty || item?.quantity) || 1;

            let defVariant = null;
            if (!item?.variant_id) {
              const isiDefVar = await APIProvider(session)
                .Endpoint("POST", "select", "product_variants")
                .Data({
                  columns: ["id", "variant_name", "base_price", "is_default"],
                  where: {
                    product_id: item?.product_id || item?.productId || null,
                    is_default: 1,
                  },
                })
                .Result();
              defVariant = isiDefVar?.items?.[0];
            }

            // ✅ Compute unit_price from price_rule + variant_price (never allow 0 if we have rule/variant data)
            const priceRuleValue = Number(item?.price_rule_value) || 0;
            const variantPrice = Number(defVariant?.base_price || item?.variant_price) || 0;
            const computedUnitPrice = priceRuleValue + variantPrice;
            const unit_price = computedUnitPrice > 0 ? computedUnitPrice : (Number(item?.unit_price || item?.price) || 0);

            const subtotal = qty * unit_price;
            const variantFinalPrice = Number(item?.variant_final_price) || subtotal;

            const discount_total =
              item?.discount_type === "percent"
                ? (subtotal * (Number(item?.discount_value) || 0)) / 100
                : Number(item?.discount_value) || 0;
            const tax_value =
              ((subtotal - discount_total) * (Number(item?.tax_percent) || 0)) / 100;

            return {
              order_number,
              variant_id: defVariant?.id || item?.variant_id || null,
              variant_name: defVariant?.variant_name || item?.variant_name || null,
              variant_price: variantPrice || null,
              product_id: item?.product_id || item?.productId || null,
              product_name: item?.product_name || item?.productName || null,
              product_type: item?.product_type || "single",
              qty,
              unit_price,
              discount_type: item?.discount_type || null,
              discount_value: item?.discount_value || 0,
              tax_percent: item?.tax_percent || 0,
              subtotal: variantFinalPrice,
              discount_total,
              tax_value,
              total_after_tax: subtotal - discount_total + tax_value,
              notes: item?.notes || null,
              variant_final_price: variantFinalPrice,
              price_rule_id: item?.price_rule_id || null,
              price_rule_min_qty: item?.price_rule_min_qty || null,
              price_rule_value: priceRuleValue || null,
            };
          })
        );

        await APIProvider(session)
          .Endpoint("POST", "bulk-insert", "order_items")
          .Data({
            rows: itemRows,
            updateOnDuplicate: true,
          })
          .Result();
      }

      if (finalTotalAmount > 0 && +is_archive === 1) {
        createMutation(
          session,
          [
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
              trx_date:
                order_date ??
                moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
            },
            {
              account_code: +is_archive !== 1 ? "1-102" : "1-101",
              account_name:
                +is_archive !== 1
                  ? "Piutang Usaha"
                  : "Kas Utama (Cash on Hand)",
              credit: 0,
              debit:
                payment_status === "down_payment"
                  ? total_amount - dp_amount
                  : total_amount,
              notes: order_number,
              trx_code: order_number,
              trx_date:
                order_date ??
                moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
            },
          ],
          jrnlCode
        );

        console.log("INSERT JOURNAL")
      }
      // account_code: accBank?.code || "1-101",
      //           account_name: accBank?.name || "Kas Utama (Cash on Hand)",

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
  findOrCreate: async ({ session, req }: any) => {
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
        const existing = await APIProvider(session)
          .Endpoint("POST", "select", "orders")
          .Data({
            columns: ["*"],
            where: { uid },
            size: 1,
          })
          .Result();

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

      const result = await APIProvider(session)
        .Endpoint("POST", "insert", "orders")
        .Data({ data: newOrder })
        .Result();

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
  update: async ({ session, req }: any) => {
    const { id, order, order_number, items, ...fields } = req.body || {};

    const existOrder: any = order ? safeParseObject(order) : null;
    if (!id) {
      return { success: false, message: "ID order wajib diisi untuk update" };
    }

    // ✅ Server-side: Recompute subtotal/total_amount from items if items are provided
    let computedSubtotal = 0;
    if (items?.length > 0) {
      items.forEach((item: any) => {
        const itemFinalPrice = Number(item?.variant_final_price) || 0;
        if (itemFinalPrice > 0) {
          computedSubtotal += itemFinalPrice;
        } else {
          const qty = Number(item?.qty || item?.quantity) || 0;
          const unitPrice = Number(item?.unit_price || item?.price) || 0;
          computedSubtotal += qty * unitPrice;
        }
      });
    }

    const discountType = fields?.discount_type || existOrder?.discount_type;
    const discountVal = Number(fields?.discount_value ?? existOrder?.discount_value) || 0;
    let computedDiscount = 0;
    if (discountType === "percent") {
      computedDiscount = computedSubtotal * (discountVal / 100);
    } else {
      computedDiscount = discountVal;
    }
    computedDiscount = Math.min(computedDiscount, computedSubtotal);
    const computedTotalAmount = items?.length > 0 ? (computedSubtotal - computedDiscount) : Number(fields?.total_amount || 0);

    const updatedOrder = {
      ...fields,
      ...(fields?.kkn_detail && {
        kkn_detail: JSON.stringify(fields?.kkn_detail),
      }),
      // ✅ Sync computed values when items are provided
      ...(items?.length > 0 && {
        subtotal: computedSubtotal,
        total_amount: computedTotalAmount,
        grand_total: computedTotalAmount,
        discount_value: computedDiscount,
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

    const jrnlCode = existOrder?.payment_journal_code || generateJournalCode();
    const jrnlCodeDP =
      existOrder?.dp_payment_journal_code || generateJournalCode();

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "update", "orders")
        .Data({
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
            ...(fields?.dp_payment_proof && {
              dp_payment_journal_code: jrnlCodeDP,
              dp_payment_proof_uploaded_on: moment()
                .add(7, "hours")
                .format("YYYY-MM-DD HH:mm:ss"),
            }),
            ...(fields?.payment_proof && {
              payment_journal_code: jrnlCode,
              payment_status: "paid",
              payment_proof_uploaded_on: moment()
                .add(7, "hours")
                .format("YYYY-MM-DD HH:mm:ss"),
            }),
          },
          where: { id },
        })
        .Result();

      // ✅ Insert order_items (bulk)
      if (items?.length > 0) {
        await APIProvider(session)
          .Endpoint("POST", "update", "order_items")
          .Data({
            data: {
              deleted_on: new Date().toISOString(),
            },
            where: { order_number },
          })
          .Result();

        // const products = await APIProvider({
        //   endpoint: "select",
        //   method: "POST",
        //   table: "products",
        //   action: "select",
        //   body: {
        //     columns: ["id", "name", "category_id"],
        //     where: {
        //       id: items?.map((v: any) => +(v?.product_id || v?.productId))?.join(","),
        //     },
        //   },
        // });

        // // CREATE DRIVE FOLDERS IF THEY DON'T EXIST
        // if (+updatedOrder?.is_archive === 0) {
        //   const checkFolderExists = await APIProvider({
        //     endpoint: "select",
        //     method: "POST",
        //     table: "order_upload_folders",
        //     action: "select",
        //     body: {
        //       columns: ["id"],
        //       where: {
        //         order_number,
        //         level: 1, // Main folder
        //         deleted_on: "null"
        //       },
        //       size: 1
        //     }
        //   });

        //   // Only create if main folder exists
        //   if (checkFolderExists?.items?.length > 0) {
        //     const parentId = checkFolderExists.items[0].id;
        //     const existingChildFolders = await APIProvider({
        //       endpoint: "select",
        //       method: "POST",
        //       table: "order_upload_folders",
        //       action: "select",
        //       body: {
        //         columns: ["purpose"],
        //         where: {
        //           parent_id: parentId,
        //           deleted_on: "null"
        //         }
        //       }
        //     });
        //     const existingPurposes = existingChildFolders?.items?.map((f: any) => f.purpose) || [];

        //     const categories = await APIProvider({
        //       endpoint: "select",
        //       method: "POST",
        //       table: "product_categories",
        //       action: "select",
        //       body: {
        //         columns: ["id", "name", "default_drive_folders"],
        //         where: {
        //           id: products?.items?.map((v: any) => +v?.category_id)?.join(","),
        //         },
        //       },
        //     });

        //     const checkPurpose = (folder: any) => {
        //       if (folder?.is_card_front) return "id_card_front";
        //       if (folder?.is_card_back) return "id_card_back";
        //       if (folder?.is_lanyard) return "lanyard";
        //       if (folder?.is_sablon_depan) return "sablon_depan";
        //       if (folder?.is_sablon_belakang) return "sablon_belakang";
        //       return "other";
        //     };

        //     const folderRows = categories?.items?.flatMap((v: any) => {
        //       const folders = v.default_drive_folders
        //         ? safeParseArray(v.default_drive_folders)
        //         : [];

        //       return folders.map((folderName: any) => {
        //         const purpose = checkPurpose(folderName);
        //         if (existingPurposes.includes(purpose) && purpose !== 'other') {
        //           return null; // Skip if purpose already exists
        //         }
        //         return {
        //           order_number,
        //           parent_id: parentId,
        //           folder_name: typeof folderName === 'string' ? folderName : folderName?.name,
        //           purpose,
        //         };
        //       }).filter(Boolean); // Remove nulls
        //     });

        //     if (folderRows && folderRows.length > 0) {
        //       await APIProvider({
        //         endpoint: "bulk-insert",
        //         method: "POST",
        //         table: "order_upload_folders",
        //         action: "bulk-insert",
        //         body: {
        //           rows: folderRows,
        //           updateOnDuplicate: true,
        //         },
        //       });
        //     }
        //   }
        // }

        const itemRows = await Promise.all(
          items.map(async (item: any) => {
            const qty = Number(item?.qty || item?.quantity) || 1;

            let defVariant = null;
            if (!item?.variant_id) {
              const isiDefVar = await APIProvider(session)
                .Endpoint("POST", "select", "product_variants")
                .Data({
                  columns: ["id", "variant_name", "base_price", "is_default"],
                  where: {
                    product_id: item?.product_id || item?.productId || null,
                    is_default: 1,
                  },
                })
                .Result();
              defVariant = isiDefVar?.items?.[0];
            }

            // ✅ Compute unit_price from price_rule + variant_price
            const priceRuleValue = Number(item?.price_rule_value) || 0;
            const variantPrice = Number(defVariant?.base_price || item?.variant_price) || 0;
            const computedUnitPrice = priceRuleValue + variantPrice;
            const unit_price = computedUnitPrice > 0 ? computedUnitPrice : (Number(item?.unit_price || item?.price) || 0);

            const subtotal = qty * unit_price;
            const variantFinalPrice = Number(item?.variant_final_price) || subtotal;

            const discount_total =
              item?.discount_type === "percent"
                ? (subtotal * (Number(item?.discount_value) || 0)) / 100
                : Number(item?.discount_value) || 0;
            const tax_value =
              ((subtotal - discount_total) * (Number(item?.tax_percent) || 0)) / 100;

            return {
              order_number: order_number || existOrder?.order_number,
              product_id: item?.product_id || item?.productId || null,
              product_name: item?.product_name || item?.productName || null,
              product_type: item?.product_type || "single",
              qty,
              unit_price,
              discount_type: item?.discount_type || null,
              discount_value: item?.discount_value || 0,
              tax_percent: item?.tax_percent || 0,
              subtotal: variantFinalPrice,
              discount_total,
              tax_value,
              total_after_tax: subtotal - discount_total + tax_value,
              notes: item?.notes || null,
              variant_id: defVariant?.id || item?.variant_id || null,
              variant_name: defVariant?.variant_name || item?.variant_name || null,
              variant_price: variantPrice || null,
              variant_final_price: variantFinalPrice,
              price_rule_id: item?.price_rule_id || null,
              price_rule_min_qty: item?.price_rule_min_qty || null,
              price_rule_value: priceRuleValue || null,
              deleted_on: null,
            };
          })
        );

        await APIProvider(session)
          .Endpoint("POST", "bulk-insert", "order_items")
          .Data({
            rows: itemRows,
            updateOnDuplicate: true,
          })
          .Result();
      }

      let accBank = null;
      if ((safeParseObject(updatedOrder?.payment_detail) as any)?.account_id) {
        const resBank = await APIProvider(session)
          .Endpoint("POST", "select", "accounts")
          .Data({
            columns: ["id", "code", "name"],
            where: {
              id: (safeParseObject(updatedOrder?.payment_detail) as any)
                ?.account_id,
            },
            size: Number(1),
          })
          .Result();
        accBank = resBank?.items?.[0] || null;
      }

      if (fields?.dp_payment_proof) {
        // safeParseObject(updatedOrder?.payment_detail)
        createMutation(
          session,
          [
            {
              account_code: "4-101",
              account_name: "Pendapatan Usaha",
              credit: existOrder?.dp_amount,
              debit: 0,
              notes: existOrder?.order_number,
              receipt_url: fields?.dp_payment_proof,
              category: "DP Pesanan",
              trx_code: existOrder?.order_number,
              trx_date:
                existOrder?.order_date ??
                moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
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
              trx_date:
                existOrder?.order_date ??
                moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
            },
          ],
          jrnlCodeDP
        );
      }
      if (fields?.payment_proof) {
        const amountMutation =
          existOrder?.payment_status === "down_payment"
            ? existOrder?.total_amount - existOrder?.dp_amount
            : existOrder?.total_amount;
        createMutation(
          session,
          [
            {
              account_code: "4-101",
              account_name: "Pendapatan Usaha",
              credit: amountMutation,
              debit: 0,
              notes: existOrder?.order_number,
              receipt_url: fields?.payment_proof,
              trx_code: existOrder?.order_number,
              trx_date:
                existOrder?.order_date ??
                moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
            },
            {
              account_code: accBank?.code || "1-101",
              account_name: accBank?.name || "Kas Utama (Cash on Hand)",
              credit: 0,
              debit: amountMutation,
              notes: existOrder?.order_number,
              receipt_url: fields?.payment_proof,
              trx_code: existOrder?.order_number,
              trx_date:
                existOrder?.order_date ??
                moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
            },
          ],
          jrnlCode
        );
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
