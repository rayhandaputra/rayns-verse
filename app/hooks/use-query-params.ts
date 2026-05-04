import { useSearchParams } from "react-router";

export function useQueryParams() {
  const [searchParams] = useSearchParams();

  return Object.fromEntries(searchParams.entries());
}
