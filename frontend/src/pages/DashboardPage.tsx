import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Activity, Hash, KanbanSquare, Users, Video } from 'lucide-react';
import { useAuthStore } from '@/contexts/auth.store';
import { useWorkspaceStore } from '@/contexts/workspace.store';
import { teamService } from '@/features/teams/team.api';
import { channelService } from '@/features/channels/channel.api';
import { meetingService } from '@/features/meetings/meeting.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const orgId = useWorkspaceStore((s) => s.currentOrgId);

  const teamsQ = useQuery({ queryKey: ['teams', 'mine'], queryFn: teamService.mine });
  const channelsQ = useQuery({
    queryKey: ['channels', orgId],
    queryFn: () => channelService.list(orgId!),
    enabled: !!orgId,
  });
  const meetingsQ = useQuery({
    queryKey: ['meetings', orgId],
    queryFn: () => meetingService.list(orgId!),
    enabled: !!orgId,
  });

  return (
    <div className="container max-w-6xl py-10">
      {/* Header */}
      <header className="mb-10">
        <div className="text-xs uppercase tracking-widest text-primary">Dashboard</div>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          Good to see you, {user?.name.split(' ')[0]}.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Here's what's happening across your workspaces today.
        </p>
      </header>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Teams" value={teamsQ.data?.length ?? 0} icon={Users} to="/app/teams" />
        <StatCard
          label="Channels"
          value={channelsQ.data?.length ?? 0}
          icon={Hash}
          to={channelsQ.data?.[0] ? `/app/channels/${channelsQ.data[0].id}` : '/app'}
        />
        <StatCard
          label="Live meetings"
          value={meetingsQ.data?.filter((m) => m.status === 'LIVE').length ?? 0}
          icon={Video}
          to="/app/meetings"
        />
        <StatCard
          label="Boards"
          value={teamsQ.data?.reduce((a, t) => a + (t._count?.kanbanBoards ?? 0), 0) ?? 0}
          icon={KanbanSquare}
          to="/app/teams"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent teams */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent teams</CardTitle>
            <CardDescription>Teams you're a part of.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamsQ.data?.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No teams yet.{' '}
                <Link to="/app/teams" className="text-primary">
                  Create one
                </Link>
                .
              </div>
            )}
            {teamsQ.data?.map((t) => (
              <Link
                key={t.id}
                to={`/app/teams/${t.id}/kanban`}
                data-testid={`recent-team-${t.id}`}
                className="flex items-center justify-between rounded-md border border-border/60 bg-card p-4 transition-colors hover:border-accent/40"
              >
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.organization?.name} · {t._count?.members ?? 0} members
                  </div>
                </div>
                <Badge variant="muted">Team</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">Activity feed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {meetingsQ.data?.slice(0, 5).map((m) => (
              <div key={m.id} className="border-l-2 border-accent/60 pl-3 text-sm">
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">
                  {m.createdBy?.name} ·{' '}
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
            {(!meetingsQ.data || meetingsQ.data.length === 0) && (
              <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
            )}
            <Link to="/app/meetings">
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                data-testid="dashboard-view-meetings"
              >
                View all meetings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  to: string;
}) => (
  <Link
    to={to}
    data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}
    className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-all hover:border-accent/40"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <Icon className="h-4 w-4 text-primary opacity-70 transition-transform group-hover:scale-110" />
    </div>
    <div className="mt-4 font-display text-3xl font-semibold">{value}</div>
  </Link>
);
