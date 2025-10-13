import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const OrderUploadAPI = {
  get_folder: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      order_number,
    } = req.query || {};

    const where: any = {
      deleted_on: "null",
    };

    // Filter by order_number
    if (order_number) where.order_number = order_number;

    try {
      const result = await callApi({
        action: "select",
        table: "order_upload_folders",
        columns: [
          "id",
          "order_number",
          "folder_name",
          "created_by",
          "created_on",
        ],
        where,
        search: search
          ? {
              logic: "or",
              fields: ["folder_name", "order_number"],
              keyword: search,
            }
          : undefined,
        pagination: pagination === "true",
        page: +page || 0,
        size: +size || 10,
        order_by: { id: "asc" },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ Error fetching order upload folders:", err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },
  get_file: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      order_number,
      folder_id,
    } = req.query || {};

    const where: any = {
      deleted_on: "null",
    };

    if (order_number) where.order_number = order_number;
    if (folder_id) where.folder_id = folder_id;

    try {
      const result = await callApi({
        action: "select",
        table: "order_upload_files",
        columns: [
          "id",
          "code",
          "folder_id",
          "order_number",
          "file_type",
          "file_path",
          "uploaded_by",
          "created_on",
        ],
        where,
        search: search
          ? {
              logic: "or",
              fields: ["file_type", "file_path", "order_number"],
              keyword: search,
            }
          : undefined,
        pagination: pagination === "true",
        page: +page || 0,
        size: +size || 10,
        order_by: { id: "asc" },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ Error fetching order upload files:", err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },
};
