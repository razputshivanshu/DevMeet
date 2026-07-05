import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared auth page shell — split layout with brand panel on the left.
 */
export const AuthShell = ({ title, subtitle, children, footer }: Props) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="absolute inset-0 grain opacity-30" />
        <div className="relative flex flex-1 flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-sidebar-accent/20 text-sidebar-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            DevMeet
          </Link>
          <div>
            {!imgError && (
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
                alt=""
                className="mb-8 h-48 w-full rounded-lg object-cover opacity-90"
                onError={() => setImgError(true)}
              />
            )}
            <blockquote className="max-w-md font-display text-2xl leading-snug">
              “The channel, the standup, the whiteboard — all in one place. Finally.”
            </blockquote>
            <p className="mt-4 text-sm text-sidebar-foreground/60">
              — Every engineering team, ever.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
};
