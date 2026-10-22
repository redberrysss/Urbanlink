import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { getRepository } from '@/services/data';
import {
  addTaskEvidence,
  broadcastTownUpdate,
  changeReportStatus,
  requestReportReview,
  submitObstacle,
  submitReport,
  supportReport,
  verifyRecyclingActivity,
  type BroadcastTownUpdateInput,
  type StatusChangeInput,
  type SubmitReportInput,
} from '@/services/data/actions';
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
import { useAuth } from './AuthContext';

export const queryKeys = {
  reports: ['reports'] as const,
  obstacles: ['obstacles'] as const,
  hazards: ['hazards'] as const,
  stations: ['stations'] as const,
  activities: ['activities'] as const,
  transactions: ['transactions'] as const,
  tasks: ['tasks'] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  users: ['users'] as const,
};

interface TownshipDataValue {
  reports: UseQueryResult<Report[]>;
  obstacles: UseQueryResult<AccessibilityObstacle[]>;
  hazards: UseQueryResult<SafetyHazard[]>;
  stations: UseQueryResult<RecyclingStation[]>;
  activities: UseQueryResult<RecyclingActivity[]>;
  transactions: UseQueryResult<RewardTransaction[]>;
  tasks: UseQueryResult<MaintenanceTask[]>;
  notifications: UseQueryResult<AppNotification[]>;
  users: UseQueryResult<User[]>;

  createReport: (input: SubmitReportInput) => Promise<Report>;
  setReportStatus: (input: StatusChangeInput) => Promise<Report>;
  support: (reportId: string) => Promise<Report>;
  requestReview: (input: { reportId: string; reason: string }) => Promise<Report>;
  reportObstacle: (input: Parameters<typeof submitObstacle>[2]) => Promise<AccessibilityObstacle>;
  verifyActivity: (input: Parameters<typeof verifyRecyclingActivity>[1]) => Promise<RecyclingActivity>;
  addEvidence: (input: Parameters<typeof addTaskEvidence>[1]) => Promise<MaintenanceTask>;
  broadcastUpdate: (input: BroadcastTownUpdateInput) => Promise<AppNotification>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const TownshipDataContext = createContext<TownshipDataValue | null>(null);

export function TownshipDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const repo = getRepository();

  const reports = useQuery({
    queryKey: queryKeys.reports,
    queryFn: () => repo.listReports(),
  });
  const obstacles = useQuery({
    queryKey: queryKeys.obstacles,
    queryFn: () => repo.listObstacles(),
  });
  const hazards = useQuery({
    queryKey: queryKeys.hazards,
    queryFn: () => repo.listHazards(),
  });
  const stations = useQuery({
    queryKey: queryKeys.stations,
    queryFn: () => repo.listStations(),
  });
  const activities = useQuery({
    queryKey: queryKeys.activities,
    queryFn: () => repo.listActivities(),
  });
  const transactions = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: () => repo.listTransactions(),
  });
  const tasks = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => repo.listTasks(),
  });
  const notifications = useQuery({
    queryKey: queryKeys.notifications(user?.id ?? 'anonymous'),
    queryFn: () => repo.listNotifications(user?.id ?? 'anonymous'),
    enabled: Boolean(user),
  });
  const users = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => repo.listUsers(),
  });

  const invalidateCore = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.reports }),
      queryClient.invalidateQueries({ queryKey: queryKeys.obstacles }),
      queryClient.invalidateQueries({ queryKey: queryKeys.hazards }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stations }),
      queryClient.invalidateQueries({ queryKey: queryKeys.activities }),
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
      queryClient.invalidateQueries({ queryKey: queryKeys.users }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  }, [queryClient]);

  const createReportMutation = useMutation({
    mutationFn: async (input: SubmitReportInput) => {
      if (!user) throw new Error('You must be signed in.');
      return submitReport(repo, user, input);
    },
    onSuccess: invalidateCore,
  });

  const statusMutation = useMutation({
    mutationFn: async (input: StatusChangeInput) => {
      if (!user) throw new Error('You must be signed in.');
      return changeReportStatus(repo, input);
    },
    onSuccess: invalidateCore,
  });

  const supportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      if (!user) throw new Error('You must be signed in.');
      return supportReport(repo, reportId, user);
    },
    onSuccess: invalidateCore,
  });

  const reviewMutation = useMutation({
    mutationFn: async (input: { reportId: string; reason: string }) => {
      if (!user) throw new Error('You must be signed in.');
      return requestReportReview(repo, user, input);
    },
    onSuccess: invalidateCore,
  });

  const obstacleMutation = useMutation({
    mutationFn: async (input: Parameters<typeof submitObstacle>[2]) => {
      if (!user) throw new Error('You must be signed in.');
      return submitObstacle(repo, user, input);
    },
    onSuccess: invalidateCore,
  });

  const verifyMutation = useMutation({
    mutationFn: async (input: Parameters<typeof verifyRecyclingActivity>[1]) => {
      if (!user) throw new Error('You must be signed in.');
      return verifyRecyclingActivity(repo, input);
    },
    onSuccess: invalidateCore,
  });

  const evidenceMutation = useMutation({
    mutationFn: async (input: Parameters<typeof addTaskEvidence>[1]) => {
      if (!user) throw new Error('You must be signed in.');
      return addTaskEvidence(repo, input);
    },
    onSuccess: invalidateCore,
  });

  const broadcastMutation = useMutation({
    mutationFn: async (input: BroadcastTownUpdateInput) => {
      if (!user) throw new Error('You must be signed in.');
      return broadcastTownUpdate(repo, user, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await repo.updateNotification(id, { read: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const list = await repo.listNotifications(user.id);
    // Township-wide notices are broadcasts, so only personal items are marked read.
    await Promise.all(
      list
        .filter((n) => !n.read && n.scope !== 'township')
        .map((n) => repo.updateNotification(n.id, { read: true })),
    );
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [repo, user, queryClient]);

  const resetDemo = useCallback(async () => {
    await repo.resetDemo?.();
    queryClient.clear();
    await invalidateCore();
  }, [repo, queryClient, invalidateCore]);

  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  const value = useMemo<TownshipDataValue>(
    () => ({
      reports,
      obstacles,
      hazards,
      stations,
      activities,
      transactions,
      tasks,
      notifications,
      users,
      createReport: async (input) => {
        const result = await createReportMutation.mutateAsync(input);
        return result.report;
      },
      setReportStatus: async (input) => statusMutation.mutateAsync(input),
      support: async (id) => supportMutation.mutateAsync(id),
      requestReview: async (input) => reviewMutation.mutateAsync(input),
      reportObstacle: async (input) => obstacleMutation.mutateAsync(input),
      verifyActivity: async (input) => verifyMutation.mutateAsync(input),
      addEvidence: async (input) => evidenceMutation.mutateAsync(input),
      broadcastUpdate: async (input) => broadcastMutation.mutateAsync(input),
      markNotificationRead: async (id) => notificationMutation.mutateAsync(id),
      markAllNotificationsRead: markAllRead,
      resetDemoData: resetDemo,
      refreshAll,
    }),
    [
      reports,
      obstacles,
      hazards,
      stations,
      activities,
      transactions,
      tasks,
      notifications,
      users,
      createReportMutation,
      statusMutation,
      supportMutation,
      reviewMutation,
      obstacleMutation,
      verifyMutation,
      evidenceMutation,
      broadcastMutation,
      notificationMutation,
      markAllRead,
      resetDemo,
      refreshAll,
    ],
  );

  return (
    <TownshipDataContext.Provider value={value}>{children}</TownshipDataContext.Provider>
  );
}

export function useTownshipData(): TownshipDataValue {
  const ctx = useContext(TownshipDataContext);
  if (!ctx) throw new Error('useTownshipData must be used within TownshipDataProvider');
  return ctx;
}
