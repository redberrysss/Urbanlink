import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-24">
      <div className="text-center">
        <p className="text-7xl font-extrabold tracking-tight text-primary-600 dark:text-primary-300">
          404
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
          This page is off the map
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          The route you followed does not exist in this township. Try the overview or head back to
          the home page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/app" className="btn-primary">
            <Home className="h-4 w-4" />
            Go to dashboard
          </Link>
          <Link to="/" className="btn-secondary">
            <Compass className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
