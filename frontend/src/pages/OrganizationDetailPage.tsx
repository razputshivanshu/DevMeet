import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { orgService } from '@/features/organizations/organization.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/usePermissions';

export const OrganizationDetailPage = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const qc = useQueryClient();
  const orgQ = useQuery({ queryKey: ['org', orgId], queryFn: () => orgService.get(orgId!) });
  const membersQ = useQuery({
    queryKey: ['org', orgId, 'members'],
    queryFn: () => orgService.members(orgId!),
  });
  const [invite, setInvite] = useState({ email: '', role: 'MEMBER' as 'ADMIN' | 'MEMBER' });
  const [open, setOpen] = useState(false);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const { hasPermission } = usePermissions(orgQ.data?.myRole);

  const inviteMut = useMutation({
    mutationFn: (dto: { email: string; role: 'ADMIN' | 'MEMBER' }) =>
      orgService.invite(orgId!, dto),
    onSuccess: (data) => {
      setIssuedToken((data as any)?.token ?? null);
      toast.success('Invite created');
      qc.invalidateQueries({ queryKey: ['org', orgId] });
      qc.invalidateQueries({ queryKey: ['org', orgId, 'members'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!orgQ.data) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="container max-w-5xl py-10">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">Workspace</div>
          <h1 className="mt-2 font-display text-3xl font-semibold">{orgQ.data.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">/{orgQ.data.slug}</p>
          {orgQ.data.description && (
            <p className="mt-3 max-w-xl text-sm">{orgQ.data.description}</p>
          )}
        </div>
        {hasPermission('org:manageMembers') && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="invite-member-button">
                <UserPlus className="h-4 w-4" /> Invite member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a teammate</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    data-testid="invite-email"
                    type="email"
                    value={invite.email}
                    onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <select
                    data-testid="invite-role"
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={invite.role}
                    onChange={(e) =>
                      setInvite({ ...invite, role: e.target.value as 'ADMIN' | 'MEMBER' })
                    }
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                {issuedToken && (
                  <div className="rounded-md border border-accent/40 bg-accent/5 p-3 text-xs">
                    <div className="font-medium text-accent">Invite token</div>
                    <code className="mt-1 block break-all font-mono">{issuedToken}</code>
                    <div className="mt-1 text-muted-foreground">
                      Share this with your teammate — they can accept it from /app/organizations.
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => inviteMut.mutate(invite)}
                  disabled={!invite.email || inviteMut.isPending}
                  data-testid="invite-submit"
                >
                  {inviteMut.isPending ? 'Sending…' : 'Send invite'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>{membersQ.data?.length ?? 0} people in this workspace</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {membersQ.data?.map((m) => {
            const initials = m.user.name
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2);
            return (
              <div key={m.id} className="flex items-center gap-3 py-3">
                <Avatar>
                  <AvatarImage src={m.user.avatarUrl ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{m.user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    @{m.user.username} · {m.user.email}
                  </div>
                </div>
                <Badge
                  variant={m.role === 'OWNER' ? 'default' : m.role === 'ADMIN' ? 'accent' : 'muted'}
                >
                  {m.role}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
