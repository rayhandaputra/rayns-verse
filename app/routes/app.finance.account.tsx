import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  MoreVertical,
  LayoutGrid,
  Trash2,
} from "lucide-react";
import { useFetcherData, useModal } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import ModalSecond from "~/components/modal/ModalSecond";
import { Form, type ActionFunction } from "react-router";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { requireAuth } from "~/lib/session.server";
import { API } from "~/lib/api";
import { toast } from "sonner";
import Swal from "sweetalert2";

// Tipe Data untuk Akun
interface Account {
  code: string;
  name: string;
  type: string;
  balance: string;
}

type Category = "asset" | "liability" | "equity" | "income" | "expense";

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "save_account_bank") {
    const { id, code, name, ref_account_number, ref_account_holder } =
      Object.fromEntries(formData.entries());

    const payload = {
      ...(id
        ? { id }
        : {
            code,
            is_bank: 1,
            group_code: 1,
            group_type: "asset",
            group_name: "Aset Lancar",
          }),
      name,
      ref_account_number,
      ref_account_holder,
    };
    console.log(payload);
    // Only update if valid
    const res = await API.ACCOUNT.create_update({
      session: { user, token },
      req: {
        body: payload,
      },
    });
    return Response.json({
      success: res.success,
      message: res.success ? "Akun diperbarui" : "Gagal memperbarui akun",
    });
  }

  return Response.json({ success: false });
};

const ChartOfAccounts = () => {
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
        // order_number: orderData?.order_number,
        // ...(currentFolderId && { folder_id: currentFolderId }),
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
      setModal({ ...modal, open: false, type: "", data: null });
      reloadAccountList();
      toast.success(actionData.message);
    }
  }, [actionData]);

  const categories: any[] = [
    { value: "asset", label: "Aset" },
    { value: "liability", label: "Kewajiban" },
    { value: "equity", label: "Modal" },
    { value: "income", label: "Pendapatan" },
    { value: "expense", label: "Beban" },
  ];

  const handleSaveAccountBank = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitAction({
      intent: "save_account_bank",
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
        submitAction({ intent: "delete_account", id: account.id });
      }
    });
  };

  function incrementSequence(current: string) {
    let parts = current.split("-"); // Menjadi ["1", "102"]
    let lastNumber = parseInt(parts[parts.length - 1]); // Ambil 102 dan ubah ke Number
    parts[parts.length - 1] = lastNumber + 1; // Tambah 1 menjadi 103
    return parts.join("-"); // Gabungkan kembali menjadi "1-103"
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Daftar Akun (COA)
          </h1>
          <p className="text-sm text-gray-500">
            Kelola bagan akun keuangan perusahaan Anda
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
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
          >
            <Plus size={18} />
            <span>Tambah Rekening Bank</span>
          </button>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search & Tabs Section */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari kode atau nama akun..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div> */}

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveTab(cat.value)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === cat.value
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-200"
                    : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Kode Akun</th>
                <th className="px-6 py-4 font-semibold">Nama Akun</th>
                <th className="px-6 py-4 font-semibold">Tipe Akun</th>
                <th className="px-6 py-4 font-semibold text-right">Saldo</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {accountList?.data?.items?.map((account: any) => (
                <tr
                  key={account.code}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-blue-600">
                    {account.code}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium flex flex-col">
                    {account.name}
                    <div className="inline-flex items-center gap-2">
                      {+account.is_bank > 0 ? (
                        <>
                          <span className="px-2 py-1 bg-blue-100 text-gray-600 rounded text-[0.675rem]">
                            Akun Bank
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-gray-600 rounded text-[0.675rem]">
                            {account.ref_account_number}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-gray-600 rounded text-[0.675rem]">
                            {account.ref_account_holder}
                          </span>
                        </>
                      ) : (
                        ""
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {account.group_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    {account.balance}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3 text-gray-400">
                      {+account?.is_bank > 0 ? (
                        <>
                          <button
                            onClick={() =>
                              setModal({
                                ...modal,
                                open: true,
                                type: "add_account_bank",
                                data: account,
                              })
                            }
                            className="hover:text-blue-600 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(account)}
                            className="text-red-700 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        ""
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        {/* <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Menampilkan {accountList?.data?.items?.length} akun untuk kategori{" "}
            <strong>{activeTab}</strong>
          </p>
        </div> */}

        {modal?.type === "add_account_bank" ? (
          <ModalSecond
            open={modal?.open}
            onClose={() => setModal({ ...modal, open: false })}
            title="Tambah Akun Bank"
          >
            <Form onSubmit={handleSaveAccountBank} className="space-y-3">
              <div className="space-y-1">
                <Label>Nama Bank</Label>
                <input
                  required
                  placeholder="Nama Bank (e.g. BCA)"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={modal.data?.name || ""}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      data: { ...modal.data, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Nomor Rekening</Label>
                <input
                  required
                  placeholder="Nomor Rekening"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
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
              <div className="space-y-1">
                <Label>Atas Nama</Label>
                <input
                  required
                  placeholder="Atas Nama"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
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
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setModal({ ...modal, open: false })}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Simpan
                </Button>
              </div>
            </Form>
          </ModalSecond>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default ChartOfAccounts;
