import { SectionTitle } from './SectionTitle';

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
          <div className="text-center">
            <svg className="animate-spin w-12 h-12 text-amber mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-mist/60">{loadingMessage}</p>
          </div>
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
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
