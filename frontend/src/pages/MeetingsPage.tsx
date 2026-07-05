import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Video } from 'lucide-react';
import { meetingService } from '@/features/meetings/meeting.api';
import { useWorkspaceStore } from '@/contexts/workspace.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

export const MeetingsPage = () => {
  const orgId = useWorkspaceStore((s) => s.currentOrgId);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('Quick sync');
  const meetingsQ = useQuery({
    queryKey: ['meetings', orgId],
    queryFn: () => meetingService.list(orgId!),
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: () => meetingService.create({ organizationId: orgId!, title }),
    onSuccess: (m) => {
      toast.success('Meeting created');
      qc.invalidateQueries({ queryKey: ['meetings', orgId] });
      setOpen(false);
      nav(`/app/meetings/${m.roomCode}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!orgId) return <div className="p-8 text-sm text-muted-foreground">Select a workspace.</div>;

  return (
    <div className="container max-w-5xl py-10">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">Meetings</div>
          <h1 className="mt-2 font-display text-3xl font-semibold">Rooms & huddles</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Instant WebRTC rooms with audio, video, and screen-sharing.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-meeting-button">
              <Plus className="h-4 w-4" /> New meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a meeting</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  data-testid="meeting-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={!title || create.isPending}
                data-testid="meeting-submit"
              >
                Start meeting
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {meetingsQ.data?.map((m) => (
          <Card key={m.id} className="flex flex-col">
            <CardHeader>
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Video className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{m.title}</CardTitle>
              <div className="text-xs text-muted-foreground">
                {m.createdBy?.name} · {format(new Date(m.createdAt), 'MMM d, HH:mm')}
              </div>
            </CardHeader>
            <CardContent className="mt-auto flex items-center justify-between">
              <Badge
                variant={
                  m.status === 'LIVE' ? 'default' : m.status === 'ENDED' ? 'muted' : 'accent'
                }
              >
                {m.status}
              </Badge>
              <Button
                size="sm"
                onClick={() => nav(`/app/meetings/${m.roomCode}`)}
                data-testid={`join-${m.roomCode}`}
                disabled={m.status === 'ENDED'}
              >
                {m.status === 'ENDED' ? 'Ended' : 'Join'}
              </Button>
            </CardContent>
          </Card>
        ))}
        {meetingsQ.data && meetingsQ.data.length === 0 && (
          <div className="col-span-full rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            No meetings yet — start one to test the WebRTC signalling.
          </div>
        )}
      </div>
    </div>
  );
};
