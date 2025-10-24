import { Loader2, Trash2Icon, UploadCloudIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
  onUpload: (key: string) => void;
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
            <div className="flex items-center gap-4">
              {isLoading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex ring-1 ring-gray-50 items-center gap-2">
                      <UploadCloudIcon className="w-6 text-lg text-gray-500 cursor-pointer" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white w-44 text-gray-700 border-0"
                  >
                    <DropdownMenuItem onClick={() => onUpload("front")}>
                      Cover Depan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpload("back")}>
                      Cover Belakang
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              // <img
              //   src={file.src}
              //   alt={file.alt ?? `Imange ${index + 1}`}
              //   className="w-1/2 rounded-xl object-cover border border-gray-200"
              // />
              <div
                key={file.id ?? index}
                className="relative w-1/2 rounded-xl overflow-hidden"
              >
                <img
                  src={file.src}
                  alt={file.alt ?? `Image ${index + 1}`}
                  className="w-full h-full object-cover border border-gray-200 rounded-xl"
                />

                {/* Label di kiri atas */}
                <span className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {file.label ?? `Image ${index + 1}`}
                </span>

                {/* Trash icon di kanan atas */}
                <button
                  onClick={() => file.onRemove?.(file.id)}
                  className="absolute top-1 right-1 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full cursor-pointer backdrop-blur-sm"
                >
                  <Trash2Icon className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
