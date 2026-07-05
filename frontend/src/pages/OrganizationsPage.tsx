import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, Plus } from 'lucide-react';
import { orgService } from '@/features/organizations/organization.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Link as RouterLink } from 'react-router-dom';

export const OrganizationsPage = () => {
  const qc = useQueryClient();
  const orgsQ = useQuery({ queryKey: ['organizations'], queryFn: orgService.list });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });

  const create = useMutation({
    mutationFn: orgService.create,
    onSuccess: () => {
      toast.success('Workspace created');
      setOpen(false);
      setForm({ name: '', slug: '', description: '' });
      qc.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container max-w-5xl py-10">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">Workspaces</div>
          <h1 className="mt-2 font-display text-3xl font-semibold">Organizations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every workspace has its own teams, channels, boards, and members.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RouterLink to="/app/organizations/invites" className="text-sm text-primary hover:underline">
            View pending invites
          </RouterLink>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-org-button">
                <Plus className="h-4 w-4" /> New workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a workspace</DialogTitle>
                <DialogDescription>Give your team a home. You'll be the owner.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    data-testid="org-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                        slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    data-testid="org-slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    data-testid="org-description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate(form)}
                  disabled={create.isPending || !form.name || !form.slug}
                  data-testid="org-submit"
                >
                  {create.isPending ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orgsQ.data?.map((o) => (
          <Link
            key={o.id}
            to={`/app/organizations/${o.id}`}
            data-testid={`org-card-${o.slug}`}
            className="block"
          >
            <Card className="h-full transition-colors hover:border-accent/40">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{o.name}</CardTitle>
                <div className="text-xs text-muted-foreground">/{o.slug}</div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {o.description || 'No description.'}
                </p>
                <div className="flex gap-2 text-xs">
                  <Badge variant="muted">{o._count?.members ?? 0} members</Badge>
                  <Badge variant="muted">{o._count?.teams ?? 0} teams</Badge>
                  <Badge variant="muted">{o._count?.channels ?? 0} channels</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {orgsQ.data && orgsQ.data.length === 0 && (
          <div className="col-span-full rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            You're not in any workspaces yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
};
