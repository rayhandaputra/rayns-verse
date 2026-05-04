import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { FolderCard, type FolderProps } from "./folder-card";
import { RecentFileCard, type RecentFileProps } from "./recent-file-card";
import { FileRow, type FileProps } from "./file-row";

interface DriveLayoutProps {
  folders: FolderProps[];
  recentFiles: RecentFileProps[];
  allFiles: FileProps[];
  use_for?: "mobile" | "desktop";
  onFolderClick?: (folder: FolderProps) => void;
}

export function DriveLayout({
  folders,
  recentFiles,
  allFiles,
  use_for = "desktop",
  onFolderClick,
}: DriveLayoutProps) {
  const isMobile = use_for === "mobile";

  return (
    <div className={`w-full ${isMobile ? "space-y-6" : "space-y-8"}`}>
      {/* Header */}
      {/* <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
      </div> */}

      {/* Actions */}
      {/* <div className="flex items-center gap-4">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> New file / Folder
        </Button>
      </div> */}

      {/* Folders Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Folder</h2>
        <div
          className={`grid gap-4 md:gap-6 ${
            isMobile
              ? "grid-cols-2"
              : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => onFolderClick?.(folder)}
            />
          ))}
        </div>
      </section>

      {/* Recent Files Section */}
      {/* <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent files</h2>
        <div
          className={`grid gap-4 md:gap-6 ${
            isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
          }`}
        >
          {recentFiles.map((file) => (
            <RecentFileCard key={file.id} file={file} />
          ))}
        </div>
      </section> */}

      {/* All Files Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Semua File</h2>
        <div className="rounded-md border border-gray-600 bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-600">
                <TableHead className="w-[400px]">File</TableHead>
                <TableHead>Tanngal Upload</TableHead>
                {/* <TableHead>Uploaded By</TableHead>
                <TableHead className="text-right">More Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allFiles.map((file) => (
                <FileRow key={file.id} file={file} />
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
