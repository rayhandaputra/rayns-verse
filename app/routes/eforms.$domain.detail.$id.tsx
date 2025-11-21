import MenuIcon from "~/components/icon/menu-icon";

import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  MoreVertical,
  Search,
  PlusIcon,
  MessageCircle,
  ChevronLeftIcon,
  CheckCircle2Icon,
} from "lucide-react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import { API } from "~/lib/api";
import CardFolder from "~/components/eform/CardFolder";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import SectionImageFolder from "~/components/eform/SectionImageFolder";
import { toast } from "sonner";
import { getSession } from "~/lib/session.client";
import { Button } from "~/components/ui/button";

export const loader: LoaderFunction = async ({ request, params }) => {
  try {
    const order = await API.ORDERS.get({
      session: {},
      req: {
        query: {
          pagination: "true",
          institution_domain: `kinau.id/eforms/${params.domain}`,
          page: 0,
          size: 1,
        },
      } as any,
    });
    const order_items = await API.ORDER_ITEMS.get({
      session: {},
      req: {
        query: {
          pagination: "true",
          id: params.id,
          // order_number: order?.items?.[0]?.order_number,
          page: 0,
          size: 50,
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
      detail: order_items?.items?.[0] ?? null,
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
  let { id, state, detail, order_number, ...payload } = Object.fromEntries(
    formData.entries()
  ) as Record<string, any>;

  try {
    state = state ? JSON.parse(state) : {};
    detail = detail ? JSON.parse(detail) : {};

    await API.ORDER_UPLOAD.create({
      session: {},
      req: {
        body: {
          folders: state.map((v: any) => ({
            ...v,
            product_id: detail?.product_id,
            product_name: detail?.product_name,
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

type Folder = {
  id: string;
  deleted?: number;
  folder_name: string;
  files: { file_type: string; file_url: string; file_name: string }[];
};

const EFormDomainPage: React.FC = () => {
  const { order, detail, folders: currentFolder } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();

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
  const lastUploadType = useRef<
    Record<string, "front" | "back" | "lanyard" | null>
  >({});

  useEffect(() => {
    if (currentFolder.length > 0) {
      setFolders(currentFolder);
    }
  }, [currentFolder]);

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
    // type: "front" | "back" | "lanyard",
    folderId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = lastUploadType.current[folderId];

    // set loading aktif
    setUploading((prev) => ({
      ...prev,
      // [folderId]: { ...prev[folderId], [type]: true },
      [folderId]: { ...prev[folderId] },
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
            // ...tmp[index]?.files.filter((x) => x.file_type !== type),
            ...tmp[index]?.files.filter((x) => x.file_type !== type),
            {
              // product_id:
              file_type: type as any,
              // file_type: "front",
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
        // [folderId]: { ...prev[folderId], [type]: false },
        [folderId]: { ...prev[folderId] },
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
    // console.log(type);
    const input: any = fileRefs.current?.[folderId];
    // console.log(fileRefs.current);
    lastUploadType.current[folderId] = type;
    if (input) input.click();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <AppBreadcrumb
        className="mb-5"
        pages={[
          {
            label: "Pesanan",
            href: `/eforms/${order?.institution_domain?.split("/")[2]}`,
          },
          { label: "Detail Folder", active: true },
        ]}
      />

      {/* Recent uploads */}
      <section className="w-full">
        {/* Photo uploads */}
        {folders
          .filter((v) => +(v?.deleted ?? 0) !== 1)
          .map((folder: any) => {
            // const isLoading = (uploading[folder.id] as any)?.[folder?.type];
            // const isLoading = uploading[folder.id] as any;

            return (
              <React.Fragment key={folder.id}>
                <SectionImageFolder
                  key={folder.id}
                  title={folder.folder_name}
                  description="Klik untuk mengubah nama folder"
                  onChangeTitle={(newTitle: string) => {
                    setFolders(
                      folders.map((f) =>
                        f.id === folder.id ? { ...f, folder_name: newTitle } : f
                      )
                    );
                  }}
                  files={folder.files.map((file: any, index: number) => ({
                    id: file.id,
                    src: file.file_url,
                    alt: file.file_name,
                    label:
                      file.file_type === "front"
                        ? "Cover Depan"
                        : "Cover Belakang",
                    onRemove: (id: number) => {
                      setFolders(
                        folders.map((f) => {
                          if (f.id === folder.id) {
                            return {
                              ...f,
                              files: f.files.filter(
                                (fi: any, idx: number) => +idx !== +index
                              ),
                            };
                          }
                          return f;
                        })
                      );
                    },
                  }))}
                  onRemove={() => removeFolder(folder.id)}
                  // isLoading={isLoading}
                  onUpload={(key) => triggerInput(folder.id, key as any)}
                />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  ref={(el) => {
                    // if (!fileRefs.current[folder.id]) {
                    //   fileRefs.current[folder.id] = {
                    //     front: null,
                    //     back: null,
                    //     lanyard: null,
                    //   };
                    // }
                    // (fileRefs.current[folder.id] as any)[folder?.type] = el;
                    (fileRefs.current[folder.id] as any) = el;
                  }}
                  onChange={(e) => handleFileChange(e, folder.id)}
                />
              </React.Fragment>
            );
          })}
      </section>

      <div className="w-full bg-white rounded-2xl p-3 mb-4 shadow-sm">
        <button
          type="button"
          onClick={addFolder}
          className="w-full bg-gray-50 rounded-xl p-2 cursor-pointer hover:bg-gray-100 transition"
        >
          <div className="flex justify-center items-center text-gray-600 gap-3">
            <PlusIcon className="w-6" />
            <span className="text-md font-semibold">Tambah Folder</span>
          </div>
        </button>
      </div>

      <Form
        method="post"
        onSubmit={handleSubmit}
        className="flex justify-end gap-2"
      >
        <input type="hidden" name="order_number" value={order?.order_number} />
        <input type="hidden" name="state" value={JSON.stringify(folders)} />
        <input type="hidden" name="detail" value={JSON.stringify(detail)} />
        <Button
          type="button"
          variant="outline"
          className="bg-white text-green-700 flex items-center gap-2"
          onClick={() =>
            navigate(`/eforms/${order?.institution_domain?.split("/")[2]}`)
          }
        >
          <ChevronLeftIcon className="w-4" /> Kembali
        </Button>
        <Button
          type="submit"
          className="bg-green-700 flex items-center text-white gap-2"
        >
          <CheckCircle2Icon className="w-4" /> Simpan
        </Button>
      </Form>

      {/* Floating action button */}
      {/* <button className="fixed bottom-6 right-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-4 shadow-lg transition">
        <Plus className="w-6 h-6" />
      </button> */}
    </div>
  );
};

export default EFormDomainPage;
