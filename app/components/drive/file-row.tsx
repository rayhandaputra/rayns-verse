import { FileText, MoreVertical } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TableCell, TableRow } from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export interface FileProps {
  id: number;
  name: string;
  date: string;
  uploadedBy: string;
  avatar: string;
}

export function FileRow({ file }: { file: FileProps }) {
  return (
    <TableRow className="hover:bg-slate-50/50 border-b border-gray-600">
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-md">
            <FileText className="h-4 w-4 text-slate-600" />
          </div>
          <span className="text-slate-700">{file.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-slate-500">{file.date}</TableCell>
      {/* <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={file.avatar} />
            <AvatarFallback>{file.uploadedBy[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-slate-700">{file.uploadedBy}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Download</DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell> */}
    </TableRow>
  );
}
