import { generateAccessCode } from "~/constants";
import { APIProvider } from "../client";

export const OrderAssignmentAPI = {
    // Mengambil assignment berdasarkan Order ID
    get: async ({ req }: any) => {
        const {
            pagination = "true",
            page = 0,
            size = 10, order_trx_code, unique_code
        } = req.query || {};

        const result = await APIProvider({
            endpoint: "select",
            method: "POST",
            table: "order_twibbon_assignments",
            action: "select",
            body: {
                columns: [
                    "id", "order_trx_code", "unique_code", "category",
                    "twibbon_template_id", "twibbon_template_name",
                    "public_url_link"
                ],
                where: {
                    ...order_trx_code && { order_trx_code: order_trx_code },
                    ...unique_code && { unique_code: unique_code },
                    deleted_on: "null"
                }
            }
        });

        return {
            total_items: result.total_items || 0,
            items: result.items || [],
            current_page: Number(page),
            total_pages: result.total_pages || 1,
        };
    },
    getByOrder: async ({ req }: any) => {
        const { order_trx_code } = req.query || {};

        const result = await APIProvider({
            endpoint: "select",
            method: "POST",
            table: "order_twibbon_assignments",
            action: "select",
            body: {
                columns: [
                    "id", "order_trx_code", "category",
                    "twibbon_template_id", "twibbon_template_name",
                    "public_url_link"
                ],
                where: {
                    order_trx_code: order_trx_code,
                    deleted_on: "null"
                }
            }
        });
    },

    // Menyimpan/Mengupdate Assignment (Upsert Logic)
    upsert: async ({ req }: any) => {
        const { id, order_trx_code, category, twibbon_template_id, twibbon_template_name } = req.body;

        // Logic public link generator sederhana
        const public_url_link = `kinau.id/public/drive-link/${order_trx_code}/${category === 'idcard' ? 'IdCard' : 'Lanyard'}`;

        const payload = {
            // id: id || crypto.randomUUID(), // Generate ID baru jika tidak ada
            order_trx_code,
            ...!id && { unique_code: generateAccessCode() },
            category,
            twibbon_template_id,
            twibbon_template_name,
            public_url_link
        };

        // Cek apakah sudah ada assignment untuk order & kategori ini?
        // Jika id dikirim, lakukan update. Jika tidak, insert.
        const action = id ? "update" : "insert";
        const bodyPayload = id
            ? { data: payload, where: { id } }
            : { data: payload };

        const result = await APIProvider({
            endpoint: action,
            method: "POST",
            table: "order_twibbon_assignments",
            action: action,
            body: bodyPayload
        });

        return {
            success: true,
            message: "Assignment berhasil disimpan",
            affected: result.affected_rows,
        };
    },

    // Menghapus Assignment
    delete: async ({ req }: any) => {
        const { id } = req.body;
        const result = await APIProvider({
            endpoint: "update",
            method: "POST",
            table: "order_twibbon_assignments",
            action: "update",
            body: {
                data: { deleted_on: new Date().toISOString().slice(0, 19).replace('T', ' ') },
                where: { id }
            }
        });

        return {
            success: true,
            message: "Order berhasil dihapus",
            affected: result.affected_rows,
        };
    }
};