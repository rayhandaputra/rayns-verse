/**
 * API Nexus - Real World Demo Component
 *
 * Full-featured demo showing how to use Nexus in a real application
 * with CRUD operations, search, filters, and pagination.
 */

import { useState, useEffect } from "react";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus, NexusHelpers, NexusPresets } from "~/lib/nexus-client";
import type { NexusResponse, PaginatedResponse } from "~/lib/nexus-client";

// Type definitions
interface InventoryAsset {
  id: number;
  asset_name: string;
  category: string;
  purchase_date: string;
  location: string;
  status: string;
  total_value: number;
  total_unit: number;
  created_on: string;
}

type AssetListResponse = NexusResponse<{
  items: InventoryAsset[];
  total: number;
  page: number;
  size: number;
}>;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function InventoryManagementDemo() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        Inventory Management - API Nexus Demo
      </h1>

      <div className="space-y-8">
        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Inventory List */}
        <InventoryList />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD STATS - Multiple API calls at once
// ============================================================================
function DashboardStats() {
  // Fetch different categories simultaneously
  const electronics = useFetcherData<AssetListResponse>({
    endpoint: NexusHelpers.inventoryAssets.list({
      category: "Electronics",
      size: 0, // Just for count
    }),
  });

  const furniture = useFetcherData<AssetListResponse>({
    endpoint: NexusHelpers.inventoryAssets.list({
      category: "Furniture",
      size: 0,
    }),
  });

  const vehicles = useFetcherData<AssetListResponse>({
    endpoint: NexusHelpers.inventoryAssets.list({
      category: "Vehicle",
      size: 0,
    }),
  });

  const allAssets = useFetcherData<AssetListResponse>({
    endpoint: NexusHelpers.inventoryAssets.list({ size: 0 }),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Assets"
        value={allAssets.data?.data?.total || 0}
        loading={allAssets.loading}
        color="blue"
      />
      <StatCard
        title="Electronics"
        value={electronics.data?.data?.total || 0}
        loading={electronics.loading}
        color="purple"
      />
      <StatCard
        title="Furniture"
        value={furniture.data?.data?.total || 0}
        loading={furniture.loading}
        color="green"
      />
      <StatCard
        title="Vehicles"
        value={vehicles.data?.data?.total || 0}
        loading={vehicles.loading}
        color="orange"
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
  color,
}: {
  title: string;
  value: number;
  loading: boolean;
  color: string;
}) {
  const colors = {
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    green: "bg-green-100 text-green-800",
    orange: "bg-orange-100 text-orange-800",
  };

  return (
    <div className={`p-6 rounded-lg ${colors[color as keyof typeof colors]}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-3xl font-bold mt-2">
        {loading ? "..." : value.toLocaleString()}
      </div>
    </div>
  );
}

// ============================================================================
// INVENTORY LIST - With filters, search, and pagination
// ============================================================================
function InventoryList() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const pageSize = 10;

  // Build endpoint dynamically based on filters
  const endpoint = nexus()
    .module("INVENTORY_ASSET")
    .action("get")
    .param("page", page)
    .param("size", pageSize)
    .params({
      ...(search && { search }),
      ...(category && { category }),
      ...(status && { status }),
    })
    .build();

  const { data, loading, reload } = useFetcherData<AssetListResponse>({
    endpoint,
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, category, status]);

  const totalPages = Math.ceil((data?.data?.total || 0) / pageSize);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Inventory Assets</h2>
        <button
          onClick={reload}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
          <option value="Vehicle">Vehicle</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Retired">Retired</option>
        </select>
      </div>

      {/* Active Filters */}
      {(search || category || status) && (
        <div className="flex gap-2 mb-4">
          <span className="text-sm text-gray-600">Active filters:</span>
          {search && (
            <span className="px-2 py-1 bg-gray-200 rounded text-sm">
              Search: {search}
            </span>
          )}
          {category && (
            <span className="px-2 py-1 bg-gray-200 rounded text-sm">
              Category: {category}
            </span>
          )}
          {status && (
            <span className="px-2 py-1 bg-gray-200 rounded text-sm">
              Status: {status}
            </span>
          )}
          <button
            onClick={() => {
              setSearch("");
              setCategory("");
              setStatus("");
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 text-gray-500">Loading assets...</div>
      )}

      {/* Empty State */}
      {!loading && data?.data?.items?.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No assets found. Try adjusting your filters.
        </div>
      )}

      {/* Assets Table */}
      {!loading && data?.data?.items && data.data.items.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Asset Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.items.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asset.asset_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asset.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asset.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          asset.status === "Good"
                            ? "bg-green-100 text-green-800"
                            : asset.status === "Fair"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Rp {asset.total_value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:underline mr-3">
                        Edit
                      </button>
                      <button className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {page * pageSize + 1} to{" "}
              {Math.min((page + 1) * pageSize, data.data.total || 0)} of{" "}
              {data.data.total} results
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="px-4 py-2">
                Page {page + 1} of {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Metadata */}
      {data?.meta && (
        <div className="mt-4 text-xs text-gray-400">
          Last updated: {new Date(data.meta.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// QUICK ACTIONS - Create, Update, Delete examples
// ============================================================================
function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CreateAssetCard />
      <UpdateAssetCard />
      <DeleteAssetCard />
    </div>
  );
}

function CreateAssetCard() {
  const { data, loading, load } = useFetcherData({
    endpoint: "/api/nexus",
    method: "POST",
    autoLoad: false,
  });

  const handleCreate = () => {
    load({
      module: "INVENTORY_ASSET",
      action: "create",
      asset_name: "Demo Asset - " + new Date().toISOString(),
      category: "Electronics",
      purchase_date: new Date().toISOString().split("T")[0],
      location: "Demo Location",
      status: "Good",
      total_value: 1000000,
      total_unit: 1,
    });
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-2">Create Asset</h3>
      <p className="text-sm text-gray-600 mb-4">
        Create a new demo asset with sample data
      </p>
      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Demo Asset"}
      </button>
      {data?.success && (
        <p className="mt-2 text-sm text-green-600">Asset created successfully!</p>
      )}
    </div>
  );
}

function UpdateAssetCard() {
  const [assetId, setAssetId] = useState("");
  const { data, loading, load } = useFetcherData({
    endpoint: "/api/nexus",
    method: "POST",
    autoLoad: false,
  });

  const handleUpdate = () => {
    if (!assetId) return;

    load({
      module: "INVENTORY_ASSET",
      action: "update",
      id: Number(assetId),
      status: "Maintenance",
      location: "Repair Center",
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-2">Update Asset</h3>
      <p className="text-sm text-gray-600 mb-4">
        Update asset status to maintenance
      </p>
      <input
        type="number"
        placeholder="Asset ID"
        value={assetId}
        onChange={(e) => setAssetId(e.target.value)}
        className="w-full px-3 py-2 border rounded mb-2"
      />
      <button
        onClick={handleUpdate}
        disabled={loading || !assetId}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Updating..." : "Update Asset"}
      </button>
      {data?.success && (
        <p className="mt-2 text-sm text-blue-600">Asset updated successfully!</p>
      )}
    </div>
  );
}

function DeleteAssetCard() {
  const [assetId, setAssetId] = useState("");
  const { data, loading, load } = useFetcherData({
    endpoint: "/api/nexus",
    method: "POST",
    autoLoad: false,
  });

  const handleDelete = () => {
    if (!assetId) return;
    if (!confirm("Are you sure you want to delete this asset?")) return;

    load({
      module: "INVENTORY_ASSET",
      action: "delete",
      id: Number(assetId),
    });
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-2">Delete Asset</h3>
      <p className="text-sm text-gray-600 mb-4">
        Soft delete an asset (can be restored)
      </p>
      <input
        type="number"
        placeholder="Asset ID"
        value={assetId}
        onChange={(e) => setAssetId(e.target.value)}
        className="w-full px-3 py-2 border rounded mb-2"
      />
      <button
        onClick={handleDelete}
        disabled={loading || !assetId}
        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete Asset"}
      </button>
      {data?.success && (
        <p className="mt-2 text-sm text-red-600">Asset deleted successfully!</p>
      )}
    </div>
  );
}
