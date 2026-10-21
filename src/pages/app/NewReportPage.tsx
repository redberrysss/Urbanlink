import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  Copy,
  MapPin,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ImageUploader, type UploadedImage } from '@/components/common/ImageUploader';
import { Badge } from '@/components/common/Badge';
import { Meter } from '@/components/common/Progress';
import { TownshipMap } from '@/components/maps/TownshipMap';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { TOWNSHIP } from '@/data/township';
import { findPotentialDuplicates } from '@/services/analytics/duplicates';
import { computePriority } from '@/services/analytics/priority';
import {
  REPORT_CATEGORY_META,
  SEVERITY_META,
  formatDate,
} from '@/utils/constants';
import type { ReportCategory, ReportSeverity } from '@/types';
import { cn } from '@/utils/cn';

import { EMPTY_LIST } from '@/utils/empty';
const SEVERITIES: ReportSeverity[] = ['low', 'medium', 'high', 'critical'];

export function NewReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { reports, createReport } = useTownshipData();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('damaged_pavement');
  const [severity, setSeverity] = useState<ReportSeverity>('medium');
  const [address, setAddress] = useState('');
  const [affectedResidents, setAffectedResidents] = useState(20);
  const [affectsAccessibility, setAffectsAccessibility] = useState(false);
  const [isSafetyHazard, setIsSafetyHazard] = useState(false);
  const [photo, setPhoto] = useState<UploadedImage | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [picking, setPicking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const duplicates = useMemo(() => {
    if (!title.trim() || !position) return [];
    return findPotentialDuplicates(
      {
        category,
        title,
        description,
        position,
      },
      reports.data ?? EMPTY_LIST,
    );
  }, [title, description, category, position, reports.data]);

  const priority = useMemo(
    () =>
      computePriority({
        category,
        severity,
        affectedResidents,
        isSafetyRelated: isSafetyHazard,
        daysSinceSubmission: 0,
        duplicateCount: duplicates.length,
        supporterCount: 0,
      }),
    [category, severity, affectedResidents, isSafetyHazard, duplicates.length],
  );

  const errors = {
    title: !title.trim() ? 'Give the issue a short, specific title.' : undefined,
    description:
      description.trim().length < 20
        ? 'Describe the problem in at least 20 characters so crews know what to expect.'
        : undefined,
    address: !address.trim() ? 'Add the nearest street or landmark.' : undefined,
    position: !position ? 'Drop a pin on the map to mark the exact location.' : undefined,
  };

  const isValid = !Object.values(errors).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || !user || !position) return;

    setSubmitting(true);
    try {
      const created = await createReport({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        position,
        address: address.trim(),
        photoUrl: photo?.dataUrl,
        affectedResidents,
        affectsAccessibility,
        isSafetyHazard,
      });
      toast({
        kind: 'success',
        title: `Report ${created.reference} submitted`,
        description:
          'It is now visible to the township office and any linked modules have been updated.',
      });
      navigate(`/app/reports/${created.id}`);
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not submit the report',
        description: err instanceof Error ? err.message : 'Unexpected error.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const meta = REPORT_CATEGORY_META[category];

  return (
    <div>
      <PageHeader
        eyebrow="FixMyTown · New Community Report"
        title="Report an issue"
        description="One submission reaches the township office, the route planner and the safety monitor at the same time — so the problem is fixed once and seen everywhere."
      />

      <PageBody>
        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Card>
              <CardHeader
                icon={<MapPin className="h-5 w-5" />}
                title="What is the problem?"
                subtitle="Be specific — precise descriptions get resolved faster."
              />
              <CardBody className="space-y-5">
                <div>
                  <label htmlFor="report-title" className="label">
                    Title
                  </label>
                  <input
                    id="report-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Broken paving slab outside Taman Melati block"
                    className={cn('input', touched && errors.title && 'border-rose-400')}
                  />
                  {touched && errors.title ? (
                    <p className="mt-1 text-xs font-medium text-rose-600">{errors.title}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="report-description" className="label">
                    Description
                  </label>
                  <textarea
                    id="report-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what is wrong, how it affects people and anything a crew should bring…"
                    className={cn('input', touched && errors.description && 'border-rose-400')}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    {touched && errors.description ? (
                      <p className="text-xs font-medium text-rose-600">{errors.description}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[11px] text-ink-400">{description.trim().length} characters</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="label">Category</span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(
                        Object.keys(REPORT_CATEGORY_META) as ReportCategory[]
                      ).map((c) => {
                        const m = REPORT_CATEGORY_META[c];
                        const active = category === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCategory(c)}
                            aria-pressed={active}
                            className={cn(
                              'flex items-start gap-2 rounded-xl border p-3 text-left transition',
                              active
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                                : 'border-ink-200 hover:border-primary-300 dark:border-white/10',
                            )}
                          >
                            <span
                              className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: m.color }}
                            />
                            <span className="min-w-0">
                              <span className="block text-xs font-bold text-ink-800 dark:text-ink-100">
                                {m.label}
                              </span>
                              <span className="mt-0.5 block text-[10px] leading-snug text-ink-500 dark:text-ink-400">
                                {m.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="label">Severity</span>
                      <div className="flex flex-wrap gap-1.5">
                        {SEVERITIES.map((s) => {
                          const m = SEVERITY_META[s];
                          const active = severity === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSeverity(s)}
                              aria-pressed={active}
                              className="rounded-lg border px-3 py-1.5 text-xs font-bold transition"
                              style={
                                active
                                  ? { backgroundColor: m.bg, borderColor: m.color, color: m.color }
                                  : undefined
                              }
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="affected" className="label">
                        Residents affected (estimate)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          id="affected"
                          type="range"
                          min={1}
                          max={500}
                          step={1}
                          value={affectedResidents}
                          onChange={(e) => setAffectedResidents(Number(e.target.value))}
                          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-ink-200 accent-primary-600 dark:bg-white/15"
                        />
                        <span className="w-16 text-right text-sm font-bold text-ink-900 dark:text-white">
                          {affectedResidents}
                        </span>
                      </div>
                      <p className="hint">
                        Used only to prioritise. Higher values raise the automatic priority score.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="label">Photo evidence (optional)</span>
                  <ImageUploader
                    value={photo}
                    onChange={setPhoto}
                    label="Add a photo"
                    hint="JPG or PNG up to 3 MB. Helps crews identify the exact problem."
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<Sparkles className="h-5 w-5" />}
                title="Module escalation"
                subtitle="Tick everything this issue affects — TownSync creates the linked records automatically."
              />
              <CardBody className="grid gap-3 sm:grid-cols-2">
                <ToggleCard
                  active={affectsAccessibility}
                  onToggle={() => setAffectsAccessibility((v) => !v)}
                  icon={<Accessibility className="h-4 w-4" />}
                  color="#176B5B"
                  title="Blocks accessibility"
                  body="Adds a route obstacle so every pedestrian route avoids this location."
                />
                <ToggleCard
                  active={isSafetyHazard}
                  onToggle={() => setIsSafetyHazard((v) => !v)}
                  icon={<ShieldAlert className="h-4 w-4" />}
                  color="#F0330F"
                  title="Safety hazard"
                  body="Raises a SafeSpot warning with a neighbourhood risk score for the area."
                />
              </CardBody>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader
                icon={<MapPin className="h-5 w-5" />}
                title="Pin the exact location"
                subtitle={picking ? 'Click the map to place the pin' : 'Location captured'}
                action={
                  <Button
                    size="sm"
                    variant={picking ? 'primary' : 'secondary'}
                    onClick={() => setPicking((p) => !p)}
                  >
                    {picking ? 'Picking…' : 'Repick'}
                  </Button>
                }
              />
              <div className="h-[320px]">
                <TownshipMap
                  layers={{ routes: true, issues: false, hazards: false, stations: false }}
                  reports={[]}
                  obstacles={[]}
                  hazards={[]}
                  stations={[]}
                  picking={picking}
                  picked={position}
                  onMapClick={(p) => {
                    setPosition(p);
                    setPicking(false);
                  }}
                  center={TOWNSHIP.center}
                  zoom={16}
                />
              </div>
              <CardBody>
                <div>
                  <label htmlFor="report-address" className="label">
                    Address or nearest landmark
                  </label>
                  <input
                    id="report-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Jalan Melati 3, near the playground"
                    className={cn('input', touched && errors.address && 'border-rose-400')}
                  />
                  {touched && errors.address ? (
                    <p className="mt-1 text-xs font-medium text-rose-600">{errors.address}</p>
                  ) : null}
                </div>
                {position ? (
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                  </p>
                ) : touched ? (
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {errors.position}
                  </p>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<Sparkles className="h-5 w-5" />}
                title="Estimated priority"
                subtitle="Calculated automatically from severity, impact and category"
              />
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge color="#176B5B" bg="#EAF6F3">
                    {meta.label}
                  </Badge>
                  <span className="text-2xl font-extrabold text-ink-900 dark:text-white">
                    {priority.total}
                    <span className="ml-1 text-xs font-bold text-ink-400">pts</span>
                  </span>
                </div>
                <Meter label="Safety impact" value={priority.safetyImpact} suffix="/100" color="#F0330F" />
                <Meter label="Population impact" value={priority.populationImpact} suffix="/100" color="#0EA5E9" />
                <Meter
                  label="Accessibility impact"
                  value={priority.accessibilityImpact}
                  suffix="/100"
                  color="#176B5B"
                />
                {touched && !isValid ? (
                  <p className="text-[11px] font-medium text-rose-600">
                    Complete the required fields to submit.
                  </p>
                ) : null}
              </CardBody>
            </Card>

            {duplicates.length > 0 ? (
              <Card>
                <CardHeader
                  icon={<Copy className="h-5 w-5" />}
                  title="Possible duplicates found"
                  subtitle="You can still submit — the office will merge if appropriate"
                />
                <CardBody className="space-y-2">
                  {duplicates.map((d) => {
                    const match = (reports.data ?? EMPTY_LIST).find((r) => r.id === d.reportId);
                    return (
                      <div
                        key={d.reportId}
                        className="rounded-xl border border-ink-100 p-3 dark:border-white/10"
                      >
                        <p className="text-xs font-bold text-ink-800 dark:text-ink-100">
                          {match?.title ?? 'Existing report'}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink-400">
                          {match?.reference ?? d.reportId} · {Math.round(d.score * 100)}% similar ·{' '}
                          {Math.round(d.distanceM)} m away
                        </p>
                        <p className="mt-1 text-[10px] text-ink-400">{d.reasons.join(' · ')}</p>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            ) : null}

            <Card>
              <CardBody>
                <Button type="submit" loading={submitting} className="w-full" size="lg">
                  Submit report
                </Button>
                <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
                  Submitted {formatDate(new Date())} to the Bandar Seri Damai township office. You will
                  receive notifications at every status change.
                </p>
              </CardBody>
            </Card>
          </div>
        </form>
      </PageBody>
    </div>
  );
}

function ToggleCard({
  active,
  onToggle,
  icon,
  color,
  title,
  body,
}: {
  active: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  color: string;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-left transition',
        active ? 'ring-2' : 'hover:border-primary-300',
      )}
      style={
        active
          ? { borderColor: color, boxShadow: `0 0 0 2px ${color}33`, backgroundColor: `${color}0D` }
          : undefined
      }
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
        style={{ backgroundColor: color }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink-900 dark:text-white">{title}</span>
          <span
            className={cn(
              'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              active ? 'text-white' : 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-400',
            )}
            style={active ? { backgroundColor: color } : undefined}
          >
            {active ? 'On' : 'Off'}
          </span>
        </span>
        <span className="mt-1 block text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
          {body}
        </span>
      </span>
    </button>
  );
}
