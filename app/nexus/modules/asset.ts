import { APIProvider } from "..";

export const AssetAPI = {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return APIProvider(null)
        .Endpoint("POST", "upload", "")
        .Data(formData, true)
        .Result();
    },
  }