
import { useState, useEffect, useRef } from "react";
import { useActionData, useSubmit } from "react-router";
import { toast } from "sonner";
import { useFetcherData, useModal } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";
import { uploadFile } from "~/utils/utils";

export function useOrderHistoryLogic() {
  const actionData = useActionData() as any;
  const [modal, setModal] = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submit = useSubmit();

  const { data: productsData } = useFetcherData({
    endpoint: nexus()
      .module("PRODUCT")
      .action("get")
      .params({ page: 0, size: 100, pagination: "true" })
      .build(),
  });

  const { data: getOrdersData, reload } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        status: "done",
        page: 0,
        size: 200,
        sort: "order_date:desc",
        pagination: "true",
      })
      .build(),
  });

  const orders = getOrdersData?.data?.items || [];
  const products = productsData?.data?.items || [];

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
      setModal({ ...modal, open: false, type: "" });
      reload();
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = await uploadFile(file);
      setModal({
        ...modal,
        data: {
          ...(modal?.data ?? {}),
          images: [...(modal?.data?.images || []), url],
        },
      });
    }
  };

  const removeImage = (index: number) => {
    setModal({
      ...modal,
      data: {
        ...modal.data,
        images: modal.data.images.filter((_: any, i: number) => i !== index),
      },
    });
  };

  return {
    modal,
    setModal,
    searchTerm,
    setSearchTerm,
    orders,
    products,
    fileInputRef,
    handleImageUpload,
    removeImage,
    reload,
    submit,
  };
}
