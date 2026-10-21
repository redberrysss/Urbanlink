import type {
  AccessibilityObstacle,
  AppNotification,
  HazardType,
  MaintenanceTask,
  MaintenanceTask as Task,
  RecyclingActivity,
  Report,
  ReportCategory,
  ReportStatus,
  SafetyHazard,
  TaskEvidence,
  User,
} from '@/types';
import type { Repository } from './types';
import { uid, reportReference } from '@/utils/constants';
import { computePriority, daysSince } from '@/services/analytics/priority';
import { findPotentialDuplicates } from '@/services/analytics/duplicates';
import { MATERIAL_META } from '@/utils/constants';
import { demoPhoto } from '@/utils/placeholderImage';

import { EMPTY_LIST } from '@/utils/empty';
/**
 * Cross-module actions.
 *
 * These functions are the integration points of TownSync: a single community
 * report fans out into an accessibility obstacle, a safety hazard and a
 * maintenance ticket without duplicating the underlying record. Resolving the
 * report clears the linked hazard and obstacle and re-opens the route graph.
 */

export function hazardTypeForCategory(category: ReportCategory): HazardType {
  switch (category) {
    case 'streetlight':
      return 'streetlight';
    case 'drainage':
      return 'flood_prone';
    case 'damaged_pavement':
      return 'unsafe_walkway';
    case 'accessibility':
      return 'damaged_crossing';
    case 'pothole':
      return 'reported_hazard';
    default:
      return 'reported_hazard';
  }
}

export function obstacleCategoryForReport(category: ReportCategory): AccessibilityObstacle['category'] {
  switch (category) {
    case 'accessibility':
      return 'blocked_pavement';
    case 'damaged_pavement':
      return 'damaged_sidewalk';
    case 'drainage':
      return 'blocked_pavement';
    case 'public_facility':
      return 'broken_lift';
    default:
      return 'blocked_pavement';
  }
}

export interface SubmitReportInput {
  title: string;
  description: string;
  category: ReportCategory;
  severity: Report['severity'];
  position: { lat: number; lng: number };
  address: string;
  photoUrl?: string;
  affectedResidents: number;
  affectsAccessibility: boolean;
  isSafetyHazard: boolean;
  tags?: string[];
}

export async function submitReport(
  repo: Repository,
  actor: User,
  input: SubmitReportInput,
): Promise<{ report: Report; obstacle?: AccessibilityObstacle; hazard?: SafetyHazard }> {
  const now = new Date().toISOString();
  const id = uid('r');

  const existing = await repo.listReports();
  const duplicates = findPotentialDuplicates(
    {
      category: input.category,
      title: input.title,
      description: input.description,
      position: input.position,
    },
    existing.filter((r) => r.id !== id),
  );

  const priority = computePriority({
    category: input.category,
    severity: input.severity,
    affectedResidents: input.affectedResidents,
    isSafetyRelated: input.isSafetyHazard,
    daysSinceSubmission: 0,
    duplicateCount: duplicates.length,
    supporterCount: 0,
  });

  const report: Report = {
    id,
    reference: reportReference(),
    title: input.title,
    description: input.description,
    category: input.category,
    severity: input.severity,
    status: 'pending',
    position: input.position,
    address: input.address,
    photoUrl: input.photoUrl,
    reportedBy: actor.id,
    reportedByName: actor.name,
    reportedAt: now,
    updatedAt: now,
    supporters: [],
    potentialDuplicates: duplicates.map((d) => d.reportId),
    priority,
    affectedResidents: input.affectedResidents,
    tags: input.tags ?? EMPTY_LIST,
    timeline: [
      {
        id: uid('tl'),
        at: now,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        type: 'submitted',
        note: 'Report submitted by resident with photo evidence.',
      },
    ],
  };

  await repo.createReport(report);

  /* ---- Integration 1: AccessAble obstacle ---- */
  let obstacle: AccessibilityObstacle | undefined;
  if (input.affectsAccessibility) {
    obstacle = {
      id: uid('ob'),
      category: obstacleCategoryForReport(input.category),
      title: input.title,
      description: input.description,
      position: input.position,
      severity: input.severity === 'critical' ? 0.9 : input.severity === 'high' ? 0.7 : 0.45,
      status: 'open',
      reportedBy: actor.id,
      reportedAt: now,
      reportId: report.id,
      photoUrl: input.photoUrl,
      votes: 0,
    };
    await repo.createObstacle(obstacle);
    await repo.updateReport(report.id, { obstacleId: obstacle.id });
    report.obstacleId = obstacle.id;
  }

  /* ---- Integration 2: SafeSpot hazard ---- */
  let hazard: SafetyHazard | undefined;
  if (input.isSafetyHazard) {
    hazard = {
      id: uid('h'),
      type: hazardTypeForCategory(input.category),
      title: input.title,
      description: input.description,
      position: input.position,
      address: input.address,
      status: 'active',
      severity: input.severity,
      reportId: report.id,
      riskScore: Math.min(100, 30 + (input.severity === 'critical' ? 50 : input.severity === 'high' ? 32 : 16)),
      riskFactors: [
        `Reported severity: ${input.severity}`,
        input.affectsAccessibility ? 'Blocks an accessible route' : 'Affects pedestrian safety',
      ],
      reportedBy: actor.id,
      reportedAt: now,
      updatedAt: now,
      lightingStatus: input.category === 'streetlight' ? 'faulty' : undefined,
      photoUrl: input.photoUrl,
    };
    await repo.createHazard(hazard);
    await repo.updateReport(report.id, { safetyHazardId: hazard.id });
    report.safetyHazardId = hazard.id;
  }

  /* ---- Integration 3: management task ---- */
  const task: Task = {
    id: uid('task'),
    reportId: report.id,
    title: input.title,
    status: 'open',
    notes: ['Auto-created from the resident submission.'],
    evidence: [],
  };
  await repo.createTask(task);
  await repo.updateReport(report.id, { taskId: task.id });
  report.taskId = task.id;

  /* ---- Notify management ---- */
  const admins = (await repo.listUsers()).filter((u) => u.role === 'admin');
  for (const admin of admins) {
    const notification: AppNotification = {
      id: uid('nt'),
      userId: admin.id,
      title: 'New community report',
      body: `${report.reference} — ${report.title} (${priority.level} priority).`,
      type: 'warning',
      at: now,
      read: false,
      reportId: report.id,
      link: `/app/reports/${report.id}`,
    };
    await repo.createNotification(notification);
  }

  return { report, obstacle, hazard };
}

export interface StatusChangeInput {
  reportId: string;
  actor: User;
  status: ReportStatus;
  note?: string;
  teamId?: string;
  staffId?: string;
  staffName?: string;
}

export async function changeReportStatus(
  repo: Repository,
  input: StatusChangeInput,
): Promise<Report> {
  const reports = await repo.listReports();
  const report = reports.find((r) => r.id === input.reportId);
  if (!report) throw new Error('Report not found.');

  const now = new Date().toISOString();
  const type =
    input.status === 'resolved'
      ? 'resolved'
      : input.status === 'rejected'
        ? 'rejected'
        : input.status === 'under_review'
          ? 'review'
          : input.status === 'assigned'
            ? 'assigned'
            : 'progress';

  const timeline = [
    ...report.timeline,
    {
      id: uid('tl'),
      at: now,
      actorId: input.actor.id,
      actorName: input.actor.name,
      actorRole: input.actor.role,
      type: type as Report['timeline'][number]['type'],
      status: input.status,
      note:
        input.note ||
        `Status changed from ${report.status.replace('_', ' ')} to ${input.status.replace('_', ' ')}.`,
    },
  ];

  await repo.updateReport(report.id, {
    status: input.status,
    updatedAt: now,
    timeline,
    assignedTeamId: input.teamId ?? report.assignedTeamId,
    assignedStaffId: input.staffId ?? report.assignedStaffId,
    assignedStaffName: input.staffName ?? report.assignedStaffName,
    resolvedAt: input.status === 'resolved' ? now : report.resolvedAt,
  });

  /* ---- Auto-create a maintenance task when a team is assigned ---- */
  if (input.status === 'assigned' && input.teamId && !report.taskId) {
    const task: Task = {
      id: uid('task'),
      reportId: report.id,
      title: report.title,
      teamId: input.teamId,
      assigneeId: input.staffId,
      assigneeName: input.staffName,
      status: 'open',
      notes: [],
      evidence: [],
    };
    await repo.createTask(task);
    await repo.updateReport(report.id, { taskId: task.id });
  }

  /* ---- Update the linked maintenance task ---- */
  if (report.taskId) {
    const tasks = await repo.listTasks();
    const task = tasks.find((t) => t.id === report.taskId);
    if (task) {
      const nextStatus: MaintenanceTask['status'] =
        input.status === 'resolved'
          ? 'completed'
          : input.status === 'in_progress'
            ? 'in_progress'
            : input.status === 'assigned'
              ? 'accepted'
              : task.status;
      await repo.updateTask(task.id, {
        status: nextStatus,
        teamId: input.teamId ?? task.teamId,
        assigneeId: input.staffId ?? task.assigneeId,
        assigneeName: input.staffName ?? task.assigneeName,
        completedAt: input.status === 'resolved' ? now : task.completedAt,
      });
    }
  }

  /* ---- Integration: resolving clears the safety hazard and the obstacle ---- */
  if (input.status === 'resolved') {
    if (report.safetyHazardId) {
      await repo.updateHazard(report.safetyHazardId, {
        status: 'resolved',
        updatedAt: now,
        resolvedAt: now,
        riskScore: 0,
        riskFactors: ['Resolved and verified by management'],
      });
    }
    if (report.obstacleId) {
      await repo.updateObstacle(report.obstacleId, { status: 'resolved' });
    }
  }

  /* ---- Notify the resident ---- */
  const notification: AppNotification = {
    id: uid('nt'),
    userId: report.reportedBy,
    title:
      input.status === 'resolved'
        ? 'Report resolved'
        : input.status === 'assigned'
          ? 'Report assigned to a team'
          : `Report ${input.status.replace('_', ' ')}`,
    body: `${report.reference} — ${report.title}. ${input.note ?? ''}`.trim(),
    type: input.status === 'resolved' ? 'success' : 'info',
    at: now,
    read: false,
    reportId: report.id,
    link: `/app/reports/${report.id}`,
  };
  await repo.createNotification(notification);

  return { ...report, status: input.status, timeline };
}

export async function supportReport(
  repo: Repository,
  reportId: string,
  user: User,
): Promise<Report> {
  const reports = await repo.listReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report not found.');
  if (report.supporters.includes(user.id)) return report;

  const supporters = [...report.supporters, user.id];
  const priority = computePriority({
    category: report.category,
    severity: report.severity,
    affectedResidents: report.affectedResidents,
    isSafetyRelated: Boolean(report.safetyHazardId),
    daysSinceSubmission: daysSince(report.reportedAt),
    duplicateCount: report.potentialDuplicates.length,
    supporterCount: supporters.length,
  });

  await repo.updateReport(reportId, { supporters, priority });
  return { ...report, supporters, priority };
}

export async function submitObstacle(
  repo: Repository,
  actor: User,
  input: {
    category: AccessibilityObstacle['category'];
    title: string;
    description: string;
    position: { lat: number; lng: number };
    edgeId?: string;
    photoUrl?: string;
    severity: number;
  },
): Promise<AccessibilityObstacle> {
  const now = new Date().toISOString();
  const obstacle: AccessibilityObstacle = {
    id: uid('ob'),
    category: input.category,
    title: input.title,
    description: input.description,
    position: input.position,
    edgeId: input.edgeId,
    severity: input.severity,
    status: 'open',
    reportedBy: actor.id,
    reportedAt: now,
    photoUrl: input.photoUrl,
    votes: 0,
  };
  await repo.createObstacle(obstacle);

  const notification: AppNotification = {
    id: uid('nt'),
    userId: 'u_admin',
    title: 'New accessibility obstacle reported',
    body: `${obstacle.title} — added to the AccessAble route graph.`,
    type: 'warning',
    at: now,
    read: false,
  };
  await repo.createNotification(notification);
  return obstacle;
}

export async function verifyRecyclingActivity(
  repo: Repository,
  input: {
    activityId: string;
    actor: User;
    approve: boolean;
    note?: string;
    awardOverride?: number;
  },
): Promise<RecyclingActivity> {
  const activities = await repo.listActivities();
  const activity = activities.find((a) => a.id === input.activityId);
  if (!activity) throw new Error('Activity not found.');
  if (activity.status !== 'pending') throw new Error('Activity has already been reviewed.');

  const now = new Date().toISOString();
  const points =
    input.approve
      ? (input.awardOverride ??
        Math.round(activity.weightKg * MATERIAL_META[activity.material].pointsPerKg))
      : 0;

  await repo.updateActivity(activity.id, {
    status: input.approve ? 'verified' : 'rejected',
    pointsAwarded: points,
    verifiedAt: now,
    verifiedBy: input.actor.id,
    verifierName: input.actor.name,
    verificationNote: input.note,
  });

  if (input.approve && points > 0) {
    await repo.createTransaction({
      id: uid('tx'),
      userId: activity.userId,
      userName: activity.userName,
      points,
      reason: `Verified ${activity.material} recycling (${activity.weightKg} kg) at ${activity.stationName}`,
      at: now,
      activityId: activity.id,
      type: 'earned',
    });

    const users = await repo.listUsers();
    const resident = users.find((u) => u.id === activity.userId);
    if (resident) {
      await repo.updateUser(resident.id, { points: resident.points + points });
    }

    const stations = await repo.listStations();
    const station = stations.find((s) => s.id === activity.stationId);
    if (station) {
      await repo.updateStation(station.id, {
        currentKg: Math.min(station.capacityKg, station.currentKg + activity.weightKg),
      });
    }

    await repo.createNotification({
      id: uid('nt'),
      userId: activity.userId,
      title: `Recycling activity verified — ${points} points`,
      body: `Your ${activity.material} recycling at ${activity.stationName} was verified. ${points} Green Reward points added.`,
      type: 'reward',
      at: now,
      read: false,
    });
  } else {
    await repo.createNotification({
      id: uid('nt'),
      userId: activity.userId,
      title: 'Recycling activity needs attention',
      body: `${activity.stationName}: ${input.note ?? 'The submitted weight could not be verified.'}`,
      type: 'warning',
      at: now,
      read: false,
    });
  }

  return {
    ...activity,
    status: input.approve ? 'verified' : 'rejected',
    pointsAwarded: points,
  };
}

export async function addTaskEvidence(
  repo: Repository,
  input: {
    taskId: string;
    actor: User;
    note: string;
    photoUrl?: string;
    kind: TaskEvidence['kind'];
    laborMinutes?: number;
  },
): Promise<MaintenanceTask> {
  const tasks = await repo.listTasks();
  const task = tasks.find((t) => t.id === input.taskId);
  if (!task) throw new Error('Task not found.');

  const now = new Date().toISOString();
  const evidence: TaskEvidence = {
    id: uid('ev'),
    uploadedBy: input.actor.id,
    uploadedByName: input.actor.name,
    uploadedAt: now,
    photoUrl: input.photoUrl ?? demoPhoto(input.note.slice(0, 22), 160),
    note: input.note,
    kind: input.kind,
  };

  const nextStatus: MaintenanceTask['status'] =
    input.kind === 'completion' ? 'awaiting_verification' : 'in_progress';

  await repo.updateTask(task.id, {
    status: nextStatus,
    evidence: [...task.evidence, evidence],
    notes: [...task.notes, input.note],
    laborMinutes: input.laborMinutes ? (task.laborMinutes ?? 0) + input.laborMinutes : task.laborMinutes,
    startedAt: task.startedAt ?? now,
  });

  const reports = await repo.listReports();
  const report = reports.find((r) => r.id === task.reportId);
  if (report) {
    await repo.updateReport(report.id, {
      status: input.kind === 'completion' ? 'in_progress' : 'in_progress',
      updatedAt: now,
      timeline: [
        ...report.timeline,
        {
          id: uid('tl'),
          at: now,
          actorId: input.actor.id,
          actorName: input.actor.name,
          actorRole: input.actor.role,
          type: input.kind === 'completion' ? 'evidence' : 'progress',
          status: 'in_progress',
          note: input.note,
          photoUrl: evidence.photoUrl,
        },
      ],
    });
  }

  return { ...task, status: nextStatus, evidence: [...task.evidence, evidence] };
}
