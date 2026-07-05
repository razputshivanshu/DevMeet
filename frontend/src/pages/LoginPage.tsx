import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/features/auth/auth.api';
import { useAuthStore } from '@/contexts/auth.store';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
});
type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const nav = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await authService.login(values);
      setSession(result);
      toast.success(`Welcome back, ${result.user.name}!`);
      nav('/app');
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <AuthShell
      title="Sign in to DevMeet"
      subtitle="Enter your credentials to access your workspace."
      footer={
        <>
          Need an account?{' '}
          <Link to="/register" className="text-primary hover:underline" data-testid="link-register">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            data-testid="login-email"
            placeholder="you@company.com"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary"
              data-testid="link-forgot"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            data-testid="login-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="login-submit">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="pt-2 text-center text-xs text-muted-foreground">
          Demo: <span className="font-mono">owner@devmeet.io / Password123!</span>
        </div>
      </form>
    </AuthShell>
  );
};
