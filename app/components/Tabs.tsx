import { Link, useNavigate } from "react-router";
import { cn } from "~/lib/utils";

export type TabsTypes = {
  id: string | number;
  name: string;
  href: string;
  current?: boolean;
  hidden?: boolean;
};

export type TabsProps = {
  tabs: TabsTypes[];
  className?: string;
  activeClassName?: string;
};

export default function TabsComponent({
  tabs,
  className = "",
  activeClassName = "border-blue-500 text-blue-600",
}: TabsProps) {
  const navigate = useNavigate();
  const currentTab = tabs?.find((t) => t.current) ?? tabs?.[0];

  return (
    <div className={className}>
      {/* Mobile (select) */}
      <div className="sm:hidden">
        <select
          id="tabs"
          name="tabs"
          value={currentTab?.href ?? ""}
          onChange={(e) => navigate(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300
      focus:outline-none focus:ring-blue-500 focus:border-blue-500
      sm:text-sm rounded-md"
        >
          {tabs
            ?.filter((tab) => !tab.hidden)
            ?.map((tab) => (
              <option key={tab.id} value={tab.href}>
                {tab.name}
              </option>
            ))}
        </select>
      </div>

      {/* Desktop (horizontal tabs with scroll) */}
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav
            className="-mb-px flex space-x-8 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent no-scrollbar"
            role="tablist"
          >
            {tabs
              ?.filter((tab) => !tab.hidden)
              ?.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.href}
                  role="tab"
                  aria-selected={tab.current}
                  className={cn(
                    tab.current
                      ? activeClassName
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                  )}
                >
                  {tab.name}
                </Link>
              ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
