import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { useFetcherData, useModal } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";
import ModalSecond from "~/components/shared/modal/ModalSecond";
import { Form } from "react-router";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { formatCurrency } from "~/constants/index";

type Category = "asset" | "liability" | "equity" | "income" | "expense";

export default function AccountCoaPage() {
  const [activeTab, setActiveTab] = useState<Category>("asset");
  const [modal, setModal] = useModal();

  const {
    data: accountList,
    loading: loadingAccountList,
    reload: reloadAccountList,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT")
      .action("get")
      .params({
        page: 0,
        size: 100,
        ...(activeTab && { group_type: activeTab }),
      })
      .build(),
    autoLoad: true,
  });

  const { data: actionData, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setModal((prev) => ({ ...prev, open: false, type: "", data: null }));
        reloadAccountList();
        toast.success(actionData.message);
      } else {
        toast.error(actionData.message || "Gagal memproses data");
      }
    }
  }, [actionData, reloadAccountList, setModal]);

  const categories: { value: Category; label: string }[] = [
    { value: "asset", label: "Aset" },
    { value: "liability", label: "Kewajiban" },
    { value: "equity", label: "Modal" },
    { value: "income", label: "Pendapatan" },
    { value: "expense", label: "Beban" },
  ];

  const handleSaveAccountBank = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitAction({
      action: "save_account_bank",
      id: modal.data?.id,
      code: modal.data?.code,
      name: modal.data?.name,
      ref_account_number: modal.data?.ref_account_number,
      ref_account_holder: modal.data?.ref_account_holder,
    });
  };

  const onDelete = (account: any) => {
    Swal.fire({
      title: "Hapus Akun?",
      text: `Yakin ingin menghapus Akun ${account.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "bg-red-600 text-white",
        cancelButton: "bg-gray-200 text-gray-800",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        submitAction({ action: "delete_account", id: account.id });
      }
    });
  };

  function incrementSequence(current: string) {
    if (!current) return "1-101";
    const parts = current.split("-");
    const lastNumber = parseInt(parts[parts.length - 1]);
    parts[parts.length - 1] = (lastNumber + 1).toString();
    return parts.join("-");
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 italic underline decoration-blue-500/30">
            Chart of Accounts (COA)
          </h2>
          <p className="text-sm text-gray-500">
            Manajemen bagan akun keuangan per kategori.
          </p>
        </div>

        {activeTab === "asset" && (
          <button
            onClick={() =>
              setModal({
                ...modal,
                open: true,
                type: "add_account_bank",
                data: {
                  code: incrementSequence(accountList?.data?.items?.[0]?.code),
                },
              })
            }
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            <span className="text-sm font-semibold">Tambah Rekening Bank</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveTab(cat.value)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === cat.value
                    ? "bg-gray-900 text-white shadow-md shadow-gray-200"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Akun</th>
                <th className="px-6 py-4">Grup Tipe</th>
                <th className="px-6 py-4 text-right">Saldo</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loadingAccountList ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-medium">
                    Memuat daftar akun...
                  </td>
                </tr>
              ) : accountList?.data?.items?.length > 0 ? (
                accountList.data.items.map((account: any) => (
                  <tr
                    key={account.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-blue-600 font-mono">
                      {account.code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{account.name}</div>
                      {+account.is_bank > 0 && (
                        <div className="flex gap-1 mt-1">
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">
                            BANK: {account.ref_account_number}
                          </span>
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold">
                            {account.ref_account_holder}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-[10px] font-bold uppercase">
                        {account.group_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-700">
                      {formatCurrency(account?.balance ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {+account?.is_bank > 0 ? (
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              setModal({
                                ...modal,
                                open: true,
                                type: "add_account_bank",
                                data: account,
                              })
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(account)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-bold italic">System Fixed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                    Tidak ada akun ditemukan untuk kategori ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {modal?.type === "add_account_bank" && (
          <ModalSecond
            open={modal?.open}
            onClose={() => setModal({ ...modal, open: false })}
            title={modal.data?.id ? "Edit Rekening" : "Tambah Rekening Bank"}
          >
            <Form onSubmit={handleSaveAccountBank} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-600 uppercase">Nama Bank (e.g. BCA)</Label>
                <input
                  required
                  placeholder="Contoh: Bank Central Asia (BCA)"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-shadow"
                  value={modal.data?.name || ""}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal.data, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-600 uppercase">Nomor Rekening</Label>
                <input
                  required
                  placeholder="Contoh: 1234567890"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-shadow"
                  value={modal.data?.ref_account_number || ""}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: {
                        ...modal.data,
                        ref_account_number: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-600 uppercase">Nama Pemilik Rekening</Label>
                <input
                  required
                  placeholder="Sesuai yang tertera di buku tabungan"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-shadow"
                  value={modal.data?.ref_account_holder || ""}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: {
                        ...modal.data,
                        ref_account_holder: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModal({ ...modal, open: false })}
                  className="rounded-xl px-6"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-bold"
                >
                  {modal.data?.id ? "Update Rekening" : "Simpan Rekening"}
                </Button>
              </div>
            </Form>
          </ModalSecond>
        )}
      </div>
    </div>
  );
}
