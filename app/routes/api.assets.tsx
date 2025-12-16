// app/routes/api.assets.tsx
import type { LoaderFunction } from "react-router";
import type { Asset } from "../types";
import { requireAuth } from "~/lib/session.server";
import { API } from "~/lib/api";

interface LoaderData {
  assets: Asset[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("search") || undefined;

  // Fetch assets from API
  const response = await API.INVENTORY_ASSET.get({
    session: { user, token },
    req: {
      query: {
        page: 0,
        size: 1000,
        search: searchTerm,
      },
    },
  });

  // Map to Asset type
  const mappedAssets: Asset[] = (response.items || []).map((a: any) => ({
    id: String(a.id),
    name: a.asset_name || "",
    category: a.category || "",
    purchaseDate: a.purchase_date || "",
    value: Number(a.total_value) || 0,
    status: a.status || "Good",
    location: a.location || "",
    unit: Number(a.total_unit) || 1,
  }));

  return Response.json({ assets: mappedAssets });
};
