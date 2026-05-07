// import { generateProductCode, safeParseArray, safeParseObject } from "~/lib/utils";
// import { APIProvider } from "../client";
// import moment from "moment";
// // import { createMutation, generateJournalCode } from "./order";

// const generateJournalCode = () =>
//     `JRNL${moment().add(7, "hours").format("YYYYMMDDHHmmss")}`;
// const createMutation = async (mutations: any[], journal_code?: string) => {
//     if (journal_code) {
//         await APIProvider({
//             endpoint: "update",
//             method: "POST",
//             table: "account_ledger_mutations",
//             action: "update",
//             body: {
//                 data: {
//                     deleted_on: moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
//                 },
//                 where: {
//                     journal_code,
//                 },
//             },
//         });
//     }
//     await APIProvider({
//         endpoint: "bulk-insert",
//         method: "POST",
//         table: "account_ledger_mutations",
//         action: "bulk-insert",
//         body: {
//             rows: mutations?.map((mutation: any) => ({
//                 ...mutation,
//                 journal_code,
//             })),
//             updateOnDuplicate: true,
//         },
//     });
// };

// export const StockLogAPI = {
//     get: async ({ req }: any) => {
//         const {
//             page = 0,
//             size = 10,
//             search,
//             type = "",
//             category = "",
//             id = "",
//         } = req.query || {};

//         return APIProvider({
//             endpoint: "select",
//             method: "POST",
//             table: "stock_logs",
//             action: "select",
//             body: {
//                 columns: [
//                     "id",
//                     "trx_code",
//                     "order_trx_code",
//                     "supplier_id",
//                     "supplier_name",
//                     "total_amount",
//                     "shipping_cost",
//                     "admin_cost",
//                     "discount",
//                     "grand_total",
//                     "direction",
//                     "description",
//                     "is_auto",
//                     "proof",
//                     "payment_proof",
//                     "payment_proof_on",
//                     "payment_detail",
//                     "payment_journal_code",
//                     "dp_payment_proof",
//                     "dp_payment_proof_on",
//                     "dp_payment_detail",
//                     "dp_payment_journal_code",
//                     "created_on",
//                 ],
//                 where: {
//                     deleted_on: "null",
//                     ...(type ? { type } : {}),
//                     ...(id ? { id } : {}),
//                     ...(category ? { category } : {}),
//                 },
//                 search,
//                 page: Number(page),
//                 size: Number(size),
//                 include: [
//                     {
//                         table: "stock_log_items",
//                         alias: "items",
//                         foreign_key: "stock_log_id",
//                         reference_key: "id",
//                         where: { deleted_on: "null" },
//                         columns: [
//                             "id",
//                             "stock_log_id",
//                             "commodity_id",
//                             "commodity_name",
//                             "is_commodity_parent",
//                             "category",
//                             "movement_type",
//                             "qty",
//                             "price_per_unit",
//                             "subtotal",
//                             "created_on",
//                         ],
//                     },
//                     {
//                         table: "orders",
//                         alias: "orders",
//                         foreign_key: "order_number",
//                         reference_key: "order_trx_code",
//                         // where: { deleted_on: "null" },
//                         columns: [
//                             "id",
//                             "order_number",
//                             "institution_id",
//                             "institution_name",
//                             "pic_name",
//                             "pic_phone",
//                         ],
//                     },
//                 ],
//             },
//         });
//     },

//     create: async ({ req }: any) => {
//         const {
//             id,
//             supplier_id,
//             order_trx_code,
//             supplier_name,
//             total_amount,
//             shipping_cost,
//             admin_cost,
//             discount,
//             grand_total,
//             category,
//             direction,
//             description,
//             is_auto,
//             proof,
//             items = [],
//         } = req.body || {};

//         const newStockLog = {
//             trx_code: `STOCK${moment().format("YYYYMMDDHHmmss")}`,
//             supplier_id,
//             supplier_name,
//             total_amount,
//             ...order_trx_code && { order_trx_code: order_trx_code },
//             shipping_cost,
//             admin_cost,
//             discount,
//             grand_total,
//             category,
//             direction,
//             description,
//             is_auto,
//             proof,
//         };

//         try {
//             let result;

//             // INSERT BARU
//             if (!id) {
//                 console.log("INSERT BARU", newStockLog);
//                 result = await APIProvider({
//                     endpoint: "insert",
//                     method: "POST",
//                     table: "stock_logs",
//                     action: "insert",
//                     body: { data: newStockLog },
//                 });
//             }
//             // UPDATE PRODUK
//             else {
//                 result = await APIProvider({
//                     endpoint: "update",
//                     method: "POST",
//                     table: "stock_logs",
//                     action: "update",
//                     body: {
//                         data: newStockLog,
//                         where: { id },
//                     },
//                 });

//                 result.insert_id = id; // agar konsisten dipakai di bawah
//             }

//             const stock_log_id = result.insert_id;

//             // INSERT / UPDATE COMPONENT ITEMS
//             if (Array.isArray(items) && items.length > 0) {
//                 await APIProvider({
//                     endpoint: "bulk-insert",
//                     method: "POST",
//                     table: "stock_log_items",
//                     action: "bulk-insert",
//                     body: {
//                         updateOnDuplicate: true,
//                         rows: items.map((item: any) => ({
//                             ...item,
//                             stock_log_id,
//                             id: null,
//                         })),
//                     },
//                 });
//             }

//             return {
//                 success: true,
//                 message: "Stock log berhasil disimpan",
//                 stock_log: { id: stock_log_id, ...newStockLog },
//             };
//         } catch (err: any) {
//             console.error(err);
//             return { success: false, message: err.message };
//         }
//     },
//     // ================================
//     // ✅ UPDATE ORDER
//     // ================================
//     update: async ({ req }: any) => {
//         let { id, stock_log, order, ...fields } = req.body || {};

//         const existStockLog: any = stock_log ? safeParseObject(stock_log) : null;
//         if (!id) {
//             return { success: false, message: "ID stock log wajib diisi untuk update" };
//         }

//         const updatedStockLog = {
//             ...fields,
//             modified_on: new Date().toISOString(),
//             ...(fields.deleted === 1 ? { deleted_on: new Date().toISOString() } : {}),
//         };
//         console.log(updatedStockLog)

//         const jrnlCode = existStockLog?.journal_code || generateJournalCode();
//         const jrnlCodeDP =
//             existStockLog?.dp_payment_journal_code || generateJournalCode();

//         try {
//             const result = await APIProvider({
//                 endpoint: "update",
//                 method: "POST",
//                 table: "stock_logs",
//                 action: "update",
//                 body: {
//                     data: {
//                         ...updatedStockLog,
//                         ...(safeParseObject(updatedStockLog?.payment_detail)
//                             ? { payment_detail: JSON.stringify(updatedStockLog?.payment_detail) }
//                             : {}),
//                         ...(safeParseObject(updatedStockLog?.dp_payment_detail)
//                             ? {
//                                 dp_payment_detail: JSON.stringify(
//                                     updatedStockLog?.dp_payment_detail
//                                 ),
//                             }
//                             : {}),
//                         ...(fields?.dp_payment_proof && {
//                             dp_payment_journal_code: jrnlCodeDP,
//                             dp_payment_proof_on: moment()
//                                 .add(7, "hours")
//                                 .format("YYYY-MM-DD HH:mm:ss"),
//                         }),
//                         ...(fields?.payment_proof && {
//                             payment_journal_code: jrnlCode,
//                             payment_status: "paid",
//                             payment_proof_on: moment()
//                                 .add(7, "hours")
//                                 .format("YYYY-MM-DD HH:mm:ss"),
//                         }),
//                     },
//                     where: { id },
//                 },
//             });

//             let accBank = null;
//             if ((safeParseObject(updatedStockLog?.payment_detail) as any)?.account_id) {
//                 const resBank = await APIProvider({
//                     endpoint: "select",
//                     method: "POST",
//                     table: "accounts",
//                     action: "select",
//                     body: {
//                         columns: ["id", "code", "name"],
//                         where: {
//                             id: (safeParseObject(updatedStockLog?.payment_detail) as any)
//                                 ?.account_id,
//                         },
//                         size: Number(1),
//                     },
//                 });
//                 accBank = resBank?.items?.[0] || null;
//             }

//             if (fields?.dp_payment_proof) {
//                 createMutation(
//                     [
//                         {
//                             account_code: "4-101",
//                             account_name: "Pendapatan Usaha",
//                             credit: existStockLog?.dp_amount,
//                             debit: 0,
//                             notes: existStockLog?.order_number,
//                             receipt_url: fields?.dp_payment_proof,
//                             category: "DP Pesanan",
//                             trx_code: existStockLog?.order_number,
//                             trx_date:
//                                 existStockLog?.order_date ??
//                                 moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
//                         },
//                         {
//                             account_code: accBank?.code || "1-101",
//                             account_name: accBank?.name || "Kas Utama (Cash on Hand)",
//                             credit: 0,
//                             debit: existStockLog?.dp_amount,
//                             notes: existStockLog?.order_number,
//                             receipt_url: fields?.dp_payment_proof,
//                             category: "DP Pesanan",
//                             trx_code: existStockLog?.order_number,
//                             trx_date:
//                                 existStockLog?.order_date ??
//                                 moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
//                         },
//                     ],
//                     jrnlCodeDP
//                 );
//             }
//             if (fields?.payment_proof) {
//                 const amountMutation =
//                     existStockLog?.payment_status === "down_payment"
//                         ? existStockLog?.total_amount - existStockLog?.dp_amount
//                         : existStockLog?.total_amount;
//                 createMutation(
//                     [
//                         {
//                             account_code: "4-101",
//                             account_name: "Pendapatan Usaha",
//                             credit: amountMutation,
//                             debit: 0,
//                             notes: existStockLog?.order_number,
//                             receipt_url: fields?.payment_proof,
//                             trx_code: existStockLog?.order_number,
//                             trx_date:
//                                 existStockLog?.order_date ??
//                                 moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
//                         },
//                         {
//                             account_code: accBank?.code || "1-101",
//                             account_name: accBank?.name || "Kas Utama (Cash on Hand)",
//                             credit: 0,
//                             debit: amountMutation,
//                             notes: existStockLog?.order_number,
//                             receipt_url: fields?.payment_proof,
//                             trx_code: existStockLog?.order_number,
//                             trx_date:
//                                 existStockLog?.order_date ??
//                                 moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
//                         },
//                     ],
//                     jrnlCode
//                 );
//             }

//             return {
//                 success: true,
//                 message: "Stock log berhasil diperbarui",
//                 affected: result.affected_rows,
//             };
//         } catch (err: any) {
//             return { success: false, message: err.message };
//         }
//     },
// };

import { generateProductCode, safeParseArray, safeParseObject } from "~/lib/utils";
import { APIProvider } from "../client";
import moment from "moment";

const generateJournalCode = () =>
    `JRNL${moment().add(7, "hours").format("YYYYMMDDHHmmss")}`;

const createMutation = async (mutations: any[], journal_code?: string) => {
    if (journal_code) {
        await APIProvider({
            endpoint: "update",
            method: "POST",
            table: "account_ledger_mutations",
            action: "update",
            body: {
                data: {
                    deleted_on: moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss"),
                },
                where: { journal_code },
            },
        });
    }
    await APIProvider({
        endpoint: "bulk-insert",
        method: "POST",
        table: "account_ledger_mutations",
        action: "bulk-insert",
        body: {
            rows: mutations?.map((mutation: any) => ({
                ...mutation,
                journal_code,
            })),
            updateOnDuplicate: true,
        },
    });
};

export const StockLogAPI = {
    get: async ({ req }: any) => {
        const {
            page = 0,
            size = 10,
            search,
            id = "",
        } = req.query || {};

        return APIProvider({
            endpoint: "select",
            method: "POST",
            table: "stock_logs",
            action: "select",
            body: {
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
            },
        });
    },

    create: async ({ req }: any) => {
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
                result = await APIProvider({
                    endpoint: "insert",
                    method: "POST",
                    table: "stock_logs",
                    action: "insert",
                    body: { data: newStockLog },
                });
            } else {
                result = await APIProvider({
                    endpoint: "update",
                    method: "POST",
                    table: "stock_logs",
                    action: "update",
                    body: {
                        data: newStockLog,
                        where: { id },
                    },
                });
                result.insert_id = id;
            }

            const stock_log_id = result.insert_id;

            if (Array.isArray(items) && items.length > 0) {
                console.log(items.map((item: any) => ({
                    ...item,
                    stock_log_id,
                    direction: "IN",
                    supplier_id: item.supplier_id || supplier_id,
                    order_trx_code: item.order_trx_code || order_trx_code,
                    id: item.id || null,
                })))
                await APIProvider({
                    endpoint: "bulk-insert",
                    method: "POST",
                    // table: "stock_item_logs",
                    table: "stock_log_items",
                    action: "bulk-insert",
                    body: {
                        updateOnDuplicate: true,
                        rows: items.map((item: any) => ({
                            ...item,
                            stock_log_id,
                            direction: "IN",
                            supplier_id: item.supplier_id || supplier_id,
                            order_trx_code: item.order_trx_code || order_trx_code,
                            id: item.id || null,
                        })),
                    },
                });
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

    update: async ({ req }: any) => {
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
            const result = await APIProvider({
                endpoint: "update",
                method: "POST",
                table: "stock_logs",
                action: "update",
                body: {
                    data: updatedStockLog,
                    where: { id },
                },
            });

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