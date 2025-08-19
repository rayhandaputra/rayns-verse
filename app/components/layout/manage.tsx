interface NavbarProps {
  sidebar?: {
    open: boolean;
    setOpen: (open: boolean) => void;
  };
}

export default function Navbar({ sidebar }: NavbarProps) {
  return <div>use Layout Component for Manage Layout</div>;
}
