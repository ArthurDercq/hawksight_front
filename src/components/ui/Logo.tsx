interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="HawkSight Logo"
    >
      {/* Mountain outline (stylized peaks) - white/mist color */}
      <path
        d="M8 72 L28 40 L44 56 L58 30 L80 72"
        fill="none"
        stroke="#F2F2F2"
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Secondary inner ridge to add depth */}
      <path
        d="M20 72 L36 48 L46 60 L60 38"
        fill="none"
        stroke="#F2F2F2"
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Sparkline (performance) - amber/orange accent */}
      <polyline
        points="24,60 35,48 46,56 58,42 70,54"
        fill="none"
        stroke="#E8832A"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
