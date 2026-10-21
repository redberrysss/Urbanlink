import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Accessibility,
  ArrowRight,
  HardHat,
  Loader2,
  Recycle,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { ROLES_META } from '@/utils/constants';
import { cn } from '@/utils/cn';
import type { UserRole } from '@/types';

const DEMO_ROLES: { role: UserRole; icon: typeof Users; description: string }[] = [
  { role: 'resident', icon: Users, description: 'Navigate, report issues, track progress and earn recycling rewards.' },
  { role: 'admin', icon: ShieldCheck, description: 'Full oversight of reports, teams, hazards, users and analytics.' },
  { role: 'maintenance', icon: HardHat, description: 'Work through assigned tasks, upload evidence and close jobs.' },
  { role: 'operator', icon: Recycle, description: 'Verify recycling submissions, manage stations and award points.' },
];

export function SignInPage() {
  const { signIn, signInDemo, backend, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [email, setEmail] = useState('resident@townsync.demo');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<UserRole | null>(null);

  useEffect(() => {
    if (user) navigate('/app', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      toast({ kind: 'success', title: 'Welcome back', description: 'You are signed in to TownSync.' });
      navigate(location.state?.from ?? '/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: UserRole) => {
    setDemoLoading(role);
    try {
      const demoUser = await signInDemo(role);
      toast({
        kind: 'success',
        title: `Signed in as ${demoUser.name}`,
        description: `${ROLES_META[role].label} workspace loaded.`,
      });
      navigate(
        role === 'admin'
          ? '/app/admin'
          : role === 'maintenance'
            ? '/app/tasks'
            : role === 'operator'
              ? '/app/verification'
              : '/app',
        { replace: true },
      );
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-ink-950">
      {/* Left panel */}
      <div className="relative hidden w-[46%] overflow-hidden bg-primary-700 lg:block">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(40rem 30rem at 20% 10%, rgba(255,255,255,0.28), transparent 60%), radial-gradient(35rem 30rem at 90% 90%, rgba(251,90,54,0.45), transparent 60%)',
          }}
        />
        <div className="grid-pattern absolute inset-0 opacity-30" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/">
            <Logo inverted />
          </Link>
          <div>
            <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white">
              One connected platform for the whole township.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-100/85">
              Accessible routing, community maintenance, neighbourhood safety and recycling
              rewards — all reading and writing the same records.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { icon: Accessibility, label: 'Accessibility-aware routing' },
                { icon: ShieldCheck, label: 'Shared safety intelligence' },
                { icon: Recycle, label: 'Verified recycling rewards' },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <li key={f.label} className="flex items-center gap-3 text-sm font-medium text-primary-50">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    {f.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="text-xs text-primary-200/70">
            Prototype demonstration · simulated township data · maps © OpenStreetMap contributors
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex lg:hidden">
            <Logo />
          </Link>

          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
            Sign in to TownSync
          </h1>
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
            {backend === 'demo'
              ? 'Demo mode is active — no Firebase credentials are required.'
              : 'Sign in with your township account.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@township.gov.my"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400 hover:text-primary-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-500 dark:text-ink-400">
            New to TownSync?{' '}
            <Link to="/register" className="font-bold text-primary-600 hover:underline dark:text-primary-300">
              Create an account
            </Link>
          </p>

          {/* Demo roles */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-ink-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-bold uppercase tracking-wider text-ink-400 dark:bg-ink-950">
                  Or continue as a demo role
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-2.5">
              {DEMO_ROLES.map((d) => {
                const Icon = d.icon;
                const meta = ROLES_META[d.role];
                const busy = demoLoading === d.role;
                return (
                  <motion.button
                    key={d.role}
                    type="button"
                    onClick={() => handleDemo(d.role)}
                    disabled={demoLoading !== null}
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    className={cn(
                      'group flex items-center gap-3.5 rounded-2xl border border-ink-200 bg-white p-3.5 text-left transition hover:border-primary-300 hover:bg-primary-50/40 disabled:opacity-60 dark:border-white/10 dark:bg-ink-900 dark:hover:bg-primary-500/10',
                    )}
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                      style={{ backgroundColor: meta.color }}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink-900 dark:text-white">
                        {meta.label}
                      </span>
                      <span className="block text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                        {d.description}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
