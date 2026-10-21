import { useState } from 'react';
import {
  Bell,
  Database,
  Globe,
  Keyboard,
  Moon,
  Palette,
  RefreshCw,
  Shield,
  Sun,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { ConfirmDialog } from '@/components/common/Modal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useToast } from '@/components/common/Toast';
import { ROLES_META } from '@/utils/constants';
import { cn } from '@/utils/cn';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { resetDemoData, refreshAll } = useTownshipData();
  const { toast } = useToast();

  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notifications, setNotifications] = useState({
    reports: true,
    safety: true,
    rewards: true,
    digest: false,
  });

  const handleReset = async () => {
    setBusy(true);
    try {
      await resetDemoData();
      toast({
        kind: 'success',
        title: 'Demo data reset',
        description: 'All reports, hazards, tasks and recycling records are back to their seeded state.',
      });
      setResetOpen(false);
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not reset the demo data',
        description: err instanceof Error ? err.message : 'Unexpected error.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    setBusy(true);
    try {
      await refreshAll();
      toast({ kind: 'success', title: 'Data refreshed', description: 'All modules re-synced.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="TownSync · Preferences"
        title="Settings"
        description="Control how TownSync looks, what it tells you about and how the demo data behaves."
      />

      <PageBody className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Appearance */}
          <Card>
            <CardHeader
              icon={<Palette className="h-5 w-5" />}
              title="Appearance"
              subtitle="Theme preference is stored on this device"
            />
            <CardBody className="space-y-4">
              <div>
                <span className="label">Colour theme</span>
                <SegmentedControl
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: 'light', label: 'Light', icon: <Sun className="h-3.5 w-3.5" /> },
                    { value: 'dark', label: 'Dark', icon: <Moon className="h-3.5 w-3.5" /> },
                  ]}
                />
              </div>

              <div className="rounded-xl border border-ink-100 p-4 dark:border-white/10">
                <p className="flex items-center gap-2 text-xs font-bold text-ink-800 dark:text-ink-100">
                  <Keyboard className="h-3.5 w-3.5" />
                  Keyboard shortcuts
                </p>
                <ul className="mt-2 space-y-1.5 text-[11px] text-ink-500 dark:text-ink-400">
                  <li className="flex items-center justify-between gap-3">
                    <span>Open the command palette</span>
                    <kbd className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] font-bold dark:bg-white/10">
                      ⌘ K
                    </kbd>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Submit a new report</span>
                    <kbd className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] font-bold dark:bg-white/10">
                      N
                    </kbd>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Toggle sidebar</span>
                    <kbd className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] font-bold dark:bg-white/10">
                      B
                    </kbd>
                  </li>
                </ul>
              </div>
            </CardBody>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader
              icon={<Bell className="h-5 w-5" />}
              title="Notification preferences"
              subtitle="Choose which events reach your notification centre"
            />
            <CardBody className="space-y-2.5">
              {(
                [
                  {
                    key: 'reports' as const,
                    label: 'Report updates',
                    body: 'Status changes, assignments and resolution on reports you raised or supported.',
                  },
                  {
                    key: 'safety' as const,
                    label: 'Safety alerts',
                    body: 'New hazards near you and warnings issued by the township office.',
                  },
                  {
                    key: 'rewards' as const,
                    label: 'Recycling rewards',
                    body: 'Points credited, badges unlocked and leaderboard movement.',
                  },
                  {
                    key: 'digest' as const,
                    label: 'Weekly digest',
                    body: 'A summary of township activity every Monday morning.',
                  },
                ]
              ).map((pref) => (
                <button
                  key={pref.key}
                  type="button"
                  onClick={() =>
                    setNotifications((n) => ({ ...n, [pref.key]: !n[pref.key] }))
                  }
                  aria-pressed={notifications[pref.key]}
                  className="flex w-full items-start gap-3 rounded-xl border border-ink-100 p-3.5 text-left transition hover:border-primary-300 dark:border-white/10"
                >
                  <span
                    className={cn(
                      'mt-0.5 h-5 w-9 shrink-0 rounded-full p-0.5 transition',
                      notifications[pref.key] ? 'bg-primary-600' : 'bg-ink-200 dark:bg-white/15',
                    )}
                  >
                    <span
                      className={cn(
                        'block h-4 w-4 rounded-full bg-white shadow transition',
                        notifications[pref.key] ? 'translate-x-4' : 'translate-x-0',
                      )}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-ink-800 dark:text-ink-100">
                      {pref.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                      {pref.body}
                    </span>
                  </span>
                </button>
              ))}
            </CardBody>
          </Card>

          {/* Account */}
          <Card>
            <CardHeader
              icon={<UserIcon className="h-5 w-5" />}
              title="Account"
              subtitle="Your role and session details"
            />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-ink-50 p-3.5 dark:bg-white/[0.04]">
                <div>
                  <p className="text-xs font-bold text-ink-800 dark:text-ink-100">Signed in as</p>
                  <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">{user?.email}</p>
                </div>
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                  {user ? ROLES_META[user.role].label : '—'}
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/10">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                <p className="text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                  Roles control which modules are available. Switch roles from the account menu in the
                  top bar to preview the resident, maintenance, operator and township admin
                  experiences.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/10">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                <p className="text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                  Dates and weights use Malaysian conventions (en-MY, metric). Bandar Seri Damai is a
                  simulated township created for this demonstration.
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Data */}
          <Card>
            <CardHeader
              icon={<Database className="h-5 w-5" />}
              title="Data & backend"
              subtitle="TownSync runs fully offline in demo mode — no server required"
            />
            <CardBody className="space-y-4">
              <div className="rounded-xl border border-ink-100 p-4 dark:border-white/10">
                <p className="text-xs font-bold text-ink-800 dark:text-ink-100">Current backend</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                  The demo repository stores everything in this browser&apos;s local storage under the
                  key <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[10px] dark:bg-white/10">townsync.demo.v1</code>.
                  Adding Firebase credentials in <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[10px] dark:bg-white/10">.env</code> switches the
                  app to the cloud backend automatically.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={handleRefresh}
                  loading={busy}
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Refresh all data
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setResetOpen(true)}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Reset demo data
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </PageBody>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        title="Reset demo data?"
        message="Every report, hazard, obstacle, maintenance task and recycling record returns to its original seeded state. This cannot be undone."
        confirmLabel="Reset everything"
        tone="danger"
        loading={busy}
      />
    </div>
  );
}
