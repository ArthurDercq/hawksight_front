import { SectionTitle } from './SectionTitle';
import { Spinner } from './Spinner';

interface PageStateWrapperProps {
  isLoading: boolean;
  error: string | null;
  icon: React.ReactNode;
  title: string;
  loadingMessage: string;
  children: React.ReactNode;
}

export function PageStateWrapper({
  isLoading,
  error,
  icon,
  title,
  loadingMessage,
  children,
}: PageStateWrapperProps) {
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <SectionTitle icon={icon} title={title} />
        </div>
        <div className="flex items-center justify-center py-12">
          <Spinner message={loadingMessage} fullPage={false} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <SectionTitle icon={icon} title={title} />
        </div>
        <div className="hw-card-dark p-6 flex flex-col items-center gap-3 text-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3A3F47" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="font-mono text-[11px] text-steel/60 uppercase tracking-wider">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
