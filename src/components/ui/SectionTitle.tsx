import { ReactNode } from 'react';

interface SectionTitleProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionTitle({
  icon,
  title,
  subtitle,
  className = '',
}: SectionTitleProps) {
  return (
    <div className={`flex items-start gap-4 ${className}`}>
      {icon && (
        <div className="relative p-2 bg-glacier/10 border border-glacier/30 rounded-lg flex-shrink-0">
          {/* Icon glow */}
          <div className="absolute inset-0 bg-glacier/20 blur-[12px] rounded-lg" />
          {/* Icon content */}
          <div className="relative text-glacier">{icon}</div>
        </div>
      )}

      <div className="flex-1">
        <h2 className="font-heading text-lg font-semibold text-mist">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-mist/60 mt-0.5">{subtitle}</p>
        )}

        {/* Underline with gradient */}
        <div className="flex items-center gap-1 mt-2">
          <div className="w-16 h-px bg-gradient-to-r from-glacier to-transparent" />
          <div className="w-1 h-1 rounded-full bg-glacier" />
        </div>
      </div>
    </div>
  );
}
