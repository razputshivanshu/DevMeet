import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Check, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { orgService } from '@/features/organizations/organization.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const OrganizationInvites = () => {
  const qc = useQueryClient();
  const invitesQ = useQuery({
    queryKey: ['org-invites', 'pending'],
    queryFn: orgService.pendingInvites,
  });

  const accept = useMutation({
    mutationFn: (token: string) => orgService.acceptInvite(token),
    onSuccess: async () => {
      toast.success('Invite accepted');
      await qc.invalidateQueries({ queryKey: ['organizations'] });
      await qc.invalidateQueries({ queryKey: ['org-invites', 'pending'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="container max-w-4xl py-10">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-widest text-primary">Invites</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Pending invitations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          These are invites addressed to your account email.
        </p>
      </header>

      <div className="space-y-4">
        {invitesQ.data?.map((invite) => (
          <Card key={invite.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Inbox className="h-5 w-5 text-primary" />
                    {invite.organization.name}
                  </CardTitle>
                  <CardDescription>
                    {invite.invitedBy ? `Invited by ${invite.invitedBy.name}` : 'Workspace invite'}
                  </CardDescription>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-sm">
                Role: <span className="font-medium">{invite.role}</span>
              </div>
              <Button
                onClick={() => accept.mutate(invite.token)}
                disabled={accept.isPending}
                data-testid={`accept-invite-${invite.id}`}
              >
                <Check className="mr-2 h-4 w-4" />
                Accept
              </Button>
            </CardContent>
          </Card>
        ))}

        {invitesQ.data && invitesQ.data.length === 0 && (
          <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            No pending invites found.
          </div>
        )}
      </div>
    </div>
  );
};
