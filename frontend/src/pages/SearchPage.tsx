import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Hash, MessageSquare, Search as SearchIcon, User, Users } from 'lucide-react';
import { searchService } from '@/features/search/search.api';
import { useAuthStore } from '@/contexts/auth.store';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SearchPage = () => {
  const orgId = useAuthStore((s) => s.activeOrgId);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const searchQ = useQuery({
    queryKey: ['search', orgId, debounced],
    queryFn: () => searchService.searchAll(orgId!, debounced),
    enabled: !!orgId && debounced.length > 1,
  });

  return (
    <div className="container max-w-4xl py-10">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-widest text-primary">Search</div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Find anything</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Full-text across messages, channels, teams, and people.
        </p>
      </header>

      <div className="relative mb-8">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search DevMeet…"
          className="pl-9"
          autoFocus
        />
      </div>

      {debounced.length <= 1 && (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          Type at least 2 characters to search.
        </div>
      )}
      {searchQ.data && (
        <div className="space-y-6">
          <ResultSection
            title="Messages"
            icon={MessageSquare}
            data-testid="results-messages"
            empty={searchQ.data.messages.length === 0}
          >
            {searchQ.data.messages.map((m) => (
              <Link
                key={m.id}
                to={`/app/channels/${m.channelId}`}
                data-testid={`result-message-${m.id}`}
                className="block rounded-md border border-border/60 bg-card p-3 transition-colors hover:border-accent/40"
              >
                <div className="text-xs text-muted-foreground">
                  #{m.channelName} · {m.userName}
                </div>
                <div className="mt-1 text-sm">{m.content}</div>
              </Link>
            ))}
          </ResultSection>

          <ResultSection title="Channels" icon={Hash} empty={searchQ.data.channels.length === 0}>
            {searchQ.data.channels.map((c) => (
              <Link
                key={c.id}
                to={`/app/channels/${c.id}`}
                data-testid={`result-channel-${c.id}`}
                className="block rounded-md border border-border/60 bg-card p-3 transition-colors hover:border-accent/40"
              >
                <div className="font-medium">#{c.name}</div>
                {c.topic && <div className="text-xs text-muted-foreground">{c.topic}</div>}
              </Link>
            ))}
          </ResultSection>

          <ResultSection title="Teams" icon={Users} empty={searchQ.data.teams.length === 0}>
            {searchQ.data.teams.map((t) => (
              <div
                key={t.id}
                data-testid={`result-team-${t.id}`}
                className="rounded-md border border-border/60 bg-card p-3"
              >
                <div className="font-medium">{t.name}</div>
                {t.description && (
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                )}
              </div>
            ))}
          </ResultSection>

          <ResultSection title="People" icon={User} empty={searchQ.data.users.length === 0}>
            {searchQ.data.users.map((u) => (
              <div
                key={u.id}
                data-testid={`result-user-${u.id}`}
                className="rounded-md border border-border/60 bg-card p-3"
              >
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">
                  @{u.username} · {u.email}
                </div>
              </div>
            ))}
          </ResultSection>
        </div>
      )}
    </div>
  );
};

const ResultSection = ({
  title,
  icon: Icon,
  children,
  empty,
  ...rest
}: {
  title: string;
  icon: typeof Hash;
  children: React.ReactNode;
  empty: boolean;
} & React.HTMLAttributes<HTMLDivElement>) => (
  <Card {...rest}>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      {empty ? <div className="text-xs text-muted-foreground">No matches.</div> : children}
    </CardContent>
  </Card>
);
