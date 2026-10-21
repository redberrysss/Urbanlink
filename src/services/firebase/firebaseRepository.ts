import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
  type UpdateData,
} from 'firebase/firestore';
import type {
  AccessibilityObstacle,
  AppNotification,
  MaintenanceTask,
  RecyclingActivity,
  RecyclingStation,
  Report,
  RewardTransaction,
  SafetyHazard,
  User,
} from '@/types';
import type { Repository } from '../data/types';
import { getFirestoreDb } from './client';

const COLLECTIONS = {
  reports: 'reports',
  obstacles: 'accessibilityFeatures',
  hazards: 'safetyHazards',
  stations: 'recyclingStations',
  activities: 'recyclingActivities',
  transactions: 'rewardTransactions',
  tasks: 'maintenanceTasks',
  notifications: 'notifications',
  users: 'users',
} as const;

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out;
}

export function createFirebaseRepository(db: Firestore = getFirestoreDb()): Repository {
  const readAll = async <T>(name: string): Promise<T[]> => {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<T, 'id'>) }) as T);
  };

  const write = async (name: string, id: string, data: Record<string, unknown>) => {
    await setDoc(doc(db, name, id), stripUndefined(data) as UpdateData<DocumentData>, {
      merge: true,
    });
  };

  const patch = async (name: string, id: string, data: Partial<Record<string, unknown>>) => {
    await updateDoc(
      doc(db, name, id),
      stripUndefined(data as Record<string, unknown>) as UpdateData<DocumentData>,
    );
  };

  return {
    kind: 'firebase',

    listReports: () => readAll<Report>(COLLECTIONS.reports),
    listObstacles: () => readAll<AccessibilityObstacle>(COLLECTIONS.obstacles),
    listHazards: () => readAll<SafetyHazard>(COLLECTIONS.hazards),
    listStations: () => readAll<RecyclingStation>(COLLECTIONS.stations),
    listActivities: () => readAll<RecyclingActivity>(COLLECTIONS.activities),
    listTransactions: () => readAll<RewardTransaction>(COLLECTIONS.transactions),
    listTasks: () => readAll<MaintenanceTask>(COLLECTIONS.tasks),
    async listNotifications(userId: string) {
      const q = query(
        collection(db, COLLECTIONS.notifications),
        where('userId', '==', userId),
      );
      const snap = await getDocs(q);
      return snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) }) as AppNotification,
      );
    },
    listUsers: () => readAll<User>(COLLECTIONS.users),

    createReport: (report) => write(COLLECTIONS.reports, report.id, report as never),
    updateReport: (id, p) => patch(COLLECTIONS.reports, id, p as never),

    createObstacle: (o) => write(COLLECTIONS.obstacles, o.id, o as never),
    updateObstacle: (id, p) => patch(COLLECTIONS.obstacles, id, p as never),

    createHazard: (h) => write(COLLECTIONS.hazards, h.id, h as never),
    updateHazard: (id, p) => patch(COLLECTIONS.hazards, id, p as never),

    createStation: (s) => write(COLLECTIONS.stations, s.id, s as never),
    updateStation: (id, p) => patch(COLLECTIONS.stations, id, p as never),

    createActivity: (a) => write(COLLECTIONS.activities, a.id, a as never),
    updateActivity: (id, p) => patch(COLLECTIONS.activities, id, p as never),

    createTransaction: (t) => write(COLLECTIONS.transactions, t.id, t as never),

    createTask: (t) => write(COLLECTIONS.tasks, t.id, t as never),
    updateTask: (id, p) => patch(COLLECTIONS.tasks, id, p as never),

    createNotification: (n) => write(COLLECTIONS.notifications, n.id, n as never),
    updateNotification: (id, p) => patch(COLLECTIONS.notifications, id, p as never),

    updateUser: (id, p) => patch(COLLECTIONS.users, id, p as never),
  };
}
