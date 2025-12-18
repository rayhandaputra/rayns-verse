# API Nexus - Universal API Gateway

**Nexus** adalah API route yang powerful dan reusable untuk menghubungkan client-side components dengan server-side API modules. Dengan Nexus, kamu tidak perlu membuat route API terpisah untuk setiap module - cukup satu route untuk semua kebutuhan!

## 🌟 Fitur Utama

- **Dynamic Module Routing** - Akses semua API modules melalui satu endpoint
- **Auto Authentication** - Handling authentication otomatis
- **GET & POST Support** - Support untuk read dan write operations
- **Query Parameter Forwarding** - Parameter otomatis di-forward ke API modules
- **Type-Safe** - Full TypeScript support dengan type inference
- **Error Handling** - Error handling yang comprehensive
- **Builder Pattern** - Fluent interface untuk build queries yang complex

## 🚀 Quick Start

### Basic Usage

```tsx
import { useFetcherData } from "~/hooks/use-fetcher-data";

function MyComponent() {
  const { data, loading, error } = useFetcherData({
    endpoint: "/api/nexus",
    params: {
      module: "INVENTORY_ASSET",
      action: "get",
      page: 0,
      size: 10
    }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* render data */}</div>;
}
```

### With Nexus Builder (Recommended)

```tsx
import { nexus } from "~/lib/nexus-client";
import { useFetcherData } from "~/hooks/use-fetcher-data";

function MyComponent() {
  const endpoint = nexus()
    .module("INVENTORY_ASSET")
    .action("get")
    .param("page", 0)
    .param("size", 10)
    .param("category", "Electronics")
    .build();

  const { data, loading } = useFetcherData({ endpoint });

  return <div>{/* render data */}</div>;
}
```

## 📚 API Reference

### URL Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `module` | Yes | API module name (e.g., "INVENTORY_ASSET", "PRODUCT") |
| `action` | Yes | Action to perform (e.g., "get", "create", "update", "delete") |
| `auth` | No | Require authentication (default: true) |
| `*` | No | Any additional parameters passed to the API module |

### Available Modules

Semua modules dari `API` object bisa diakses:

- `INVENTORY_ASSET` - Inventory asset management
- `PRODUCT` - Product catalog
- `ORDERS` - Order management
- `EMPLOYEE` - Employee data
- `COMMODITY` - Commodity/raw materials
- `SUPPLIER` - Supplier management
- `OVERVIEW` - Dashboard overview/statistics
- Dan semua modules lainnya dari `~/lib/api`

## 💡 Usage Examples

### 1. GET Request - List dengan Pagination

```tsx
const { data, loading } = useFetcherData({
  endpoint: "/api/nexus",
  params: {
    module: "INVENTORY_ASSET",
    action: "get",
    page: 0,
    size: 10
  }
});
```

### 2. GET Request - Search & Filter

```tsx
const { data, loading } = useFetcherData({
  endpoint: "/api/nexus",
  params: {
    module: "INVENTORY_ASSET",
    action: "get",
    search: "laptop",
    category: "Electronics",
    status: "Good"
  }
});
```

### 3. POST Request - Create

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
    purchase_date: "2024-01-01",
    location: "Office",
    total_value: 15000000,
    total_unit: 1
  });
};
```

### 4. POST Request - Update

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
    status: "Maintenance",
    location: "Repair Center"
  });
};
```

### 5. POST Request - Delete

```tsx
const { data, loading, load } = useFetcherData({
  endpoint: "/api/nexus",
  method: "POST",
  autoLoad: false
});

const handleDelete = (id: number) => {
  if (confirm("Delete this item?")) {
    load({
      module: "INVENTORY_ASSET",
      action: "delete",
      id
    });
  }
};
```

## 🛠️ Nexus Builder API

### Basic Methods

```tsx
import { nexus } from "~/lib/nexus-client";

// Chain methods untuk build query
const endpoint = nexus()
  .module("INVENTORY_ASSET")      // Set module
  .action("get")                  // Set action
  .param("page", 0)              // Add single param
  .params({ size: 10, status: "Good" })  // Add multiple params
  .requireAuth(true)             // Require authentication
  .build();                      // Build URL string
```

### Presets

Pre-configured builders untuk operasi umum:

```tsx
import { NexusPresets } from "~/lib/nexus-client";

// List dengan pagination
const listEndpoint = NexusPresets.list("INVENTORY_ASSET", 0, 10).build();

// Get by ID
const getEndpoint = NexusPresets.getById("INVENTORY_ASSET", 123).build();

// Search
const searchEndpoint = NexusPresets.search("INVENTORY_ASSET", "laptop").build();

// Create
const createConfig = NexusPresets.create("INVENTORY_ASSET").toFetcherConfig("POST");

// Update
const updateEndpoint = NexusPresets.update("INVENTORY_ASSET", 123).build();

// Delete
const deleteEndpoint = NexusPresets.delete("INVENTORY_ASSET", 123).build();
```

### Helpers

Quick helpers untuk modules yang sering digunakan:

```tsx
import { NexusHelpers } from "~/lib/nexus-client";

// Inventory Assets
const endpoint = NexusHelpers.inventoryAssets.list({
  category: "Electronics",
  page: 0,
  size: 10
});

// Products
const productEndpoint = NexusHelpers.products.search("laptop");

// Orders
const orderEndpoint = NexusHelpers.orders.getById("ORD-123");

// Employees
const employeeEndpoint = NexusHelpers.employees.list(0, 20);
```

## 🎯 Advanced Patterns

### Multiple Data Sources in One Component

```tsx
function Dashboard() {
  const assets = useFetcherData({
    endpoint: nexus().module("INVENTORY_ASSET").action("get").build()
  });

  const products = useFetcherData({
    endpoint: nexus().module("PRODUCT").action("get").build()
  });

  const orders = useFetcherData({
    endpoint: nexus().module("ORDERS").action("get").build()
  });

  return (
    <div>
      <Section data={assets} title="Assets" />
      <Section data={products} title="Products" />
      <Section data={orders} title="Orders" />
    </div>
  );
}
```

### Search with Debounce

```tsx
function SearchComponent() {
  const [search, setSearch] = useState("");
  const { data, loading, load } = useFetcherData({
    endpoint: "/api/nexus",
    autoLoad: false
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        load({
          module: "INVENTORY_ASSET",
          action: "get",
          search,
          page: 0,
          size: 20
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}
```

### TypeScript with Strong Typing

```tsx
import type { NexusResponse, PaginatedResponse } from "~/lib/nexus-client";

interface Asset {
  id: number;
  asset_name: string;
  category: string;
  total_value: number;
}

function TypedComponent() {
  const { data } = useFetcherData<NexusResponse<PaginatedResponse<Asset>>>({
    endpoint: nexus().module("INVENTORY_ASSET").action("get").build()
  });

  // data is now fully typed!
  const assets = data?.data?.items; // Asset[]
  const total = data?.data?.total;  // number
}
```

## 🔒 Authentication

By default, semua requests memerlukan authentication. Untuk disable:

```tsx
// Via params
const { data } = useFetcherData({
  endpoint: "/api/nexus",
  params: {
    module: "PRODUCT",
    action: "get",
    auth: "false"  // Disable auth
  }
});

// Via builder
const endpoint = nexus()
  .module("PRODUCT")
  .action("get")
  .requireAuth(false)
  .build();
```

## 📦 Response Format

Semua responses dari Nexus menggunakan format yang consistent:

```json
{
  "success": true,
  "data": {
    // Your actual data here
  },
  "meta": {
    "module": "INVENTORY_ASSET",
    "action": "get",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

Error response:

```json
{
  "success": false,
  "error": "Error message here",
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🎨 Best Practices

1. **Use Builder Pattern** - Gunakan `nexus()` builder untuk query yang complex
2. **Use Presets** - Gunakan `NexusPresets` untuk operasi standar
3. **Use Helpers** - Gunakan `NexusHelpers` untuk modules yang sering dipakai
4. **Type Your Data** - Selalu tambahkan TypeScript types untuk data responses
5. **Handle Loading States** - Selalu handle loading dan error states
6. **Debounce Searches** - Implementasi debounce untuk search inputs
7. **Reuse Configurations** - Extract reusable fetcher configurations

## 🆚 Nexus vs Traditional Routes

### Traditional Approach (Old)
```tsx
// Need to create: app/routes/api.inventory-assets.tsx
// Need to create: app/routes/api.products.tsx
// Need to create: app/routes/api.orders.tsx
// ... dan seterusnya untuk setiap module
```

### Nexus Approach (New) ✨
```tsx
// Satu file: app/routes/api.nexus.tsx
// Akses semua modules melalui query parameters!

useFetcherData({
  endpoint: "/api/nexus?module=INVENTORY_ASSET&action=get"
});

useFetcherData({
  endpoint: "/api/nexus?module=PRODUCT&action=get"
});

useFetcherData({
  endpoint: "/api/nexus?module=ORDERS&action=get"
});
```

## 📝 Notes

- Nexus menggunakan existing API modules di `~/lib/api`
- Tidak perlu membuat route baru untuk setiap module
- Support untuk GET (loader) dan POST (action)
- Auto-forwarding semua query/body parameters ke API modules
- Error handling built-in dengan proper status codes

## 🚀 Getting Started

1. Pastikan `useFetcherData` hook sudah tersedia
2. Import nexus utilities: `import { nexus, NexusHelpers } from "~/lib/nexus-client"`
3. Build endpoint dengan builder atau helpers
4. Use dengan `useFetcherData` hook
5. Enjoy! 🎉

---

**Happy coding with Nexus!** 🌟
