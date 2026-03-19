interface SpinnerProps {
  message?: string;
  fullPage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ message, fullPage = true, size = 'lg' }: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12';

  const inner = (
    <div className="text-center">
      <svg className={`animate-spin ${sizeClass} text-amber mx-auto`} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      {message && <p className="text-mist/60 mt-4 text-sm">{message}</p>}
    </div>
  );

  if (!fullPage) return inner;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      {inner}
    </div>
  );
}
