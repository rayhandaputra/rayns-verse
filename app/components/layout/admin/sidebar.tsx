import React, { Fragment, useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Icons } from "~/components/icon/asset";
import { Link, useLocation } from "react-router"; // FIXED: harus dari react-router-dom

type NavItem = {
  name: string;
  href?: string;
  icon?: keyof typeof Icons;
  active?: string[];
  children?: NavItem[];
};

interface SidebarProps {
  navigation: NavItem[];
  isMobileSidebarOpen?: boolean;
  setMobileSidebarOpen?: (isOpen: boolean) => void;
  onLinkClick?: () => void;
  className?: string;
}

export function Sidebar({
  navigation,
  onLinkClick,
  isMobileSidebarOpen,
  setMobileSidebarOpen,
  className,
}: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const [navLevel, setNavLevel] = useState<Record<string, string[]>>({
    level1: [],
    level2: [],
    level3: [],
  });

  const closeMobileSidebar = () => {
    setMobileSidebarOpen?.(false);
  };

  const toggleNav = (name: string, level: string) => {
    setNavLevel((prev) => {
      const updatedLevel = prev[level]?.includes(name)
        ? prev[level].filter((item) => item !== name)
        : [...(prev[level] || []), name];
      return { ...prev, [level]: updatedLevel };
    });
  };

  useEffect(() => {
    setMobileSidebarOpen?.(false);
    // eslint-disable-next-line
  }, [currentPath]);

  const renderNav = (
    items: NavItem[],
    level = 1,
    parentActive = false
  ): React.ReactNode[] =>
    items.flatMap((item) => {
      const Icon = item.icon ? Icons[item.icon] : Icons.File;
      const isActive =
        item.active?.some((p) => currentPath.startsWith(p)) ??
        currentPath.startsWith(item.href || "");
      const isOpen = navLevel[`level${level}`]?.includes(item.name);
      const hasChildren = item.children && item.children.length > 0;
      const paddingLeft = 2 + level * 2 + (hasChildren ? 0 : 2);

      const sharedClasses = `flex items-center px-3 py-2 text-sm transition-all pl-${paddingLeft}`;

      const element = hasChildren ? (
        <button
          key={item.name}
          type="button"
          onClick={() => toggleNav(item.name, `level${level}`)}
          className={cn(
            "w-full text-left flex gap-3 items-center justify-between",
            sharedClasses,
            isActive
              ? "border-l-4 border-l-cyan-600 bg-cyan-50 text-cyan-600 -pl-2"
              : "border-t border-gray-100 hover:bg-cyan-50 hover:text-cyan-600"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-800" />
            {item.name}
          </div>
          <ChevronRight
            className={cn(
              "h-5 w-5 transition-transform",
              isOpen && "rotate-90"
            )}
          />
        </button>
      ) : (
        item.href && (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => {
              onLinkClick?.();
              closeMobileSidebar();
            }}
            className={cn(
              "gap-2",
              sharedClasses,
              parentActive || isActive
                ? "border-l-4 border-l-cyan-600 bg-cyan-50 text-cyan-600"
                : "border-t border-gray-100 hover:bg-cyan-50 hover:text-cyan-600"
            )}
          >
            {item.icon && (
              <Icon className="h-4 w-4 ml-[0.22rem] text-gray-800" />
            )}
            {item.name}
          </Link>
        )
      );

      return [
        <Fragment key={item.name}>{element}</Fragment>,
        ...(hasChildren && isOpen
          ? renderNav(item.children!, level + 1, parentActive || isActive)
          : []),
      ];
    });

  return (
    <>
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={cn(
          className,
          "fixed top-0 left-0 z-50 min-h-screen w-[256px] bg-white text-gray-800 transition-transform",
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
          !isMobileSidebarOpen && "hidden md:block"
        )}
      >
        <div className="flex h-[64px] items-center px-3 py-6">
          <div className="flex w-full justify-between items-center gap-2 md:justify-center">
            <Link
              to="/"
              className="md:flex md:justify-center md:items-center w-full md:w-auto"
            >
              <img src="/kinau-logo.png" alt="logo" className="w-20 md:w-28" />
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="ml-auto md:hidden"
              onClick={closeMobileSidebar}
            >
              <Menu size={18} />
            </Button>
          </div>
        </div>
        <nav className="flex flex-col h-[100vh] overflow-y-auto no-scrollbar pb-[64px]">
          {renderNav(navigation)}
        </nav>
      </aside>
    </>
  );
}
