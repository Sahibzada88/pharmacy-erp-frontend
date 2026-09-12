# Rahat Pharmacy — Chain ERP Frontend

A Next.js 14 (App Router) frontend for the Pharmacy Chain ERP backend — role-based
dashboards for **Owner, Branch Manager, Cashier, Accountant, and Pharmacist**, built
with a distinctive glassmorphism design system (not a generic template).

---

## 1. Design system

- **Colors**: Ink `#0B1220` (base), Emerald `#0F9D74` (primary/trust), Amber `#E8A33D`
  (accent/alerts), Mint `#B8F1DE` (success tint). Deliberately avoids the
  cream+terracotta and neon-on-black clichés — rooted in pharmacy/medical trust colors.
- **Type**: **Space Grotesk** for headlines & big KPI numbers (`font-display`),
  **IBM Plex Sans** for body/UI text (`font-sans`) — loaded via `next/font/google`
  in `app/layout.tsx`, no extra setup needed.
- **Glass surfaces**: `.glass`, `.glass-strong`, `.glass-edge` utility classes in
  `app/globals.css`. Panels float over an animated two-tone mesh gradient
  (`.mesh-bg`, also in `globals.css`) — the glass effect needs something
  translucent to show, so don't remove the mesh background.
- All reusable primitives live in `components/ui/`: `GlassCard`, `Button`, `Badge`,
  `StatTile` (hero KPI number), `Input`/`Select`/`Label`, `Modal`, `Tabs`,
  `DataTable`, `Toast` (via `toastSuccess()` / `toastError()`), `Skeleton`/`EmptyState`.

## 2. Project structure

```
app/
  layout.tsx            Root layout — fonts, AuthProvider, mesh background, Toaster
  page.tsx              Redirects to /login or the user's role home
  login/page.tsx         Login screen
  (dashboard)/
    layout.tsx           Auth guard + Sidebar/Topbar shell + branch-filter context
    owner/page.tsx        Owner/Manager analytics dashboard (charts + KPIs)
    pos/page.tsx           Cashier POS/checkout
    inventory/page.tsx     Medicines, batches, low-stock, expiry
    suppliers/page.tsx     Suppliers, purchase orders, amounts owed
    finance/page.tsx       Bank accounts (manual), expenses, P&L
    crm/page.tsx            Customers
    staff/page.tsx          Team management (owner/manager)
    branches/page.tsx       Branch management (owner only)
components/
  ui/          Design-system primitives (see above)
  layout/      Sidebar.tsx, Topbar.tsx
  charts/      SalesTrendChart.tsx (recharts area), PaymentMixChart.tsx (donut)
  pos/         MedicineSearch.tsx, PosCart.tsx
lib/
  api.ts       Axios instance — attaches JWT, auto-refreshes on 401
  auth.tsx     AuthProvider/useAuth() context, ROLE_LABELS, ROLE_HOME
  types.ts     TypeScript interfaces matching the Django REST API
  utils.ts     formatCurrency/formatDate/cn/etc.
```

## 3. Role → default landing page

| Role       | Lands on   | Sidebar sees |
|------------|-----------|--------------|
| OWNER      | `/owner`  | Everything, chain-wide, branch switcher in topbar |
| MANAGER    | `/owner`  | Everything, own branch only |
| CASHIER    | `/pos`    | POS, Customers |
| ACCOUNTANT | `/finance`| Suppliers, Finance (chain-wide via branch switcher) |
| PHARMACIST | `/inventory` | Inventory only |

This is enforced by the `Sidebar` component's `NAV_ITEMS[].roles` list and each
page's own use of the logged-in user's role — it mirrors the backend's permission
classes, but remember **the backend is the real security boundary**; this frontend
routing is just UX convenience, not a substitute for backend permissions (which
your Django app already enforces).

## 4. Local setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local -> NEXT_PUBLIC_API_URL=http://localhost:8000 (your Django backend)
npm run dev
```

Open `http://localhost:3000`. Make sure your Django backend is running (see the
backend's own README) and `CORS_ALLOWED_ORIGINS` in the backend's `.env` includes
`http://localhost:3000`.

Log in with the seeded demo accounts (from `python manage.py seed_demo_data` on the
backend): `owner / Owner@12345`, `manager1 / Manager@12345`, `cashier1 / Cashier@12345`,
`accountant1 / Accountant@12345`, `pharmacist1 / Pharmacist@12345`.

## 5. How auth works

- JWT `access`/`refresh` tokens are stored in `localStorage` (see `lib/api.ts`
  `tokenStore`). Every request via the shared `api` axios instance auto-attaches
  `Authorization: Bearer <access>`.
- On a `401`, the interceptor automatically calls `/api/auth/token/refresh/` once,
  retries the original request, and queues any other requests that failed at the
  same time so they don't each trigger their own refresh call.
- If refresh also fails (refresh token expired/blacklisted), the user is redirected
  to `/login`.
- `AuthProvider` (`lib/auth.tsx`) exposes `useAuth()` → `{ user, loading, login, logout }`.

## 6. Connecting to the Django backend

This frontend expects the backend's DRF endpoints exactly as built in the
`pharmacy_erp_backend` project (JWT login at `/api/auth/login/`, analytics under
`/api/analytics/...`, etc.). If you rename any backend URLs, update the matching
calls in the page files (they call `api.get("/inventory/medicines/")` etc. directly
— there's no extra backend-specific abstraction layer to keep this simple).

The **owner/manager/accountant branch switcher** (top-right, in `Topbar.tsx`) sends
`?branch=<id>` on analytics/list calls; when unset, the backend defaults to
chain-wide data for OWNER/ACCOUNTANT and to the user's own branch for everyone else
— this matches the backend's `resolve_branch_id()` logic in `apps/analytics/utils.py`.

## 7. Deploying to Vercel

1. Push this repo to GitHub (as its own repo, or a `frontend/` folder in a monorepo
   with the backend — either works).
2. In Vercel: **New Project → Import** this repo.
3. Set the environment variable `NEXT_PUBLIC_API_URL` to your deployed Railway
   backend URL (e.g. `https://your-backend.up.railway.app`).
4. Deploy. Vercel auto-detects Next.js — no extra build config needed.
5. Back on the Railway backend, add your Vercel domain to `CORS_ALLOWED_ORIGINS`
   and `ALLOWED_HOSTS`.

## 8. Extending this frontend

- **Add a new page**: create `app/(dashboard)/your-page/page.tsx`, add it to
  `NAV_ITEMS` in `components/layout/Sidebar.tsx` with the roles allowed to see it,
  and add a title/subtitle entry to `PAGE_META` in `app/(dashboard)/layout.tsx`.
- **Add a new chart**: drop it in `components/charts/`, following the dark-theme
  recharts styling pattern in `SalesTrendChart.tsx` (transparent tooltips, muted
  axis text, gradient area fills).
- **Add a new list+create page**: copy the pattern in `crm/page.tsx` (search input
  → `DataTable` → "Add" button → `Modal` with a small form) — it's the fastest way
  to stay visually consistent.
- Charts use **recharts**; icons use **lucide-react**; toasts use the tiny
  `zustand` store in `components/ui/Toast.tsx` — call `toastSuccess("...")` or
  `toastError("...")` from anywhere after an API call.

## 9. Known scope notes

- Purchase-order creation (multi-line-item form) and supplier payment recording are
  wired on the backend and visible as read-only lists here; add create modals for
  them following the same pattern as `AddSupplierModal` if you need them in the UI
  (the backend endpoints — `POST /api/suppliers/purchase-orders/` and
  `POST /api/suppliers/payments/` — are already fully functional).
- Sale returns (`POST /api/sales/returns/`) and stock transfers/adjustments are
  backend-ready but not yet exposed as dedicated frontend actions — same note applies.
