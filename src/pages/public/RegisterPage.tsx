import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { cn } from '@/utils/cn';

const schema = z
  .object({
    name: z.string().min(2, 'Please enter your full name'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirm: z.string(),
    phone: z
      .string()
      .optional()
      .refine((v) => !v || /^[+0-9\s-]{7,}$/.test(v), 'Enter a valid phone number'),
    block: z.string().optional(),
    terms: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms' }) }),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormValues = z.infer<typeof schema>;

const BENEFITS = [
  'Find step-free routes suited to your mobility',
  'Report problems with photo and pin in under a minute',
  'Track every step of the maintenance workflow',
  'Earn Green Reward points for verified recycling',
];

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', confirm: '', phone: '', block: '', terms: false as unknown as true },
  });

  const password = watch('password');

  const onSubmit = async (values: FormValues) => {
    try {
      await signUp({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        block: values.block,
      });
      toast({
        kind: 'success',
        title: 'Account created',
        description: 'Welcome to TownSync. Your resident workspace is ready.',
      });
      navigate('/app', { replace: true });
    } catch (err) {
      toast({
        kind: 'error',
        title: 'Could not create account',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const strength = passwordScore(password);

  return (
    <div className="flex min-h-screen bg-white dark:bg-ink-950">
      <div className="relative hidden w-[46%] overflow-hidden bg-primary-700 lg:block">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(40rem 30rem at 15% 15%, rgba(255,255,255,0.28), transparent 60%), radial-gradient(35rem 30rem at 85% 85%, rgba(16,185,129,0.4), transparent 60%)',
          }}
        />
        <div className="grid-pattern absolute inset-0 opacity-30" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/">
            <Logo inverted />
          </Link>
          <div>
            <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white">
              Join a township that runs on shared information.
            </h2>
            <ul className="mt-8 space-y-3.5">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm font-medium text-primary-50">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-100/80">
                <ShieldCheck className="h-3.5 w-3.5" />
                Privacy
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-primary-50/80">
                Your reports are public within the township so crews and management can act on them.
                Account credentials are never stored in the browser outside of your session.
              </p>
            </div>
          </div>
          <p className="text-xs text-primary-200/70">Prototype demonstration · simulated data</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex lg:hidden">
            <Logo />
          </Link>

          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
            Create your resident account
          </h1>
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
            Free for residents of the township.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="label">
                Full name
              </label>
              <input
                id="name"
                autoComplete="name"
                className={cn('input', errors.name && 'border-rose-400')}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'name-error' : undefined}
                {...register('name')}
              />
              {errors.name ? (
                <p id="name-error" className="mt-1 text-xs font-medium text-rose-600">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="reg-email" className="label">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                className={cn('input', errors.email && 'border-rose-400')}
                aria-invalid={errors.email ? true : undefined}
                {...register('email')}
              />
              {errors.email ? (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={cn('input pr-16', errors.password && 'border-rose-400')}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400 hover:text-primary-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {password ? (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-colors',
                            i < strength.level
                              ? strength.color
                              : 'bg-ink-200 dark:bg-white/10',
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                      {strength.label}
                    </span>
                  </div>
                ) : null}
                {errors.password ? (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.password.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="confirm" className="label">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={cn('input', errors.confirm && 'border-rose-400')}
                  {...register('confirm')}
                />
                {errors.confirm ? (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.confirm.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="label">
                  Phone <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+6012-555 0000"
                  className={cn('input', errors.phone && 'border-rose-400')}
                  {...register('phone')}
                />
                {errors.phone ? (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.phone.message}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="block" className="label">
                  Block / street <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input
                  id="block"
                  placeholder="Emerald Residence Block A"
                  className="input"
                  {...register('block')}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-600 dark:text-ink-300">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
                {...register('terms')}
              />
              <span>
                I agree to report issues accurately and understand that reports are visible to
                township management and maintenance crews.
              </span>
            </label>
            {errors.terms ? (
              <p className="text-xs font-medium text-rose-600">{errors.terms.message}</p>
            ) : null}

            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create account
              {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-500 dark:text-ink-400">
            Already registered?{' '}
            <Link to="/signin" className="font-bold text-primary-600 hover:underline dark:text-primary-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function passwordScore(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: 'bg-ink-200' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
  return { level: score, label: labels[score], color: colors[score] };
}
