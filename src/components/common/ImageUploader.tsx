import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface UploadedImage {
  dataUrl: string;
  name: string;
  size: number;
}

export function ImageUploader({
  value,
  onChange,
  label = 'Photo evidence',
  hint = 'JPG or PNG up to 5 MB. Optional but speeds up verification.',
  maxBytes = 5 * 1024 * 1024,
}: {
  value?: UploadedImage | null;
  onChange: (v: UploadedImage | null) => void;
  label?: string;
  hint?: string;
  maxBytes?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > maxBytes) {
      setError('Image is larger than 5 MB. Please compress it and try again.');
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ dataUrl: String(reader.result), name: file.name, size: file.size });
      setBusy(false);
    };
    reader.onerror = () => {
      setError('Could not read that image.');
      setBusy(false);
    };
    reader.readAsDataURL(file);
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-300 bg-ink-50/60 px-4 py-8 text-center transition hover:border-primary-400 hover:bg-primary-50/50 dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-primary-500/50',
            error && 'border-rose-300 dark:border-rose-500/40',
          )}
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          ) : (
            <ImagePlus className="h-6 w-6 text-ink-400" />
          )}
          <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
            {busy ? 'Processing image…' : 'Tap to upload or drop an image'}
          </span>
          <span className="text-xs text-ink-400">Maximum 5 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
      {!error ? <p className="hint">{hint}</p> : null}
    </div>
  );
}
