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

## 10. Automated testing (Playwright E2E)

A starter Playwright suite covers the key user-facing flows: login/role redirects, POS checkout
with receipt Print/Download, and the invoices list/detail views. These are **end-to-end smoke
tests** — they drive a real browser against your actual running frontend + backend, so both must
be up and seeded with demo data first.

### Setup
```bash
npm install
npx playwright install chromium    # downloads the browser Playwright drives

# In separate terminals, make sure both are already running:
#   backend:  python manage.py runserver          (see backend README)
#   frontend: npm run dev

npm run test:e2e        # headless run
npm run test:e2e:ui     # interactive UI mode — great for debugging a failing test
```

Tests log in with the seeded demo accounts (`python manage.py seed_demo_data` on the backend) —
`owner`, `manager1`, `cashier1`, `accountant1`, `pharmacist1`, same passwords as documented in the
backend README. The POS test also expects at least one medicine with stock at the cashier's
branch — run the CSV bulk import (`medicines_test_import.csv`, shared alongside this project) first
if your database is empty.

### What's covered
- `tests/e2e/auth.spec.ts` — every role logs in and lands on the correct page, sidebar shows only
  role-appropriate nav items, wrong password shows an inline error, session survives a refresh.
- `tests/e2e/pos.spec.ts` — search → add to cart → checkout → receipt modal shows Print/Download →
  cart resets; quantity `+` button respects the batch's available stock ceiling.
- `tests/e2e/invoices.spec.ts` — list renders (or shows the correct empty state), search filters
  correctly, opening an invoice shows Print/Download on the detail page.

### Why only these three flows
This is a **starter scaffold**, not full coverage of the 82-row manual test plan — it automates the
flows most valuable to catch regressions in (auth/routing, the revenue-critical POS flow, and the
newer print/download feature), while everything else (Inventory tabs, Suppliers, Finance, CRM,
Staff/Branches, and all Business-Logic cross-page number checks) stays in the manual spreadsheets
for now. Extend `tests/e2e/` following the same pattern as those pages get more automated coverage
— reuse the login block at the top of each `describe` and prefer `data-testid` attributes (see
`PosCart.tsx`'s `cart-qty-*` testids) over text/CSS selectors for anything likely to change wording.

## 11. Language toggle, first-login tour, and tooltips

### Urdu/English toggle
- Click the language button (top-right of any dashboard page, or top-right of the login page) to
  switch between English and Urdu instantly — no page reload.
- Choice persists in `localStorage` (`pharmacy_erp_locale`) so it's remembered on the next visit.
- All strings live in `lib/i18n/translations.ts` as two parallel dictionaries (`en` and `ur`) sharing
  one TypeScript type, so adding a key to one without the other is a compile error — you can't
  accidentally ship a half-translated key.
- **Currently translated**: Login page, Sidebar navigation, Topbar, Owner Dashboard (including a
  tooltip explaining each KPI), and the POS screen. Other pages (Inventory tabs beyond the labels
  already done, Suppliers, Finance, CRM, Staff, Branches, Invoices) still render in English — extend
  them by adding new keys to `translations.ts` and swapping hardcoded strings for
  `const { t } = useLanguage(); ... {t("your.new.key")}`, following the exact pattern already used in
  `app/(dashboard)/owner/page.tsx`.
- **Known limitation — not full RTL layout**: selecting Urdu sets `dir="rtl"` on the page (so Urdu
  text reads correctly right-to-left), but the sidebar, spacing, and icons are NOT yet mirrored — they
  use physical Tailwind utilities (`ml-`, `pr-`, etc.) rather than logical ones (`ms-`, `pe-`). Text is
  correct; pixel-perfect mirrored layout is a follow-up task (convert spacing utilities to logical
  properties and flip the sidebar to the right edge).

### First-login guided tour
- Automatically starts ~800ms after a user's very first login (tracked via
  `localStorage: pharmacy_erp_tour_seen_v1`), highlighting the nav items and controls relevant to
  their specific role (Owner sees Overview/Branches/Staff; Cashier sees POS/cart/search; etc.).
- Built with `react-joyride` (`components/tour/AppTour.tsx`), styled to match the emerald/glass theme.
- Steps are defined per-role in `components/tour/tourSteps.ts`, targeting elements via
  `data-tour="..."` attributes already placed on the Sidebar, Topbar branch switcher, POS search/cart,
  and the Inventory bulk-import button. Add a new step by adding a `data-tour` attribute to any
  element and a matching entry in `tourSteps.ts`.

### Help button (replay the tour anytime)
- Floating button, bottom-left of every dashboard page (`components/ui/HelpButton.tsx`).
- Opens a small menu with **"Replay tour"** (resets and restarts the guided tour) and the **language
  toggle** as a second, easy-to-find way to switch languages.

### Tooltips
- `components/ui/Tooltip.tsx` is a small, dependency-free hover/focus tooltip (300ms delay, keyboard
  accessible via focus). Wrap anything: `<Tooltip content="..."><button>...</button></Tooltip>`.
- Applied so far: every KPI tile on the Owner Dashboard (via `StatTile`'s new `tooltip` prop, explaining
  exactly what each number means and how it's calculated), the cart quantity +/- buttons and remove
  button in POS, and the language toggle. Extend the same pattern to other icon-only buttons or
  non-obvious controls elsewhere in the app as needed.

### Setup
```bash
npm install    # pulls in react-joyride (new dependency)
npm run dev
```
No backend changes are required for any of this — it's entirely a frontend feature.

## 12. Bulk import is now asynchronous

`components/inventory/BulkImportModal.tsx` was updated to match the backend's new async behavior:
uploading a CSV now gets an immediate `202 Accepted` + a `job_id` (instead of waiting for the whole
file to finish processing), and the modal polls `GET /api/inventory/medicines/bulk-import/<job_id>/status/`
every 1.5 seconds, showing a "Importing in the background…" state until the job reaches
`COMPLETED` or `FAILED`. You can safely close the modal mid-import — the job keeps running
server-side and the medicines list refreshes automatically once it finishes.
