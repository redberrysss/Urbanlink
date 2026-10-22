import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  Recycle,
  Save,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { MOBILITY_PROFILES } from '@/utils/constants';
import type { MobilityProfile } from '@/types';
import { cn } from '@/utils/cn';

const NOTIF_KEY = 'townsync.notification-prefs.v1';

interface NotificationPrefs {
  reports: boolean;
  safety: boolean;
  rewards: boolean;
  digest: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  reports: true,
  safety: true,
  rewards: true,
  digest: false,
};

function loadPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(NOTIF_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [block, setBlock] = useState(user?.block ?? '');
  const [mobility, setMobility] = useState<MobilityProfile>(
    user?.mobilityProfile ?? 'general',
  );
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? '');
    setBlock(user.block ?? '');
    setMobility(user.mobilityProfile ?? 'general');
  }, [user]);

  useEffect(() => {
    window.localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
  }, [prefs]);

  if (!user) {
    return (
      <PageBody>
        <Card>
          <CardBody>
            <EmptyState icon={<UserIcon className="h-5 w-5" />} title="Not signed in" />
          </CardBody>
        </Card>
      </PageBody>
    );
  }

  const points = user.points ?? 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim() || user.name,
        phone: phone.trim() || undefined,
        block: block.trim() || undefined,
        mobilityProfile: mobility,
      });
      toast({
        kind: 'success',
        title: 'Profile saved',
        description: 'Your contact details and mobility preference are up to date.',
      });
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not save your profile',
        description: err instanceof Error ? err.message : 'Unexpected error.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My profile"
        description="Your contact details, mobility preference and how the township reaches you."
      />

      <PageBody className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader
                icon={<UserIcon className="h-5 w-5" />}
                title="Your details"
                subtitle="Used on reports you raise and to route township notices to you"
              />
              <CardBody className="space-y-4">
                <div>
                  <label htmlFor="profile-name" className="label">
                    Full name
                  </label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="profile-phone" className="label">
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      id="profile-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Add a contact number"
                      className="input pl-9"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-email" className="label">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      id="profile-email"
                      value={user.email}
                      readOnly
                      className="input cursor-not-allowed pl-9 text-ink-500 dark:text-ink-400"
                    />
                  </div>
                  <p className="hint">Your sign-in email cannot be changed here.</p>
                </div>

                <div>
                  <label htmlFor="profile-block" className="label">
                    Block / street
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      id="profile-block"
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      placeholder="e.g. Emerald Residence, Block A"
                      className="input pl-9"
                    />
                  </div>
                  <p className="hint">Helps crews find the right entrance for reports near you.</p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<MapPin className="h-5 w-5" />}
                title="Mobility preference"
                subtitle="Pre-selects your route profile in the navigator"
              />
              <CardBody>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MOBILITY_PROFILES.map((p) => {
                    const active = mobility === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setMobility(p.id)}
                        aria-pressed={active}
                        className={cn(
                          'rounded-xl border p-3.5 text-left transition',
                          active
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                            : 'border-ink-200 hover:border-primary-300 dark:border-white/10',
                        )}
                      >
                        <p className="text-sm font-bold text-ink-900 dark:text-white">{p.label}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                          {p.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} loading={saving} icon={<Save className="h-4 w-4" />}>
                Save changes
              </Button>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
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
                      body: 'Status changes and resolution on reports you raised or supported.',
                    },
                    {
                      key: 'safety' as const,
                      label: 'Safety alerts',
                      body: 'New hazards near you and warnings from the township office.',
                    },
                    {
                      key: 'rewards' as const,
                      label: 'Recycling rewards',
                      body: 'Points credited and badges unlocked.',
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
                    onClick={() => setPrefs((p) => ({ ...p, [pref.key]: !p[pref.key] }))}
                    aria-pressed={prefs[pref.key]}
                    className="flex w-full items-start gap-3 rounded-xl border border-ink-100 p-3.5 text-left transition hover:border-primary-300 dark:border-white/10"
                  >
                    <span
                      className={cn(
                        'mt-0.5 h-5 w-9 shrink-0 rounded-full p-0.5 transition',
                        prefs[pref.key] ? 'bg-primary-600' : 'bg-ink-200 dark:bg-white/15',
                      )}
                    >
                      <span
                        className={cn(
                          'block h-4 w-4 rounded-full bg-white shadow transition',
                          prefs[pref.key] ? 'translate-x-4' : 'translate-x-0',
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

            <Card>
              <CardHeader
                icon={<Sparkles className="h-5 w-5" />}
                title="Your activity"
                subtitle="Jump straight into your reports and recycling"
              />
              <CardBody className="space-y-2.5">
                <Link
                  to="/app/reports?scope=mine"
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 transition hover:border-primary-300 dark:border-white/10"
                >
                  <span className="flex items-center gap-2.5">
                    <ClipboardList className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                    <span className="text-sm font-bold text-ink-800 dark:text-ink-100">
                      My reports
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-300">
                    Open
                  </span>
                </Link>
                <Link
                  to="/app/recycling?tab=activity"
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 transition hover:border-primary-300 dark:border-white/10"
                >
                  <span className="flex items-center gap-2.5">
                    <Recycle className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                    <span className="text-sm font-bold text-ink-800 dark:text-ink-100">
                      Rewards
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                    {points} pts
                  </span>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
