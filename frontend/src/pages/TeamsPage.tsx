import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Users, KanbanSquare, DoorOpen, LogIn } from 'lucide-react';
import { teamService } from '@/features/teams/team.api';
import { useWorkspaceStore } from '@/contexts/workspace.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const TeamsPage = () => {
  const orgId = useWorkspaceStore((s) => s.currentOrgId);
  const qc = useQueryClient();
  const teamsQ = useQuery({
    queryKey: ['teams', 'org', orgId],
    queryFn: () => teamService.listByOrg(orgId!),
    enabled: !!orgId,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const create = useMutation({
    mutationFn: () => teamService.create({ organizationId: orgId!, ...form }),
    onSuccess: () => {
      toast.success('Team created');
      setOpen(false);
      setForm({ name: '', description: '' });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const join = useMutation({
    mutationFn: (id: string) => teamService.join(id),
    onSuccess: () => {
      toast.success('Joined team');
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leave = useMutation({
    mutationFn: (id: string) => teamService.leave(id),
    onSuccess: () => {
      toast.success('Left team');
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!orgId)
    return <div className="p-8 text-sm text-muted-foreground">Select a workspace first.</div>;

  return (
    <div className="container max-w-5xl py-10">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">Teams</div>
          <h1 className="mt-2 font-display text-3xl font-semibold">Squads & groups</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Teams get their own channels, boards, and members.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-team-button">
              <Plus className="h-4 w-4" /> New team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  data-testid="team-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  data-testid="team-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={!form.name || create.isPending}
                data-testid="team-submit"
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teamsQ.data?.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader>
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{t.name}</CardTitle>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {t.description || 'No description.'}
              </p>
            </CardHeader>
            <CardContent className="mt-auto flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="muted">
                  <Users className="mr-1 h-3 w-3" /> {t._count?.members ?? 0}
                </Badge>
                <Badge variant="muted">
                  <KanbanSquare className="mr-1 h-3 w-3" /> boards
                </Badge>
              </div>
              <div className="flex gap-2">
                <Link to={`/app/teams/${t.id}/kanban`}>
                  <Button size="sm" variant="outline" data-testid={`team-boards-${t.id}`}>
                    Boards
                  </Button>
                </Link>
                {(t as any).members?.some((m: any) => m.userId) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => leave.mutate(t.id)}
                    data-testid={`team-leave-${t.id}`}
                  >
                    <DoorOpen className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => join.mutate(t.id)}
                    data-testid={`team-join-${t.id}`}
                  >
                    <LogIn className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {teamsQ.data && teamsQ.data.length === 0 && (
          <div className="col-span-full rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            No teams yet. Create one to organize channels and boards.
          </div>
        )}
      </div>
    </div>
  );
};
