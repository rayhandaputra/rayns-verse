# Customer Orders Active List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock customer orders page with a real API-backed list and detail view that surfaces the fields customers need: twibbon share link, nota download, production status, payment status, timestamps, and final design previews.

**Architecture:** Keep the work inside `app/routes/customer.orders.tsx` so the customer shell and navigation stay unchanged. Add a route loader that uses `APIProviderV2` to fetch orders and order items, then render a mobile-first list/detail experience from the returned data. Reuse existing print/download routes for invoice output and the existing public drive link pattern for twibbon sharing.

**Tech Stack:** React Router loader data, `APIProviderV2`, Tailwind utility classes, existing `CustomerPaymentProofUpload`, existing `app/orders/:id/download` PDF route.

---

### Task 1: Load Orders From API

**Files:**
- Modify: `app/routes/customer.orders.tsx`

- [ ] **Step 1: Write the data loader**

```ts
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const authData = await getOptionalUser(request);
  if (!authData?.user) throw redirect("/login");

  const user = typeof authData.user === "string" ? JSON.parse(authData.user) : authData.user;
  if (user?.role !== "customer") throw redirect("/app/overview");

  const orders = await APIProviderV2({
    user: authData.user,
    token: authData.token,
  })
    .Table("orders")
    .Select({
      page: 0,
      size: 50,
      columns: [
        "id",
        "order_number",
        "institution_name",
        "institution_domain",
        "payment_status",
        "payment_proof",
        "dp_payment_proof",
        "payment_proof_uploaded_on",
        "dp_payment_proof_uploaded_on",
        "status",
        "status_printed",
        "images",
        "created_on",
        "order_date",
        "deadline",
        "pic_name",
        "pic_phone",
        "total_amount",
        "grand_total",
        "dp_amount",
      ],
      include: [
        {
          table: "order_items",
          alias: "order_items",
          foreign_key: "order_number",
          reference_key: "order_number",
          columns: ["id", "product_name", "qty", "subtotal", "product_type", "notes"],
          where: { deleted_on: "null" },
        },
      ],
      orderBy: ["created_on", "DESC"],
    })
    .Result();

  return Response.json({ ordersData: orders?.items || [], total: orders?.total_items || 0 });
};
```

- [ ] **Step 2: Verify the route compiles with loader data**

Run: `npx react-router typegen`
Expected: route types regenerate without new errors from `customer.orders.tsx`.

- [ ] **Step 3: Keep auth and role handling local to the route**

```ts
// Use getOptionalUser + redirect instead of touching unrelated shell routes.
```

- [ ] **Step 4: Commit the data layer change**

```bash
git add app/routes/customer.orders.tsx
git commit -m "feat(customer): load customer orders from api"
```

### Task 2: Render Mobile-First Orders UI

**Files:**
- Modify: `app/routes/customer.orders.tsx`

- [ ] **Step 1: Replace mock arrays with loader-backed rendering**

```tsx
const { ordersData } = useLoaderData<typeof loader>();
const orders = useMemo(() => normalizeOrders(ordersData), [ordersData]);
```

- [ ] **Step 2: Build order cards with the requested fields**

```tsx
// Each card should show:
// - no pesanan
// - nama instansi/pemesan
// - created_on
// - status produksi
// - status pembayaran
// - CTA bagikan link twibbon
// - CTA cetak nota
// - preview desain akhir dari images
```

- [ ] **Step 3: Add detail state from search params**

```tsx
// Keep ?detail=<id> and render a detail panel with:
// - production status
// - payment status
// - order metadata
// - item list from order_items
// - final design preview
```

- [ ] **Step 4: Wire the twibbon and nota actions**

```tsx
const twibbonLink = `${window.location.origin}/public/drive-link/${order.institution_domain || order.order_number}`;
window.open(`/app/orders/${order.id}/download`, "_blank");
```

- [ ] **Step 5: Verify UI against the existing customer palette**

Run: `npx react-router typegen`
Expected: no regressions in customer route typing.

- [ ] **Step 6: Commit the UI change**

```bash
git add app/routes/customer.orders.tsx
git commit -m "feat(customer): show api-backed order list"
```

### Task 3: Keep Proof Uploads Available in Detail

**Files:**
- Modify: `app/routes/customer.orders.tsx`

- [ ] **Step 1: Preserve the reusable proof upload controls inside detail**

```tsx
<CustomerPaymentProofUpload kind="dp" ... />
<CustomerPaymentProofUpload kind="paid" ... />
```

- [ ] **Step 2: Make sure upload previews use the order data returned from API**

```tsx
// Read dp_payment_proof, payment_proof, and their timestamps from the order row.
```

- [ ] **Step 3: Verify the detail layout still works on mobile**

Run: `npx react-router typegen`
Expected: no new type errors from the detail view.

- [ ] **Step 4: Commit the final integration**

```bash
git add app/routes/customer.orders.tsx
git commit -m "feat(customer): add order detail actions and proofs"
```

