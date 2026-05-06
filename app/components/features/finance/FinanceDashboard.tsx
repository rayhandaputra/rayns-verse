import React, { useState, useRef, useEffect } from "react";
import {
  Wallet,
  Tag,
  Monitor,
  CreditCard,
  X,
} from "lucide-react";
import { FinancialReportDashboard } from "./FinancialReportDashboard";
import { ProductCostTable } from "./ProductCostTable";
import { FinancialTransactionModal } from "./FinancialTransactionModal";
import { AssetInventoryDashboard } from "../asset/AssetInventoryDashboard";
import { useFetcherData, useModal } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";
import { toast } from "sonner";
import { uploadFile } from "~/utils/utils";
import { useFetcher } from "react-router";
import AccountCoaPage from "./AccountCoaPage";

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

export const FinanceDashboard: React.FC = () => {
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

  const [modal, setModal] = useModal();
  const [sortBy] = useState("");
  const [page, setPage] = useState(1);

  // Action form for creating/updating
  const actionFetcher = useFetcher();

  const {
    data: productCost,
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
    if (productCost?.data?.items) {
      setTimeout(() => {
        setProductCostData(productCost.data.items);
      }, 0);
    }
  }, [productCost?.data?.items]);

  // Fetch balances
  const {
    data: incomeBalance,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT")
      .action("get")
      .params({
        page: 0,
        size: 1,
        id: 4,
        ...(filterYear && { year: filterYear }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: expensesBalance,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT")
      .action("get")
      .params({
        page: 0,
        size: 1,
        id: 5,
        ...(filterYear && { year: filterYear }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: transactionBalance,
    reload: reloadTrx,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT_MUTATION")
      .action("get")
      .params({
        page: page ? page - 1 : 0,
        size: 10,
        pagination: "true",
        account_code: "4-101,5-101",
        ...(filterYear && { year: filterYear }),
        ...(sortBy && { sort: sortBy }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: financeReport,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT_MUTATION")
      .action("getFinanceReport")
      .params({
        page: 0,
        size: 100,
        ...(filterYear && { year: filterYear }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: expenseComposition,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("ACCOUNT_MUTATION")
      .action("getExpenseComposition")
      .params({
        page: 0,
        size: 100,
        ...(filterYear && { year: filterYear }),
      })
      .build(),
    autoLoad: true,
  });

  const {
    data: bankList,
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

  useEffect(() => {
    if (actionFetcher.state === "idle" && actionFetcher.data) {
      const result = actionFetcher.data as any;
      if (result.success) {
        toast.success(result.message);
        setTimeout(() => {
          reloadTrx();
          reloadBank();
          setIsTxModalOpen(false);
          setTxForm({
            type: "Expense",
            date: new Date().toISOString().split("T")[0],
          });
          setProofImage("");
        }, 0);
      } else {
        toast.error(result.message);
      }
    }
  }, [actionFetcher.state, actionFetcher.data, reloadTrx, reloadBank]);

  const handleExportExcel = () => {
    const headers = ["Waktu", "Tipe", "Kategori", "Deskripsi", "Rekening", "Bukti", "Jumlah"];
    const rows = transactionBalance?.data?.items?.map((t: any) => [
      t.created_on,
      t.account_name,
      t.notes,
      `"${(t.account_name || "").replace(/"/g, '""')}"`,
      t.bank_id || "",
      t.receipt_url || "",
      t.amount || 0,
    ]);

    const csvContent = [headers.join(","), ...(rows || []).map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Keuangan_Kinau_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("intent", "create_transaction");
    formData.append("type", txForm.type || "Expense");
    formData.append("category", txForm.category || "");
    formData.append("amount", String(txForm.amount || 0));
    formData.append("date", txForm.date || new Date().toISOString().split("T")[0]);
    formData.append("description", txForm.description || "");
    formData.append("bank_id", txForm.bank_id || "");
    formData.append("proof_image", proofImage);
    actionFetcher.submit(formData, { method: "POST" });
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = await uploadFile(e.target.files[0]);
      setProofImage(url);
    }
  };

  const actionFetcherManual = useFetcher();
  const handleUpdateHpp = (id: string, val: number) => {
    actionFetcherManual.submit({ intent: "update_hpp_product", id, hpp_price: val.toString() }, { method: "POST" });
  };

  useEffect(() => {
    if (actionFetcherManual.state === "idle" && actionFetcherManual.data) {
      const result = actionFetcherManual.data as any;
      if (result?.success) {
        setTimeout(() => {
          reloadProductCost();
        }, 0);
        toast.success(result.message);
      }
    }
  }, [actionFetcherManual.state, actionFetcherManual.data, reloadProductCost]);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden flex-wrap shadow-sm">
        <button
          onClick={() => setActiveTab("report")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "report" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <Wallet size={16} className="inline mr-2" /> Laporan Keuangan
        </button>
        <button
          onClick={() => setActiveTab("product_cost")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "product_cost" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <Tag size={16} className="inline mr-2" /> Modal Produk (HPP)
        </button>
        <button
          onClick={() => setActiveTab("assets")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "assets" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <Monitor size={16} className="inline mr-2" /> Aset Perusahaan
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "accounts" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          <CreditCard size={16} className="inline mr-2" /> Daftar Akun
        </button>
      </div>

      {activeTab === "report" && (
        <FinancialReportDashboard
          filterYear={filterYear}
          setFilterYear={setFilterYear}
          balance={balance}
          financeReport={financeReport}
          expenseComposition={expenseComposition}
          transactionBalance={transactionBalance}
          loadingTrx={false}
          page={page}
          setPage={setPage}
          isTxModalOpen={isTxModalOpen}
          setIsTxModalOpen={setIsTxModalOpen}
          handleExportExcel={handleExportExcel}
          formatFullDateTime={formatFullDateTime}
          setModal={setModal}
          submitAction={(data:any) => actionFetcher.submit(data, {method: 'POST'})}
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
      )}

      {modal?.type === "zoom_receipt_url" && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setModal({ open: false, type: "", data: null })}
        >
          <button
            onClick={() => setModal({ open: false, type: "", data: null })}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
          >
            <X size={32} />
          </button>
          <img
            src={modal?.data?.receipt_url}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            alt="Receipt"
          />
        </div>
      )}

      {activeTab === "product_cost" && (
        <ProductCostTable
          productCostData={productCostData}
          setProductCostData={setProductCostData}
          handleUpdateHpp={handleUpdateHpp}
        />
      )}

      {activeTab === "assets" && (
        <AssetInventoryDashboard />
      )}

      {activeTab === "accounts" && <AccountCoaPage />}

      {isTxModalOpen && (
        <FinancialTransactionModal
          txForm={txForm}
          setTxForm={setTxForm}
          handleAddTx={handleAddTx}
          bankList={bankList}
          setIsTxModalOpen={setIsTxModalOpen}
          proofImage={proofImage}
          handleProofUpload={handleProofUpload}
          proofInputRef={proofInputRef}
        />
      )}
    </div>
  );
};
