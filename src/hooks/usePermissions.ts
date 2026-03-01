import { useAuth } from '@/context';

export function usePermissions() {
  const { currentUser } = useAuth();
  const role = currentUser?.role ?? 'demo'; // sécurisé par défaut si pas de user

  return {
    isDemo: role === 'demo',
    isAdmin: role === 'admin',
    isUser: role === 'user',
    canWrite: role === 'admin' || role === 'user',
    canDelete: role === 'admin' || role === 'user',
    canSync: role === 'admin' || role === 'user',
  };
}
