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
  name: z.string().min(1, 'Name required').max(100),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Letters, numbers, . _ - only'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters').max(128),
});
type FormValues = z.infer<typeof schema>;

export const RegisterPage = () => {
  const nav = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await authService.register(values);
      setSession(result);
      toast.success('Welcome to DevMeet!');
      nav('/app');
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Spin up a workspace in seconds. No credit card required."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline" data-testid="link-login">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            data-testid="register-name"
            {...register('name')}
            placeholder="Ada Lovelace"
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            data-testid="register-username"
            {...register('username')}
            placeholder="ada"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            data-testid="register-email"
            {...register('email')}
            placeholder="ada@company.com"
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            data-testid="register-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          data-testid="register-submit"
        >
          {isSubmitting ? 'Creating…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
};
