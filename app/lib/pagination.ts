export const getOffset = (page: number, limit: number) => {
  const offset = +page ? +page * +limit : 0;
  return { offset };
};

export const calculatePagination = (
  total_items: number,
  page: number,
  limit: number
) => {
  const current_page = page ? +page : 0;
  const total_pages = Math.ceil(total_items / limit);
  return { page: page, size: limit, total_pages, total_items, current_page };
};
