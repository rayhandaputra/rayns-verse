import { Plus } from "lucide-react";

interface TableHeaderProps {
  title: string;
  description?: string;
  buttonText?: string;
  onClick?: () => void;
  buttonIcon?: React.ElementType;
  searchValue?: string;
  setSearchValue?: (value: string) => void;
}

export default function TableHeader({
  title,
  description,
  buttonText,
  onClick,
  buttonIcon: ButtonIcon,
  searchValue,
  setSearchValue,
}: TableHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {description && <p className="text-gray-500 text-sm">{description}</p>}
      </div>
      {/* {buttonText && onClick && (
        <button
          onClick={onClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          {ButtonIcon && <ButtonIcon size={16} />} {buttonText}
        </button>
      )} */}
      <div className="flex gap-2">
        {setSearchValue && (
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
            placeholder="Cari Data..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        )}
        {buttonText && onClick && (
          <button
            onClick={onClick}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
          >
            {ButtonIcon && <ButtonIcon size={16} />} {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
