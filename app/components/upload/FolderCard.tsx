// components/upload/FolderCard.tsx
import { useState } from "react";
import { UploadButton } from "./UploadButton";
import { PreviewFile } from "./PreviewFile";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Trash2Icon } from "lucide-react";

type Props = {
  name: string;
  type: "idcard" | "lanyard";
  onDelete: () => void;
};

export function FolderCard({ name, type, onDelete }: Props) {
  const [files, setFiles] = useState<File[]>([]);

  const handleUpload = (file: File) => {
    setFiles([...files, file]);
  };

  const handleRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="border rounded-xl p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        {/* <p className="font-medium">Folder: <span className="font-semibold">{name}</span></p> */}
        <div className="flex flex-col">
          <p className="text-[0.675rem] text-gray-600 font-medium">
            Nama Folder
          </p>
          <Input
            type="text"
            placeholder="Masukkan Nama Folder"
            defaultValue={name}
          />
        </div>
        <Button
          onClick={onDelete}
          variant="outline"
          size="icon"
          className="text-red-600 hover:text-red-500"
        >
          <Trash2Icon className="w-4" />
        </Button>
      </div>

      {/* Upload Area */}
      <div className="space-y-2 mb-3">
        {type === "idcard" && (
          <div className="flex space-x-2">
            <UploadButton label="Upload Depan" onUpload={handleUpload} />
            <UploadButton label="Upload Belakang" onUpload={handleUpload} />
          </div>
        )}
        {type === "lanyard" && (
          <UploadButton label="Upload Lanyard" onUpload={handleUpload} />
        )}
      </div>

      {/* File Preview */}
      <div className="grid grid-cols-2 gap-2">
        {files.map((file, idx) => (
          <PreviewFile
            key={idx}
            file={file}
            onRemove={() => handleRemove(idx)}
          />
        ))}
      </div>
    </div>
  );
}
