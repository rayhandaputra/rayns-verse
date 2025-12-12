import {
  useNavigate,
  useLoaderData,
  useActionData,
  useSubmit,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import { useState, useEffect } from "react";
import MenuIcon from "~/components/icon/menu-icon";
import { DriveLayout } from "~/components/drive/drive-layout";
import { API } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Plus, Folder, FileText, ChevronRight, Home } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CreateFolderModal } from "~/components/drive/create-folder-modal";
import { UploadFileModal } from "~/components/drive/upload-file-modal";
import { toast } from "sonner";

export const loader: LoaderFunction = async ({ request, params }) => {
  try {
    const url = new URL(request.url);
    const folder_id = url.searchParams.get("folder_id");

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

    const orderNumber = order?.items?.[0]?.order_number;

    if (!orderNumber) {
      return { order: null, detail: null, folders: [], files: [] };
    }

    const order_items = await API.ORDER_ITEMS.get({
      session: {},
      req: {
        query: {
          pagination: "true",
          order_number: orderNumber,
          page: 0,
          size: 50,
        },
      } as any,
    });

    const folders = await API.ORDER_UPLOAD.get_folder({
      session: {},
      req: {
        query: {
          order_number: orderNumber,
        },
      } as any,
    });

    const files = await API.ORDER_UPLOAD.get_file({
      session: {},
      req: {
        query: {
          order_number: orderNumber,
          folder_id: folder_id ?? undefined,
          size: 100,
        },
      } as any,
    });

    let currentFolder = null;
    if (folder_id) {
      const folderRes = await API.ORDER_UPLOAD.get_folder({
        session: {},
        req: {
          query: {
            order_number: orderNumber,
            id: folder_id,
          },
        } as any,
      });
      currentFolder = folderRes?.items?.[0] || null;
    }

    return {
      order: order?.items?.[0] ?? null,
      detail: order_items?.items?.[0] ?? null,
      folders: folders?.items ?? [],
      files: files?.items ?? [],
      folder_id,
      currentFolder,
    };
  } catch (err) {
    console.log(err);
    return { order: null, detail: null, folders: [], files: [] };
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  let { state, detail, order_number } = Object.fromEntries(
    formData.entries()
  ) as Record<string, any>;

  try {
    state = state ? JSON.parse(state) : [];
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

export default function DrivePage() {
  const navigate = useNavigate();
  const {
    order,
    detail,
    folders: initialFolders,
    files: initialFiles,
    currentFolder,
  } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false);

  useEffect(() => {
    if (initialFolders) setFolders(initialFolders);
    if (initialFiles) setFiles(initialFiles);
  }, [initialFolders, initialFiles]);

  useEffect(() => {
    if (actionData?.flash) {
      toast.success("Berhasil", { description: actionData?.flash?.message });
    }
  }, [actionData]);

  const saveChanges = (updatedFolders: any[]) => {
    const formData = new FormData();
    formData.append("order_number", order?.order_number);
    formData.append("state", JSON.stringify(updatedFolders));
    formData.append("detail", JSON.stringify(detail));
    submit(formData, { method: "post" });
  };

  const handleCreateFolder = (name: string) => {
    const newFolder = {
      id: `KEY${Date.now()}`,
      folder_name: name,
      files: [],
    };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    saveChanges(updatedFolders);
  };

  const handleUploadFile = async (file: File, folderId?: string) => {
    try {
      const response = await API.ASSET.upload(file);

      const newFile = {
        file_type: file.type || "application/octet-stream", // Use actual file type or a default
        file_url: response.url,
        file_name: file.name,
        folder_id: folderId,
        order_number: order?.order_number, // Assuming order_number is needed for file association
        product_id: detail?.product_id, // Assuming product_id is needed
        product_name: detail?.product_name, // Assuming product_name is needed
      };

      await API.ORDER_UPLOAD.create_single_file({
        session: {},
        req: {
          body: newFile,
        },
      });

      // Optimistically update UI
      if (folderId) {
        setFolders((prevFolders) =>
          prevFolders.map((f) => {
            if (f.id.toString() === folderId.toString()) {
              const initialFolderFiles =
                f.files ||
                files.filter((file: any) => +file.folder_id === +f.id);
              return {
                ...f,
                files: [...initialFolderFiles, newFile],
              };
            }
            return f;
          })
        );
      }
      setFiles((prevFiles) => [...prevFiles, newFile]);

      toast.success("Upload berhasil", { description: file.name });
    } catch (error) {
      console.error(error);
      toast.error("Upload gagal");
    }
  };

  // Map data for DriveLayout
  const mappedFolders = folders.map((f: any, index: number) => ({
    id: f.id,
    name: f.folder_name,
    files: f.files
      ? f.files.length
      : files.filter((file: any) => +file.folder_id === +f.id).length,
    size: "0 MB",
    color: index % 2 === 0 ? "bg-slate-50" : "bg-blue-50 border-blue-100",
  }));

  const mappedRecentFiles = files.slice(0, 3).map((f: any) => ({
    id: f.id,
    name: f.file_name,
    date: new Date(f.created_at || Date.now()).toLocaleDateString(),
    size: "0 MB",
    type: f.file_type || "doc",
  }));

  const mappedAllFiles = files.map((f: any) => ({
    id: f.id,
    name: f.file_name,
    date: new Date(f.created_at || Date.now()).toLocaleDateString(),
    uploadedBy: "User",
    avatar: "https://github.com/shadcn.png",
  }));

  const [client, setClient] = useState(false);
  useEffect(() => {
    setClient(true);
  }, []);
  if (!client) return null;

  return (
    <div className="bg-[#f2f4f7]">
      <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] to-[#f8f9fd] layout flex flex-col items-center p-4">
        {/* Header */}
        <header className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MenuIcon className="w-6 h-6 text-black" />
          </div>
          <img
            src="/kinau-logo.png"
            onClick={() => navigate("/")}
            alt="Kinau"
            className="w-24 opacity-80 cursor-pointer"
          />
          <img
            src="https://i.pravatar.cc/40"
            alt="User"
            className="w-9 h-9 rounded-full border border-gray-200"
          />
        </header>

        <div className="w-full flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Baru
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-44 mt-2 bg-white text-gray-700 border-0"
            >
              <DropdownMenuItem onClick={() => setIsCreateFolderOpen(true)}>
                Buat Folder
              </DropdownMenuItem>
              <div className="border-t border-t-gray-100 my-1" />
              <DropdownMenuItem onClick={() => setIsUploadFileOpen(true)}>
                Upload File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Breadcrumb / Title */}
        <div className="w-full flex items-center gap-2 mb-6">
          <div
            className="flex items-center gap-1 cursor-pointer text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => navigate(".")}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Home</span>
          </div>

          {currentFolder && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">
                  {currentFolder.folder_name}
                </span>
              </div>
            </>
          )}
        </div>

        <DriveLayout
          folders={currentFolder ? [] : mappedFolders}
          recentFiles={mappedRecentFiles}
          allFiles={mappedAllFiles}
          use_for="mobile"
          onFolderClick={(folder) => navigate(`?folder_id=${folder.id}`)}
        />

        <CreateFolderModal
          open={isCreateFolderOpen}
          onOpenChange={setIsCreateFolderOpen}
          onCreate={handleCreateFolder}
        />

        <UploadFileModal
          open={isUploadFileOpen}
          onOpenChange={setIsUploadFileOpen}
          folder={currentFolder} // This is correct, shows all folders
          onUpload={handleUploadFile}
        />
      </div>
    </div>
  );
}
