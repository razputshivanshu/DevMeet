import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/contexts/auth.store';
import { userService, uploadService } from '@/features/users/user.api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    bio: user?.bio ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateMe(form);
      setUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const changeAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const r = await uploadService.avatar(file);
      setUser(r.user);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-widest text-primary">Profile</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Your account</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent/10">
                  {uploadingAvatar ? 'Uploading…' : 'Change avatar'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={changeAvatar}
                  className="hidden"
                  data-testid="avatar-input"
                />
              </label>
              <p className="mt-1 text-xs text-muted-foreground">JPG/PNG up to 25 MB</p>
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled />
          </div>
          <div>
            <Label>Username</Label>
            <Input value={user?.username ?? ''} disabled />
          </div>
          <div>
            <Label>Name</Label>
            <Input
              data-testid="profile-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea
              data-testid="profile-bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <Button onClick={save} disabled={saving} data-testid="profile-save">
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
