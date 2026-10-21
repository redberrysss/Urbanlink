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

export interface Repository {
  readonly kind: 'demo' | 'firebase';

  listReports(): Promise<Report[]>;
  listObstacles(): Promise<AccessibilityObstacle[]>;
  listHazards(): Promise<SafetyHazard[]>;
  listStations(): Promise<RecyclingStation[]>;
  listActivities(): Promise<RecyclingActivity[]>;
  listTransactions(): Promise<RewardTransaction[]>;
  listTasks(): Promise<MaintenanceTask[]>;
  listNotifications(userId: string): Promise<AppNotification[]>;
  listUsers(): Promise<User[]>;

  createReport(report: Report): Promise<void>;
  updateReport(id: string, patch: Partial<Report>): Promise<void>;

  createObstacle(obstacle: AccessibilityObstacle): Promise<void>;
  updateObstacle(id: string, patch: Partial<AccessibilityObstacle>): Promise<void>;

  createHazard(hazard: SafetyHazard): Promise<void>;
  updateHazard(id: string, patch: Partial<SafetyHazard>): Promise<void>;

  createStation(station: RecyclingStation): Promise<void>;
  updateStation(id: string, patch: Partial<RecyclingStation>): Promise<void>;

  createActivity(activity: RecyclingActivity): Promise<void>;
  updateActivity(id: string, patch: Partial<RecyclingActivity>): Promise<void>;

  createTransaction(transaction: RewardTransaction): Promise<void>;

  createTask(task: MaintenanceTask): Promise<void>;
  updateTask(id: string, patch: Partial<MaintenanceTask>): Promise<void>;

  createNotification(notification: AppNotification): Promise<void>;
  updateNotification(id: string, patch: Partial<AppNotification>): Promise<void>;

  updateUser(id: string, patch: Partial<User>): Promise<void>;

  /** Only available in demo mode — restores the seeded dataset. */
  resetDemo?(): Promise<void>;
}
