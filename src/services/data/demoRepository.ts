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
import type { Repository } from './types';
import {
  buildSeedActivities,
  buildSeedHazards,
  buildSeedNotifications,
  buildSeedObstacles,
  buildSeedReports,
  buildSeedTasks,
  DEMO_USERS,
  RECYCLING_STATIONS,
} from '@/data/seed';

const STORAGE_KEY = 'townsync.demo.v1';

interface DemoState {
  version: 1;
  reports: Report[];
  obstacles: AccessibilityObstacle[];
  hazards: SafetyHazard[];
  stations: RecyclingStation[];
  activities: RecyclingActivity[];
  transactions: RewardTransaction[];
  tasks: MaintenanceTask[];
  notifications: AppNotification[];
  users: User[];
  seededAt: string;
}

function buildTransactions(activities: RecyclingActivity[]): RewardTransaction[] {
  return activities
    .filter((a) => a.status === 'verified' && a.pointsAwarded > 0)
    .map((a) => ({
      id: `tx_${a.id}`,
      userId: a.userId,
      userName: a.userName,
      points: a.pointsAwarded,
      reason: `Verified ${a.material} recycling (${a.weightKg} kg) at ${a.stationName}`,
      at: a.verifiedAt ?? a.submittedAt,
      activityId: a.id,
      type: 'earned' as const,
    }));
}

export function createDemoState(): DemoState {
  const reports = buildSeedReports();
  const activities = buildSeedActivities();
  return {
    version: 1,
    reports,
    obstacles: buildSeedObstacles(),
    hazards: buildSeedHazards(),
    stations: RECYCLING_STATIONS.map((s) => ({ ...s })),
    activities,
    transactions: buildTransactions(activities),
    tasks: buildSeedTasks(),
    notifications: buildSeedNotifications(),
    users: DEMO_USERS.map((u) => ({ ...u })),
    seededAt: new Date().toISOString(),
  };
}

function loadState(): DemoState {
  if (typeof window === 'undefined') return createDemoState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDemoState();
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed.version !== 1 || !Array.isArray(parsed.reports)) return createDemoState();
    return parsed;
  } catch {
    return createDemoState();
  }
}

let state: DemoState = loadState();

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — demo continues in memory */
  }
}

function replace<T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

const delay = (ms = 90) => new Promise<void>((r) => setTimeout(r, ms));

export const demoRepository: Repository = {
  kind: 'demo',

  async listReports() {
    await delay();
    return state.reports.map((r) => ({ ...r }));
  },
  async listObstacles() {
    await delay();
    return state.obstacles.map((o) => ({ ...o }));
  },
  async listHazards() {
    await delay();
    return state.hazards.map((h) => ({ ...h }));
  },
  async listStations() {
    await delay();
    return state.stations.map((s) => ({ ...s }));
  },
  async listActivities() {
    await delay();
    return state.activities.map((a) => ({ ...a }));
  },
  async listTransactions() {
    await delay();
    return state.transactions.map((t) => ({ ...t }));
  },
  async listTasks() {
    await delay();
    return state.tasks.map((t) => ({ ...t }));
  },
  async listNotifications(userId) {
    await delay();
    return state.notifications
      .filter((n) => n.userId === userId || n.scope === 'township')
      .map((n) => ({ ...n }))
      .sort((a, b) => (a.at < b.at ? 1 : -1));
  },
  async listUsers() {
    await delay();
    return state.users.map((u) => ({ ...u }));
  },

  async createReport(report) {
    await delay();
    state.reports = [report, ...state.reports];
    persist();
  },
  async updateReport(id, patch) {
    await delay();
    state.reports = replace(state.reports, id, patch);
    persist();
  },

  async createObstacle(obstacle) {
    await delay();
    state.obstacles = [obstacle, ...state.obstacles];
    persist();
  },
  async updateObstacle(id, patch) {
    await delay();
    state.obstacles = replace(state.obstacles, id, patch);
    persist();
  },

  async createHazard(hazard) {
    await delay();
    state.hazards = [hazard, ...state.hazards];
    persist();
  },
  async updateHazard(id, patch) {
    await delay();
    state.hazards = replace(state.hazards, id, patch);
    persist();
  },

  async createStation(station) {
    await delay();
    state.stations = [station, ...state.stations];
    persist();
  },
  async updateStation(id, patch) {
    await delay();
    state.stations = replace(state.stations, id, patch);
    persist();
  },

  async createActivity(activity) {
    await delay();
    state.activities = [activity, ...state.activities];
    persist();
  },
  async updateActivity(id, patch) {
    await delay();
    state.activities = replace(state.activities, id, patch);
    persist();
  },

  async createTransaction(transaction) {
    await delay();
    state.transactions = [transaction, ...state.transactions];
    persist();
  },

  async createTask(task) {
    await delay();
    state.tasks = [task, ...state.tasks];
    persist();
  },
  async updateTask(id, patch) {
    await delay();
    state.tasks = replace(state.tasks, id, patch);
    persist();
  },

  async createNotification(notification) {
    await delay();
    state.notifications = [notification, ...state.notifications];
    persist();
  },
  async updateNotification(id, patch) {
    await delay();
    state.notifications = replace(state.notifications, id, patch);
    persist();
  },

  async updateUser(id, patch) {
    await delay();
    state.users = replace(state.users, id, patch);
    persist();
  },

  async resetDemo() {
    state = createDemoState();
    persist();
  },
};
