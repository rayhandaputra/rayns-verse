import { APIProvider } from "../client";

export const AccountMutationAPI = {
  get: async ({ req }: any) => {
    const {
      page = 0,
      size = 10,
      search,
      group_type = "",
      account_code = "",
      id = "",
      year = "",
    } = req.query || {};

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "account_ledger_mutations",
      action: "select",
      body: {
        columns: [
          "id",
          "account_code",
          "account_name",
          "debit",
          "credit",
          "category",
          "notes",
          "receipt_url",
          "created_on",
          `(SELECT group_type FROM accounts WHERE code = account_code) as group_type`,
        ],
        where: {
          deleted_on: "null",
          ...(group_type ? { group_type } : {}),
          ...(account_code ? { account_code } : {}),
          ...(year ? { "year:created_on": parseInt(year) } : {}),
          ...(id ? { id } : {}),
        },
        search,
        page: Number(page),
        size: Number(size),
        orderBy: ["created_on", "desc"],
      },
    });
  },
  // getFinanceReport: async ({ req }: any) => {
  //   const {
  //     year = new Date().getFullYear(),
  //   } = req.query || {};

  //   const startDate = `${year}-01-01 00:00:00`;
  //   const endDate = `${year}-12-31 23:59:59`;

  //   return APIProvider({
  //     endpoint: "select",
  //     method: "POST",
  //     table: "account_ledger_mutations",
  //     action: "select",
  //     body: {
  //       // Kita menggunakan agregasi SUM dan mengekstrak bulan
  //       columns: [
  //         `MONTH(created_on) as month`,
  //         // Menghitung total untuk account_id 4
  //         `SUM(CASE WHEN account_code = '4-101' THEN (credit - debit) ELSE 0 END) as total_pendapatan`,
  //         // Menghitung total untuk account_id 5
  //         `SUM(CASE WHEN account_code = '5-101' THEN (debit - credit) ELSE 0 END) as total_pengeluaran`,
  //       ],
  //       where: {
  //         deleted_on: "null",
  //         // created_on: {
  //         //   _gte: startDate,
  //         //   _lte: endDate,
  //         // },
  //         // Filter hanya untuk account_id 4 dan 5
  //         // account_code: {
  //         //   _in: ["4-101", "5-101"]
  //         // }
  //       },
  //       // Grouping berdasarkan bulan agar data terkumpul Jan-Des
  //       groupBy: [`MONTH(created_on)`],
  //       orderBy: ["month", "asc"],
  //     },
  //   });
  // },
  getFinanceReport: async ({ req }: any) => {
    const { year = new Date().getFullYear() } = req.query || {};

    const startDate = `${year}-01-01 00:00:00`;
    const endDate = `${year}-12-31 23:59:59`;

    // 1. Panggil API untuk ambil data yang ada di database
    const response = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "account_ledger_mutations",
      action: "select",
      body: {
        columns: [
          `MONTH(created_on) as month`,
          `SUM(CASE WHEN account_code = '4-101' THEN (credit - debit) ELSE 0 END) as total_income`,
          `SUM(CASE WHEN account_code = '5-101' THEN (debit - credit) ELSE 0 END) as total_expense`,
        ],
        where: {
          deleted_on: "null",
          ...(year ? { "year:created_on": parseInt(year) } : {}),
          // created_on: {
          //   _gte: startDate,
          //   _lte: endDate,
          // },
          // Filter kode akun agar query lebih cepat
          // account_code: {
          //   _in: ["4-101", "5-101"]
          // }
        },
        groupBy: [`MONTH(created_on)`],
        orderBy: ["month", "asc"],
      },
    });

    // 2. Buat template 12 bulan default dengan nilai 0
    const monthsName = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const defaultTwelveMonths = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      month_name: monthsName[i],
      name: monthsName[i],
      income: 0,
      expense: 0,
    }));

    // 3. Gabungkan data dari database ke dalam template 12 bulan
    // Asumsi: hasil APIProvider ada di dalam response.data atau response langsung
    const dbData = response?.items || [];

    const finalReport = defaultTwelveMonths.map((item) => {
      // Cari apakah di hasil database ada bulan yang cocok
      const found = dbData.find((d) => parseInt(d.month) === item.month);

      if (found) {
        return {
          ...item,
          income: parseFloat(found.total_income) || 0,
          expense: parseFloat(found.total_expense) || 0,
        };
      }
      return item;
    });

    return finalReport;
  },
  getExpenseComposition: async ({ req }: any) => {
    const { year = new Date().getFullYear() } = req.query || {};

    const startDate = `${year}-01-01 00:00:00`;
    const endDate = `${year}-12-31 23:59:59`;

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "account_ledger_mutations",
      action: "select",
      body: {
        columns: [
          "account_code",
          "account_name",
          // Nama label untuk chart (biasanya pakai account_name)
          "account_name as name",
          // Nilai pengeluaran: Debit bertambah, Credit berkurang
          `SUM(debit - credit) as value`,
          // `SUM(credit-debit) as value`,
          `SUM(debit) as total_debit`,
          `SUM(credit) as total_credit`,
        ],
        where: {
          deleted_on: "null",
          account_code: "5-101",
          ...(year ? { "year:created_on": parseInt(year) } : {}),
          // created_on: {
          //   _gte: startDate,
          //   _lte: endDate,
          // },
          // Mengambil semua akun yang berawalan '5' (Pengeluaran/Beban)
          // account_code: {
          //   _like: "5%",
          // },
        },
        groupBy: ["account_code", "account_name"],
        // Urutkan dari pengeluaran terbesar untuk chart yang lebih bagus
        orderBy: ["value", "desc"],
      },
    });
  },
};
