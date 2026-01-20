import { ReactNode } from 'react';

type CardVariant = 'default' | 'weekly' | 'monthly' | 'streak' | 'static';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[rgba(58,63,71,0.3)]
    border border-[rgba(255,255,255,0.05)]
  `,
  weekly: `
    bg-gradient-to-br from-[rgba(232,131,42,0.2)] to-[rgba(61,178,224,0.2)]
    border border-[rgba(232,131,42,0.5)]
  `,
  monthly: `
    bg-gradient-to-br from-[rgba(61,178,224,0.2)] to-[rgba(109,170,117,0.2)]
    border border-[rgba(61,178,224,0.5)]
  `,
  streak: `
    bg-gradient-to-br from-[rgba(232,131,42,0.2)] via-[rgba(255,99,71,0.2)] to-[rgba(255,140,0,0.2)]
    border border-[rgba(232,131,42,0.5)]
  `,
  static: `
    bg-charcoal-light
    border border-steel/30
  `,
};

export function Card({
  children,
  variant = 'default',
  className = '',
  hover = true,
  onClick,
}: CardProps) {
  const baseClasses = `
    rounded-lg p-6
    backdrop-blur-[10px]
    shadow-[0_2px_8px_rgba(0,0,0,0.3)]
    transition-all duration-300 ease-out
  `;

  const hoverClasses = hover
    ? `
      hover:border-amber
      hover:-translate-y-0.5
      hover:shadow-[0_8px_16px_rgba(0,0,0,0.3)]
    `
    : '';

  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${variantStyles[variant]} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
