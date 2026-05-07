
import { useEffect } from "react";
import { useActionData, useFetcher, useSearchParams } from "react-router";
import moment from "moment";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useFetcherData, useModal } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";

export function useInstitutionLogic() {
  const actionData = useActionData() as any;
  const [modal, setModal] = useModal();
  const fetcher = useFetcher();

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 0;
  const size = Number(searchParams.get("size")) || 10;
  const search = searchParams.get("search") || "";

  const { data: institution, reload: reloadInstitution, loading: isLoading } = useFetcherData({
    endpoint: nexus()
      .module("INSTITUTION")
      .action("get")
      .params({
        pagination: "true",
        page,
        size,
        search,
      })
      .build(),
  });

  const {
    data: fetcherDataAction,
    load: submitAction,
    loading: isSubmitting,
  } = useFetcherData({
    endpoint: "/app/master/institution",
    method: "POST",
    autoLoad: false,
  }) as any;

  const handleDelete = async (data: any) => {
    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus instansi ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton: "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg",
        cancelButton: "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2 mr-2",
        popup: "rounded-2xl shadow-lg",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      fetcher.submit(
        { id: data?.id, deleted_on: moment().format("YYYY-MM-DD HH:mm:ss") },
        { method: "delete", action: "/app/master/institution" }
      );
      toast.success("Berhasil menghapus instansi");
      reloadInstitution();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    submitAction(payload);
  };

  useEffect(() => {
    if (fetcherDataAction) {
      if (fetcherDataAction.success) {
        setModal({ ...modal, open: false });
        toast.success("Berhasil", { description: fetcherDataAction.message });
        reloadInstitution();
      } else {
        toast.error("Gagal", { description: fetcherDataAction.error_message });
      }
    }
  }, [fetcherDataAction]);

  useEffect(() => {
    if (actionData?.success) reloadInstitution();
  }, [actionData]);

  const table = {
    ...institution?.data,
    page,
    size,
    search,
  };

  return {
    modal,
    setModal,
    table,
    isSubmitting,
    handleDelete,
    handleSubmit,
    reloadInstitution,
    isLoading,
    searchParams,
    setSearchParams,
  };
}
