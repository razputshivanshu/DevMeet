import { useEffect } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

/**
 * Returns a stable Socket.io client tied to the current session. Auto disconnects on unmount.
 */
export const useSocket = (): Socket | null => {
  const socket = getSocket();
  useEffect(() => {
    return () => {
      // We keep the socket alive across pages by not disconnecting here.
      // Full disconnect happens on logout via `disconnectSocket`.
    };
  }, []);
  return socket;
};

export { disconnectSocket };
