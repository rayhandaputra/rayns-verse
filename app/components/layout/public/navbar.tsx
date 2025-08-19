import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router";
import { abbreviation } from "~/lib/utils";

interface NavbarProps {
  sidebar?: {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (val: boolean) => void;
  };
}

const Navbar = ({ sidebar }: NavbarProps) => {
  const navigate = useNavigate();
  const toggleMobileMenu = () => {
    sidebar?.setMobileMenuOpen?.(!sidebar.mobileMenuOpen);
  };

  const abbr = abbreviation(
    // session?.user_fullname ||
    "RP"
  );
  return (
    <nav className="fixed top-0 left-0 right-0 z-30 h-[64px] bg-white border-b border-gray-200 flex items-center px-4 md:px-6 shadow-sm md:pl-[268px]">
      {/* Mobile Menu Button */}
      <div className="flex w-full items-center justify-between md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Main Content: Search & User Dropdown */}
      <div className="flex w-full items-center justify-end md:justify-between">
        {/* Search Placeholder (for future use) */}
        <div className="hidden md:flex flex-1">
          {/* <SearchNavigation /> */}
        </div>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
            <Avatar className="w-9 h-9 ring-1 ring-gray-200">
              <AvatarImage />
              <AvatarFallback>{abbr}</AvatarFallback>
            </Avatar>

            {/* Desktop only user info */}
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">Rayhan</span>
              <span className="text-xs text-gray-500">Admin</span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44 mt-2">
            <DropdownMenuItem onClick={() => {}}>Profil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/logout")}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
