import React from "react";
import { HardDrive } from "lucide-react";
import { useNavigate } from "react-router";

type BreadcrumbItem = {
  id: string;
  name: string;
};

interface DriveBreadcrumbProps {
  domain: string;
  currentFolderId?: string | null;
  rootFolderId?: string | null;
  breadcrumbs: BreadcrumbItem[];
  onOpenFolder: (folderId: string) => void;
}

export function DriveBreadcrumb({
  domain,
  currentFolderId,
  rootFolderId,
  breadcrumbs,
  onOpenFolder,
}: DriveBreadcrumbProps) {
  const navigate = useNavigate();

  const isRootActive = !currentFolderId || currentFolderId === rootFolderId;

  const getRootPath = () => {
    if (domain === "customer") return "/app/drive/customer";
    if (domain === "internal") return "/app/drive/internal";
    return `/public/drive-link/${domain}`;
  };

  const getRootLabel = () => {
    if (domain === "customer") return "Customer Drive";
    if (domain === "internal") return "Internal Ops";
    return "Root";
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-600 overflow-x-auto bg-gray-50/50"
    >
      {/* Root */}
      <button
        onClick={() => navigate(getRootPath())}
        className={`flex items-center px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
          isRootActive
            ? "font-semibold text-blue-600 bg-blue-50"
            : "hover:bg-white hover:text-blue-600"
        }`}
      >
        <HardDrive size={14} className="mr-1.5" />
        {getRootLabel()}
      </button>

      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;

        return (
          <React.Fragment key={crumb.id}>
            <span className="text-gray-300">/</span>
            <button
              onClick={() => onOpenFolder(crumb.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                isLast
                  ? "font-semibold text-blue-600 bg-blue-50"
                  : "hover:bg-white hover:text-blue-600"
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
