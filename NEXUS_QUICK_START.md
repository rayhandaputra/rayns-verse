# 🚀 API Nexus - Quick Start Guide

One API route to rule them all! Access all your API modules through a single, powerful endpoint.

## 📦 What You Get

```
✅ app/routes/api.nexus.tsx          - Main API route
✅ app/hooks/use-fetcher-data.ts     - Custom React hook
✅ app/lib/nexus-client.ts           - Helper utilities & builders
✅ app/lib/nexus-client.types.ts     - TypeScript types
✅ Complete examples & documentation
```

## 🎯 The Simplest Example

```tsx
import { useFetcherData } from "~/hooks/use-fetcher-data";

function MyComponent() {
  const { data, loading } = useFetcherData({
    endpoint: "/api/nexus?module=INVENTORY_ASSET&action=get&page=0&size=10"
  });

  if (loading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

## 🔥 The Better Way (With Builder)

```tsx
import { nexus } from "~/lib/nexus-client";
import { useFetcherData } from "~/hooks/use-fetcher-data";

function MyComponent() {
  const endpoint = nexus()
    .module("INVENTORY_ASSET")
    .action("get")
    .param("page", 0)
    .param("size", 10)
    .build();

  const { data, loading } = useFetcherData({ endpoint });

  if (loading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

## 💪 Common Patterns

### 1. List with Filters
```tsx
const { data, loading } = useFetcherData({
  endpoint: nexus()
    .module("INVENTORY_ASSET")
    .action("get")
    .params({
      page: 0,
      size: 10,
      category: "Electronics",
      status: "Good"
    })
    .build()
});
```

### 2. Search
```tsx
const { data, loading } = useFetcherData({
  endpoint: nexus()
    .module("INVENTORY_ASSET")
    .action("get")
    .param("search", "laptop")
    .build()
});
```

### 3. Create (POST)
```tsx
const { data, loading, load } = useFetcherData({
  endpoint: "/api/nexus",
  method: "POST",
  autoLoad: false
});

const handleCreate = () => {
  load({
    module: "INVENTORY_ASSET",
    action: "create",
    asset_name: "New Laptop",
    category: "Electronics",
    total_value: 15000000
  });
};
```

### 4. Update (POST)
```tsx
const { data, loading, load } = useFetcherData({
  endpoint: "/api/nexus",
  method: "POST",
  autoLoad: false
});

const handleUpdate = (id: number) => {
  load({
    module: "INVENTORY_ASSET",
    action: "update",
    id,
    status: "Maintenance"
  });
};
```

### 5. Delete (POST)
```tsx
const { data, loading, load } = useFetcherData({
  endpoint: "/api/nexus",
  method: "POST",
  autoLoad: false
});

const handleDelete = (id: number) => {
  load({
    module: "INVENTORY_ASSET",
    action: "delete",
    id
  });
};
```

## 🎨 Using Presets (Even Easier!)

```tsx
import { NexusPresets } from "~/lib/nexus-client";

// List
const endpoint = NexusPresets.list("INVENTORY_ASSET", 0, 10).build();

// Search
const endpoint = NexusPresets.search("INVENTORY_ASSET", "laptop").build();

// Get by ID
const endpoint = NexusPresets.getById("INVENTORY_ASSET", 123).build();

// Create
const config = NexusPresets.create("INVENTORY_ASSET").toFetcherConfig("POST");

// Update
const endpoint = NexusPresets.update("INVENTORY_ASSET", 123).build();

// Delete
const endpoint = NexusPresets.delete("INVENTORY_ASSET", 123).build();
```

## 🌟 Using Helpers (The Easiest!)

```tsx
import { NexusHelpers } from "~/lib/nexus-client";

// Inventory Assets
const endpoint = NexusHelpers.inventoryAssets.list({
  category: "Electronics",
  page: 0,
  size: 10
});

// Products
const endpoint = NexusHelpers.products.search("laptop");

// Orders
const endpoint = NexusHelpers.orders.list(0, 20);

// Employees
const endpoint = NexusHelpers.employees.search("john");
```

## 📘 Available Modules

All modules from `~/lib/api` are available:

- `INVENTORY_ASSET` - Inventory assets
- `PRODUCT` - Products
- `ORDERS` - Orders
- `EMPLOYEE` - Employees
- `COMMODITY` - Commodities
- `SUPPLIER` - Suppliers
- `OVERVIEW` - Dashboard stats
- `USER` - Users
- `INSTITUTION` - Institutions
- And many more...

## 🎯 TypeScript Support

```tsx
import type {
  NexusResponse,
  PaginatedResponse,
  InventoryAsset
} from "~/lib/nexus-client";

type Response = NexusResponse<PaginatedResponse<InventoryAsset>>;

const { data } = useFetcherData<Response>({
  endpoint: nexus()
    .module("INVENTORY_ASSET")
    .action("get")
    .build()
});

// data is now fully typed!
const assets = data?.data?.items; // InventoryAsset[]
const total = data?.data?.total;  // number
```

## 📚 Need More Examples?

Check out these files:
- `app/routes/api.nexus.example.tsx` - 10 detailed examples
- `app/routes/api.nexus.demo.tsx` - Full working demo
- `app/routes/api.nexus.README.md` - Complete documentation

## 🎉 That's It!

You now have a powerful, reusable API system. No more creating individual routes for each module!

**Old way:** Create 20+ route files
**New way:** Use one Nexus route for everything! ✨

---

Made with ❤️ for better developer experience
