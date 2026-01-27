// app/routes/app.finance.tsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import type { LoaderFunction, ActionFunction } from "react-router";
import { Form, useFetcher } from "react-router";
import { formatCurrency } from "../constants";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Monitor,
  Tag,
  CreditCard,
  Trash2,
  Edit2,
  Image,
  X,
  Download,
  Filter,
  PieChart as PieIcon,
  BarChart3,
  Trash2Icon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import AssetInventoryPage from "./app.asset.inventory";
import AccountCoaPage from "./app.finance.account";
import { requireAuth } from "~/lib/session.server";
import { API } from "~/lib/api";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus, NexusHelpers } from "~/lib/nexus-client";
import { toast } from "sonner";
import { APIProvider } from "~/lib/api/client";
import { safeParseArray, safeParseObject, uploadFile } from "~/lib/utils";
import { useModal } from "~/hooks";
import { Button } from "~/components/ui/button";
import { TablePagination } from "~/components/ui/data-table";
import Swal from "sweetalert2";

interface Transaction {
  id: string;
  date: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  description: string;
  bank_id?: string;
  proof_image?: string;
  is_auto?: boolean;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  holder_name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  productionCost?: number;
}

interface Asset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  value: number;
  condition: string;
  location: string;
  image?: string;
}

interface FinancePageProps {
  products: Product[];
  assets: Asset[];
  onUpdateProducts: (data: Product[]) => void;
  onUpdateAssets: (data: Asset[]) => void;
}

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({ initialized: true });
};

// ============================================
// ACTION FUNCTION
// ============================================

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "delete_transaction") {
      const { id, journal_code } = Object.fromEntries(formData.entries());

      const payload = {
        deleted_on: new Date().toISOString(),
      };

      // Only update if valid
      if (!journal_code) {
        const res = await API.TRANSACTION.update({
          session: { user, token },
          req: {
            body: { id, ...payload },
          },
        });
        return Response.json({
          success: res.success,
          message: res.success
            ? "Transaksi berhasil dihapus"
            : "Gagal menghapus transaksi",
        });
      } else {
        const res = await APIProvider({
          endpoint: "update",
          method: "POST",
          table: "account_ledger_mutations",
          action: "update",
          body: {
            data: payload,
            where: { journal_code },
          },
        });

        return Response.json({
          success: res.affected_rows > 0,
          message:
            res.affected_rows > 0
              ? "Transaksi berhasil dihapus"
              : "Gagal menghapus transaksi",
        });
      }
    }
    if (intent === "update_hpp_product") {
      const { id, hpp_price } = Object.fromEntries(formData.entries());

      const payload = {
        id,
        hpp_price,
      };

      // Only update if valid
      const res = await API.PRODUCT.update({
        session: { user, token },
        req: {
          body: payload,
        },
      });
      return Response.json({
        success: res.success,
        message: res.success
          ? "HPP berhasil diperbarui"
          : "Gagal memperbarui HPP",
      });
    }
    if (intent === "delete_account") {
      const { id } = Object.fromEntries(formData.entries());

      const payload = {
        id,
        deleted_on: new Date().toISOString(),
      };
      // Only update if valid
      const res = await API.ACCOUNT.create_update({
        session: { user, token },
        req: {
          body: payload,
        },
      });
      return Response.json({
        success: res.success,
        message: res.success ? "Akun dihapus" : "Gagal menghapus akun",
      });
    }
    if (intent === "save_account_bank") {
      const { id, code, name, ref_account_number, ref_account_holder } =
        Object.fromEntries(formData.entries());

      const payload = {
        ...(+id > 0
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

    if (intent === "create_transaction") {
      const type = formData.get("type") as string;
      const category = formData.get("category") as string;
      const amount = Number(formData.get("amount"));
      const date = formData.get("date") as string;
      const description = formData.get("description") as string;
      const bank_id = formData.get("bank_id") as string;
      const proof_image = formData.get("proof_image") as string;

      if (!type || !category || !amount) {
        return Response.json({
          success: false,
          message: "Missing required fields",
        });
      }

      let accountBank = null;
      if (bank_id !== "cash") {
        accountBank = await API.ACCOUNT.get({
          session: { user, token },
          req: {
            query: {
              id: bank_id,
            },
          },
        });
      }
      await APIProvider({
        endpoint: "bulk-insert",
        method: "POST",
        table: "account_ledger_mutations",
        action: "bulk-insert",
        body: {
          rows: [
            {
              account_code: type === "Income" ? "4-101" : "5-101",
              account_name:
                type === "Income" ? "Pendapatan Usaha" : "Beban Operasional",
              credit: type === "Income" ? amount : 0,
              debit: type === "Expense" ? amount : 0,
              category,
              notes: description,
              created_on: date || new Date().toISOString(),
              receipt_url: proof_image,
            },
            {
              account_code: !accountBank
                ? "1-101"
                : accountBank?.items?.[0]?.code,
              account_name: !accountBank
                ? "Kas Utama (Cash on Hand)"
                : accountBank?.items?.[0]?.name,
              credit: type === "Expense" ? amount : 0,
              debit: type === "Income" ? amount : 0,
              category,
              notes: description,
              created_on: date || new Date().toISOString(),
              receipt_url: proof_image,
            },
          ],
          updateOnDuplicate: true,
        },
      });

      // Auto-create asset if category is "Pembelian Aset"
      // if (category === "Pembelian Aset" && type === "Expense") {
      //   await API.INVENTORY_ASSET.create({
      //     session: { user, token },
      //     req: {
      //       body: {
      //         name: description || "Aset Baru",
      //         category: "Baru",
      //         purchase_date: date || new Date().toISOString().split("T")[0],
      //         value: amount,
      //         condition: "Baik",
      //         location: "Kantor",
      //         image: proof_image || null,
      //       },
      //     },
      //   });
      // }

      return Response.json({
        success: true,
        message: "Transaction created successfully",
      });
    }

    // if (intent === "delete_transaction") {
    //   const id = formData.get("id") as string;
    //   if (!id) {
    //     return Response.json({
    //       success: false,
    //       message: "Transaction ID required",
    //     });
    //   }

    //   //   await API.TRANSACTION.delete({
    //   //     session: { user, token },
    //   //     req: { query: { id } },
    //   //   });

    //   return Response.json({
    //     success: true,
    //     message: "Transaction deleted successfully",
    //   });
    // }

    if (intent === "create_bank") {
      const bank_name = formData.get("bank_name") as string;
      const account_number = formData.get("account_number") as string;
      const holder_name = formData.get("holder_name") as string;

      if (!bank_name || !account_number || !holder_name) {
        return Response.json({
          success: false,
          message: "All bank fields are required",
        });
      }

      const result = await APIProvider({
        endpoint: "insert",
        method: "POST",
        table: "bank_accounts",
        body: { bank_name, account_number, holder_name },
      });
      //   await API.BANK_ACCOUNT.create({
      //     session: { user, token },
      //     req: {
      //       body: { bank_name, account_number, holder_name },
      //     },
      //   });

      return Response.json({
        success: true,
        message: "Bank account created successfully",
      });
    }

    if (intent === "update_bank") {
      const id = formData.get("id") as string;
      const bank_name = formData.get("bank_name") as string;
      const account_number = formData.get("account_number") as string;
      const holder_name = formData.get("holder_name") as string;

      if (!id) {
        return Response.json({ success: false, message: "Bank ID required" });
      }

      await API.BANK_ACCOUNT.update({
        session: { user, token },
        req: {
          query: { id },
          body: { bank_name, account_number, holder_name },
        },
      });

      return Response.json({
        success: true,
        message: "Bank account updated successfully",
      });
    }

    if (intent === "delete_bank") {
      const id = formData.get("id") as string;
      if (!id) {
        return Response.json({ success: false, message: "Bank ID required" });
      }

      await API.BANK_ACCOUNT.delete({
        session: { user, token },
        req: { query: { id } },
      });

      return Response.json({
        success: true,
        message: "Bank account deleted successfully",
      });
    }

    return Response.json({ success: false, message: "Unknown intent" });
  } catch (error: any) {
    console.error("Finance action error:", error);
    return Response.json({
      success: false,
      message: error.message || "An error occurred",
    });
  }
};

// ============================================
// COMPONENT
// ============================================

const FinancePage: React.FC<FinancePageProps> = ({
  assets,
  onUpdateAssets,
}) => {
  const [activeTab, setActiveTab] = useState<
    "report" | "product_cost" | "assets" | "banks" | "accounts"
  >("report");

  // State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txForm, setTxForm] = useState<Partial<Transaction>>({
    type: "Expense",
    date: new Date().toISOString().split("T")[0],
  });
  const [proofImage, setProofImage] = useState<string>("");
  const proofInputRef = useRef<HTMLInputElement>(null);

  // Filters & Sorting
  const [filterYear, setFilterYear] = useState<number>(
    new Date().getFullYear()
  );
  const [sortOption, setSortOption] = useState<
    "date_desc" | "date_asc" | "amount_desc" | "amount_asc"
  >("date_desc");

  // Bank form state
  const [bankForm, setBankForm] = useState<Partial<BankAccount>>({});
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  const [modal, setModal] = useModal();
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);

  // Action form for creating/updating
  const actionFetcher = useFetcher();

  // Fetch transactions with filters
  // const {
  //   data: transactionsData,
  //   loading: transactionsLoading,
  //   reload: reloadTransactions,
  // } = useFetcherData<any>({
  //   endpoint: NexusHelpers.transactions.list({
  //     year: filterYear,
  //     sort_by: sortOption.includes("amount") ? "amount" : "date",
  //     sort_order: sortOption.includes("desc") ? "desc" : "asc",
  //     pagination: "true",
  //     size: "100",
  //   }),
  // });

  const {
    data: productCost,
    loading: loadingProductCost,
    reload: reloadProductCost,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("PRODUCT")
      .action("get")
      .params({
        page: 0,
        size: 100,
        pagination: "true",
      })
      .build(),
    autoLoad: true,
  });

  const [productCostData, setProductCostData] = useState<any>(
    productCost?.data?.items
  );

  useEffect(() => {
    setProductCostData(productCost?.data?.items);
  }, [productCost]);

  // Fetch transactions with filters
  const {
    data: incomeBalance,
    loading: loadingBalance,
    reload: reloadBalance,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT")
      .action("get")
      .params({
        page: 0,
        size: 1,
        id: 4,
        ...(filterYear && {
          year: filterYear,
        }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: expensesBalance,
    loading: loadingBalanceExpenses,
    reload: reloadBalanceExpenses,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT")
      .action("get")
      .params({
        page: 0,
        size: 1,
        id: 5,
        ...(filterYear && {
          year: filterYear,
        }),
      })
      .build(),
    autoLoad: true,
  });
  const {
    data: transactionBalance,
    loading: loadingTrx,
    reload: reloadTrx,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT_MUTATION")
      .action("get")
      .params({
        page: page ? page - 1 : 0,
        size: 10,
        pagination: "true",
        // account_code: "1-103,4-101,5-101",
        account_code: "4-101,5-101",
        ...(filterYear && {
          year: filterYear,
        }),
        ...(sortBy && {
          sort: sortBy,
        }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: financeReport,
    loading: loadingFinanceReport,
    reload: reloadFinanceReport,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT_MUTATION")
      .action("getFinanceReport")
      .params({
        page: 0,
        size: 100,
        ...(filterYear && {
          year: filterYear,
        }),
      })
      .build(),
    autoLoad: true,
  });
  const {
    data: expenseComposition,
    loading: loadingExpenseComposition,
    reload: reloadExpenseComposition,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT_MUTATION")
      .action("getExpenseComposition")
      .params({
        page: 0,
        size: 100,
        ...(filterYear && {
          year: filterYear,
        }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: accounts,
    loading: loadingAccounts,
    reload: reloadAccounts,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT")
      .action("get")
      .params({
        page: 0,
        size: 10,
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: bankList,
    loading: loadingBank,
    reload: reloadBank,
  } = useFetcherData({
    endpoint: nexus()
      .module("ACCOUNT")
      .action("get")
      .params({
        size: 100,
        pagination: "true",
        is_bank: "1",
      })
      .build(),
  });

  const balance = {
    income: incomeBalance?.data?.items?.[0]?.balance,
    expense: expensesBalance?.data?.items?.[0]?.balance,
  };

  // Fetch bank accounts
  const { data: banksData, reload: reloadBanks } = useFetcherData<any>({
    endpoint: NexusHelpers.bankAccounts.list({ pagination: "false" } as any),
  });

  // Fetch bank balances
  const { data: balancesData } = useFetcherData<any>({
    endpoint: NexusHelpers.bankAccounts.balances(),
  });

  // Extract data
  // const transactions: Transaction[] = transactionsData?.data?.data || [];
  const banks: BankAccount[] = banksData?.data?.data || [];
  const bankBalances = balancesData?.data?.balances || {};

  // Handle form submission results
  React.useEffect(() => {
    if (actionFetcher.data) {
      const result = actionFetcher.data as any;
      if (result.success) {
        toast.success(result.message);
        reloadTransactions();
        reloadBanks();
        setIsTxModalOpen(false);
        setTxForm({
          type: "Expense",
          date: new Date().toISOString().split("T")[0],
        });
        setProofImage("");
        setBankForm({});
        setEditingBankId(null);
      } else {
        toast.error(result.message);
      }
    }
  }, [actionFetcher.data]);

  // Export logic
  const handleExportExcel = () => {
    const headers = [
      "Waktu",
      "Tipe",
      "Kategori",
      "Deskripsi",
      "Rekening",
      "Bukti",
      "Jumlah",
    ];
    const rows = transactionBalance?.data?.items?.map((t) => [
      t.created_on,
      t.account_name,
      t.notes,
      `"${t.account_name.replace(/"/g, '""')}"`,
      t.bank_id || "",
      t.receipt_url || "",
      t.amount || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows?.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Keuangan_Kinau_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Transaction handlers
  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("intent", "create_transaction");
    formData.append("type", txForm.type || "Expense");
    formData.append("category", txForm.category || "");
    formData.append("amount", String(txForm.amount || 0));
    formData.append(
      "date",
      txForm.date || new Date().toISOString().split("T")[0]
    );
    formData.append("description", txForm.description || "");
    formData.append("bank_id", txForm.bank_id || "");
    formData.append("proof_image", proofImage);

    actionFetcher.submit(formData, { method: "POST" });
  };

  // Bank handlers
  const handleSaveBank = () => {
    if (
      !bankForm.bank_name ||
      !bankForm.account_number ||
      !bankForm.holder_name
    )
      return;

    const formData = new FormData();
    formData.append("intent", editingBankId ? "update_bank" : "create_bank");
    if (editingBankId) formData.append("id", editingBankId);
    formData.append("bank_name", bankForm.bank_name);
    formData.append("account_number", bankForm.account_number);
    formData.append("holder_name", bankForm.holder_name);

    actionFetcher.submit(formData, { method: "POST" });
  };

  const handleEditBank = (b: BankAccount) => {
    setBankForm(b);
    setEditingBankId(b.id);
  };

  const handleDeleteBank = (id: string) => {
    if (confirm("Hapus rekening ini?")) {
      const formData = new FormData();
      formData.append("intent", "delete_bank");
      formData.append("id", id);
      actionFetcher.submit(formData, { method: "POST" });
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = await uploadFile(e.target.files[0]);
      setProofImage(url);
      // const reader = new FileReader();
      // reader.onloadend = () => {
      //   setProofImage(reader.result as string);
      // };
      // reader.readAsDataURL(e.target.files[0]);
    }
  };

  const { data: actionData, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  const handleUpdateHpp = (id: string, val: number) => {
    submitAction({ intent: "update_hpp_product", id, hpp_price: val });
  };

  useEffect(() => {
    if (actionData?.success) {
      reloadProductCost();
      reloadTrx();
      toast.success(
        actionData?.message || actionData?.error_message || "Berhasil"
      );
    }
  }, [actionData]);

  const formatFullDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  const safeDivide = (a?: number, b?: number) => {
    if (!a || !b || b === 0) return 0;
    return a / b;
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden flex-wrap">
        <button
          onClick={() => setActiveTab("report")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "report" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <Wallet size={16} className="inline mr-2" /> Laporan Keuangan
        </button>
        <button
          onClick={() => setActiveTab("product_cost")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "product_cost" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <Tag size={16} className="inline mr-2" /> Modal Produk (HPP)
        </button>
        <button
          onClick={() => setActiveTab("assets")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "assets" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <Monitor size={16} className="inline mr-2" /> Aset Perusahaan
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "accounts" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <CreditCard size={16} className="inline mr-2" /> Daftar Akun
        </button>
        {/* <button
          onClick={() => setActiveTab("banks")}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === "banks" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <CreditCard size={16} className="inline mr-2" /> Rekening Bank
        </button> */}
      </div>

      {activeTab === "report" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Control */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-700">
                Tahun Laporan:
              </span>
              <select
                className="border border-gray-300 rounded-lg p-1.5 text-sm font-medium"
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
              >
                {/* {availableYears?.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))} */}
                {Array.from(
                  { length: new Date().getFullYear() - 2017 + 1 },
                  (_, i) => (new Date().getFullYear() - i).toString()
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
            >
              <Download size={16} /> Export Excel (CSV)
            </button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-500" /> Total
                Pemasukan {filterYear}
              </h3>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(balance?.income || 0)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <TrendingDown size={16} className="text-red-500" /> Total
                Pengeluaran {filterYear}
              </h3>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(balance?.expense || 0)}
              </div>
            </div>
            <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white">
              <h3 className="text-sm font-medium text-gray-400 mb-1">
                Laba Bersih {filterYear}
              </h3>
              <div className="text-3xl font-bold">
                {formatCurrency(
                  (balance?.income || 0) - (balance?.expense || 0)
                )}
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={16} /> Pengeluaran & Pemasukan
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financeReport?.data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      fontSize={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      fontSize={10}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v.toLocaleString("id-ID")}
                    />
                    <Tooltip
                      formatter={(v: any) => formatCurrency(Number(v))}
                    />
                    <Legend />
                    <Bar
                      dataKey="income"
                      name="Masuk"
                      fill="#22c55e"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      name="Keluar"
                      fill="#ef4444"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PieIcon size={16} /> Komposisi Pengeluaran
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseComposition?.data?.items?.map((v: any) => ({
                        name: v.name,
                        value: +v.value,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        percent,
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius =
                          innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return percent > 0.05
                          ? `${(percent * 100).toFixed(0)}%`
                          : "";
                      }}
                      labelLine={false}
                    >
                      {expenseComposition?.data?.items?.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any) => formatCurrency(Number(v))}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconSize={10}
                      wrapperStyle={{ fontSize: "10px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
              <h3 className="font-bold text-gray-800">
                Riwayat Transaksi {filterYear}
              </h3>
              <div className="flex gap-2">
                <select
                  className="border border-gray-300 rounded-lg p-2 text-sm"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                >
                  <option value="date_desc">Terbaru</option>
                  <option value="date_asc">Terlama</option>
                  <option value="amount_desc">Nominal Terbesar</option>
                  <option value="amount_asc">Nominal Terkecil</option>
                </select>
                <button
                  onClick={() => setIsTxModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} /> Catat Transaksi
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-6 py-3">Waktu</th>
                    <th className="px-6 py-3">Kategori</th>
                    <th className="px-6 py-3">No. Transaksi</th>
                    <th className="px-6 py-3">Instansi/Pemesan</th>
                    <th className="px-6 py-3">Produk</th>
                    <th className="px-6 py-3">Rekening</th>
                    <th className="px-6 py-3">Bukti</th>
                    <th className="px-6 py-3 text-right">Nominal</th>
                    <th className="px-6 py-3">Aksi</th>
                    {/* <th className="px-6 py-3 text-right">Debit</th>
                    <th className="px-6 py-3 text-right">Kredit</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingTrx ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-6 text-gray-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : transactionBalance?.data?.items?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-6 text-gray-400"
                      >
                        Belum ada transaksi untuk tahun {filterYear}.
                      </td>
                    </tr>
                  ) : (
                    transactionBalance?.data?.items?.map((t) => {
                      const order: any = safeParseArray(t.orders)?.[0] || {}
                      return (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-gray-500 whitespace-nowrap text-xs">
                            {formatFullDateTime(t.created_on)}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${t.group_type === "income" || t.group_type === "asset" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {/* {t.account_name} */}
                              {order?.payment_status === "down_payment" ? "DP" : order?.payment_status === "paid" ? "PELUNASAN" : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-700 max-w-xs truncate font-medium">
                            {/* {t.notes || "-"} */}
                            {t.trx_code || "-"}
                          </td>
                          <td className="px-6 py-3 text-gray-700 max-w-xs truncate font-medium">
                            <p className="text-xs font-bold">
                              {+order?.is_kkn === 1 ? order?.kkn_type?.toLowerCase() === "ppm" ? `Kelompok ${safeParseObject(order?.kkn_detail)?.value}` : `Desa ${safeParseObject(order?.kkn_detail)?.value}` : order?.institution_name || "-"}
                            </p>
                            <p className="text-[0.675rem] text-gray-700">
                              {order?.pic_name || "-"}
                            </p>
                          </td>
                          <td className="px-6 py-3 text-gray-700 max-w-xs truncate font-medium">
                            <ul className="list-disc space-y-0.5">
                              {safeParseArray(t.order_items)?.map(
                                (v: any, i: number) => (
                                  <li
                                    key={i}
                                    className="flex items-center gap-1 text-xs text-gray-600"
                                  >
                                    <span className="truncate">
                                      {v.product_name}
                                    </span>
                                    <span className="text-gray-400">:</span>
                                    <span className="font-medium text-gray-800">
                                      {v.qty}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </td>
                          <td className="px-6 py-3 text-gray-500 text-xs">
                            {/* {t.bank_id || "-"} */}
                            {/* {t.account_name || "-"} */}
                            {safeParseArray(t.account_ledger_mutations)?.filter(
                              (v: any) => v?.account_code !== t.account_code
                            )?.[0]?.account_name ||
                              t.account_name ||
                              "-"}
                          </td>
                          <td className="px-6 py-3 text-gray-500 text-xs">
                            {/* {t.bank_id || "-"} */}
                            {t.receipt_url && t.receipt_url !== "undefined" ? (
                              <Button
                                className="text-blue-600"
                                onClick={() =>
                                  setModal({
                                    open: true,
                                    type: "zoom_receipt_url",
                                    data: {
                                      receipt_url: t.receipt_url,
                                    },
                                  })
                                }
                              >
                                Lihat
                              </Button>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td
                            className={`px-6 py-3 text-right font-bold whitespace-nowrap ${t.group_type === "income" || t.group_type === "asset" ? "text-green-600" : "text-red-600"}`}
                          >
                            {/* {t.type === "Income" ? "+" : "-"}{" "} */}
                            {formatCurrency(
                              ["income", "expense"].includes(t.group_type)
                                ? t.credit - t.debit
                                : t.debit - t.credit
                            )}
                          </td>
                          {/* <td
                          className={`px-6 py-3 text-right font-bold whitespace-nowrap ${t.type === "Income" ? "text-green-600" : "text-red-600"}`}
                        >
                          {formatCurrency(t.debit)}
                        </td> */}
                          <td className={`px-6 py-3`}>
                            <Button
                              onClick={() => {
                                Swal.fire({
                                  title: "Hapus Transaksi?",
                                  text: `Yakin ingin menghapus Transaksi ${t.account_name}?`,
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
                                    submitAction({
                                      intent: "delete_transaction",
                                      id: t.id,
                                      journal_code: t.journal_code,
                                    });
                                  }
                                });
                              }}
                            >
                              <Trash2Icon className="w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={page || transactionBalance?.data?.current_page || 1}
              totalPages={transactionBalance?.data?.total_pages || 0}
              onPageChange={(page) => {
                setPage(page);
              }}
              className="mt-auto"
            />
          </div>
        </div>
      )}

      {modal?.type === "zoom_receipt_url" && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setModal({ ...modal, open: false, type: "" })}
        >
          <button
            onClick={() => setModal({ ...modal, open: false, type: "" })}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
          >
            <X size={32} />
          </button>
          <img
            src={modal?.data?.receipt_url}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          />
        </div>
      )}

      {/* HPP MANUAL TAB */}
      {activeTab === "product_cost" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-200 bg-yellow-50">
            <h3 className="font-bold text-gray-800 text-lg">
              HPP / Modal Produk
            </h3>
            <p className="text-sm text-gray-600">
              Input manual modal per pcs untuk setiap produk.
            </p>
          </div>

          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-3">Nama Produk</th>
                <th className="px-6 py-3 text-right">Total Pcs Terjual</th>
                <th className="px-6 py-3 text-right">Total HPP</th>
                <th className="px-6 py-3 text-right">
                  Pendapatan Bersih (Total)
                </th>
                <th className="px-6 py-3 text-right">
                  Pendapatan Bersih (Per Pcs)
                </th>
                <th className="px-6 py-3">HPP (Per Pcs)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {productCostData?.map((p, i) => {
                const totalSold = p?.total_sold_items ?? 0;
                const netIncome = p?.net_income ?? 0;

                const netIncomePerPcs = safeDivide(netIncome, totalSold);

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    {/* Nama */}
                    <td className="px-6 py-3 font-medium">{p.name}</td>

                    {/* Total pcs */}
                    <td className="px-6 py-3 text-right text-gray-500">
                      {totalSold}
                    </td>

                    {/* Total HPP */}
                    <td className="px-6 py-3 text-right text-gray-500">
                      {formatCurrency(p?.hpp_income ?? 0)}
                    </td>

                    {/* Net Income Total */}
                    <td className="px-6 py-3 text-right font-semibold text-gray-700">
                      {formatCurrency(netIncome)}
                    </td>

                    {/* Net Income Per Pcs */}
                    <td className="px-6 py-3 text-right text-gray-600">
                      {formatCurrency(netIncomePerPcs)}
                    </td>

                    {/* HPP per pcs (editable) */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Rp</span>
                        <input
                          type="number"
                          className="border border-gray-300 rounded px-2 py-1 w-32 font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
                          value={p.hpp_price ?? 0}
                          onChange={(e) => {
                            const tmp = [...productCostData];
                            tmp[i] = {
                              ...tmp[i],
                              hpp_price: Number(e.target.value),
                            };
                            setProductCostData(tmp);
                          }}
                          onBlur={(e) => {
                            handleUpdateHpp(p.id, Number(e.target.value));
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "assets" && (
        <AssetInventoryPage assets={assets} onUpdateAssets={onUpdateAssets} />
      )}

      {activeTab === "accounts" && <AccountCoaPage />}

      {activeTab === "banks" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">
              {editingBankId ? "Edit Rekening" : "Tambah Rekening Baru"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder="Nama Bank (e.g. BCA)"
                className="border border-gray-300 rounded-lg p-2 text-sm"
                value={bankForm.bank_name || ""}
                onChange={(e) =>
                  setBankForm({ ...bankForm, bank_name: e.target.value })
                }
              />
              <input
                placeholder="Nomor Rekening"
                className="border border-gray-300 rounded-lg p-2 text-sm"
                value={bankForm.account_number || ""}
                onChange={(e) =>
                  setBankForm({ ...bankForm, account_number: e.target.value })
                }
              />
              <input
                placeholder="Atas Nama"
                className="border border-gray-300 rounded-lg p-2 text-sm"
                value={bankForm.holder_name || ""}
                onChange={(e) =>
                  setBankForm({ ...bankForm, holder_name: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2 mt-4">
              {editingBankId && (
                <button
                  onClick={() => {
                    setEditingBankId(null);
                    setBankForm({});
                  }}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
                >
                  Batal
                </button>
              )}
              <button
                onClick={handleSaveBank}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Simpan Rekening
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3">Nama Bank</th>
                  <th className="px-6 py-3">No. Rekening</th>
                  <th className="px-6 py-3">Atas Nama</th>
                  <th className="px-6 py-3 text-right">Sisa Saldo</th>
                  <th className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts?.data?.items?.map((b) => {
                  const key = `${b.bank_name} - ${b.ref_account_holder}`;
                  const balance = bankBalances[key] || 0;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-bold text-gray-800">
                        {b.account_name}
                      </td>
                      <td className="px-6 py-3 font-mono text-gray-600">
                        {b.ref_account_number}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {b.ref_account_holder}
                      </td>
                      <td
                        className={`px-6 py-3 text-right font-bold ${balance < 0 ? "text-red-600" : "text-blue-600"}`}
                      >
                        {formatCurrency(balance)}
                      </td>
                      <td className="px-6 py-3 flex justify-center gap-2">
                        <button
                          onClick={() => handleEditBank(b)}
                          className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBank(b.id)}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={3} className="px-6 py-3 text-right">
                    Saldo Tunai / Cash
                  </td>
                  <td
                    className={`px-6 py-3 text-right font-bold ${bankBalances["Tunai"] < 0 ? "text-red-600" : "text-blue-600"}`}
                  >
                    {formatCurrency(bankBalances["Tunai"] || 0)}
                  </td>
                  <td></td>
                </tr>
                {banks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400">
                      Belum ada data rekening.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Transaction */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Catat Transaksi</h3>
            <form onSubmit={handleAddTx} className="space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                {["Income", "Expense"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: t as any })}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${txForm.type === t ? (t === "Income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") : "text-gray-500"}`}
                  >
                    {t === "Income" ? "Pemasukan" : "Pengeluaran"}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={txForm.category}
                  onChange={(e) =>
                    setTxForm({ ...txForm, category: e.target.value })
                  }
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {txForm.type === "Income" ? (
                    <>
                      <option>Penjualan</option>
                      <option>Investasi</option>
                      <option>Lain-lain</option>
                    </>
                  ) : (
                    <>
                      <option>Pembelian Aset</option>
                      <option>Gaji Pegawai</option>
                      <option>Bahan Baku</option>
                      <option>Operasional Kantor</option>
                      <option>Operasional CEO</option>
                      <option>Marketing</option>
                      <option>Maintenance</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sumber / Tujuan Rekening
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={txForm.bank_id || ""}
                  onChange={(e) =>
                    setTxForm({ ...txForm, bank_id: e.target.value })
                  }
                >
                  <option value="">-- Pilih Rekening --</option>
                  {/* {banks?.map((b) => (
                    <option
                      key={b.id}
                      value={`${b.bank_name} - ${b.holder_name}`}
                    >
                      {b.bank_name} ({b.account_number})
                    </option>
                  ))} */}
                  {bankList?.data?.items?.map((bank: any) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {bank.ref_account_number}-{" "}
                      {bank.ref_account_holder}
                    </option>
                  ))}
                  <option value="cash">Tunai / Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jumlah (Rp)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={txForm.amount || ""}
                  onChange={(e) =>
                    setTxForm({ ...txForm, amount: Number(e.target.value) })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={txForm.date}
                  onChange={(e) =>
                    setTxForm({ ...txForm, date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Keterangan / Nama Aset
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  rows={2}
                  value={txForm.description}
                  onChange={(e) =>
                    setTxForm({ ...txForm, description: e.target.value })
                  }
                  placeholder={
                    txForm.category === "Pembelian Aset"
                      ? "Masukkan nama aset yang dibeli..."
                      : "Keterangan transaksi..."
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {txForm.category === "Pembelian Aset"
                    ? "Foto Aset"
                    : "Bukti Transaksi (Opsional)"}
                </label>
                <div className="flex gap-2 items-center">
                  {proofImage ? (
                    <div className="relative w-16 h-16 border rounded overflow-hidden">
                      <img
                        src={proofImage}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setProofImage("")}
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => proofInputRef.current?.click()}
                      className="px-3 py-2 border border-gray-300 bg-gray-50 rounded text-xs text-gray-600 flex items-center gap-1"
                    >
                      <Image size={14} /> Upload Foto
                    </button>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    ref={proofInputRef}
                    accept="image/*"
                    onChange={handleProofUpload}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-white bg-blue-600 rounded-lg text-sm font-medium"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
