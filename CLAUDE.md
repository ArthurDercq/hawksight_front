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
- More pages coming (Analytics, Méthode, …)

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

JWT stored in `localStorage['eyesight_token']`. Decoded client-side on mount — no API call needed to restore session. `AuthContext` exposes `{ token, isAuthenticated, isLoading, currentUser, loginWithStravaCode, logout }`.

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

## Styling rules

### 1. Tailwind for all static styles
Layout, spacing, typography, semantic colors → always Tailwind classes.

```tsx
// ✅
<div className="hw-card-dark flex items-center gap-3 p-4">
  <span className="font-mono text-[9px] text-steel uppercase tracking-[2px]">Label</span>
  <span className="font-mono text-sm font-bold text-amber tabular-nums">42.1</span>
</div>

// ❌
<div style={{ background: '#0B0C10', border: '1px solid rgba(58,63,71,0.3)' }}>
```

### 2. `.hw-*` classes for design system patterns

| Class | Usage |
|---|---|
| `.hw-card-dark` | Standard card (charcoal bg, steel border, radius 8px) |
| `.hw-card-dark-lg` | Card with radius 10px |
| `.hw-card-weekly` | Gradient amber → glacier |
| `.hw-card-monthly` | Gradient glacier → moss |
| `.hw-card-records` | Subtle amber gradient |
| `.hw-label` | 9px mono uppercase stat label |
| `.hw-value` | 16px bold mono tabular stat value |
| `.hw-chart-title` | 10px/600 mono chart title |
| `.hw-chart-subtitle` | 9px mono muted chart subtitle |
| `.hw-section-label` | 9px mono uppercase section label |
| `.hw-page-title` | 22px/700 page title |
| `.hw-link` | 9px mono glacier uppercase link |
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

### 3. Inline style only for runtime values

```tsx
// ✅ — computed at runtime
<div style={{ width: `${pct}%`, background: color }} />
<span style={{ color: sportColor(sport) }}>Trail</span>

// ❌ — static values belong in Tailwind
<div style={{ color: '#3DB2E0' }}>   // → className="text-glacier"
<div style={{ padding: '16px' }}>   // → className="p-4"
```

### 4. Available Tailwind tokens
```
bg-charcoal / bg-charcoal-dark / bg-charcoal-light
text-steel / text-mist / text-amber / text-glacier / text-moss / text-event / text-event-light
border-steel / border-amber / border-glacier / border-event
font-mono / font-heading / font-body
rounded-sm (6px) / rounded-md (8px) / rounded-lg (16px)
shadow-card / shadow-card-hover
```

With opacity modifiers: `text-steel/50`, `border-amber/30`, `bg-glacier/10`.

### 5. Hover/focus/transitions → native Tailwind

```tsx
// ✅
<div className="hw-card-dark hover:border-steel/60 transition-colors cursor-pointer">

// ❌
const [hovered, setHovered] = useState(false);
```

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
