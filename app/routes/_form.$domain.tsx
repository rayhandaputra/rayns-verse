import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  PlusCircle,
  Info,
  MessageCircle,
  CheckCircle2Icon,
  ChevronLeftIcon,
} from "lucide-react";
import { Input } from "~/components/ui/input";
import { API } from "~/lib/api";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import { Button } from "~/components/ui/button";
import { getSession } from "~/lib/session";
import { toast } from "sonner";
// import { Link, Outlet } from "react-router";

// type Folder = {
//   id: string;
//   name: string;
//   files: { type: "front" | "back" | "lanyard"; url: string }[];
// };

type Folder = {
  id: string;
  folder_name: string;
  files: { file_type: string; file_url: string; file_name: string }[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  // const url = new URL(request.url);
  // const { page = 0, size = 10 } = Object.fromEntries(
  //   url.searchParams.entries()
  // );
  try {
    const order = await API.ORDERS.get({
      // session,
      session: {},
      req: {
        query: {
          pagination: "true",
          institution_domain: `kinau.id/${params.domain}`,
          page: 0,
          size: 1,
        },
      } as any,
    });

    const folders = await API.ORDER_UPLOAD.get_folder({
      // session,
      session: {},
      req: {
        query: {
          // pagination: "false",
          order_number: order?.items?.[0]?.order_number,
          // page: 0,
          // size: 1,
        },
      } as any,
    });
    const files = await API.ORDER_UPLOAD.get_file({
      // session,
      session: {},
      req: {
        query: {
          // pagination: "false",
          order_number: order?.items?.[0]?.order_number,
          // page: 0,
          // size: 1,
        },
      } as any,
    });

    return {
      // search,
      // APP_CONFIG: CONFIG,
      order: order?.items?.[0] ?? null,
      folders:
        folders?.items?.map((v: any) => ({
          ...v,
          files: files?.items?.filter((j: any) => +j.folder_id === +v?.id),
        })) ?? [],
    };
  } catch (err) {
    console.log(err);
  }
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  let { id, state, items, order_number, ...payload } = Object.fromEntries(
    formData.entries()
  ) as Record<string, any>;

  try {
    // let resMessage = "";
    state = state ? JSON.parse(state) : {};
    // items = items ? JSON.parse(items) : {};

    const result = await API.ORDER_UPLOAD.create({
      session: {},
      req: {
        body: {
          folders: state.map((v: any) => ({
            ...v,
            order_number,
          })),
        },
      },
    });

    // if (!id) {
    //   await API.PRODUCT.create({
    //     session: {},
    //     req: {Folder
    //       body: {
    //         ...state,
    //         subtotal: payload?.subtotal,
    //         total_price: payload?.total,
    //         items: items,
    //       },
    //     },
    //   });

    //   resMessage = "Berhasil menambahkan Produk";
    // } else {
    //   await API.PRODUCT.create({
    //     session: {},
    //     req: {
    //       body: {
    //         ...state,
    //         subtotal: payload?.subtotal,
    //         total_price: payload?.total,
    //         items: items,
    //         id,
    //       },
    //     },
    //   });

    //   resMessage = "Berhasil memperbaharui Produk";
    // }

    return Response.json({
      flash: {
        success: true,
        // message: resMessage,
        message: "Berhasil menyimpan perubahan",
      },
    });
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error_message: "Terjadi Kesalahan",
    };
  }
};

export default function UploadPage() {
  const { order, folders: currentFolder } = useLoaderData() || {};
  console.log(currentFolder);
  const [tab, setTab] = useState<"idcard" | "lanyard">("idcard");
  const [folders, setFolders] = useState<Folder[]>(
    currentFolder.length > 0
      ? currentFolder
      : [{ id: `KEY${Date.now().toString()}`, folder_name: "Umum", files: [] }]
  );

  useEffect(() => {
    if (currentFolder.length > 0) {
      setFolders(currentFolder);
    }
  }, [currentFolder]);

  const depanRef = useRef<HTMLInputElement>(null);
  const belakangRef = useRef<HTMLInputElement>(null);
  const lanyardRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const actionData = useActionData();

  useEffect(() => {
    if (actionData?.flash) {
      toast.success("Berhasil", {
        description: actionData?.flash?.message,
      });
    }
  }, [actionData]);

  // Fungsi menambah folder baru
  const addFolder = () => {
    const id = `KEY${Date.now().toString()}`;
    setFolders([...folders, { id, folder_name: "Folder Baru", files: [] }]);
  };

  // Fungsi hapus folder
  const removeFolder = (id: string) => {
    setFolders(folders.filter((f) => f.id !== id));
  };

  // Fungsi upload file
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string,
    folderId: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const response = await API.ASSET.upload(file);

      const index = folders.findIndex((f) => f.id === folderId);
      if (index !== -1) {
        let tmp = [...folders];
        tmp[index] = {
          ...tmp[index],
          files: [
            ...(tmp[index]?.files || []),
            {
              file_type: type,
              file_url: response?.url ?? "",
              file_name: response?.filename ?? "",
            },
          ],
        };
        setFolders(tmp);
      }
    }
  };

  // Jika order tidak ditemukan
  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-100 to-sky-300 text-center px-6">
        <img
          src="/kinau-logo.png"
          alt="Kinau"
          className="mb-6 h-12 w-auto opacity-80"
        />
        <h1 className="text-2xl font-bold text-sky-900 mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-slate-700 max-w-md mb-6">
          Maaf, pesanan yang kamu cari tidak ditemukan. <br />
          Silakan buat pesanan terlebih dahulu agar bisa mengunggah desain.
        </p>

        <a
          href="https://wa.me/6285219337474?text=Halo%20Admin%2C%20saya%20ingin%20membuat%20pesanan%20baru."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-2 text-white font-medium shadow-md hover:bg-green-600 transition"
        >
          <MessageCircle size={18} /> Hubungi Admin
        </a>

        <div className="mt-10 text-xs text-slate-500">
          © {new Date().getFullYear()} Kinau — Semua hak dilindungi.
        </div>
      </div>
    );
  }

  // Jika order ditemukan, tampilkan UI upload
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-500 p-4">
      {/* Header */}
      <header className="mb-6 text-center">
        <img
          src="/kinau-logo.png"
          alt="Kinau"
          className="mx-auto mb-2 h-10 w-auto"
        />
        <h1 className="text-xl font-bold text-slate-800">
          Upload Desain ID Card & Lanyard
        </h1>
        <p className="text-sm text-slate-700">
          Upload semua desain yang akan dicetak di sini. <br />
          Format file: <span className="font-semibold">JPG/PNG</span>
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <button className="flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-white">
            <Info size={14} /> Petunjuk ID Card
          </button>
          <button className="flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-white">
            <Info size={14} /> Petunjuk Lanyard
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="mb-4 flex justify-center gap-6 border-b pb-2 text-sm font-medium">
        <button
          onClick={() => setTab("idcard")}
          className={`${
            tab === "idcard"
              ? "text-sky-800 border-b-2 border-sky-800"
              : "text-slate-600"
          } pb-1`}
        >
          ID Card
        </button>
        <button
          onClick={() => setTab("lanyard")}
          className={`${
            tab === "lanyard"
              ? "text-sky-800 border-b-2 border-sky-800"
              : "text-slate-600"
          } pb-1`}
        >
          Lanyard
        </button>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-md space-y-4">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="rounded-xl bg-white text-black p-4 shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <Input
                type="text"
                value={folder.folder_name}
                onChange={(e) =>
                  setFolders(
                    folders.map((f) =>
                      f.id === folder.id
                        ? { ...f, folder_name: e.target.value }
                        : f
                    )
                  )
                }
                className="w-2/3 rounded-lg border px-2 py-1 text-sm font-medium"
              />
              <button
                onClick={() => removeFolder(folder.id)}
                className="rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Upload Section */}
            {tab === "idcard" ? (
              <div className="flex flex-col gap-2">
                {/* Upload Depan */}
                <button
                  onClick={() => depanRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-sky-700"
                >
                  <Upload size={16} /> Upload Depan
                </button>
                <input
                  type="file"
                  ref={depanRef}
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "front", folder.id)}
                />
                {folder?.files
                  ?.filter((v) => v?.file_type === "front")
                  ?.map((v, idx) => (
                    <img
                      key={idx}
                      src={v.file_url}
                      alt="Preview Depan"
                      className="h-20 w-auto rounded-lg border object-cover"
                    />
                  ))}

                {/* Upload Belakang */}
                <button
                  onClick={() => belakangRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-slate-700"
                >
                  <Upload size={16} /> Upload Belakang
                </button>
                <input
                  type="file"
                  ref={belakangRef}
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "back", folder.id)}
                />
                {folder?.files
                  ?.filter((v) => v?.file_type === "back")
                  ?.map((v, idx) => (
                    <img
                      key={idx}
                      src={v.file_url}
                      alt="Preview Belakang"
                      className="h-20 w-auto rounded-lg border object-cover"
                    />
                  ))}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => lanyardRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-sky-700"
                >
                  <Upload size={16} /> Upload Lanyard
                </button>
                <input
                  type="file"
                  ref={lanyardRef}
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "lanyard", folder.id)}
                />
                {folder?.files?.map((v, idx) => (
                  <img
                    key={idx}
                    src={v.file_url}
                    alt="Preview Lanyard"
                    className="h-20 w-auto rounded-lg border object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Tambah Folder */}
        <button
          onClick={addFolder}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-400 bg-white px-3 py-4 text-sm font-medium text-slate-600 hover:border-sky-500 hover:text-sky-600"
        >
          <PlusCircle size={18} /> Tambah Folder
        </button>

        <Form
          method="post"
          className="w-full flex justify-between gap-2"
          // onSubmit={(e) => {
          //   e.preventDefault();
          //   console.log(folders);
          // }}
        >
          <input
            type="hidden"
            name="order_number"
            value={order?.order_number}
          />
          <input type="hidden" name="state" value={JSON.stringify(folders)} />
          <Button
            type="button"
            variant="outline"
            className="text-green-700 bg-white flex items-center gap-2"
            onClick={() => navigate(`/`)}
          >
            <ChevronLeftIcon className="w-4" />
            Beranda
          </Button>
          <Button
            type="submit"
            className="bg-green-700 flex items-center gap-2"
          >
            <CheckCircle2Icon className="w-4" />
            Simpan
          </Button>
        </Form>
      </main>
    </div>
  );
}
