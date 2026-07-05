import { Link } from 'react-router-dom';
import { ArrowRight, Hash, KanbanSquare, MessageSquare, Users, Video, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Feature = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Hash;
  title: string;
  desc: string;
}) => (
  <div className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg">
    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <div className="font-display text-lg font-semibold">{title}</div>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
  </div>
);

export const LandingPage = () => (
  <div className="min-h-screen bg-background">
    {/* Nav */}
    <nav className="border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          DevMeet
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" data-testid="nav-login">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="default" data-testid="nav-register">
              Get started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grain opacity-40" />
      <div className="container relative py-24 lg:py-32">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs uppercase tracking-widest text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Modular monolith · Node · React
            · Postgres
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Where engineering teams
            <span className="block text-primary">actually ship together.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            DevMeet blends Slack-style chat, Discord-grade voice rooms, Kanban boards, and full-text
            search into a single, opinionated workspace built for developers.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/register">
              <Button size="lg" data-testid="cta-primary">
                Create your workspace <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" data-testid="cta-secondary">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="border-t border-border/60 bg-muted/30">
      <div className="container py-20">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-primary">Everything included</div>
          <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
            One tool. Six problems solved.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={Hash}
            title="Channels & DMs"
            desc="Organize conversations across public, private, and team channels with threaded reactions."
          />
          <Feature
            icon={MessageSquare}
            title="Realtime chat"
            desc="Socket.io-powered messaging with typing indicators, emoji reactions, and file attachments."
          />
          <Feature
            icon={Video}
            title="Meetings"
            desc="WebRTC audio, video, and screen-sharing rooms. Instant, browser-native, zero installs."
          />
          <Feature
            icon={KanbanSquare}
            title="Kanban boards"
            desc="Drag-and-drop task boards per team with assignees, due dates, and status transitions."
          />
          <Feature
            icon={Users}
            title="Orgs & teams"
            desc="Role-based access (Owner/Admin/Member) with invites, teams, and channel scoping."
          />
          <Feature
            icon={Zap}
            title="Search everything"
            desc="PostgreSQL-powered full-text search across messages, channels, teams, and people."
          />
        </div>
      </div>
    </section>

    <footer className="border-t border-border/60">
      <div className="container flex flex-col items-start justify-between gap-2 py-6 text-sm text-muted-foreground md:flex-row md:items-center">
        <div>© {new Date().getFullYear()} DevMeet · Built as a modular monolith.</div>
        <div className="flex gap-4">
          <Link to="/login" className="hover:text-foreground">
            Sign in
          </Link>
          <Link to="/register" className="hover:text-foreground">
            Create workspace
          </Link>
        </div>
      </div>
    </footer>
  </div>
);
