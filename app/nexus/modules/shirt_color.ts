import { APIProvider } from "..";

export const ShirtColorAPI = {
    get: async ({ session, req }: any) => {
        const { id = "", page = 0, size = 10, search } = req.query || {};

        return APIProvider(session)
            .Endpoint("POST", "select", "x_shirt_colors")
            .Data({
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
            })
            .Result();
    },

    create: async ({ session, req }: any) => {
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

        try {
            await APIProvider(session)
                .Endpoint("POST", "insert", "x_shirt_colors")
                .Data({ data: newColor })
                .Result();

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

    update: async ({ session, req }: any) => {
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
            const result = await APIProvider(session)
                .Endpoint("POST", "update", "x_shirt_colors")
                .Data({
                    data: updatedData,
                    where: { id },
                })
                .Result();

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