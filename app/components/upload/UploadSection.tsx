// components/upload/UploadSection.tsx
import { useState } from "react";
import { FolderCard } from "./FolderCard";

type Props = {
  title: string;
  description: string;
  type: "idcard" | "lanyard";
};

export function UploadSection({ title, description, type }: Props) {
  const [folders, setFolders] = useState<string[]>(["Umum"]);

  const handleAddFolder = () => {
    const newName = prompt("Nama folder:");
    if (newName) setFolders([...folders, newName]);
  };

  const handleDeleteFolder = (name: string) => {
    setFolders(folders.filter((f) => f !== name));
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <button
          onClick={handleAddFolder}
          className="px-2 py-1 border rounded-md text-xs hover:bg-gray-50"
        >
          Tambah Folder
        </button>
      </div>

      <div className="space-y-4">
        {folders.map((folder) => (
          <FolderCard
            key={folder}
            name={folder}
            type={type}
            onDelete={() => handleDeleteFolder(folder)}
          />
        ))}
      </div>
    </div>
  );
}
