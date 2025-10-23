import { MoreVertical } from "lucide-react";

export default function CardFolder({
  label,
  description,
  onClick,
}: {
  label: string;
  description?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="bg-white hover:bg-indigo-50 rounded-2xl p-4 w-[140px] overflow-x-hidden shadow-sm flex flex-col justify-between"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-16">
        <span className="text-yellow-400">📁</span>
        <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
      </div>
      <div>
        <p className="text-gray-800 font-medium whitespace-nowrap text-sm mt-2">
          {label}
        </p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
}
