# Security Specification — KINAU ID ERP

## 🔐 Authentication & Session

### Session Management
- **Method:** Cookie-based session via `iron-session`
- **Storage:** Server-side encrypted cookie
- **Expiry:** Configurable (default: 24h)
- **Rotation:** Session token rotated on login

### Auth Flow
1. User submits credentials → `POST /api/nexus` (module: USER_AUTH, action: login)
2. Server validates against `user_auth.password_hash` (bcrypt)
3. On success → set encrypted session cookie + update `session_token_hash`
4. All subsequent requests → middleware extracts session → attaches to `APIProvider`

### Route Protection
- **Guard:** `app/middleware/auth.ts` — protects all `/app/*` routes
- **Public routes:** `/`, `/login`, `/register`, `/catalog/*`, `/order/*` (customer-facing)
- **Server-only modules:** `user.server.ts`, `user_auth.server.ts` — never exposed to browser

---

## 🛡️ Data Invariants

1. Every table MUST have `id`, `created_on`, `modified_on`, `deleted`/`deleted_on` (soft-delete)
2. User can only access data scoped to their role (`admin`, `staff`, `manager`, `ceo`)
3. `deleted_on` / `deleted` records are excluded from all SELECT queries by default
4. Financial mutations (ledger, journal) are append-only — no UPDATE/DELETE on committed entries
5. Order status transitions follow a strict lifecycle (cannot skip states)
6. Payment proof uploads are immutable once `payment_status` = `paid`

---

## 🚫 The "Dirty Dozen" — Deny Cases

| # | Attack Vector | Mitigation |
| :--- | :--- | :--- |
| 1 | Direct API call without Bearer token | 401 Unauthorized (PHP middleware) |
| 2 | SQL injection via filter operators | Parameterized queries in PHP backend (PDO) |
| 3 | Mass UPDATE/DELETE without `where` | API rejects update/delete without `where` clause |
| 4 | XSS via order `notes` or `description` | React auto-escapes; no `dangerouslySetInnerHTML` |
| 5 | CSRF on form submissions | Session cookie + same-origin policy (Remix) |
| 6 | Privilege escalation (staff → admin) | Role checked server-side in every module |
| 7 | File upload > 20MB or malicious type | PHP validates size + extension whitelist |
| 8 | Accessing other user's session | Session token hashed + IP/UA binding in `user_auth` |
| 9 | Brute force login | `failed_attempt` counter + `locked_until` (5 attempts) |
| 10 | URL parameter tampering | `crypto-js` encryption for sensitive params |
| 11 | Agent API abuse (raw SQL) | Dual-auth required (`Bearer` + `x-agent-key`) |
| 12 | Accessing `AgentAPI` from browser | `.server.ts` suffix — bundler excludes from client |

---

## 🔑 API Security Layers

### Layer 1 — Transport
- HTTPS only (enforced by hosting)
- No sensitive data in URL query params (use POST body)

### Layer 2 — Authentication
- `Authorization: Bearer <API_KEY>` on every request
- Session token validated per-request via `generateHeader(session)`

### Layer 3 — Authorization
- Role-based access in route middleware
- Module-level permission checks in `app/nexus/modules/*.ts`

### Layer 4 — Input Validation
- Zod schemas for form validation (`app/schemas/`)
- PHP backend validates all incoming data types
- `where` clause mandatory for UPDATE/DELETE

### Layer 5 — Agent Bridge (Elevated Access)
- Additional `x-agent-key` header required
- Server-only file (`.server.ts`) — cannot be imported in browser bundle
- Intended for AI agents and admin tooling only

---

## 📋 Security Checklist for New Features

- [ ] Route protected by auth middleware?
- [ ] Role check in module (not just route)?
- [ ] Input validated with Zod schema?
- [ ] No `dangerouslySetInnerHTML` without sanitization?
- [ ] Sensitive params encrypted with `crypto-js`?
- [ ] File uploads validated (type + size)?
- [ ] No secrets in client-side code?
- [ ] `deleted_on`/`deleted` filter in all SELECT queries?
- [ ] Financial data calculations server-side only?
- [ ] No `console.log` with sensitive data?

---

## 🔄 Incident Response

### If API Key Compromised
1. Rotate `API_KEY` in PHP `config/index.php`
2. Update `app/nexus/core/config.ts`
3. Rotate `AGENT_KEY` if agent bridge affected
4. Review `login_logs` for unauthorized access

### If Session Hijacked
1. Invalidate all sessions: update `session_token_hash` for affected user
2. Force re-login via `locked_until` timestamp
3. Check `session_ip` and `session_user_agent` for anomalies
