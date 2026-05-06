# Project Analysis & Context Summary

This document provides a high-level summary of the current project architecture, folder organization, and recent updates to maintain consistency across AI agents and developers.

## 🚀 Technical Stack
- **Framework**: [React Router v7](https://reactrouter.com) (formerly Remix).
- **Runtime**: Node.js v22.
- **Styling**: Tailwind CSS v4 with specialized utility plugins.
- **Type Safety**: TypeScript with strict mapping for core and supporting entities.
- **API Protocol**: Nexus Client (Builder Pattern) for client-server communication.

## 📁 Folder Structure & Modularization
The project follows a **Modular Clean Architecture**, separating concerns into clear domains:

- **`/app/components/core`**: Essential layout components (Top bar, Sidebar, Breadcrumbs).
- **`/app/components/features`**: Domain-specific logic and UI (Orders, Products, Finance, Drive, etc.).
- **`/app/components/shared`**: Reusable UI components, tables, modals, and shared layout sections.
- **`/app/nexus`**: The centralized business logic layer, containing modular API definitions.
- **`/app/types`**: Unified TypeScript interfaces, now including `core-entities.ts` and `supporting-entities.ts`.

## 🏗️ API Architecture & Patterns
The project uses a two-tier API communication system:

### 1. Backend/Server Layer (`APIProvider`)
Located in `/app/nexus/core/api-provider.ts`. Used primarily in Loaders and Actions. It follows a robust **Builder Pattern**:
- **Usage**: `await APIProvider(session).Endpoint("POST", "action", "table").Data(payload).Result()`
- **Features**: Automatic auth header handling, exponential backoff retry logic, and standardized error parsing.

### 2. Frontend/Client Layer (`Nexus Client`)
Used in React components for reactive fetching via `useFetcherData`.
- **Usage**: paired with `nexus()` builder: `nexus().module("MOD").action("act").params({ id }).build()`

## 🛣️ Routing Strategy
Routes are located in `/app/routes` and are designed to be **highly concise** (typically < 150 lines). 
- **Pattern**: Routes act as thin "page controllers" that primarily use:
  - Hooks from `/app/hooks` or `/app/components/features/.../use-logic.ts`.
  - Feature components from `/app/components/features`.
- **Naming**: Dot-notation is used for nested path mapping (e.g., `app.finance.account.tsx`).

## ✨ Recent Updates
1. **Type System Overhaul**: Created `supporting-entities.ts` and `core-entities.ts` to map all database tables defined in `AGENTS.md`.
2. **Component Synchronization**: Improved `ProductListFeature` and other feature components to avoid cascading renders and improve state synchronization.
3. **API Pattern Enforcement**: Standardized the use of `APIProvider().Data().Result()` for server-side requests.
4. **Nexus Protocol Migration**: Continued moving legacy logic into the modular `/app/nexus/modules` system.

---
*Last Updated: 2026-05-06*
