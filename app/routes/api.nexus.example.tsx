/**
 * API Nexus - Usage Examples
 *
 * This file demonstrates various ways to use the API Nexus
 * with the useFetcherData hook for different scenarios.
 */

import { useFetcherData } from "~/hooks/use-fetcher-data";

// ============================================================================
// EXAMPLE 1: Basic GET Request - Fetch Inventory Assets
// ============================================================================
export function InventoryListExample() {
  const { data, loading, error } = useFetcherData({
    endpoint: "/api/nexus",
    params: {
      module: "INVENTORY_ASSET",
      action: "get",
      page: 0,
      size: 10,
    },
  });

  if (loading) return <div>Loading assets...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Inventory Assets</h2>
      {data?.data?.items?.map((asset: any) => (
        <div key={asset.id}>{asset.asset_name}</div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Filtered GET Request - Search & Filter
// ============================================================================
export function FilteredInventoryExample() {
  const { data, loading, load } = useFetcherData({
    endpoint: "/api/nexus",
    params: {
      module: "INVENTORY_ASSET",
      action: "get",
    },
    autoLoad: false,
  });

  const handleFilter = (category: string, status: string) => {
    load({
      module: "INVENTORY_ASSET",
      action: "get",
      category,
      status,
      page: 0,
      size: 20,
    });
  };

  return (
    <div>
      <button onClick={() => handleFilter("Electronics", "Good")}>
        Show Electronics (Good Condition)
      </button>
      <button onClick={() => handleFilter("Furniture", "Fair")}>
        Show Furniture (Fair Condition)
      </button>
      {loading && <p>Loading...</p>}
      {data?.success && <div>Found {data.data?.total || 0} items</div>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: POST Request - Create New Asset
// ============================================================================
export function CreateAssetExample() {
  const { data, loading, load } = useFetcherData({
    endpoint: "/api/nexus",
    method: "POST",
    autoLoad: false,
  });

  const handleCreate = () => {
    load({
      module: "INVENTORY_ASSET",
      action: "create",
      asset_name: "MacBook Pro 16\"",
      category: "Electronics",
      purchase_date: "2024-01-15",
      location: "IT Department",
      status: "Good",
      total_value: 35000000,
      total_unit: 1,
    });
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create New Asset"}
      </button>
      {data?.success && (
        <p className="text-green-600">Asset created successfully!</p>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: POST Request - Update Asset
// ============================================================================
export function UpdateAssetExample({ assetId }: { assetId: number }) {
  const { data, loading, load } = useFetcherData({
    endpoint: "/api/nexus",
    method: "POST",
    autoLoad: false,
  });

  const handleUpdate = () => {
    load({
      module: "INVENTORY_ASSET",
      action: "update",
      id: assetId,
      status: "Maintenance",
      location: "Repair Center",
    });
  };

  return (
    <div>
      <button onClick={handleUpdate} disabled={loading}>
        {loading ? "Updating..." : "Move to Maintenance"}
      </button>
      {data?.success && <p>Asset updated!</p>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Multiple Modules - Dashboard with Different Data Sources
// ============================================================================
export function DashboardExample() {
  // Fetch inventory assets
  const assets = useFetcherData({
    endpoint: "/api/nexus",
    params: {
      module: "INVENTORY_ASSET",
      action: "get",
      page: 0,
      size: 5,
    },
  });

  // Fetch products
  const products = useFetcherData({
    endpoint: "/api/nexus",
    params: {
      module: "PRODUCT",
      action: "get",
      page: 0,
      size: 5,
    },
  });

  // Fetch orders
  const orders = useFetcherData({
    endpoint: "/api/nexus",
    params: {
      module: "ORDERS",
      action: "get",
      page: 0,
      size: 5,
    },
  });

  // Fetch overview/stats
  const overview = useFetcherData({
    endpoint: "/api/nexus",
    params: {
      module: "OVERVIEW",
      action: "get",
    },
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      <section>
        <h2>Assets</h2>
        {assets.loading ? (
          <p>Loading...</p>
        ) : (
          <p>Total: {assets.data?.data?.total || 0}</p>
        )}
      </section>

      <section>
        <h2>Products</h2>
        {products.loading ? (
          <p>Loading...</p>
        ) : (
          <p>Total: {products.data?.data?.total || 0}</p>
        )}
      </section>

      <section>
        <h2>Orders</h2>
        {orders.loading ? (
          <p>Loading...</p>
        ) : (
          <p>Total: {orders.data?.data?.total || 0}</p>
        )}
      </section>

      <section>
        <h2>Overview</h2>
        {overview.loading ? (
          <p>Loading...</p>
        ) : (
          <pre>{JSON.stringify(overview.data?.data, null, 2)}</pre>
        )}
      </section>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Search with Debounce
// ============================================================================
import { useState, useEffect } from "react";

export function SearchAssetExample() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, loading, load } = useFetcherData({
    endpoint: "/api/nexus",
    autoLoad: false,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        load({
          module: "INVENTORY_ASSET",
          action: "get",
          search: searchTerm,
          page: 0,
          size: 20,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search assets..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border p-2 rounded"
      />

      {loading && <p>Searching...</p>}

      {data?.success && (
        <div>
          <p>Found {data.data?.total || 0} results</p>
          <ul>
            {data.data?.items?.map((asset: any) => (
              <li key={asset.id}>{asset.asset_name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Delete with Confirmation
// ============================================================================
export function DeleteAssetExample({ assetId }: { assetId: number }) {
  const { data, loading, load } = useFetcherData({
    endpoint: "/api/nexus",
    method: "POST",
    autoLoad: false,
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this asset?")) {
      load({
        module: "INVENTORY_ASSET",
        action: "delete",
        id: assetId,
      });
    }
  };

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Deleting..." : "Delete Asset"}
      </button>
      {data?.success && <p className="text-green-600">Deleted successfully!</p>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Paginated List with Controls
// ============================================================================
export function PaginatedInventoryExample() {
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, loading, reload } = useFetcherData({
    endpoint: "/api/nexus",
    params: {
      module: "INVENTORY_ASSET",
      action: "get",
      page,
      size: pageSize,
    },
  });

  const totalPages = Math.ceil((data?.data?.total || 0) / pageSize);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2>Inventory Assets</h2>
        <button onClick={reload}>Refresh</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="space-y-2">
            {data?.data?.items?.map((asset: any) => (
              <div key={asset.id} className="border p-3 rounded">
                <h3>{asset.asset_name}</h3>
                <p>Category: {asset.category}</p>
                <p>Status: {asset.status}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Form Submission with Validation
// ============================================================================
export function AssetFormExample() {
  const [formData, setFormData] = useState({
    asset_name: "",
    category: "",
    purchase_date: "",
    location: "",
    total_value: "",
    total_unit: "1",
  });

  const { data, loading, load } = useFetcherData({
    endpoint: "/api/nexus",
    method: "POST",
    autoLoad: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.asset_name || !formData.category) {
      alert("Please fill in required fields");
      return;
    }

    load({
      module: "INVENTORY_ASSET",
      action: "create",
      ...formData,
    });
  };

  // Reset form on success
  useEffect(() => {
    if (data?.success) {
      setFormData({
        asset_name: "",
        category: "",
        purchase_date: "",
        location: "",
        total_value: "",
        total_unit: "1",
      });
    }
  }, [data]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Asset Name"
        value={formData.asset_name}
        onChange={(e) =>
          setFormData({ ...formData, asset_name: e.target.value })
        }
        required
      />

      <select
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        required
      >
        <option value="">Select Category</option>
        <option value="Electronics">Electronics</option>
        <option value="Furniture">Furniture</option>
        <option value="Vehicle">Vehicle</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Asset"}
      </button>

      {data?.success && (
        <p className="text-green-600">Asset created successfully!</p>
      )}
    </form>
  );
}

// ============================================================================
// EXAMPLE 10: TypeScript with Strong Typing
// ============================================================================
interface InventoryAsset {
  id: number;
  asset_name: string;
  category: string;
  purchase_date: string;
  location: string;
  status: string;
  total_value: number;
  total_unit: number;
}

interface NexusResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    size: number;
  };
  meta: {
    module: string;
    action: string;
    timestamp: string;
  };
}

export function TypedInventoryExample() {
  const { data, loading, error } = useFetcherData<
    NexusResponse<InventoryAsset>
  >({
    endpoint: "/api/nexus",
    params: {
      module: "INVENTORY_ASSET",
      action: "get",
      page: 0,
      size: 10,
    },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Typed Inventory Assets</h2>
      <p>Total: {data?.data?.total}</p>
      <ul>
        {data?.data?.items?.map((asset) => (
          <li key={asset.id}>
            {asset.asset_name} - Rp {asset.total_value.toLocaleString()}
          </li>
        ))}
      </ul>
      <p className="text-sm text-gray-500">
        Last updated: {data?.meta?.timestamp}
      </p>
    </div>
  );
}
