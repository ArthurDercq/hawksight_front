import type { CSSProperties } from 'react';
import { COLORS } from './constants';

// ── Style A — card standard (dashboard + activity page) ───────────────────────
export const CARD_STYLE: CSSProperties = {
  background: COLORS.charcoal,
  border: `1px solid rgba(58,63,71,0.3)`,
  borderRadius: '8px',
  padding: '16px',
  position: 'relative',
  overflow: 'hidden',
};

// Variante avec borderRadius 10px (activity detail page)
export const CARD_STYLE_LG: CSSProperties = {
  ...CARD_STYLE,
  borderRadius: '10px',
  padding: '18px',
};

// ── Typographie partagée ──────────────────────────────────────────────────────
export const CHART_TITLE_STYLE: CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  color: 'rgba(242,242,242,0.7)',
  fontFamily: 'JetBrains Mono, monospace',
  marginBottom: '4px',
};

export const CHART_SUBTITLE_STYLE: CSSProperties = {
  fontSize: '9px',
  fontFamily: 'JetBrains Mono, monospace',
  color: '#8B95A1',  // muted
  marginBottom: '12px',
};

export const LABEL_STYLE: CSSProperties = {
  fontSize: '9px',
  fontFamily: 'JetBrains Mono, monospace',
  color: '#8B95A1',  // muted
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
};

export const VALUE_STYLE: CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  fontFamily: 'JetBrains Mono, monospace',
  fontVariantNumeric: 'tabular-nums',
};

// ── Couleurs sémantiques inline (éviter les magic strings) ───────────────────
export const COLOR = {
  bg:          COLORS.charcoal,
  bgDark:      '#060c18',
  border:      'rgba(58,63,71,0.3)',
  borderHover: 'rgba(58,63,71,0.6)',
  steel:       COLORS.steel,
  muted:       '#8B95A1',
  mist:        COLORS.mist,
  amber:       COLORS.amber,
  glacier:     COLORS.glacier,
  moss:        COLORS.moss,
  red:         '#E84242',
  mono:        'JetBrains Mono, monospace',
} as const;

// ── SVG chart constants partagées ─────────────────────────────────────────────
export const SVG_CHART = {
  W: 440,
  H: 180,
  MARGIN: { top: 8, right: 16, bottom: 22, left: 28 },
  gridColor:  'rgba(255,255,255,0.04)',
  axisColor:  'rgba(58,63,71,0.4)',
  tickColor:  '#8B95A1',  // muted — lisible sur fond sombre
} as const;
