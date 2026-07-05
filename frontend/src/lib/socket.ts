import { io, type Socket } from 'socket.io-client';
import { env } from './env';
import { getToken } from './api';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (socket && socket.connected) return socket;
  socket = io(env.SOCKET_URL, {
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
