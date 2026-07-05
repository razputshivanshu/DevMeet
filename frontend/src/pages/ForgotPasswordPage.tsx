import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/features/auth/auth.api';

const schema = z.object({ email: z.string().email() });
const resetSchema = z
  .object({ password: z.string().min(8), confirm: z.string().min(8) })
  .refine((d) => d.password === d.confirm, { message: 'Passwords must match', path: ['confirm'] });

export const ForgotPasswordPage = () => {
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const requestForm = useForm<{ email: string }>({ resolver: zodResolver(schema) });
  const resetForm = useForm<{ password: string; confirm: string }>({
    resolver: zodResolver(resetSchema),
  });

  const submitRequest = requestForm.handleSubmit(async (values) => {
    const { resetToken } = await authService.forgotPassword(values.email);
    setResetToken(resetToken);
  });

  const submitReset = resetForm.handleSubmit(async (values) => {
    if (!resetToken) return;
    await authService.resetPassword({ token: resetToken, password: values.password });
    setDone(true);
  });

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll issue a one-time reset token. In production this is emailed."
      footer={
        <Link to="/login" className="text-primary hover:underline" data-testid="link-back-to-login">
          Back to sign in
        </Link>
      }
    >
      {!resetToken && !done && (
        <form onSubmit={submitRequest} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              data-testid="forgot-email"
              {...requestForm.register('email')}
            />
          </div>
          <Button type="submit" className="w-full" data-testid="forgot-submit">
            Send reset link
          </Button>
        </form>
      )}
      {resetToken && !done && (
        <form onSubmit={submitReset} className="space-y-4" data-testid="reset-form">
          <div className="rounded-md border border-accent/40 bg-accent/5 p-3 text-xs">
            <div className="font-medium text-accent">Reset token (dev mode)</div>
            <code className="mt-1 block break-all font-mono text-[11px]">{resetToken}</code>
          </div>
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              data-testid="reset-password"
              {...resetForm.register('password')}
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              data-testid="reset-confirm"
              {...resetForm.register('confirm')}
            />
          </div>
          <Button type="submit" className="w-full" data-testid="reset-submit">
            Update password
          </Button>
        </form>
      )}
      {done && (
        <div
          className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm"
          data-testid="reset-done"
        >
          Password updated.{' '}
          <Link to="/login" className="text-primary underline">
            Sign in
          </Link>
          .
        </div>
      )}
    </AuthShell>
  );
};
