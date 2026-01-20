import { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  className?: string;
}

export function MetricCard({
  icon,
  label,
  value,
  unit,
  color,
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`group relative min-h-[140px] ${className}`}
      style={{ '--metric-color': color } as React.CSSProperties}
    >
      {/* Hover glow effect */}
      <div
        className="absolute -inset-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${color}40, transparent)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Card inner */}
      <div
        className="relative h-full bg-charcoal border border-steel/30 rounded-lg p-4 overflow-hidden flex flex-col transition-colors duration-300 group-hover:border-[var(--metric-color)]"
      >
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #F2F2F2 1px, transparent 1px),
              linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)
            `,
            backgroundSize: '16px 16px',
            opacity: 0.03,
          }}
        />

        {/* Corner glow */}
        <div
          className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${color}, transparent)`,
            opacity: 0.1,
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col gap-3 flex-1">
          {/* Header row */}
          <div className="flex items-center gap-3">
            {/* Icon badge */}
            <div
              className="p-2 rounded border inline-flex items-center justify-center"
              style={{
                backgroundColor: `${color}10`,
                borderColor: `${color}30`,
              }}
            >
              <span style={{ color }}>{icon}</span>
            </div>
            <span className="text-mist/60 text-xs font-body">{label}</span>
          </div>

          {/* Value row */}
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-xl font-semibold"
              style={{ color }}
            >
              {value}
            </span>
            {unit && (
              <span className="text-mist/40 font-mono text-sm">{unit}</span>
            )}
          </div>
        </div>

        {/* Decorative dots */}
        <div className="absolute bottom-4 right-4 flex gap-1">
          <div
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div
            className="w-1 h-1 rounded-full opacity-60"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
