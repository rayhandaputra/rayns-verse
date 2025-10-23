import { Loader2, Trash2Icon, UploadCloudIcon, UploadIcon } from "lucide-react";

export default function SectionImageFolder({
  title,
  description,
  onChangeTitle,
  files,
  onRemove,
  isLoading,
  onUpload,
}: {
  title: string;
  description?: string;
  onChangeTitle: (newTitle: string) => void;
  files?: any[];
  onRemove?: () => void;
  onUpload: () => void;
  isLoading?: boolean;
}) {
  return (
    <>
      {/* Photo uploads */}
      <div className="bg-white rounded-2xl p-3 mb-4 shadow-sm">
        <div className="w-full bg-gray-50 rounded-xl p-2 mb-3">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                🗂️
              </div>
              <div>
                {/* Editable transparent input */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onChangeTitle(e.target.value)}
                  className="text-sm font-medium text-gray-700 bg-transparent border-none focus:outline-none w-full placeholder-gray-400"
                />
                {description && (
                  <p className="text-xs text-gray-400">{description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" /> Uploading...
                </>
              ) : (
                <UploadCloudIcon
                  onClick={onUpload}
                  className="w-6 text-lg text-gray-500 cursor-pointer"
                />
              )}

              <Trash2Icon
                onClick={onRemove}
                className="w-5 text-lg text-red-700 cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-scroll no-scrollbar">
          {!files?.length ? (
            <>
              <img
                src="https://picsum.photos/id/1003/120/80"
                alt="Upload 1"
                className="w-1/2 rounded-xl object-cover"
              />
              <img
                src="https://picsum.photos/id/1011/120/80"
                alt="Upload 2"
                className="w-1/2 rounded-xl object-cover"
              />
            </>
          ) : (
            files?.map((file: any, index: number) => (
              <img
                src={file.src}
                alt={file.alt ?? `Imange ${index + 1}`}
                className="w-1/2 rounded-xl object-cover border border-gray-200"
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
