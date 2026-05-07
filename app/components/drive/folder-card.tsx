import { Folder } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export interface FolderProps {
  id: number;
  name: string;
  files: number;
  size: string;
  color: string;
}

export function FolderCard({
  folder,
  onClick,
}: {
  folder: FolderProps;
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={`border-none shadow-sm ${folder.color} transition-all hover:shadow-md cursor-pointer`}
    >
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-slate-900/5 rounded-xl">
            <Folder className="h-6 w-6 text-slate-700 fill-slate-700" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 mb-1">{folder.name}</h3>
          <p className="text-sm text-slate-500">
            {folder.files} Files • {folder.size}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
