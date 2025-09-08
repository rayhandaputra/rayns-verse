import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Menu } from "lucide-react";
import { abbreviation } from "~/lib/utils";
import { useFetcher, useNavigate } from "react-router";
import Swal from "sweetalert2";

interface NavbarProps {
  sidebar?: {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (val: boolean) => void;
  };
}

const Topbar = ({ sidebar }: NavbarProps) => {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const toggleMobileMenu = () => {
    sidebar?.setMobileMenuOpen?.(!sidebar.mobileMenuOpen);
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin keluar dari akun ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton:
          "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg focus:outline-none",
        cancelButton:
          "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2 mr-2",
        popup: "rounded-2xl shadow-lg",
        title: "text-lg font-semibold text-gray-800",
        htmlContainer: "text-gray-600",
      },
      buttonsStyling: false, // agar customClass tombol aktif
    });

    if (result.isConfirmed) {
      // Lakukan API call di sini
      // await deleteData();
      // navigate(`/logout`);
      // Swal.fire("Berhasil!", "Berhasil keluar dari Akun.", "success");
      fetcher.submit(null, { method: "post", action: "/logout" });
    }
  };

  const abbr = abbreviation(
    // session?.user_fullname ||
    "RP"
  );
  return (
    <nav className="fixed top-0 left-0 right-0 z-30 h-[64px] bg-white flex items-center px-4 md:px-md:pl-[268px]">
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
            <Avatar className="w-9 h-9 ring-1 ring-gray-200 text-gray-700">
              <AvatarImage />
              <AvatarFallback>{abbr}</AvatarFallback>
            </Avatar>

            {/* Desktop only user info */}
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">Rayhan</span>
              <span className="text-xs text-gray-500">Admin</span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-44 mt-2 bg-white text-gray-700 border-0"
          >
            <DropdownMenuItem onClick={() => {}}>Profil</DropdownMenuItem>
            <div className="border-t border-t-gray-100 my-1" />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Topbar;
