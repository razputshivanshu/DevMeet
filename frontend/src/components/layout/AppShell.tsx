import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Compass,
  Hash,
  Home,
  KanbanSquare,
  LogOut,
  Search,
  Sparkles,
  User as UserIcon,
  Video,
  Users,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';
import { useAuthStore } from '@/contexts/auth.store';
import { orgService } from '@/features/organizations/organization.api';
import { channelService } from '@/features/channels/channel.api';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/theme';
import { disconnectSocket } from '@/lib/socket';

const NavLink = ({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: typeof Home;
  label: string;
  active: boolean;
}) => (
  <Link
    to={to}
    data-testid={`nav-${label.toLowerCase()}`}
    className={cn(
      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-sidebar-accent/15 text-sidebar-foreground'
        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground',
    )}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </Link>
);

export const AppShell = () => {
  const { user, logout, activeOrgId, setActiveOrg } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const nav = useNavigate();
  const qc = useQueryClient();

  const orgsQuery = useQuery({ queryKey: ['organizations'], queryFn: orgService.list });
  const channelsQuery = useQuery({
    queryKey: ['channels', activeOrgId],
    queryFn: () => channelService.list(activeOrgId!),
    enabled: !!activeOrgId,
  });

  // Auto-select first org
  useEffect(() => {
    if (!activeOrgId && orgsQuery.data?.length) setActiveOrg(orgsQuery.data[0].id);
  }, [activeOrgId, orgsQuery.data, setActiveOrg]);

  useEffect(() => {
    if (!activeOrgId) return;
    qc.invalidateQueries({ queryKey: ['teams'] });
    qc.invalidateQueries({ queryKey: ['channels'] });
    qc.invalidateQueries({ queryKey: ['meetings'] });
    qc.invalidateQueries({ queryKey: ['search'] });
  }, [activeOrgId, qc]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    nav('/login');
  };

  const initials =
    user?.name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2) ?? 'D';
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-sidebar-accent/20 text-sidebar-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold">DevMeet</span>
            <span className="text-[11px] uppercase tracking-widest text-sidebar-foreground/50">
              collaboration
            </span>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Org switcher */}
        <div className="px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="org-switcher"
                className="flex w-full items-center justify-between rounded-md border border-sidebar-border/60 bg-sidebar-accent/5 px-3 py-2 text-left hover:bg-sidebar-accent/15"
              >
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-sidebar-foreground/50">
                    Workspace
                  </div>
                  <div className="truncate text-sm font-medium">
                    {orgsQuery.data?.find((o) => o.id === activeOrgId)?.name ?? 'No workspace'}
                  </div>
                </div>
                <Building2 className="h-4 w-4 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Your workspaces</DropdownMenuLabel>
              {orgsQuery.data?.map((o) => (
                <DropdownMenuItem
                  key={o.id}
                  data-testid={`org-option-${o.slug}`}
                  onClick={() => setActiveOrg(o.id)}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="truncate">{o.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => nav('/app/organizations')}>
                <Compass className="h-4 w-4" /> Manage workspaces
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
          <NavLink to="/app" icon={Home} label="Dashboard" active={location.pathname === '/app'} />
          <NavLink
            to="/app/organizations"
            icon={Building2}
            label="Organizations"
            active={isActive('/app/organizations')}
          />
          <NavLink to="/app/teams" icon={Users} label="Teams" active={isActive('/app/teams')} />
          <NavLink
            to="/app/meetings"
            icon={Video}
            label="Meetings"
            active={isActive('/app/meetings')}
          />
          <NavLink to="/app/search" icon={Search} label="Search" active={isActive('/app/search')} />

          <div className="mt-6 flex items-center justify-between px-2">
            <span className="text-[11px] uppercase tracking-widest text-sidebar-foreground/40">
              Channels
            </span>
          </div>
          <div className="space-y-1">
            {channelsQuery.data?.map((c) => (
              <Link
                key={c.id}
                to={`/app/channels/${c.id}`}
                data-testid={`channel-${c.name}`}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                  location.pathname === `/app/channels/${c.id}`
                    ? 'bg-sidebar-accent/20 text-sidebar-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/10',
                )}
              >
                <Hash className="h-3.5 w-3.5 opacity-60" />
                <span className="truncate">{c.name}</span>
                {c.type === 'PRIVATE' && (
                  <span className="ml-auto text-[10px] uppercase opacity-50">priv</span>
                )}
              </Link>
            ))}
            {channelsQuery.data && channelsQuery.data.length === 0 && (
              <div className="px-3 py-2 text-xs text-sidebar-foreground/40">No channels yet</div>
            )}
          </div>
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-sidebar-accent/20 text-sidebar-accent">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.name}</div>
            <div className="truncate text-xs text-sidebar-foreground/50">@{user?.username}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="user-menu-trigger"
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground/70 hover:bg-sidebar-accent/15 hover:text-sidebar-foreground"
              >
                <UserIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => nav('/app/profile')}>
                <UserIcon className="h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="h-4 w-4" />
                Light {theme === 'light' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="h-4 w-4" />
                Dark {theme === 'dark' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Laptop className="h-4 w-4" />
                System {theme === 'system' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                <LogOut className="h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-thin">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Suppress unused import warning
void KanbanSquare;
