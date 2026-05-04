# AI Project Context: API Integration Guide

This document provides a summary of the current API integration architecture to ensure consistent implementation by AI agents and developers.

## 🏗️ Architecture Overview

The project uses a structured multi-layer API system designed for maintainability and scalability.

### 1. Core Layer (`lib/api/core`)
- **APIProvider**: A robust builder pattern utility for executing API requests.
  - **Features**: Built-in **retry logic** (exponential backoff), **timeout handling** (15s default), and standardized error parsing.
  - **Builder Usage**: `await APIProvider(session).Endpoint("POST", "action", "table").Data(payload).Result()`
  - **Direct Usage**: `await APIProvider(session, options).Result()` (for simple use cases)
  - It handles authentication headers automatically when `session` is provided.
- **callApi**: Legacy foundational fetcher. Use `APIProvider` instead.

### 2. Business Logic Layer (`lib/api/modules/*.ts`)
- **Static Modules**: Entities like `OrderAPI`, `ProductAPI`, etc., encapsulate server-side logic.
- **Purpose**: They map high-level application requests to specific database operations (select, insert, update, bulk-insert).
- **Central Export**: All modules are aggregated in `lib/api/index.ts` under the common `API` object.
- **Usage**: Primarily used in Remix **Loaders** and **Actions**.

### 3. Nexus Protocol (`lib/nexus-client.ts`)
- **Builder Pattern**: The `nexus()` function provides a fluent API to build URLs for client-side data fetching.
- **Endpoint**: `/api/nexus?module=MODULE_NAME&action=ACTION_NAME&...`
- **Utility**: Includes `NexusPresets` (list, getById, search) and `NexusHelpers` for type-safe endpoint construction.

### 4. Data Fetching Hooks (`hooks/use-fetcher-data.tsx`)
- **Reactive Fetching**: React components use `useFetcherData` for client-side queries.
- **Integration**: Typically paired with `nexus()` builder.
  ```tsx
  const { data, loading } = useFetcherData({
    endpoint: nexus().module("ORDERS").action("get").params({ status: "pending" }).build()
  });
  ```

---

## 🛠️ Implementation Guidelines

For any future task involving API consumption, follow these rules:

### ✅ How to Consume API
1. **In Loaders/Actions**: Use the centralized `API` hub.
   - **Protocol**: Always pass `session` (containing `user` and `token`) to the API module methods.
   - **Pattern**: `await API.MODULE_NAME.methodName({ session, req: { body: data } })`
   - **Example**: `await API.ORDERS.update({ session, req: { body: { id, status } } })`
2. **In Components**: Use `useFetcherData` with the `nexus()` builder.
   - **Advantage**: Handles loading states and reactive updates.
   - **Constraint**: Do NOT hardcode URL strings.
3. **Form Submissions**: Use Remix `Form` or `fetcher.submit` to trigger route `action`, which then calls the server-side `API` module.

### ✅ How to Add/Modify API Logic
1. **Entity Logic**: Place all database-specific logic (where clauses, column selection, joins) inside the corresponding file in `lib/api/modules/`.
2. **Consistency**: Maintain the established pattern:
   - `get`: For selection/listing (supports pagination, search, filters).
   - `create`: For insertions (handles ID generation, defaults).
   - `update`: For modifications.
   - `delete`: For soft/hard deletions.
3. **Data Protection**: Ensure server-side computations (like subtotal/total calculations) are performed in the `API` module rather than relying solely on client-provided values.

### ❌ Anti-Patterns to Avoid
- **Direct Fetch**: Never use the `fetch` API directly in components or routes.
- **Logic Fragmentation**: Do not write complex database filtering or mapping logic directly in route `loaders` or `actions`. Move it to the `API` module.
- **Hardcoded Query Param Keys**: Use the `nexus()` params method instead of string concatenation.

## 📁 File Structure Reference
- `/app/lib/api/modules/`: Individual entity logic.
- `/app/lib/api/index.ts`: Central API hub.
- `/app/lib/nexus-client.ts`: Nexus protocol builder.
- `/app/hooks/use-fetcher-data.tsx`: Client-side fetching hook.

---

## 🗄️ Database Schema: `kinn6844_convections`

### 📋 Core Tables
- **accounts**: `id, uid, created_on, modified_on, deleted_on, code, name, ref_account_number, ref_account_holder, is_bank, group_code, group_type (asset, liability, equity, income, expense), group_name, is_editable`
- **orders**: `id, uid, order_number, institution_id, institution_name, institution_abbr, institution_domain, payment_status (none, unpaid, paid, down_payment, refunded, cancelled), payment_method, payment_reference, payment_proof, payment_proof_uploaded_on, payment_detail, payment_journal_code, dp_payment_method, dp_payment_detail, dp_payment_proof, dp_payment_proof_uploaded_on, dp_payment_journal_code, payment_due_date, discount_code, discount_type, discount_value, tax_percent, tax_value, shipping_fee, other_fee, subtotal, total_amount, dp_amount, grand_total, order_type (package, id_card, lanyard, custom, service), order_date, deadline, status (ordered, confirmed, in_production, qc, ready, shipped, delivered, done, rejected, cancelled, pending), status_printed, notes, images, drive_folder_id, pic_name, pic_phone, review, rating, shipping_address, shipping_contact, created_by, created_on, modified_on, deleted_on, is_archive, is_portfolio, is_sponsor, is_kkn, kkn_source, kkn_period, kkn_year, is_personal, kkn_type, kkn_detail`
- **order_items**: `id, order_number, product_id, category_id, category_name, price_rule_id, price_rule_min_qty, price_rule_value, variant_id, variant_name, variant_price, variant_final_price, product_name, product_type (single, package, material, custom, addon), qty, unit_price, discount_type, discount_value, tax_percent, subtotal, discount_total, tax_value, total_after_tax, notes, created_on, modified_on, deleted_on`
- **products**: `id, category_id, category_name, uid, created_on, modified_on, deleted_on, code, name, image, description, type (single, package, material), show_in_dashboard, subtotal, hpp_price, discount_value, tax_fee, other_fee, total_price`
- **users**: `id, created_on, modified_on, deleted, fullname, email, role (admin, user, manager, staff, developer, ceo), session_token, session_expired, is_active`
- **user_auth**: `id, user_id, email, password_hash, email_verified, last_login, failed_attempt, locked_until, session_token_hash, session_expired_at, session_ip, session_user_agent, created_on, modified_on`

### 📋 Supporting Entities
- **account_groups**: `id, uid, created_on, modified_on, deleted_on, code, name, level, parent_id`
- **account_ledgers**: `id, uid, created_on, modified_on, deleted_on, group_code, group_name, coa_code, coa_name, debit, credit, balance`
- **account_ledger_journals**: `id, uid, journal_code, journal_number, journal_date, description, created_on, modified_on, deleted_on`
- **account_ledger_mutations**: `id, journal_code, trx_code, trx_date, ledger_id, account_code, account_name, category, notes, receipt_url, debit, credit, created_on, modified_on, deleted_on`
- **assets**: `id, asset_name, category, purchase_date, location, status (Good, Damaged, Maintenance), total_value, total_unit, created_on, modified_on, deleted_on`
- **bank_account**: `id, bank_name, account_number, holder_name, created_on, modified_on, deleted_on`
- **cms_contents**: `id, title, slug, image, image_gallery, description, link, type (highlight-event, news, hero-section, testimonial, partner, cta-banner, stats), seq, total_order, value, suffix, icon_type, promotion_type, is_active, created_on, modified_on, deleted`
- **commodities**: `id, uid, component_id, code, name, unit, conversion_factor, base_price, created_on, modified_on, deleted_on`
- **components**: `id, code, name, unit, stock_qty, requirement_per_pkt, created_on, modified_on, deleted_on`
- **discount_codes**: `id, created_on, modified_on, deleted_on, code, name, description, discount_type (percentage, amount), discount_value, max_discount_amount, min_order_amount, valid_from, valid_until, user_limit, active`
- **employees**: `id, name, structural, phone, status (active, inactive, on_leave), created_on, modified_on, deleted_on`
- **employee_attendances**: `id, employee_id, employee_name, presence_date, time_in, time_out, location_lat_in, location_long_in, selfie_path, presence_status (present, permit, sick, absent), created_on, modified_on, deleted_on`
- **employee_salaries**: `id, employee_id, employee_name, base_salary, allowances, payment_type (monthly, daily), created_on, modified_on, deleted_on`
- **employee_salary_slips**: `id, employee_id, employee_name, period, payment_type, work_days_count, paid_base_salary, variable_allowances, deductions, net_salary, payment_status (pending, paid, failed), created_on, modified_on, deleted_on`
- **institutions**: `id, uid, deleted_on, created_on, modified_on, name, abbr`
- **institution_domains**: `id, deleted_on, created_on, modified_on, institution_id, domain, is_primary`
- **order_twibbon_assignments**: `id, order_trx_code, unique_code, twibbon_template_id, twibbon_template_name, category (idcard, lanyard), public_url_link, created_on, modified_on, deleted_on`
- **order_upload_files**: `id, code, order_number, folder_id, folder_name, folder_purpose (id_card_front, id_card_back, lanyard), product_id, product_name, file_type (front, back, lanyard), file_url, file_name, created_on, deleted_on`
- **order_upload_folders**: `id, uid, order_number, folder_name, parent_id, level, product_id, product_name, purpose (id_card_front, id_card_back, lanyard, sablon_front, sablon_back), created_by, created_on, modified_on, deleted_on`
- **product_categories**: `id, name, description, default_drive_folders, idx_idcard_front, idx_idcard_back, idx_lanyard, idx_sablon_depan, idx_sablon_belakang, created_on, modified_on, deleted_on`
- **product_components**: `id, created_on, modified_on, deleted_on, product_id, commodity_id, commodity_name, qty, unit_price, subtotal`
- **product_package_items**: `id, package_id, package_name, product_id, product_name, qty, unit_price, discount, subtotal, note, seq, created_on, modified_on, deleted_on`
- **product_price_rules**: `id, uid, product_id, min_qty, price, created_on, modified_on, deleted_on`
- **product_variants**: `id, uid, product_id, variant_name, base_price, is_default, created_on, modified_on, deleted_on`
- **purchase_orders**: `id, created_on, modified_on, deleted_on, order_number, supplier_id, supplier_name, status (pending, approved, received, cancelled), order_date, received_date, shipping_cost, admin_fee, discount_amount`
- **purchase_order_items**: `id, created_on, modified_on, deleted_on, po_number, supplier_id, commodity_id, commodity_name, qty, unit, unit_price`
- **settings**: `id, key, value, description, created_on, modified_on, deleted_on`
- **stock_logs**: `id, trx_code, direction (IN, OUT), category, order_trx_code, supplier_id, total_item_qty, total_item_price, discount_value, admin_cost, shipping_cost, sablon_supplier_id, sablon_kebutuhan_per_meter, sablon_cost, sablon_discount_value, sablon_admin_cost, sablon_shipping_cost, final_amount, laba_bersih, kaos_payment_proof_paid, kaos_payment_proof_dp, sablon_payment_proof_paid, sablon_payment_proof_dp, payment_status (none, unpaid, paid, down_payment), description, created_on, modified_on, deleted_on`
- **stock_log_items**: `id, stock_log_id, supplier_id, order_trx_code, product_id, direction (IN, OUT), commodity_id, commodity_name, is_commodity_parent, category, movement_type (consumption, purchase, return), qty, needs_per_meter, supplier_price, selling_price, price_per_unit, subtotal, created_on, deleted_on`
- **suppliers**: `id, uid, created_on, modified_on, deleted_on, name, category (id_card_with_lanyard, cotton_combed_premium), cotton_combed_category (kaos, sablon), price_s_xl, price_2xl, price_3xl, price_4xl, price_5xl, price_long_sleeve, price_per_meter, type (online, offline), address, location, phone, external_link`
- **supplier_commodities**: `id, parent_id, level, supplier_id, supplier_name, commodity_id, commodity_name, category, qty, current_stock, unit, unit_price, capacity_per_unit, is_package, is_affected_side, price, modified_on, deleted_on, created_on`
- **testimonials**: `id, order_number, institution_name, name, rating, comment, status (pending, approved, rejected), created_on, modified_on`
- **x_design_templates**: `id, name, category, image_url, layout_rules, style_mode, created_at, updated_at`
- **x_shirt_colors**: `id, name, image_url, created_on, modified_on, deleted_on`
- **x_twibbon_templates**: `id, name, category (twibbon-idcard, twibbon-lanyard), base_image, rules, style_mode, created_on, modified_on, deleted_on`
- **login_logs**: `id, user_id, email, ip_address, success, created_on`

---

## 🚀 Recommended Modular API Architecture (Future Improvement)

To achieve a higher level of maintainability and developer ergonomics, the following modular structure is recommended for future refactors.

### 1. Unified Interface Gateways
Consolidate all modules into a strictly typed `Nexus` gateway. This avoids importing multiple individual API files and provides better IDE auto-completion.
- **Pattern**: `const { data } = useNexus('ORDERS', 'getByID', { id: 123 })`

### 2. Domain-Driven Type Safety
Instead of passing raw objects to the API modules, use shared TypeScript interfaces (Entities/DTOs) for every request and response.
- **Location**: `/app/types/api/*.ts` or `/app/lib/api/schemas/`
- **Benefit**: Ensures that the client and server are always in sync, significantly reducing runtime "Property not found" errors.

### 3. Middleware-Enhanced API Provider
Refactor the `APIProvider` to support an "Interceptor" pattern (similar to Axios or Fetch interceptors).
- **Core Interceptors**:
  - `AuthInterceptor`: Automatically attaches session tokens to every request.
  - `TelemetryInterceptor`: Centralized logging and error reporting (e.g., to Telegram/Sentry).
  - `CacheInterceptor`: Transparently handles client-side caching for `GET` requests.

### 4. Semantic Action Mapping
Move away from generic `table` and `action` strings in frontend code. Use semantic, named method calls in the API modules to define clear business intent.
- **Current**: `API.ORDERS.update({ action: 'change_status', ... })`
- **Recommended**: `API.ORDERS.markAsShipped(orderId)` or `API.ORDERS.processPayment(payload)`

### 5. Reactive State Management
Integrate a reactive caching layer (like `TanStack Query`) to wrap the existing `Nexus` calls. This provides built-in support for:
- **SWR (Stale-While-Revalidate)**: Instant UI updates with background synchronization.
- **Auto-Retries**: Intelligent retry logic for transient network failures.
- **Infinite Scrolling**: Standardized pagination handling.

