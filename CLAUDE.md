# HawkSight Front — Conventions

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v3 (tokens custom définis dans `tailwind.config.js`)
- Classes design system HawkSight (`.hw-*`) dans `src/index.css`
- Fonts : Poppins (heading), Inter (body), JetBrains Mono (mono/data)

---

## Règles de styling

### 1. Tailwind en priorité pour tout ce qui est statique
Layout, spacing, typography, couleurs sémantiques → **toujours Tailwind**.

```tsx
// ✅
<div className="hw-card-dark flex items-center gap-3 p-4">
  <span className="font-mono text-[9px] text-steel uppercase tracking-[2px]">Label</span>
  <span className="font-mono text-sm font-bold text-amber tabular-nums">42.1</span>
</div>

// ❌ — ne pas faire
<div style={{ background: '#0B0C10', border: '1px solid rgba(58,63,71,0.3)', ... }}>
```

### 2. Classes `.hw-*` pour les patterns du design system
Les patterns qui reviennent dans plusieurs composants ont leur classe dans `index.css`.

| Classe | Usage |
|---|---|
| `.hw-card-dark` | Card standard (charcoal bg, steel border, radius 8px) |
| `.hw-card-dark-lg` | Card avec radius 10px (pages détail) |
| `.hw-card-weekly` | Card gradient amber → glacier |
| `.hw-card-monthly` | Card gradient glacier → moss |
| `.hw-card-records` | Card gradient amber subtil (records) |
| `.hw-label` | Stat label 9px mono uppercase |
| `.hw-value` | Stat value 16px bold mono tabular |
| `.hw-chart-title` | Titre chart 10px/600 mono |
| `.hw-chart-subtitle` | Sous-titre chart 9px mono muted |
| `.hw-section-label` | Label de section 9px mono uppercase |
| `.hw-page-title` | Titre de page 22px/700 |
| `.hw-link` | Lien mono 9px glacier uppercase |
| `.hw-btn-ghost` | Bouton ghost mono |
| `.hw-btn-amber` | Bouton accent amber |
| `.hw-btn-group` | Groupe de boutons (prev/next) |
| `.hw-btn-group-item` | Item du groupe |
| `.hw-section-sep` | Séparateur section glacier |
| `.hw-br` + `.hw-br-tl/tr/bl/br` | Corner brackets (+ variantes couleur) |
| `.hw-pb-bg` / `.hw-pb-fill` | Progress bar |
| `.hw-ev-badge` | Badge événement pulsant amber |
| `.hw-event-badge` | Badge événement/race purple |
| `.hw-sport-badge` | Badge sport avec dot coloré |
| `.hw-act-row` | Ligne d'activité avec hover |
| `.hw-act-featured` | Bloc activité featured amber |
| `.hw-cal-day` | Cellule calendrier |
| `.hw-cal-week-stats` | Colonne stats semaine |
| `.hw-rec-row` | Ligne record |
| `.hw-score-eyebrow` | Label score avec ligne amber |
| `.hw-grad-sep` | Séparateur dégradé amber → glacier |

### 3. Inline style UNIQUEMENT pour les valeurs runtime
Couleur calculée, largeur de barre en %, position calculée → inline style légitime.

```tsx
// ✅ — valeur calculée au runtime
<div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
<span style={{ color: sportColor(sport) }}>Trail</span>

// ❌ — pas de magic string statique en inline
<div style={{ color: '#3DB2E0' }}>  // → className="text-glacier"
<div style={{ padding: '16px' }}>   // → className="p-4"
```

### 4. Tokens Tailwind disponibles
```
bg-charcoal / bg-charcoal-dark / bg-charcoal-light
text-steel / text-mist / text-amber / text-glacier / text-moss / text-event / text-event-light
border-steel / border-amber / border-glacier / border-event
font-mono / font-heading / font-body
rounded-sm (6px) / rounded-md (8px) / rounded-lg (16px)
shadow-card / shadow-card-hover
```

Avec opacités Tailwind : `text-steel/50`, `border-amber/30`, `bg-glacier/10`, etc.

### 5. Hover, focus, transitions → Tailwind natif
```tsx
// ✅
<div className="hw-card-dark hover:border-steel/60 transition-colors cursor-pointer">

// ❌
const [hovered, setHovered] = useState(false);
<div style={{ border: hovered ? '1px solid ...' : '...' }} onMouseEnter={...}>
```

---

## Services utilitaires

### Couleurs sport
```ts
import { sportColor, sportBarColor, sportLabel, SPORT_META } from '@/services/utils/constants';
sportColor('Trail')    // '#E8832A'
sportBarColor('Trail') // '#C96A1A'
sportLabel('Trail')    // 'Trail'
SPORT_META['Trail'].bg // 'rgba(232,131,42,0.12)'
```

### Formatters
```ts
import { formatDateLong, formatDateShort, formatPaceSeconds, formatDurationCompact } from '@/services/utils/formatters';
```

### Chart helpers
```ts
import { computeYTicks, projectCoordsToSVG, createSmoothPath } from '@/services/utils/chartHelpers';
```

### Style tokens (pour cas où inline est inévitable)
```ts
import { CARD_STYLE, COLOR, SVG_CHART } from '@/services/utils/styleTokens';
```

---

## Règles TypeScript
- Pas de `any` explicite
- Les couleurs sport dynamiques passent par `sportColor()`, jamais par des `Record<SportType, string>` locaux
- `sportBarColor(type ?? '')` si `type` peut être `undefined`
