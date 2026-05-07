import { APIProvider } from "../client";

export const AssetAPI = {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return APIProvider({
        endpoint: 'upload',
        method: 'POST',
        body: formData,
        formData: true
      })
    },
  }