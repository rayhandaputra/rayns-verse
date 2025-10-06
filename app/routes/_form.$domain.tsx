import { useRef, useState } from "react";
import { Upload, Trash2, PlusCircle, Info } from "lucide-react";
import { Input } from "~/components/ui/input";
import { API } from "~/lib/api";
// import { Link, Outlet } from "react-router";

type Folder = {
  id: string;
  name: string;
  files: { type: "front" | "back" | "lanyard"; url: string }[];
};

export default function UploadPage() {
  const [tab, setTab] = useState<"idcard" | "lanyard">("idcard");
  const [folders, setFolders] = useState<Folder[]>([
    { id: "umum", name: "Umum", files: [] },
  ]);

  const addFolder = () => {
    const id = Date.now().toString();
    setFolders([...folders, { id, name: "Folder Baru", files: [] }]);
  };

  const removeFolder = (id: string) => {
    setFolders(folders.filter((f) => f.id !== id));
  };

  const depanRef = useRef<HTMLInputElement>(null);
  const belakangRef = useRef<HTMLInputElement>(null);
  const lanyardRef = useRef<HTMLInputElement>(null);

  // handler saat file dipilih
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
              type: type,
              url: response.url,
            },
          ] as any,
        };
        setFolders(tmp);
      }
    }
  };

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
                value={folder.name}
                onChange={(e) =>
                  setFolders(
                    folders.map((f) =>
                      f.id === folder.id ? { ...f, name: e.target.value } : f
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

            {tab === "idcard" && (
              <div className="flex flex-col gap-2">
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
                {(folder?.files ?? [])?.length > 0 &&
                  folder?.files
                    .filter((v: any) => v?.type === "front")
                    .map((v: any, idx: number) => (
                      <img
                        key={idx}
                        src={v?.url}
                        alt="Preview Depan"
                        className="h-20 w-auto rounded-lg border object-cover"
                      />
                    ))}

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

                {(folder?.files ?? [])?.length > 0 &&
                  folder?.files
                    .filter((v: any) => v?.type === "back")
                    .map((v: any, idx: number) => (
                      <img
                        key={idx}
                        src={v?.url}
                        alt="Preview Depan"
                        className="h-20 w-auto rounded-lg border object-cover"
                      />
                    ))}
              </div>
            )}

            {tab === "lanyard" && (
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

                {(folder?.files ?? [])?.length > 0 &&
                  folder?.files.map((v: any, idx: number) => (
                    <img
                      key={idx}
                      src={v?.url}
                      alt="Preview Depan"
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
      </main>
    </div>
  );
}
