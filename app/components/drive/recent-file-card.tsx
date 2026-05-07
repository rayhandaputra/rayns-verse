import { FileText } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export interface RecentFileProps {
  id: number;
  name: string;
  date: string;
  size: string;
  type: string;
}

export function RecentFileCard({ file }: { file: RecentFileProps }) {
  return (
    <Card className="border border-gray-600 shadow-sm hover:shadow-md transition-all cursor-pointer bg-white">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 bg-slate-100 rounded-lg">
          <FileText className="h-6 w-6 text-slate-600" />
        </div>
        <div>
          <h3 className="font-medium text-slate-900">{file.name}</h3>
          <p className="text-xs text-slate-500">
            {file.date} • {file.size}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
