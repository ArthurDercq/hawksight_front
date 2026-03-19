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
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
