interface SpinnerProps {
  message?: string;
  fullPage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ message, fullPage = true, size = 'lg' }: SpinnerProps) {
  const ringSize = size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10';
  const borderSize = size === 'sm' ? 'border-[2px]' : 'border-[2.5px]';

  const inner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${ringSize} relative`}>
        {/* Track */}
        <div className={`absolute inset-0 rounded-full ${borderSize} border-steel/25`} />
        {/* Spinning arc */}
        <div className={`absolute inset-0 rounded-full ${borderSize} border-transparent border-t-amber animate-spin`} />
      </div>
      {message && (
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-steel">{message}</p>
      )}
    </div>
  );

  if (!fullPage) return inner;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      {inner}
    </div>
  );
}
