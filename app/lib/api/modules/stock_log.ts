import { generateProductCode } from "~/lib/utils";
import { APIProvider } from "../client";
import moment from "moment";

export const StockLogAPI = {
    get: async ({ req }: any) => {
        const {
            page = 0,
            size = 10,
            search,
            type = "",
            category = "",
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
                    "supplier_id",
                    "supplier_name",
                    "total_amount",
                    "shipping_cost",
                    "admin_cost",
                    "discount",
                    "grand_total",
                    "direction",
                    "description",
                    "is_auto",
                    "proof",
                    "created_on",
                ],
                where: {
                    deleted_on: "null",
                    ...(type ? { type } : {}),
                    ...(id ? { id } : {}),
                    ...(category ? { category } : {}),
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
                            "commodity_id",
                            "commodity_name",
                            "is_commodity_parent",
                            "category",
                            "movement_type",
                            "qty",
                            "price_per_unit",
                            "subtotal",
                            "created_on",
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
            supplier_name,
            total_amount,
            shipping_cost,
            admin_cost,
            discount,
            grand_total,
            category,
            direction,
            description,
            is_auto,
            proof,
            items = [],
        } = req.body || {};

        const newStockLog = {
            trx_code: `STOCK${moment().format("YYYYMMDDHHmmss")}`,
            supplier_id,
            supplier_name,
            total_amount,
            shipping_cost,
            admin_cost,
            discount,
            grand_total,
            category,
            direction,
            description,
            is_auto,
            proof,
        };

        try {
            let result;

            // INSERT BARU
            if (!id) {
                console.log("INSERT BARU", newStockLog);
                result = await APIProvider({
                    endpoint: "insert",
                    method: "POST",
                    table: "stock_logs",
                    action: "insert",
                    body: { data: newStockLog },
                });
            }
            // UPDATE PRODUK
            else {
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

                result.insert_id = id; // agar konsisten dipakai di bawah
            }

            const stock_log_id = result.insert_id;

            // INSERT / UPDATE COMPONENT ITEMS
            if (Array.isArray(items) && items.length > 0) {
                await APIProvider({
                    endpoint: "bulk-insert",
                    method: "POST",
                    table: "stock_log_items",
                    action: "bulk-insert",
                    body: {
                        updateOnDuplicate: true,
                        rows: items.map((item: any) => ({
                            ...item,
                            stock_log_id,
                            id: null,
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
            console.error(err);
            return { success: false, message: err.message };
        }
    },
};
