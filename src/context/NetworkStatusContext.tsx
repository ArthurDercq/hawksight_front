import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isBackendReachable: boolean;
  lastSuccessAt: number | null;
}

const Ctx = createContext<NetworkStatus>({
  isOnline: true,
  isBackendReachable: true,
  lastSuccessAt: null,
});

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [lastSuccessAt, setLastSuccessAt] = useState<number | null>(null);

  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onOk      = () => { setIsBackendReachable(true); setLastSuccessAt(Date.now()); };
    const onError   = () => setIsBackendReachable(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('backend-ok', onOk);
    window.addEventListener('backend-error', onError);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('backend-ok', onOk);
      window.removeEventListener('backend-error', onError);
    };
  }, []);

  return (
    <Ctx.Provider value={{ isOnline, isBackendReachable, lastSuccessAt }}>
      {children}
    </Ctx.Provider>
  );
}

export const useNetworkStatus = () => useContext(Ctx);
