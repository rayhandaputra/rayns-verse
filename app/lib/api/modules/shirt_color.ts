import { APIProvider } from "../client";

export const ShirtColorAPI = {
    get: async ({ req }: any) => {
        const { id = "", page = 0, size = 10, search } = req.query || {};

        return APIProvider({
            endpoint: "select",
            method: "POST",
            table: "x_shirt_colors",
            action: "select",
            body: {
                columns: [
                    "id",
                    "name",
                    "image_url",
                    "created_on",
                    "modified_on"
                ],
                // Hanya ambil yang belum dihapus (Soft Delete)
                where: {
                    deleted_on: "null",
                    ...(id ? { id } : {})
                },
                search,
                page,
                size,
                orderBy: ["name", "asc"],
            },
        });
    },

    create: async ({ req }: any) => {
        const { id, name, image_url } = req.body || {};

        // Validasi input
        if (!name) {
            return { success: false, message: "Nama warna wajib diisi" };
        }

        const newColor = {
            // Jika ID tidak dikirim dari frontend, pastikan backend/DB menghandle UUID
            name,
            image_url: image_url || null,
        };

        console.log("INSERT COLOR => ", newColor);

        try {
            await APIProvider({
                endpoint: "insert",
                method: "POST",
                table: "x_shirt_colors",
                action: "insert",
                body: { data: newColor },
            });

            return {
                success: true,
                message: "Warna kaos berhasil ditambahkan",
                data: newColor,
            };
        } catch (err: any) {
            console.error(err);
            return { success: false, message: err.message };
        }
    },

    update: async ({ req }: any) => {
        const { id, deleted, ...fields } = req.body || {};

        if (!id) {
            return { success: false, message: "ID Warna wajib diisi" };
        }

        const updatedData = {
            ...fields,
            // modified_on biasanya otomatis di DB via ON UPDATE, 
            // tapi tidak masalah jika ingin dikirim manual
            ...(deleted === 1 && {
                deleted_on: new Date().toISOString().slice(0, 19).replace('T', ' '),
            }),
        };

        try {
            const result = await APIProvider({
                endpoint: "update",
                method: "POST",
                table: "x_shirt_colors",
                action: "update",
                body: {
                    data: updatedData,
                    where: { id },
                },
            });

            return {
                success: true,
                message: deleted === 1 ? "Warna berhasil dihapus" : "Warna berhasil diperbarui",
                affected: result.affected_rows,
            };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    },
};