import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, HardHat, TrendingUp, Users, Wrench } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/common/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Meter } from '@/components/common/Progress';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTownshipData } from '@/contexts/TownshipDataContext';
import { MAINTENANCE_TEAMS } from '@/data/seed';
import { maintenancePerformance } from '@/services/analytics/aggregations';
import { REPORT_CATEGORY_META } from '@/utils/constants';

import { EMPTY_LIST } from '@/utils/empty';
export function MaintenanceTeamsPage() {
  const { tasks, users } = useTownshipData();

  const allTasks = tasks.data ?? EMPTY_LIST;

  const performance = useMemo(
    () => maintenancePerformance(MAINTENANCE_TEAMS, allTasks),
    [allTasks],
  );

  const teamDetails = useMemo(
    () =>
      MAINTENANCE_TEAMS.map((team) => {
        const teamTasks = allTasks.filter((t) => t.teamId === team.id);
        const members = (users.data ?? EMPTY_LIST).filter((u) => u.teamId === team.id);
        return {
          team,
          tasks: teamTasks,
          open: teamTasks.filter((t) => t.status !== 'completed').length,
          completed: teamTasks.filter((t) => t.status === 'completed').length,
          evidence: teamTasks.reduce((s, t) => s + t.evidence.length, 0),
          labor: teamTasks.reduce((s, t) => s + (t.laborMinutes ?? 0), 0),
          members,
        };
      }),
    [allTasks, users.data],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Township Administration · Maintenance Operations"
        title="Maintenance teams"
        description="Crew capacity, specialisations, throughput and evidence quality across the four township maintenance teams."
      />

      <PageBody className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {teamDetails.map(({ team, open, completed, evidence, labor }, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="h-full">
                <CardBody className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-xl text-white"
                      style={{ backgroundColor: team.color }}
                    >
                      <HardHat className="h-5 w-5" />
                    </span>
                    <Badge color={team.color} bg="#F1F5F9">
                      {team.members} members
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-ink-900 dark:text-white">{team.name}</p>
                    <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">
                      Lead: {team.lead}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {team.specialty.map((s) => (
                      <span
                        key={s}
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: `${REPORT_CATEGORY_META[s].color}1A`,
                          color: REPORT_CATEGORY_META[s].color,
                        }}
                      >
                        {REPORT_CATEGORY_META[s].label}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-ink-50 p-2.5 dark:bg-white/[0.04]">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Open</p>
                      <p className="text-lg font-extrabold text-ink-900 dark:text-white">{open}</p>
                    </div>
                    <div className="rounded-lg bg-ink-50 p-2.5 dark:bg-white/[0.04]">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Done</p>
                      <p className="text-lg font-extrabold text-ink-900 dark:text-white">{completed}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-ink-500 dark:text-ink-400">
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Avg {team.avgResolutionHours}h to resolve
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" />
                      {(labor / 60).toFixed(1)} labour hours logged
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {evidence} evidence photos uploaded
                    </p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader
              icon={<TrendingUp className="h-5 w-5" />}
              title="Completion rate by team"
              subtitle="Share of assigned tasks completed"
            />
            <CardBody>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performance}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="team"
                      width={110}
                      tick={{ fontSize: 10, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: string) => v.replace('Team ', '').split(' — ')[0]}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="completionRate" name="Completion %" radius={[0, 6, 6, 0]}>
                      {performance.map((p) => (
                        <Cell key={p.team} fill={p.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<HardHat className="h-5 w-5" />}
              title="Active task allocation"
              subtitle="Current load per team against resolution pace"
            />
            <CardBody className="space-y-4">
              {teamDetails.map(({ team, open, completed }) => (
                <div key={team.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink-800 dark:text-ink-100">
                      {team.name.split(' — ')[0]}
                    </span>
                    <span className="font-semibold text-ink-400">
                      {open} open · {completed} done
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Meter
                      label=""
                      value={completed + open === 0 ? 0 : (completed / (completed + open)) * 100}
                      color={team.color}
                    />
                  </div>
                </div>
              ))}
              <Link
                to="/app/tasks"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:underline dark:text-primary-300"
              >
                Open the maintenance workspace
              </Link>
            </CardBody>
          </Card>
        </div>
      </PageBody>
    </div>
  );
}
