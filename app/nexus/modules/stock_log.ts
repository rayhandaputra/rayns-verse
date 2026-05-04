import { generateProductCode, safeParseArray, safeParseObject } from "~/utils/utils";
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
        where: { journal_code },
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

export const StockLogAPI = {
    get: async ({ session, req }: any) => {
        const {
            page = 0,
            size = 10,
            search,
            id = "",
        } = req.query || {};

        return APIProvider(session)
            .Endpoint("POST", "select", "stock_logs")
            .Data({
                columns: [
                    "id",
                    "trx_code",
                    "order_trx_code",
                    "supplier_id",
                    "total_item_qty",
                    "total_item_price",
                    "discount_value",
                    "admin_cost",
                    "shipping_cost",
                    "sablon_supplier_id",
                    "sablon_kebutuhan_per_meter",
                    "sablon_cost",
                    "sablon_discount_value",
                    "sablon_admin_cost",
                    "sablon_shipping_cost",
                    "final_amount",
                    "laba_bersih",
                    "kaos_payment_proof_paid",
                    "kaos_payment_proof_dp",
                    "sablon_payment_proof_paid",
                    "sablon_payment_proof_dp",
                    "payment_status",
                    "description",
                    "created_on",
                ],
                where: {
                    deleted_on: "null",
                    ...(id ? { id } : {}),
                },
                search,
                page: Number(page),
                size: Number(size),
                include: [
                    {
                        table: "stock_log_items",
                        alias: "items",
                        foreign_key: "stock_log_id",
                        reference_key: "id",
                        where: { deleted_on: "null" },
                        columns: [
                            "id",
                            "stock_log_id",
                            // "supplier_id",
                            "order_trx_code",
                            "product_id",
                            "qty",
                            "selling_price",
                            "supplier_price",
                            "subtotal",
                            "created_on",
                        ],
                    },
                    {
                        table: "orders",
                        alias: "orders",
                        foreign_key: "order_number",
                        reference_key: "order_trx_code",
                        columns: [
                            "id",
                            "order_number",
                            "institution_id",
                            "institution_name",
                            "pic_name",
                            "pic_phone",
                        ],
                    },
                ],
            })
            .Result();
    },

    create: async ({ session, req }: any) => {
        const {
            id,
            supplier_id,
            order_trx_code,
            total_item_qty,
            total_item_price,
            discount_value,
            admin_cost,
            shipping_cost,
            sablon_supplier_id,
            sablon_kebutuhan_per_meter,
            sablon_cost,
            sablon_discount_value,
            sablon_admin_cost,
            sablon_shipping_cost,
            final_amount,
            laba_bersih,
            description,
            kaos_payment_proof_paid,
            kaos_payment_proof_dp,
            sablon_payment_proof_paid,
            sablon_payment_proof_dp,
            items = [],
        } = req.body || {};

        const newStockLog = {
            trx_code: `STOCK${moment().format("YYYYMMDDHHmmss")}`,
            supplier_id,
            direction: "IN",
            order_trx_code,
            total_item_qty: items?.reduce((acc: number, item: any) => +acc + +item?.qty, 0),
            total_item_price: items?.reduce((acc: number, item: any) => +acc + +item?.subtotal, 0),
            discount_value,
            admin_cost,
            shipping_cost,
            sablon_supplier_id,
            sablon_kebutuhan_per_meter,
            sablon_cost,
            sablon_discount_value,
            sablon_admin_cost,
            sablon_shipping_cost,
            final_amount,
            laba_bersih,
            description,
            kaos_payment_proof_paid,
            kaos_payment_proof_dp,
            sablon_payment_proof_paid,
            sablon_payment_proof_dp,
        };

        try {
            let result;
            if (!id) {
                result = await APIProvider(session)
                    .Endpoint("POST", "insert", "stock_logs")
                    .Data({ data: newStockLog })
                    .Result();
            } else {
                result = await APIProvider(session)
                    .Endpoint("POST", "update", "stock_logs")
                    .Data({
                        data: newStockLog,
                        where: { id },
                    })
                    .Result();
                result.insert_id = id;
            }

            const stock_log_id = result.insert_id;

            if (Array.isArray(items) && items.length > 0) {
                await APIProvider(session)
                    .Endpoint("POST", "bulk-insert", "stock_log_items")
                    .Data({
                        updateOnDuplicate: true,
                        rows: items.map((item: any) => ({
                            ...item,
                            stock_log_id,
                            direction: "IN",
                            supplier_id: item.supplier_id || supplier_id,
                            order_trx_code: item.order_trx_code || order_trx_code,
                            id: item.id || null,
                        })),
                    })
                    .Result();
            }

            return {
                success: true,
                message: "Stock log berhasil disimpan",
                stock_log: { id: stock_log_id, ...newStockLog },
            };
        } catch (err: any) {
            console.error("ERROR LOG ADD STOCK: ", err);
            return { success: false, message: err.message };
        }
    },

    update: async ({ session, req }: any) => {
        let { id, stock_log, ...fields } = req.body || {};

        if (!id) {
            return { success: false, message: "ID stock log wajib diisi untuk update" };
        }

        const updatedStockLog = {
            ...fields,
            modified_on: moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
            ...(fields.deleted === 1 ? { deleted_on: moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss") } : {}),
        };

        try {
            const result = await APIProvider(session)
                .Endpoint("POST", "update", "stock_logs")
                .Data({
                    data: updatedStockLog,
                    where: { id },
                })
                .Result();

            return {
                success: true,
                message: "Stock log berhasil diperbarui",
                affected: result.affected_rows,
            };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    },
};