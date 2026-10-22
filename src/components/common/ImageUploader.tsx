import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface UploadedImage {
  dataUrl: string;
  name: string;
  size: number;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)} MB`;
}

export function ImageUploader({
  value,
  onChange,
  label = 'Photo evidence',
  hint,
  maxBytes = 3 * 1024 * 1024,
}: {
  value?: UploadedImage | null;
  onChange: (v: UploadedImage | null) => void;
  label?: string;
  hint?: string;
  maxBytes?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const limitLabel = formatMb(maxBytes);
  const resolvedHint = hint ?? `JPG, PNG or WebP up to ${limitLabel}. Optional but speeds up verification.`;
  const lastFileRef = useRef<File | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError('Use a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > maxBytes) {
      setError(`Image is larger than ${limitLabel}. Please compress it and try again.`);
      return;
    }
    lastFileRef.current = file;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ dataUrl: String(reader.result), name: file.name, size: file.size });
      setBusy(false);
    };
    reader.onerror = () => {
      setError('Could not read that image. Please try again.');
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  const retry = () => {
    if (lastFileRef.current) handleFile(lastFileRef.current);
  };

  return (
    <div>
      <span className="label">{label}</span>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-ink-200 dark:border-white/10">
          <img src={value.dataUrl} alt="Uploaded preview" className="h-44 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-ink-950/70 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
          <p className="bg-ink-50 px-3 py-2 text-xs text-ink-500 dark:bg-white/5 dark:text-ink-400">
            {value.name}
          </p>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-300 bg-ink-50/60 px-4 py-7 text-center transition dark:border-white/15 dark:bg-white/[0.02]',
            error && 'border-rose-300 dark:border-rose-500/40',
          )}
        >
          {busy ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                Processing image…
              </span>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6 text-ink-400" />
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="btn-secondary btn-sm"
                >
                  Take photo
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="btn-secondary btn-sm"
                >
                  Choose photo
                </button>
              </div>
              <span className="text-xs text-ink-400">JPG, PNG or WebP · maximum {limitLabel}</span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {error ? (
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-rose-600">{error}</p>
          {lastFileRef.current ? (
            <button
              type="button"
              onClick={retry}
              className="text-xs font-bold text-primary-600 hover:underline dark:text-primary-300"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
      {!error ? <p className="hint">{resolvedHint}</p> : null}
    </div>
  );
}
