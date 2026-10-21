import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/common/Logo';
import type { UserRole } from '@/types';

export function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <div className="h-1 w-40 overflow-hidden rounded-full bg-ink-200 dark:bg-white/10">
          <div className="h-full w-1/2 animate-[shimmer_1.4s_infinite] rounded-full bg-primary-600" />
        </div>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/signin" replace />;
  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="surface mx-auto max-w-md p-8">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">Restricted workspace</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            This area is limited to {roles.map((r) => r.replace('_', ' ')).join(' and ')} accounts.
            Switch to a demo role from the profile menu to explore it.
          </p>
          <a href="/app" className="btn-primary mt-6">
            Back to overview
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
