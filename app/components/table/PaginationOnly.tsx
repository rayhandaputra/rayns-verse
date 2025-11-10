export default function PaginationItem({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
}) {
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);

  const getPages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Jika page sedikit → tampil semua
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Banyak page → smart pagination
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  return (
    <nav
      className="flex items-center flex-column flex-wrap md:flex-row justify-center md:justify-between pt-4"
      aria-label="Table navigation"
    >
      {/* Page info */}
      <span className="text-sm font-normal text-gray-500 mb-4 md:mb-0 block w-full text-center md:text-left md:inline md:w-auto">
        <span className="font-semibold text-gray-900">
          {end > 0 ? `${start}-${end}` : `0`}
        </span>{" "}
        of <span className="font-semibold text-gray-900">{totalItems}</span>
      </span>

      {/* Pagination */}
      <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
        {/* Previous */}
        <li>
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
        </li>

        {/* Page Numbers */}
        {getPages().map((p, idx) => (
          <li key={idx}>
            {p === "..." ? (
              <span className="flex items-center justify-center px-3 h-8 border border-gray-300 bg-gray-50 text-gray-400">
                ...
              </span>
            ) : (
              <button
                onClick={() => onPageChange(p as number)}
                className={`flex items-center justify-center px-3 h-8 border border-gray-300 hover:bg-gray-100 
                ${p === currentPage ? "bg-blue-500 text-white" : "text-gray-700"}`}
              >
                {p}
              </button>
            )}
          </li>
        ))}

        {/* Next */}
        <li>
          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}
