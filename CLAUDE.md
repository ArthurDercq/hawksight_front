# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server → localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # eslint
npx tsc --noEmit   # type-check without emitting
```

---

## Architecture

### Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v3 (custom tokens in `tailwind.config.js`)
- HawkSight design system classes (`.hw-*`) in `src/index.css`
- Fonts: Poppins (heading), Inter (body), JetBrains Mono (mono/data)
- `motion/react` (Framer Motion v12) for animations — import from `motion/react`, not `framer-motion`
- Mapbox GL for maps, Chart.js + react-chartjs-2 for charts

### Two distinct surfaces

The app has two completely separate surfaces that must not share layout or shell components:

**Marketing** (public, no auth, own navbar/footer per page):
- `/` → `HomePage.tsx`
- `/terrain` → `TerrainPage.tsx`
- More pages: Analytics, Méthode, Plateforme

**SaaS app** (auth required, sidebar + footer shell):
- `/dashboard`, `/activities`, `/exploration`, `/kpi`, `/calendar`, `/performance`, `/profile`

**Current routing** (`App.tsx`): `AppLayout` uses `isLanding = pathname === '/' || '/terrain'` to skip the sidebar shell. This is being refactored toward proper React Router v6 layout routes:
```tsx
<Route element={<MarketingLayout />}>  // navbar + footer vitrine définis une fois
<Route element={<AppLayout />}>
  <Route element={<RequireAuth />}>    // guard pur, pas de UI
```
When adding a new marketing page, add its path to the `isLanding` check until the refactor is done.

### Auth

JWT stored in `localStorage['eyesight_token']`. Decoded **synchronously** on first render — `isLoading` in `AuthContext` is always `false` (localStorage is synchronous, no `useEffect` needed). `AuthContext` exposes `{ token, isAuthenticated, isLoading, currentUser, loginWithStravaCode, logout }`.

Strava OAuth flow:
1. `GET /auth/strava/login?invite?` → redirect URL
2. Strava → `GET /auth/callback?code={ephemeral_code}`
3. `POST /auth/strava/exchange-code?code=` → JWT
4. 403 on exchange = invite-only → `/invite-only`

New users: `activities_count === 0` after login → poll `GET /sync/status` every 5s, show `OnboardingScreen` with `current_job.progress` until `is_syncing === false`.

### Roles & permissions

Roles: `admin` | `user` | `demo` (read from JWT payload via `decodeUser()`).
Use `usePermissions()` hook: `{ isDemo, canWrite, canSync, canDelete }`.
Demo users get HTTP 403 on mutations — **do not throw**, show disabled state + "Mode démo" badge.
`apiClient` redirects 401 → `/login` but **does not redirect 403** (handled per component).

### Data fetching

Custom SWR system — no React Query, no TanStack Query.

```
src/services/cache.ts     → QueryCache singleton (stale-while-revalidate + in-flight dedup)
src/hooks/useQuery.ts     → generic hook wrapping cache.fetch()
src/hooks/use*.ts         → domain hooks (useActivities, useDashboard, useExploration, …)
src/services/api/*.ts     → raw API modules called by hooks
```

`cache.fetch()` behaviour:
- Valid cache → return stale immediately + silent background refetch
- Expired/absent → blocking fetch
- In-flight → reuse existing promise
- `force: true` → bypass cache entirely

Cache invalidation: `cache.invalidate(key)`, `cache.invalidateByPrefix(prefix)`.
After mutations, dispatch `window.dispatchEvent(new Event('activities-updated'))` — `useQuery` listens and auto-refetches.

**localStorage persistence**: `QueryCache` automatically persists to localStorage (keys prefixed `hw_cache_*`). On first `get()` miss, it hydrates from localStorage before returning null. This means cached data survives page reloads. Keys in `PERSIST_BLOCKLIST` (`profile:me`, `sync:status`) are never persisted. `invalidateAll()` (called on logout) purges all `hw_cache_*` entries from localStorage.

### API client

`apiClient` singleton (`src/services/api/client.ts`) — axios with Bearer token injection.
Base URL: `VITE_API_BASE_URL` (defaults `http://localhost:8000`).

### Async 202 patterns

Some endpoints return 202 when computation is running:

| Endpoint | When 202 | Action |
|---|---|---|
| `GET /exploration/territories/largest\|unexplored` | Snapshot computing | Show loader, retry after 10s |
| `POST /trail/compute` | Always | Poll `GET /trail/profile` |
| `GET /sync/status` with `is_syncing: true` | Syncing | Poll every 5s, show `current_job.progress` |

### Environment variables

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_ACCESS_TOKEN=pk.xxx
```

---

## Performance rules

These rules are non-negotiable. Every page must follow all of them.

### 1. Seed state from cache — never start loading from scratch

Every domain hook must initialize `useState` lazily from `cache.get()`. This ensures stale data is visible on the very first render, before any `useEffect` fires.

```ts
// ✅ — stale data shows immediately, spinner only if cache is empty
const [data, setData] = useState<Activity[]>(() => cache.get<Activity[]>(CACHE_KEY) ?? []);
const [isLoading, setIsLoading] = useState(() => cache.get<Activity[]>(CACHE_KEY) === null);

// ❌ — spinner always shows, even when data was cached 30 seconds ago
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);
```

Then use `cache.fetch()` (not the raw API) so the SWR background-refresh pattern kicks in automatically:

```ts
const { data } = await cache.fetch<Activity[]>(CACHE_KEY, () => activitiesApi.getActivities(), {
  onBackground: (fresh) => setData(fresh),
});
setData(data);
```

After mutations, always call `cache.invalidate(CACHE_KEY)` before refetching so the next consumer gets fresh data.

### 2. Never bypass QueryCache for read operations

All reads must go through `cache.fetch()`. **Never** call `apiClient.get()` or `apiClient.fetchWithCache()` directly from a hook for data that benefits from caching (i.e., anything that doesn't change per-request). Bypass only for mutations (POST/PUT/DELETE).

Cache key conventions:
- `activities:all` — full activity list
- `activity-detail-{id}` — single activity detail + streams
- `profile:me` — user profile
- `exploration:geojson:{year|'all'}` — exploration GeoJSON
- `kpi:{year}` — KPI data
- `chart:{type}:{sports}:{year}` — chart data

Exception: `useTerritories` polls a 202 endpoint — do not seed stale data there as it would show outdated territory snapshots.

### 3. Lazy-load all page-level components

All pages must be imported with `React.lazy()` in `App.tsx`. No eager imports for route-level components.

```tsx
// ✅
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'));

// ❌
import { DashboardPage } from '@/pages/app/DashboardPage';
```

Wrap lazy routes in `<Suspense fallback={<Spinner />}>`. This keeps the initial JS bundle small and lets each page load on demand.

### 4. Page layout — one source of padding

The `AppLayout` shell in `App.tsx` provides `px-6 py-6` for all app pages. **Pages must never add their own `px-*` padding** at the root level. Use `max-w-*` without `px-*`.

```tsx
// ✅ — correct page root
<div className="max-w-7xl mx-auto flex flex-col gap-6">

// ❌ — double padding
<div className="max-w-7xl mx-auto px-6 flex flex-col gap-6">
```

The same applies to `PageStateWrapper` — it must not add horizontal padding either.

### 5. No useState for hover/focus — use Tailwind

Interactive states must use Tailwind pseudo-classes, not JS state. JS re-renders for hover are expensive and cause jank.

```tsx
// ✅
<div className="hw-card-dark hover:border-steel/60 transition-colors cursor-pointer">

// ❌
const [hovered, setHovered] = useState(false);
<div onMouseEnter={() => setHovered(true)} style={{ border: hovered ? ... : ... }}>
```

### 6. Memoize expensive derived values

Use `useMemo` for data transforms that depend on large lists (activity filtering, calendar week generation, chart data aggregation). Use `useCallback` for event handlers passed as props to child components.

```tsx
// ✅
const weeks = useMemo(
  () => generateCalendarWeeks(year, month, activities, events),
  [year, month, activities, events],
);
```

### 7. Background data refresh — use `onBackground`, not refetch loops

When cache is valid and you want fresh data silently, use the `onBackground` callback in `cache.fetch()`. Never poll with `setInterval` or `setTimeout` for data that has a natural cache TTL.

```ts
// ✅
await cache.fetch(KEY, fetcher, { onBackground: (fresh) => setData(fresh) });

// ❌
useEffect(() => {
  const id = setInterval(() => refetch(), 30000);
  return () => clearInterval(id);
}, []);
```

Exception: 202-polling endpoints (`/sync/status`, `/trail/profile`, territory snapshots) — these are genuinely async server operations that require explicit polling.

### 8. Cancel in-flight requests on unmount

Every hook that fetches in a `useEffect` must use a cancellation guard to avoid setting state on an unmounted component.

```ts
// ✅
useEffect(() => {
  const cancelled = { current: false };
  fetchData(cancelled);
  return () => { cancelled.current = true; };
}, [fetchData]);

// inside fetchData:
if (cancelled?.current) return;
setData(result);
```

This prevents stale state bugs when the user navigates away before a fetch completes.

### 9. List keys — always use stable IDs

Never use array index as `key`. Use the item's business ID. Index keys cause silent bugs with React reconciliation and break animations.

```tsx
// ✅
activities.map((a) => <ActivityRow key={a.id} activity={a} />)
events.map((e) => <EventBadge key={e.id} event={e} />)

// ❌
activities.map((a, i) => <ActivityRow key={i} activity={a} />)
```

### 10. After mutations — always invalidate cache AND dispatch event

After any write (create/update/delete), two things must happen:
1. `cache.invalidate(CACHE_KEY)` — clears the QueryCache entry so the next `cache.fetch()` gets fresh data
2. `window.dispatchEvent(new CustomEvent('activities-updated'))` — notifies all `useQuery` subscribers to refetch

The `activitiesApi` mutations already do both. Follow the same pattern for any new domain (profile, events, etc.).

```ts
// After a mutation in any API module:
cache.invalidate('profile:me');
window.dispatchEvent(new CustomEvent('activities-updated'));
```

### 11. No `console.log` — `console.error` only for caught errors

Never leave `console.log` in committed code. Use `console.error` only in `catch` blocks for real errors, with enough context to debug:

```ts
// ✅
console.error('Error fetching profile — status:', err.response?.status, err.message);

// ❌
console.log('data:', data);
console.error('error');
```

### 12. Component size and co-location

- Sub-components used only once in a page file: define them at the bottom of the same file (e.g. `CalendarWeekRow`, `CalendarDayCell` in `CalendarPage.tsx`).
- Extract to a separate file when: the component is used in more than one page, OR it exceeds ~80 lines, OR it has its own data-fetching logic.
- Never create a new file just to split a small presentational piece — co-location is preferred for readability.

### 13. Cache persistence — key rules

- `QueryCache` persists to localStorage automatically — no extra work needed in hooks.
- Keys in `PERSIST_BLOCKLIST` (`profile:me`, `sync:status`) are never written to localStorage.
- On logout, `cache.invalidateAll()` is called in `AuthContext.logout()` — this wipes all `hw_cache_*` from localStorage. **Every new domain's logout cleanup happens here automatically.**
- Never call `localStorage.setItem/getItem` directly for cache data — always go through `cache.set/get`.
- The `backend-ok` / `backend-error` custom events on `window` are the signaling mechanism between `QueryCache` and `NetworkStatusContext`. Do not remove these dispatches from `_doFetch`.

### 14. Error resilience — do not hide failures silently

- Network errors in background fetches (`_launchBackground`) are swallowed intentionally — stale data stays visible.
- Network errors in foreground fetches propagate to the hook's `error` state, which the page renders inline.
- `backend-error` is dispatched on **any** fetch failure (including 404/403). This is a known limitation — the offline banner may appear for non-network errors. Do not change this behavior without auditing all callers.
- `ErrorBoundary` resets on button click (`setState({ hasError: false })`). If the underlying error persists, the component re-crashes immediately — this is correct behavior (avoids hiding permanent failures).

---

## Accessibility rules

### aria-label on icon-only controls

Any button or link without visible text must have an `aria-label`:

```tsx
// ✅
<button aria-label="Mois précédent" onClick={previousMonth}><ChevronLeftIcon /></button>
<Link aria-label="Voir l'activité Trail du 12 mai" to={`/activity/${id}`}>...</Link>

// ❌
<button onClick={previousMonth}><ChevronLeftIcon /></button>
```

### Semantic HTML

Use `<button>` for actions, `<a>`/`<Link>` for navigation. Never use `<div onClick>` for interactive elements — it breaks keyboard navigation and screen readers.

---

## Styling rules

### 1. Tailwind for all static styles

Layout, spacing, typography, semantic colors → always Tailwind classes. Never hardcode colors or sizes in `style={{}}`.

```tsx
// ✅
<div className="hw-card-dark flex items-center gap-3 p-4">
  <span className="hw-text-label text-steel">DISTANCE</span>
  <span className="hw-value text-amber">42.1</span>
</div>

// ❌
<div style={{ background: '#0B0C10', border: '1px solid rgba(58,63,71,0.3)' }}>
```

### 2. Typography scale — always use `.hw-text-*`

Never write `font-mono text-[Npx]` directly. Use the semantic scale:

| Class | Size | Usage |
|---|---|---|
| `.hw-text-label` | 9px mono uppercase | Field labels, axis labels, tags: "DISTANCE", "ALLURE" |
| `.hw-text-caption` | 10px mono | Secondary text, metadata, chart subtitles |
| `.hw-text-data` | 11px mono tabular | Intermediate stats, secondary values |
| `.hw-text-value` | 13px mono semibold tabular | Primary metrics |
| `.hw-value` | 16px mono bold tabular | KPI counters, hero numbers |
| `.hw-page-title` | 22px/700 | Page H1 |
| `.hw-section-label` | alias of `.hw-text-label` | Section eyebrows |
| `.hw-chart-title` | 10px/600 mono | Chart card titles |
| `.hw-chart-subtitle` | 9px mono muted | Chart card subtitles |

For larger intentional sizes (e.g. `text-[84px]` on DashboardPage, `text-[15px]` in ActivityDetail) — these are deliberate exceptions, keep them as-is.

### 3. `.hw-*` component classes

Use these for recurring UI patterns instead of repeating raw Tailwind:

| Class | Usage |
|---|---|
| `.hw-card-dark` | Standard card (charcoal bg, steel border, radius 8px) |
| `.hw-card-dark-lg` | Card with radius 10px |
| `.hw-card-weekly` | Gradient amber → glacier |
| `.hw-card-monthly` | Gradient glacier → moss |
| `.hw-card-records` | Subtle amber gradient |
| `.hw-btn-ghost` | Ghost mono button |
| `.hw-btn-amber` | Amber accent button |
| `.hw-btn-group` / `.hw-btn-group-item` | Prev/next button group |
| `.hw-section-sep` | Glacier section separator |
| `.hw-br` + `.hw-br-tl/tr/bl/br` | Corner brackets |
| `.hw-br-amber` / `.hw-br-glacier` / `.hw-br-steel` | Corner bracket color variants |
| `.hw-pb-bg` / `.hw-pb-fill` | Progress bar |
| `.hw-ev-badge` | Pulsing amber event badge |
| `.hw-event-badge` | Purple event/race badge |
| `.hw-sport-badge` | Sport badge with colored dot |
| `.hw-act-row` | Activity row with hover |
| `.hw-act-featured` | Featured amber activity block |
| `.hw-cal-day` | Calendar cell |
| `.hw-cal-week-stats` | Week stats column |
| `.hw-rec-row` | Record row |
| `.hw-score-eyebrow` | Score label with amber line |
| `.hw-grad-sep` | Amber → glacier gradient separator |

### 4. Inline `style` only for runtime values

```tsx
// ✅ — computed at runtime
<div style={{ width: `${pct}%`, background: color }} />
<span style={{ color: sportColor(sport) }}>Trail</span>

// ❌ — static values belong in Tailwind
<div style={{ color: '#3DB2E0' }}>   // → className="text-glacier"
<div style={{ padding: '16px' }}>   // → className="p-4"
```

Gradients and complex shadows with no Tailwind equivalent may stay as `style={{}}`.

### 5. Available Tailwind tokens

```
bg-charcoal / bg-charcoal-dark / bg-charcoal-light
text-steel / text-mist / text-amber / text-glacier / text-moss / text-event / text-event-light
border-steel / border-amber / border-glacier / border-event
font-mono / font-heading / font-body
rounded-sm (6px) / rounded-md (8px) / rounded-lg (16px)
shadow-card / shadow-card-hover
```

With opacity modifiers: `text-steel/50`, `border-amber/30`, `bg-glacier/10`.

---

## UX consistency rules

These ensure the app feels coherent across all pages.

### Loading states

- **Page shell always renders** — never use early `return <Spinner>` or `return <ErrorPage>` at the page root. The header/title/navigation must be visible even while data loads.
- **Inline conditional pattern**: `{isLoading && !hasData ? <Skeleton /> : error && !hasData ? <InlineError /> : <Content />}`. `hasData` = stale data present (list non-empty, object non-null).
- If cache is populated (data seeded from `cache.get()`): `hasData` is true → no spinner, stale data shows immediately.
- If cache is empty (first visit, post-logout): `hasData` is false → show skeleton rows or a spinner in the data zone only, not the full page.
- Never show a full-page spinner for auth state — `AuthContext.isLoading` is always `false`.
- For background refreshes: use a subtle `isFetching` indicator (small spinner in a corner), never block the page.
- `<PageStateWrapper>` is still available but **do not use it for app pages** — it replaces the entire page on load/error, preventing the shell from rendering. Reserve it only for very simple standalone screens.

### Error states

- **Inline error card pattern**: show error in the data zone only (not full-page replacement). The page header must always remain visible.
- On 403 (demo mode): show disabled UI + "Mode démo" badge. Do not redirect, do not throw.
- On 401: `apiClient` redirects automatically to `/login`.
- Wrap data-heavy sections in `<ErrorBoundary>` to prevent uncaught render errors from crashing the whole page. The `ErrorBoundary` component is at `src/components/ui/ErrorBoundary.tsx`.

### Offline / backend unreachable

- `NetworkStatusContext` (`src/context/NetworkStatusContext.tsx`) tracks backend reachability via `backend-ok`/`backend-error` events dispatched by `QueryCache._doFetch()` after every fetch attempt.
- `useNetworkStatus()` hook exposes `{ isOnline, isBackendReachable, lastSuccessAt }`.
- The `NetworkBanner` in `AppShell` (App.tsx) automatically shows an amber "Données hors ligne" banner when `isBackendReachable === false`.
- Because data survives in localStorage, users see stale data even when the backend is unreachable — never show a full error page in this case.

### Transitions and animations

- Use `transition-colors`, `transition-opacity`, `transition-transform` for hover/focus states.
- Use `motion/react` only for meaningful entry animations (page load, modal open) — not for every micro-interaction.
- Import from `motion/react`, never from `framer-motion`.

---

## Service utilities

```ts
import { sportColor, sportBarColor, sportLabel, SPORT_META } from '@/services/utils/constants';
sportColor('Trail')      // '#E8832A'
sportBarColor('Trail')   // '#C96A1A'
SPORT_META['Trail'].bg   // 'rgba(232,131,42,0.12)'

import { formatDateLong, formatDateShort, formatPaceSeconds, formatDurationCompact } from '@/services/utils/formatters';

import { computeYTicks, projectCoordsToSVG, createSmoothPath } from '@/services/utils/chartHelpers';

import { CARD_STYLE, COLOR, SVG_CHART } from '@/services/utils/styleTokens';
```

---

## TypeScript rules

- No explicit `any`
- Dynamic sport colors via `sportColor()`, never local `Record<SportType, string>`
- `sportBarColor(type ?? '')` when `type` can be `undefined`
- `MotionValue` from motion/react **cannot be rendered as JSX children** — use `useState` + `requestAnimationFrame` for animated counters, or `useMotionTemplate` for string composition
