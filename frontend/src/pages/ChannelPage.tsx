import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Hash, Lock, Paperclip, Send, Smile, Trash2 } from 'lucide-react';
import { channelService } from '@/features/channels/channel.api';
import { messageService } from '@/features/messages/message.api';
import { uploadService } from '@/features/users/user.api';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/contexts/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Message } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const EMOJIS = ['👍', '❤️', '🎉', '🚀', '😄', '👀', '🔥', '✅'];

export const ChannelPage = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const socket = useSocket();
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState<Set<string>>(new Set());

  const channelQ = useQuery({
    queryKey: ['channel', channelId],
    queryFn: () => channelService.get(channelId!),
    enabled: !!channelId,
  });

  const messagesQ = useQuery({
    queryKey: ['messages', channelId],
    queryFn: () => messageService.list(channelId!),
    enabled: !!channelId,
  });

  const messages = messagesQ.data?.items ?? [];

  // Socket wiring
  useEffect(() => {
    if (!socket || !channelId) return;
    socket.emit('channel:join', channelId);

    const onNew = (msg: Message) => {
      if (msg.channelId !== channelId) return;
      qc.setQueryData<{ items: Message[]; nextCursor: string | null }>(
        ['messages', channelId],
        (old) => {
          if (!old) return { items: [msg], nextCursor: null };
          if (old.items.some((m) => m.id === msg.id)) return old;
          return { ...old, items: [...old.items, msg] };
        },
      );
    };
    const onUpdate = (msg: Message) => {
      if (msg.channelId !== channelId) return;
      qc.setQueryData<{ items: Message[]; nextCursor: string | null }>(
        ['messages', channelId],
        (old) => {
          if (!old) return old;
          return { ...old, items: old.items.map((m) => (m.id === msg.id ? msg : m)) };
        },
      );
    };
    const onDeleted = ({ id }: { id: string; channelId: string }) => {
      qc.setQueryData<{ items: Message[]; nextCursor: string | null }>(
        ['messages', channelId],
        (old) => {
          if (!old) return old;
          return { ...old, items: old.items.filter((m) => m.id !== id) };
        },
      );
    };
    const onTypingStart = ({ userId }: { userId: string }) => {
      setTyping((prev) => new Set(prev).add(userId));
      setTimeout(() => {
        setTyping((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }, 3500);
    };
    const onTypingStop = ({ userId }: { userId: string }) => {
      setTyping((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('message:new', onNew);
    socket.on('message:updated', onUpdate);
    socket.on('message:deleted', onDeleted);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.emit('channel:leave', channelId);
      socket.off('message:new', onNew);
      socket.off('message:updated', onUpdate);
      socket.off('message:deleted', onDeleted);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, channelId, qc]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    if (!draft.trim() || sending || !channelId) return;
    setSending(true);
    try {
      await messageService.create({ channelId, content: draft.trim() });
      setDraft('');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !channelId) return;
    try {
      const upload = await uploadService.attachment(file);
      await messageService.create({
        channelId,
        content: file.name,
        fileUrl: upload.url,
        fileName: file.name,
        fileSize: upload.size,
      });
      toast.success('File attached');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  const typingLabel = useMemo(() => {
    const others = [...typing].filter((id) => id !== currentUser?.id);
    if (others.length === 0) return '';
    if (others.length === 1) return 'Someone is typing…';
    return `${others.length} people are typing…`;
  }, [typing, currentUser?.id]);

  const onDraftChange = (v: string) => {
    setDraft(v);
    if (socket && channelId) socket.emit('typing:start', channelId);
  };

  if (!channelQ.data)
    return <div className="p-8 text-sm text-muted-foreground">Loading channel…</div>;
  const channel = channelQ.data;
  const Icon = channel.type === 'PRIVATE' ? Lock : Hash;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-16 items-center gap-3 border-b border-border px-6">
        <Icon className="h-4 w-4 opacity-70" />
        <div>
          <div className="font-display text-lg font-semibold" data-testid="channel-name">
            {channel.name}
          </div>
          {channel.topic && <div className="text-xs text-muted-foreground">{channel.topic}</div>}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6 scrollbar-thin">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
            Start the conversation — say hi to #{channel.name}!
          </div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const groupWithPrev =
            prev &&
            prev.userId === m.userId &&
            new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
          return (
            <MessageRow
              key={m.id}
              message={m}
              groupWithPrev={!!groupWithPrev}
              isOwn={m.userId === currentUser?.id}
            />
          );
        })}
        {typingLabel && (
          <div className="text-xs italic text-muted-foreground" data-testid="typing-indicator">
            {typingLabel}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-2">
          <label className="cursor-pointer p-2 text-muted-foreground hover:text-accent">
            <Paperclip className="h-4 w-4" />
            <input
              type="file"
              onChange={onFileChange}
              className="hidden"
              data-testid="attach-file"
            />
          </label>
          <Textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Message #${channel.name}`}
            className="min-h-[40px] resize-none border-0 focus-visible:ring-0"
            data-testid="message-input"
          />
          <Button
            onClick={send}
            disabled={!draft.trim() || sending}
            data-testid="message-send"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const MessageRow = ({
  message,
  groupWithPrev,
  isOwn,
}: {
  message: Message;
  groupWithPrev: boolean;
  isOwn: boolean;
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const initials = message.user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  const reactionGroups = useMemo(() => {
    const map = new Map<string, { emoji: string; count: number; users: string[] }>();
    for (const r of message.reactions) {
      const g = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, users: [] };
      g.count += 1;
      g.users.push(r.user.name);
      map.set(r.emoji, g);
    }
    return [...map.values()];
  }, [message.reactions]);

  const react = async (emoji: string) => {
    try {
      await messageService.addReaction(message.id, emoji);
      setShowEmoji(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  const unreact = async (emoji: string) => {
    try {
      await messageService.removeReaction(message.id, emoji);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  const remove = async () => {
    try {
      await messageService.delete(message.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div
      className={cn('group flex gap-3 rounded-md py-1', groupWithPrev && 'pl-12')}
      data-testid={`message-${message.id}`}
    >
      {!groupWithPrev ? (
        <Avatar className="mt-0.5 h-9 w-9 shrink-0">
          <AvatarImage src={message.user.avatarUrl ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-9 shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        {!groupWithPrev && (
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{message.user.name}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), 'MMM d, HH:mm')}
            </span>
          </div>
        )}
        <div className="text-sm leading-relaxed">
          {message.content}
          {message.fileUrl && (
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-xs text-primary underline"
              data-testid="message-file"
            >
              📎 {message.fileName}
            </a>
          )}
        </div>

        {reactionGroups.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {reactionGroups.map((g) => (
              <button
                key={g.emoji}
                onClick={() => unreact(g.emoji)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-xs hover:border-accent/40"
              >
                <span>{g.emoji}</span>
                <span>{g.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="relative opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1 shadow-sm">
          <button
            onClick={() => setShowEmoji((s) => !s)}
            className="rounded p-1 text-muted-foreground hover:bg-accent/10 hover:text-accent"
            data-testid={`react-toggle-${message.id}`}
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
          {isOwn && (
            <button
              onClick={remove}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              data-testid={`delete-${message.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {showEmoji && (
          <div className="absolute right-0 top-8 z-10 flex gap-1 rounded-md border bg-card p-2 shadow-lg">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => react(e)}
                className="rounded p-1 text-lg hover:bg-accent/10"
                data-testid={`emoji-${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
