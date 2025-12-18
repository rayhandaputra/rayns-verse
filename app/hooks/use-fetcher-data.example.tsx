/**
 * EXAMPLE USAGE of useFetcherData Hook
 *
 * This file demonstrates how to use the useFetcherData hook
 * to simplify data fetching in your components.
 */

import { useFetcherData } from "./use-fetcher-data";

// Example 1: Basic Usage - Auto load on mount
export function InventoryListExample() {
  const { data, loading, error } = useFetcherData({
    endpoint: "/api/inventory-assets",
    autoLoad: true,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.data?.map((asset: any) => (
        <div key={asset.id}>{asset.asset_name}</div>
      ))}
    </div>
  );
}

// Example 2: With Query Parameters
export function InventoryListWithFiltersExample() {
  const { data, loading, error, reload } = useFetcherData({
    endpoint: "/api/inventory-assets",
    params: {
      page: 0,
      size: 10,
      category: "Electronics",
      status: "Good",
    },
    autoLoad: true,
  });

  return (
    <div>
      <button onClick={reload}>Refresh Data</button>
      {loading && <p>Loading...</p>}
      {data && (
        <ul>
          {data.data?.map((asset: any) => (
            <li key={asset.id}>{asset.asset_name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Example 3: Manual Load with Custom Parameters
export function InventorySearchExample() {
  const { data, loading, load } = useFetcherData({
    endpoint: "/api/inventory-assets",
    autoLoad: false, // Don't load automatically
  });

  const handleSearch = (searchTerm: string, category: string) => {
    load({
      search: searchTerm,
      category: category,
      page: 0,
      size: 20,
    });
  };

  return (
    <div>
      <button onClick={() => handleSearch("laptop", "Electronics")}>
        Search Laptops
      </button>
      {loading && <p>Searching...</p>}
      {data && <div>Found {data.total} items</div>}
    </div>
  );
}

// Example 4: Using POST method
export function CreateAssetExample() {
  const { data, loading, load } = useFetcherData({
    endpoint: "/api/inventory-assets",
    method: "POST",
    autoLoad: false,
  });

  const handleCreate = () => {
    load({
      asset_name: "New Laptop",
      category: "Electronics",
      purchase_date: "2024-01-01",
      location: "Office",
      total_value: 15000000,
      total_unit: 1,
    });
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create Asset"}
      </button>
      {data?.success && <p>Asset created successfully!</p>}
    </div>
  );
}

// Example 5: Advanced - With TypeScript Types
interface Asset {
  id: number;
  asset_name: string;
  category: string;
  purchase_date: string;
  location: string;
  status: string;
  total_value: number;
  total_unit: number;
}

interface AssetResponse {
  success: boolean;
  data: Asset[];
  total: number;
  page: number;
}

export function TypedInventoryExample() {
  const { data, loading, error, reload } = useFetcherData<AssetResponse>({
    endpoint: "/api/inventory-assets",
    params: { page: 0, size: 10 },
    autoLoad: true,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading assets</div>;

  return (
    <div>
      <h2>Assets (Total: {data?.total})</h2>
      <button onClick={reload}>Refresh</button>
      <ul>
        {data?.data?.map((asset) => (
          <li key={asset.id}>
            {asset.asset_name} - {asset.category}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Example 6: Multiple Fetchers in One Component
export function DashboardExample() {
  const assets = useFetcherData({
    endpoint: "/api/inventory-assets",
    params: { size: 5 },
  });

  const electronics = useFetcherData({
    endpoint: "/api/inventory-assets",
    params: { category: "Electronics", size: 5 },
  });

  const furniture = useFetcherData({
    endpoint: "/api/inventory-assets",
    params: { category: "Furniture", size: 5 },
  });

  return (
    <div>
      <section>
        <h2>All Assets</h2>
        {assets.loading ? <p>Loading...</p> : <p>Total: {assets.data?.total}</p>}
      </section>

      <section>
        <h2>Electronics</h2>
        {electronics.loading ? (
          <p>Loading...</p>
        ) : (
          <p>Total: {electronics.data?.total}</p>
        )}
      </section>

      <section>
        <h2>Furniture</h2>
        {furniture.loading ? (
          <p>Loading...</p>
        ) : (
          <p>Total: {furniture.data?.total}</p>
        )}
      </section>
    </div>
  );
}
