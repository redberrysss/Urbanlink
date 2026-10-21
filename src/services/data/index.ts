import { firebaseConfigured, demoForced } from '@/services/firebase/config';
import { demoRepository } from './demoRepository';
import { createFirebaseRepository } from '@/services/firebase/firebaseRepository';
import type { Repository } from './types';

let repository: Repository | null = null;

/**
 * Resolves the active data backend.
 *
 * • Firebase is used when the Vite environment variables are present.
 * • Otherwise the application falls back to the local demo repository, which
 *   is fully interactive and persists to localStorage.
 */
export function getRepository(): Repository {
  if (repository) return repository;
  if (firebaseConfigured && !demoForced) {
    try {
      repository = createFirebaseRepository();
    } catch {
      repository = demoRepository;
    }
  } else {
    repository = demoRepository;
  }
  return repository;
}

export const isDemoBackend = () => getRepository().kind === 'demo';
export type { Repository };
