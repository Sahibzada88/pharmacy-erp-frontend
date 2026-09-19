# Rahat Pharmacy Chain ERP Frontend

## Interview Questions and Answers

This guide is based on the current implementation of this repository. Answers are written in practical Hinglish so they can be spoken naturally in an interview.

## 1. Project Overview

### Q1. Apne project ke baare mein batayein.

**Answer:**

Yeh **Rahat Pharmacy Chain ERP** ka frontend hai, jo Next.js 14 App Router, React 18 aur TypeScript par bana hai. Iska purpose multiple pharmacy branches ke operations ko manage karna hai: inventory, batches aur expiry, POS sales, invoices, suppliers, finance, CRM, staff, branches aur analytics. Different users ke liye role-based dashboards hain: Owner, Branch Manager, Cashier, Accountant aur Pharmacist. Frontend Django REST API backend se Axios ke through communicate karta hai.

### Q2. Is project ka tech stack kya hai?

**Answer:**

- Next.js 14 with App Router
- React 18 and TypeScript
- Axios for API requests
- Tailwind CSS for styling
- Recharts for analytics charts
- Zustand for toast state
- React Joyride for the first-login guided tour
- jsPDF and jspdf-autotable for invoice PDF generation
- Lucide React for icons
- Playwright for end-to-end testing

Package versions aur scripts [package.json](package.json) mein defined hain.

### Q3. Project ka folder structure explain karein.

**Answer:**

- `app/`: routes, layouts aur page-level screens
- `components/ui/`: reusable design-system primitives, jaise Button, Modal, DataTable, Badge aur Toast
- `components/pos/`: medicine search, cart aur invoice receipt
- `components/layout/`: Sidebar aur Topbar
- `components/charts/`: sales aur payment charts
- `components/tour/`: role-specific guided tour
- `lib/api.ts`: shared Axios client, JWT attachment aur refresh handling
- `lib/auth.tsx`: authentication context aur role routing
- `lib/types.ts`: API data ke TypeScript interfaces
- `lib/i18n/`: English/Urdu translations aur language context
- `tests/e2e/`: Playwright smoke tests

## 2. Next.js and React Architecture

### Q4. App Router kyun use kiya gaya hai?

**Answer:**

App Router se layouts aur nested route groups naturally organize hote hain. `(dashboard)` route group URL mein extra segment add kiye bina dashboard pages ko shared authenticated layout de raha hai. Root layout fonts, providers, background aur toaster ko globally mount karta hai. Dashboard layout authentication guard, Sidebar, Topbar, branch context, HelpButton aur AppTour ko shared shell ke roop mein provide karta hai.

Relevant files: [app/layout.tsx](app/layout.tsx) aur [app/(dashboard)/layout.tsx](app/(dashboard)/layout.tsx).

### Q5. `(dashboard)` parentheses ka kya purpose hai?

**Answer:**

Parentheses Next.js route group ko indicate karti hain. Iska matlab folder organization aur shared layout ke liye use hota hai, lekin URL ka part nahi banta. Isliye `app/(dashboard)/pos/page.tsx` ka URL `/pos` hai, `/dashboard/pos` nahi.

### Q6. Kaun se components Client Components hain aur kyun?

**Answer:**

Jo components hooks, browser APIs, event handlers ya local state use karte hain unmein `"use client"` hai. Examples: authentication context, login form, POS cart, Sidebar, Topbar aur language context. In components ko `useState`, `useEffect`, `localStorage`, router navigation ya click handlers ki zarurat hoti hai. Pure reusable rendering components, jaise `DataTable`, client directive ke bina bhi render ho sakte hain.

### Q7. Authentication guard kaise kaam karta hai?

**Answer:**

`AuthProvider` localStorage se access token read karta hai. Agar token milta hai to `/auth/me/` call karke current user load karta hai. Dashboard layout loading complete hone ke baad user missing ho to `/login` par redirect karta hai. Root page logged-in user ko `ROLE_HOME` mapping ke hisaab se redirect karta hai. Login successful hone par tokens store hote hain aur user context update hota hai.

Implementation: [lib/auth.tsx](lib/auth.tsx).

### Q8. Role-based navigation kaise implement hui hai?

**Answer:**

Sidebar mein `NAV_ITEMS` array hai. Har item ke saath allowed `roles` list hai. Current user ke role ke basis par items filter hote hain. Example: Pharmacist ko Inventory milti hai, Cashier ko POS, Customers aur Invoices, aur Owner ko almost saare modules. Default landing pages `ROLE_HOME` mein defined hain.

Important point: frontend role filtering sirf UX hai. Real authorization backend ke permission classes enforce karte hain; user browser se hidden route manually open kar sakta hai, isliye backend ko hamesha security boundary rakhna chahiye.

### Q9. JWT token refresh kaise handle kiya gaya hai?

**Answer:**

Shared Axios instance request interceptor se access token ko `Authorization: Bearer ...` header mein attach karta hai. Response interceptor `401` receive hone par refresh token se `/auth/token/refresh/` call karta hai, new access token save karta hai aur failed request retry karta hai. Agar multiple requests ek saath `401` dein, `isRefreshing` flag aur `pendingQueue` un requests ko queue karte hain, taaki refresh endpoint ko repeatedly call na karna pade. Refresh fail hone par tokens clear karke login par redirect hota hai.

Implementation: [lib/api.ts](lib/api.ts).

### Q10. Token localStorage mein rakhne ke security trade-off kya hain?

**Answer:**

Is approach ka benefit simple client-side persistence aur page refresh ke baad session restore hai. Risk yeh hai ki XSS vulnerability ki situation mein JavaScript localStorage token read kar sakta hai. Production-grade alternative httpOnly, Secure, SameSite cookies ho sakte hain. Agar localStorage use karna ho to strict CSP, input escaping, dependency hygiene, short token lifetime aur refresh-token rotation important hain.

### Q11. Dashboard layout branch filter ko kaise share karta hai?

**Answer:**

Dashboard layout `BranchFilterContext` create karta hai aur `branchId` plus `setBranchId` provide karta hai. Topbar branch switcher se selected branch update hoti hai. Child pages `useBranchFilter()` se value read karke API query params mein `branch` bhejti hain. Owner ke liye selected branch required ho sakti hai, jabki doosre roles apni assigned branch use karte hain.

Implementation: [app/(dashboard)/layout.tsx](app/(dashboard)/layout.tsx).

## 3. API, Data and State Management

### Q12. Kya project mein React Query ya Redux use hua hai?

**Answer:**

Nahi. Local page state ke liye React `useState`, derived values ke liye `useMemo`, aur cross-component concerns ke liye React Context use hua hai. Toast notifications ke liye lightweight Zustand store use hota hai. API calls page/component level par direct shared Axios client se kiye gaye hain. Yeh approach small-to-medium frontend ke liye simple hai, lekin bade scale par server-state library jaise TanStack Query caching, retries aur invalidation ko better manage kar sakti hai.

### Q13. API response errors ko user-friendly kaise banaya gaya hai?

**Answer:**

`apiErrorMessage()` Axios error ko inspect karta hai aur DRF ke `errors` envelope, string, array ya field-wise object ko readable message mein convert karta hai. Mutation failures `toastError()` ke through display hote hain, jabki login error inline form message ke roop mein show hota hai.

### Q14. TypeScript types ka kya role hai?

**Answer:**

`lib/types.ts` mein `User`, `Branch`, `Medicine`, `Batch`, `Sale`, `SaleItem`, `SalePayment`, `CartLine`, `OwnerDashboardSummary` aur pagination types defined hain. Isse API data consume karte waqt property names aur data shape compile time par verify hoti hai. Money values backend se strings aa sakti hain, isliye UI calculations se pehle `parseFloat` ya formatting helper use karna padta hai.

### Q15. Pagination ko kaise handle kiya gaya hai?

**Answer:**

`PaginatedResponse<T>` interface `count`, `next`, `previous` aur `results` define karta hai. Pages commonly `res.data.results ?? res.data` use karte hain, isliye paginated aur plain-array response dono tolerate hote hain. Current UI mein next/previous pagination controls broadly exposed nahi hain; large datasets ke liye server-side pagination UI add karna useful improvement hoga.

### Q16. Loading aur empty states kaise handle kiye gaye hain?

**Answer:**

Reusable `DataTable` loading par skeleton rows render karta hai aur empty rows par `EmptyState`. Search cards mein bhi skeleton aur empty state branches hain. Mutation buttons `loading` state se disabled/loading appearance lete hain. Isse user ko blank screen ke bajaye current request state visible rehti hai.

## 4. POS and Pharmacy Business Logic

### Q17. POS checkout ka complete flow explain karein.

**Answer:**

1. Cashier medicine name, generic name, SKU ya barcode se search karta hai.
2. Medicine select karne par active batches fetch hote hain.
3. Batch ke remaining stock ko check karke cart line banti hai.
4. Cart subtotal quantity, unit price aur discount se calculate karta hai.
5. Cash/card/bank transfer/mobile wallet payment select hota hai.
6. Frontend `/sales/checkout/` ko items aur payments payload ke saath POST karta hai.
7. Successful response se invoice receipt modal open hota hai aur cart reset hota hai.
8. Receipt se print ya PDF download kiya ja sakta hai.

Relevant files: [app/(dashboard)/pos/page.tsx](app/(dashboard)/pos/page.tsx), [components/pos/MedicineSearch.tsx](components/pos/MedicineSearch.tsx), [components/pos/PosCart.tsx](components/pos/PosCart.tsx).

### Q18. FEFO kya hai aur project mein kaise use hua hai?

**Answer:**

FEFO ka matlab **First Expiry, First Out** hai. Pharmacy inventory mein jaldi expire hone wala batch pehle sell karna chahiye. Medicine search batches ko `expiry_date` ascending order mein request karta hai aur available list ka first batch select karta hai. Isse wastage reduce hoti hai. Final stock validation backend par bhi honi chahiye, kyunki frontend choice concurrent sales ke beech stale ho sakti hai.

### Q19. Cart quantity stock se zyada kaise prevent hoti hai?

**Answer:**

`CartLine` mein `available_qty` store hota hai. Add karte waqt existing quantity ko batch ke `quantity_remaining` se compare kiya jata hai. Plus button `Math.min(line.available_qty, line.quantity + 1)` use karta hai. E2E test bhi plus button ko repeatedly click karke verify karta hai ki quantity stock ceiling cross nahi karti.

### Q20. Frontend stock validation sufficient kyun nahi hai?

**Answer:**

Frontend validation user experience improve karti hai, lekin trusted security ya data consistency layer nahi hai. Do cashiers same last unit ko ek saath sell kar sakte hain. Backend checkout transaction ko atomic stock decrement, row locking ya equivalent concurrency control ke saath validate karna chahiye. Frontend ko backend ke final error ko display karna chahiye.

### Q21. POS owner aur normal branch user ke liye alag kaise behave karta hai?

**Answer:**

Owner ke liye effective branch selected branch filter se aati hai. Agar Owner ne branch select nahi ki, POS informative message show karta hai. Manager, Cashier ya Pharmacist apni `user.branch` use karte hain. Checkout payload mein Owner ke selected branch ko explicitly `branch` ke roop mein bheja jata hai.

### Q22. Invoice PDF aur print kaise implement hua hai?

**Answer:**

`InvoiceReceipt` sale data ko display karta hai aur `downloadInvoicePdf` ya `printInvoicePdf` helpers call karta hai. PDF generation `jsPDF` aur `jspdf-autotable` par based hai. Receipt mein invoice number, branch, cashier, customer, items, discounts, tax, total aur payment badges show hote hain.

## 5. Inventory, Finance and Other Modules

### Q23. Inventory module ke main features kya hain?

**Answer:**

Inventory mein medicines catalog, batches, low-stock report aur expiring batches ke tabs hain. Medicines search ki ja sakti hain, authorized roles new medicine add ya CSV bulk import kar sakte hain. Batches expiry date se ordered hote hain. Low-stock report reorder level ke against data dikhata hai, aur expiry report next 90 days ke batches ko highlight karti hai.

### Q24. Inventory mein permissions kaise decide hoti hain?

**Answer:**

`canManage` Owner, Manager aur Pharmacist ke liye true hota hai. In roles ko add medicine aur bulk import controls milte hain. API calls backend authorization par depend karti hain, isliye UI condition ke saath backend permissions bhi required hain.

### Q25. Finance page mein `Promise.allSettled` kyun use hua hai?

**Answer:**

Finance overview ek saath P&L aur bank balance fetch karta hai. `Promise.allSettled` use karne se ek request fail hone par doosri successful response phir bhi render ho sakti hai. Ismein har result ka status check karke available data state mein set kiya gaya hai. Agar all-or-nothing consistency required hoti to `Promise.all` use karna possible tha, lekin dashboard partial data ke saath useful reh sakta hai.

### Q26. Finance module real bank integration hai?

**Answer:**

Nahi. Current implementation manual bank bookkeeping hai. Bank accounts, balances aur expenses backend records se load hote hain; live bank provider integration nahi hai. Interview mein is limitation ko clearly mention karna chahiye, kyunki UI mein bank balance dikhne ka matlab real-time banking sync nahi hai.

### Q27. Branch switcher sab users ko kyun nahi dikhaya jata?

**Answer:**

Current implementation Owner aur Accountant ke liye branch list load karta hai aur switcher show karta hai. In roles ko chain-wide ya selected-branch reporting chahiye. Cashier, Manager aur Pharmacist generally assigned branch ke scope mein operate karte hain, isliye unke liye global switcher unnecessary ya unsafe ho sakta hai.

## 6. Reusable UI and UX

### Q28. Design system kaise organize kiya gaya hai?

**Answer:**

Reusable UI primitives `components/ui` mein hain: `Button`, `Input`, `GlassCard`, `Badge`, `Modal`, `Tabs`, `DataTable`, `StatTile`, `Skeleton`, `Tooltip` aur `Toast`. Pages in primitives ko compose karti hain, jis se visual consistency aur future changes easier hote hain. Tailwind utilities, shared colors, fonts aur glass surface classes `app/globals.css` mein defined hain.

### Q29. `DataTable` ko generic kaise banaya gaya hai?

**Answer:**

`DataTable<T>` generic type parameter use karta hai. Columns mein `header` aur `accessor(row)` function hota hai, isliye table kisi bhi domain object ko render kar sakta hai. `keyField`, loading state, empty message aur optional row click behavior reusable props hain.

### Q30. Toast state ke liye Zustand kyun reasonable hai?

**Answer:**

Toast ko kisi specific page tree ke andar rakhna zaroori nahi hai. Zustand ka small global store kisi bhi API callback se `toastSuccess()` ya `toastError()` call allow karta hai. `Toaster` store subscribe karta hai aur har toast ko 4.5 seconds baad dismiss karta hai. Yeh Redux se kaafi lightweight solution hai.

### Q31. Responsive behavior kaise handle hua hai?

**Answer:**

Tailwind responsive utilities use hui hain. Desktop par Sidebar visible hai, mobile par Topbar menu se overlay Sidebar open hoti hai. POS desktop par search aur cart do columns mein hain aur small screens par single column. Tables horizontal overflow container mein wrapped hain.

## 7. Internationalization and Accessibility

### Q32. English/Urdu language toggle kaise kaam karta hai?

**Answer:**

`LanguageProvider` locale state manage karta hai, `t("path.to.key")` dotted translation lookup karta hai, aur choice `localStorage` mein persist hoti hai. Urdu select hone par `document.documentElement.lang = "ur"` aur `dir = "rtl"` set hota hai. English aur Urdu dictionaries same TypeScript shape share karti hain, isliye missing keys compile-time par catch ho sakti hain.

### Q33. Current i18n limitation kya hai?

**Answer:**

Urdu text aur document direction support hai, lekin complete visual RTL mirroring abhi nahi hai. Sidebar positioning aur kuch spacing physical Tailwind utilities, jaise `ml-` aur `pr-`, par based hain. Full RTL ke liye logical utilities, direction-aware layout aur right-side Sidebar treatment add karna hoga. Kuch pages abhi English fallback text use karti hain.

### Q34. Tooltips aur guided tour kaise implement hua hai?

**Answer:**

Tooltip dependency-free component hai jo hover/focus par delayed help text deta hai. Guided tour React Joyride se bana hai. Joyride ko `dynamic(..., { ssr: false })` se load kiya gaya hai kyunki kuch versions import time par `document` access karte hain. Steps role ke hisaab se generate hote hain aur `data-tour` attributes ke through targets locate karte hain.

### Q35. Accessibility improve karne ke liye kya check karenge?

**Answer:**

Main keyboard navigation, visible focus states, proper labels, icon-only buttons ke `aria-label`, modal focus trap, Escape handling, color contrast aur screen-reader announcements check karunga. Current code mein kuch tooltips aur labels hain, lekin every icon-only control ko explicit accessible name aur modal keyboard behavior ke liye audit karna useful hoga.

## 8. Testing

### Q36. Current automated tests kya cover karte hain?

**Answer:**

Playwright E2E tests teen important flows cover karte hain:

- AAuthentication: role redirects, wrong password, role-specific sidebar aur refresh ke baad session
- POS: medicine search, cart add, checkout, receipt Print/Download aur stock quantity ceiling
- Invoices: list/empty state, search filtering aur invoice detail Print/Download

Tests [tests/e2e/auth.spec.ts](tests/e2e/auth.spec.ts), [tests/e2e/pos.spec.ts](tests/e2e/pos.spec.ts) aur [tests/e2e/invoices.spec.ts](tests/e2e/invoices.spec.ts) mein hain.

### Q37. E2E tests ko backend aur seeded data ki zarurat kyun hai?

**Answer:**

Tests real browser ko running frontend aur Django backend ke against drive karte hain. Login accounts backend seed command se aate hain, aur POS test ko branch par medicine stock chahiye. Isliye tests isolated unit tests nahi hain; environment setup, CORS, backend availability aur deterministic seed data unki reliability ke liye important hain.

### Q38. Playwright config mein `fullyParallel: false` kyun hai?

**Answer:**

Tests shared seeded data aur stock use karte hain. Parallel execution se ek test doosre test ke data ko change kar sakta hai, especially POS checkout. Sequential execution test interference reduce karta hai, though long term mein isolated fixtures ya database reset se parallelism safely enable ki ja sakti hai.

### Q39. Project mein test coverage ka gap kya hai?

**Answer:**

Inventory tabs, supplier workflows, finance mutations, CRM, staff, branch management, language switching, guided tour, token refresh failure aur permission-denied API cases ke dedicated automated tests limited hain. Business logic cross-page number checks bhi add kiye ja sakte hain. Next priority critical mutations aur authorization edge cases honi chahiye.

## 9. Performance and Reliability

### Q40. Medicine search ko efficient kaise banaya gaya hai?

**Answer:**

Search input ke baad 300ms debounce hai, jis se har keystroke par API request nahi jaati. Selected medicine ke batches `batchCache` mein cache hote hain, isliye same medicine dobara select karne par repeat batch request avoid hoti hai. Further improvement ke liye request cancellation, pagination aur server-state caching add ki ja sakti hai.

### Q41. Search request race condition ko kaise handle karenge?

**Answer:**

Current debounce request count reduce karta hai, lekin slow network par purani request baad mein return karke newer results overwrite kar sakti hai. Isko Axios cancellation signal, request ID comparison, ya TanStack Query ke query-key based cancellation se fix karunga. Yeh ek realistic improvement hai, especially fast typing aur weak network cases mein.

### Q42. API requests mein error aur loading states ka risk kya hai?

**Answer:**

Kuch read requests `.then(...).finally(...)` use karti hain, lekin har page par `.catch()` user-facing error state ke liye consistently present nahi hai. Network failure par table empty ya stale lag sakta hai. Better pattern ek shared request state/error component, typed API hooks aur retry action hoga.

### Q43. Money calculations mein kya caution chahiye?

**Answer:**

JavaScript floating-point arithmetic currency ke liye exact nahi hoti. Current cart subtotal ko round karke two decimal places bheja jata hai, lekin financial correctness ke liye backend ko authoritative calculation karni chahiye. Frontend display ke liye decimal library ya integer minor units, jaise paisa/cents, safer approach hai.

## 10. Scenario-Based Questions

### Q44. Agar user ka access token expire ho jaye aur checkout request fail ho, to kya hoga?

**Answer:**

Axios response interceptor `401` detect karega, refresh token se new access token lega aur original checkout request ko retry karega. Agar refresh successful nahi hua to pending requests reject hongi, tokens clear honge aur user login page par redirect hoga. Checkout UI ko submitting state finally block se release karna chahiye, taaki button permanently stuck na rahe.

### Q45. Agar do cashiers same batch ki last unit sell karein to kya issue aa sakta hai?

**Answer:**

Dono clients same `available_qty` dekh sakte hain aur frontend dono ko checkout allow kar sakta hai. Backend transaction ko authoritative validation karni hogi. Database-level atomic decrement/row locking aur insufficient-stock response se overselling prevent hogi. Frontend error toast show karke cart ko refresh kar sakta hai.

### Q46. Naya dashboard page add karne ke steps kya honge?

**Answer:**

1. `app/(dashboard)/new-page/page.tsx` create karunga.
2. Page ko `NAV_ITEMS` mein allowed roles ke saath add karunga.
3. Page title/subtitle ko `PAGE_META_KEYS` aur translations mein add karunga.
4. Existing UI primitives aur shared `api` client reuse karunga.
5. Branch-scoped data ho to `useBranchFilter()` use karunga.
6. Loading, empty, error aur permission states add karunga.
7. Relevant Playwright flow test karunga.

### Q47. Agar backend endpoint ka URL change ho jaye to kya karenge?

**Answer:**

API calls pages mein direct endpoint strings use karti hain, isliye affected page files search karke URL update karna hoga. Better long-term improvement centralized typed API service/hooks banana hoga, jahan endpoint paths aur response mapping ek jagah maintain ho. Isse backend contract changes ka blast radius reduce hota hai.

### Q48. Agar page refresh ke baad login state lost ho jaye to debugging approach kya hogi?

**Answer:**

Pehle browser storage mein access/refresh keys check karunga. Phir `AuthProvider` ka initial `refreshUser()` call, `/auth/me/` response, Axios Authorization header aur refresh interceptor inspect karunga. Network tab mein 401/refresh sequence verify karunga. Playwright ka `refreshing the page keeps the user logged in` test is regression ko catch karna chahiye.

### Q49. Production deployment ke liye kya configuration chahiye?

**Answer:**

`NEXT_PUBLIC_API_URL` ko deployed Django backend URL par set karna hoga. Backend mein deployed frontend origin ko CORS allowlist aur domain ko allowed hosts mein add karna hoga. Build ke liye `npm run build`, serving ke liye `npm start`, aur Vercel deployment ke liye environment variable configure karna hoga. Production mein demo credentials aur verbose error leakage remove honi chahiye.

### Q50. Aap is project mein sabse pehle kya improve karenge?

**Answer:**

Priority order:

1. Token storage/security ko httpOnly cookie strategy ya hardened security policy ke saath review karunga.
2. API calls ko typed service/hooks mein centralize karke consistent loading/error/retry behavior dunga.
3. Sale checkout aur stock updates ke backend concurrency guarantees verify karunga.
4. Inventory, finance, suppliers, staff aur permission-denied flows ke tests add karunga.
5. Full Urdu translation aur proper RTL layout complete karunga.
6. Large lists ke liye server-side pagination, cancellation aur caching add karunga.

## 11. Quick Revision Sheet

### Important role routes

| Role | Default route | Main scope |
| --- | --- | --- |
| Owner | `/owner` | Chain-wide analytics, all modules, branch switcher |
| Manager | `/owner` | Own branch operations and management |
| Cashier | `/pos` | POS, customers and invoices |
| Accountant | `/finance` | Finance, suppliers, invoices and branch reporting |
| Pharmacist | `/inventory` | Inventory and stock workflows |

### Important interview keywords

`Next.js App Router`, `route group`, `Client Component`, `React Context`, `Axios interceptor`, `JWT refresh queue`, `role-based navigation`, `backend authorization`, `FEFO`, `stock ceiling`, `branch-scoped queries`, `Zustand`, `typed i18n`, `RTL`, `dynamic import with ssr false`, `Playwright E2E`, `Promise.allSettled`, `optimistic vs authoritative validation`, `currency precision`, `server-side pagination`.

### Strong closing statement

**Answer:**

Is project mein maine sirf screens nahi banayi, balki pharmacy domain ke workflows ko frontend architecture ke saath connect kiya: role-aware navigation, branch-aware reporting, expiry-sensitive inventory, stock-safe POS checkout, invoice generation, bilingual UI aur browser-level regression tests. Saath hi mujhe clear hai ki frontend permissions UX ke liye hain, jabki security aur transactional stock correctness backend ki responsibility hai.

## 12. Project Code Snippets

Neeche har interview question ke saath related real project pattern ka short snippet diya gaya hai. Interview mein snippet ka purpose explain karein, poora code yaad karna zaroori nahi.

### Q1. Project overview

```tsx
export const metadata: Metadata = {
	title: "Rahat Pharmacy · Chain ERP",
	description: "Multi-branch pharmacy management — inventory, POS, finance & analytics.",
};
```

### Q2. Tech stack

```json
{
	"next": "14.2.5",
	"react": "^18.3.1",
	"axios": "^1.7.2",
	"@playwright/test": "^1.45.0"
}
```

### Q3. Folder structure

```text
app/              # routes and layouts
components/ui/    # reusable UI primitives
lib/api.ts        # shared Axios client
tests/e2e/        # Playwright tests
```

### Q4. App Router

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return <html><body><AuthProvider>{children}</AuthProvider></body></html>;
}
```

### Q5. Route group

```text
app/(dashboard)/pos/page.tsx  ->  /pos
app/(dashboard)/layout.tsx    ->  shared dashboard layout
```

### Q6. Client Component

```tsx
"use client";

const [submitting, setSubmitting] = useState(false);
```

### Q7. Authentication guard

```tsx
useEffect(() => {
	if (!loading && !user) router.replace("/login");
}, [user, loading, router]);
```

### Q8. Role-based navigation

```tsx
const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
```

### Q9. JWT refresh queue

```ts
if (error.response?.status === 401 && !originalRequest._retry) {
	const { data } = await axios.post("/api/auth/token/refresh/", { refresh });
	tokenStore.setAccess(data.access);
}
```

### Q10. localStorage security

```ts
const ACCESS_KEY = "pharmacy_erp_access";
const getAccess = () => localStorage.getItem(ACCESS_KEY);
```

### Q11. Branch context

```tsx
const BranchFilterContext = createContext({
	branchId: null as number | null,
	setBranchId: (_id: number | null) => {},
});
```

### Q12. State management

```tsx
const [lines, setLines] = useState<CartLine[]>([]);
const { toasts } = useToastStore();
```

### Q13. API error handling

```ts
const errors = data.errors ?? data;
if (typeof errors === "string") return errors;
return fallback;
```

### Q14. TypeScript types

```ts
export interface Medicine {
	id: number;
	name: string;
	total_stock: number;
}
```

### Q15. Pagination

```ts
export interface PaginatedResponse<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}
```

### Q16. Loading and empty states

```tsx
if (loading) return <Skeleton className="h-12 w-full" />;
if (rows.length === 0) return <EmptyState message={emptyMessage} />;
```

### Q17. POS checkout

```tsx
const { data } = await api.post<Sale>("/sales/checkout/", payload);
setLastSale(data);
setLines([]);
```

### Q18. FEFO

```ts
const res = await api.get("/inventory/batches/", {
	params: { medicine: med.id, ordering: "expiry_date" },
});
onAdd(med, batches[0]);
```

### Q19. Stock ceiling

```tsx
onClick={() =>
	onUpdateQty(line.batch_id, Math.min(line.available_qty, line.quantity + 1))
}
```

### Q20. Backend as security boundary

```ts
try {
	await api.post("/sales/checkout/", payload);
} catch (err) {
	toastError(apiErrorMessage(err));
}
```

### Q21. Owner branch behavior

```tsx
const effectiveBranchId = user?.role === "OWNER"
	? branchId
	: user?.branch ?? null;
```

### Q22. Invoice PDF

```tsx
<Button onClick={() => downloadInvoicePdf(sale)}>
	<Download className="h-4 w-4" /> Download PDF
</Button>
```

### Q23. Inventory tabs

```tsx
<Tabs
	tabs={[{ key: "medicines", label: "Medicines" }, { key: "batches", label: "Batches" }]}
	active={tab}
	onChange={setTab}
/>
```

### Q24. Inventory permissions

```tsx
const canManage = user && ["OWNER", "MANAGER", "PHARMACIST"].includes(user.role);
```

### Q25. Promise.allSettled

```ts
const results = await Promise.allSettled([loadPnl(), loadBankBalance()]);
if (results[0].status === "fulfilled") setPnl(results[0].value);
```

### Q26. Manual finance bookkeeping

```tsx
<p>Manual bank bookkeeping — no live bank integration.</p>
```

### Q27. Branch switcher permissions

```tsx
const showBranchSwitcher =
	(user?.role === "OWNER" || user?.role === "ACCOUNTANT") && branches.length > 0;
```

### Q28. Design system

```tsx
<GlassCard className="p-6">
	<DataTable rows={medicines} columns={columns} keyField={(m) => m.id} />
</GlassCard>
```

### Q29. Generic DataTable

```tsx
export function DataTable<T>({
	columns, rows, keyField,
}: DataTableProps<T>) {
	return rows.map((row) => <tr key={keyField(row)} />);
}
```

### Q30. Zustand toast

```ts
export function toastSuccess(message: string) {
	useToastStore.getState().push(message, "success");
}
```

### Q31. Responsive layout

```tsx
<div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
	<MedicineSearch branchId={branchId} onAdd={handleAdd} />
</div>
```

### Q32. English/Urdu i18n

```tsx
const { t, locale, toggleLocale } = useLanguage();
return <button onClick={toggleLocale}>{t("common.language")}</button>;
```

### Q33. RTL direction

```tsx
document.documentElement.lang = locale;
document.documentElement.dir = locale === "ur" ? "rtl" : "ltr";
```

### Q34. Dynamic guided tour

```tsx
const Joyride = dynamic(() => import("react-joyride"), { ssr: false });
```

### Q35. Accessibility

```tsx
<button aria-label={t("common.language")} onClick={toggleLocale}>
	<Languages className="h-4 w-4" />
</button>
```

### Q36. Playwright coverage

```ts
await expect(page).toHaveURL(/\/pos/);
await expect(page.getByText(/sale completed/i)).toBeVisible();
```

### Q37. Seeded E2E data

```ts
await page.getByPlaceholder(/e\.g\. cashier1/i).fill("cashier1");
await page.getByPlaceholder("••••••••").fill("Cashier@12345");
```

### Q38. Sequential tests

```ts
export default defineConfig({
	fullyParallel: false,
});
```

### Q39. Test coverage gap

```ts
test.skip(!rowExists, "No invoices exist yet — complete a POS sale first.");
```

### Q40. Debounced search

```tsx
useEffect(() => {
	const timer = setTimeout(() => search(query), 300);
	return () => clearTimeout(timer);
}, [query, search]);
```

### Q41. Request race condition improvement

```ts
const controller = new AbortController();
api.get("/inventory/medicines/", { signal: controller.signal });
return () => controller.abort();
```

### Q42. Request loading/error pattern

```tsx
setLoading(true);
api.get("/inventory/medicines/")
	.then((res) => setMedicines(res.data.results ?? res.data))
	.catch((err) => toastError(apiErrorMessage(err)))
	.finally(() => setLoading(false));
```

### Q43. Currency precision

```tsx
const subtotal = lines.reduce(
	(sum, line) => sum + line.unit_price * line.quantity - line.discount_amount,
	0
);
```

### Q44. Expired access token

```ts
originalRequest.headers.Authorization = `Bearer ${data.access}`;
return api(originalRequest);
```

### Q45. Concurrent stock sales

```tsx
if (existing.quantity >= batch.quantity_remaining) return prev;
return prev.map((line) =>
	line.batch_id === batch.id ? { ...line, quantity: line.quantity + 1 } : line
);
```

### Q46. Add a dashboard page

```text
app/(dashboard)/your-page/page.tsx
Sidebar.tsx -> NAV_ITEMS
layout.tsx  -> PAGE_META_KEYS
```

### Q47. Backend endpoint change

```ts
const { data } = await api.get("/inventory/medicines/", {
	params: { search, ordering: "name" },
});
```

### Q48. Session refresh debugging

```tsx
const access = tokenStore.getAccess();
if (access) refreshUser().finally(() => setLoading(false));
```

### Q49. Production configuration

```ts
export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

### Q50. Improvement direction

```ts
// Future direction: centralize endpoint contracts and server state.
export const medicineApi = {
	list: (params: Record<string, unknown>) =>
		api.get<PaginatedResponse<Medicine>>("/inventory/medicines/", { params }),
};
```
