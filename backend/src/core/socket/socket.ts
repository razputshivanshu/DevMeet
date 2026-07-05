import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { verifyJwt } from '../utils/jwt';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';

export interface AuthedSocket extends Socket {
  data: {
    userId: string;
    email: string;
  };
}

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    transports: ['websocket', 'polling'],
  });

  // JWT auth middleware on socket handshake
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : undefined);

      if (!token) return next(new Error('Missing auth token'));
      const payload = verifyJwt(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, isActive: true },
      });
      if (!user || !user.isActive) return next(new Error('Invalid user'));
      (socket as AuthedSocket).data.userId = user.id;
      (socket as AuthedSocket).data.email = user.email;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const s = socket as AuthedSocket;
    // Join a private room per user for direct notifications
    s.join(`user:${s.data.userId}`);
    // Update last seen
    prisma.user
      .update({ where: { id: s.data.userId }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);

    s.on('channel:join', (channelId: string) => {
      if (typeof channelId === 'string') s.join(`channel:${channelId}`);
    });
    s.on('channel:leave', (channelId: string) => {
      if (typeof channelId === 'string') s.leave(`channel:${channelId}`);
    });

    s.on('typing:start', (channelId: string) => {
      if (typeof channelId === 'string') {
        s.to(`channel:${channelId}`).emit('typing:start', { channelId, userId: s.data.userId });
      }
    });
    s.on('typing:stop', (channelId: string) => {
      if (typeof channelId === 'string') {
        s.to(`channel:${channelId}`).emit('typing:stop', { channelId, userId: s.data.userId });
      }
    });

    // Meeting room signalling (WebRTC handshake pass-through)
    s.on('meeting:join', (roomCode: string) => {
      if (typeof roomCode !== 'string') return;
      s.join(`meeting:${roomCode}`);
      s.to(`meeting:${roomCode}`).emit('meeting:peer-joined', {
        userId: s.data.userId,
        socketId: s.id,
      });
    });
    s.on('meeting:leave', (roomCode: string) => {
      if (typeof roomCode !== 'string') return;
      s.to(`meeting:${roomCode}`).emit('meeting:peer-left', {
        userId: s.data.userId,
        socketId: s.id,
      });
      s.leave(`meeting:${roomCode}`);
    });
    s.on('meeting:signal', (payload: { to: string; signal: unknown; roomCode: string }) => {
      if (!payload?.to) return;
      s.to(payload.to).emit('meeting:signal', {
        from: s.id,
        userId: s.data.userId,
        signal: payload.signal,
        roomCode: payload.roomCode,
      });
    });

    s.on('disconnect', () => {
      prisma.user
        .update({ where: { id: s.data.userId }, data: { lastSeenAt: new Date() } })
        .catch(() => undefined);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
