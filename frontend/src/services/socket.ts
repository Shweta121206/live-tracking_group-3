import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const connectSocket = (): Socket => {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
  });
  return socket;
};

export const subscribeVessels = (): void => {
  if (!socket) return;
  socket.emit('subscribe:vessels');
};

export const onVesselPositionUpdated = (cb: (data: any) => void): void => {
  if (!socket) return;
  socket.on('vessel:position:updated', cb);
};

export const disconnectSocket = (): void => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};
