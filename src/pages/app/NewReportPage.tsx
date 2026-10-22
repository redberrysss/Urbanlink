import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Copy, Crosshair, MapPin, Plus } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ImageUploader, type UploadedImage } from '@/components/common/ImageUploader';
import { Badge } from '@/components/common/Badge';
import { TownshipMap } from '@/components/maps/TownshipMap';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { TOWNSHIP, PLACES } from '@/data/township';
import { findPotentialDuplicates } from '@/services/analytics/duplicates';
import { REPORT_CATEGORY_META } from '@/utils/constants';
import type { ReportCategory, ReportSeverity } from '@/types';
import { cn } from '@/utils/cn';
import { EMPTY_LIST } from '@/utils/empty';

const DRAFT_KEY = 'townsync.report.draft.v1';
type YesNo = 'yes' | 'no' | 'unsure';

interface Draft {
  title: string;
  description: string;
  category: ReportCategory;
  address: string;
  position: { lat: number; lng: number } | null;
  blocksPath: YesNo | null;
  injuryRisk: YesNo | null;
  photo: UploadedImage | null;
}

function loadDraft(): Partial<Draft> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<Draft>) : {};
  } catch {
    return {};
  }
}

export function NewReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { reports, createReport } = useTownshipData();

  const draft = useRef(loadDraft()).current;

  const [title, setTitle] = useState(draft.title ?? '');
  const [titleEdited, setTitleEdited] = useState(Boolean(draft.title));
  const [description, setDescription] = useState(draft.description ?? '');
  const [category, setCategory] = useState<ReportCategory>(draft.category ?? 'damaged_pavement');
  const [address, setAddress] = useState(draft.address ?? '');
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    draft.position ?? null,
  );
  const [blocksPath, setBlocksPath] = useState<YesNo | null>(draft.blocksPath ?? null);
  const [injuryRisk, setInjuryRisk] = useState<YesNo | null>(draft.injuryRisk ?? null);
  const [photo, setPhoto] = useState<UploadedImage | null>(draft.photo ?? null);
  const [locating, setLocating] = useState(false);
  const [picking, setPicking] = useState(!draft.position);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const placeOptions = useMemo(() => PLACES, []);

  /* Suggested title from category + location (never invents location details). */
  const suggestedTitle = useMemo(() => {
    const cat = REPORT_CATEGORY_META[category].label.replace(/ Problems?$/, '').replace(/s$/, '');
    const where = address.trim();
    return where ? `${cat} near ${where}` : cat;
  }, [category, address]);

  const effectiveTitle = titleEdited ? title : suggestedTitle;

  /* Persist the draft so recovering from a failure or navigating back keeps it. */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const payload: Draft = {
        title: titleEdited ? title : '',
        description,
        category,
        address,
        position,
        blocksPath,
        injuryRisk,
        photo,
      };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [title, titleEdited, description, category, address, position, blocksPath, injuryRisk, photo]);

  const duplicates = useMemo(() => {
    if (!position || !description.trim()) return [];
    return findPotentialDuplicates(
      { category, title: effectiveTitle, description, position },
      reports.data ?? EMPTY_LIST,
    );
  }, [effectiveTitle, description, category, position, reports.data]);

  const errors = {
    description:
      description.trim().length < 20
        ? 'Describe the problem in at least 20 characters so crews know what to expect.'
        : undefined,
    address: !address.trim() ? 'Add the nearest street or landmark.' : undefined,
    position: !position ? 'Drop a pin on the map or use your location.' : undefined,
  };

  const isValid = !Object.values(errors).some(Boolean);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      toast({
        kind: 'error',
        title: 'Location unavailable',
        description: 'This device does not support geolocation. Drop a pin instead.',
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPicking(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast({
          kind: 'error',
          title: 'Could not get your location',
          description: 'Drop a pin on the map or search for a place instead.',
        });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const severityFromAnswers: ReportSeverity =
    injuryRisk === 'yes' ? 'critical' : blocksPath === 'yes' ? 'high' : 'medium';
  const affectsAccessibility = blocksPath === 'yes';
  const isSafetyHazard = injuryRisk === 'yes';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || !user || !position) return;

    setSubmitting(true);
    try {
      const created = await createReport({
        title: effectiveTitle.trim(),
        description: description.trim(),
        category,
        severity: severityFromAnswers,
        position,
        address: address.trim(),
        photoUrl: photo?.dataUrl,
        affectedResidents: 0,
        affectsAccessibility,
        isSafetyHazard,
      });
      window.localStorage.removeItem(DRAFT_KEY);
      toast({
        kind: 'success',
        title: `Report ${created.reference} submitted`,
        description: 'You will be notified as its status changes.',
      });
      navigate(`/app/reports/${created.id}`);
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not submit the report',
        description:
          (err instanceof Error ? err.message : 'Unexpected error.') +
          ' Your details are kept — try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Report an issue"
        description="Four quick steps: a photo, the location, a category and a description."
      />

      <PageBody>
        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Card>
              <CardHeader
                icon={<MapPin className="h-5 w-5" />}
                title="What is the problem?"
                subtitle="Start with a category and a short description."
              />
              <CardBody className="space-y-5">
                <div>
                  <span className="label">Category</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(Object.keys(REPORT_CATEGORY_META) as ReportCategory[]).map((c) => {
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
                          </span>
                        </button>
                      );
                    })}
                  </div>
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
                    placeholder="Describe what is wrong and anything a crew should bring…"
                    className={cn('input', touched && errors.description && 'border-rose-400')}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    {touched && errors.description ? (
                      <p className="text-xs font-medium text-rose-600">{errors.description}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[11px] text-ink-400">
                      {description.trim().length} characters
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="report-title" className="label">
                    Title
                  </label>
                  <input
                    id="report-title"
                    value={effectiveTitle}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setTitleEdited(true);
                    }}
                    placeholder={suggestedTitle}
                    className="input"
                  />
                  <p className="hint">
                    Suggested from the category and location. Edit it if you like.
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<AlertTriangle className="h-5 w-5" />}
                title="Impact"
                subtitle="Two quick questions — the township office sets the final priority."
              />
              <CardBody className="grid gap-5 sm:grid-cols-2">
                <YesNoQuestion
                  label="Does this block the walkway or entrance?"
                  value={blocksPath}
                  onChange={setBlocksPath}
                />
                <YesNoQuestion
                  label="Could this cause an injury?"
                  value={injuryRisk}
                  onChange={setInjuryRisk}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                icon={<MapPin className="h-5 w-5" />}
                title="Photo"
                subtitle="Optional, but it helps crews identify the problem."
              />
              <CardBody>
                <ImageUploader value={photo} onChange={setPhoto} label="Add a photo" />
              </CardBody>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader
                icon={<MapPin className="h-5 w-5" />}
                title="Location"
                subtitle={picking ? 'Click the map to place a pin' : 'Location captured'}
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
              <CardBody className="space-y-4">
                <div>
                  <label htmlFor="place-search" className="label">
                    Search a place
                  </label>
                  <input
                    id="place-search"
                    list="place-options"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Damai Community Centre"
                    className={cn('input', touched && errors.address && 'border-rose-400')}
                  />
                  <datalist id="place-options">
                    {placeOptions.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                  {touched && errors.address ? (
                    <p className="mt-1 text-xs font-medium text-rose-600">{errors.address}</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="btn-secondary w-full"
                >
                  <Crosshair className="h-4 w-4" />
                  {locating ? 'Getting location…' : 'Use my location'}
                </button>

                {position ? (
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Pin set at {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                  </p>
                ) : touched ? (
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {errors.position}
                  </p>
                ) : null}
              </CardBody>
            </Card>

            {duplicates.length > 0 ? (
              <Card>
                <CardHeader
                  icon={<Copy className="h-5 w-5" />}
                  title="Already reported nearby"
                  subtitle="Support an existing report instead of creating a duplicate."
                />
                <CardBody className="space-y-2">
                  {duplicates.map((d) => {
                    const match = (reports.data ?? EMPTY_LIST).find((r) => r.id === d.reportId);
                    return (
                      <Link
                        key={d.reportId}
                        to={`/app/reports/${d.reportId}`}
                        className="block rounded-xl border border-ink-100 p-3 transition hover:border-primary-300 dark:border-white/10"
                      >
                        <p className="text-xs font-bold text-ink-800 dark:text-ink-100">
                          {match?.title ?? 'Existing report'}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink-400">
                          {match?.reference ?? d.reportId} · {Math.round(d.score * 100)}% similar ·{' '}
                          {Math.round(d.distanceM)} m away
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary-600 dark:text-primary-300">
                          <ThumbsUpIcon /> View and support
                        </p>
                      </Link>
                    );
                  })}
                </CardBody>
              </Card>
            ) : null}

            <Card>
              <CardBody className="space-y-3">
                <Badge color="#176B5B" bg="#EAF6F3">
                  {REPORT_CATEGORY_META[category].label}
                </Badge>
                {touched && !isValid ? (
                  <p className="text-[11px] font-medium text-rose-600">
                    Complete the required fields to submit.
                  </p>
                ) : null}
                <Button type="submit" loading={submitting} className="w-full" size="lg">
                  <Plus className="h-4 w-4" />
                  Submit report
                </Button>
                <p className="text-[11px] leading-relaxed text-ink-400">
                  Your draft is saved automatically, so you can retry if something goes wrong.
                  A reference number appears only once the report is confirmed.
                </p>
              </CardBody>
            </Card>
          </div>
        </form>
      </PageBody>
    </div>
  );
}

function ThumbsUpIcon() {
  return <CheckCircle2 className="h-3 w-3" />;
}

function YesNoQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: YesNo | null;
  onChange: (v: YesNo) => void;
}) {
  const options: { id: YesNo; label: string }[] = [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
    { id: 'unsure', label: 'Not sure' },
  ];
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-bold transition',
                active
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-200'
                  : 'border-ink-200 text-ink-600 hover:border-primary-300 dark:border-white/10 dark:text-ink-300',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
