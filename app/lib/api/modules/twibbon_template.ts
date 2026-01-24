import { APIProvider } from "../client";

export const TwibbonTemplateAPI = {
    get: async ({ req }: any) => {
        const { id = "", page = 0, size = 10, search, category } = req.query || {};

        return APIProvider({
            endpoint: "select",
            method: "POST",
            table: "x_twibbon_templates",
            action: "select",
            body: {
                columns: [
                    "id",
                    "name",
                    "category",
                    "base_image",
                    "rules",
                    "style_mode",
                    "created_on",
                    "modified_on"
                ],
                where: {
                    deleted_on: "null",
                    ...(id ? { id } : {}),
                    ...(category ? { category } : {})
                },
                search,
                page,
                size,
                orderBy: ["created_on", "desc"], // Urutan terbaru di atas
            },
        });
    },

    create: async ({ req }: any) => {
        const { id, name, category, base_image, rules, style_mode } = req.body || {};

        if (!name || !category || !base_image) {
            return { success: false, message: "Nama, kategori, dan gambar dasar wajib diisi" };
        }

        const newTemplate = {
            id: id || crypto.randomUUID(), // Generasi UUID jika ID tidak dikirim
            name,
            category,
            base_image,
            // Pastikan rules di-stringify jika tipenya array/object agar sesuai format JSON MySQL
            rules: typeof rules === 'string' ? rules : JSON.stringify(rules || []),
            style_mode: style_mode || 'dynamic',
        };

        try {
            await APIProvider({
                endpoint: "insert",
                method: "POST",
                table: "x_twibbon_templates",
                action: "insert",
                body: { data: newTemplate },
            });

            return {
                success: true,
                message: "Template twibbon berhasil ditambahkan",
                data: newTemplate,
            };
        } catch (err: any) {
            console.error("CREATE TEMPLATE ERROR => ", err);
            return { success: false, message: err.message };
        }
    },

    update: async ({ req }: any) => {
        const { id, deleted, rules, ...fields } = req.body || {};

        if (!id) {
            return { success: false, message: "ID Template wajib diisi" };
        }

        const updatedData: any = {
            ...fields,
            ...(rules && { rules: typeof rules === 'string' ? rules : JSON.stringify(rules) }),
            ...(deleted === 1 && {
                deleted_on: new Date().toISOString().slice(0, 19).replace('T', ' '),
            }),
        };

        try {
            const result = await APIProvider({
                endpoint: "update",
                method: "POST",
                table: "x_twibbon_templates",
                action: "update",
                body: {
                    data: updatedData,
                    where: { id },
                },
            });

            return {
                success: true,
                message: deleted === 1 ? "Template berhasil dihapus" : "Template berhasil diperbarui",
                affected: result.affected_rows,
            };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    },
};