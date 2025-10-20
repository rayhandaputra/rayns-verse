import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  PlusCircle,
  Info,
  MessageCircle,
  CheckCircle2Icon,
  ChevronLeftIcon,
  Loader2,
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

type Folder = {
  id: string;
  deleted?: number;
  folder_name: string;
  files: { file_type: string; file_url: string; file_name: string }[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  try {
    const order = await API.ORDERS.get({
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
      session: {},
      req: {
        query: {
          order_number: order?.items?.[0]?.order_number,
        },
      } as any,
    });
    const files = await API.ORDER_UPLOAD.get_file({
      session: {},
      req: {
        query: {
          order_number: order?.items?.[0]?.order_number,
          size: 100,
        },
      } as any,
    });

    return {
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
  let { id, state, order_number, ...payload } = Object.fromEntries(
    formData.entries()
  ) as Record<string, any>;

  try {
    state = state ? JSON.parse(state) : {};

    console.log(state);
    await API.ORDER_UPLOAD.create({
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

    return Response.json({
      flash: {
        success: true,
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
  const [tab, setTab] = useState<"idcard" | "lanyard">("idcard");
  const [folders, setFolders] = useState<Folder[]>(
    currentFolder.length > 0
      ? currentFolder
      : [{ id: `KEY${Date.now()}`, folder_name: "Umum", files: [] }]
  );

  // 🔹 state untuk loading per folder dan tipe file
  const [uploading, setUploading] = useState<
    Record<string, Record<"front" | "back" | "lanyard", boolean>>
  >({});
  const [saving, setSaving] = useState(false);

  const fileRefs = useRef<
    Record<
      string,
      {
        front: HTMLInputElement | null;
        back: HTMLInputElement | null;
        lanyard: HTMLInputElement | null;
      }
    >
  >({});

  useEffect(() => {
    if (currentFolder.length > 0) {
      setFolders(currentFolder);
    }
  }, [currentFolder]);

  const navigate = useNavigate();
  const actionData = useActionData();

  useEffect(() => {
    if (actionData?.flash) {
      toast.success("Berhasil", { description: actionData?.flash?.message });

      setSaving(false);
    }
  }, [actionData]);

  const addFolder = () => {
    const id = `KEY${Date.now()}`;
    setFolders([...folders, { id, folder_name: "Folder Baru", files: [] }]);
  };

  const removeFolder = (id: string) => {
    if (!id.includes("KEY")) {
      setFolders(folders.map((f) => (f.id === id ? { ...f, deleted: 1 } : f)));
    } else {
      setFolders(folders.filter((f) => f.id !== id));
    }
  };

  // 🔹 fungsi upload file dengan loading
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back" | "lanyard",
    folderId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // set loading aktif
    setUploading((prev) => ({
      ...prev,
      [folderId]: { ...prev[folderId], [type]: true },
    }));

    try {
      const response = await API.ASSET.upload(file);

      const index = folders.findIndex(
        (f) => f.id?.toString() === folderId?.toString()
      );

      if (index !== -1) {
        let tmp = [...folders];
        tmp[index] = {
          ...tmp[index],
          files: [
            ...tmp[index]?.files.filter((x) => x.file_type !== type),
            {
              file_type: type,
              file_url: response.url,
              file_name: file.name,
            },
          ],
        };
        setFolders(tmp);
      }

      toast.success("Upload berhasil", { description: file.name });
    } catch (err) {
      toast.error("Upload gagal", { description: file.name });
    } finally {
      // set loading selesai
      setUploading((prev) => ({
        ...prev,
        [folderId]: { ...prev[folderId], [type]: false },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    e.currentTarget.submit();
  };

  const triggerInput = (
    folderId: string,
    type: "front" | "back" | "lanyard"
  ) => {
    const input = fileRefs.current?.[folderId]?.[type];
    if (input) input.click();
  };

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-100 to-sky-300 text-center px-6">
        <img
          src="/kinau-logo.png"
          alt="Kinau"
          className="mb-6 h-12 opacity-80"
        />
        <h1 className="text-2xl font-bold text-sky-900 mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-slate-700 max-w-md mb-6">
          Maaf, pesanan tidak ditemukan. Silakan buat pesanan terlebih dahulu.
        </p>
        <a
          href="https://wa.me/6285219337474?text=Halo%20Admin%2C%20saya%20ingin%20membuat%20pesanan%20baru."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-2 text-white font-medium shadow-md hover:bg-green-600"
        >
          <MessageCircle size={18} /> Hubungi Admin
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-500 p-4">
      <header className="mb-6 text-center">
        <img src="/kinau-logo.png" alt="Kinau" className="mx-auto mb-2 h-10" />
        <h1 className="text-xl font-bold text-slate-800">
          Upload Desain ID Card & Lanyard
        </h1>
        <p className="text-sm text-slate-700">
          Upload semua desain JPG/PNG yang akan dicetak.
        </p>
      </header>

      {/* Tabs */}
      <nav className="mb-4 flex justify-center gap-6 border-b pb-2 text-sm font-medium">
        <button
          onClick={() => setTab("idcard")}
          className={`${tab === "idcard" ? "text-sky-800 border-b-2 border-sky-800" : "text-slate-600"} pb-1`}
        >
          ID Card
        </button>
        <button
          onClick={() => setTab("lanyard")}
          className={`${tab === "lanyard" ? "text-sky-800 border-b-2 border-sky-800" : "text-slate-600"} pb-1`}
        >
          Lanyard
        </button>
      </nav>

      <main className="mx-auto max-w-md space-y-4">
        {folders
          .filter((v) => +(v?.deleted ?? 0) !== 1)
          .map((folder, folderIdx) => (
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
                  className="w-2/3 text-sm font-medium"
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
                <div className="flex flex-col gap-3">
                  {(["front", "back"] as const).map((type) => {
                    const isLoading = uploading[folder.id]?.[type];
                    return (
                      <div key={type}>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => triggerInput(folder.id, type)}
                          className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white shadow transition ${
                            isLoading
                              ? "bg-gray-400 cursor-not-allowed"
                              : type === "front"
                                ? "bg-sky-600 hover:bg-sky-700"
                                : "bg-slate-600 hover:bg-slate-700"
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="animate-spin w-4 h-4" />{" "}
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload size={16} /> Upload{" "}
                              {type === "front" ? "Depan" : "Belakang"}
                            </>
                          )}
                        </button>
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          ref={(el) => {
                            if (!fileRefs.current[folder.id]) {
                              fileRefs.current[folder.id] = {
                                front: null,
                                back: null,
                                lanyard: null,
                              };
                            }
                            fileRefs.current[folder.id][type] = el;
                          }}
                          onChange={(e) => handleFileChange(e, type, folder.id)}
                        />
                        {folder.files
                          .filter((v) => v.file_type === type)
                          .map((v, idx) => (
                            <img
                              key={idx}
                              src={v.file_url}
                              alt={`Preview ${type}`}
                              className="mt-2 h-20 w-full rounded-lg border object-cover"
                            />
                          ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  {(() => {
                    const isLoading = uploading[folder.id]?.lanyard;
                    return (
                      <>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => triggerInput(folder.id, "lanyard")}
                          className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white shadow transition ${
                            isLoading
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-sky-600 hover:bg-sky-700"
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="animate-spin w-4 h-4" />{" "}
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload size={16} /> Upload Lanyard
                            </>
                          )}
                        </button>
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          ref={(el) => {
                            if (!fileRefs.current[folder.id]) {
                              fileRefs.current[folder.id] = {
                                front: null,
                                back: null,
                                lanyard: null,
                              };
                            }
                            fileRefs.current[folder.id].lanyard = el;
                          }}
                          onChange={(e) =>
                            handleFileChange(e, "lanyard", folder.id)
                          }
                        />
                      </>
                    );
                  })()}

                  {folder.files.map((v, idx) => (
                    <img
                      key={idx}
                      src={v.file_url}
                      alt="Preview Lanyard"
                      className="mt-2 h-20 w-full rounded-lg border object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

        <button
          onClick={addFolder}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-400 bg-white px-3 py-4 text-sm font-medium text-slate-600 hover:border-sky-500 hover:text-sky-600"
        >
          <PlusCircle size={18} /> Tambah Folder
        </button>

        <Form
          method="post"
          onSubmit={handleSubmit}
          className="flex justify-between gap-2"
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
            className="bg-white text-green-700 flex items-center gap-2"
            onClick={() => navigate(`/`)}
          >
            <ChevronLeftIcon className="w-4" /> Beranda
          </Button>
          <Button
            type="submit"
            className="bg-green-700 flex items-center gap-2"
          >
            <CheckCircle2Icon className="w-4" /> Simpan
          </Button>
        </Form>
      </main>
    </div>
  );
}
