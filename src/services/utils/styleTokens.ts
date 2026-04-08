import type { CSSProperties } from 'react';

// ── Style A — card standard (dashboard + activity page) ───────────────────────
export const CARD_STYLE: CSSProperties = {
  background: '#0B0C10',
  border: '1px solid rgba(58,63,71,0.3)',
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
  color: '#3A3F47',
  marginBottom: '12px',
};

export const LABEL_STYLE: CSSProperties = {
  fontSize: '9px',
  fontFamily: 'JetBrains Mono, monospace',
  color: 'rgba(242,242,242,0.3)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

export const VALUE_STYLE: CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  fontFamily: 'JetBrains Mono, monospace',
  fontVariantNumeric: 'tabular-nums',
};

// ── Couleurs sémantiques inline (éviter les magic strings) ───────────────────
export const COLOR = {
  bg:         '#0B0C10',
  bgDark:     '#060c18',
  border:     'rgba(58,63,71,0.3)',
  borderHover:'rgba(58,63,71,0.6)',
  steel:      '#3A3F47',
  mist:       '#F2F2F2',
  amber:      '#E8832A',
  glacier:    '#3DB2E0',
  moss:       '#6DAA75',
  red:        '#E84242',
  mono:       'JetBrains Mono, monospace',
} as const;

// ── SVG chart constants partagées ─────────────────────────────────────────────
export const SVG_CHART = {
  W: 440,
  H: 180,
  MARGIN: { top: 8, right: 16, bottom: 22, left: 28 },
  gridColor: 'rgba(255,255,255,0.04)',
  axisColor: 'rgba(58,63,71,0.4)',
  tickColor: '#3A3F47',
} as const;
