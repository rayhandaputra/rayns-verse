import Swal from "sweetalert2";

interface ConfirmDialogProps {
  title?: string;
  text?: string;
  icon?: "warning" | "info" | "error" | "success" | "question";
  confirmText?: string;
  cancelText?: string;
}

export async function ConfirmDialog({
  title = "Konfirmasi",
  text = "Apakah Anda yakin?",
  icon = "warning",
  confirmText = "Ya",
  cancelText = "Batal",
}: ConfirmDialogProps) {
  return await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    customClass: {
      confirmButton:
        "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg focus:outline-none",
      cancelButton:
        "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2",
      popup: "rounded-2xl shadow-lg",
      title: "text-lg font-semibold text-gray-800",
      htmlContainer: "text-gray-600",
    },
    buttonsStyling: false,
  });
}
