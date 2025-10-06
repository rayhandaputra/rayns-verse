import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const AssetAPI = {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(CONFIG.apiBaseUrl.server_api_url, {
        method: "POST",
        headers: {
          Authorization: "Bearer REPLACE_WITH_STRONG_KEY",
        },
        body: formData,
      });

      const data = await res.json();
      return data;
      // data.url => link publik gambar
    },
  }