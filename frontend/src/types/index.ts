export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type TeamRole = 'LEAD' | 'MEMBER';
export type ChannelType = 'PUBLIC' | 'PRIVATE' | 'DIRECT';
export type MessageType = 'TEXT' | 'FILE' | 'SYSTEM';
export type KanbanStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type MeetingStatus = 'SCHEDULED' | 'LIVE' | 'ENDED';
export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  provider: AuthProvider;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  myRole?: OrgRole;
  _count?: { members: number; teams: number; channels: number };
}

export interface PendingInvite {
  id: string;
  email: string;
  role: OrgRole;
  token: string;
  organizationId: string;
  expiresAt: string;
  createdAt: string;
  organization: Pick<Organization, 'id' | 'name' | 'slug'>;
  invitedBy?: Pick<User, 'id' | 'name' | 'email' | 'username'>;
}

export interface OrgMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
  user: Pick<User, 'id' | 'email' | 'username' | 'name' | 'avatarUrl'> & {
    lastSeenAt: string | null;
  };
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
  organization?: { id: string; name: string; slug: string };
  myRole?: TeamRole | null;
  isMember?: boolean;
  _count?: { members: number; channels: number; kanbanBoards?: number };
}

export interface Channel {
  id: string;
  organizationId: string;
  teamId: string | null;
  name: string;
  topic: string | null;
  type: ChannelType;
  createdById: string;
  createdAt: string;
  team?: { id: string; name: string } | null;
  isMember?: boolean;
  _count?: { members: number; messages: number };
}

export interface Reaction {
  id: string;
  userId: string;
  emoji: string;
  user: { id: string; username: string; name: string };
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: MessageType;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  user: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl'>;
  reactions: Reaction[];
}

export interface Meeting {
  id: string;
  organizationId: string;
  roomCode: string;
  title: string;
  status: MeetingStatus;
  createdById: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  createdBy?: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl'>;
  participants?: Array<{
    id: string;
    joinedAt: string;
    leftAt: string | null;
    user: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl'>;
  }>;
  _count?: { participants: number };
}

export interface KanbanBoard {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  createdAt: string;
  cards?: KanbanCard[];
  team?: { id: string; name: string; organizationId: string };
  _count?: { cards: number };
}

export interface KanbanCard {
  id: string;
  boardId: string;
  title: string;
  description: string | null;
  status: KanbanStatus;
  position: number;
  assigneeId: string | null;
  createdById: string;
  dueDate: string | null;
  createdAt: string;
  assignee?: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl'> | null;
  createdBy?: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl'>;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: unknown };
}
